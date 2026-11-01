import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Command, CornerDownLeft, Globe, Hash, Search } from 'lucide-react';
import { Bookmark, Category, SearchEngine } from '../types';
import { searchBookmarks } from '../lib/search';
import { fuzzyScore } from '../lib/fuzzy';
import { getDomain } from '../lib/utils';
import BookmarkIcon from './BookmarkIcon';

interface SearchBarProps {
  engines: SearchEngine[];
  engineId: string;
  onEngineChange: (id: string) => void;
  onOpenPalette: () => void;
  bookmarks: Bookmark[];
  categories: Category[];
  visitScore: (id: string) => number;
  onOpenBookmark: (bookmark: Bookmark) => void;
  onJumpCategory: (categoryId: string) => void;
}

type Suggestion =
  | { kind: 'bookmark'; key: string; bookmark: Bookmark; subtitle: string }
  | { kind: 'category'; key: string; category: Category }
  | { kind: 'web'; key: string; query: string };

/**
 * 搜索框：输入即出建议（书签 → 分类 → 网页搜索），
 * 不必先记住 ⌘K 也能一键到达；无高亮项时回车直接走搜索引擎。
 */
const SearchBar: React.FC<SearchBarProps> = ({
  engines,
  engineId,
  onEngineChange,
  onOpenPalette,
  bookmarks,
  categories,
  visitScore,
  onOpenBookmark,
  onJumpCategory,
}) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const active = engines.find((e) => e.id === engineId) || engines[0];
  const engineShort = active.name.replace('搜索', '');
  const shortcutHint =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    window.addEventListener('nav:focus-search', focusInput);
    return () => window.removeEventListener('nav:focus-search', focusInput);
  }, []);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim();
    if (!q) return [];

    const list: Suggestion[] = [];

    searchBookmarks(q, bookmarks, categories, 5)
      .map((hit) => ({
        hit,
        final: (hit.score + 1) * (1 + Math.min(visitScore(hit.bookmark.id), 6) * 0.12),
      }))
      .sort((a, b) => b.final - a.final)
      .forEach(({ hit }) =>
        list.push({
          kind: 'bookmark',
          key: `bm:${hit.bookmark.id}`,
          bookmark: hit.bookmark,
          subtitle: [hit.categoryName, hit.domain].filter(Boolean).join(' · '),
        })
      );

    categories
      .map((category) => ({ category, score: fuzzyScore(q, category.name) }))
      .filter((entry) => entry.score >= 0)
      .slice(0, 2)
      .forEach((entry) =>
        list.push({ kind: 'category', key: `cat:${entry.category.id}`, category: entry.category })
      );

    list.push({ kind: 'web', key: 'web', query: q });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, bookmarks, categories]);

  const open = focused && suggestions.length > 0;

  const runSuggestion = (item: Suggestion) => {
    if (item.kind === 'bookmark') onOpenBookmark(item.bookmark);
    else if (item.kind === 'category') onJumpCategory(item.category.id);
    else window.open(`${active.urlTemplate}${encodeURIComponent(item.query)}`, '_blank', 'noopener');

    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      onOpenPalette();
      return;
    }
    const picked = open ? suggestions[cursor] : undefined;
    if (picked) {
      runSuggestion(picked);
      return;
    }
    window.open(`${active.urlTemplate}${encodeURIComponent(q)}`, '_blank', 'noopener');
    setQuery('');
  };

  return (
    <div ref={wrapRef} className="relative z-30 mx-auto mb-6 w-full max-w-3xl">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 rounded-2xl p-1.5 transition-shadow duration-300 sm:gap-2 sm:p-2"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: open ? 'var(--shadow-lift)' : '0 4px 16px -8px var(--shadow-color)',
        }}
      >
        {/* 搜索引擎：分段 pill（窄屏隐藏，回车默认用首选引擎） */}
        <div
          className="hidden shrink-0 items-center gap-0.5 rounded-xl p-0.5 sm:flex"
          style={{ background: 'var(--bg-subtle)' }}
          role="group"
          aria-label="选择搜索引擎"
        >
          {engines.map((engine) => {
            const isActive = engine.id === active.id;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => onEngineChange(engine.id)}
                aria-pressed={isActive}
                className="whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all duration-200 sm:px-2.5"
                style={{
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 1px 3px var(--shadow-color)' : 'none',
                }}
                title={`${engine.name}（${shortcutHint} + ${engines.indexOf(engine) + 1}）`}
              >
                {engine.name.replace('搜索', '')}
              </button>
            );
          })}
        </div>

        <Search
          size={15}
          className="ml-1.5 hidden shrink-0 sm:block"
          style={{ color: 'var(--text-secondary)' }}
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={`搜书签，或回车用${engineShort}上网搜`}
          aria-label="搜索书签或网页"
          aria-expanded={open}
          aria-controls="search-suggestions"
          role="combobox"
          className="min-w-0 flex-1 border-none bg-transparent px-1.5 py-2 text-[15px] outline-none placeholder:text-[13px] sm:px-2"
          style={{ color: 'var(--text-primary)' }}
        />

        <button
          type="button"
          onClick={onOpenPalette}
          className="hidden shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--bg-subtle)] sm:flex"
          style={{ color: 'var(--text-secondary)' }}
          title="打开命令面板"
        >
          <Command size={12} />
          <span className="tabular-nums">K</span>
        </button>

        <button
          type="submit"
          data-ripple
          aria-label={query.trim() ? '搜索' : '打开书签搜索'}
          className="shrink-0 rounded-xl p-2.5 transition-all duration-200 active:scale-95"
          style={{
            background: query.trim() ? 'var(--accent-color)' : 'var(--bg-subtle)',
            color: query.trim() ? 'var(--accent-contrast)' : 'var(--text-secondary)',
          }}
        >
          <ArrowRight size={18} />
        </button>
      </form>

      {/* 建议面板 */}
      {open && (
        <div
          id="search-suggestions"
          role="listbox"
          className="animate-pop-in absolute inset-x-0 top-[calc(100%+6px)] overflow-hidden rounded-xl border p-1"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-lift)',
          }}
        >
          {suggestions.map((item, index) => {
            const isActive = index === cursor;
            return (
              <div
                key={item.key}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setCursor(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  runSuggestion(item);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2"
                style={{ background: isActive ? 'var(--accent-bg)' : 'transparent' }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center"
                  style={{ color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                >
                  {item.kind === 'bookmark' ? (
                    <BookmarkIcon
                      url={item.bookmark.url}
                      title={item.bookmark.title}
                      className="h-5 w-5 rounded"
                    />
                  ) : item.kind === 'category' ? (
                    <Hash size={13} />
                  ) : (
                    <Globe size={13} />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-medium"
                    style={{ color: isActive ? 'var(--accent-color)' : 'var(--text-primary)' }}
                  >
                    {item.kind === 'web'
                      ? `用${engineShort}搜索「${item.query}」`
                      : item.kind === 'category'
                        ? `跳转到分类「${item.category.name}」`
                        : item.bookmark.title}
                  </span>
                  <span
                    className="block truncate text-[10.5px]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.kind === 'bookmark'
                      ? item.subtitle
                      : item.kind === 'category'
                        ? '分类'
                        : getDomain(active.urlTemplate) || '网页搜索'}
                  </span>
                </span>

                {isActive && (
                  <CornerDownLeft
                    size={11}
                    className="shrink-0"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
