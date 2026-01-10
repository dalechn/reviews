/*
  Warnings:

  - Added the required column `shopId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "shopId" TEXT NOT NULL;

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
