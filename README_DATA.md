# 数据文件说明

## 📁 文件对比

### 旧文件：`uploaddata.md`
- **格式**：Markdown 表格
- **优点**：人类可读，容易手动编辑
- **缺点**：
  - 解析复杂，容易出错
  - 不支持嵌套结构
  - 难以管理层级关系
  - Logo信息难以存储

### 新文件：`data.json`
- **格式**：JSON
- **优点**：
  - ✅ 结构清晰，易于解析
  - ✅ 支持完整的父子层级
  - ✅ 每个条目都有独立的logo字段
  - ✅ 易于批量导入和管理
  - ✅ 支持图标配置
  - ✅ 可以添加元数据（更新时间等）
- **缺点**：需要遵循JSON格式规范

## 📋 JSON 数据结构说明

### 1. 元数据（meta）
```json
{
  "meta": {
    "title": "网站标题",
    "description": "网站描述",
    "updateTime": "最后更新时间"
  }
}
```

### 2. 分类结构（categories）

每个大分类包含：
- `id`: 唯一标识符（英文）
- `parentName`: 父级分类名称（显示在导航）
- `parentIcon`: 父级分类图标（Font Awesome）
- `children`: 子分类数组

### 3. 子分类结构（children）

每个子分类包含：
- `name`: 子分类名称
- `icon`: 子分类图标（Font Awesome）
- `items`: 具体条目数组

### 4. 条目结构（items）

每个条目包含：
- `title`: 标题/名称 ⭐必填
- `url`: 链接地址 ⭐必填
- `description`: 详细说明 ⭐必填
- `logo`: Logo图片地址（可选，留空则自动获取favicon）

## 📝 使用示例

### 添加一个新的Telegram频道

```json
{
  "title": "技术频道",
  "url": "https://t.me/tech_channel",
  "description": "分享最新技术资讯和教程",
  "logo": ""
}
```

### 添加一个带自定义Logo的网站

```json
{
  "title": "我的网站",
  "url": "https://example.com",
  "description": "这是我的个人网站",
  "logo": "https://example.com/logo.png"
}
```

### 批量添加多个条目

```json
{
  "name": "搜索机器人",
  "icon": "fas fa-search",
  "items": [
    {
      "title": "机器人1",
      "url": "https://t.me/bot1",
      "description": "说明1",
      "logo": ""
    },
    {
      "title": "机器人2",
      "url": "https://t.me/bot2",
      "description": "说明2",
      "logo": ""
    },
    {
      "title": "机器人3",
      "url": "https://t.me/bot3",
      "description": "说明3",
      "logo": ""
    }
  ]
}
```

## 🔄 数据迁移

如果你想从 `uploaddata.md` 迁移到 `data.json`：

1. 保留原 `uploaddata.md` 文件（不要删除）
2. 将新数据添加到 `data.json`
3. 修改 `index.html` 中的数据源配置
4. 逐步迁移旧数据（或继续使用旧文件）

## ⚙️ 如何使用新格式

### 方法1：完全切换到JSON（推荐）

修改 `script.js`，将数据加载改为：
```javascript
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    // 使用新的JSON数据结构渲染页面
  });
```

### 方法2：双格式支持

同时支持两种格式，在配置文件中选择：
```javascript
const DATA_SOURCE = 'data.json'; // 或 'uploaddata.md'
```

## 📊 JSON vs Markdown 对比

| 特性 | uploaddata.md | data.json |
|------|--------------|-----------|
| 可读性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 结构清晰度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 解析难度 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 层级支持 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Logo管理 | ⭐ | ⭐⭐⭐⭐⭐ |
| 批量操作 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 图标配置 | ❌ | ✅ |
| 元数据支持 | ❌ | ✅ |

## 💡 建议

1. **新项目**：直接使用 `data.json`
2. **已有数据**：继续使用 `uploaddata.md`，新增数据使用 `data.json`
3. **大量数据**：建议迁移到 `data.json` 以便更好管理

## 🛠️ 在线工具推荐

- **JSON格式化**：https://jsonformatter.org/
- **JSON验证**：https://jsonlint.com/
- **JSON编辑器**：VS Code（推荐安装JSON插件）

## ❓ 常见问题

### Q: Logo字段留空会怎样？
A: 系统会自动获取网站的favicon作为Logo

### Q: 如何验证JSON格式正确？
A: 使用在线工具或代码编辑器的JSON验证功能

### Q: 可以混用两种格式吗？
A: 可以，但需要修改代码支持双数据源

### Q: 如何快速转换Markdown到JSON？
A: 可以编写一个转换脚本，或手动复制粘贴（建议批量操作时使用脚本）

