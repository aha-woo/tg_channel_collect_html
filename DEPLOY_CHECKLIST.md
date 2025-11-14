# VPS 部署检查清单

## 📦 必要文件清单

### 1. 前端文件
- `index-json.html` - 主页面（JSON版本）
- `style.css` - 样式文件
- `script-json.js` - JSON数据脚本

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
- `fetch_telegram_avatars.py` - 头像获取脚本

### 5. 文档文件（可选）
- `README.md` - 项目说明

---

## 📋 部署后需要做的事情

### ✅ 1. 上传更新的文件到VPS

```bash
# 在本地执行，将更新的文件上传到VPS
scp index-json.html style.css script-json.js root@你的VPS_IP:/var/www/tg_nav/
```

或者使用Git：
```bash
# 在VPS上执行
cd /var/www/tg_nav
git pull origin main  # 或你的分支名
```

---

### ✅ 2. 重新加载 Nginx（推荐）

虽然静态文件通常不需要重启，但为了确保生效，建议重新加载：

```bash
# 测试Nginx配置（重要！）
sudo nginx -t

# 如果测试通过，重新加载Nginx（不中断服务）
sudo systemctl reload nginx

# 或者重启Nginx（会短暂中断服务）
sudo systemctl restart nginx
```

**说明**：
- `reload`：平滑重启，不中断现有连接，推荐使用
- `restart`：完全重启，会短暂中断服务
- 如果修改了Nginx配置文件，必须先执行 `nginx -t` 测试

---

### ✅ 3. 检查 PM2 进程状态（如果使用了Python脚本）

```bash
# 查看PM2进程状态
pm2 status

# 查看日志
pm2 logs fetch-telegram-avatars

# 如果脚本出现异常，重启它
pm2 restart fetch-telegram-avatars
```

**注意**：
- 如果只修改了HTML/CSS/JS文件，**不需要**重启PM2
- 如果修改了 `fetch_telegram_avatars.py` 或 `ecosystem.config.js`，需要重启PM2

---

### ✅ 4. 验证网站是否正常

```bash
# 测试网站是否可访问
curl -I http://你的域名或IP

# 检查HTTP响应头
curl -I http://你的域名或IP | grep -i "content-type"
```

在浏览器中访问网站，检查：
- ✅ 页面是否正常加载
- ✅ 样式是否生效
- ✅ JavaScript功能是否正常
- ✅ 广告横幅是否显示
- ✅ 广告位是否显示
- ✅ 页脚是否显示

---

### ✅ 5. 更新版本号（重要！如果修改了CSS/JS）

**如果修改了 `style.css` 或 `script-json.js`，必须更新版本号！**

#### 为什么需要版本号？

由于 Nginx 配置了静态文件缓存（CSS/JS 文件缓存 1 年），浏览器会缓存旧版本的文件。添加版本号参数可以强制浏览器下载新版本。

#### 何时需要更新版本号？

**只有在修改了以下文件时才需要更新版本号：**
- `style.css` - 修改了样式
- `script-json.js` - 修改了 JavaScript 逻辑

