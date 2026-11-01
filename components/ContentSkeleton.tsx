import React from 'react';

/** 首屏骨架屏：避免先闪一下示例数据再被云端数据覆盖 */
const ContentSkeleton: React.FC = () => (
  <div aria-hidden="true" className="animate-pulse">
    {/* 小组件 */}
    <div className="mb-6 flex gap-3 overflow-hidden">
      <div className="skeleton h-24 w-[40%] shrink-0 rounded-2xl md:w-[28%] xl:h-32 xl:w-[20%]" />
      <div className="skeleton h-24 w-[55%] shrink-0 rounded-2xl md:w-[40%] xl:h-32 xl:w-[35%]" />
      <div className="skeleton hidden h-24 w-[30%] shrink-0 rounded-2xl md:block xl:h-32 xl:w-[15%]" />
      <div className="skeleton hidden h-24 w-[45%] shrink-0 rounded-2xl md:block xl:h-32 xl:w-[30%]" />
    </div>

    {/* 搜索框 */}
    <div className="skeleton mx-auto mb-6 h-14 w-full max-w-3xl rounded-2xl" />

    {/* 分类卡片 */}
    <div className="flex flex-col gap-3">
      {[0, 1].map((index) => (
        <div key={index} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="mb-3 flex items-center gap-2">
            <div className="skeleton h-7 w-7 rounded-lg" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
