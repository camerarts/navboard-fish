/**
 * 交互基座：全局指针位置追踪 + 涟漪 + 降低动效辅助。
 *
 * 借鉴 scaffold-master 的「放 Discharge」语态：
 * - 弹层从最近一次指针按下位置放大展开（而不是从屏幕中心）
 * - 主按钮涟漪从真实点击坐标化开
 * 所有动效都尊重 prefers-reduced-motion。
 */

import { useEffect, useRef, useState } from 'react';

let lastPx = 0;
let lastPy = 0;
let lastPt = 0;
let pointerInstalled = false;

function trackPointer() {
  if (pointerInstalled || typeof document === 'undefined') return;
  pointerInstalled = true;
  document.addEventListener(
    'pointerdown',
    (e) => {
      lastPx = e.clientX;
      lastPy = e.clientY;
      lastPt = performance.now();
    },
    { capture: true, passive: true }
  );
  // 键盘触发（Enter / 空格）视为「无来处」，弹层回落中心、涟漪落回中心
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') lastPt = 0;
    },
    { capture: true, passive: true }
  );
}

trackPointer();

/** 最近一次指针按下位置（供弹层计算展开原点） */
export function getLastPointer() {
  return { x: lastPx, y: lastPy, at: lastPt };
}

/** 最近 ms 内由指针触发的按下才有「来处」，否则回落（键盘 / 无来处） */
export function recentPointerWithin(ms: number) {
  return lastPt && performance.now() - lastPt < ms ? { x: lastPx, y: lastPy } : null;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 统一退出动画时长（与进入 240ms 对应，更短更快，不打断人） */
export const EXIT_MS = prefersReducedMotion() ? 0 : 160;

/**
 * 弹层退出动画辅助：返回 shouldRender 与 requestClose。
 * - open=true  → 立即渲染（进入动画由各自的 useLayoutEffect 处理）
 * - open=false → 先播 160ms 退出动画，再真正卸载 DOM
 * 用法：const shouldRender = useDelayedUnmount(isOpen);
 */
export function useDelayedUnmount(open: boolean, exitMs = EXIT_MS): boolean {
  const [shouldRender, setShouldRender] = useState(open);
  const prevOpenRef = useRef(open);

  useEffect(() => {
    if (open === prevOpenRef.current) return;
    prevOpenRef.current = open;

    if (open) {
      // 重新打开：立即渲染（跳过等待）
      setShouldRender(true);
      return;
    }
    // 关闭：先播退出动画，动画结束后再卸载
    if (exitMs <= 0) {
      setShouldRender(false);
      return;
    }
    const timer = window.setTimeout(() => setShouldRender(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [open, exitMs]);

  return shouldRender;
}

/** 弹层退出动画（Web Animations API，配 useDelayedUnmount 使用）。返回 cancel。 */
export function playExitAnimation(
  panel: HTMLElement | null,
  overlay: HTMLElement | null,
  kind: 'modal' | 'palette' | 'menu' | 'popover'
): () => void {
  if (!panel || prefersReducedMotion()) return () => {};
  const transforms: Record<string, string> = {
    modal: 'scale(0.96) translateY(8px)',
    palette: 'scale(0.98) translateY(-10px)',
    menu: 'scale(0.95)',
    popover: 'scale(0.97) translateY(-4px)',
  };
  const anim = panel.animate(
    [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: transforms[kind] }],
    { duration: EXIT_MS, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
  );
  let overlayAnim: Animation | null = null;
  if (overlay) {
    overlayAnim = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: EXIT_MS,
      easing: 'ease-in',
      fill: 'forwards',
    });
  }
  return () => {
    anim.cancel();
    overlayAnim?.cancel();
  };
}

/** 主按钮涟漪：从真实点击坐标化开（放 Discharge）。键盘触发落回中心。 */
let rippleInstalled = false;
export function installRipple() {
  if (rippleInstalled || typeof document === 'undefined') return;
  rippleInstalled = true;
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      const btn = (event.target as Element | null)?.closest?.(
        '[data-ripple]'
      ) as HTMLElement | null;
      if (!btn || (btn as HTMLButtonElement).disabled) return;
      const rect = btn.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const radius = Math.max(rect.width, rect.height);
      const dot = document.createElement('span');
      dot.className = 'fx-ripple-dot';
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.width = `${radius * 2.4}px`;
      dot.style.height = `${radius * 2.4}px`;
      btn.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove());
    },
    { passive: true }
  );
}
