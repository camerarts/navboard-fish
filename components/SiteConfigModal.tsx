import React, { useEffect, useState } from 'react';
import Modal from './Modal';

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

const SiteConfigModal: React.FC<SiteConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName,
  initialFontSize,
  initialSubtitle,
}) => {
  const [name, setName] = useState(initialName);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [fontSize, setFontSize] = useState(initialFontSize);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setSubtitle(initialSubtitle);
    setFontSize(initialFontSize);
  }, [isOpen, initialName, initialFontSize, initialSubtitle]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(name.trim() || 'FlatNav', fontSize, subtitle.trim() || 'Dashboard');
    onClose();
  };

  const labelClass = 'mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="站点设置"
      subtitle="改的是标题展示，不影响任何书签数据"
      footer={
        <>
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
            data-ripple
            form="site-config-form"
            className="rounded-lg px-4 py-1.5 text-[12.5px] font-bold text-white"
            style={{ background: 'var(--accent-color)', color: 'var(--accent-contrast)' }}
          >
            保存
          </button>
        </>
      }
    >
      <form id="site-config-form" onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
            站点名称
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="FlatNav"
            className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--accent-color)]"
            style={{
              background: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
            副标题
          </label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Dashboard"
            className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--accent-color)]"
            style={{
              background: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
            名称字号
          </label>
          <div className="flex gap-1.5">
            {FONT_SIZES.map((size) => {
              const isActive = fontSize === size.value;
              return (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setFontSize(size.value)}
                  aria-pressed={isActive}
                  className="flex-1 rounded-lg border py-1.5 text-[12px] font-semibold transition-all"
                  style={{
                    borderColor: isActive ? 'var(--accent-color)' : 'var(--border-color)',
                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                    color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                  }}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SiteConfigModal;
