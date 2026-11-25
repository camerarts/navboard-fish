import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { recentPointerWithin, prefersReducedMotion, useDelayedUnmount, playExitAnimation } from '../lib/motion';

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
  const overlayRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  // 用 ref 持有 onClose，避免父组件每次渲染都重建副作用（否则会反复抢焦点）
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // 有来有回：关闭时先播 160ms 退出动画，再卸载 DOM
  const shouldRender = useDelayedUnmount(isOpen);
  const closingRef = useRef(false);

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

  // 弹层从触发点展开（放 Discharge）：从最近一次指针位置放大，键盘触发回落中心。
  // 关闭时对称地收缩回去（退出原点沿用进入原点，来路即归路）。
  useLayoutEffect(() => {
    if (!isOpen) return;
    closingRef.current = false;
    const panel = panelRef.current;
    const overlay = overlayRef.current;
    if (!panel || prefersReducedMotion()) return;
    if (overlay) {
      overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    }
    const p = recentPointerWithin(600);
    let origin = '50% 50%';
    if (p) {
      const r = panel.getBoundingClientRect();
      const x = Math.min(Math.max(p.x - r.left, -r.width * 0.25), r.width * 1.25);
      const y = Math.min(Math.max(p.y - r.top, -r.height * 0.25), r.height * 1.25);
      origin = `${x}px ${y}px`;
    }
    panel.style.transformOrigin = origin;
    const from = p
      ? { opacity: 0, transform: 'scale(0.86)' }
      : { opacity: 0, transform: 'translateY(14px) scale(0.975)' };
    const anim = panel.animate([from, { opacity: 1, transform: 'none' }], {
      duration: p ? 420 : 300,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'backwards',
    });
    return () => {
      anim.cancel();
      if (panel) panel.style.transformOrigin = '';
    };
  }, [isOpen]);

  // 关闭瞬间：播放退出动画（DOM 此时还在，因为 useDelayedUnmount 延迟卸载）
  useEffect(() => {
    if (isOpen || closingRef.current) return;
    if (!shouldRender) return;
    closingRef.current = true;
    const cleanup = playExitAnimation(panelRef.current, overlayRef.current, 'modal');
    return cleanup;
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={isOpen ? undefined : { pointerEvents: 'none' }}
      aria-hidden={!isOpen}
    >
      <div
        ref={overlayRef}
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
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden outline-none',
          'rounded-t-2xl sm:rounded-2xl',
          SIZES[size]
        )}
        style={{
          background: 'var(--bg-elevated)',
          border: 'none',
          boxShadow: 'var(--neu-raised-lg), 0 24px 60px -20px rgba(0, 0, 0, 0.45)',
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
