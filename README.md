# Shopify评论服务器

这是一个使用 Next.js、PostgreSQL 和 Prisma 构建的 Shopify 评论管理系统。

## 技术栈

- **Next.js 16** - React的全栈框架
- **React 19** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **PostgreSQL** - 关系型数据库
- **Prisma** - 数据库ORM和迁移工具
- **Redis** - 消息队列和高性能缓存
- **BullMQ** - Redis-based消息队列
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

### 2. 数据库和消息队列设置

#### 🚀 快速设置（推荐）- 使用Docker + PostgreSQL + Redis

**消息队列特性：**
- ⚡ **异步评论发布** - 评论创建后立即响应，邮件发送异步处理
- 📧 **可靠邮件通知** - 失败自动重试，保证邮件送达
- 🔄 **高并发处理** - 支持同时处理多个评论请求
- 📊 **作业监控** - 实时监控队列状态和处理进度

快速启动包含完整应用栈（PostgreSQL + Redis）：

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

### 5. 启动开发服务器和队列工作器

```bash
# 终端1: 启动Next.js开发服务器
npm run dev

# 终端2: 启动队列工作器（处理异步任务）
npm run worker:dev
```

**队列工作器功能：**
- 📧 处理评论邮件通知
- 🔄 自动重试失败的任务
- 📊 实时监控队列状态
- ⚡ 高并发作业处理

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
# 构建Next.js应用
npm run build

# 启动生产应用（需要Redis运行）
npm start

# 在另一个终端启动队列工作器
npm run worker
```

**生产环境部署注意事项：**
- 🔴 **Redis必须运行** - 队列工作器依赖Redis
- 📋 **多进程部署** - 建议使用PM2等进程管理器
- ⚖️ **负载均衡** - 多个工作器实例提高可靠性
- 📊 **监控告警** - 设置队列积压和失败任务告警

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

# SMTP配置（用于新评论邮件通知）
SMTP_HOST=smtp.mailersend.net
SMTP_PORT=587
SMTP_USER=MS_tQXWD1@test-y7zpl9831j545vx6.mlsender.net
SMTP_PASS=mssp.Ff5rIcZ.k68zxl25q9mlj905.FPe3zsd
SMTP_FROM=MS_tQXWD1@test-y7zpl9831j545vx6.mlsender.net
ADMIN_EMAIL=your-admin-email@example.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### SMTP邮件通知说明

邮件会发送到 `ADMIN_EMAIL` 指定的邮箱，如果未设置则发送到 SMTP 用户名对应的域名管理员邮箱。

##### 邮件内容包含

新评论通知邮件包含以下信息：
- 📝 **客户姓名和产品名称**
- ⭐ **评分（星级显示）**
- 📋 **评论标题和内容**
- 🖼️ **媒体文件预览**（如果评论包含图片/视频/音频）

**媒体文件显示方式：**

**🖼️ 图片文件：**
- 直接在邮件中显示缩略图（最大200x200px）
- 自动调整比例，保持原始宽高比
- 圆角边框和阴影效果
- 加载失败时自动隐藏

**🎥 视频文件：**
- 显示HTML5视频播放器
- 支持MP4、WebM、OGG等格式
- 带播放控制按钮和进度条
- 显示视频时长提示

**🎵 音频文件：**
- 显示音频播放器控件
- 支持MP3、WAV、OGG、M4A等格式
- 蓝色主题边框标识

**📄 其他文件：**
- 显示文件图标和名称
- 标明文件类型（PDF、DOC等）
- 提供下载链接
- 灰色主题边框标识

**响应式布局：**
- 媒体文件采用弹性布局
- 支持多文件并排显示
- 移动端自适应排列

##### 测试邮件功能

**方法1：运行测试脚本**
```bash
# 直接运行测试脚本（自动使用环境变量或默认MailerSend配置）
node test-email.mjs
```

或者设置环境变量后运行：
```bash
SMTP_HOST=smtp.mailersend.net \
SMTP_PORT=587 \
SMTP_USER=MS_tQXWD1@test-y7zpl9831j545vx6.mlsender.net \
SMTP_PASS=mssp.Ff5rIcZ.k68zxl25q9mlj905.FPe3zsd \
node test-email.mjs
```

测试脚本会验证SMTP连接并发送测试邮件。

**方法2：通过创建评论测试**
1. 确保环境变量已正确配置
2. 重启应用服务器
3. 通过API创建一个测试评论来触发邮件发送

**方法3：查看应用日志**
创建评论后，查看终端日志：
- `📧 Sending review notification email...` - 开始发送
- `✅ Email sent successfully to: xxx` - 发送成功
- `❌ Failed to send email to: xxx` - 发送失败

**方法4：开发模式邮件模拟**
如果网络问题无法解决，可以使用邮件模拟模式：

1. **创建 `.env.local` 文件**（如果不存在）：
   ```env
   # 开发环境 - 启用邮件模拟模式
   # 注释掉SMTP配置以启用模拟模式
   # SMTP_HOST=smtp.mailersend.net
   # SMTP_PORT=587
   # SMTP_USER=MS_tQXWD1@test-y7zpl9831j545vx6.mlsender.net
   # SMTP_PASS=mssp.Ff5rIcZ.k68zxl25q9mlj905.FPe3zsd

   # 设置管理员邮箱
   ADMIN_EMAIL=your-admin-email@example.com
   ```

2. **重启开发服务器**

3. **创建评论测试** - 控制台会显示完整的邮件内容预览

##### SMTP故障排除

常见错误及解决方法：

- **`Unexpected socket close`** → 检查网络连接或尝试端口2525
- **`Authentication failed`** → 确认用户名和密码正确
- **`Connection timeout`** → 检查防火墙设置

MailerSend配置要点：
- 使用端口 `587` 或 `2525`
- 确保 STARTTLS 启用（secure: false）
- 确认用户名格式正确

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

docker-compose -f docker-compose.app.yml up -d --build
