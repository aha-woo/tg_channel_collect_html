# 🤖 Telegram 头像获取功能说明

## 📋 概述

使用 Telegram Bot API 自动获取频道/群组/Bot 的头像，并更新到 `data.json` 文件中。

---

## ⚠️ 重要说明

**普通 favicon 服务无法获取 TG 频道头像！**

原因：
- Clearbit、Favicon.io 等只能获取网站 favicon
- 所有 `t.me/*` 链接只返回 Telegram 统一 Logo
- TG 频道/群组头像必须通过 **Telegram Bot API** 获取

---

## 🚀 快速开始

### 步骤1：创建 Telegram Bot

1. 在 Telegram 搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按提示设置 Bot 名称（比如：MyWebsiteBot）
4. 获得 Token（格式：`1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 步骤2：配置 Token

**方法1：使用 .env 文件（推荐）**

1. 在项目根目录创建 `.env` 文件
2. 添加以下内容：

```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**方法2：直接在脚本中配置（不推荐）**

如果不想使用 .env 文件，可以直接在 `fetch_telegram_avatars.py` 中修改：

```python
BOT_TOKEN = os.getenv('BOT_TOKEN', '你的token这里')
```

**注意**：需要安装 python-dotenv 库：
```bash
pip install python-dotenv
```

### 步骤3：设置虚拟环境

```bash
# 在VPS上执行
cd /var/www/tg_nav
bash setup_venv.sh
```

这会：
- 检查并安装 Python3
- 创建虚拟环境 `venv/`
- 安装依赖库（requests, python-dotenv）

### 步骤4：运行脚本

**使用 PM2 运行（推荐）：**

```bash
bash start_pm2.sh
```

**或直接运行：**

```bash
python fetch_telegram_avatars.py
```

脚本会：
- ✅ 自动扫描 `data.json` 中所有 TG 链接
- ✅ 获取每个频道/群组/Bot 的头像
- ✅ 下载到 `telegram_avatars/` 文件夹
- ✅ 更新 `data.json` 中的 logo 字段

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
pm2 logs fetch-telegram-avatars --lines 50  # 查看最后50行
pm2 restart fetch-telegram-avatars  # 重启
pm2 stop fetch-telegram-avatars     # 停止
pm2 delete fetch-telegram-avatars   # 删除进程
pm2 monit                           # 实时监控
```

### 查看日志

```bash
# 实时查看所有日志
pm2 logs fetch-telegram-avatars

# 查看错误日志
pm2 logs fetch-telegram-avatars --err

# 查看输出日志
pm2 logs fetch-telegram-avatars --out

# 清空日志
pm2 flush fetch-telegram-avatars
```

### 开机自启动

```bash
# 保存当前PM2进程列表
pm2 save

# 生成启动脚本
pm2 startup

# 按提示执行命令（通常是sudo开头的命令）
```

---

## ⚙️ 速率限制配置

### 当前配置（已优化，最大化避免限制）

脚本已优化为**最大化避免限制**：

```python
REQUEST_DELAY = 6.5  # 基础延迟（秒）
RANDOM_DELAY_RANGE = 3.5  # 随机延迟范围（秒）
# 最终延迟范围：6.5-10秒，平均约8秒
# 每秒约0.125个请求（远低于30个/秒的限制）

# 遇到429错误时
RATE_LIMIT_SLEEP_MIN = 3600  # 最小等待1小时
RATE_LIMIT_SLEEP_MAX = 5400  # 最大等待1.5小时
```

### 配置说明

- **请求间隔**：6.5-10秒（随机），避免被识别为机器人行为
- **速率限制**：每秒约0.125个请求，远低于30个/秒的限制
- **错误处理**：遇到429错误时等待1-1.5小时（随机）
- **重试机制**：最多重试3次，每次间隔10秒

### 自定义配置

如需调整，修改 `fetch_telegram_avatars.py` 文件顶部的配置：

```python
REQUEST_DELAY = 6.5  # 基础延迟（秒）
RANDOM_DELAY_RANGE = 3.5  # 随机延迟范围（秒）
RATE_LIMIT_SLEEP_MIN = 3600  # 429错误最小等待（秒）
RATE_LIMIT_SLEEP_MAX = 5400  # 429错误最大等待（秒）
```

---

## 🗑️ 自动清理失效频道

### 功能说明

脚本会自动检测并处理已失效的 Telegram 频道/群组/Bot。

### 配置选项

在 `fetch_telegram_avatars.py` 中配置：

```python
# 是否自动删除不存在的频道/群组
AUTO_DELETE_NOT_FOUND = True  # True=自动删除，False=仅标记不删除
DELETED_ITEMS_FILE = "deleted_items.json"  # 保存已删除条目的备份
```

### 两种模式

**模式1：自动删除（推荐）**

```python
AUTO_DELETE_NOT_FOUND = True
```

- ✅ 自动从 `data.json` 中删除不存在的条目
- ✅ 保持数据文件干净整洁
- ✅ 所有删除的条目都会备份到 `deleted_items.json`
- ✅ 可以随时恢复误删的数据

**模式2：仅标记**

```python
AUTO_DELETE_NOT_FOUND = False
```

- ⚠️ 不删除条目，仅在描述前添加 `[已失效]` 标记
- 适用于：想要保留历史记录，手动审核后再删除

### 会被删除的情况

当 Telegram API 返回以下错误时，条目会被标记为"不存在"：
- `chat not found` - 频道未找到
- `not found` - 不存在
- `deleted` - 已删除
- `deactivated` - 已停用
- `blocked` - 已封禁

### 恢复误删的数据

1. 打开 `deleted_items.json`
2. 找到误删的条目
3. 复制条目内容
4. 粘贴回 `data.json` 的相应位置
5. 删除多余字段（`username`, `reason`, `deleted_at`）

---

## 📁 文件结构

```
tg_html/
├── fetch_telegram_avatars.py  # 主脚本
├── ecosystem.config.js         # PM2配置文件
├── setup_venv.sh              # 虚拟环境设置脚本
├── start_pm2.sh               # PM2启动脚本
├── data.json                  # 数据文件（会被更新）
├── deleted_items.json         # 删除备份（自动生成）
├── fetch_progress.json        # 进度文件（自动生成）
├── telegram_avatars/          # 头像目录（自动生成）
└── .env                       # 配置文件（需手动创建）
```

---

## 📊 运行示例

```
[15/2000] 处理: @jiso - 极搜 JiSo
  ⏱️  已用: 0.5分钟 | 剩余: 4.5分钟
  ✅ 成功获取头像: telegram_avatars/jiso.jpg

