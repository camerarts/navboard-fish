import React from 'react';
import Modal from './Modal';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUPS: { title: string; items: { keys: string[]; desc: string }[] }[] = [
  {
    title: '全局',
    items: [
      { keys: ['⌘', 'K'], desc: '打开命令面板（Windows 用 Ctrl）' },
      { keys: ['/'], desc: '把光标放进搜索框' },
      { keys: ['?'], desc: '打开这个快捷键面板' },
      { keys: ['Esc'], desc: '关闭面板 / 菜单 / 收起建议' },
    ],
  },
  {
    title: '搜索与打开',
    items: [
      { keys: ['↑', '↓'], desc: '在建议列表里上下选择' },
      { keys: ['Enter'], desc: '打开选中项；没选中就上网搜' },
      { keys: ['1', '–', '9'], desc: '直接打开当前分类的前 9 个书签' },
    ],
  },
  {
    title: '鼠标 / 触屏',
    items: [
      { keys: ['悬停', '⋯'], desc: '书签卡片右侧的更多操作' },
      { keys: ['右键'], desc: '打开方式、复制链接、置顶、编辑、删除' },
      { keys: ['拖动'], desc: '拖动书签换分类；「整理分类」下可拖分类标题排序' },
    ],
  },
];

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd
    className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border px-1.5 text-[10px] font-semibold"
    style={{
      borderColor: 'var(--border-color)',
      background: 'var(--bg-subtle)',
      color: 'var(--text-secondary)',
    }}
  >
    {children}
  </kbd>
);

const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="lg"
    title="键盘快捷键"
    subtitle="用得最多的是 ⌘K 和 /，其余都是锦上添花"
  >
    <div className="grid gap-5 sm:grid-cols-2">
      {GROUPS.map((group) => (
        <section key={group.title}>
          <h4
            className="mb-2 text-[10.5px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            {group.title}
          </h4>
          <ul className="space-y-1.5">
            {group.items.map((item) => (
              <li key={item.desc} className="flex items-start gap-2">
                <span className="flex shrink-0 items-center gap-0.5">
                  {item.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </span>
                <span className="text-[12px] leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {item.desc}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </Modal>
);

export default ShortcutsHelp;
