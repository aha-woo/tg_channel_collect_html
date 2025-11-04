# 🤖 Telegram 频道/群组头像获取教程

## ⚠️ 重要说明

**普通favicon服务无法获取TG频道头像！**

原因：
- Clearbit、Favicon.io等只能获取网站favicon
- 所有 `t.me/*` 链接只返回Telegram统一Logo
- TG频道/群组头像必须通过 **Telegram Bot API** 获取

---

## 📝 方案一：使用Telegram Bot API（推荐）

### 步骤1：创建Telegram Bot

1. 在Telegram搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按提示设置Bot名称（比如：MyWebsiteBot）
4. 获得Token（格式：`1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 步骤2：配置Token

**方法1：使用 .env 文件（推荐）**

1. 在项目根目录创建 `.env` 文件
2. 添加以下内容：

```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**方法2：直接在脚本中配置（不推荐）**

如果不想使用 .env 文件，可以直接在脚本中修改：

```python
BOT_TOKEN = os.getenv('BOT_TOKEN', '你的token这里')
```

**注意**：需要安装 python-dotenv 库：
```bash
pip install python-dotenv
```

### 步骤3：运行脚本

```bash
python fetch_telegram_avatars.py
```

脚本会：
- ✅ 自动扫描 data.json 中所有TG链接
- ✅ 获取每个频道/群组/Bot的头像
- ✅ 下载到 `telegram_avatars/` 文件夹
- ✅ 更新 data.json 中的 logo 字段

### 步骤4：部署头像文件

有两种方式：

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

## 📝 方案二：手动获取（简单但繁琐）

### 适用场景
- 没有服务器
- 只有少量TG频道需要添加头像
- 快速测试

### 步骤

1. **打开频道/群组**
   - 在Telegram中打开目标频道
   
2. **保存头像**
   - 点击频道头像
   - 右键 → 保存图片
   
3. **上传到图床**
   - 访问 https://imgur.com/upload
   - 上传图片
   - 复制图片URL
   
4. **更新data.json**
   ```json
   {
     "title": "极搜 JiSo",
     "url": "https://t.me/jiso",
     "description": "搜索机器人",
     "logo": "https://i.imgur.com/xxxxx.jpg"  // 👈 添加这行
   }
   ```

---

## 📝 方案三：使用第三方服务（如果可用）

### TG头像代理服务（部分可能需要付费）

1. **Telega.io** (如果有提供头像服务)
   ```
   https://telega.io/api/avatar/@username
   ```

2. **自建代理**（需要开发）
   - 搭建一个服务器
   - 使用Telegram API
   - 提供URL接口：`/avatar/@username`

---

## 🔍 常见问题

### Q1: 私有群组可以获取头像吗？
❌ 不可以。私有群组（joinchat链接）需要先加入才能获取信息。

### Q2: 获取头像需要多长时间？
⏱️ 约1-2秒/个，1000个链接大约需要20-40分钟。

### Q3: 头像会更新吗？
🔄 不会自动更新。如果频道更换了头像，需要重新运行脚本。

### Q4: 不想用Bot API怎么办？
📸 使用方案二手动截图，或使用统一的Telegram图标。

### Q5: 脚本运行报错？
检查：
- ✅ Python版本（需要3.6+）
- ✅ 安装requests：`pip install requests`
- ✅ Token格式正确
- ✅ Bot没有被ban

---

## 💡 建议

### 最佳实践

1. **首次运行**
   - 先测试几个链接
   - 确认成功后批量处理

2. **头像存储**
   - 使用CDN加速访问
   - 定期备份头像文件

3. **性能优化**
   - 添加缓存机制
   - 避免重复下载

4. **备选方案**
   - 为TG链接统一使用Telegram图标
   - 使用彩色渐变背景+首字母

---

## 📊 效果对比

### 使用Telegram官方Logo（现状）
```
所有TG链接 → 同一个Telegram Logo 📱
```

### 使用真实频道头像（目标）
```
@jiso      → 极搜的Logo 🔍
@sosoo     → SOSO的Logo 🔎
@binance   → 币安的Logo 💰
```

---

## 🎯 我已经为你准备好了

1. ✅ **增强favicon获取**（6层备选）
   - Google Favicon
   - 网站favicon.ico
   - Icon Horse
   - Google小尺寸版本
   - Google社交版本
   - GitHub Favicons

2. ✅ **TG头像获取脚本**
   - `fetch_telegram_avatars.py`
   - 自动化处理所有TG链接

3. ✅ **详细教程**
   - 三种方案可选
   - 常见问题解答

---

## 🚀 立即开始

### 快速测试（不获取TG头像）

现在刷新页面，普通网站的Logo已经可以通过6层备选方案获取了！

### 获取TG头像（需要配置）

1. 创建Bot获取Token
2. 配置 `fetch_telegram_avatars.py`
3. 运行脚本
4. 上传头像文件
5. 刷新页面查看效果

---

需要我帮你配置Bot或有其他问题吗？