...

============================================================
📊 处理统计：
  ✅ 成功获取: 1800 个
  ⏭️  跳过: 150 个
  ❌ 失败: 27 个
  🗑️  已删除: 23 个（频道不存在）
  📁 共更新: 1800 个头像
  ⏱️  总耗时: 5.2 分钟
  📁 头像保存在: telegram_avatars/ 目录
============================================================
```

---

## 🔍 常见问题

### Q1: 私有群组可以获取头像吗？
❌ 不可以。私有群组（joinchat链接）需要先加入才能获取信息。

### Q2: 获取头像需要多长时间？
⏱️ 约8秒/个（包含延迟），1000个链接大约需要2-3小时。

### Q3: 头像会更新吗？
🔄 不会自动更新。如果频道更换了头像，需要重新运行脚本。

### Q4: 遇到429错误怎么办？
⏸️ 脚本会自动等待1-1.5小时（随机），然后继续处理。

### Q5: 脚本运行报错？
检查：
- ✅ Python版本（需要3.6+）
- ✅ 安装依赖：`pip install requests python-dotenv`
- ✅ Token格式正确
- ✅ Bot没有被ban
- ✅ `.env` 文件配置正确

### Q6: 如何查看处理进度？
```bash
# 查看进度文件
cat fetch_progress.json

# 查看PM2日志
pm2 logs fetch-telegram-avatars
```

---

## 💡 最佳实践

### 首次运行

建议先使用"仅标记"模式，检查哪些频道被标记为失效：

```python
AUTO_DELETE_NOT_FOUND = False  # 仅标记，不删除
```

运行后，检查标记为 `[已失效]` 的条目，确认无误后改为自动删除模式。

### 定期清理

建议每月运行一次脚本，清理失效的频道/群组：

```bash
# 1. 确保.env文件配置正确
# 2. 运行脚本
python fetch_telegram_avatars.py

# 3. 检查备份文件
cat deleted_items.json

# 4. 上传更新后的data.json到服务器
```

### 头像存储

**方式A：放在服务器上**
```bash
# 将 telegram_avatars 文件夹上传到你的服务器
# 确保可以通过 https://yoursite.com/telegram_avatars/xxx.jpg 访问
```

**方式B：使用图床**
- 上传到：imgur.com、sm.ms、postimg.cc 等
- 获取在线URL
- 手动更新 data.json 中的 logo 字段

---

## 📝 配置说明

### ecosystem.config.js

```javascript
{
  name: 'fetch-telegram-avatars',     // 进程名称
  script: 'fetch_telegram_avatars.py', // 脚本文件
  interpreter: './venv/bin/python3',   // Python解释器（虚拟环境）
  cwd: '/var/www/tg_nav',             // 工作目录
  instances: 1,                        // 实例数量（1个）
  autorestart: true,                   // 自动重启
  watch: false,                        // 不监听文件变化
  max_memory_restart: '500M',          // 内存超过500M重启
}
```

---

## 🛠️ 故障排除

### 问题1：虚拟环境不存在

```bash
# 重新创建虚拟环境
bash setup_venv.sh
```

### 问题2：PM2找不到Python

检查 `ecosystem.config.js` 中的 `interpreter` 路径：

```bash
# 确认虚拟环境路径
ls -la venv/bin/python3

# 如果路径不对，修改 ecosystem.config.js
nano ecosystem.config.js
```

### 问题3：脚本无法启动

```bash
# 手动测试
source venv/bin/activate
python3 fetch_telegram_avatars.py

# 查看错误信息
pm2 logs fetch-telegram-avatars --err
```

### 问题4：内存占用过高

修改 `ecosystem.config.js`：

```javascript
max_memory_restart: '1G'  // 增加到1G
```

---

**生成时间**: 2025-01-XX  
**版本**: v2.0

