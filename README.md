# Shopify评论服务器

这是一个使用 Next.js、PostgreSQL 和 Prisma 构建的 Shopify 评论管理系统。

## 技术栈

- **Next.js 16** - React的全栈框架
- **React 19** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **PostgreSQL** - 关系型数据库
- **Prisma** - 数据库ORM和迁移工具
- **Tailwind CSS 4** - 实用优先的CSS框架
- **ESLint** - 代码质量检查

## 项目结构

```
firstnext/
├── src/
│   └── app/
│       ├── layout.tsx      # 根布局组件
│       ├── page.tsx        # 首页组件
│       └── globals.css     # 全局样式
├── public/                 # 静态资源
├── package.json           # 项目配置和依赖
├── tsconfig.json          # TypeScript配置
├── next.config.ts         # Next.js配置
├── postcss.config.mjs     # PostCSS配置
└── eslint.config.mjs      # ESLint配置
```

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 数据库设置

#### 🚀 快速设置（推荐）- 使用Docker + PostgreSQL

##### 启动完整应用栈（推荐）

运行 Docker 启动脚本启动整个项目：

```bash
./docker-start.sh
```

这个脚本会提供两种模式选择：

**生产模式**（默认）：
- ✅ 预构建 Next.js 应用
- ✅ 启动 PostgreSQL 数据库容器
- ✅ 运行数据库迁移
- ✅ 启动优化后的生产应用

**开发模式**：
- ✅ 热重载支持
- ✅ 实时代码同步
- ✅ 适合开发和调试

**稳定模式**：
- ✅ 使用 PostgreSQL 15（更稳定的网络下载）
- ✅ 适合网络环境不稳定的情况

应用将在 http://localhost:3000 可用。

#### 🐛 Docker 网络问题故障排除

如果遇到网络连接问题（如 EOF 错误、TLS timeout 等）：

```bash
# 运行自动修复脚本
./docker-fix.sh
```

**快速解决方案：**

1. **使用稳定模式**
   ```bash
   ./docker-start.sh
   # 选择选项 3（稳定模式）
   ```

2. **手动修复步骤**
   ```bash
   # 停止所有容器
   docker-compose down --volumes --remove-orphans

   # 清理缓存
   docker system prune -f
   docker builder prune -f

   # 重新启动
   ./docker-start.sh
   ```

3. **网络配置检查**
   - Docker Desktop > Settings > Resources > Network
   - 设置 DNS 为：8.8.8.8 或 1.1.1.1
   - 重启 Docker Desktop

##### 手动设置（开发环境）

运行自动设置脚本：

```bash
./setup.sh
```

这个脚本会自动：
- ✅ 启动PostgreSQL Docker容器
- ✅ 等待数据库就绪
- ✅ 运行Prisma迁移
- ✅ 生成Prisma客户端

#### 手动设置步骤

如果你想手动执行，可以按以下步骤：

```bash
# 1. 启动PostgreSQL容器
docker-compose up -d

# 2. 等待数据库就绪（约10-15秒）
docker-compose logs db

# 3. 设置环境变量并运行迁移
DATABASE_URL="postgresql://admin:46647451@localhost:5432/shopify_reviews" npx prisma migrate dev

# 4. 生成Prisma客户端
DATABASE_URL="postgresql://admin:46647451@localhost:5432/shopify_reviews" npx prisma generate
```

#### 使用本地 PostgreSQL

确保你有 PostgreSQL 运行，然后更新 `.env` 文件中的 `DATABASE_URL`：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/shopify_reviews?schema=public"
```

#### 使用 Prisma Postgres (云端)

```bash
npx create-db
```

这将创建一个免费的 Prisma Postgres 数据库。

### 3. 运行数据库迁移

```bash
npx prisma migrate dev
```

### 4. 生成 Prisma 客户端

```bash
npx prisma generate
```

### 5. 启动开发服务器

```bash
npm run dev
```

### 6. 创建测试数据（可选）

运行自动测试数据创建脚本：

```bash
# 确保设置了环境变量
export DATABASE_URL="postgresql://admin:46647451@localhost:5432/shopify_reviews"

# 运行脚本
./create-test-data.sh
```

或者手动创建测试数据：

```bash
# 连接到数据库
psql postgresql://admin:46647451@localhost:5432/shopify_reviews

# 在psql中执行：
INSERT INTO customers (id, "shopifyId", email, "firstName", "lastName", "createdAt", "updatedAt")
VALUES ('test-customer-1', 'test-customer-1', 'test@example.com', '测试', '用户', NOW(), NOW());

