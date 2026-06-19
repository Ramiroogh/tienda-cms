-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "purchaseOrderId" TEXT,
ADD COLUMN     "saleOrderId" TEXT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
