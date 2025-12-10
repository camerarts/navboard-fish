
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Settings, User, LogOut, FolderPlus, Check, Compass, ChevronRight, ChevronLeft, Sun, Moon, Zap, X, Edit2, Cloud, RefreshCw } from 'lucide-react';
import SearchBar from './components/SearchBar';
import CategoryGroup from './components/CategoryGroup';
import BookmarkModal from './components/BookmarkModal';
import CategoryModal from './components/CategoryModal';
import LoginModal from './components/LoginModal';
import SiteConfigModal from './components/SiteConfigModal';
import DashboardWidgets from './components/DashboardWidgets';
// Import last to ensure no circular dependency issues
import FishBackground from './components/FishBackground';
import { Bookmark, Category } from './types';
import { INITIAL_BOOKMARKS, INITIAL_CATEGORIES, CATEGORY_ICONS } from './constants';

type ThemeType = 'light' | 'dark' | 'cyberpunk';
type SyncState = 'idle' | 'syncing' | 'saved' | 'error';

const App: React.FC = () => {
  // --- State ---
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(INITIAL_BOOKMARKS);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionPassword, setSessionPassword] = useState(''); // Store validated password for KV writes
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // UI State
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSiteConfigModalOpen, setIsSiteConfigModalOpen] = useState(false);
  
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<ThemeType>('light');
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Drag State
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);

  // App Config State
  const [appName, setAppName] = useState('FlatNav');
  const [appFontSize, setAppFontSize] = useState('text-xl');
  const [appSubtitle, setAppSubtitle] = useState('Dashboard');
  
  // Logo State
  const [logoError, setLogoError] = useState(false);

  // Cloudflare KV Sync State
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const isFirstLoad = useRef(true);
  const mainRef = useRef<HTMLElement>(null);

  // --- Helper: Local Storage Fallback ---
  const loadFromLocalStorage = () => {
      try {
        const localBookmarks = localStorage.getItem('flatnav_bookmarks');
        const localCategories = localStorage.getItem('flatnav_categories');
        const localConfig = localStorage.getItem('flatnav_config');
        
        if (localBookmarks) setBookmarks(JSON.parse(localBookmarks));
        if (localCategories) setCategories(JSON.parse(localCategories));
        if (localConfig) {
            const config = JSON.parse(localConfig);
            setAppName(config.appName || 'FlatNav');
            setAppSubtitle(config.appSubtitle || 'Dashboard');
            setAppFontSize(config.appFontSize || 'text-xl');
            setTheme(config.theme || 'light');
        }
      } catch (e) {
          console.error("Local storage load error", e);
      }
  };

  const saveToLocalStorage = (data: any) => {
      try {
        localStorage.setItem('flatnav_bookmarks', JSON.stringify(data.bookmarks));
        localStorage.setItem('flatnav_categories', JSON.stringify(data.categories));
        localStorage.setItem('flatnav_config', JSON.stringify(data.config));
      } catch (e) {
          console.error("Local storage save error", e);
      }
  };

  // --- API Functions ---

  const loadDataFromKV = async () => {
      setSyncState('syncing');
      try {
          const res = await fetch('/api/sync');
          
          // Check for 404 (Local Mode) silently
          if (res.status === 404) {
              // API endpoint doesn't exist, use local storage silently
              throw new Error("Local Mode (Endpoint not found)");
          }

          // Robust check: Ensure we got a JSON response before parsing
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
              const data = await res.json();
              if (!data.empty && data.bookmarks) {
                  setBookmarks(data.bookmarks);
                  setCategories(data.categories);
                  if (data.config) {
                      setAppName(data.config.appName || 'FlatNav');
                      setAppSubtitle(data.config.appSubtitle || 'Dashboard');
                      setAppFontSize(data.config.appFontSize || 'text-xl');
                      setTheme(data.config.theme || 'light');
                  }
                  console.log('已从 Cloudflare KV 加载最新数据');
                  setSyncState('idle');
                  setLastRefreshed(new Date().toLocaleTimeString());
                  // Update local cache
                  saveToLocalStorage({ bookmarks: data.bookmarks, categories: data.categories, config: data.config });
              } else {
                  console.log('KV 为空或返回空数据，尝试加载本地缓存');
                  loadFromLocalStorage();
                  setSyncState('idle');
                  setLastRefreshed(new Date().toLocaleTimeString() + ' (本地)');
              }
          } else {
              throw new Error(`Server returned ${res.status} or invalid content-type`);
          }
      } catch (error: any) {
          // Only warn if it's not a simple 404 (which is expected in static hosting)
          if (!error.message?.includes("Local Mode")) {
              console.warn('KV 连接失败，切换至本地模式:', error);
          }
          loadFromLocalStorage();
          setSyncState('error'); // Indicates "Local Mode"
          setLastRefreshed('本地模式');
      }
  };

  const saveDataToKV = async () => {
      const payload = {
          version: 2,
          updatedAt: new Date().toISOString(),
          bookmarks,
          categories,
          config: { appName, appSubtitle, appFontSize, theme }
      };

      // 1. Always save to local storage (Offline support & Cache)
      saveToLocalStorage(payload);

      // 2. Try to sync to Cloudflare KV
      if (!sessionPassword) {
          // If logged in but no password (e.g. forced state), can't save to cloud
          return;
      }

      setSyncState('syncing');
      try {
          const res = await fetch('/api/sync', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'x-auth-token': sessionPassword
              },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              setSyncState('saved');
              setLastRefreshed(new Date().toLocaleTimeString());
              setTimeout(() => setSyncState('idle'), 2000);
          } else {
              console.error('KV Save Failed:', res.status);
              setSyncState('error');
          }
      } catch (error) {
          // Prevent console spam if we are already in an error state (offline)
          if (syncState !== 'error') {
              console.error('KV Save Network Error:', error);
          }
          setSyncState('error');
      }
  };

  // --- Effects ---

  // 1. App Mount: Load data
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
    
    // Fallback: load theme immediately to avoid flash
    const storedTheme = localStorage.getItem('flatnav_theme') as ThemeType;
    if (storedTheme) setTheme(storedTheme); 

    // Try loading from Cloud, fallback to Local
    loadDataFromKV().then(() => {
        isFirstLoad.current = false;
    });
    
    // Attempt to restore session
    const savedPassword = localStorage.getItem('flatnav_session_pwd');
    if (savedPassword) {
        setSessionPassword(savedPassword);
        setIsAuthenticated(true);
    }
  }, []);

  // 2. Auto-Save
  useEffect(() => {
      if (isFirstLoad.current) return;

      const timer = setTimeout(() => {
          if (isAuthenticated && sessionPassword) {
             saveDataToKV();
          } else {
             // For non-admins, we still save to local storage so they don't lose temporary edits (if enabled)
             saveToLocalStorage({ bookmarks, categories, config: { appName, appSubtitle, appFontSize, theme } });
          }
      }, 2000);

      return () => clearTimeout(timer);
  }, [bookmarks, categories, appName, appSubtitle, appFontSize, theme, isAuthenticated, sessionPassword]);


  // Login Logic
  const handleLogin = async (password: string): Promise<{ success: boolean; message?: string }> => {
    const today = new Date().toLocaleDateString();
    let attempts = parseInt(localStorage.getItem('flatnav_login_attempts') || '0', 10);
    const lastAttemptDate = localStorage.getItem('flatnav_last_attempt_date');

    if (lastAttemptDate !== today) {
        attempts = 0;
        localStorage.setItem('flatnav_login_attempts', '0');
        localStorage.setItem('flatnav_last_attempt_date', today);
    }

    if (attempts >= 5) {
        return { success: false, message: '安全警告：今日尝试次数过多，请明日再试。' };
    }

    try {
        // Send a verify-only request to the backend
        const res = await fetch('/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': password
            },
            body: JSON.stringify({ verifyOnly: true })
        });

        if (res.ok) {
            setIsAuthenticated(true);
            setSessionPassword(password);
            localStorage.setItem('flatnav_login_attempts', '0');
            localStorage.setItem('flatnav_session_pwd', password);
            
            // Refresh data from cloud to ensure consistency
            loadDataFromKV();
            return { success: true };
        } else if (res.status === 401) {
            attempts += 1;
            localStorage.setItem('flatnav_login_attempts', attempts.toString());
            localStorage.setItem('flatnav_last_attempt_date', today);
            return { success: false, message: '密码错误' };
        } else {
            // If server exists but returns other error (500 etc)
            throw new Error(`Server status: ${res.status}`);
        }
    } catch (error) {
        console.warn("Login Network Error (Falling back to local check):", error);
        
        // --- FALLBACK MODE ---
        // If the server is unreachable (Failed to fetch), allow login if password matches default '1211'.
        // This enables local administration even if the backend is down or not configured locally.
        if (password === '1211') {
             setIsAuthenticated(true);
             setSessionPassword(password); 
             setSyncState('error'); // Explicitly mark sync as error so UI shows "Local Mode"
             return { success: true };
        }

        return { success: false, message: '无法连接服务器，且密码不匹配本地默认值' };
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsEditMode(false); 
    setSessionPassword('');
    localStorage.removeItem('flatnav_session_pwd');
  };

  // CRUD Handlers
  const handleSaveBookmark = (newBookmarkData: Partial<Bookmark>) => {
    if (editingBookmark) {
        setBookmarks(prev => prev.map(b => b.id === editingBookmark.id ? { ...b, ...newBookmarkData } as Bookmark : b));
    } else {
        const newBookmark: Bookmark = { ...newBookmarkData, id: Date.now().toString() } as Bookmark;
        setBookmarks(prev => [...prev, newBookmark]);
    }
    setEditingBookmark(null);
  };

  const handleDeleteBookmark = (id: string) => {
      setBookmarks(prev => prev.filter(b => b.id !== id));
  }

  const handleSaveCategory = (categoryData: { id?: string; name: string; color: string }) => {
      if (categoryData.id) {
          setCategories(prev => prev.map(c => c.id === categoryData.id ? { ...c, name: categoryData.name, color: categoryData.color } : c));
      } else if (editingCategory) {
          setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...categoryData, id: c.id } : c));
      } else {
          const newCategory: Category = { id: Date.now().toString(), name: categoryData.name, color: categoryData.color };
          setCategories(prev => [...prev, newCategory]);
      }
      setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
      setBookmarks(prev => prev.filter(b => b.categoryId !== id));
  };

  const handleSaveSiteConfig = (name: string, fontSize: string, subtitle: string) => {
      setAppName(name);
      setAppFontSize(fontSize);
      setAppSubtitle(subtitle);
  };

  const scrollToCategory = (categoryId: string) => {
      setActiveCategoryId(categoryId);
      const element = document.getElementById(`category-${categoryId}`);
      const container = mainRef.current;

      if (element && container) {
          // Changed from 100 to 24 since SearchBar is no longer sticky
          const offset = 24; 
          
          // Calculate target scroll position within the container
          const elementRect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const currentScrollTop = container.scrollTop;
          
          const targetTop = currentScrollTop + (elementRect.top - containerRect.top) - offset;
          
          container.scrollTo({ top: targetTop, behavior: 'smooth' });
      }

      if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
      }
  };

  const handleCategoryDragStart = (e: React.DragEvent, index: number) => {
      if (!isEditMode) return;
      setDraggedCategoryIndex(index);
      e.dataTransfer.setData('type', 'category');
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
      e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (!isEditMode) return;

      if (e.dataTransfer.getData('type') === 'category' && draggedCategoryIndex !== null) {
          if (draggedCategoryIndex !== dropIndex) {
              const newCategories = [...categories];
              const [movedCategory] = newCategories.splice(draggedCategoryIndex, 1);
              newCategories.splice(dropIndex, 0, movedCategory);
              setCategories(newCategories);
          }
          setDraggedCategoryIndex(null);
      }
  };

  const handleMoveBookmark = (draggedId: string, targetId: string) => {
      const newBookmarks = [...bookmarks];
      const draggedIndex = newBookmarks.findIndex(b => b.id === draggedId);
      const targetIndex = newBookmarks.findIndex(b => b.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const draggedItem = newBookmarks[draggedIndex];
      const targetItem = newBookmarks[targetIndex];

      if (draggedItem.categoryId !== targetItem.categoryId) {
          draggedItem.categoryId = targetItem.categoryId;
      }

      newBookmarks.splice(draggedIndex, 1);
      const newTargetIndex = newBookmarks.findIndex(b => b.id === targetId);
      newBookmarks.splice(newTargetIndex, 0, draggedItem);

      setBookmarks(newBookmarks);
  };

  const handleMoveBookmarkToCategory = (bookmarkId: string, categoryId: string) => {
      const newBookmarks = [...bookmarks];
      const draggedIndex = newBookmarks.findIndex(b => b.id === bookmarkId);
      
      if (draggedIndex === -1) return;
      
      const draggedItem = newBookmarks[draggedIndex];
      
      if (draggedItem.categoryId !== categoryId) {
          draggedItem.categoryId = categoryId;
          newBookmarks.splice(draggedIndex, 1);
          newBookmarks.push(draggedItem);
          setBookmarks(newBookmarks);
      }
  };

  const openAddBookmarkModal = () => {
    setEditingBookmark(null);
    setIsBookmarkModalOpen(true);
  };

  const openEditBookmarkModal = (bookmark: Bookmark) => {
      setEditingBookmark(bookmark);
      setIsBookmarkModalOpen(true);
  };

  const openAddCategoryModal = () => {
      setEditingCategory(null);
      setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: Category) => {
      setEditingCategory(category);
      setIsCategoryModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-bg)] overflow-hidden transition-colors duration-300 relative" data-theme={theme}>
      <style>{`
        :root {
            --bg-main: #f0f4f8;
            --bg-card: rgba(255, 255, 255, 0.75);
            --bg-subtle: rgba(241, 245, 249, 0.6);
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border-color: rgba(226, 232, 240, 0.6);
            --accent-color: #2563eb;
            --accent-bg: rgba(37, 99, 235, 0.1);
            --shadow-color: rgba(148, 163, 184, 0.15);
            --hover-bg: rgba(248, 250, 252, 0.8);
            --backdrop-blur: 20px;
        }
        [data-theme='dark'] {
            --bg-main: #0f172a;
            --bg-card: rgba(30, 41, 59, 0.7);
            --bg-subtle: rgba(51, 65, 85, 0.5);
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --border-color: rgba(51, 65, 85, 0.6);
            --accent-color: #60a5fa;
            --accent-bg: rgba(59, 130, 246, 0.15);
            --shadow-color: rgba(0, 0, 0, 0.4);
            --hover-bg: rgba(51, 65, 85, 0.6);
        }
        [data-theme='cyberpunk'] {
            --bg-main: #050505;
            --bg-card: rgba(18, 18, 18, 0.8);
            --bg-subtle: rgba(26, 26, 26, 0.7);
            --text-primary: #00ff9d;
            --text-secondary: #d946ef;
            --border-color: rgba(0, 255, 157, 0.3);
            --accent-color: #00ff9d;
            --accent-bg: rgba(0, 255, 157, 0.1);
            --shadow-color: rgba(0, 255, 157, 0.2);
            --hover-bg: rgba(26, 26, 26, 0.8);
            font-family: 'Courier New', monospace;
        }
      `}</style>

      {/* Background Layer: Fish Animation */}
      <FishBackground />

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
            fixed inset-y-0 left-0 z-50 h-full
            bg-[var(--bg-card)] border-r border-[var(--border-color)] backdrop-blur-xl
            flex flex-col shadow-2xl md:shadow-sm shrink-0
            transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] overflow-hidden
            ${isSidebarOpen ? 'translate-x-0 w-64 md:w-72 opacity-100' : '-translate-x-full w-64 md:w-0 md:translate-x-0 md:opacity-0 md:border-r-0'}
            md:relative md:translate-x-0
        `}
      >
          <div className="w-full h-full flex flex-col">
            {/* Brand */}
            <div className="h-24 flex items-center justify-between px-6 shrink-0 relative">
                <a 
                    href="/"
                    onClick={(e) => { e.preventDefault(); window.location.reload(); }}
                    className="group flex items-center gap-3 cursor-pointer select-none focus:outline-none"
                >
                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl shadow-lg transition-all duration-500 ease-out group-hover:scale-110 overflow-hidden ${logoError ? 'bg-slate-900 text-white shadow-slate-900/20 group-hover:bg-blue-600' : 'bg-white shadow-slate-200'}`}>
                        {logoError ? (
                            <Compass size={22} className="group-hover:rotate-45 transition-transform duration-500" />
                        ) : (
                            <img 
                                src="/favicon.ico" 
                                alt="Logo" 
                                className="w-6 h-6 object-contain"
                                onError={() => setLogoError(true)}
                            />
                        )}
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <span className={`${appFontSize} font-bold text-[var(--text-primary)] tracking-tight leading-none group-hover:text-blue-600 transition-all duration-300`}>
                                {appName}
                            </span>
                            {isAuthenticated && (
                                <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsSiteConfigModalOpen(true); }}
                                    className="text-[var(--text-secondary)] hover:text-blue-500 opacity-40 hover:opacity-100 p-1 rounded-md hover:bg-[var(--bg-subtle)] transition-all"
                                    title="修改标题"
                                >
                                    <Edit2 size={12} />
                                </button>
                            )}
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-widest leading-none mt-1.5">
                            {appSubtitle}
                        </span>
                    </div>
                </a>
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-hide">
                <div className="px-4 mt-6 mb-4">
                    <div className="flex items-center gap-3 group">
                         <span className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] group-hover:text-[var(--accent-color)] transition-colors">
                             分类导航
                         </span>
                         <div className="h-px bg-gradient-to-r from-[var(--border-color)] to-transparent flex-1"></div>
                    </div>
                </div>
                
                {categories.map(category => {
                    const Icon = CATEGORY_ICONS[category.name] || CATEGORY_ICONS['日常办公'];
                    const isActive = activeCategoryId === category.id;
                    return (
                        <button
                            key={category.id}
                            onClick={() => scrollToCategory(category.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                                isActive 
                                ? 'bg-[var(--accent-bg)] text-[var(--accent-color)] shadow-sm scale-[1.02]' 
                                : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] hover:scale-[1.02]'
                            }`}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <span className={`transition-colors duration-300 ${isActive ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:scale-110 transform'}`}>
                                    {Icon}
                                </span>
                                <span>{category.name}</span>
                            </div>
                            {isActive && <ChevronRight size={14} className="text-[var(--accent-color)]" />}
                        </button>
                    )
                })}

                {isAuthenticated && (
                    <button 
                        onClick={openAddCategoryModal}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:bg-[var(--accent-bg)] border border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] transition-all mt-4 group hover:scale-[1.02]"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        <span>添加分类</span>
                    </button>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-subtle)]/50 shrink-0 space-y-3 backdrop-blur-sm">
                
                {/* Theme Switcher */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--bg-main)]/80 rounded-xl border border-[var(--border-color)]">
                    <button 
                        onClick={() => setTheme('light')}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all hover:scale-105 ${theme === 'light' ? 'bg-[var(--bg-card)] shadow-sm text-blue-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        <Sun size={16} />
                    </button>
                    <button 
                        onClick={() => setTheme('dark')}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all hover:scale-105 ${theme === 'dark' ? 'bg-[var(--bg-card)] shadow-sm text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        <Moon size={16} />
                    </button>
                    <button 
                        onClick={() => setTheme('cyberpunk')}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all hover:scale-105 ${theme === 'cyberpunk' ? 'bg-[var(--bg-card)] shadow-sm text-[#00ff9d]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        <Zap size={16} />
                    </button>
                </div>

                {isAuthenticated && (
                    <button 
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
                            isEditMode 
                            ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/10' 
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]'
                        }`}
                    >
                        {isEditMode ? <Check size={16} /> : <Settings size={16} />}
                        <span>{isEditMode ? '完成编辑' : '布局设置'}</span>
                    </button>
                )}

                {/* User / Auth */}
                {isAuthenticated ? (
                     <div className="flex flex-col gap-2 p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative ${
                                syncState === 'error' ? 'bg-red-100 text-red-500' : 'bg-[var(--accent-bg)] text-[var(--accent-color)]'
                            }`}>
                                <User size={18} />
                                <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                                    syncState === 'error' ? 'bg-red-500' :
                                    syncState === 'syncing' ? 'bg-blue-500 animate-pulse' :
                                    syncState === 'saved' ? 'bg-green-500' : 'bg-green-500'
                                }`}>
                                    <Cloud size={8} className="text-white" fill="currentColor"/>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[var(--text-primary)] truncate">管理员</p>
                                <p className={`text-[10px] truncate ${syncState === 'error' ? 'text-red-500 font-medium' : 'text-[var(--text-secondary)]'}`}>
                                    {syncState === 'error' ? '本地模式 (未同步)' :
                                     syncState === 'syncing' ? '正在同步...' :
                                     syncState === 'saved' ? '已保存到云端' : 'KV 实时同步'}
                                </p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="退出登录"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>

                        <div className="pt-2 border-t border-[var(--border-color)] mt-1">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => loadDataFromKV()}
                                    className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-blue-600 transition-colors"
                                >
                                    <RefreshCw size={12} className={syncState === 'syncing' ? 'animate-spin' : ''} /> 刷新数据
                                </button>
                                {lastRefreshed && (
                                    <span className="text-[10px] text-[var(--text-secondary)] opacity-70 px-2" title="上次更新时间">
                                        {lastRefreshed}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsLoginModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all hover:scale-[1.02]"
                    >
                        <User size={18} />
                        <span>管理员登录</span>
                    </button>
                )}
            </div>
          </div>
      </aside>

      <main ref={mainRef} className="flex-1 h-full overflow-y-auto scroll-smooth relative z-10">
        <div className={`sticky top-8 z-40 h-0 overflow-visible transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] ${isSidebarOpen ? 'md:-left-3 -left-20' : 'left-4 md:left-6'}`}>
             <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-color)] p-2 rounded-full shadow-sm text-[var(--text-secondary)] hover:text-[var(--accent-color)] hover:shadow-md transition-all flex items-center justify-center hover:scale-110"
             >
                {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
             </button>
         </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 pb-32">
            <DashboardWidgets />
            <div className="mb-10 relative z-20">
                <SearchBar />
            </div>

            {isAuthenticated && (
                <div className="flex justify-end mb-6">
                     <button 
                        onClick={openAddBookmarkModal}
                        className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:scale-105"
                    >
                        <Plus size={16} strokeWidth={3} />
                        添加书签
                    </button>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {categories.map((category, index) => (
                    <div
                        key={category.id}
                        id={`category-${category.id}`}
                        draggable={isEditMode}
                        onDragStart={(e) => handleCategoryDragStart(e, index)}
                        onDragOver={handleCategoryDragOver}
                        onDrop={(e) => handleCategoryDrop(e, index)}
                        className={`transition-all duration-500 ease-out w-full scroll-mt-24 ${
                            isEditMode ? 'cursor-move ring-2 ring-blue-100 hover:ring-blue-300 rounded-2xl opacity-90' : ''
                        }`}
                    >
                        <CategoryGroup 
                            category={category} 
                            bookmarks={bookmarks.filter(b => b.categoryId === category.id)}
                            onEditBookmark={openEditBookmarkModal}
                            onDeleteBookmark={handleDeleteBookmark}
                            onEditCategory={openEditCategoryModal}
                            onDeleteCategory={handleDeleteCategory}
                            isEditMode={isEditMode}
                            isAuthenticated={isAuthenticated}
                            onMoveBookmark={handleMoveBookmark}
                            onMoveToCategory={handleMoveBookmarkToCategory}
                        />
                    </div>
                ))}

                {categories.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--bg-card)]/50 backdrop-blur-sm">
                        <FolderPlus size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
                        <h3 className="text-[var(--text-secondary)] font-medium">暂无分类</h3>
                        {isAuthenticated && (
                            <p className="text-[var(--text-secondary)] text-sm mt-2">点击左侧边栏“添加分类”开始使用</p>
                        )}
                    </div>
                )}
            </div>

            <footer className="mt-20 pt-8 border-t border-[var(--border-color)] text-center">
                <p className="text-[var(--text-secondary)] text-xs font-medium tracking-wide">&copy; {new Date().getFullYear()} {appName} Dashboard.</p>
            </footer>
        </div>
      </main>

      {/* Modals */}
      <BookmarkModal 
        isOpen={isBookmarkModalOpen} 
        onClose={() => setIsBookmarkModalOpen(false)} 
        onSave={handleSaveBookmark}
        onDelete={handleDeleteBookmark}
        categories={categories}
        initialData={editingBookmark}
      />
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory} 
        initialData={editingCategory}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
      <SiteConfigModal
        isOpen={isSiteConfigModalOpen}
        onClose={() => setIsSiteConfigModalOpen(false)}
        onSave={handleSaveSiteConfig}
        initialName={appName}
        initialFontSize={appFontSize}
        initialSubtitle={appSubtitle}
      />
    </div>
  );
};

export default App;
