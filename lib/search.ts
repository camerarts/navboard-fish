import { Bookmark, Category } from '../types';
import { fuzzyScore } from './fuzzy';
import { getDomain } from './utils';

export interface SearchResult {
  bookmark: Bookmark;
  score: number;
  domain: string;
  categoryName: string;
}

/**
 * 本地书签检索：标题 > 域名 > 描述 > 分类名
 * 空查询返回空数组
 */
export const searchBookmarks = (
  query: string,
  bookmarks: Bookmark[],
  categories: Category[],
  limit = 8
): SearchResult[] => {
  const q = query.trim();
  if (!q) return [];

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const results: SearchResult[] = [];

  for (const bookmark of bookmarks) {
    const domain = getDomain(bookmark.url);
    const name = categoryName.get(bookmark.categoryId) || '';

    const score = Math.max(
      fuzzyScore(q, bookmark.title),
      fuzzyScore(q, domain) * 0.85,
      fuzzyScore(q, bookmark.description || '') * 0.55,
      fuzzyScore(q, name) * 0.45,
      fuzzyScore(q, bookmark.url) * 0.35
    );

    if (score >= 0) {
      results.push({ bookmark, score, domain, categoryName: name });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
};
