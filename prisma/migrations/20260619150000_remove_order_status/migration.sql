-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "orderStatus",
DROP COLUMN "receivedAt";

-- DropEnum
DROP TYPE "PurchaseOrderStatus";
