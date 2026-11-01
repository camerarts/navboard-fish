/**
 * 交互基座：全局指针位置追踪 + 涟漪 + 降低动效辅助。
 *
 * 借鉴 scaffold-master 的「放 Discharge」语态：
 * - 弹层从最近一次指针按下位置放大展开（而不是从屏幕中心）
 * - 主按钮涟漪从真实点击坐标化开
 * 所有动效都尊重 prefers-reduced-motion。
 */

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
