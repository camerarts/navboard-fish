import { Bookmark, Category } from '../types';

export interface CachedConfig {
  appName?: string;
  appSubtitle?: string;
  appFontSize?: string;
  theme?: 'light' | 'dark' | 'cyberpunk';
}

export interface BootCache {
  bookmarks?: Bookmark[];
  categories?: Category[];
  config?: CachedConfig;
}

const readJSON = <T,>(key: string): T | undefined => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
};

/**
 * 同步读取本地缓存，供首帧直接渲染用户数据，避免「先闪一下示例书签」。
 * 读不到（首次访问 / 换了设备）时返回 undefined，由调用方回退到骨架屏。
 */
export const readBootCache = (): BootCache => {
  const bookmarks = readJSON<Bookmark[]>('flatnav_bookmarks');
  const categories = readJSON<Category[]>('flatnav_categories');
  const config = readJSON<CachedConfig>('flatnav_config');

  return {
    bookmarks: Array.isArray(bookmarks) ? bookmarks : undefined,
    categories: Array.isArray(categories) ? categories : undefined,
    config: config && typeof config === 'object' ? config : undefined,
  };
};
