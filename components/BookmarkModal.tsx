import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Bookmark, Category } from '../types';
import Modal from './Modal';
import BookmarkIcon from './BookmarkIcon';
import { getDomain } from '../lib/utils';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: Partial<Bookmark>) => void;
  onDelete?: (bookmark: Bookmark) => void;
  categories: Category[];
  initialData?: Bookmark | null;
  defaultCategoryId?: string;
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-subtle)',
  borderColor: 'var(--border-color)',
  color: 'var(--text-primary)',
};

const labelClass = 'mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider';

const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  categories,
  initialData,
  defaultCategoryId,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setTitle(initialData.title);
      setUrl(initialData.url);
      setDescription(initialData.description || '');
      setCategoryId(initialData.categoryId);
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setCategoryId(defaultCategoryId || categories[0]?.id || '');
    }
  }, [isOpen, initialData, categories, defaultCategoryId]);

  const previewUrl = useMemo(() => {
    if (!url.trim()) return '';
    return /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
  }, [url]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const finalUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    onSave({
      title: title.trim() || getDomain(finalUrl) || finalUrl,
      url: finalUrl,
      categoryId: categoryId || categories[0]?.id || '',
      description: description.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? '编辑书签' : '添加书签'}
      subtitle={initialData ? getDomain(initialData.url) : '填个网址，标题可以自动带出来'}
      footer={
        <>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(initialData);
                onClose();
              }}
              className="mr-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-red-500/10"
              style={{ color: 'var(--danger)' }}
            >
              <Trash2 size={13} />
              删除
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            取消
          </button>
          <button
            type="submit"
            form="bookmark-form"
            className="rounded-lg px-4 py-1.5 text-[12.5px] font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--accent-color)', color: 'var(--accent-contrast)' }}
          >
            {initialData ? '保存修改' : '确认添加'}
          </button>
        </>
      }
    >
      <form id="bookmark-form" onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
            网址 URL
          </label>
          <div className="flex items-center gap-2">
            {previewUrl && (
              <BookmarkIcon
                url={previewUrl}
                title={title || 'x'}
                className="h-8 w-8 shrink-0 rounded-lg"
              />
            )}
            <input
              required
              autoFocus
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => {
                if (!title.trim() && url.trim()) {
                  const domain = getDomain(previewUrl);
                  if (domain) setTitle(domain);
                }
              }}
              placeholder="github.com"
              className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--accent-color)]"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
            标题
          </label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：GitHub"
            className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--accent-color)]"
            style={inputStyle}
          />
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
            描述 <span className="font-normal normal-case opacity-60">（可选）</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="一句话说明它是干嘛的"
            className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--accent-color)]"
            style={inputStyle}
          />
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
            所属分类
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => {
              const isActive = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  aria-pressed={isActive}
                  className="rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all"
                  style={{
                    borderColor: isActive ? 'var(--accent-color)' : 'var(--border-color)',
                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                    color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                  }}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BookmarkModal;
