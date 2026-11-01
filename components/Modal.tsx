import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** 面板最大宽度，默认 md */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 是否允许点遮罩关闭 */
  closeOnBackdrop?: boolean;
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-5xl',
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * 统一的弹窗基座：
 * - 跟随浅色/深色/赛博朋克主题（不再硬编码白底）
 * - Esc 关闭、点遮罩关闭、焦点陷阱、打开时锁定背景滚动
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  // 用 ref 持有 onClose，避免父组件每次渲染都重建副作用（否则会反复抢焦点）
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;

    // 打开后把焦点移进弹窗
    const focusFirst = () => {
      const nodes = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes && nodes.length > 0) {
        nodes[0].focus();
      } else {
        panel?.focus();
      }
    };
    const timer = window.setTimeout(focusFirst, 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const nodes = (Array.from(panel.querySelectorAll(FOCUSABLE)) as HTMLElement[]).filter(
        (el) => el.offsetParent !== null
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown, true);
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'animate-pop-in relative flex max-h-[92vh] w-full flex-col overflow-hidden outline-none',
          'rounded-t-2xl sm:rounded-2xl border shadow-2xl',
          SIZES[size]
        )}
        style={{
          background: 'var(--bg-elevated)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        <header
          className="flex shrink-0 items-start justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold leading-tight">{title}</h3>
            {subtitle && (
              <p className="mt-1 truncate text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer
            className="flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-subtle)' }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
