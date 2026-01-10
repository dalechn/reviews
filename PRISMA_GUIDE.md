# Prisma 基本用法指南

## 概述

Prisma 是一个现代化的数据库 ORM，支持多种数据库（PostgreSQL、MySQL、SQLite、SQL Server、MongoDB 等）。它提供了类型安全的数据库访问、自动生成的数据模型和强大的迁移系统。

## 核心概念

### Schema 文件
`prisma/schema.prisma` - 定义数据库模型、数据源和生成器配置

```prisma
// 数据源配置
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 生成器配置
generator client {
  provider = "prisma-client-js"
}

// 数据模型
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

## 核心命令

### 1. 初始化项目
```bash
# 初始化 Prisma 项目
npx prisma init

# 或者在现有项目中初始化
npx prisma init --datasource-provider postgresql
```

### 2. 数据库迁移

#### 开发环境迁移
```bash
# 生成并应用迁移（开发环境）
npx prisma migrate dev

# 指定迁移名称
npx prisma migrate dev --name add_user_table
```

#### 生产环境迁移
```bash
# 应用所有未应用的迁移（生产环境）
npx prisma migrate deploy

# 检查迁移状态
npx prisma migrate status
```

#### 迁移管理
```bash
# 查看迁移历史
npx prisma migrate status

# 标记迁移为已应用（解决迁移冲突）
npx prisma migrate resolve --applied migration_name

# 重置数据库（删除所有数据，重新应用所有迁移）
npx prisma migrate reset
```

### 3. 生成 Prisma 客户端
```bash
# 生成 Prisma 客户端（基于 schema.prisma）
npx prisma generate
```

### 4. 数据库操作

#### 查看数据库
```bash
# 打开 Prisma Studio（Web 界面查看和编辑数据）
npx prisma studio
```

#### 数据库检查
```bash
# 验证 schema.prisma 与数据库的兼容性
npx prisma validate

# 显示数据库信息
npx prisma db pull

# 将数据库 schema 推送到数据库（⚠️ 会覆盖数据库）
npx prisma db push
```

## 基本使用示例

### 1. 创建数据
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建用户
  const user = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
    },
  })

  // 创建文章
  const post = await prisma.post.create({
    data: {
      title: 'Hello World',
      content: 'This is my first post',
      authorId: user.id,
    },
  })

  console.log({ user, post })
}
```

### 2. 查询数据
```typescript
// 查询所有用户
const users = await prisma.user.findMany()

// 查询单个用户及其文章
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true },
})

// 条件查询
const publishedPosts = await prisma.post.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
})
```

### 3. 更新数据
```typescript
// 更新用户
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: { name: 'Alice Smith' },
})

// 更新多个记录
const updatedPosts = await prisma.post.updateMany({
  where: { published: false },
  data: { published: true },
})
```

### 4. 删除数据
```typescript
// 删除单个记录
const deletedUser = await prisma.user.delete({
  where: { id: 1 },
})

// 删除多个记录
const deletedPosts = await prisma.post.deleteMany({
  where: { published: false },
})
```

## 环境变量配置

创建 `.env` 文件：
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

## 常见工作流

### 开发环境
1. 修改 `schema.prisma`
2. 运行 `npx prisma migrate dev`
3. 运行 `npx prisma generate`
4. 在代码中使用生成的 Prisma 客户端

### 生产环境
1. 部署代码到生产环境
2. 运行 `npx prisma migrate deploy`
3. 运行 `npx prisma generate`
4. 启动应用

## 故障排除

### 迁移失败
```bash
# 检查迁移状态
npx prisma migrate status

# 如果迁移失败，标记为已解决
npx prisma migrate resolve --applied failed_migration_name

# 或者回滚迁移
npx prisma migrate resolve --rolled-back failed_migration_name
```

### 客户端不同步
```bash
# 重新生成客户端
npx prisma generate

# 清除缓存并重启应用
```

## 最佳实践

1. **总是使用迁移**：不要手动修改数据库 schema
2. **定期备份**：在生产环境中运行迁移前备份数据库
3. **使用事务**：对于多个相关操作使用事务确保数据一致性
4. **类型安全**：利用 Prisma 的类型安全特性
5. **连接池**：在生产环境中使用连接池

## 常用命令速查表

| 命令 | 说明 |
|------|------|
| `npx prisma init` | 初始化 Prisma 项目 |
| `npx prisma migrate dev` | 开发环境迁移 |
| `npx prisma migrate deploy` | 生产环境迁移 |
| `npx prisma generate` | 生成 Prisma 客户端 |
| `npx prisma studio` | 打开数据库管理界面 |
| `npx prisma migrate status` | 查看迁移状态 |
| `npx prisma db push` | 推送 schema 到数据库 |
| `npx prisma validate` | 验证 schema 文件 |

## 更多资源

- [Prisma 官方文档](https://www.prisma.io/docs)
- [Prisma 数据指南](https://www.prisma.io/dataguide)
- [Prisma 示例](https://github.com/prisma/prisma-examples)
