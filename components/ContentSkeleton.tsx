import React from 'react';

/** 首屏骨架屏：布局与真实内容一致（移动一行三卡 / 桌面横向滚动），避免加载完成后布局跳变 */
const ContentSkeleton: React.FC = () => (
  <div aria-hidden="true" className="animate-pulse">
    {/* 小组件：移动端一行三卡（日期/天气/IP），桌面端横向滚动，与 DashboardWidgets 相同 */}
    <div className="mb-6 grid grid-cols-[1.1fr_0.9fr_1.1fr] gap-2 md:flex md:flex-nowrap md:gap-3 md:overflow-hidden xl:gap-4">
      <div className="skeleton h-24 w-full shrink-0 rounded-2xl md:w-[28%] xl:h-32 xl:w-[20%]" />
      <div className="skeleton h-24 w-full shrink-0 rounded-2xl md:w-[40%] xl:h-32 xl:w-[35%]" />
      <div className="skeleton hidden h-24 w-full shrink-0 rounded-2xl md:block md:w-[22%] xl:h-32 xl:w-[15%]" />
      <div className="skeleton h-24 w-full shrink-0 rounded-2xl md:w-[32%] xl:h-32 xl:w-[30%]" />
    </div>

    {/* 搜索框 */}
    <div className="skeleton mx-auto mb-6 h-14 w-full max-w-3xl rounded-2xl" />

    {/* 分类卡片 */}
    <div className="flex flex-col gap-3">
      {[0, 1].map((index) => (
        <div key={index} className="rounded-2xl border p-3 md:p-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="mb-3 flex items-center gap-2">
            <div className="skeleton h-7 w-7 rounded-lg" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
          <div className="bm-grid grid gap-1.5 sm:gap-2 md:gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
            {[0, 1, 2, 3, 4].map((cell) => (
              <div key={cell} className="skeleton h-10 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ContentSkeleton;
