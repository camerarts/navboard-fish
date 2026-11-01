import { useEffect, useRef } from 'react';
import { isEditableTarget } from '../lib/utils';

export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>;

/**
 * 全局快捷键。
 * 组合键写法：'mod+k'、'shift+?'、'/'、'Escape'、'1'～'9'
 * 在输入框里打字时自动忽略单键快捷键（mod 组合键与 Esc 除外）
 */
export const useHotkeys = (bindings: HotkeyMap, enabled = true) => {
  const ref = useRef(bindings);
  ref.current = bindings;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const pressed = event.key.toLowerCase();
      const typing = isEditableTarget(event.target);

      for (const combo of Object.keys(ref.current)) {
        const parts = combo.toLowerCase().split('+');
        const key = parts[parts.length - 1];
        const wantsMod = parts.includes('mod');
        const wantsShift = parts.includes('shift');
        const wantsAlt = parts.includes('alt');

        if (wantsMod !== mod) continue;
        if (wantsShift !== event.shiftKey) continue;
        if (wantsAlt !== event.altKey) continue;

        const isSlash = key === '/' && (pressed === '/' || event.code === 'Slash');
        if (key !== pressed && !isSlash) continue;

        // 正在输入时不劫持普通按键
        if (typing && !wantsMod && key !== 'escape') continue;

        event.preventDefault();
        ref.current[combo](event);
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
};
