import { useCallback, useMemo, useState } from 'react';
import { safeGetJSON, safeSetItem } from '../lib/utils';

export type Density = 'compact' | 'comfortable' | 'large';

const DENSITY_KEY = 'flatnav_density';
const PIN_KEY = 'flatnav_pinned';
const VISIT_KEY = 'flatnav_visits';

export const DENSITY_OPTIONS: { value: Density; label: string; hint: string }[] = [
  { value: 'compact', label: '紧凑', hint: '一屏看到更多' },
  { value: 'comfortable', label: '标准', hint: '默认密度' },
  { value: 'large', label: '大图标', hint: '图标更大更好点' },
];

/**
 * 视图密度：只影响展示，不改动任何书签数据
 */
export const useDensity = () => {
  const [density, setDensity] = useState<Density>(() => {
    const saved = safeGetJSON<Density>(DENSITY_KEY, 'comfortable');
    return ['compact', 'comfortable', 'large'].includes(saved) ? saved : 'comfortable';
  });

  const update = useCallback((next: Density) => {
    setDensity(next);
    safeSetItem(DENSITY_KEY, JSON.stringify(next));
  }, []);

  return { density, setDensity: update };
};

interface VisitRecord {
  count: number;
  last: number;
}

/**
 * 置顶标记 + 访问频次。
 * 只存在 localStorage，不写进云端数据结构，保证「数据不变」。
 */
export const useFrecency = () => {
  const [pins, setPins] = useState<string[]>(() => safeGetJSON<string[]>(PIN_KEY, []));
  const [visits, setVisits] = useState<Record<string, VisitRecord>>(() =>
    safeGetJSON<Record<string, VisitRecord>>(VISIT_KEY, {})
  );

  const togglePin = useCallback((id: string) => {
    setPins((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      safeSetItem(PIN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const recordVisit = useCallback((id: string) => {
    setVisits((prev) => {
      const next = {
        ...prev,
        [id]: { count: (prev[id]?.count || 0) + 1, last: Date.now() },
      };
      safeSetItem(VISIT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /** 0 ~ 6 之间的常用度，用于命令面板排序 */
  const visitScore = useCallback(
    (id: string) => {
      const record = visits[id];
      if (!record) return 0;
      const age = Date.now() - record.last;
      const day = 86400000;
      const recency = age < day ? 1 : age < day * 7 ? 0.6 : age < day * 30 ? 0.3 : 0.1;
      return Math.min(record.count * recency, 6);
    },
    [visits]
  );

  const pinSet = useMemo(() => new Set(pins), [pins]);

  return { pins: pinSet, togglePin, recordVisit, visitScore };
};
