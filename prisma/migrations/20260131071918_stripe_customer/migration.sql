/*
  Warnings:

  - The values [PENDING,SUCCESS] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `method` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deliveryCharge` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeCheckoutSessionId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripePaymentIntentId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "PaymentFor" ADD VALUE 'DELIVERY_CHARGE';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('REQUIRES_PAYMENT', 'SUCCEEDED', 'FAILED', 'REFUNDED');
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "deliveryCharge" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "method",
ADD COLUMN     "stripeCheckoutSessionId" TEXT NOT NULL,
ADD COLUMN     "stripePaymentIntentId" TEXT NOT NULL,
ADD COLUMN     "stripeRefundId" TEXT;

-- AlterTable
ALTER TABLE "RentalOrder" ADD COLUMN     "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyLogo" TEXT,
ADD COLUMN     "profileLogo" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
