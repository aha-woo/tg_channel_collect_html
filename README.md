# Telegram 群组频道导航

这是一个静态网页项目，用于展示 Telegram 群组和频道导航。

## 本地运行方法

由于需要使用 `fetch` API 加载 `uploaddata.md` 文件，建议使用本地服务器运行，避免 CORS 跨域问题。

### 方法一：使用 Python（推荐）

1. **双击运行批处理文件**（最简单）：
   - Windows: 双击 `start_server.bat`
   - 或者右键 `start_server.ps1` → 选择"使用 PowerShell 运行"

2. **手动启动**：
   ```bash
   # 在项目目录下执行
   python -m http.server 8000
   ```

3. **在浏览器中打开**：
   ```
   http://localhost:8000
   ```

### 方法二：使用 Node.js（如果已安装）

```bash
# 全局安装 http-server（仅需一次）
npm install -g http-server

# 启动服务器
http-server -p 8000
```

### 方法三：使用 VS Code Live Server

1. 在 VS Code 中安装 "Live Server" 扩展
2. 右键点击 `index.html` → 选择 "Open with Live Server"

### 方法四：直接打开（不推荐）

如果直接双击 `index.html` 文件，可能会因为浏览器的安全策略无法加载 `uploaddata.md` 文件。

如果遇到问题，请使用上述方法一（Python 服务器）。

## 文件说明

- `index.html` - 主页面
- `style.css` - 样式文件
- `script.js` - JavaScript 逻辑
- `uploaddata.md` - 数据源文件（Markdown 格式）
- `start_server.bat` - Windows 批处理启动脚本
- `start_server.ps1` - PowerShell 启动脚本

## 功能特性

- ✅ 左侧导航栏可展开/收起
- ✅ 卡片点击动画效果
- ✅ 自动获取网站 favicon 作为 logo
- ✅ 响应式设计，适配移动端
- ✅ 搜索功能
- ✅ 平滑滚动导航

