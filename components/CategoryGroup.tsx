
import React, { useState, useEffect } from 'react';
import { Bookmark, Category } from '../types';
import { ExternalLink, Trash2, Edit2, GripVertical } from 'lucide-react';
import { CATEGORY_ICONS } from '../constants';
import BookmarkIcon from './BookmarkIcon';

interface CategoryGroupProps {
  category: Category;
  bookmarks: Bookmark[];
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark?: (id: string) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (id: string) => void;
  isEditMode: boolean;
  isAuthenticated: boolean;
  onMoveBookmark?: (draggedId: string, targetId: string) => void;
  onMoveToCategory?: (bookmarkId: string, categoryId: string) => void;
}

// Internal helper component for Delete with local confirmation state
const DeleteButton = ({ 
    onDelete, 
    size = 16, 
    className = "",
    compact = false
}: { 
    onDelete: () => void; 
    size?: number; 
    className?: string;
    compact?: boolean;
}) => {
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (confirming) {
            const timer = setTimeout(() => setConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [confirming]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); 
        
        if (confirming) {
            onDelete();
            setConfirming(false);
        } else {
            setConfirming(true);
        }
    };

    return (
        <button 
            onClick={handleClick}
            className={`${className} transition-all duration-200 flex items-center justify-center gap-1 ${
                confirming 
                    ? 'bg-red-500 text-white w-auto px-1.5 hover:bg-red-600 border-transparent shadow-sm z-50' 
                    : ''
            }`}
            title={confirming ? "确认删除" : "删除"}
        >
            <Trash2 size={size} />
            {confirming && !compact && <span className="text-[10px] font-bold whitespace-nowrap">确认</span>}
        </button>
    );
};

const CategoryGroup: React.FC<CategoryGroupProps> = ({ 
  category, 
  bookmarks, 
  onEditBookmark, 
  onDeleteBookmark,
  onEditCategory, 
  onDeleteCategory, 
  isEditMode,
  isAuthenticated,
  onMoveBookmark,
  onMoveToCategory
}) => {
  // Keep visible if it has bookmarks OR if we are authenticated (to allow adding) OR in edit mode
  if (bookmarks.length === 0 && !isEditMode && !isAuthenticated) return null;

  const Icon = CATEGORY_ICONS[category.name] || CATEGORY_ICONS['日常办公'];

  const handleBookmarkDragStart = (e: React.DragEvent, bookmarkId: string) => {
      e.stopPropagation(); 
      e.dataTransfer.setData('type', 'bookmark');
      e.dataTransfer.setData('bookmarkId', bookmarkId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleBookmarkDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const type = e.dataTransfer.getData('type');
      const draggedId = e.dataTransfer.getData('bookmarkId');
      
      if (type === 'bookmark' && draggedId && draggedId !== targetId && onMoveBookmark) {
          onMoveBookmark(draggedId, targetId);
      }
  };

  const handleContainerDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('type');
      const draggedId = e.dataTransfer.getData('bookmarkId');

      if (type === 'bookmark' && draggedId && onMoveToCategory) {
          onMoveToCategory(draggedId, category.id);
      }
  };

  return (
    <div 
        className={`bg-[var(--bg-glass)] backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-sm border border-[var(--border-color)] hover:shadow-xl hover:scale-[1.01] transition-all duration-500 ease-out relative h-full w-full ${bookmarks.length === 0 ? 'border-dashed bg-[var(--bg-main)]/50' : ''}`}
        onDragOver={(e) => { e.preventDefault(); }} 
        onDrop={handleContainerDrop}
    >
      {/* Category Header */}
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--border-color)]">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md ${category.color} transform transition-transform group-hover:scale-110 duration-500`}>
          {React.cloneElement(Icon as React.ReactElement<any>, { size: 16 })}
        </div>
        <h2 className="text-base font-bold text-[var(--text-primary)]">{category.name}</h2>
        
        {/* Edit/Delete Category Controls */}
        {isEditMode && (
            <div className="ml-auto flex items-center gap-1">
                {onEditCategory && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditCategory(category);
                        }}
                        className="text-[var(--text-secondary)] hover:text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑分类"
                    >
                        <Edit2 size={14} />
                    </button>
                )}
                {onDeleteCategory && (
                    <DeleteButton 
                        onDelete={() => onDeleteCategory(category.id)}
                        className="text-[var(--text-secondary)] hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg"
                        size={14}
                    />
                )}
                <div className="cursor-move text-[var(--text-secondary)] p-1.5" title="拖动排序">
                    <GripVertical size={14} />
                </div>
            </div>
        )}
      </div>

      {/* Bookmarks Grid - Constant grid layout even in edit mode */}
      <div className={`grid gap-2 min-h-[40px] max-h-[500px] overflow-y-auto pr-1 custom-scrollbar grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8`}>
        {bookmarks.map((bookmark) => (
          <div 
            key={bookmark.id} 
            className="relative group perspective-1000"
            draggable={isEditMode}
            onDragStart={(e) => handleBookmarkDragStart(e, bookmark.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleBookmarkDrop(e, bookmark.id)}
          >
             <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                 if (isEditMode) {
                     e.preventDefault(); 
                     e.stopPropagation();
                 }
              }}
              className={`flex items-start rounded-lg bg-[var(--bg-subtle)] border border-transparent transition-all duration-300 ease-out relative overflow-hidden h-full p-2 gap-2 ${
                  isEditMode 
                    ? 'border-blue-300 ring-1 ring-blue-100 bg-blue-50/30 cursor-move' 
                    : 'hover:bg-[var(--bg-card)] hover:border-blue-200 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5' 
              }`}
            >
              <div className="relative shrink-0 mt-0.5">
                <BookmarkIcon 
                    url={bookmark.url} 
                    title={bookmark.title}
                    className="w-7 h-7 rounded-md shadow-sm group-hover:shadow-md transition-shadow"
                />
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[12px] font-bold text-[var(--text-primary)] truncate w-full text-left leading-snug">
                      {bookmark.title}
                  </span>
                  {bookmark.description && (
                    <span className="text-[9px] text-[var(--text-secondary)] truncate w-full text-left mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        {bookmark.description}
                    </span>
                  )}
              </div>
              
              {!isEditMode && <ExternalLink size={9} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 ml-auto absolute top-1.5 right-1.5" />}
            </a>
            
            {/* Edit Mode Overlay Controls - Compact design for dense grid */}
            {isEditMode && (
              <div className="absolute inset-y-0 right-0 flex flex-col justify-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gradient-to-l from-blue-50/90 via-blue-50/50 to-transparent">
                <button 
                    onClick={(e) => { 
                        e.preventDefault();
                        e.stopPropagation(); 
                        onEditBookmark(bookmark); 
                    }}
                    className="p-1 bg-white shadow-sm border border-blue-200 rounded-md text-blue-600 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110"
                >
                    <Edit2 size={10} />
                </button>
                {onDeleteBookmark && (
                    <DeleteButton 
                        onDelete={() => onDeleteBookmark(bookmark.id)}
                        size={10}
                        compact={true}
                        className="p-1 bg-white shadow-sm border border-red-200 rounded-md text-red-500 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                    />
                )}
                <div className="p-1 text-slate-400 cursor-move">
                    <GripVertical size={10} />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {bookmarks.length === 0 && (
            <div className={`text-sm text-[var(--text-secondary)] text-center py-6 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[var(--border-color)] rounded-lg bg-[var(--bg-subtle)]/30 col-span-full`}>
                <span className="opacity-60 text-xs">暂无书签</span>
                {isAuthenticated && !isEditMode && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-100">
                        + 添加
                    </span>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default CategoryGroup;
