import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, CornerUpRight, ExternalLink, Maximize2, Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { Bookmark } from '../types';

export interface ContextMenuState {
  x: number;
  y: number;
  bookmark: Bookmark;
}

interface ContextMenuProps {
  state: ContextMenuState | null;
  isPinned: boolean;
  canManage: boolean;
  onClose: () => void;
  onOpen: (bookmark: Bookmark, mode: 'newtab' | 'sametab') => void;
  onPreview: (bookmark: Bookmark) => void;
  onCopy: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
  onTogglePin: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
}

interface MenuEntry {
  key: string;
  label: string;
  icon: React.ReactNode;
  run: () => void;
  danger?: boolean;
  divider?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  isPinned,
  canManage,
  onClose,
  onOpen,
  onPreview,
  onCopy,
  onEdit,
  onTogglePin,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // 先渲染到鼠标位置，再根据实际尺寸做边界收敛
  useLayoutEffect(() => {
    if (!state) return;
    const el = menuRef.current;
    const width = el?.offsetWidth ?? 200;
    const height = el?.offsetHeight ?? 260;
    const margin = 8;
    const x = Math.min(state.x, window.innerWidth - width - margin);
    const y = Math.min(state.y, window.innerHeight - height - margin);
    setPosition({ x: Math.max(margin, x), y: Math.max(margin, y) });
  }, [state]);

  useEffect(() => {
    if (!state) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('keydown', handleKey, true);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKey, true);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [state, onClose]);

  if (!state) return null;

  const bookmark = state.bookmark;
  const wrap = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const entries: MenuEntry[] = [
    {
      key: 'newtab',
      label: '新标签页打开',
      icon: <ExternalLink size={13} />,
      run: wrap(() => onOpen(bookmark, 'newtab')),
    },
    {
      key: 'sametab',
      label: '当前页打开',
      icon: <CornerUpRight size={13} />,
      run: wrap(() => onOpen(bookmark, 'sametab')),
    },
    {
      key: 'preview',
      label: '小窗预览',
      icon: <Maximize2 size={13} />,
      divider: true,
      run: wrap(() => onPreview(bookmark)),
    },
    {
      key: 'copy',
      label: '复制链接',
      icon: <Copy size={13} />,
      run: wrap(() => onCopy(bookmark)),
    },
    ...(canManage
      ? [
          {
            key: 'pin',
            label: isPinned ? '取消置顶' : '置顶到分类最前',
            icon: isPinned ? <PinOff size={13} /> : <Pin size={13} />,
            divider: true,
            run: wrap(() => onTogglePin(bookmark)),
          } as MenuEntry,
          {
            key: 'edit',
            label: '编辑书签',
            icon: <Pencil size={13} />,
            run: wrap(() => onEdit(bookmark)),
          } as MenuEntry,
          {
            key: 'delete',
            label: '删除书签',
            icon: <Trash2 size={13} />,
            danger: true,
            divider: true,
            run: wrap(() => onDelete(bookmark)),
          } as MenuEntry,
        ]
      : []),
  ];

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={`${bookmark.title} 的操作菜单`}
      className="animate-pop-in fixed z-[170] min-w-[176px] overflow-hidden rounded-xl border p-1"
      style={{
        left: position.x,
        top: position.y,
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-lift)',
      }}
    >
      <div
        className="truncate px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        {bookmark.title}
      </div>

      {entries.map((entry) => (
        <React.Fragment key={entry.key}>
          {entry.divider && (
            <div className="my-1 h-px" style={{ background: 'var(--border-color)' }} />
          )}
          <button
            role="menuitem"
            onClick={entry.run}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] font-medium transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: entry.danger ? 'var(--danger)' : 'var(--text-primary)' }}
          >
            <span style={{ color: entry.danger ? 'var(--danger)' : 'var(--text-secondary)' }}>
              {entry.icon}
            </span>
            {entry.label}
          </button>
        </React.Fragment>
      ))}
    </div>,
    document.body
  );
};

export default ContextMenu;
