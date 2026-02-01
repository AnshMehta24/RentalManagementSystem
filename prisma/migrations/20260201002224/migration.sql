-- CreateTable
CREATE TABLE "QuotationPaymentLinkLog" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "checkoutUrl" TEXT NOT NULL,
    "sentToEmail" TEXT NOT NULL,
    "sentByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationPaymentLinkLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuotationPaymentLinkLog_quotationId_idx" ON "QuotationPaymentLinkLog"("quotationId");

-- AddForeignKey
ALTER TABLE "QuotationPaymentLinkLog" ADD CONSTRAINT "QuotationPaymentLinkLog_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationPaymentLinkLog" ADD CONSTRAINT "QuotationPaymentLinkLog_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
