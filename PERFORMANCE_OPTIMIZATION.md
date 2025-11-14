# 性能优化方案 - 大数据量处理

## 📊 方案概述

针对数据量大的情况，采用**按分类拆分 + 懒加载 + 预加载**的混合方案。数据文件已拆分到 `data/` 目录。

## 🎯 优化策略

### 1. **文件拆分策略**

#### 方案 A：按父分类拆分（推荐）
```
data/
├── index.json          # 轻量级索引（< 50KB）- 包含所有分类结构
├── telegram工具.json   # 单个分类数据（~200KB）
├── 群组频道.json
├── 机场VPN.json
└── ...
```

**优点：**
- ✅ 索引文件小，快速加载导航菜单
- ✅ 按需加载，用户只加载需要的分类
- ✅ 易于维护和更新单个分类
- ✅ 支持并行加载多个分类

#### 方案 B：按子分类拆分（更细粒度）
```
data/
├── index.json
├── telegram工具/
│   ├── 搜索机器人.json
│   ├── 常用机器人.json
│   └── ...
└── ...
```

**优点：**
- ✅ 更细粒度的控制
- ✅ 单个文件更小

**缺点：**
- ❌ 文件数量多，管理复杂
- ❌ HTTP 请求次数增加

### 2. **加载策略**

#### 阶段 1：初始加载（< 100ms）
- 加载 `index.json`（只包含分类结构，不含 items）
- 立即渲染导航菜单
- 显示加载骨架屏

#### 阶段 2：预加载关键数据（< 500ms）
- 预加载首页可见的 2-3 个热门分类
- 后台静默加载，不阻塞渲染

#### 阶段 3：懒加载（按需）
- 用户滚动到某个分类时加载
- 用户点击侧边栏分类时加载
- 使用 Intersection Observer API

### 3. **缓存策略**

#### 浏览器缓存
- 设置合适的 `Cache-Control` 头
- 使用版本号控制缓存失效

#### LocalStorage 缓存
- 缓存已加载的分类数据
- 设置过期时间（如 24 小时）
- 缓存 key: `tg_nav_category_{categoryId}_{version}`

## 📁 文件结构

```
项目根目录/
├── data/
│   ├── index.json              # 索引文件（必需）
│   ├── telegram工具.json        # 分类数据（按需）
│   ├── 群组频道.json
│   └── ...
├── script-json-lazy.js         # 懒加载版本的脚本
└── index-json-lazy.html        # 懒加载版本的页面
```

## 🔧 实现细节

### index.json 结构（轻量级）

```json
{
  "meta": {
    "title": "Telegram导航",
    "description": "...",
    "updateTime": "2025-11-04",
    "version": "1.0.0"
  },
  "categories": [
    {
      "id": "telegram工具",
      "parentName": "Telegram工具",
      "parentIcon": "fab fa-telegram",
      "file": "telegram工具.json",  // 数据文件路径
      "children": [
        {
          "name": "搜索机器人",
          "icon": "fas fa-search",
          "itemCount": 25  // 项目数量（用于显示）
        }
      ]
    }
  ]
}
```

### 分类数据文件结构

```json
{
  "id": "telegram工具",
  "parentName": "Telegram工具",
  "children": [
    {
      "name": "搜索机器人",
      "icon": "fas fa-search",
      "items": [
        {
          "title": "极搜 JiSo",
          "url": "https://t.me/jiso",
          "description": "...",
          "logo": ""
        }
      ]
    }
  ]
}
```

## ⚡ 性能指标

### 目标指标
- **首次内容绘制 (FCP)**: < 500ms
- **可交互时间 (TTI)**: < 1s
- **总加载时间**: < 2s（初始加载）
- **分类切换**: < 200ms

### 对比

| 方案 | 初始加载 | 总数据加载 | 用户体验 |
|------|---------|-----------|---------|
| 单文件 (1MB+) | ~2-3s | ~2-3s | ⭐⭐ |
| 拆分 + 懒加载 | ~100ms | ~2-3s | ⭐⭐⭐⭐⭐ |

## 🚀 迁移步骤

1. **创建数据拆分脚本** (`split_data.py`)
2. **生成 index.json 和分类文件**
3. **更新 JavaScript 加载逻辑**
4. **测试和优化**

## 📝 注意事项

1. **数据格式**：所有数据文件已拆分到 `data/` 目录，不再使用单文件 `data.json`
2. **SEO 优化**：确保关键内容在初始 HTML 中
3. **错误处理**：网络失败时显示友好提示
4. **加载状态**：显示加载进度和骨架屏

