# PM2 管理脚本使用说明

## 📋 概述

使用 PM2 在虚拟环境中管理 Telegram 头像获取脚本，支持自动重启、日志管理等功能。

---

## 🚀 快速开始

### 步骤1：设置虚拟环境

```bash
# 在VPS上执行
cd /var/www/tg_nav
bash setup_venv.sh
```

这会：
- 检查并安装 Python3
- 创建虚拟环境 `venv/`
- 安装依赖库（requests, python-dotenv）

### 步骤2：配置 .env 文件

```bash
# 创建 .env 文件
nano .env
```

添加内容：
```env
BOT_TOKEN=你的Telegram Bot Token
```

保存退出（Ctrl+X, Y, Enter）

### 步骤3：启动脚本（PM2）

```bash
# 启动脚本
bash start_pm2.sh
```

---

## 📊 PM2 常用命令

### 查看状态

```bash
pm2 status
```

### 查看日志

```bash
# 查看所有日志
pm2 logs fetch-telegram-avatars

# 实时查看（最后50行）
pm2 logs fetch-telegram-avatars --lines 50

# 查看错误日志
pm2 logs fetch-telegram-avatars --err

# 查看输出日志
pm2 logs fetch-telegram-avatars --out
```

### 管理进程

```bash
# 停止脚本
pm2 stop fetch-telegram-avatars

# 重启脚本
pm2 restart fetch-telegram-avatars

# 删除进程
pm2 delete fetch-telegram-avatars

# 重新加载（0秒重启）
pm2 reload fetch-telegram-avatars
```

### 监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show fetch-telegram-avatars
```

---

## 📁 文件结构

```
/var/www/tg_nav/
├── fetch_telegram_avatars.py  # 主脚本
├── ecosystem.config.js        # PM2配置文件
├── setup_venv.sh              # 虚拟环境设置脚本
├── start_pm2.sh               # PM2启动脚本
├── .env                       # 配置文件（需手动创建）
├── venv/                      # 虚拟环境（自动创建）
├── logs/                      # 日志目录（自动创建）
│   ├── error.log              # 错误日志
│   ├── out.log                # 输出日志
│   └── combined.log           # 合并日志
├── data.json                  # 数据文件
├── fetch_progress.json        # 进度文件
└── deleted_items.json         # 删除备份
```

---

## ⚙️ 配置说明

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

### 速率限制配置

脚本已配置：
- **请求延迟**: 4-5秒（随机）
- **遇到429错误**: 随机睡眠5-6分钟
- **重试机制**: 最多3次

---

## 🔧 高级配置

### 修改速率限制

编辑 `fetch_telegram_avatars.py`：

```python
REQUEST_DELAY = 4.0  # 基础延迟（秒）
RANDOM_DELAY_RANGE = 1.0  # 随机延迟范围（秒）
RATE_LIMIT_SLEEP_MIN = 300  # 429错误后最小睡眠（秒）= 5分钟
RATE_LIMIT_SLEEP_MAX = 360  # 429错误后最大睡眠（秒）= 6分钟
```

### 修改PM2配置

编辑 `ecosystem.config.js`，然后：

```bash
pm2 reload ecosystem.config.js
```

---

## 📝 日志管理

### 查看日志

```bash
# 实时查看
pm2 logs fetch-telegram-avatars

# 查看最后100行
pm2 logs fetch-telegram-avatars --lines 100

# 清空日志
pm2 flush fetch-telegram-avatars
```

### 日志文件位置

- `logs/error.log` - 错误日志
- `logs/out.log` - 标准输出
- `logs/combined.log` - 合并日志

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

## 🔄 更新脚本

### 方法1：重新加载配置

```bash
# 修改 ecosystem.config.js 后
pm2 reload ecosystem.config.js
```

### 方法2：重启进程

```bash
pm2 restart fetch-telegram-avatars
```

### 方法3：停止后重新启动

```bash
pm2 stop fetch-telegram-avatars
pm2 delete fetch-telegram-avatars
bash start_pm2.sh
```

---

## 📊 监控和统计

### 实时监控

```bash
pm2 monit
```

显示：
- CPU使用率
- 内存使用率
- 日志输出
- 进程状态

### 查看统计信息

```bash
pm2 show fetch-telegram-avatars
```

显示：
- 运行时间
- 重启次数
- 内存使用
- CPU使用
- 日志文件路径

---

## 🚀 开机自启动

### 设置PM2开机自启动

```bash
# 保存当前PM2进程列表
pm2 save

# 生成启动脚本
pm2 startup

# 按提示执行命令（通常是sudo开头的命令）
```

### 禁用开机自启动

```bash
pm2 unstartup
```

---

## 📋 完整操作流程

### 首次设置

```bash
# 1. 进入目录
cd /var/www/tg_nav

# 2. 设置虚拟环境
bash setup_venv.sh

# 3. 配置 .env 文件
nano .env
# 添加: BOT_TOKEN=你的token

# 4. 启动脚本
bash start_pm2.sh

# 5. 查看状态
pm2 status
pm2 logs fetch-telegram-avatars
```

### 日常使用

```bash
# 查看日志
pm2 logs fetch-telegram-avatars

# 重启脚本（修改代码后）
pm2 restart fetch-telegram-avatars

# 停止脚本
pm2 stop fetch-telegram-avatars
```

---

## 💡 最佳实践

1. **定期查看日志**：确保脚本正常运行
2. **监控内存使用**：避免内存泄漏
3. **备份数据**：定期备份 `data.json` 和进度文件
4. **设置开机自启**：确保服务器重启后脚本自动运行
5. **使用日志轮转**：避免日志文件过大

---

## 📞 支持

如有问题，请检查：
1. 日志文件：`logs/error.log`
2. PM2状态：`pm2 status`
3. 虚拟环境：`source venv/bin/activate && python3 --version`

---

**生成时间**: 2025-11-04  
**版本**: v1.0

