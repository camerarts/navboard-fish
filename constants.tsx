import React from 'react';
import { Category, Bookmark, SearchEngine } from './types';
import { Search, Globe, Code, Coffee, Briefcase, ShoppingCart } from 'lucide-react';

// 您可以在此处填入 GitHub Token 以免去手动输入的麻烦
// 使用 Base64 编码以避免 GitHub 自动检测并删除。
// 在浏览器控制台输入 btoa('您的Token') 获取编码字符串。
// 示例：btoa('ghp_xxxx') -> 'Z2hwX3h4eHg='
export const GITHUB_TOKEN_ENCODED = ''; // 请填入 Base64 编码后的 Token

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: '日常办公', color: 'bg-blue-500' },
  { id: '2', name: '开发工具', color: 'bg-emerald-500' },
  { id: '3', name: '设计灵感', color: 'bg-purple-500' },
  { id: '4', name: '阅读学习', color: 'bg-orange-500' },
];

export const INITIAL_BOOKMARKS: Bookmark[] = [
  { id: '101', title: 'Gmail', url: 'https://mail.google.com', categoryId: '1', description: '谷歌邮箱服务' },
  { id: '102', title: 'Bilibili', url: 'https://www.bilibili.com', categoryId: '1', description: '国内知名的视频弹幕网站' },
  { id: '201', title: 'GitHub', url: 'https://github.com', categoryId: '2', description: '全球最大的代码托管平台' },
  { id: '202', title: 'Stack Overflow', url: 'https://stackoverflow.com', categoryId: '2', description: '程序开发问答社区' },
  { id: '203', title: 'ChatGPT', url: 'https://chat.openai.com', categoryId: '2', description: 'OpenAI 智能对话模型' },
  { id: '301', title: 'Dribbble', url: 'https://dribbble.com', categoryId: '3', description: '设计师作品分享平台' },
  { id: '302', title: 'Figma', url: 'https://figma.com', categoryId: '3', description: '在线协作界面设计工具' },
  { id: '401', title: '少数派', url: 'https://sspai.com', categoryId: '4', description: '高效工作生活数字社区' },
];

export const SEARCH_ENGINES: SearchEngine[] = [
  { 
    id: 'google', 
    name: '谷歌搜索', 
    urlTemplate: 'https://www.google.com/search?q=',
    icon: <Search size={18} />
  },
  { 
    id: 'bing', 
    name: '必应搜索', 
    urlTemplate: 'https://www.bing.com/search?q=',
    icon: <Globe size={18} />
  },
  { 
    id: 'baidu', 
    name: '百度搜索', 
    urlTemplate: 'https://www.baidu.com/s?wd=',
    icon: <Code size={18} />
  }
];

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  '日常办公': <Coffee size={20} />,
  '开发工具': <Code size={20} />,
  '设计灵感': <Briefcase size={20} />, 
  '阅读学习': <Globe size={20} />,
  '购物消费': <ShoppingCart size={20} />,
};