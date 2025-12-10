export const INITIAL_CATEGORIES = [
  { id: '1', name: '日常办公', color: 'bg-blue-500', hex: '#3b82f6' },
  { id: '2', name: '开发工具', color: 'bg-emerald-500', hex: '#10b981' },
  { id: '3', name: '设计灵感', color: 'bg-purple-500', hex: '#a855f7' },
  { id: '4', name: '阅读学习', color: 'bg-orange-500', hex: '#f97316' },
];

export const INITIAL_BOOKMARKS = [
  { id: '101', title: 'Gmail', url: 'https://mail.google.com', categoryId: '1', description: '谷歌邮箱服务' },
  { id: '102', title: 'Bilibili', url: 'https://www.bilibili.com', categoryId: '1', description: '国内知名的视频弹幕网站' },
  { id: '201', title: 'GitHub', url: 'https://github.com', categoryId: '2', description: '全球最大的代码托管平台' },
  { id: '202', title: 'Stack Overflow', url: 'https://stackoverflow.com', categoryId: '2', description: '程序开发问答社区' },
  { id: '203', title: 'ChatGPT', url: 'https://chat.openai.com', categoryId: '2', description: 'OpenAI 智能对话模型' },
  { id: '301', title: 'Dribbble', url: 'https://dribbble.com', categoryId: '3', description: '设计师作品分享平台' },
  { id: '302', title: 'Figma', url: 'https://figma.com', categoryId: '3', description: '在线协作界面设计工具' },
  { id: '401', title: '少数派', url: 'https://sspai.com', categoryId: '4', description: '高效工作生活数字社区' },
];

export const SEARCH_ENGINES = [
  { 
    id: 'google', 
    name: '谷歌', 
    urlTemplate: 'https://www.google.com/search?q='
  },
  { 
    id: 'bing', 
    name: '必应', 
    urlTemplate: 'https://www.bing.com/search?q='
  },
  { 
    id: 'baidu', 
    name: '百度', 
    urlTemplate: 'https://www.baidu.com/s?wd='
  }
];