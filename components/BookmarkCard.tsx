import React, { useRef, useState } from 'react';
import { ExternalLink, GripVertical, Pin } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bookmark } from '../types';
import BookmarkIcon from './BookmarkIcon';
import { Density } from '../hooks/usePreferences';
import { cn } from '../lib/utils';

interface BookmarkCardProps {
  bookmark: Bookmark;
  density: Density;
  canDrag: boolean;
  isPinned: boolean;
  enableTilt: boolean;
  onBeforeOpen: (bookmark: Bookmark) => void;
  onContextMenu: (event: React.MouseEvent | MouseEvent, bookmark: Bookmark) => void;
  onMoreActions: (bookmark: Bookmark, anchor: DOMRect) => void;
}

const DENSITY_STYLE: Record<
  Density,
  { icon: string; pad: string; title: string; desc: string; gap: string; radius: string }
> = {
  compact: {
    icon: 'w-5 h-5 rounded',
    pad: 'px-2 py-1.5',
    title: 'text-[12px]',
    desc: 'hidden',
    gap: 'gap-1.5',
    radius: 'rounded-lg',
  },
  comfortable: {
    icon: 'w-7 h-7 rounded-md',
    pad: 'px-2.5 py-2',
    title: 'text-[12.5px]',
    desc: 'text-[10px]',
    gap: 'gap-2',
    radius: 'rounded-xl',
  },
  large: {
    icon: 'w-10 h-10 rounded-lg',
    pad: 'px-3 py-3',
    title: 'text-[13px]',
    desc: 'text-[10.5px]',
    gap: 'gap-2.5',
    radius: 'rounded-xl',
  },
};

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  density,
  canDrag,
  isPinned,
  enableTilt,
  onBeforeOpen,
  onContextMenu,
  onMoreActions,
}) => {
  const style = DENSITY_STYLE[density];
  const cardRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bookmark.id,
    disabled: !canDrag,
    data: { type: 'bookmark', bookmark },
  });

  // 鼠标光晕：直接改 CSS 变量，避免每帧 re-render
  const handlePointerMove = (event: React.PointerEvent) => {
    const el = cardRef.current;
    if (!el || event.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);

    if (enableTilt && anchorRef.current) {
      const rx = ((y - rect.height / 2) / rect.height) * -4;
      const ry = ((x - rect.width / 2) / rect.width) * 4;
      anchorRef.current.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
  };

  const resetTransform = () => {
    if (anchorRef.current) anchorRef.current.style.transform = '';
  };

  const dragStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 60 : undefined,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={dragStyle}
      className={cn('group relative fx-lift', isDragging && 'opacity-30')}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        setHovered(false);
        resetTransform();
      }}
      onPointerEnter={() => setHovered(true)}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? { 'aria-roledescription': '可拖拽的书签，用空格键开始移动' } : {})}
    >
      <a
        ref={anchorRef}
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        onContextMenu={(event) => {
          event.preventDefault();
          onContextMenu(event, bookmark);
        }}
        onClick={() => onBeforeOpen(bookmark)}
        title={`${bookmark.title}${bookmark.description ? ' · ' + bookmark.description : ''}`}
        className={cn(
          'bm-card-link relative flex h-full items-start overflow-hidden border transition-[background-color,border-color,box-shadow,transform] duration-200',
          'no-tap-highlight',
          style.pad,
          style.gap,
          style.radius
        )}
        style={{
          background: hovered ? 'var(--bg-card)' : 'var(--bg-subtle)',
          borderColor: hovered ? 'var(--border-strong)' : 'transparent',
          boxShadow: hovered ? 'var(--shadow-lift)' : 'none',
          willChange: 'transform',
        }}
      >
        {/* 跟随鼠标的光晕 */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            background:
              'radial-gradient(160px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent-bg) 50%, #ffffff), var(--accent-bg) 42%, transparent 72%)',
          }}
        />

        <span className="bm-icon-wrap relative mt-0.5 shrink-0">
          <BookmarkIcon
            url={bookmark.url}
            title={bookmark.title}
            className={cn(style.icon, 'shadow-sm transition-transform duration-200 group-hover:scale-105')}
          />
          {isPinned && (
            <span
              className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white shadow"
              style={{ background: 'var(--accent-color)', color: 'var(--accent-contrast)' }}
              title="已置顶"
            >
              <Pin size={8} strokeWidth={3} />
            </span>
          )}
        </span>

        <span className="bm-text relative flex min-w-0 flex-1 flex-col">
          <span
            className={cn('bm-title truncate font-semibold leading-snug', style.title)}
            style={{ color: 'var(--text-primary)' }}
          >
            {bookmark.title}
          </span>
          {bookmark.description && density !== 'compact' && (
            <span
              className={cn('bm-desc mt-0.5 truncate leading-tight opacity-70', style.desc)}
              style={{ color: 'var(--text-secondary)' }}
            >
              {bookmark.description}
            </span>
          )}
        </span>

        <ExternalLink
          size={9}
          className="pointer-events-none absolute right-1.5 top-1.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
        />
      </a>

      {/* 悬停操作：一个「更多」入口，全部操作收进菜单，避免误触 */}
      <div
        className={cn(
          'absolute right-1 top-1/2 z-20 flex -translate-y-1/2 items-center gap-0.5 rounded-lg p-0.5 transition-opacity',
          // 触屏没有 hover，常驻显示；桌面端悬停才出现
          'opacity-60 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'
        )}
        style={{ background: 'var(--bg-elevated)' }}
      >
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onMoreActions(bookmark, rect);
          }}
          aria-label={`${bookmark.title} 的更多操作`}
          aria-haspopup="menu"
          className="rounded-md p-1 transition-colors hover:bg-[var(--accent-bg)]"
          style={{ color: 'var(--text-secondary)' }}
          title="更多操作"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
        {canDrag && (
          <span
            className="cursor-grab p-1"
            style={{ color: 'var(--text-secondary)' }}
            title="按住拖动排序"
            aria-hidden="true"
          >
            <GripVertical size={12} />
          </span>
        )}
      </div>
    </div>
  );
};

export default BookmarkCard;
