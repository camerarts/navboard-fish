import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Compass,
  Edit2,
  Fish,
  FishOff,
  FolderPlus,
  LogOut,
  Moon,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  User,
  X,
  Zap,
} from 'lucide-react';
import { Bookmark, Category } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { Density, DENSITY_OPTIONS } from '../hooks/usePreferences';
import { cn } from '../lib/utils';

type ThemeType = 'light' | 'dark' | 'cyberpunk' | 'auto';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapse: () => void;
  categories: Category[];
  bookmarks: Bookmark[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  isAuthenticated: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onAddCategory: () => void;
  appName: string;
  appSubtitle: string;
  appFontSize: string;
  onOpenSiteConfig: () => void;
  theme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  density: Density;
  onDensityChange: (density: Density) => void;
  editMode: boolean;
  onToggleEditMode: () => void;
  syncState: string;
  lastRefreshed: string;
  onRefresh: () => void;
  showFish: boolean;
  onToggleFish: () => void;
  onOpenPalette: () => void;
  logoError: boolean;
  onLogoError: () => void;
  isFirstLoad: boolean;
}

const THEMES: { value: ThemeType; label: string; icon: React.ReactNode }[] = [
  { value: 'auto', label: '跟随系统', icon: <Monitor size={15} /> },
  { value: 'light', label: '浅色', icon: <Sun size={15} /> },
  { value: 'dark', label: '深色', icon: <Moon size={15} /> },
  { value: 'cyberpunk', label: '赛博', icon: <Zap size={15} /> },
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onCollapse,
  categories,
  bookmarks,
  activeCategoryId,
  onSelectCategory,
  isAuthenticated,
  onOpenLogin,
  onLogout,
  onAddCategory,
  appName,
  appSubtitle,
  appFontSize,
  onOpenSiteConfig,
  theme,
  onThemeChange,
  density,
  onDensityChange,
  editMode,
  onToggleEditMode,
  syncState,
  lastRefreshed,
  onRefresh,
  showFish,
  onToggleFish,
  onOpenPalette,
  logoError,
  onLogoError,
  isFirstLoad,
}) => {
  const [filter, setFilter] = useState('');

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const bookmark of bookmarks) {
      map.set(bookmark.categoryId, (map.get(bookmark.categoryId) || 0) + 1);
    }
    return map;
  }, [bookmarks]);

  const visibleCategories = useMemo(() => {
    const keyword = filter.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(keyword));
  }, [categories, filter]);

  const syncLabel =
    syncState === 'error'
      ? '本地模式（未同步）'
      : syncState === 'syncing'
        ? '正在同步…'
        : syncState === 'saved'
          ? '已保存到云端'
          : 'KV 实时同步';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-full w-[260px] shrink-0 flex-col border-r backdrop-blur-xl transition-transform duration-300 ease-smooth',
        'md:relative md:z-30 md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-r-0 md:opacity-0'
      )}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        boxShadow: isOpen ? '0 0 40px -20px var(--shadow-color)' : 'none',
      }}
      aria-label="侧边栏导航"
    >
      <div className="flex h-full w-[260px] flex-col overflow-hidden">
        {/* 品牌区 */}
        <div className="flex h-[76px] shrink-0 items-center gap-2.5 px-4">
          <button
            onClick={() => window.location.reload()}
            className="group flex min-w-0 items-center gap-2.5 text-left"
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105',
                logoError ? 'text-white' : 'bg-white'
              )}
              style={logoError ? { background: 'var(--accent-color)' } : undefined}
            >
              {logoError ? (
                <Compass size={19} className="transition-transform duration-500 group-hover:rotate-45" />
              ) : (
                <img
                  src="/favicon.ico"
                  alt=""
                  className="h-5 w-5 object-contain"
                  onError={onLogoError}
                />
              )}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1">
                <span
                  className={cn(appFontSize, 'truncate font-bold leading-none tracking-tight')}
                  style={{ color: 'var(--text-primary)' }}
                >
                  {appName}
                </span>
                {isAuthenticated && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSiteConfig();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onOpenSiteConfig();
                    }}
                    aria-label="修改站点名称"
                    className="rounded p-0.5 opacity-0 transition-opacity hover:bg-[var(--bg-subtle)] group-hover:opacity-60"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Edit2 size={11} />
                  </span>
                )}
              </span>
              <span
                className="mt-1 block truncate text-[9.5px] font-medium uppercase tracking-[0.18em]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {appSubtitle}
              </span>
            </span>
          </button>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-subtle)] md:hidden"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="关闭侧边栏"
          >
            <X size={18} />
          </button>
          <button
            onClick={onCollapse}
            className="ml-auto hidden rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-subtle)] md:block"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="收起侧边栏"
            title="收起侧边栏"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* 命令面板入口 */}
        <div className="px-3 pb-2">
          <button
            onClick={onOpenPalette}
            className="flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-[12px] transition-colors hover:border-[var(--accent-color)]"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-subtle)',
            }}
          >
            <Search size={13} />
            <span>快速查找</span>
            <kbd
              className="ml-auto rounded border px-1 py-0.5 text-[9px] font-bold"
              style={{ borderColor: 'var(--border-color)' }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* 分类列表 */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          <div className="mb-1.5 mt-2 flex items-center gap-2 px-1">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: 'var(--text-secondary)' }}
            >
              分类
            </span>
            <span
              className="rounded-full px-1.5 text-[9px] font-bold tabular-nums"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
            >
              {categories.length}
            </span>
            <span className="ml-auto">
              <button
                onClick={onAddCategory}
                className="rounded-md p-1 transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-color)]"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="新建分类"
                title="新建分类"
              >
                <Plus size={13} />
              </button>
            </span>
          </div>

          {categories.length > 6 && (
            <div className="relative mb-1.5">
              <Search
                size={12}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="筛选分类"
                aria-label="筛选分类"
                className="w-full rounded-lg border py-1.5 pl-7 pr-2 text-[11.5px] outline-none"
                style={{
                  background: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          <nav className="flex flex-col gap-0.5" aria-label="分类导航">
            {visibleCategories.map((category) => {
              const Icon = CATEGORY_ICONS[category.name] || CATEGORY_ICONS['日常办公'];
              const isActive = activeCategoryId === `category-${category.id}`;
              const count = counts.get(category.id) || 0;
              return (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] font-medium transition-all duration-200'
                  )}
                  style={{
                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                    color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                  }}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-[var(--accent-color)]' : 'opacity-70'
                    )}
                  >
                    {React.cloneElement(Icon as React.ReactElement<{ size?: number }>, { size: 14 })}
                  </span>
                  <span className="truncate">{category.name}</span>
                  <span
                    className="ml-auto rounded-full px-1.5 text-[9.5px] font-bold tabular-nums transition-opacity"
                    style={{
                      background: isActive ? 'transparent' : 'var(--bg-subtle)',
                      color: 'inherit',
                      opacity: isActive ? 0.9 : 0.6,
                    }}
                  >
                    {count}
                  </span>
                  {isActive && <ChevronRight size={12} className="shrink-0" />}
                </button>
              );
            })}

            {visibleCategories.length === 0 && (
              <p
                className="px-2 py-4 text-center text-[11px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                没有匹配的分类
              </p>
            )}
          </nav>

          {isFirstLoad && categories.length === 0 && (
            <div className="mt-2 space-y-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-8 rounded-xl" />
              ))}
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={onAddCategory}
              className="mt-2 flex w-full items-center gap-2 rounded-xl border border-dashed px-2.5 py-2 text-[12px] font-medium transition-colors hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <FolderPlus size={13} />
              添加分类
            </button>
          )}
        </div>

        {/* 底部设置区 */}
        <div
          className="shrink-0 space-y-2 border-t p-3 backdrop-blur-sm"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-subtle)' }}
        >
          {/* 视图密度 */}
          <div
            className="flex items-center gap-1 rounded-xl border p-0.5"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-main)' }}
            role="group"
            aria-label="视图密度"
          >
            {DENSITY_OPTIONS.map((option) => {
              const isActive = density === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onDensityChange(option.value)}
                  aria-pressed={isActive}
                  title={option.hint}
                  className="flex-1 rounded-lg py-1.5 text-[10.5px] font-semibold transition-all"
                  style={{
                    background: isActive ? 'var(--bg-elevated)' : 'transparent',
                    color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 1px 3px var(--shadow-color)' : 'none',
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* 主题 + 背景动画 */}
          <div className="flex items-center gap-1.5">
            <div
              className="flex flex-1 items-center gap-0.5 rounded-xl border p-0.5"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-main)' }}
              role="group"
              aria-label="主题"
            >
              {THEMES.map((item) => {
                const isActive = theme === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => onThemeChange(item.value)}
                    aria-pressed={isActive}
                    title={item.label}
                    aria-label={item.label}
                    className="flex flex-1 items-center justify-center rounded-lg py-1.5 transition-all"
                    style={{
                      background: isActive ? 'var(--bg-elevated)' : 'transparent',
                      color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                      boxShadow: isActive ? '0 1px 3px var(--shadow-color)' : 'none',
                    }}
                  >
                    {item.icon}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onToggleFish}
              aria-pressed={showFish}
              aria-label={showFish ? '关闭背景动画' : '开启背景动画'}
              title={showFish ? '关闭背景动画' : '开启背景动画'}
              className="rounded-xl border p-2 transition-colors"
              style={{
                borderColor: 'var(--border-color)',
                background: showFish ? 'var(--accent-bg)' : 'var(--bg-main)',
                color: showFish ? 'var(--accent-color)' : 'var(--text-secondary)',
              }}
            >
              {showFish ? <Fish size={14} /> : <FishOff size={14} />}
            </button>
          </div>

          {isAuthenticated && (
            <button
              onClick={onToggleEditMode}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition-all"
              style={{
                background: editMode ? 'var(--accent-color)' : 'var(--bg-elevated)',
                color: editMode ? 'var(--accent-contrast)' : 'var(--text-secondary)',
                border: `1px solid ${editMode ? 'transparent' : 'var(--border-color)'}`,
              }}
              aria-pressed={editMode}
            >
              {editMode ? <Check size={13} /> : <Settings size={13} />}
              {editMode ? '完成整理' : '整理分类'}
            </button>
          )}

          {isAuthenticated ? (
            <div
              className="rounded-xl border p-2"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-elevated)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background:
                      syncState === 'error' ? 'rgba(239,68,68,0.12)' : 'var(--accent-bg)',
                    color: syncState === 'error' ? 'var(--danger)' : 'var(--accent-color)',
                  }}
                >
                  <User size={14} />
                  <span
                    className={cn(
                      'absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2',
                      syncState === 'syncing' && 'animate-pulse'
                    )}
                    style={{
                      background:
                        syncState === 'error'
                          ? 'var(--danger)'
                          : syncState === 'syncing'
                            ? 'var(--accent-color)'
                            : 'var(--success)',
                      borderColor: 'var(--bg-elevated)',
                    }}
                  >
                    <Cloud size={6} color="#fff" fill="currentColor" />
                  </span>
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    管理员
                  </p>
                  <p
                    className="truncate text-[9.5px]"
                    style={{ color: syncState === 'error' ? 'var(--danger)' : 'var(--text-secondary)' }}
                  >
                    {syncLabel}
                  </p>
                </div>

                <button
                  onClick={onRefresh}
                  title="从云端刷新"
                  aria-label="从云端刷新"
                  className="rounded-md p-1 transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <RefreshCw size={12} className={syncState === 'syncing' ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={onLogout}
                  title="退出登录"
                  aria-label="退出登录"
                  className="rounded-md p-1 transition-colors hover:text-[var(--danger)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <LogOut size={12} />
                </button>
              </div>
              {lastRefreshed && (
                <p
                  className="mt-1 truncate text-[9px] tabular-nums"
                  style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
                >
                  更新于 {lastRefreshed}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--accent-color)', color: 'var(--accent-contrast)', boxShadow: '0 8px 20px -10px var(--accent-color)' }}
            >
              <User size={14} />
              管理员登录
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
