import { getDomain } from './utils';

/**
 * 轻量模糊匹配：
 * - 大小写不敏感
 * - 子序列匹配（"gh" 能命中 "GitHub"）
 * - 连续命中 / 开头命中 / 边界命中 加权，用于排序
 * 返回分数，-1 表示不匹配
 */
export const fuzzyScore = (query: string, target: string): number => {
  if (!query) return 0;
  if (!target) return -1;

  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();

  // 直接子串命中，给最高权重
  const idx = t.indexOf(q);
  if (idx === 0) return 1000 - t.length;
  if (idx > 0) {
    const boundaryBonus = /[\s\-_./]/.test(t[idx - 1]) ? 400 : 0;
    return 700 + boundaryBonus - idx - t.length * 0.5;
  }

  // 子序列匹配
  let qi = 0;
  let score = 0;
  let streak = 0;
  let lastMatch = -2;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak = ti === lastMatch + 1 ? streak + 1 : 1;
      const boundary = ti === 0 || /[\s\-_./]/.test(t[ti - 1]) ? 30 : 0;
      score += 10 + streak * 12 + boundary;
      lastMatch = ti;
      qi++;
    }
  }

  if (qi < q.length) return -1;
  return Math.max(0, score - t.length * 0.3);
};
