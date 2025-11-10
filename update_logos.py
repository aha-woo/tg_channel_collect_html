#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 data.json 中的 logo 字段，匹配 telegram_avatars 文件夹中的图片
适用于 Ubuntu VPS 环境
"""

import json
import os
import re
from pathlib import Path
from urllib.parse import urlparse

def extract_username_from_url(url):
    """从 Telegram URL 中提取用户名"""
    if not url or not isinstance(url, str):
        return None
    
    # 处理 t.me 链接
    if 't.me/' in url:
        # 移除末尾的斜杠
        url = url.rstrip('/')
        # 提取用户名部分
        match = re.search(r't\.me/([^/?]+)', url)
        if match:
            username = match.group(1)
            # 移除 + 开头的邀请链接
            if username.startswith('+'):
                return None
            return username
    
    # 处理其他域名，提取域名作为标识
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path.split('/')[0]
        # 移除 www. 前缀
        domain = domain.replace('www.', '')
        return domain
    except:
        return None

def normalize_filename(username):
    """将用户名转换为可能的文件名格式"""
    if not username:
        return []
    
    # 生成多种可能的文件名变体
    variants = []
    
    # 原始用户名（小写）
    variants.append(username.lower())
    
    # 原始用户名（保持大小写）
    variants.append(username)
    
    # 首字母大写
    variants.append(username.capitalize())
    
    # 每个单词首字母大写
    if '_' in username:
        parts = username.split('_')
        variants.append(''.join(p.capitalize() for p in parts))
        variants.append('_'.join(p.capitalize() for p in parts))
    
    # 移除下划线
    variants.append(username.replace('_', ''))
    variants.append(username.replace('_', '').lower())
    
    # 下划线转驼峰
    if '_' in username:
        parts = username.split('_')
        camel = parts[0].lower() + ''.join(p.capitalize() for p in parts[1:])
        variants.append(camel)
    
    # 去重并返回
    return list(set(variants))

def find_matching_image(username, avatar_dir):
    """在 avatar_dir 中查找匹配的图片文件"""
    if not username:
        return None
    
    # 生成可能的文件名变体
    variants = normalize_filename(username)
    
    # 支持的图片扩展名
    extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    # 检查每个变体
    for variant in variants:
        for ext in extensions:
            filename = variant + ext
            filepath = os.path.join(avatar_dir, filename)
            if os.path.exists(filepath):
                return filename
    
    # 如果直接匹配失败，尝试模糊匹配（不区分大小写）
    avatar_files = os.listdir(avatar_dir)
    username_lower = username.lower()
    
    for filename in avatar_files:
        # 移除扩展名
        name_without_ext = os.path.splitext(filename)[0]
        # 不区分大小写比较
        if name_without_ext.lower() == username_lower:
            return filename
    
    return None

def update_json_logos(json_path, avatar_dir):
    """更新 JSON 文件中的 logo 字段"""
    # 读取 JSON 文件
    print(f"正在读取 JSON 文件: {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 统计信息
    total_items = 0
    matched_items = 0
    updated_items = 0
    
    # 遍历所有分类和项目
    for category in data.get('categories', []):
        for child in category.get('children', []):
            for item in child.get('items', []):
                total_items += 1
                url = item.get('url', '')
                current_logo = item.get('logo', '')
                
                # 如果已经有 logo，跳过
                if current_logo and current_logo.strip():
                    continue
                
                # 从 URL 提取用户名
                username = extract_username_from_url(url)
                if not username:
                    continue
                
                # 查找匹配的图片
                image_file = find_matching_image(username, avatar_dir)
                if image_file:
                    matched_items += 1
                    # 更新 logo 字段（使用相对路径，适用于 VPS）
                    item['logo'] = f"telegram_avatars/{image_file}"
                    updated_items += 1
                    print(f"[OK] 匹配: {username} -> {image_file}")
                else:
                    print(f"[X] 未找到: {username} (URL: {url})")
    
    # 保存更新后的 JSON 文件
    print(f"\n正在保存更新后的 JSON 文件...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # 打印统计信息
    print(f"\n{'='*60}")
    print(f"更新完成！")
    print(f"总项目数: {total_items}")
    print(f"匹配成功: {matched_items}")
    print(f"已更新: {updated_items}")
    print(f"未匹配: {total_items - matched_items}")
    print(f"{'='*60}")

def main():
    """主函数"""
    # 获取脚本所在目录
    script_dir = Path(__file__).parent.absolute()
    
    # JSON 文件路径
    json_path = script_dir / 'data.json'
    
    # 头像文件夹路径
    avatar_dir = script_dir / 'telegram_avatars'
    
    # 检查文件是否存在
    if not json_path.exists():
        print(f"错误: 找不到 JSON 文件: {json_path}")
        return
    
    if not avatar_dir.exists():
        print(f"错误: 找不到头像文件夹: {avatar_dir}")
        return
    
    print(f"JSON 文件: {json_path}")
    print(f"头像文件夹: {avatar_dir}")
    print(f"{'='*60}\n")
    
    # 更新 logo
    update_json_logos(str(json_path), str(avatar_dir))

if __name__ == '__main__':
    main()

