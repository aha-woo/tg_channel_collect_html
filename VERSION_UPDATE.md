# 版本号更新说明

## 为什么需要版本号？

由于 Nginx 配置了静态文件缓存（CSS/JS 文件缓存 1 年），浏览器会缓存旧版本的文件。添加版本号参数可以强制浏览器下载新版本。

## 当前版本号

当前版本：`v=20250105`

## 何时需要更新版本号？

**只有在修改了以下文件时才需要更新版本号：**

- `style.css` - 修改了样式
- `script.js` - 修改了 JavaScript 逻辑
- `script-json.js` - 修改了 JSON 版本的 JavaScript 逻辑

**不需要更新版本号的情况：**
- 只修改了 HTML 文件（HTML 不缓存）
- 只修改了数据文件（data.json, uploaddata.md）
- 只修改了 Python 脚本或配置文件

## 如何更新版本号？

### 方法一：使用日期作为版本号（推荐）

每次更新时使用当天日期，格式：`YYYYMMDD`

例如：
- 2025年1月5日 → `v=20250105`
- 2025年1月10日 → `v=20250110`
- 2025年2月1日 → `v=20250201`

### 方法二：使用递增数字

- 第一次更新 → `v=1`
- 第二次更新 → `v=2`
- 第三次更新 → `v=3`

## 需要修改的文件

### 1. index.html

```html
<!-- CSS 文件 -->
<link rel="stylesheet" href="style.css?v=20250105">

<!-- JS 文件 -->
<script src="script.js?v=20250105"></script>
```

### 2. index-json.html

```html
<!-- CSS 文件 -->
<link rel="stylesheet" href="style.css?v=20250105">

<!-- JS 文件 -->
<script src="script-json.js?v=20250105"></script>
```

## 更新步骤

1. **修改 CSS 或 JS 文件**

2. **更新版本号**
   - 找到两个 HTML 文件中的版本号
   - 将 `v=20250105` 改为新的版本号（如 `v=20250106`）
   - 两个文件都要改

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

## 批量替换版本号（快速方法）

使用查找替换功能，一次性更新所有版本号：

**查找：** `v=20250105`
**替换为：** `v=20250106`（新版本号）

在 `index.html` 和 `index-json.html` 两个文件中执行替换。

## 示例：更新流程

假设今天是 2025年1月6日，你修改了 `style.css`：

1. 打开 `index.html` 和 `index-json.html`
2. 找到所有 `v=20250105`，替换为 `v=20250106`
3. 保存文件
4. 提交并推送到 Git
5. 在 VPS 上 `git pull`
6. 重新加载 Nginx
7. 在浏览器中按 `Ctrl + F5` 强制刷新

## 常见问题

### Q1: 为什么本地测试正常，VPS 上显示旧版？
A: 浏览器缓存了旧版本的 CSS/JS 文件。解决方法：
- 按 `Ctrl + F5` 强制刷新
- 或者更新版本号后重新部署

### Q2: 我忘记更新版本号怎么办？
A: 可以在 VPS 上执行：
```bash
# 清除浏览器看到的缓存响应头
curl -I http://你的域名/style.css
curl -I http://你的域名/script.js
```
然后清除浏览器缓存，或者等待缓存过期（1年）。

### Q3: 能不能每次自动更新版本号？
A: 可以使用构建工具（如 webpack, gulp）自动生成版本号，但对于简单项目，手动更新已经足够。

## 快速检查命令

在 VPS 上检查当前版本号：

```bash
# 检查 index.html 中的版本号
grep -o 'v=[0-9]*' /var/www/tg_nav/index.html

# 检查 index-json.html 中的版本号
grep -o 'v=[0-9]*' /var/www/tg_nav/index-json.html
```

---

**记住：每次修改 CSS 或 JS 文件后，一定要更新版本号！**

**当前版本：v=20250105**
**下次更新请使用：v=20250106 或更新的日期**