INSERT INTO products (id, "shopifyId", title, handle, "createdAt", "updatedAt")
VALUES ('test-product-1', 'test-product-1', '测试产品', 'test-product', NOW(), NOW());
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 查看结果。

### 6. 构建生产版本

```bash
npm run build
npm start
```

### 7. 代码检查

```bash
npm run lint
```

## API 端点

### 评论管理

#### 获取产品评论
```
GET /api/products/[id]/reviews?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

#### 创建评论
```
POST /api/products/[id]/reviews
```
```json
{
  "customerId": "customer-id",
  "rating": 5,
  "title": "Great product!",
  "content": "This product exceeded my expectations.",
  "verified": true
}
```

#### 更新评论
```
PUT /api/reviews/[id]
```
```json
{
  "rating": 4,
  "title": "Updated title",
  "content": "Updated content",
  "published": true
}
```

#### 删除评论
```
DELETE /api/reviews/[id]
```

#### 标记评论为有用
```
PATCH /api/reviews/[id]
```
```json
{
  "action": "helpful"
}
```

### 客户管理

#### 创建/更新客户
```
POST /api/customers
```
```json
{
  "shopifyId": "shopify-customer-id",
  "email": "customer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### 产品管理

#### 创建/更新产品
```
POST /api/products
```
```json
{
  "shopifyId": "shopify-product-id",
  "title": "Awesome Product",
  "handle": "awesome-product",
  "imageUrl": "https://example.com/product.jpg"
}
```

### 管理员功能

#### 获取所有评论 (管理员)
```
GET /api/admin/reviews?page=1&limit=20&status=pending&productId=product-id
```

### 🐳 Docker 故障排除

如果遇到问题：

```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs db

# 重启容器
docker-compose restart db

# 如果端口5432被占用，修改docker-compose.yml中的端口映射
# 将 "5432:5432" 改为 "5433:5432"
```

## 主要特性

- ⚡ **快速开发** - Next.js App Router提供优秀的开发体验
- 🗄️ **PostgreSQL 数据库** - 可靠的关系型数据库
- 🔄 **Prisma ORM** - 类型安全的数据库操作
- 📝 **评论管理系统** - 完整的评论 CRUD 操作
- ✅ **验证购买** - 支持验证购买状态
- ⭐ **星级评分** - 1-5星评分系统
- 🎨 **现代化样式** - Tailwind CSS v4 提供强大的样式系统
- 📱 **响应式设计** - 内置移动端适配
- 🔒 **类型安全** - TypeScript提供完整的类型检查
- 🚀 **性能优化** - 自动代码分割和优化

## 自定义样式

项目使用 Tailwind CSS v4，你可以通过以下方式自定义：

1. 在组件中使用 Tailwind 类名
2. 修改 `src/app/globals.css` 中的主题变量
3. 扩展 Tailwind 配置（如果需要）

## 部署

### 环境配置

#### 生产环境变量

在生产环境中，确保设置以下环境变量：

```env
# 生产数据库URL（通常包含SSL要求）
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# 生产环境标识
NODE_ENV=production
```

#### SSL配置说明

代码会根据环境自动配置SSL：

- **开发环境** (`NODE_ENV=development`)：默认禁用SSL
- **生产环境** (`NODE_ENV=production`)：默认启用SSL

你可以通过 `DATABASE_SSL` 环境变量手动控制：

```env
# 强制启用SSL（生产环境默认值）
DATABASE_SSL=true

# 强制禁用SSL（如果你的数据库不支持SSL）
DATABASE_SSL=false

# 不设置则根据NODE_ENV自动决定
# DATABASE_SSL=  # 注释掉或删除这一行
```

**常见场景：**
- **本地PostgreSQL**：`DATABASE_SSL=false`
- **AWS RDS**：`DATABASE_SSL=true`（默认）
- **Google Cloud SQL**：`DATABASE_SSL=true`（默认）
- **Supabase**：`DATABASE_SSL=true`（默认）
- **PlanetScale**：根据连接字符串中的SSL参数

### 部署平台

推荐在 [Vercel](https://vercel.com) 上部署，这是 Next.js 官方推荐的平台：

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量（`DATABASE_URL`, `NODE_ENV=production`）
4. 自动部署完成

你也可以查看 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多选项。

## 学习资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [Next.js 学习教程](https://nextjs.org/learn)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 许可证

本项目基于 MIT 许可证开源。
