# Telegram 群组频道导航

一个现代化的静态网页项目，用于展示 Telegram 群组和频道导航，支持分类管理、搜索功能和订单收集。

---

## 📋 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [数据管理](#数据管理)
- [订单收集功能](#订单收集功能)
- [VPS 部署](#vps-部署)
- [版本管理](#版本管理)
- [相关文档](#相关文档)

---

## 📖 项目简介

这是一个基于静态 HTML/CSS/JavaScript 的 Telegram 导航网站，具有以下特点：

- 🎨 **现代化设计**：响应式布局，支持移动端和桌面端
- 📊 **数据分离**：使用 JSON 文件存储数据，易于管理和更新
- 🔍 **搜索功能**：快速搜索群组和频道
- 📦 **订单管理**：集成 Telegram Premium 代开服务订单收集功能
- ⚡ **高性能**：静态文件，加载速度快

---

## ✨ 功能特性

### 核心功能
- ✅ 左侧导航栏（可展开/收起）
- ✅ 分类展示（支持多级分类）
- ✅ 卡片点击动画效果
- ✅ 搜索功能（实时搜索）
- ✅ 响应式设计（移动端适配）
- ✅ 访问计数器
- ✅ 广告位支持

### 数据管理
- ✅ JSON 格式数据存储
- ✅ 自动获取网站 favicon 作为 logo
- ✅ Telegram 频道/群组头像获取（通过 Bot API）
- ✅ 数据文件分离（按分类存储）

### 订单收集（新增）
- ✅ Telegram Premium 代开服务页面
- ✅ 订单提交和验证
- ✅ 订单保存（本地存储 + 服务器文件）
- ✅ Telegram Bot 通知

---

## 📁 项目结构

```
tg_html/
├── 📄 核心文件
│   ├── index-json.html          # 主页面（JSON版本）
│   ├── telegram-premium.html    # Telegram Premium 代开页面
│   ├── style.css                # 样式文件
│   └── script-json.js           # JavaScript 逻辑
│
├── 📂 数据目录
│   └── data/
│       ├── index.json           # 分类索引文件
│       ├── Telegram.json        # Telegram 分类数据
│       ├── ACG动漫.json         # ACG动漫分类数据
│       └── ...                  # 其他分类JSON文件
│
├── 📂 资源文件
│   ├── telegram_avatars/        # Telegram 头像图片
│   └── tglogo.jpg               # 网站图标
│
├── 🔧 配置文件
│   ├── nginx_security.conf      # Nginx 安全配置模板
│   ├── ecosystem.config.js      # PM2 配置文件
│   └── .env                     # 环境变量（需手动创建）
│
├── 🐍 Python 脚本
│   ├── fetch_telegram_avatars.py # 订单收集脚本（原头像获取功能已注释）
│   └── setup_venv.sh            # 虚拟环境设置脚本
│
├── 🌐 PHP 脚本
│   └── save_order.php           # 订单保存接口
│
├── 📜 启动脚本
│   ├── start_server.bat         # Windows 本地测试服务器
│   ├── start_server.ps1         # PowerShell 启动脚本
│   ├── start_pm2.sh             # PM2 启动脚本（Linux）
│   └── git_commit.sh            # Git 提交脚本
│
└── 📚 文档文件
    ├── README.md                 # 项目说明（本文件）
    ├── DEPLOY_CHECKLIST.md       # VPS 部署检查清单
    └── PERFORMANCE_OPTIMIZATION.md # 性能优化说明
```

---

## 🚀 快速开始

### 本地运行

#### 方法一：使用 Python（推荐）

**Windows 用户：**
```bash
# 双击运行批处理文件
start_server.bat

# 或使用 PowerShell
.\start_server.ps1
```

**Linux/Mac 用户：**
```bash
python3 -m http.server 8000
```

然后在浏览器中打开：`http://localhost:8000/index-json.html`

#### 方法二：使用 Node.js

```bash
npm install -g http-server
http-server -p 8000
```

#### 方法三：使用 VS Code Live Server

1. 安装 "Live Server" 扩展
2. 右键点击 `index-json.html` → 选择 "Open with Live Server"

---

## 📊 数据管理

### 数据格式

项目使用 JSON 格式存储数据，结构清晰，易于管理。

**数据结构：**
```json
{
  "meta": {
    "version": "1.0",
    "lastUpdated": "2025-11-15"
  },
  "categories": [
    {
      "id": "telegram",
      "parentName": "Telegram工具",
      "parentIcon": "fab fa-telegram",
      "hidden": false,
      "children": [
        {
          "name": "搜索机器人",
          "icon": "fas fa-search",
          "items": [
            {
              "title": "机器人名称",
              "url": "https://t.me/bot",
              "description": "描述信息",
              "logo": "telegram_avatars/bot.jpg"
            }
          ]
        }
      ]
    }
  ]
}
```

### 数据文件说明

- `data/index.json` - 分类索引文件，定义所有分类的结构
- `data/*.json` - 各分类的具体数据文件
- 每个分类的数据文件独立存储，便于管理和更新

### 添加新数据

1. 编辑对应的分类 JSON 文件（如 `data/Telegram.json`）
2. 添加新的 `items` 条目
3. 刷新页面查看效果

---

## 📦 订单收集功能

### 功能说明

项目集成了 Telegram Premium 代开服务的订单收集功能：

- **订单页面**：`telegram-premium.html`
- **订单接口**：`save_order.php`
- **订单处理**：`fetch_telegram_avatars.py`

### 配置步骤

1. **配置 Telegram Bot Token**

   创建 `.env` 文件：
   ```env
   BOT_TOKEN=你的Bot_Token
   ADMIN_USER_ID=你的Telegram用户ID
   ```

   - 获取 Bot Token：在 Telegram 搜索 `@BotFather`，发送 `/newbot` 创建 Bot
   - 获取用户 ID：在 Telegram 搜索 `@userinfobot`，发送任意消息获取你的用户 ID

2. **订单存储位置**

   - **浏览器本地**：`localStorage`（`tg_premium_orders`）
   - **服务器文件**：`orders.json`（通过 PHP 接口保存）

3. **订单处理流程**

   ```
   用户提交订单
   → save_order.php 接收订单
   → 保存到 orders.json
   → 调用 Python 脚本
   → 发送 Telegram 通知到管理员
   ```

### 注意事项

- ⚠️ `fetch_telegram_avatars.py` 已改为订单收集脚本，原头像获取功能已注释但保留
- ⚠️ 该脚本不需要作为 PM2 服务运行，由 PHP 接口按需调用
- ⚠️ 如果之前配置了 PM2 运行此脚本，请停止该服务

---

## 🚀 VPS 部署

### 1. 上传文件

```bash
# 使用 Git（推荐）
cd /var/www/tg_nav
git pull origin main

# 或使用 SCP
scp -r * root@VPS_IP:/var/www/tg_nav/
```

### 2. 配置 Nginx

```bash
# 编辑 Nginx 配置
sudo nano /etc/nginx/sites-available/tg_nav

# 复制 nginx_security.conf 的内容到配置文件

# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx
```

### 3. 配置 PHP（用于订单接口）

确保服务器已安装 PHP 并配置好：

```bash
# 检查 PHP 版本
php -v

# 确保 PHP-FPM 运行
sudo systemctl status php-fpm
```

### 4. 配置 Python 环境（用于订单处理）

```bash
# 设置虚拟环境
bash setup_venv.sh

# 安装依赖
source venv/bin/activate
pip install requests python-dotenv
```

### 5. 更新版本号（重要！）

如果修改了 CSS/JS 文件，必须更新版本号以清除浏览器缓存：

**在 `index-json.html` 中更新：**
```html
<meta name="app-version" content="20251115_v1">
<link rel="stylesheet" href="style.css?v=20251115_v1">
<script src="script-json.js?v=20251115_v1"></script>
```

**版本号格式：** `YYYYMMDD_vN`（日期_版本号）

### 6. 完整部署清单

详细步骤和检查清单请参考：`DEPLOY_CHECKLIST.md`

---

## 🔄 版本管理

### 当前版本

- **当前版本**：`20251115_v1`
- **最后更新**：2025-11-15

### 版本号更新规则

每次修改 CSS/JS 文件后，必须更新版本号：

1. 更新 `index-json.html` 中的版本号
2. 更新 `README.md` 中的当前版本
3. 提交到 Git 并推送到远程仓库

**版本号格式：**
- `YYYYMMDD_vN` - 日期_版本号
- 例如：`20251115_v1`、`20251115_v2`

### 更新日志

- **20251115_v1**：添加 Telegram Premium 代开服务页面和订单收集功能
- **20251114_v1**：清理冗余文件，移除 data.json 依赖，优化代码结构

---

## 📚 相关文档

- 📋 [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) - VPS 部署检查清单
- ⚡ [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md) - 性能优化说明

---

## 💡 注意事项

### 开发注意事项

1. **版本号更新**：修改 CSS/JS 后必须更新版本号
2. **浏览器缓存**：部署后使用 `Ctrl + F5` 强制刷新
3. **数据备份**：修改数据前建议备份 `data/` 目录
4. **JSON 格式**：确保 JSON 文件格式正确，可使用在线工具验证

### 部署注意事项

1. **文件权限**：确保 Nginx 有读取权限
2. **PHP 配置**：确保 PHP 可以执行 `save_order.php`
3. **Python 环境**：订单处理脚本需要 Python 3.x 和必要的依赖
4. **环境变量**：确保 `.env` 文件已正确配置

### 订单功能注意事项

1. **PM2 服务**：`fetch_telegram_avatars.py` 不需要作为 PM2 服务运行
2. **Bot Token**：确保 Bot Token 和用户 ID 配置正确
3. **订单文件**：`orders.json` 文件会自动创建，确保目录有写入权限

---

## 🔧 故障排查

### 常见问题

**1. 页面显示空白**
- 检查浏览器控制台错误
- 确认 `data/index.json` 文件存在且格式正确
- 检查网络请求是否成功

**2. 订单无法提交**
- 检查 PHP 是否正常运行
- 检查 `save_order.php` 文件权限
- 查看服务器错误日志

**3. Telegram 通知未收到**
- 检查 `.env` 文件中的 `BOT_TOKEN` 和 `ADMIN_USER_ID`
- 确认 Bot 已启动（向 Bot 发送 `/start`）
- 检查 Python 脚本执行日志

---

## 📝 更新记录

- **2025-11-15**：添加 Telegram Premium 代开服务页面和订单收集功能
- **2025-11-14**：清理冗余文件，优化项目结构
- **2025-11-13**：数据文件分离，支持按分类存储

---

**维护者**: dianbaodaohang  
**最后更新**: 2025-11-15
