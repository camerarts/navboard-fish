import { RefObject, useEffect, useState } from 'react';

/**
 * 滚动联动：滚动容器滚动时，计算哪个分区正处于视口上方，返回其 DOM id。
 * 不依赖 IntersectionObserver 的 rootMargin 猜测，直接用位置计算，结果更可预测。
 */
export const useScrollSpy = (
  ids: string[],
  rootRef: RefObject<HTMLElement | null>,
  offset = 160
): string | null => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const key = ids.join('|');

  useEffect(() => {
    const root = rootRef.current;
    if (!root || ids.length === 0) return;

    let frame = 0;

    const compute = () => {
      frame = 0;
      const rootTop = root.getBoundingClientRect().top;

      // 以「视口上方第一个越过分区标题线」的分区为准，
      // 不用滚动到底就高亮最后一个的写法，避免视线还在上面时高亮跑到最下面
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top - rootTop;
        if (top <= offset) current = id;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(compute);
    };

    compute();
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset, rootRef]);

  return activeId;
};
