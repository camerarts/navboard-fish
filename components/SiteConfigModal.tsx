import React, { useState, useEffect } from 'react';
import { X, Type, AppWindow, FileType } from 'lucide-react';

interface SiteConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, fontSize: string, subtitle: string) => void;
  initialName: string;
  initialFontSize: string;
  initialSubtitle: string;
}

const FONT_SIZES = [
  { label: '小', value: 'text-lg' },
  { label: '中', value: 'text-xl' },
  { label: '大', value: 'text-2xl' },
  { label: '特大', value: 'text-3xl' },
];

const SiteConfigModal: React.FC<SiteConfigModalProps> = ({ isOpen, onClose, onSave, initialName, initialFontSize, initialSubtitle }) => {
  const [name, setName] = useState(initialName);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [fontSize, setFontSize] = useState(initialFontSize);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setSubtitle(initialSubtitle);
      setFontSize(initialFontSize);
    }
  }, [isOpen, initialName, initialFontSize, initialSubtitle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <AppWindow size={20} className="text-blue-500" />
            网站设置
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">网站名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="FlatNav"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">副标题</label>
            <div className="relative">
                <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all pl-10"
                placeholder="Dashboard"
                />
                <FileType size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">标题字号</label>
            <div className="grid grid-cols-4 gap-2">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    fontSize === size.value
                      ? 'bg-blue-50 border-blue-500 text-blue-600 ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">预览</label>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shrink-0">
                 <Type size={24} />
               </div>
               <div className="flex flex-col min-w-0">
                  <span className={`${fontSize} font-bold text-slate-800 leading-tight transition-all duration-300 truncate`}>{name || 'FlatNav'}</span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase mt-1 tracking-widest">{subtitle || 'DASHBOARD'}</span>
               </div>
            </div>
          </div>

          <button
            onClick={() => { onSave(name, fontSize, subtitle); onClose(); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 font-medium transition shadow-md hover:shadow-lg active:scale-95"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteConfigModal;