import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ChevronRight, GripVertical, Info, Plus } from 'lucide-react';

import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import CategoryGroup from './components/CategoryGroup';
import BookmarkModal from './components/BookmarkModal';
import CategoryModal from './components/CategoryModal';
import LoginModal from './components/LoginModal';
import SiteConfigModal from './components/SiteConfigModal';
import PreviewModal from './components/PreviewModal';
import CommandPalette from './components/CommandPalette';
import ContextMenu, { ContextMenuState } from './components/ContextMenu';
import ContentSkeleton from './components/ContentSkeleton';
import DashboardWidgets from './components/DashboardWidgets';
import BookmarkIcon from './components/BookmarkIcon';
import FishBackground from './components/FishBackground';

import { Bookmark, Category } from './types';
import { INITIAL_BOOKMARKS, INITIAL_CATEGORIES, SEARCH_ENGINES } from './constants';
import { ToastProvider, useToast } from './hooks/useToast';
import { useHotkeys } from './hooks/useHotkeys';
import { useScrollSpy } from './hooks/useScrollSpy';
import { useDensity, useFrecency } from './hooks/usePreferences';
import { cn, copyToClipboard, safeGetItem, safeSetItem } from './lib/utils';
import { readBootCache } from './lib/cache';

type ThemeType = 'light' | 'dark' | 'cyberpunk';
type SyncState = 'idle' | 'syncing' | 'saved' | 'error';

const ENGINE_KEY = 'flatnav_engine';

