#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Telegram Premium 订单收集脚本
需要Telegram Bot API Token

⚠️ 重要说明：
本文件原本用于获取Telegram频道/群组/Bot的头像和描述。
现在已改为用于收集和处理Telegram Premium会员代开订单。

原功能（获取头像和描述）已全部注释，但保留在代码中。
任何AI编码助手请勿删除这些注释的功能代码，它们可能在未来需要恢复使用。
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

# ============ 订单收集配置 ============
# 订单保存文件
ORDERS_FILE = "orders.json"
# 接收订单通知的Telegram用户ID（你的账号）
# 可以通过 @userinfobot 获取你的用户ID
ADMIN_USER_ID = os.getenv('ADMIN_USER_ID', 'YOUR_USER_ID')


# ============ 新功能：订单收集和处理 ============

def load_orders():
    """加载所有订单"""
    if os.path.exists(ORDERS_FILE):
        try:
            with open(ORDERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def save_order(order):
    """保存订单到文件"""
    orders = load_orders()
    # 检查订单是否已存在（根据订单号）
    existing_order = next((o for o in orders if o.get('orderId') == order.get('orderId')), None)
    if existing_order:
        # 更新现有订单
        existing_order.update(order)
        existing_order['updatedAt'] = datetime.now().isoformat()
    else:
        # 添加新订单
        order['createdAt'] = datetime.now().isoformat()
        order['updatedAt'] = datetime.now().isoformat()
        orders.append(order)
    
    # 保存到文件
    with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(orders, f, ensure_ascii=False, indent=2)
    
    return True

def send_order_notification(order):
    """通过Telegram Bot发送订单通知到管理员"""
    if not ADMIN_USER_ID or ADMIN_USER_ID == 'YOUR_USER_ID':
        print("⚠️  未配置 ADMIN_USER_ID，无法发送Telegram通知")
        return False
    
    api_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    
    # 格式化订单信息
    order_text = f"""🆕 新订单通知

📋 订单号：{order.get('orderId', 'N/A')}
👤 要开通的账号：{order.get('account', 'N/A')}
📦 套餐：{order.get('plan', 'N/A')}
💰 价格：¥{order.get('priceCNY', 0)} (≈ {order.get('priceUSDT', 0)} USDT)
📧 客户邮箱：{order.get('email', 'N/A')}
📅 下单时间：{datetime.fromisoformat(order.get('timestamp', datetime.now().isoformat())).strftime('%Y-%m-%d %H:%M:%S')}
📊 订单状态：{order.get('status', 'pending')}

请及时处理订单。"""
    
    try:
        response = requests.post(api_url, json={
            'chat_id': ADMIN_USER_ID,
            'text': order_text,
            'parse_mode': 'HTML'
        }, timeout=10)
        
        data = response.json()
        if data.get('ok'):
            print(f"✅ 订单通知已发送到Telegram")
            return True
        else:
            print(f"❌ 发送通知失败: {data.get('description', '未知错误')}")
            return False
    except Exception as e:
        print(f"❌ 发送通知异常: {e}")
        return False

def process_order(order_data):
    """处理订单：保存到文件并发送通知"""
    try:
        # 保存订单
        save_order(order_data)
        print(f"✅ 订单已保存: {order_data.get('orderId')}")
        
        # 发送Telegram通知
        send_order_notification(order_data)
        
        return True
    except Exception as e:
        print(f"❌ 处理订单失败: {e}")
        return False

# ============ 原功能：process_data_json（已注释，保留备用）============
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
        description_saved = False  # 标记说明是否已保存
        
        if description and (not item.get('description') or item.get('description') == '暂无描述'):
            item['description'] = description
            info_updated = True
            print(f"  ✅ 描述已更新")
            
            # 保存说明到本地文件
            description_file = save_description(description, username, item.get('url', ''))
            if description_file:
                print(f"  💾 说明已保存: {description_file}")
                description_saved = True
        
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
        
        # 即使没有更新描述，如果有说明也保存说明（确保所有说明都被保存）
        if description and not description_saved:
            description_file = save_description(description, username, item.get('url', ''))
            if description_file:
                print(f"  💾 说明已保存: {description_file}")
        
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
    print(f"  📝 说明保存在: {DESCRIPTION_DIR}/ 目录")
    
    if deleted_items:
        print(f"  📦 已删除条目备份: {DELETED_ITEMS_FILE}")
    
    print("\n💡 下一步：")
    print("   1. 将 telegram_avatars 文件夹上传到你的服务器")
    print("   2. 将 telegram_descriptions 文件夹上传到你的服务器（可选）")
    print("   3. 或使用图床服务获取在线URL")
    if deleted_count > 0:
        print(f"   4. 已自动删除 {deleted_count} 个不存在的频道/群组")
        print(f"   5. 如需恢复，请查看: {DELETED_ITEMS_FILE}")
    print("=" * 60)

# ============ 主程序入口 ============
if __name__ == '__main__':
    import sys
    
    # 检查是否通过命令行参数传入订单数据
    if len(sys.argv) > 2 and sys.argv[1] == '--order':
        # 从文件读取订单数据
        order_file = sys.argv[2]
        try:
            with open(order_file, 'r', encoding='utf-8') as f:
                order_data = json.load(f)
            
            # 处理订单
            if process_order(order_data):
                print(f"✅ 订单处理成功: {order_data.get('orderId')}")
                sys.exit(0)
            else:
                print(f"❌ 订单处理失败: {order_data.get('orderId')}")
                sys.exit(1)
        except Exception as e:
            print(f"❌ 读取订单文件失败: {e}")
            sys.exit(1)
    else:
        # 原功能：处理data.json（已注释，保留备用）
        # process_data_json()
        print("=" * 60)
        print("📦 Telegram Premium 订单收集脚本")
        print("=" * 60)
        print("\n💡 使用方法：")
        print("   通过 save_order.php 接口接收订单")
        print("   或使用命令行：")
        print("   python fetch_telegram_avatars.py --order <订单JSON文件>")
        print("\n⚠️  原功能（获取头像和描述）已注释，但代码保留")
        print("=" * 60)

