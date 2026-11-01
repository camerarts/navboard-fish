import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CornerDownLeft, Globe, Hash, Plus, Search } from 'lucide-react';
import { Bookmark, Category, SearchEngine } from '../types';
import { searchBookmarks } from '../lib/search';
import { fuzzyScore } from '../lib/fuzzy';
import { getDomain } from '../lib/utils';
import BookmarkIcon from './BookmarkIcon';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  categories: Category[];
  engines: SearchEngine[];
  engineId: string;
  canManage: boolean;
  visitScore: (id: string) => number;
  onOpenBookmark: (bookmark: Bookmark) => void;
  onJumpCategory: (categoryId: string) => void;
  onAddBookmark: () => void;
  onAddCategory: () => void;
}

type ItemKind = 'bookmark' | 'category' | 'action' | 'web';

interface PaletteItem {
  key: string;
  kind: ItemKind;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  /** 仅书签使用，用于综合访问频次排序 */
  score?: number;
  run: () => void;
}

const KIND_LABEL: Record<ItemKind, string> = {
  bookmark: '书签',
  category: '分类',
  action: '操作',
  web: '网页搜索',
};

/** 把命中的连续子串加粗 */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-bold" style={{ color: 'var(--accent-color)' }}>
        {text.slice(index, index + q.length)}
      </mark>
      {text.slice(index + q.length)}
    </>
  );
};

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  bookmarks,
  categories,
  engines,
  engineId,
  canManage,
  visitScore,
  onOpenBookmark,
  onJumpCategory,
  onAddBookmark,
  onAddCategory,
}) => {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const engine = engines.find((e) => e.id === engineId) || engines[0];
  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setCursor(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim();
    const result: PaletteItem[] = [];

    const bookmarkItem = (bookmark: Bookmark, score?: number): PaletteItem => ({
      key: `bm:${bookmark.id}`,
      kind: 'bookmark',
      title: bookmark.title,
      subtitle: [categoryName.get(bookmark.categoryId), getDomain(bookmark.url)]
        .filter(Boolean)
        .join(' · '),
      icon: (
        <BookmarkIcon url={bookmark.url} title={bookmark.title} className="h-6 w-6 rounded-md" />
      ),
      score,
      run: () => {
        onOpenBookmark(bookmark);
        onClose();
      },
    });

    const categoryItem = (category: Category): PaletteItem => ({
      key: `cat:${category.id}`,
      kind: 'category',
      title: category.name,
      subtitle: '跳转到该分类',
      icon: <Hash size={14} />,
      run: () => {
        onJumpCategory(category.id);
        onClose();
      },
    });

    if (!q) {
      const ranked = [...bookmarks]
        .map((bookmark) => ({ bookmark, score: visitScore(bookmark.id) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      const shown = ranked.some((entry) => entry.score > 0)
        ? ranked
        : bookmarks.slice(0, 6).map((bookmark) => ({ bookmark, score: 0 }));

      shown.forEach((entry) => result.push(bookmarkItem(entry.bookmark, entry.score)));
      categories.slice(0, 5).forEach((category) => result.push(categoryItem(category)));

      if (canManage) {
        result.push(
          {
            key: 'act:add-bookmark',
            kind: 'action',
            title: '添加书签',
            subtitle: '新建一个书签',
            icon: <Plus size={14} />,
            run: () => {
              onAddBookmark();
              onClose();
            },
          },
          {
            key: 'act:add-category',
            kind: 'action',
            title: '新建分类',
            subtitle: '新增一个分类分组',
            icon: <Plus size={14} />,
            run: () => {
              onAddCategory();
              onClose();
            },
          }
        );
      }

      return result;
    }

    searchBookmarks(q, bookmarks, categories, 7)
      .map((hit) => ({
        hit,
        finalScore: (hit.score + 1) * (1 + Math.min(visitScore(hit.bookmark.id), 6) * 0.12),
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .forEach(({ hit, finalScore }) => result.push(bookmarkItem(hit.bookmark, finalScore)));

    categories
      .map((category) => ({ category, score: fuzzyScore(q, category.name) }))
      .filter((entry) => entry.score >= 0)
      .slice(0, 3)
      .forEach((entry) => result.push(categoryItem(entry.category)));

    result.push({
      key: 'web',
      kind: 'web',
      title: `用${engine.name}搜索「${q}」`,
      subtitle: '书签里没有的话，直接上网搜',
      icon: <Globe size={14} />,
      run: () => {
        window.open(`${engine.urlTemplate}${encodeURIComponent(q)}`, '_blank', 'noopener');
        onClose();
      },
    });

    if (canManage) {
      result.push({
        key: 'act:add-bookmark',
        kind: 'action',
        title: '添加书签',
        subtitle: '新建一个书签',
        icon: <Plus size={14} />,
        run: () => {
          onAddBookmark();
          onClose();
        },
      });
    }

    return result;
  }, [query, bookmarks, categories, categoryName, engine, canManage, visitScore, onOpenBookmark, onJumpCategory, onAddBookmark, onAddCategory, onClose]);

  useEffect(() => {
    setCursor((prev) => Math.min(prev, Math.max(items.length - 1, 0)));
  }, [items.length]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!isOpen) return null;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((prev) => (items.length === 0 ? 0 : (prev + 1) % items.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((prev) => (items.length === 0 ? 0 : (prev - 1 + items.length) % items.length));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      items[cursor]?.run();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[160] flex justify-center px-3 pt-[10vh] sm:pt-[14vh]">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
        className="animate-pop-in relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-lift)',
        }}
      >
        <div
          className="flex shrink-0 items-center gap-2 border-b px-3.5 py-3"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索书签、分类，或回车直接搜索网页…"
            aria-label="搜索书签"
            className="min-w-0 flex-1 border-none bg-transparent text-[14px] outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd
            className="hidden rounded-md border px-1.5 py-0.5 text-[10px] font-semibold sm:block"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-1.5">
          {items.length === 0 && (
            <p
              className="px-3 py-8 text-center text-[12px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              没有匹配的内容
            </p>
          )}

          {items.map((item, index) => {
            const isActive = index === cursor;
            return (
              <div
                key={item.key}
                data-index={index}
                role="button"
                tabIndex={-1}
                onMouseEnter={() => setCursor(index)}
                onClick={item.run}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') item.run();
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors"
                style={{ background: isActive ? 'var(--accent-bg)' : 'transparent' }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center"
                  style={{ color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                >
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-medium"
                    style={{ color: isActive ? 'var(--accent-color)' : 'var(--text-primary)' }}
                  >
                    <Highlight text={item.title} query={query} />
                  </span>
                  {item.subtitle && (
                    <span
                      className="block truncate text-[10.5px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.subtitle}
                    </span>
                  )}
                </span>
                <span
                  className="shrink-0 text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)', opacity: 0.55 }}
                >
                  {KIND_LABEL[item.kind]}
                </span>
              </div>
            );
          })}
        </div>

        <div
          className="flex shrink-0 items-center gap-3 border-t px-3.5 py-2 text-[10px]"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <span className="flex items-center gap-1">
            <CornerDownLeft size={10} /> 打开
          </span>
          <span className="flex items-center gap-1">
            <ArrowRight size={10} className="rotate-90" /> 选择
          </span>
          <span className="ml-auto hidden sm:block">方向键切换 · Esc 关闭</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommandPalette;
