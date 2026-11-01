import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Category } from '../types';
import Modal from './Modal';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: { id?: string; name: string; color: string }) => void;
  onDelete?: (id: string) => void;
  initialData?: Category | null;
}

const COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-slate-500',
];

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setName(initialData.name);
      setSelectedColor(initialData.color);
    } else {
      setName('');
      setSelectedColor(COLORS[0]);
    }
  }, [isOpen, initialData]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSave({ id: initialData?.id, name: name.trim(), color: selectedColor });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? '编辑分类' : '新建分类'}
      subtitle={initialData ? '改名或换颜色都不影响已有书签' : undefined}
      footer={
        <>
          {initialData && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(initialData.id);
                onClose();
              }}
              className="mr-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-red-50"
              style={{ color: 'var(--danger)' }}
            >
              <Trash2 size={13} />
              删除分类
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
            form="category-form"
            className="rounded-lg px-4 py-1.5 text-[12.5px] font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--accent-color)', color: 'var(--accent-contrast)' }}
          >
            {initialData ? '保存修改' : '确认添加'}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            分类名称
          </label>
          <input
            required
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：影音娱乐"
            className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--accent-color)]"
            style={{
              background: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label
            className="mb-2 block text-[10.5px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            颜色标记
          </label>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                aria-label={`选择颜色 ${color}`}
                aria-pressed={selectedColor === color}
                className={`h-8 w-8 rounded-full ${color} transition-all ${
                  selectedColor === color
                    ? 'scale-110 ring-2 ring-offset-2 ring-slate-400'
                    : 'hover:scale-105'
                }`}
                style={{ ['--tw-ring-offset-color' as string]: 'var(--bg-elevated)' }}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryModal;
