# VPS 部署检查清单

## 📋 部署后需要做的事情

### ✅ 1. 上传更新的文件到VPS

```bash
# 在本地执行，将更新的文件上传到VPS
scp index.html index-json.html style.css script.js script-json.js root@你的VPS_IP:/var/www/tg_nav/
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

**如果修改了 `style.css` 或 `script.js` 或 `script-json.js`，必须更新版本号！**

在 `index.html` 和 `index-json.html` 中：
```html
<!-- 将版本号改为新日期 -->
<link rel="stylesheet" href="style.css?v=20250105">  <!-- 改为新版本 -->
<script src="script.js?v=20250105"></script>  <!-- 改为新版本 -->
```

详细说明见：`VERSION_UPDATE.md`

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
scp *.html *.css *.js root@VPS_IP:/var/www/tg_nav/

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
   ls -la /var/www/tg_nav/index.html
   cat /var/www/tg_nav/index.html | head -20
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
cp index.html index.html.backup.$(date +%Y%m%d_%H%M%S)
cp style.css style.css.backup.$(date +%Y%m%d_%H%M%S)

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
   cp index.html index.html.backup.$(date +%Y%m%d)
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

**生成时间**: 2025-01-XX  
**适用场景**: 静态HTML网站部署到VPS

