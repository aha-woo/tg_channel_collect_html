# URL 到文件映射说明

## 映射规则

每个 Telegram URL 对应两个文件：
1. **头像文件**：`telegram_avatars/{username}.jpg`
2. **说明文件**：`telegram_descriptions/{username}.txt`

其中 `{username}` 是从 URL 中提取的用户名。

## 映射示例

### 示例 1
- **URL**: `https://t.me/chiguawuxian`
- **提取用户名**: `chiguawuxian`
- **头像文件**: `telegram_avatars/chiguawuxian.jpg`
- **说明文件**: `telegram_descriptions/chiguawuxian.txt`

### 示例 2
- **URL**: `https://t.me/jiso`
- **提取用户名**: `jiso`
- **头像文件**: `telegram_avatars/jiso.jpg`
- **说明文件**: `telegram_descriptions/jiso.txt`

### 示例 3
- **URL**: `https://t.me/jisoubar`
- **提取用户名**: `jisoubar`
- **头像文件**: `telegram_avatars/jisoubar.jpg`
- **说明文件**: `telegram_descriptions/jisoubar.txt`

## 如何通过 URL 找到对应文件

### Python 代码示例

```python
import re
import os

def get_username_from_url(url):
    """从URL提取用户名"""
    if 't.me/' in url:
        match = re.search(r't\.me/([a-zA-Z0-9_]+)', url)
        if match:
            return match.group(1)
    return None

def get_files_by_url(url):
    """通过URL获取对应的头像和说明文件路径"""
    username = get_username_from_url(url)
    if not username:
        return None, None
    
    avatar_file = f"telegram_avatars/{username}.jpg"
    description_file = f"telegram_descriptions/{username}.txt"
    
    return avatar_file, description_file

# 使用示例
url = "https://t.me/chiguawuxian"
avatar, description = get_files_by_url(url)
print(f"头像: {avatar}")      # 输出: telegram_avatars/chiguawuxian.jpg
print(f"说明: {description}") # 输出: telegram_descriptions/chiguawuxian.txt
```

## 映射关系总结

| URL | 用户名 | 头像文件 | 说明文件 |
|-----|--------|----------|----------|
| `https://t.me/chiguawuxian` | `chiguawuxian` | `telegram_avatars/chiguawuxian.jpg` | `telegram_descriptions/chiguawuxian.txt` |
| `https://t.me/jiso` | `jiso` | `telegram_avatars/jiso.jpg` | `telegram_descriptions/jiso.txt` |
| `https://t.me/jisoubar` | `jisoubar` | `telegram_avatars/jisoubar.jpg` | `telegram_descriptions/jisoubar.txt` |

## 注意事项

1. **文件名完全基于用户名**：文件名直接使用从 URL 提取的用户名，不进行任何转换
2. **大小写敏感**：文件名保持 URL 中的原始大小写
3. **唯一性**：每个 URL 对应唯一的用户名，因此文件名也是唯一的
4. **私有链接**：`joinchat` 或 `+` 开头的私有群组链接无法提取用户名

## 验证映射关系

可以通过以下方式验证：

1. 从 JSON 中的 `url` 字段提取用户名
2. 使用用户名查找对应的头像和说明文件
3. 文件名格式：`{username}.jpg` 和 `{username}.txt`

