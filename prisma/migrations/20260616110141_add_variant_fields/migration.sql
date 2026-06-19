-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "propertyName1" TEXT,
ADD COLUMN     "propertyName2" TEXT,
ADD COLUMN     "propertyName3" TEXT,
ADD COLUMN     "propertyValue1" TEXT,
ADD COLUMN     "propertyValue2" TEXT,
ADD COLUMN     "propertyValue3" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "VariantOption" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VariantOption_type_value_key" ON "VariantOption"("type", "value");
