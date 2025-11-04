#!/bin/bash
# 创建虚拟环境并安装依赖

echo "=========================================="
echo "设置Python虚拟环境"
echo "=========================================="

# 进入脚本目录
cd "$(dirname "$0")"

# 检查Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，正在安装..."
    sudo apt update
    sudo apt install python3 python3-pip python3-venv -y
fi

echo "✅ Python3 版本: $(python3 --version)"

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
    echo "✅ 虚拟环境创建完成"
else
    echo "✅ 虚拟环境已存在"
fi

# 激活虚拟环境并安装依赖
echo "📦 安装依赖库..."
source venv/bin/activate
pip install --upgrade pip
pip install requests python-dotenv

echo "✅ 依赖安装完成"
echo ""
echo "=========================================="
echo "虚拟环境设置完成！"
echo "=========================================="
echo ""
echo "使用方法："
echo "1. 激活虚拟环境: source venv/bin/activate"
echo "2. 运行脚本: python3 fetch_telegram_avatars.py"
echo "3. 或使用PM2: pm2 start ecosystem.config.js"
echo ""

