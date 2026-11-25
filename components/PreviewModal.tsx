import React, { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { Bookmark } from '../types';
import Modal from './Modal';
import { getDomain } from '../lib/utils';

interface PreviewModalProps {
  bookmark: Bookmark | null;
  onClose: () => void;
}

/** 站内小窗预览：部分网站禁止被 iframe 嵌套，此时提示用户改用外部打开 */
const PreviewModal: React.FC<PreviewModalProps> = ({ bookmark, onClose }) => {
  // 关闭瞬间 bookmark 立即变 null，但退出动画还要播 160ms；
  // 用快照保住内容，避免退出时闪一下「塌缩的空壳」
  const lastRef = useRef<Bookmark | null>(null);
  if (bookmark) lastRef.current = bookmark;
  const view = bookmark ?? lastRef.current;

  return (
    <Modal
      isOpen={!!bookmark}
      onClose={onClose}
      size="xl"
      title={view?.title || ''}
      subtitle={view ? getDomain(view.url) : ''}
      footer={
        view && (
          <a
            href={view.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
            style={{ background: 'var(--accent-color)', color: 'var(--accent-contrast)' }}
          >
            <ExternalLink size={12} />
            在新标签页打开
          </a>
        )
      }
    >
      {view && (
        <div className="flex flex-col gap-2">
          <iframe
            src={view.url}
            title={view.title}
            className="h-[62vh] w-full rounded-xl border"
            style={{ borderColor: 'var(--border-color)', background: '#fff' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
          />
          <p className="text-[10.5px]" style={{ color: 'var(--text-secondary)' }}>
            如果这里是空白，说明该网站禁止被嵌入（X-Frame-Options），请点右下角在新标签页打开。
          </p>
        </div>
      )}
    </Modal>
  );
};

export default PreviewModal;