const AppShell: React.FC = () => {
  const { toast } = useToast();

  // 首帧就同步读取本地缓存：有缓存时直接渲染用户自己的数据，
  // 不再出现「先显示示例书签、2 秒后才变成真实数据」的闪跳
  const [boot] = useState(readBootCache);

  // --- 数据 ---
  const [categories, setCategories] = useState<Category[]>(
    () => boot.categories ?? INITIAL_CATEGORIES
  );
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(
    () => boot.bookmarks ?? INITIAL_BOOKMARKS
  );
  // 只有完全没有任何本地缓存（首次访问）时才需要骨架屏
  const [isLoading, setIsLoading] = useState<boolean>(() => !boot.bookmarks);

  // --- 登录 ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionPassword, setSessionPassword] = useState('');

  // --- 界面 ---
  const [theme, setTheme] = useState<ThemeType>(
    () => (boot.config?.theme as ThemeType) || (safeGetItem('flatnav_theme') as ThemeType) || 'light'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [previewBookmark, setPreviewBookmark] = useState<Bookmark | null>(null);
  const [engineId, setEngineId] = useState<string>(
    () => safeGetItem(ENGINE_KEY) || SEARCH_ENGINES[0].id
  );

  const { density, setDensity } = useDensity();
  const { pins, togglePin, recordVisit, visitScore } = useFrecency();

  // --- 弹窗 ---
  const [isBookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isSiteConfigOpen, setSiteConfigOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | undefined>(undefined);

  // --- 站点配置 ---
  const [appName, setAppName] = useState(() => boot.config?.appName || 'FlatNav');
  const [appSubtitle, setAppSubtitle] = useState(() => boot.config?.appSubtitle || 'Dashboard');
  const [appFontSize, setAppFontSize] = useState(() => boot.config?.appFontSize || 'text-xl');
  const [logoError, setLogoError] = useState(false);

  // --- 同步 ---
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastRefreshed, setLastRefreshed] = useState('');

  // --- 背景 ---
  const [showFish, setShowFish] = useState<boolean>(() => safeGetItem('flatnav_show_fish') !== 'false');

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [enableTilt] = useState(true);

  const hasLoadedRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  /* ================= 数据读写（行为与原逻辑保持一致） ================= */

  const loadFromLocalStorage = useCallback(() => {
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
    } catch (error) {
      console.error('本地数据读取失败', error);
    }
  }, []);

  const persistLocal = useCallback(
    (payload: { bookmarks: Bookmark[]; categories: Category[]; config: unknown }) => {
      try {
        localStorage.setItem('flatnav_bookmarks', JSON.stringify(payload.bookmarks));
        localStorage.setItem('flatnav_categories', JSON.stringify(payload.categories));
        localStorage.setItem('flatnav_config', JSON.stringify(payload.config));
      } catch (error) {
        console.error('本地数据保存失败', error);
      }
    },
    []
  );

  const loadDataFromKV = useCallback(async () => {
    setSyncState('syncing');
    try {
      const res = await fetch('/api/sync');
      if (res.status === 404) throw new Error('Local Mode (Endpoint not found)');

      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
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
          setSyncState('idle');
          setLastRefreshed(new Date().toLocaleTimeString());
          persistLocal({ bookmarks: data.bookmarks, categories: data.categories, config: data.config });
        } else {
          loadFromLocalStorage();
          setSyncState('idle');
          setLastRefreshed(new Date().toLocaleTimeString() + '（本地）');
        }
      } else {
        throw new Error(`服务返回 ${res.status}`);
      }
    } catch (error) {
      if (!(error as Error).message?.includes('Local Mode')) {
        console.warn('KV 连接失败，切换到本地模式', error);
      }
      loadFromLocalStorage();
      setSyncState('error');
      setLastRefreshed('本地模式');
    }
  }, [loadFromLocalStorage, persistLocal]);

  const saveDataToKV = useCallback(async () => {
    const payload = {
      version: 2,
      updatedAt: new Date().toISOString(),
      bookmarks,
      categories,
      config: { appName, appSubtitle, appFontSize, theme },
    };

    persistLocal(payload);
    if (!sessionPassword) return;

    setSyncState('syncing');
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': sessionPassword },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSyncState('saved');
        setLastRefreshed(new Date().toLocaleTimeString());
        window.setTimeout(() => setSyncState('idle'), 2000);
      } else {
        setSyncState('error');
      }
    } catch {
      setSyncState('error');
    }
  }, [bookmarks, categories, appName, appSubtitle, appFontSize, theme, sessionPassword, persistLocal]);

  /* ================= 初始化 ================= */

  useEffect(() => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    const savedPassword = safeGetItem('flatnav_session_pwd');
    if (savedPassword) {
      setSessionPassword(savedPassword);
      setIsAuthenticated(true);
    }

    loadDataFromKV().finally(() => {
      hasLoadedRef.current = true;
      setIsLoading(false);
    });
  }, [loadDataFromKV]);

  // 防抖保存
  useEffect(() => {
    const timer = window.setTimeout(() => {
      // 本地缓存随时可写（离线也不丢改动）；云端只在首次加载完成后才写，避免旧数据覆盖新数据
      if (hasLoadedRef.current && isAuthenticated && sessionPassword) {
        saveDataToKV();
      } else {
        persistLocal({ bookmarks, categories, config: { appName, appSubtitle, appFontSize, theme } });
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [
    bookmarks,
    categories,
    appName,
    appSubtitle,
    appFontSize,
    theme,
    isAuthenticated,
    sessionPassword,
    saveDataToKV,
    persistLocal,
  ]);

  useEffect(() => {
    safeSetItem('flatnav_show_fish', String(showFish));
  }, [showFish]);

  useEffect(() => {
    safeSetItem('flatnav_theme', theme);
    safeSetItem(ENGINE_KEY, engineId);
  }, [theme, engineId]);

  /* ================= 登录 ================= */

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
      return { success: false, message: '今日尝试次数过多，请明天再试' };
    }

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': password },
        body: JSON.stringify({ verifyOnly: true }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        setSessionPassword(password);
        localStorage.setItem('flatnav_login_attempts', '0');
        safeSetItem('flatnav_session_pwd', password);
        loadDataFromKV();
        toast({ message: '登录成功，可以开始整理书签了', kind: 'success' });
        return { success: true };
      }

      if (res.status === 401) {
        attempts += 1;
        localStorage.setItem('flatnav_login_attempts', attempts.toString());
        localStorage.setItem('flatnav_last_attempt_date', today);
        return { success: false, message: `密码错误，今天还剩 ${Math.max(0, 5 - attempts)} 次机会` };
      }

      throw new Error(`服务返回 ${res.status}`);
    } catch {
      if (password === '1211') {
        setIsAuthenticated(true);
        setSessionPassword(password);
        setSyncState('error');
        toast({ message: '本地模式登录成功，数据只保存在这台设备', kind: 'info' });
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
    toast({ message: '已退出登录', kind: 'info' });
  };

  /* ================= 增删改 ================= */

  const openAddBookmark = (categoryId?: string) => {
    setEditingBookmark(null);
    setDefaultCategoryId(categoryId);
    setBookmarkModalOpen(true);
  };

  const openEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setDefaultCategoryId(undefined);
    setBookmarkModalOpen(true);
  };

  const saveBookmark = (data: Partial<Bookmark>) => {
    if (editingBookmark) {
      setBookmarks((prev) =>
        prev.map((item) => (item.id === editingBookmark.id ? ({ ...item, ...data } as Bookmark) : item))
      );
      toast({ message: '已保存修改', kind: 'success' });
    } else {
      const created = { ...data, id: Date.now().toString() } as Bookmark;
      setBookmarks((prev) => [...prev, created]);
      toast({ message: `已添加「${created.title}」`, kind: 'success' });
    }
    setEditingBookmark(null);
  };

  const deleteBookmark = (bookmark: Bookmark) => {
    const snapshot = bookmarks;
    setBookmarks((prev) => prev.filter((item) => item.id !== bookmark.id));
    toast({
      message: `已删除「${bookmark.title}」`,
      kind: 'info',
      actionLabel: '撤销',
      onAction: () => {
        setBookmarks(snapshot);
        toast({ message: '已恢复', kind: 'success' });
      },
    });
  };

  const saveCategory = (data: { id?: string; name: string; color: string }) => {
    if (data.id) {
      setCategories((prev) =>
        prev.map((item) => (item.id === data.id ? { ...item, name: data.name, color: data.color } : item))
      );
      toast({ message: '分类已更新', kind: 'success' });
    } else {
      const created: Category = { id: Date.now().toString(), name: data.name, color: data.color };
      setCategories((prev) => [...prev, created]);
      toast({ message: `已新建分类「${created.name}」`, kind: 'success' });
    }
    setEditingCategory(null);
  };

  const deleteCategory = (id: string) => {
    const target = categories.find((item) => item.id === id);
    const snapshot = { categories, bookmarks };
    const affected = bookmarks.filter((item) => item.categoryId === id).length;
    setCategories((prev) => prev.filter((item) => item.id !== id));
    setBookmarks((prev) => prev.filter((item) => item.categoryId !== id));
    toast({
      message: `已删除分类「${target?.name || ''}」${affected ? `及其中 ${affected} 个书签` : ''}`,
      kind: 'info',
      actionLabel: '撤销',
      onAction: () => {
        setCategories(snapshot.categories);
        setBookmarks(snapshot.bookmarks);
        toast({ message: '已恢复', kind: 'success' });
      },
    });
  };

  const togglePinBookmark = (bookmark: Bookmark) => {
    const willPin = !pins.has(bookmark.id);
    togglePin(bookmark.id);

    if (!willPin) {
      toast({ message: `已取消置顶「${bookmark.title}」`, kind: 'info' });
      return;
    }

    // 置顶 = 把书签移到本分类最前面（等同于手动拖到最前，不改数据结构）
    setBookmarks((prev) => {
      const target = prev.find((item) => item.id === bookmark.id);
      if (!target) return prev;
      const rest = prev.filter((item) => item.id !== bookmark.id);
      const insertAt = rest.findIndex((item) => item.categoryId === target.categoryId);
      const next = [...rest];
      if (insertAt < 0) next.push(target);
      else next.splice(insertAt, 0, target);
      return next;
    });
    toast({ message: `已置顶「${bookmark.title}」`, kind: 'success' });
  };

  /* ================= 打开书签 ================= */

  const recordOpen = (bookmark: Bookmark) => {
    recordVisit(bookmark.id);
  };

  const openBookmark = (bookmark: Bookmark, mode: 'newtab' | 'sametab' = 'newtab') => {
    recordVisit(bookmark.id);
    if (mode === 'newtab') {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = bookmark.url;
    }
  };

  const handleContextMenu = (
    event: React.MouseEvent | MouseEvent,
    bookmark: Bookmark
  ) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, bookmark });
  };

  const handleCopyLink = async (bookmark: Bookmark) => {
    const ok = await copyToClipboard(bookmark.url);
    toast({
      message: ok ? '链接已复制' : '复制失败，请手动复制',
      kind: ok ? 'success' : 'error',
    });
  };

  /* ================= 拖拽 ================= */

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const canDragBookmarks = isAuthenticated && !isEditMode;

  const resolveCategoryId = useCallback(
    (overId: string): string | null => {
      if (overId.startsWith('container:')) return overId.slice('container:'.length);
      if (overId.startsWith('category:')) return overId.slice('category:'.length);
      return bookmarks.find((item) => item.id === overId)?.categoryId ?? null;
    },
    [bookmarks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setContextMenu(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    if (activeId.startsWith('category:')) return;

    const dragged = bookmarks.find((item) => item.id === activeId);
    if (!dragged) return;

    const targetCategoryId = resolveCategoryId(String(over.id));
    if (!targetCategoryId || targetCategoryId === dragged.categoryId) return;

    setBookmarks((prev) =>
      prev.map((item) => (item.id === activeId ? { ...item, categoryId: targetCategoryId } : item))
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 分类排序
    if (activeId.startsWith('category:')) {
      const draggedCategoryId = activeId.slice('category:'.length);
      const targetCategoryId = resolveCategoryId(overId);
      const from = categories.findIndex((item) => item.id === draggedCategoryId);
      const to = targetCategoryId
        ? categories.findIndex((item) => item.id === targetCategoryId)
        : -1;
      if (from >= 0 && to >= 0 && from !== to) {
        setCategories((prev) => arrayMove(prev, from, to));
        toast({ message: '分类顺序已更新', kind: 'success' });
      }
      return;
    }

    // 书签排序
    if (!overId.startsWith('category:') && !overId.startsWith('container:')) {
      const from = bookmarks.findIndex((item) => item.id === activeId);
      const to = bookmarks.findIndex((item) => item.id === overId);
      if (from >= 0 && to >= 0 && from !== to) {
        setBookmarks((prev) => arrayMove(prev, from, to));
      }
    }
  };

  const activeDragBookmark = useMemo(
    () => bookmarks.find((item) => item.id === activeDragId) || null,
    [activeDragId, bookmarks]
  );

  /* ================= 滚动联动 ================= */

  const sectionIds = useMemo(() => categories.map((item) => `category-${item.id}`), [categories]);
  const activeSectionId = useScrollSpy(sectionIds, mainRef, 150);

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    const container = mainRef.current;
    if (element && container) {
      const top =
        container.scrollTop +
        (element.getBoundingClientRect().top - container.getBoundingClientRect().top) -
        10;
      container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  /* ================= 快捷键 ================= */

  const openNthBookmark = (index: number) => {
    const categoryId = activeSectionId?.replace('category-', '');
    const pool = categoryId
      ? bookmarks.filter((item) => item.categoryId === categoryId)
      : bookmarks;
    const target = pool[index];
    if (target) openBookmark(target);
  };

  const hotkeys = useMemo(() => {
    const map: Record<string, () => void> = {
      'mod+k': () => setIsPaletteOpen((prev) => !prev),
      '/': () => window.dispatchEvent(new Event('nav:focus-search')),
      escape: () => {
        setIsPaletteOpen(false);
        setContextMenu(null);
      },
    };
    for (let i = 1; i <= 9; i++) {
      map[String(i)] = () => openNthBookmark(i - 1);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSectionId, bookmarks]);

  useHotkeys(hotkeys);

  /* ================= 渲染 ================= */

  const bookmarksByCategory = useMemo(() => {
    const map = new Map<string, Bookmark[]>();
    for (const category of categories) map.set(category.id, []);
    for (const bookmark of bookmarks) {
      const list = map.get(bookmark.categoryId);
      if (list) list.push(bookmark);
      else map.set(bookmark.categoryId, [bookmark]);
    }
    return map;
  }, [categories, bookmarks]);

  const totalBookmarks = bookmarks.length;

  return (
    <div
      className="relative flex h-[100dvh] overflow-hidden font-sans transition-colors duration-300"
      data-theme={theme}
      style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}
    >
      {showFish && <FishBackground />}

      {/* 移动端遮罩 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCollapse={() => setIsSidebarOpen(false)}
        categories={categories}
        bookmarks={bookmarks}
        activeCategoryId={activeSectionId}
        onSelectCategory={scrollToCategory}
        isAuthenticated={isAuthenticated}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        onAddCategory={() => {
          setEditingCategory(null);
          setCategoryModalOpen(true);
        }}
        appName={appName}
        appSubtitle={appSubtitle}
        appFontSize={appFontSize}
        onOpenSiteConfig={() => setSiteConfigOpen(true)}
        theme={theme}
        onThemeChange={setTheme}
        density={density}
        onDensityChange={setDensity}
        editMode={isEditMode}
        onToggleEditMode={() => setIsEditMode((prev) => !prev)}
        syncState={syncState}
        lastRefreshed={lastRefreshed}
        onRefresh={() => loadDataFromKV()}
        showFish={showFish}
        onToggleFish={() => setShowFish((prev) => !prev)}
        onOpenPalette={() => setIsPaletteOpen(true)}
        logoError={logoError}
        onLogoError={() => setLogoError(true)}
        isFirstLoad={isLoading}
      />

      {/* 侧栏收起后的展开入口 */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-3 top-4 z-40 flex items-center gap-1 rounded-xl border px-2 py-2 shadow-sm backdrop-blur-md transition-transform hover:translate-x-0.5"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
          aria-label="展开侧边栏"
          title="展开侧边栏"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <main ref={mainRef} className="relative z-10 min-w-0 flex-1 overflow-y-auto scroll-smooth">
        {/* 同步进度条 */}
        <div
          className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[2px] overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: syncState === 'syncing' ? '100%' : '0%',
              background: 'var(--accent-color)',
              opacity: syncState === 'syncing' ? 1 : 0,
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-[1400px] px-3 py-6 pb-24 sm:px-6 lg:px-8">
          {isLoading ? (
            <ContentSkeleton />
          ) : (
            <>
              <DashboardWidgets />

              <SearchBar
                engines={SEARCH_ENGINES}
                engineId={engineId}
                onEngineChange={setEngineId}
                onOpenPalette={() => setIsPaletteOpen(true)}
              />

              {/* 工具栏 */}
              <div className="mb-3 flex items-center gap-2">
                <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {categories.length} 个分类 · {totalBookmarks} 个书签
                </p>

                {isEditMode && (
                  <span
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-medium"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent-color)' }}
                  >
                    <Info size={11} />
                    整理中：拖动分类标题可调整顺序
                  </span>
                )}

                {isAuthenticated && (
                  <button
                    onClick={() => openAddBookmark()}
                    className="ml-auto flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                    style={{ background: 'var(--accent-color)', color: 'var(--accent-contrast)' }}
                  >
                    <Plus size={13} strokeWidth={3} />
                    添加书签
                  </button>
                )}
              </div>

              {/* 分类列表 */}
              {categories.length === 0 ? (
                <div
                  className="rounded-2xl border-2 border-dashed py-16 text-center"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    还没有分类
                  </p>
                  {isAuthenticated && (
                    <button
                      onClick={() => setCategoryModalOpen(true)}
                      className="mt-3 rounded-lg px-3 py-1.5 text-[12px] font-semibold"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent-color)' }}
                    >
                      创建第一个分类
                    </button>
                  )}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => setActiveDragId(null)}
                >
                  <SortableContext
                    items={categories.map((item) => `category:${item.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-3">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          id={`category-${category.id}`}
                          className="scroll-mt-2"
                        >
                          <CategoryGroup
                            category={category}
                            bookmarks={bookmarksByCategory.get(category.id) || []}
                            density={density}
                            editMode={isEditMode}
                            isAuthenticated={isAuthenticated}
                            canDragBookmarks={canDragBookmarks}
                            pins={pins}
                            enableTilt={enableTilt}
                            onEditCategory={(target) => {
                              setEditingCategory(target);
                              setCategoryModalOpen(true);
                            }}
                            onDeleteCategory={(target) => deleteCategory(target.id)}
                            onAddBookmark={openAddBookmark}
                            onEditBookmark={openEditBookmark}
                            onDeleteBookmark={deleteBookmark}
                            onContextMenu={handleContextMenu}
                            onMoreActions={(bookmark, anchor) =>
                              setContextMenu({
                                x: anchor.left,
                                y: anchor.bottom + 6,
                                bookmark,
                              })
                            }
                            onBeforeOpen={recordOpen}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>

                  <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
                    {activeDragBookmark ? (
                      <div
                        className="flex items-center gap-2 rounded-xl border px-2.5 py-2 shadow-xl"
                        style={{
                          background: 'var(--bg-elevated)',
                          borderColor: 'var(--accent-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <BookmarkIcon
                          url={activeDragBookmark.url}
                          title={activeDragBookmark.title}
                          className="h-7 w-7 rounded-md"
                        />
                        <span className="max-w-[160px] truncate text-[12.5px] font-semibold">
                          {activeDragBookmark.title}
                        </span>
                        <GripVertical size={13} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}

              <footer
                className="mt-14 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t pt-6 text-[10.5px]"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <span>
                  &copy; {new Date().getFullYear()} {appName}
                </span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1">
                  按 <kbd className="rounded border px-1" style={{ borderColor: 'var(--border-color)' }}>⌘K</kbd>
                  搜索书签
                </span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1">
                  按 <kbd className="rounded border px-1" style={{ borderColor: 'var(--border-color)' }}>/</kbd>
                  聚焦搜索框
                </span>
                <span className="opacity-40">·</span>
                <span>1–9 直接打开当前分类的前 9 个</span>
              </footer>
            </>
          )}
        </div>
      </main>

      {/* 弹层 */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        bookmarks={bookmarks}
        categories={categories}
        engines={SEARCH_ENGINES}
        engineId={engineId}
        canManage={isAuthenticated}
        visitScore={visitScore}
        onOpenBookmark={openBookmark}
        onJumpCategory={scrollToCategory}
        onAddBookmark={() => openAddBookmark()}
        onAddCategory={() => {
          setEditingCategory(null);
          setCategoryModalOpen(true);
        }}
      />

      <ContextMenu
        state={contextMenu}
        isPinned={contextMenu ? pins.has(contextMenu.bookmark.id) : false}
        canManage={isAuthenticated}
        onClose={() => setContextMenu(null)}
        onOpen={openBookmark}
        onPreview={(bookmark) => setPreviewBookmark(bookmark)}
        onCopy={handleCopyLink}
        onEdit={openEditBookmark}
        onTogglePin={togglePinBookmark}
        onDelete={deleteBookmark}
      />

      <PreviewModal bookmark={previewBookmark} onClose={() => setPreviewBookmark(null)} />

      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setBookmarkModalOpen(false)}
        onSave={saveBookmark}
        onDelete={deleteBookmark}
        categories={categories}
        initialData={editingBookmark}
        defaultCategoryId={defaultCategoryId}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={saveCategory}
        onDelete={deleteCategory}
        initialData={editingCategory}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      <SiteConfigModal
        isOpen={isSiteConfigOpen}
        onClose={() => setSiteConfigOpen(false)}
        onSave={(name, fontSize, subtitle) => {
          setAppName(name);
          setAppFontSize(fontSize);
          setAppSubtitle(subtitle);
          toast({ message: '站点信息已保存', kind: 'success' });
        }}
        initialName={appName}
        initialFontSize={appFontSize}
        initialSubtitle={appSubtitle}
      />
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppShell />
  </ToastProvider>
);

export default App;
