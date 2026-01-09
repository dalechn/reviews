#!/bin/bash

# Shopify评论服务器 - Docker + Prisma 设置脚本
# 用于启动Docker容器并初始化数据库

set -e  # 遇到错误立即退出

echo "🚀 开始设置Shopify评论服务器..."

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

# 设置环境变量
export DATABASE_URL="postgresql://admin:46647451@localhost:5432/shopify_reviews"

echo "🐳 启动PostgreSQL容器..."
docker-compose up -d --build 

echo "⏳ 等待数据库启动..."
# 等待数据库就绪，最多等待30秒
TIMEOUT=30
COUNTER=0

while [ $COUNTER -lt $TIMEOUT ]; do
    if docker-compose exec -T db pg_isready -U admin -d shopify_reviews &> /dev/null; then
        echo "✅ 数据库已就绪！"
        break
    fi

    echo "等待数据库启动... (${COUNTER}/${TIMEOUT})"
    sleep 2
    COUNTER=$((COUNTER + 2))

    if [ $COUNTER -ge $TIMEOUT ]; then
        echo "❌ 数据库启动超时"
        echo "查看容器日志: docker-compose logs db"
        exit 1
    fi
done

echo "🗄️ 运行Prisma数据库迁移..."
if npx prisma migrate dev --name init; then
    echo "✅ 数据库迁移完成"
else
    echo "⚠️ 迁移失败，可能数据库已存在，尝试重置..."
    npx prisma migrate reset --force
fi

echo "🔧 生成Prisma客户端..."
npx prisma generate

echo ""
echo "🎉 设置完成！"
echo ""
echo "📋 接下来你可以："
echo "1. 启动开发服务器: npm run dev"
echo "2. 访问应用: http://localhost:3000"
echo "3. 查看容器状态: docker-compose ps"
echo "4. 查看容器日志: docker-compose logs -f"
echo ""
echo "🔗 数据库信息："
echo "  主机: localhost:5432"
echo "  用户: admin"
echo "  数据库: shopify_reviews"
echo "  密码: 46647451"
