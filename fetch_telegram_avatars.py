#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
获取Telegram频道/群组/Bot的头像
需要Telegram Bot API Token
"""

import json
import re
import requests
import os
import time
import random
from urllib.parse import urlparse
from datetime import datetime, timedelta
from dotenv import load_dotenv

# ============ 加载环境变量 ============
# 从 .env 文件加载环境变量
load_dotenv()

# ============ 配置 ============
# 从环境变量读取 Telegram Bot Token
# 如果 .env 文件中没有，则使用默认值
BOT_TOKEN = os.getenv('BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')

# 头像保存目录
AVATAR_DIR = "telegram_avatars"

# ============ 速率限制配置 ============
# Telegram Bot API 限制：每秒最多30个请求
# 但实际使用中，建议更保守，避免触发限制
# 每个频道需要2个API请求（getChat + getFile），所以需要更长的延迟
# 配置策略：每秒最多0.1-0.15个请求（即每次请求间隔6.5-10秒），最大化避免限制
REQUEST_DELAY = 40  # 基础延迟（秒），约每秒0.15个请求
MAX_RETRIES = 3  # 最大重试次数
RETRY_DELAY = 10  # 重试延迟（秒）
RATE_LIMIT_DELAY = 1800  # 遇到429错误时的默认等待时间（秒）= 1小时

# 随机延迟配置（避免被识别为机器人行为）
USE_RANDOM_DELAY = True  # True=启用随机延迟，False=固定延迟
RANDOM_DELAY_RANGE = 60  # 随机延迟范围（秒），实际延迟 = REQUEST_DELAY + random(0, RANDOM_DELAY_RANGE)
# 最终延迟范围：60-66秒，平均约63秒，每秒约0.016个请求（非常保守）

# getChat 和 getFile 之间的延迟配置
USE_BETWEEN_API_DELAY = True  # True=启用API间延迟，False=不延迟
BETWEEN_API_DELAY_MIN = 5  # getChat和getFile之间的最小延迟（秒）
BETWEEN_API_DELAY_MAX = 36  # getChat和getFile之间的最大延迟（秒）

# 速率限制后的随机睡眠配置（遇到429错误时）
RATE_LIMIT_SLEEP_MIN = 1800  # 遇到429错误后的最小睡眠时间（秒）= 1小时
RATE_LIMIT_SLEEP_MAX = 5400  # 遇到429错误后的最大睡眠时间（秒）= 1.5小时

# 批量处理后的休眠配置（防止FLOOD限制）
BATCH_SIZE = 15  # 每处理多少个链接后休眠一次
BATCH_SLEEP_MIN = 600  # 批量休眠最小时间（秒）= 30分钟
BATCH_SLEEP_MAX = 1200  # 批量休眠最大时间（秒）= 1小时

# 进度保存文件
PROGRESS_FILE = "fetch_progress.json"

# ============ 清理配置 ============
# 是否自动删除不存在的频道/群组
AUTO_DELETE_NOT_FOUND = True  # True=自动删除，False=仅标记不删除
DELETED_ITEMS_FILE = "deleted_items.json"  # 保存已删除条目的备份

def get_username_from_url(url):
    """从URL中提取Telegram用户名"""
    # https://t.me/jiso
    # https://t.me/joinchat/xxxxx
    
    if 'joinchat' in url or '+' in url:
        return None  # 私有群组链接无法获取
    
    match = re.search(r't\.me/([a-zA-Z0-9_]+)', url)
    if match:
        return match.group(1)
    return None

def get_favicon_url(url, username=None):
    """通过 favicon 服务获取头像URL（备选方案）
    
    返回: favicon URL 或 None
    """
    try:
        # 对于 Telegram 链接，使用 Telegram 官方 logo
        if 't.me' in url:
            # 优先使用 Telegram 官方 logo
            telegram_logo = "https://telegram.org/img/t_logo.png"
            return telegram_logo
        
        # 对于普通网站，提取域名并使用 Google Favicon 服务
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path.split('/')[0]
        
        if not domain:
            return None
        
        # 移除 www. 前缀
        domain = domain.replace('www.', '')
        
        # 使用 Google S2 Favicons 服务（高分辨率）
        favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
        return favicon_url
    except Exception as e:
        print(f"  ⚠️  获取 favicon 失败: {e}")
        return None

def download_favicon(favicon_url, username):
    """下载 favicon 并保存到本地"""
    try:
        response = requests.get(favicon_url, timeout=10)
        if response.status_code == 200:
            os.makedirs(AVATAR_DIR, exist_ok=True)
            local_path = os.path.join(AVATAR_DIR, f"{username}.jpg")
            
            with open(local_path, 'wb') as f:
                f.write(response.content)
            
            return local_path
    except Exception as e:
        print(f"  ⚠️  下载 favicon 失败: {e}")
        return None

def smart_delay(description=""):
    """智能延迟：固定延迟 + 随机延迟"""
    if USE_RANDOM_DELAY:
        # 随机延迟：REQUEST_DELAY + random(0, RANDOM_DELAY_RANGE)
        delay = REQUEST_DELAY + random.uniform(0, RANDOM_DELAY_RANGE)
    else:
        delay = REQUEST_DELAY
    
    if description:
        print(f"  ⏳ 等待 {delay:.2f} 秒...")
    time.sleep(delay)

def between_api_delay(description=""):
    """getChat 和 getFile 之间的延迟（避免API调用过于频繁）"""
    if USE_BETWEEN_API_DELAY:
        delay = random.uniform(BETWEEN_API_DELAY_MIN, BETWEEN_API_DELAY_MAX)
        if description:
            print(f"  ⏸️  API间延迟 {delay:.2f} 秒（getChat → getFile）...")
        time.sleep(delay)

def batch_sleep_if_needed(batch_processed_count, processed_usernames, data):
    """检查是否需要批量休眠（每处理BATCH_SIZE个后休眠一次）
    
    返回: True表示已休眠，False表示不需要休眠
    """
    if batch_processed_count > 0 and batch_processed_count % BATCH_SIZE == 0:
        sleep_time = random.uniform(BATCH_SLEEP_MIN, BATCH_SLEEP_MAX)
        sleep_minutes = sleep_time / 60
        sleep_hours = sleep_time / 3600
        
        print("\n" + "=" * 60)
        print(f"⏸️  已处理 {batch_processed_count} 个链接，进入休眠模式")
        print(f"💤 休眠时间: {sleep_time:.1f} 秒（约 {sleep_minutes:.1f} 分钟 / {sleep_hours:.2f} 小时）")
        resume_time = datetime.now() + timedelta(seconds=sleep_time)
        print(f"⏰ 预计恢复时间: {resume_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # 休眠前保存进度
        save_progress({'processed': list(processed_usernames)})
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"💾 进度已保存")
        
        # 开始休眠
        time.sleep(sleep_time)
        
        print("\n" + "=" * 60)
        print(f"✅ 休眠结束，继续处理...")
        print("=" * 60 + "\n")
        
        return True
    return False

def get_chat_info(username, retry_count=0):
    """获取频道/群组/Bot信息（带重试机制）
    
    返回: (chat_info, is_not_found)
    - chat_info: 频道信息字典，如果失败则为None
    - is_not_found: True表示频道不存在（已删除），False表示其他错误
    """
    api_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChat"
    
    try:
        response = requests.get(api_url, params={'chat_id': f'@{username}'}, timeout=10)
        data = response.json()
        
        # 检查是否被速率限制（429错误）
        if response.status_code == 429:
            # 优先使用Telegram返回的retry_after，否则使用随机睡眠
            telegram_retry_after = data.get('parameters', {}).get('retry_after')
            
            if telegram_retry_after:
                # 使用Telegram返回的时间，但加上随机延迟
                sleep_time = telegram_retry_after + random.uniform(0, 60)  # 额外随机0-60秒
                print(f"⚠️  触发速率限制，Telegram要求等待 {telegram_retry_after} 秒，实际等待 {sleep_time:.1f} 秒...")
            else:
                # 使用随机睡眠（5-6分钟随机）
                sleep_time = random.uniform(RATE_LIMIT_SLEEP_MIN, RATE_LIMIT_SLEEP_MAX)
                sleep_minutes = sleep_time / 60
                print(f"⚠️  触发速率限制，随机睡眠 {sleep_time:.1f} 秒（约 {sleep_minutes:.1f} 分钟）...")
            
            time.sleep(sleep_time)
            
            # 重试
            if retry_count < MAX_RETRIES:
                return get_chat_info(username, retry_count + 1)
            else:
                print(f"❌ 重试次数已达上限 @{username}")
                return None, False
        
        if data.get('ok'):
            chat_info = data.get('result')
            # 检查chat类型，记录详细信息
            chat_type = chat_info.get('type', 'unknown')
            print(f"  ✅ 成功获取 @{username} 信息（类型: {chat_type}）")
            return chat_info, False
        else:
            error_code = data.get('error_code', 'unknown')
            error_description = data.get('description', '未知错误')
            
            # 详细记录错误信息
            print(f"  ⚠️  API返回错误: 错误码={error_code}, 描述={error_description}")
            
            # 更严格的错误判断：只有明确的不存在错误才标记为删除
            # Bot 可能返回 "bad request" 或其他错误，但不一定是不存在
            not_found_keywords = [
                'chat not found',  # 频道/群组不存在
                'user not found',   # 用户不存在
                'chat_id is empty', # 聊天ID为空
            ]
            
            # 对于 Bot，可能需要特殊处理
            # 如果返回 "bad request" 或 "method not found"，可能只是权限问题
            is_definitely_not_found = any(keyword in error_description.lower() for keyword in not_found_keywords)
            
            # 对于某些错误，可能是权限问题或Bot未启动，不应该删除
            ambiguous_errors = [
                'bad request',
                'method not found',
                'forbidden',
                'unauthorized',
                'bot was blocked',
                'bot was deleted',
            ]
            is_ambiguous = any(keyword in error_description.lower() for keyword in ambiguous_errors)
            
            if is_definitely_not_found:
                print(f"  ❌ 确认不存在: @{username} - {error_description}")
                return None, True  # 明确标记为不存在
            elif is_ambiguous:
                print(f"  ⚠️  可能是权限或Bot状态问题: @{username} - {error_description}")
                print(f"  💡 建议：手动检查Bot是否存在，暂不删除")
                return None, False  # 不标记为删除，可能是其他原因
            else:
                print(f"  ⚠️  无法获取 @{username} 的信息: {error_description} (错误码: {error_code})")
                return None, False  # 未知错误，不删除
    except requests.exceptions.Timeout:
        print(f"  ⚠️  请求超时 @{username}")
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY)
            return get_chat_info(username, retry_count + 1)
        return None, False
    except Exception as e:
        print(f"  ❌ 请求失败 @{username}: {e}")
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY)
            return get_chat_info(username, retry_count + 1)
        return None, False

def download_avatar(file_id, username, retry_count=0):
    """下载头像（带重试机制）"""
    # 获取文件路径
    file_url = f"https://api.telegram.org/bot{BOT_TOKEN}/getFile"
    
    try:
        response = requests.get(file_url, params={'file_id': file_id}, timeout=10)
        data = response.json()
        
        # 检查速率限制
        if response.status_code == 429:
            # 优先使用Telegram返回的retry_after，否则使用随机睡眠
            telegram_retry_after = data.get('parameters', {}).get('retry_after')
            
            if telegram_retry_after:
                # 使用Telegram返回的时间，但加上随机延迟
                sleep_time = telegram_retry_after + random.uniform(0, 60)  # 额外随机0-60秒
                print(f"  ⚠️  触发速率限制，Telegram要求等待 {telegram_retry_after} 秒，实际等待 {sleep_time:.1f} 秒...")
            else:
                # 使用随机睡眠（5-6分钟随机）
                sleep_time = random.uniform(RATE_LIMIT_SLEEP_MIN, RATE_LIMIT_SLEEP_MAX)
                sleep_minutes = sleep_time / 60
                print(f"  ⚠️  触发速率限制，随机睡眠 {sleep_time:.1f} 秒（约 {sleep_minutes:.1f} 分钟）...")
            
            time.sleep(sleep_time)
            if retry_count < MAX_RETRIES:
                return download_avatar(file_id, username, retry_count + 1)
            return None
        
        if not data.get('ok'):
            return None
        
        file_path = data['result']['file_path']
        download_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
        
        # 下载文件
        os.makedirs(AVATAR_DIR, exist_ok=True)
        local_path = os.path.join(AVATAR_DIR, f"{username}.jpg")
        
        img_response = requests.get(download_url, timeout=30)
        img_response.raise_for_status()
        
        with open(local_path, 'wb') as f:
            f.write(img_response.content)
        
        return local_path
    except requests.exceptions.Timeout:
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY)
            return download_avatar(file_id, username, retry_count + 1)
        return None
    except Exception as e:
        print(f"  ⚠️  下载失败 @{username}: {e}")
        if retry_count < MAX_RETRIES:
            time.sleep(RETRY_DELAY)
            return download_avatar(file_id, username, retry_count + 1)
        return None

def load_progress():
    """加载进度（断点续传）"""
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_progress(processed_usernames):
    """保存进度"""
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed_usernames, f, ensure_ascii=False, indent=2)

def save_deleted_items(deleted_items):
    """保存已删除的条目备份"""
    existing_deleted = []
    if os.path.exists(DELETED_ITEMS_FILE):
        try:
            with open(DELETED_ITEMS_FILE, 'r', encoding='utf-8') as f:
                existing_deleted = json.load(f)
        except:
            existing_deleted = []
    
    # 添加删除时间戳
    for item in deleted_items:
        if 'deleted_at' not in item:
            item['deleted_at'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    # 合并并保存
    all_deleted = existing_deleted + deleted_items
    with open(DELETED_ITEMS_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_deleted, f, ensure_ascii=False, indent=2)

def process_data_json():
    """处理data.json中的所有Telegram链接（带速率限制和断点续传）"""
    
    if BOT_TOKEN == "YOUR_BOT_TOKEN_HERE" or not BOT_TOKEN:
        print("=" * 60)
        print("⚠️  请先配置Telegram Bot Token！")
        print("=" * 60)
        print("\n📝 配置方法：")
        print("1. 在项目根目录创建 .env 文件")
        print("2. 在 .env 文件中添加：")
        print("   BOT_TOKEN=你的token")
        print("\n📝 获取Token步骤：")
        print("1. 在Telegram中搜索 @BotFather")
        print("2. 发送 /newbot 创建一个新bot")
        print("3. 按提示设置bot名称")
        print("4. 获得的token添加到 .env 文件中")
        print("\n💡 示例 .env 文件内容：")
        print("   BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz")
        print("\n⚠️  注意：确保已安装 python-dotenv 库")
        print("   安装方法：pip install python-dotenv")
        print("=" * 60)
        return
    
    # 读取data.json
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 加载进度（断点续传）
    progress = load_progress()
    processed_usernames = set(progress.get('processed', []))
    
    updated_count = 0
    telegram_links = []
    
    # 收集所有TG链接
    for category in data['categories']:
        for child in category['children']:
            for item in child['items']:
                if 't.me' in item.get('url', ''):
                    username = get_username_from_url(item['url'])
                    if username:
                        telegram_links.append({
                            'item': item,
                            'username': username
                        })
    
    total_links = len(telegram_links)
    print(f"\n🔍 找到 {total_links} 个Telegram链接")
    
    # 计算已处理和未处理的数量
    remaining_links = [link for link in telegram_links if link['username'] not in processed_usernames]
    processed_count = total_links - len(remaining_links)
    
    if processed_count > 0:
        print(f"📊 已处理: {processed_count} 个，剩余: {len(remaining_links)} 个")
        print("💡 将跳过已处理的链接（断点续传）")
    
    # 计算预计时间（每个频道需要2个请求 + API间延迟）
    avg_delay = REQUEST_DELAY + (RANDOM_DELAY_RANGE / 2 if USE_RANDOM_DELAY else 0)
    avg_between_delay = ((BETWEEN_API_DELAY_MIN + BETWEEN_API_DELAY_MAX) / 2) if USE_BETWEEN_API_DELAY else 0
    # 每个频道：2个请求延迟 + 1个API间延迟
    avg_time_per_channel = (avg_delay * 2) + avg_between_delay
    estimated_time = len(remaining_links) * avg_time_per_channel / 60
    
    print("=" * 60)
    print(f"⏱️  预计时间: {estimated_time:.1f} 分钟")
    if USE_RANDOM_DELAY:
        print(f"🐌 请求间隔: {REQUEST_DELAY:.1f}-{REQUEST_DELAY + RANDOM_DELAY_RANGE:.1f} 秒（随机延迟）")
        print(f"📊 平均延迟: {avg_delay:.1f} 秒/请求")
    else:
        print(f"🐌 请求间隔: {REQUEST_DELAY:.1f} 秒（固定延迟）")
    if USE_BETWEEN_API_DELAY:
        print(f"⏸️  API间延迟: {BETWEEN_API_DELAY_MIN}-{BETWEEN_API_DELAY_MAX} 秒（getChat → getFile）")
    print(f"💡 每个频道需要2个API请求（getChat + getFile）")
    print(f"💡 每个频道平均耗时: {avg_time_per_channel:.1f} 秒")
    print("=" * 60)
    
    start_time = time.time()
    success_count = 0
    skip_count = 0
    error_count = 0
    deleted_count = 0
    deleted_items = []  # 记录已删除的条目
    items_to_delete = []  # 记录需要从data中删除的条目
    batch_processed_count = 0  # 批量处理计数器（不包括跳过的）
    
    # 处理剩余的链接
    for idx, link_info in enumerate(remaining_links, 1):
        username = link_info['username']
        item = link_info['item']
        
        # 计算进度
        current_idx = processed_count + idx
        elapsed_time = time.time() - start_time
        avg_time_per_item = elapsed_time / idx if idx > 0 else 0
        remaining_time = avg_time_per_item * (len(remaining_links) - idx)
        
        print(f"\n[{current_idx}/{total_links}] 处理: @{username} - {item['title']}")
        print(f"  ⏱️  已用: {elapsed_time/60:.1f}分钟 | 剩余: {remaining_time/60:.1f}分钟")
        
        # 如果已经有logo，跳过
        if item.get('logo') and item['logo'].strip():
            print(f"  ⏭️  已有logo，跳过")
            skip_count += 1
            processed_usernames.add(username)
            save_progress({'processed': list(processed_usernames)})
            continue  # 跳过的链接不计入批量计数
        
        # 速率限制：每次请求前等待（包含随机延迟）
        if idx > 1:  # 第一个请求不需要等待
            smart_delay(f"请求 @{username}")
        else:
            print(f"  ⏳ 开始处理（第一个请求无需等待）")
        
        # 获取chat信息
        chat_info, is_not_found = get_chat_info(username)
        
        # 如果频道/群组不存在，处理删除
        if is_not_found:
            deleted_count += 1
            # 备份被删除的条目
            deleted_item = item.copy()
            deleted_item['username'] = username
            deleted_item['reason'] = 'not_found'
            deleted_item['error_info'] = 'chat not found'  # 记录错误信息
            deleted_items.append(deleted_item)
            
            if AUTO_DELETE_NOT_FOUND:
                # 标记为待删除
                items_to_delete.append(item)
                print(f"  🗑️  已标记为删除（确认不存在）")
            else:
                # 仅标记，不删除
                item['description'] = f"[已失效] {item.get('description', '')}"
                print(f"  ⚠️  已标记为失效（不删除）")
            
            processed_usernames.add(username)
            save_progress({'processed': list(processed_usernames)})
            batch_processed_count += 1  # 删除的链接也计入批量计数
            
            # 检查是否需要批量休眠
            batch_sleep_if_needed(batch_processed_count, processed_usernames, data)
            
            continue
        
        if not chat_info:
            # 如果chat_info为None但不是is_not_found，说明是其他错误（如权限问题）
            # 尝试使用 favicon 服务作为备选方案
            error_count += 1
            print(f"  ⚠️  获取失败，尝试使用 favicon 服务作为备选...")
            
            # 尝试获取 favicon
            favicon_url = get_favicon_url(item.get('url', ''), username)
            if favicon_url:
                # 下载 favicon
                time.sleep(REQUEST_DELAY)  # 下载前也等待一下
                local_path = download_favicon(favicon_url, username)
                if local_path:
                    item['logo'] = local_path
                    updated_count += 1
                    print(f"  ✅ 使用 favicon 服务获取头像成功: {local_path}")
                else:
                    print(f"  ⚠️  favicon 下载失败")
            else:
                print(f"  ⚠️  无法获取 favicon URL")
            
            print(f"  💡 保留条目（可能是权限或Bot状态问题）")
            processed_usernames.add(username)
            save_progress({'processed': list(processed_usernames)})
            batch_processed_count += 1  # 失败的链接也计入批量计数
            
            # 检查是否需要批量休眠
            batch_sleep_if_needed(batch_processed_count, processed_usernames, data)
            
            continue
        
        # 更新频道/群组信息
        info_updated = False
        
        # 1. 更新描述信息（如果有）
        description = chat_info.get('description', '').strip()
        if description and (not item.get('description') or item.get('description') == '暂无描述'):
            item['description'] = description
            info_updated = True
            print(f"  ✅ 描述已更新")
        
        # 2. 更新标题（如果当前标题为空或有更好的标题）
        title = chat_info.get('title', '').strip()
        if title and not item.get('title'):
            item['title'] = title
            info_updated = True
            print(f"  ✅ 标题已更新: {title}")
        
        # 3. 检查并下载头像
        photo = chat_info.get('photo')
        if photo:
            # getChat 和 getFile 之间的延迟（避免API调用过于频繁）
            between_api_delay(f"getChat → getFile")
            
            # 下载头像前也需要延迟（因为getFile也是API请求）
            smart_delay(f"下载 @{username} 头像")
            big_file_id = photo.get('big_file_id')
            if big_file_id:
                local_path = download_avatar(big_file_id, username)
                if local_path:
                    # 更新到data中（这里使用相对路径）
                    item['logo'] = local_path
                    updated_count += 1
                    success_count += 1
                    info_updated = True
                    print(f"  ✅ 头像已保存: {local_path}")
                else:
                    error_count += 1
                    print(f"  ❌ 头像下载失败")
        else:
            print(f"  ℹ️  该频道/群组没有设置头像")
        
        # 如果有任何信息更新，计数
        if info_updated:
            updated_count += 1
        
        # 增加批量处理计数（处理完一个链接后）
        batch_processed_count += 1
        
        # 每处理BATCH_SIZE个后休眠一次（防止FLOOD限制）
        batch_sleep_if_needed(batch_processed_count, processed_usernames, data)
        
        # 每处理10个保存一次进度和data.json
        if idx % 10 == 0:
            processed_usernames.add(username)
            save_progress({'processed': list(processed_usernames)})
            with open('data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"\n  💾 已保存进度（每10个保存一次）")
        else:
            processed_usernames.add(username)
    
    # 最终保存
    save_progress({'processed': list(processed_usernames)})
    
    # 删除不存在的条目
    if items_to_delete:
        print(f"\n🗑️  正在删除 {len(items_to_delete)} 个不存在的条目...")
        for category in data['categories']:
            for child in category['children']:
                # 过滤掉待删除的条目
                original_count = len(child['items'])
                child['items'] = [item for item in child['items'] if item not in items_to_delete]
                removed_count = original_count - len(child['items'])
                if removed_count > 0:
                    print(f"  从 {category['parentName']} > {child['name']} 删除了 {removed_count} 个条目")
        
        # 保存已删除条目的备份
        if deleted_items:
            save_deleted_items(deleted_items)
            print(f"  💾 已删除条目已备份到: {DELETED_ITEMS_FILE}")
    
    # 保存更新后的data.json
    if updated_count > 0 or items_to_delete:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n💾 data.json 已更新")
    
    total_time = time.time() - start_time
    
    print("\n" + "=" * 60)
    print("📊 处理统计：")
    print(f"  ✅ 成功获取: {success_count} 个")
    print(f"  ⏭️  跳过: {skip_count} 个")
    print(f"  ❌ 失败: {error_count} 个")
    print(f"  🗑️  已删除: {deleted_count} 个（频道不存在）")
    print(f"  📁 共更新: {updated_count} 个头像")
    print(f"  ⏱️  总耗时: {total_time/60:.1f} 分钟")
    print(f"  📁 头像保存在: {AVATAR_DIR}/ 目录")
    
    if deleted_items:
        print(f"  📦 已删除条目备份: {DELETED_ITEMS_FILE}")
    
    print("\n💡 下一步：")
    print("   1. 将 telegram_avatars 文件夹上传到你的服务器")
    print("   2. 或使用图床服务获取在线URL")
    if deleted_count > 0:
        print(f"   3. 已自动删除 {deleted_count} 个不存在的频道/群组")
        print(f"   4. 如需恢复，请查看: {DELETED_ITEMS_FILE}")
    print("=" * 60)

if __name__ == '__main__':
    process_data_json()

