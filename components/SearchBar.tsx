import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Command } from 'lucide-react';
import { SearchEngine } from '../types';
import { cn } from '../lib/utils';

interface SearchBarProps {
  engines: SearchEngine[];
  engineId: string;
  onEngineChange: (id: string) => void;
  onOpenPalette: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ engines, engineId, onEngineChange, onOpenPalette }) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = engines.find((e) => e.id === engineId) || engines[0];

  // 外部用 "/" 键聚焦时通过自定义事件触发
  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    window.addEventListener('nav:focus-search', focusInput);
    return () => window.removeEventListener('nav:focus-search', focusInput);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      onOpenPalette();
      return;
    }
    window.open(`${active.urlTemplate}${encodeURIComponent(q)}`, '_blank', 'noopener');
    setQuery('');
  };

  const shortcutHint = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

  return (
    <div className="relative z-20 mx-auto mb-6 w-full max-w-3xl">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 rounded-2xl p-1.5 transition-shadow duration-300 sm:gap-2 sm:p-2"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: focused ? 'var(--shadow-lift)' : '0 4px 16px -8px var(--shadow-color)',
        }}
      >
        {/* 搜索引擎：分段 pill，替代原生下拉 */}
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-xl p-0.5"
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
                className={cn(
                  'rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all duration-200 sm:px-2.5',
                  'whitespace-nowrap'
                )}
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

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`用${active.name.replace('搜索', '')}搜索，或按 ${shortcutHint}K 找书签`}
          aria-label="搜索"
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
          aria-label={query.trim() ? '开始搜索' : '打开书签搜索'}
          className={cn(
            'shrink-0 rounded-xl p-2.5 transition-all duration-200 active:scale-95'
          )}
          style={{
            background: query.trim() ? 'var(--accent-color)' : 'var(--bg-subtle)',
            color: query.trim() ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
