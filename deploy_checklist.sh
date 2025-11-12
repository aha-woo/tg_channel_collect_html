#!/bin/bash
# 部署检查清单脚本

echo "=========================================="
echo "部署文件检查清单"
echo "=========================================="
echo ""

# 检查必要文件
echo "✓ 检查必要文件..."
files=(
    "index.html"
    "index-json.html"
    "style.css"
    "script-json.js"
    "tglogo.jpg"
    "data/index.json"
)

missing_files=()
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (缺失)"
        missing_files+=("$file")
    fi
done

echo ""
echo "✓ 检查数据文件..."
data_files=$(find data -name "*.json" 2>/dev/null | wc -l)
echo "  找到 $data_files 个JSON文件"

echo ""
echo "✓ 检查头像文件..."
avatar_files=$(find telegram_avatars -name "*.jpg" -o -name "*.png" 2>/dev/null | wc -l)
echo "  找到 $avatar_files 个头像文件"

echo ""
echo "✓ 检查不需要的文件..."
unwanted_dirs=("download" "爬下来的TG 频道信息" "telegram_descriptions")
for dir in "${unwanted_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ⚠ $dir/ 目录存在（建议删除）"
    fi
done

py_files=$(find . -maxdepth 1 -name "*.py" 2>/dev/null | wc -l)
if [ "$py_files" -gt 0 ]; then
    echo "  ⚠ 找到 $py_files 个Python文件（开发脚本，不需要部署）"
fi

echo ""
echo "=========================================="
if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✓ 所有必要文件都存在！"
    echo ""
    echo "文件大小统计："
    du -sh . 2>/dev/null
    du -sh data/ 2>/dev/null
    du -sh telegram_avatars/ 2>/dev/null
else
    echo "✗ 缺少以下文件："
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
fi
echo "=========================================="

