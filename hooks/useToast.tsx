import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, Info, Undo2, X } from 'lucide-react';
import { EXIT_MS } from '../lib/motion';
import { cn } from '../lib/utils';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  kind?: ToastKind;
  /** 有操作按钮时（例如撤销），停留时间默认更长 */
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, 'message'>> {
  id: string;
  kind: ToastKind;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
  /** 正在退出（先播 160ms 动画再移除，有来有回） */
  leaving?: boolean;
}

interface ToastAPI {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

export const useToast = (): ToastAPI => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast 必须在 ToastProvider 内使用');
  return ctx;
};

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <Check size={15} strokeWidth={3} />,
  error: <AlertCircle size={15} strokeWidth={2.5} />,
  info: <Info size={15} strokeWidth={2.5} />,
};

const ACCENT: Record<ToastKind, string> = {
  success: 'var(--success)',
  error: 'var(--danger)',
  info: 'var(--accent-color)',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    // 先标记 leaving 播退出动画，动画结束再真正移除
    setItems((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target || target.leaving) return prev;
      return prev.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    });
    const timer = timers.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timers.current[id];
    }
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const toast = useCallback(
    ({ message, kind = 'info', actionLabel, onAction, duration }: ToastOptions) => {
      const id = `t${Date.now()}${Math.random().toString(16).slice(2, 6)}`;
      const lifetime = duration ?? (actionLabel ? 5000 : 2600);
      setItems((prev) => [...prev.slice(-2), { id, message, kind, actionLabel, onAction, duration: lifetime }]);
      timers.current[id] = window.setTimeout(() => dismiss(id), lifetime);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[200] flex flex-col items-center gap-2 px-4 md:bottom-6">
          {items.map((item) => (
            <div
              key={item.id}
              role="status"
              aria-live="polite"
              className={cn(
                'pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-xl px-3.5 py-2.5 sm:max-w-md',
                item.leaving ? 'animate-toast-out' : 'animate-toast-in'
              )}
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--neu-raised-lg), 0 18px 44px -16px rgba(0, 0, 0, 0.4)',
                pointerEvents: item.leaving ? 'none' : 'auto',
              }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                style={{ background: ACCENT[item.kind] }}
              >
                {ICONS[item.kind]}
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug">{item.message}</span>
              {item.actionLabel && (
                <button
                  onClick={() => {
                    item.onAction?.();
                    dismiss(item.id);
                  }}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-bold transition-colors"
                  style={{ color: 'var(--accent-color)', background: 'var(--accent-bg)' }}
                >
                  <Undo2 size={12} />
                  {item.actionLabel}
                </button>
              )}
              <button
                onClick={() => dismiss(item.id)}
                aria-label="关闭提示"
                className="shrink-0 rounded-md p-1 opacity-40 transition-opacity hover:opacity-90"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
