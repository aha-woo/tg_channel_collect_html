# 🔒 安全修复说明文档

## 已修复的安全问题

### 1. XSS（跨站脚本攻击）漏洞 ✅

**问题**：之前使用 `innerHTML` 可能执行恶意代码

**修复**：
- 移除所有不安全的 `innerHTML` 使用
- 添加HTML标签清理函数
- 使用 `textContent` 和 `createElement` 替代

**影响文件**：
- `script.js`
- `script-json.js`

### 2. Content Security Policy (CSP) ✅

**添加**：严格的CSP策略，限制资源加载

**保护**：
- 防止内联脚本注入
- 限制外部资源加载
- 防止点击劫持

**影响文件**：
- `index.html`
- `index-json.html`

### 3. HTTP安全头 ✅

**添加的安全头**：
- `X-Frame-Options`: 防止点击劫持
- `X-Content-Type-Options`: 防止MIME嗅探
- `X-XSS-Protection`: XSS过滤器
- `Referrer-Policy`: 控制Referrer信息
- `Permissions-Policy`: 限制浏览器功能

### 4. Nginx安全配置 ✅

**创建文件**：`nginx_security.conf`

**包含**：
- 完整的安全头配置
- 敏感文件访问限制
- 请求大小限制
- 请求方法限制
- DoS防护

---

## 安全修复详情

### XSS防护

#### 修复前（危险）：
```javascript
tempDiv.innerHTML = descriptionText;  // ⚠️ 可能执行恶意代码
```

#### 修复后（安全）：
```javascript
const plainText = descriptionText
    .replace(/<script[^>]*>.*?<\/script>/gi, '')  // 移除script标签
    .replace(/<style[^>]*>.*?<\/style>/gi, '')    // 移除style标签
    .replace(/<[^>]+>/g, '')                       // 移除所有HTML标签
    .replace(/javascript:/gi, '')                  // 移除javascript:协议
    .trim();
description.textContent = plainText;  // 安全赋值
```

### innerHTML 替换

所有 `innerHTML` 赋值都改为安全的 DOM 操作：

```javascript
// 修复前
placeholder.innerHTML = '<i class="fab fa-telegram"></i>';

// 修复后
const telegramIcon = document.createElement('i');
telegramIcon.className = 'fab fa-telegram';
placeholder.appendChild(telegramIcon);
```

---

## 部署安全配置

### 步骤1：更新网站文件

```bash
# 上传修复后的文件到VPS
scp -r index.html index-json.html script.js script-json.js root@85.208.48.30:/var/www/tg_nav/
```

### 步骤2：应用Nginx安全配置

```bash
# 在VPS上执行
sudo nano /etc/nginx/sites-available/tg_nav

# 复制 nginx_security.conf 的内容
# 保存退出（Ctrl+X, Y, Enter）

# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx
```

### 步骤3：验证安全头

```bash
# 测试安全头是否生效
curl -I http://85.208.48.30

# 应该看到：
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

---

## 安全检查清单

### 代码安全 ✅
- [x] 修复XSS漏洞
- [x] 移除不安全的innerHTML
- [x] 添加HTML清理函数
- [x] 使用安全的DOM操作

### HTTP安全 ✅
- [x] 添加CSP头
- [x] 添加X-Frame-Options
- [x] 添加X-Content-Type-Options
- [x] 添加X-XSS-Protection
- [x] 添加Referrer-Policy

### 服务器安全 ✅
- [x] 限制敏感文件访问
- [x] 阻止隐藏文件访问
- [x] 限制请求方法
- [x] 限制请求大小
- [x] 添加错误页面处理

### 推荐但可选 ⏳
- [ ] 配置HTTPS（需要域名）
- [ ] 启用HSTS
- [ ] 配置fail2ban（防暴力破解）
- [ ] 配置防火墙规则
- [ ] 设置访问速率限制

---

## 安全测试

### 测试1：XSS防护

尝试在data.json中添加恶意代码：

```json
{
  "title": "测试",
  "url": "https://example.com",
  "description": "<script>alert('XSS')</script>恶意代码"
}
```

**结果**：script标签被清理，不会执行

### 测试2：安全头

```bash
curl -I http://85.208.48.30 | grep -E "(X-Frame|X-Content|X-XSS|CSP)"
```

**预期**：显示所有安全头

### 测试3：敏感文件访问

```bash
curl -I http://85.208.48.30/.env
curl -I http://85.208.48.30/uploaddata.md
```

**预期**：返回404

---

## 安全维护建议

### 定期更新

1. **系统更新**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Nginx更新**
```bash
sudo apt update && sudo apt upgrade nginx
```

### 监控日志

```bash
# 查看访问日志
sudo tail -f /var/log/nginx/tg_nav_access.log

# 查看错误日志
sudo tail -f /var/log/nginx/tg_nav_error.log

# 查找可疑请求
sudo grep -i "script" /var/log/nginx/tg_nav_access.log
```

### 备份

```bash
# 定期备份网站文件
tar -czf tg_nav_backup_$(date +%Y%m%d).tar.gz /var/www/tg_nav/

# 备份Nginx配置
sudo cp /etc/nginx/sites-available/tg_nav /etc/nginx/sites-available/tg_nav.backup.$(date +%Y%m%d)
```

---

## 额外安全建议

### 1. 配置HTTPS（强烈推荐）

如果有域名，配置SSL证书：

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d nav.toycube.club

# 自动续期
sudo certbot renew --dry-run
```

### 2. 配置防火墙

```bash
# 启用UFW
sudo ufw enable

# 允许必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# 检查状态
sudo ufw status
```

### 3. 限制SSH访问

```bash
# 编辑SSH配置
sudo nano /etc/ssh/sshd_config

# 建议修改：
# PermitRootLogin no
# PasswordAuthentication no
# Port 2222  # 改变默认端口

# 重启SSH
sudo systemctl restart sshd
```

### 4. 安装fail2ban

```bash
# 安装
sudo apt install fail2ban -y

# 配置
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# 启动
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 安全评级

### 修复前：⚠️ 中风险
- XSS漏洞
- 缺少安全头
- 无HTTPS

### 修复后：✅ 低风险
- XSS已修复
- 完整安全头
- 敏感文件已保护
- HTTP安全（推荐升级到HTTPS）

---

## 联系与支持

如有安全问题或发现漏洞，请联系：
- 📧 Email: dlxmyhc@gmail.com
- 💬 Telegram: @youryhc

---

## 更新日志

### 2025-11-04
- ✅ 修复XSS漏洞
- ✅ 添加CSP安全头
- ✅ 添加Nginx安全配置
- ✅ 移除所有不安全的innerHTML使用
- ✅ 添加HTML清理函数
- ✅ 创建安全文档

---

**重要提示**：请定期检查和更新安全配置，确保网站始终安全。

