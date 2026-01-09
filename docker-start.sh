#!/bin/bash

# Next.js + PostgreSQL Docker 启动脚本
# 用于使用 Docker 启动整个应用栈

set -e  # 遇到错误立即退出

echo "🚀 开始启动 Next.js + PostgreSQL 应用..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安装，请先安装 docker-compose"
    exit 1
fi

# 检查Docker daemon是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon 未运行，请先启动 Docker Desktop 或运行 'sudo systemctl start docker'"
    exit 1
fi

echo "✅ Docker 和 docker-compose 已安装且运行正常"

echo "🐳 构建并启动所有服务..."
echo "选择模式："
echo "1) 生产模式 (默认 - 预构建应用)"
echo "2) 开发模式 (热重载，适合开发)"
read -p "请选择 (1/2): " mode

if [ "$mode" = "2" ]; then
    echo "启动开发模式..."
    docker-compose -f docker-compose.dev.yml up --build -d
else
    echo "启动生产模式..."
    docker-compose up --build -d
fi

echo "⏳ 等待服务启动..."
sleep 10

echo ""
echo "🎉 启动完成！"
echo ""
echo "📋 服务信息："
echo "1. Next.js 应用: http://localhost:3000"
echo "2. PostgreSQL 数据库: localhost:5432"
echo "   - 用户: admin"
echo "   - 密码: 46647451"
echo "   - 数据库: shopify_reviews"
echo ""
echo "🔧 管理命令："
echo "  查看服务状态: docker-compose ps"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
echo "⚠️  注意：如果这是第一次运行，数据库迁移可能需要一些时间"
