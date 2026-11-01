/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  // 分类颜色由用户在数据里保存，运行时才拼出类名，这里显式保留，避免构建后丢样式
  safelist: [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
    'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-slate-500', 'bg-cyan-500',
    'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-lime-500', 'bg-sky-500',
    'bg-violet-500', 'bg-fuchsia-500', 'bg-green-500', 'bg-yellow-500',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        primary: '#2563eb',
        secondary: '#475569',
        background: '#f8fafc',
        surface: '#ffffff',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        bounceSoft: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
