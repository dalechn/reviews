-- Set default shopId for existing data
UPDATE "customers" SET "shopId" = 'default-shop' WHERE "shopId" IS NULL;
UPDATE "products" SET "shopId" = 'default-shop' WHERE "shopId" IS NULL;
UPDATE "reviews" SET "shopId" = 'default-shop' WHERE "shopId" IS NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "shopId" TEXT NOT NULL DEFAULT 'default-shop';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "shopId" TEXT NOT NULL DEFAULT 'default-shop';

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "shopId" TEXT NOT NULL DEFAULT 'default-shop';

-- CreateIndex
CREATE INDEX "customers_shopId_idx" ON "customers"("shopId");

-- CreateIndex
CREATE INDEX "products_shopId_idx" ON "products"("shopId");

-- CreateIndex
CREATE INDEX "reviews_shopId_idx" ON "reviews"("shopId");

-- CreateIndex
CREATE INDEX "reviews_shopId_published_idx" ON "reviews"("shopId", "published");

-- CreateIndex
CREATE INDEX "reviews_shopId_createdAt_idx" ON "reviews"("shopId", "createdAt");