**不需要更新版本号的情况：**
- 只修改了 HTML 文件（HTML 不缓存）
- 只修改了数据文件（data/*.json）
- 只修改了 Python 脚本或配置文件

#### 如何更新版本号？

**方法一：使用日期作为版本号（推荐）**

每次更新时使用当天日期，格式：`YYYYMMDD_vN`

例如：
- 2025年1月5日 → `v=20250105_v1`
- 2025年1月10日 → `v=20250110_v1`

**在 `index-json.html` 中更新：**
```html
<!-- 版本号：20251110_v17（需与 meta app-version 和 script-json.js 保持一致） -->
<link rel="stylesheet" href="style.css?v=20251110_v17" id="style-css">
<script src="script-json.js?v=20251110_v17"></script>
```

**同时更新 meta 标签：**
```html
<meta name="app-version" content="20251110_v17">
```

#### 更新步骤

1. **修改 CSS 或 JS 文件**
2. **更新版本号**
   - 在 `index-json.html` 中找到所有版本号
   - 将版本号改为新的（如 `v=20250106_v1`）
   - 同时更新 `meta name="app-version"` 标签
3. **提交到 Git**
   ```bash
   git add .
   git commit -m "更新样式/功能 v=20250106"
   git push
   ```
4. **在 VPS 上拉取更新**
   ```bash
   cd /var/www/tg_nav
   git pull origin main
   sudo systemctl reload nginx
   ```
5. **清除浏览器缓存**
   - 按 `Ctrl + F5` 强制刷新
   - 或者使用无痕模式测试

#### 批量替换版本号（快速方法）

使用查找替换功能，一次性更新所有版本号：
- **查找：** `v=20251110_v17`
- **替换为：** `v=20250106_v1`（新版本号）

在 `index-json.html` 中执行替换，包括：
- `<link rel="stylesheet" href="style.css?v=...">`
- `<script src="script-json.js?v=...">`
- `<meta name="app-version" content="...">`

---

### ✅ 6. 清除浏览器缓存（如果看不到更新）

如果修改后看不到效果，可能是浏览器缓存：

**方法1：强制刷新**
- Windows: `Ctrl + F5` 或 `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**方法2：清除缓存**
- Chrome: 设置 → 隐私和安全 → 清除浏览数据

**方法3：使用无痕模式测试**
- `Ctrl + Shift + N` (Chrome) 打开无痕模式
- 访问网站查看是否显示新版

**方法4：开发者工具禁用缓存**
- 按 `F12` 打开开发者工具
- Network 标签 → 勾选 "Disable cache"
- 刷新页面

---

## 🔄 不同情况的处理方式

### 情况1：只修改了 HTML/CSS/JS 文件
```bash
# 1. 上传文件
scp index-json.html style.css script-json.js root@VPS_IP:/var/www/tg_nav/

# 2. 重新加载Nginx（推荐）
sudo nginx -t && sudo systemctl reload nginx

# 3. 验证（可选）
curl -I http://你的域名或IP
```

### 情况2：修改了 Nginx 配置文件
```bash
# 1. 编辑配置文件
sudo nano /etc/nginx/sites-available/tg_nav

# 2. 测试配置（必须！）
sudo nginx -t

# 3. 如果测试通过，重新加载
sudo systemctl reload nginx

# 4. 如果测试失败，检查错误信息并修复
```

### 情况3：修改了 Python 脚本或 PM2 配置
```bash
# 1. 上传文件
scp fetch_telegram_avatars.py ecosystem.config.js root@VPS_IP:/var/www/tg_nav/

# 2. 重新加载PM2配置
pm2 reload ecosystem.config.js

# 或者重启进程
pm2 restart fetch-telegram-avatars

# 3. 查看日志确认
pm2 logs fetch-telegram-avatars
```

### 情况4：首次部署或完全重新部署
```bash
# 1. 上传所有文件
scp -r * root@VPS_IP:/var/www/tg_nav/

# 2. 设置文件权限
sudo chown -R www-data:www-data /var/www/tg_nav
sudo chmod -R 755 /var/www/tg_nav

# 3. 测试并重载Nginx
sudo nginx -t && sudo systemctl reload nginx

# 4. 启动PM2（如果使用）
cd /var/www/tg_nav
bash start_pm2.sh
```

---

## 🚨 常见问题排查

### 问题1：修改后看不到效果
1. **检查文件是否上传成功**
   ```bash
   ls -la /var/www/tg_nav/index-json.html
   cat /var/www/tg_nav/index-json.html | head -20
   ```

2. **清除浏览器缓存**（Ctrl+F5）

3. **检查Nginx是否正常加载**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **查看Nginx错误日志**
   ```bash
   sudo tail -f /var/log/nginx/tg_nav_error.log
   ```

### 问题2：Nginx配置测试失败
```bash
# 查看详细错误信息
sudo nginx -t

# 常见错误：
# - 语法错误：检查配置文件中的分号、括号等
# - 路径错误：检查 root 路径是否存在
# - 权限错误：检查文件权限
```

### 问题3：PM2进程无法启动
```bash
# 查看错误日志
pm2 logs fetch-telegram-avatars --err

# 检查虚拟环境
source /var/www/tg_nav/venv/bin/activate
python3 --version

# 手动测试脚本
cd /var/www/tg_nav
source venv/bin/activate
python3 fetch_telegram_avatars.py
```

---

## 📝 快速部署命令（一键执行）

### 只更新HTML/CSS/JS文件
```bash
#!/bin/bash
# 在VPS上执行

cd /var/www/tg_nav

# 备份当前文件（可选）
cp index-json.html index-json.html.backup.$(date +%Y%m%d_%H%M%S)
cp style.css style.css.backup.$(date +%Y%m%d_%H%M%S)
cp script-json.js script-json.js.backup.$(date +%Y%m%d_%H%M%S)

# 从Git拉取更新（如果使用Git）
# git pull origin main

# 或者手动上传文件后，测试Nginx并重载
sudo nginx -t && sudo systemctl reload nginx && echo "✅ Nginx重载成功" || echo "❌ Nginx重载失败"
```

---

## ✅ 部署检查清单

- [ ] 文件已上传到VPS
- [ ] **版本号已更新**（如果修改了CSS/JS）
- [ ] Nginx配置测试通过 (`sudo nginx -t`)
- [ ] Nginx已重新加载 (`sudo systemctl reload nginx`)
- [ ] 网站可以正常访问
- [ ] 新功能正常显示（广告位A、页脚）
- [ ] 浏览器缓存已清除（`Ctrl + F5` 或无痕模式测试）
- [ ] PM2进程正常运行（如使用）（`pm2 status`）

---

## 💡 最佳实践

1. **每次修改前先备份**
   ```bash
   cp index-json.html index-json.html.backup.$(date +%Y%m%d)
   cp style.css style.css.backup.$(date +%Y%m%d)
   ```

2. **使用Git管理代码**
   ```bash
   git add .
   git commit -m "更新描述"
   git push
   # 在VPS上
   git pull
   ```

3. **部署前先在本地测试**
   - 使用本地服务器测试修改
   - 确保所有功能正常

4. **定期检查日志**
   ```bash
   # Nginx访问日志
   sudo tail -f /var/log/nginx/tg_nav_access.log
   
   # PM2日志
   pm2 logs fetch-telegram-avatars
   ```

5. **设置监控告警**
   - 监控网站可访问性
   - 监控PM2进程状态

---

---

## 🎯 最小部署文件清单

如果只部署最小必要文件，只需要：

```
tg_html/
├── index-json.html
├── style.css
├── script-json.js
├── tglogo.jpg
├── data/
│   └── *.json (所有分类JSON文件)
├── telegram_avatars/
│   └── *.jpg (所有头像文件)
└── ecosystem.config.js (可选)
```

## 📊 文件大小估算

- HTML/CSS/JS: ~500KB
- JSON数据文件: ~50-100MB（取决于数据量）
- 头像图片: ~100-500MB（取决于数量）
- **总计**: ~150-600MB

---

**生成时间**: 2025-01-XX  
**适用场景**: 静态HTML网站部署到VPS

