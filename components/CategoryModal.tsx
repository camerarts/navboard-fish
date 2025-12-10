import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category } from '../types';

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

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setSelectedColor(initialData.color);
      } else {
        setName('');
        setSelectedColor(COLORS[0]);
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({ 
        id: initialData?.id,
        name, 
        color: selectedColor 
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-semibold text-slate-800">
            {initialData ? '编辑分类' : '添加新分类'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">分类名称</label>
                    <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="例如：影音娱乐"
                    autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">颜色标记</label>
                    <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                        <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full ${color} transition-all ring-2 ring-offset-2 ${
                            selectedColor === color ? 'ring-slate-400 scale-110' : 'ring-transparent hover:scale-105'
                        }`}
                        />
                    ))}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-medium transition shadow-md active:transform active:scale-95"
                >
                    {initialData ? '保存修改' : '确认添加'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;