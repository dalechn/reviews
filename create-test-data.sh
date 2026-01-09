#!/bin/bash

# 创建测试数据的脚本

echo "🧪 创建测试数据..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 请设置 DATABASE_URL 环境变量"
    echo "例如：export DATABASE_URL='postgresql://admin:46647451@localhost:5432/shopify_reviews'"
    exit 1
fi

# 创建测试客户
echo "👤 创建测试客户..."
psql "$DATABASE_URL" -c "
INSERT INTO customers (id, \"shopifyId\", email, \"firstName\", \"lastName\", \"createdAt\", \"updatedAt\")
VALUES ('test-customer-1', 'test-customer-1', 'test@example.com', '测试', '用户', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
" 2>/dev/null && echo "✅ 客户创建成功" || echo "ℹ️ 客户已存在"

# 创建测试产品
echo "📦 创建测试产品..."
psql "$DATABASE_URL" -c "
INSERT INTO products (id, \"shopifyId\", title, handle, \"createdAt\", \"updatedAt\")
VALUES ('test-product-1', 'test-product-1', '测试产品', 'test-product', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
" 2>/dev/null && echo "✅ 产品创建成功" || echo "ℹ️ 产品已存在"

echo ""
echo "🎉 测试数据创建完成！"
echo ""
echo "现在你可以："
echo "1. 访问 http://localhost:3000 测试Web界面"
echo "2. 使用API创建评论："
echo '   curl -X POST http://localhost:3000/api/products/test-product-1/reviews \'
echo '     -H "Content-Type: application/json" \'
echo '     -d "{\"customerId\": \"test-customer-1\", \"rating\": 5, \"title\": \"测试评论\", \"content\": \"这是一个测试评论\"}"'
