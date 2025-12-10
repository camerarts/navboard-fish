import React, { useState, useEffect } from 'react';
import { X, Trash2, FileText } from 'lucide-react';
import { Bookmark, Category } from '../types';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: Omit<Bookmark, 'id'>) => void;
  onDelete?: (id: string) => void;
  categories: Category[];
  initialData?: Bookmark | null;
}

const BookmarkModal: React.FC<BookmarkModalProps> = ({ isOpen, onClose, onSave, onDelete, categories, initialData }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setUrl(initialData.url);
        setDescription(initialData.description || '');
        setCategoryId(initialData.categoryId);
      } else {
        setTitle('');
        setUrl('');
        setDescription('');
        setCategoryId(categories[0]?.id || '');
      }
    }
  }, [isOpen, initialData, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    onSave({ 
        title, 
        url: formattedUrl, 
        categoryId,
        description: description.trim() 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-semibold text-slate-800">
            {initialData ? '编辑书签' : '添加新书签'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">标题</label>
                <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="例如：GitHub"
                />
            </div>
            
            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">网址 (URL)</label>
                <input
                required
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="example.com"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">网站说明 (可选)</label>
                <div className="relative">
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="例如：代码托管与协作平台"
                    />
                    <FileText size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">分类</label>
                <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                </select>
            </div>

            <div className="flex gap-3 pt-4">
                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={() => { onDelete(initialData.id); onClose(); }}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition flex items-center justify-center"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
                <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium transition shadow-md active:transform active:scale-95"
                >
                {initialData ? '保存修改' : '添加书签'}
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default BookmarkModal;