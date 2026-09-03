ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'travel';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'electronics';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'home';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'clothing';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'outdoor';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'beauty';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'kids';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'office';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'USD';
ALTER TABLE "Product"
  ALTER COLUMN "badges" TYPE TEXT[]
  USING "badges"::TEXT::TEXT[];
DROP TYPE "ProductBadge";
