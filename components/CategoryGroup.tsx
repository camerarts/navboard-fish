import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Bookmark, Category } from '../types';
import { CATEGORY_ICONS } from '../constants';
import BookmarkCard from './BookmarkCard';
import { Density } from '../hooks/usePreferences';
import { cn } from '../lib/utils';

interface CategoryGroupProps {
  category: Category;
  bookmarks: Bookmark[];
  density: Density;
  editMode: boolean;
  isAuthenticated: boolean;
  canDragBookmarks: boolean;
  pins: Set<string>;
  enableTilt: boolean;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddBookmark: (categoryId: string) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmark: Bookmark) => void;
  onContextMenu: (event: React.MouseEvent | MouseEvent, bookmark: Bookmark) => void;
  onMoreActions: (bookmark: Bookmark, anchor: DOMRect) => void;
  onBeforeOpen: (bookmark: Bookmark) => void;
}

const GRID_MIN: Record<Density, string> = {
  compact: 'repeat(auto-fill, minmax(118px, 1fr))',
  comfortable: 'repeat(auto-fill, minmax(190px, 1fr))',
  large: 'repeat(auto-fill, minmax(248px, 1fr))',
};

const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  bookmarks,
  density,
  editMode,
  isAuthenticated,
  canDragBookmarks,
  pins,
  enableTilt,
  onEditCategory,
  onDeleteCategory,
  onAddBookmark,
  onContextMenu,
  onMoreActions,
  onBeforeOpen,
}) => {
  // 分类整体作为拖拽单元（仅编辑模式下可拖）
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `category:${category.id}`,
    disabled: !editMode,
    data: { type: 'category', categoryId: category.id },
  });

  // 书签落在本分类任意位置都能接收（含空分类）
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `container:${category.id}`,
    data: { type: 'container', categoryId: category.id },
  });

  const Icon = CATEGORY_ICONS[category.name] || CATEGORY_ICONS['日常办公'];

  if (bookmarks.length === 0 && !isAuthenticated && !editMode) return null;

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <section
      ref={setSortableRef}
      style={sortableStyle}
      aria-labelledby={`cat-title-${category.id}`}
      className="group w-full"
    >
      <div
        ref={setDropRef}
        className={cn(
          'relative rounded-2xl border p-3 shadow-sm transition-colors md:p-4',
          isOver && canDragBookmarks && 'ring-2'
        )}
        style={{
          background: 'var(--bg-glass)',
          borderColor: isOver && canDragBookmarks ? 'var(--accent-color)' : 'var(--border-color)',
          ...(isOver && canDragBookmarks
            ? { boxShadow: '0 0 0 3px var(--accent-bg)' }
            : {}),
        }}
      >
        {/* 吸顶标题栏 */}
        <div
          className={cn(
            'sticky top-0 z-20 -mx-1 mb-2 flex items-center gap-2 rounded-xl px-1.5 py-1.5 backdrop-blur-md',
            editMode && 'cursor-grab active:cursor-grabbing'
          )}
          style={{ background: 'var(--bg-sticky)' }}
          {...(editMode ? listeners : {})}
          {...(editMode ? attributes : {})}
        >
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm',
              category.color
            )}
          >
            {React.cloneElement(Icon as React.ReactElement<{ size?: number }>, { size: 15 })}
          </div>

          <h2
            id={`cat-title-${category.id}`}
            className="truncate text-[15px] font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {category.name}
          </h2>

          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
            style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
          >
            {bookmarks.length}
          </span>

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            {isAuthenticated && (
              <button
                onClick={() => onAddBookmark(category.id)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium opacity-0 transition-all hover:bg-[var(--accent-bg)] focus-visible:opacity-100 group-hover:opacity-100"
                style={{ color: 'var(--accent-color)' }}
                aria-label={`在 ${category.name} 添加书签`}
              >
                <Plus size={13} strokeWidth={3} />
                添加
              </button>
            )}
            {editMode && (
              <>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onEditCategory(category)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label={`编辑分类 ${category.name}`}
                  title="编辑分类"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onDeleteCategory(category)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--danger)]"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label={`删除分类 ${category.name}`}
                  title="删除分类"
                >
                  <Trash2 size={13} />
                </button>
                <span style={{ color: 'var(--text-secondary)' }} aria-hidden="true">
                  <GripVertical size={14} />
                </span>
              </>
            )}
          </div>
        </div>

        {/* 书签网格：自适应列宽，不再写死 8 列 */}
        <SortableContext
          items={bookmarks.map((b) => b.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className="bm-grid grid gap-1.5 md:gap-2"
            style={{ gridTemplateColumns: GRID_MIN[density] }}
          >
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                density={density}
                canDrag={canDragBookmarks}
                isPinned={pins.has(bookmark.id)}
                enableTilt={enableTilt}
                onBeforeOpen={onBeforeOpen}
                onContextMenu={onContextMenu}
                onMoreActions={onMoreActions}
              />
            ))}
          </div>
        </SortableContext>

        {bookmarks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-6 text-center"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              这里还空着
            </span>
            {isAuthenticated && (
              <button
                onClick={() => onAddBookmark(category.id)}
                className="rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent-color)' }}
              >
                添加第一个书签
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryGroup;
