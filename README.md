# Telegram 群组频道导航

这是一个静态网页项目，用于展示 Telegram 群组和频道导航。

---

## 📁 项目结构

### 核心文件
- `index-json.html` - 主页面（JSON版本）
- `style.css` - 样式文件
- `script-json.js` - JavaScript 逻辑
- `data/` - 数据目录（包含所有分类的JSON文件）
  - `index.json` - 分类索引文件
  - `*.json` - 各分类数据文件

### 配置文件
- `nginx_security.conf` - Nginx 安全配置模板
- `ecosystem.config.js` - PM2 配置文件
- `.env` - 环境变量（需手动创建，包含 BOT_TOKEN）

### 脚本文件
- `fetch_telegram_avatars.py` - Telegram 头像获取脚本
- `setup_venv.sh` - Python 虚拟环境设置脚本
- `start_pm2.sh` - PM2 启动脚本
- `start_server.bat` / `start_server.ps1` - 本地测试服务器启动脚本
- `git_commit.sh` - Git 提交脚本

### 文档文件
- `DEPLOY_CHECKLIST.md` - VPS 部署检查清单
- `VERSION_UPDATE.md` - 版本号更新说明
- `SECURITY.md` - 安全配置说明
- `README_AVATAR.md` - 头像获取功能说明

---

## 🚀 快速开始

### 本地运行

#### 方法一：使用 Python（推荐）

1. **双击运行批处理文件**（最简单）：
   - Windows: 双击 `start_server.bat`
   - 或者右键 `start_server.ps1` → 选择"使用 PowerShell 运行"

2. **手动启动**：
   ```bash
   python -m http.server 8000
   ```

3. **在浏览器中打开**：
   - Markdown版本：`http://localhost:8000/index.html`
   - JSON版本：`http://localhost:8000/index-json.html`

#### 方法二：使用 Node.js

```bash
npm install -g http-server
http-server -p 8000
```

#### 方法三：使用 VS Code Live Server

1. 安装 "Live Server" 扩展
2. 右键点击 `index.html` → 选择 "Open with Live Server"

---

## 📊 数据格式

### JSON 格式（推荐）

使用 `index-json.html` + `data/` 目录下的JSON文件

**优点：**
- ✅ 结构清晰，易于解析
- ✅ 支持完整的父子层级
- ✅ 每个条目都有独立的logo字段
- ✅ 易于批量导入和管理
- ✅ 支持图标配置

**数据结构：**
```json
{
  "categories": [
    {
      "parentName": "Telegram工具",
      "parentIcon": "fab fa-telegram",
      "children": [
        {
          "name": "搜索机器人",
          "icon": "fas fa-search",
          "items": [
            {
              "title": "机器人名称",
              "url": "https://t.me/bot",
              "description": "描述",
              "logo": ""
            }
          ]
        }
      ]
    }
  ]
}
```

### Markdown 格式（旧版）

使用 `index.html` + `uploaddata.md`

**优点：**
- ✅ 人类可读，容易手动编辑
- ✅ 无需JSON格式验证

**缺点：**
- ❌ 解析复杂，容易出错
- ❌ 不支持嵌套结构
- ❌ Logo信息难以存储

---

## 🤖 头像获取功能

### 配置 Telegram Bot

1. 在 Telegram 搜索 `@BotFather`
2. 发送 `/newbot` 创建 Bot
3. 获得 Token
4. 创建 `.env` 文件：
   ```env
   BOT_TOKEN=你的Bot_Token
   ```

### 运行头像获取脚本

```bash
# 设置虚拟环境
bash setup_venv.sh

# 使用 PM2 运行（推荐）
bash start_pm2.sh

# 或直接运行
python fetch_telegram_avatars.py
```

### 速率限制配置

脚本已优化为**最大化避免限制**：
- 请求间隔：6.5-10秒（随机）
- 每秒约0.125个请求（远低于30个/秒的限制）
- 遇到429错误时等待1-1.5小时

详细配置见 `fetch_telegram_avatars.py` 文件顶部。

---

## 🚀 VPS 部署

### 1. 上传文件

```bash
# 使用 Git
cd /var/www/tg_nav
git pull origin main

# 或使用 SCP
scp -r * root@VPS_IP:/var/www/tg_nav/
```

### 2. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/tg_nav
# 复制 nginx_security.conf 的内容

sudo nginx -t
sudo systemctl reload nginx
```

### 3. 更新版本号（重要！）

如果修改了 CSS/JS 文件，必须更新版本号：

```html
<link rel="stylesheet" href="style.css?v=20251114_v1">
<script src="script-json.js?v=20251114_v1"></script>
<meta name="app-version" content="20251114_v1">
```

详细说明见：`DEPLOY_CHECKLIST.md`

### 4. 完整部署清单

详细步骤见：`DEPLOY_CHECKLIST.md`

---

## ⚙️ PM2 管理

### 启动脚本

```bash
bash start_pm2.sh
```

### 常用命令

```bash
pm2 status                          # 查看状态
pm2 logs fetch-telegram-avatars     # 查看日志
pm2 restart fetch-telegram-avatars  # 重启
pm2 stop fetch-telegram-avatars     # 停止
```

详细说明见：`README_AVATAR.md`

---

## 🔒 安全配置

- Nginx 安全头配置
- 敏感文件访问限制
- Content Security Policy
- 速率限制防护

详细说明见：`SECURITY.md`

---

## ✨ 功能特性

- ✅ 左侧导航栏可展开/收起
- ✅ 卡片点击动画效果
- ✅ 自动获取网站 favicon 作为 logo
- ✅ Telegram 频道/群组头像获取
- ✅ 响应式设计，适配移动端
- ✅ 搜索功能
- ✅ 平滑滚动导航
- ✅ 广告位和页脚
- ✅ 访问计数器（假数据）

---

## 📝 版本更新

- **当前版本**：v=20251114_v1
- **更新说明**：清理冗余文件，移除data.json依赖，优化代码结构

每次修改 CSS/JS 后记得更新版本号，详见：`DEPLOY_CHECKLIST.md`

---

## 📚 相关文档

- `DEPLOY_CHECKLIST.md` - 部署检查清单
- `VERSION_UPDATE.md` - 版本号更新说明
- `SECURITY.md` - 安全配置指南
- `README_AVATAR.md` - 头像获取功能说明

---

## 💡 注意事项

1. **版本号更新**：修改 CSS/JS 后必须更新版本号
2. **浏览器缓存**：部署后使用 `Ctrl + F5` 强制刷新
3. **速率限制**：头像获取脚本已优化，避免触发限制
4. **数据备份**：修改数据前建议备份 `data/` 目录

---

**生成时间**: 2025-01-XX  
**维护者**: dianbaodaohang
