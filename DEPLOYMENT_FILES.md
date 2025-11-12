# 部署文件清单

## 📦 必要文件（需要上传到Git和VPS）

### 1. 前端文件
- `index.html` - 主页面
- `index-json.html` - JSON数据页面
- `style.css` - 样式文件
- `script.js` - 主脚本（如果使用）
- `script-json.js` - JSON数据脚本
- `script-json-lazy.js` - 懒加载脚本（如果使用）

### 2. 数据文件
- `data/` 目录下的所有 `.json` 文件：
  - `index.json` - 分类索引
  - `Telegram.json`
  - `成人乐园.json`
  - `ACG动漫.json`
  - `书籍音乐影视.json`
  - `游戏.json`
  - `娱乐场信息.json`
  - `金融理财.json`
  - `新闻资讯.json`
  - `社交聊天.json`
  - `技术工具.json`
  - `生活娱乐.json`
  - `其他.json`
  - 以及其他分类JSON文件

### 3. 资源文件
- `telegram_avatars/` 目录 - 所有头像图片
- `tglogo.jpg` - 网站图标

### 4. 配置文件（可选，但推荐）
- `ecosystem.config.js` - PM2配置文件
- `nginx_security.conf` - Nginx安全配置
- `start_pm2.sh` - PM2启动脚本（Linux）

### 5. 文档文件（可选）
- `README.md` - 项目说明

---

## ❌ 不需要的文件（不要上传到Git）

### 1. 开发脚本
- 所有 `.py` 文件（Python数据处理脚本）
- `download/` 目录（原始数据源）
- `爬下来的TG 频道信息/` 目录（原始数据）

### 2. 临时文件
- `telegram_descriptions/` 目录
- `data.json`（如果存在旧文件）

### 3. 本地开发文件
- `start_server.bat` - Windows本地测试
- `start_server.ps1` - PowerShell本地测试
- `start_server.sh` - 本地测试脚本（如果有）

### 4. 文档文件（可选，看需求）
- 各种 `.md` 文档（除了README.md）
- `分类结构规划.md`
- `分类结构思维导图.md`
- `fix_encoding_guide.md`
- 等等

---

## 📋 部署步骤

### 1. 创建 .gitignore 文件
```bash
# 忽略开发脚本
*.py
download/
爬下来的TG 频道信息/
telegram_descriptions/

# 忽略本地测试文件
start_server.bat
start_server.ps1
*.bat
*.ps1

# 忽略临时文件
data.json
*.log

# 忽略文档（可选）
*.md
!README.md

# 忽略IDE文件
.vscode/
.idea/
*.swp
*.swo
*~

# 忽略系统文件
.DS_Store
Thumbs.db
```

### 2. 上传到Git
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 3. 在VPS上部署
```bash
# 克隆仓库
git clone <your-repo-url>
cd tg_html

# 使用PM2部署（推荐）
pm2 start ecosystem.config.js

# 或使用Nginx + 静态文件服务
# 配置Nginx指向项目目录
```

---

## 🎯 最小部署文件清单

如果只部署最小必要文件，只需要：

```
tg_html/
├── index.html
├── index-json.html
├── style.css
├── script-json.js (或 script-json-lazy.js)
├── tglogo.jpg
├── data/
│   └── *.json (所有分类JSON文件)
├── telegram_avatars/
│   └── *.jpg (所有头像文件)
└── ecosystem.config.js (可选)
```

---

## 📊 文件大小估算

- HTML/CSS/JS: ~500KB
- JSON数据文件: ~50-100MB（取决于数据量）
- 头像图片: ~100-500MB（取决于数量）
- **总计**: ~150-600MB

