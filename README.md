# FlatNav - 个人导航仪表盘 (Personal Dashboard)

FlatNav 是一个基于 React 和 Cloudflare Pages 构建的现代化、极简主义个人导航主页。它集成了书签管理、实时天气、时钟、IP 信息等实用组件，并支持通过 Cloudflare KV 进行多端数据同步。

## ✨ 主要特性

*   **书签管理**：
    *   支持拖拽排序（需开启编辑模式）。
    *   自定义分类与颜色标记。
    *   自动获取网站图标 (Favicon)。
    *   支持添加、编辑、删除书签。
*   **多端同步 (Cloudflare KV)**：
    *   基于 Cloudflare KV 的云端存储。
    *   支持管理员密码登录，保护数据安全。
    *   具备本地缓存 (Local Storage) 降级方案，离线或无后端环境亦可使用。
*   **实用小组件**：
    *   🗓️ **日历**：包含农历日期显示。
    *   ☁️ **天气**：基于 OpenMeteo 的实时天气与未来预报（自动定位）。
    *   🕒 **时钟**：优雅的模拟时钟与数字时间。
    *   🌐 **IP 信息**：显示当前 IP 及地理位置。
*   **个性化设置**：
    *   **主题切换**：支持浅色 (Light)、深色 (Dark) 和 赛博朋克 (Cyberpunk) 主题。
    *   **背景动画**：内置基于 Canvas 的互动鱼群背景。
    *   **站点配置**：自定义网站标题、副标题及字号。
*   **多引擎搜索**：集成 Google、Bing、百度搜索。
*   **响应式设计**：完美适配桌面端与移动端，侧边栏支持折叠。

## 🛠 技术栈

*   **前端框架**: React 18
*   **构建工具**: Create React App (或 Vite)
*   **样式库**: Tailwind CSS
*   **图标库**: Lucide React
*   **后端/托管**: Cloudflare Pages + Functions
*   **数据库**: Cloudflare KV (Key-Value Storage)

## 📂 目录结构

```text
.
├── components/         # UI 组件 (书签、分类、弹窗、小组件、背景等)
├── functions/          # Cloudflare Pages Functions (后端 API)
│   └── api/
│       └── sync.js     # KV 数据同步接口逻辑
├── services/           # 服务层 (Gemini AI 等)
├── xcx/                # 微信小程序源码目录
├── App.tsx             # 主应用入口
├── constants.tsx       # 常量定义 (初始数据等)
└── types.ts            # TypeScript 类型定义
```

## 🚀 部署指南 (Cloudflare Pages)

本项目专为 Cloudflare Pages 设计，利用其 Functions 和 KV 功能实现无服务器后端。

### 1. Fork 仓库
将本项目 Fork 到你的 GitHub 账号。

### 2. 创建 Cloudflare Pages 项目
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Compute (Workers & Pages)** -> **Pages**。
3. 点击 **Connect to Git**，选择你的仓库。
4. **构建设置**:
    *   **Framework preset**: 无
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`

### 3. 绑定 KV Namespace (关键步骤)
为了启用云端同步功能，你需要创建一个 KV 命名空间并绑定到 Pages 项目。

1. 在 Cloudflare Dashboard 左侧菜单选择 **KV**。
2. 点击 **Create a Namespace**，命名为 `flatnav_data` (或任意名称)。
3. 回到你的 Pages 项目设置页面 -> **Settings** -> **Functions**。
4. 找到 **KV Namespace Bindings**。
5. 添加绑定：
    *   **Variable name**: `FLATNAV_KV` (⚠️ 必须完全一致)
    *   **KV Namespace**: 选择刚才创建的 `flatnav_data`。

### 4. 设置环境变量 (可选)
在 Pages 项目设置页面 -> **Settings** -> **Environment variables** 中添加：

*   `PASSWORD`: 设置管理员登录密码（默认为 `1211`）。
*   `API_KEY`: (可选) Google Gemini API Key，用于未来启用 AI 问答功能。

### 5. 重新部署
配置完成后，重新部署项目以使配置生效。

## 💻 本地开发

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **启动开发服务器**:
   ```bash
   npm start
   ```

   > **注意**：本地开发环境下，`/api/sync` 接口通常不可用（除非使用 Wrangler 模拟环境）。应用会自动检测并切换至 **本地模式**，数据将保存在浏览器的 `localStorage` 中。


## 🔐 登录与使用

1. 打开部署后的网站。
2. 点击侧边栏底部的 **管理员登录** 按钮（或未登录状态下的 User 图标）。
3. 输入你在环境变量中设置的 `PASSWORD` (默认 `1211`)。
4. 登录成功后，即可看到 **+ 添加书签**、**布局设置** 等管理入口。
5. 数据修改后会自动尝试同步至 Cloudflare KV。

## 📄 许可证

MIT License
