import React from 'react';
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
  return (
    <Modal
      isOpen={!!bookmark}
      onClose={onClose}
      size="xl"
      title={bookmark?.title || ''}
      subtitle={bookmark ? getDomain(bookmark.url) : ''}
      footer={
        bookmark && (
          <a
            href={bookmark.url}
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
      {bookmark && (
        <div className="flex flex-col gap-2">
          <iframe
            src={bookmark.url}
            title={bookmark.title}
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
