#!/bin/bash
# 使用PM2启动脚本

echo "=========================================="
echo "启动 Telegram 头像获取脚本 (PM2)"
echo "=========================================="

# 进入脚本目录
cd "$(dirname "$0")"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "❌ 虚拟环境不存在，正在创建..."
    bash setup_venv.sh
fi

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，正在安装..."
    sudo npm install -g pm2
fi

# 创建日志目录
mkdir -p logs

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  .env 文件不存在，请先创建并配置 BOT_TOKEN"
    echo "   示例: echo 'BOT_TOKEN=your_token' > .env"
    exit 1
fi

# 检查PM2进程是否已运行
if pm2 list | grep -q "fetch-telegram-avatars"; then
    echo "⚠️  脚本已在运行中"
    echo "   查看状态: pm2 status"
    echo "   查看日志: pm2 logs fetch-telegram-avatars"
    echo "   停止脚本: pm2 stop fetch-telegram-avatars"
    echo "   重启脚本: pm2 restart fetch-telegram-avatars"
else
    echo "🚀 启动脚本..."
    pm2 start ecosystem.config.js
    
    echo ""
    echo "✅ 脚本已启动！"
    echo ""
    echo "常用命令："
    echo "  查看状态: pm2 status"
    echo "  查看日志: pm2 logs fetch-telegram-avatars"
    echo "  实时日志: pm2 logs fetch-telegram-avatars --lines 50"
    echo "  停止脚本: pm2 stop fetch-telegram-avatars"
    echo "  重启脚本: pm2 restart fetch-telegram-avatars"
    echo "  删除脚本: pm2 delete fetch-telegram-avatars"
    echo ""
fi

