-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDOR', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING', 'PICKUP');

-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('STORE_PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "StaffPermission" AS ENUM ('MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_PICKUP', 'MANAGE_RETURN', 'MANAGE_INVOICES', 'VIEW_REPORTS');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PARTIALLY_PAID', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentFor" AS ENUM ('RENT', 'SECURITY_DEPOSIT', 'DELIVERY_CHARGE');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'WITH_CUSTOMER');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('FLAT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RETURN_REMINDER', 'LATE_ALERT', 'PAYMENT_CONFIRMATION');

-- CreateEnum
CREATE TYPE "PeriodUnit" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "AttributeDisplayType" AS ENUM ('RADIO', 'PILLS', 'CHECKBOX', 'IMAGE');

-- CreateEnum
CREATE TYPE "DeliveryChargeType" AS ENUM ('FLAT', 'PER_KM', 'FREE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "role" "UserRole" NOT NULL,
    "profileLogo" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT,
    "companyLogo" TEXT,
    "gstin" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "AddressType" NOT NULL,
    "name" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorStaff" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "permissions" "StaffPermission"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayType" "AttributeDisplayType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeValue" (
    "id" SERIAL NOT NULL,
    "attributeId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "extraPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRentable" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantAttributeValue" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "attributeId" INTEGER NOT NULL,
    "attributeValueId" INTEGER NOT NULL,

    CONSTRAINT "VariantAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPeriod" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "unit" "PeriodUnit" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPrice" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RentalPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "maxDiscount" DOUBLE PRECISION,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTill" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "couponId" INTEGER,
    "deliveryAddressId" INTEGER,
    "billingAddressId" INTEGER,
    "fulfillmentType" "FulfillmentType",
    "deliveryCharge" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rentalStart" TIMESTAMP(3) NOT NULL,
    "rentalEnd" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rentalStart" TIMESTAMP(3) NOT NULL,
    "rentalEnd" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalOrder" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "pickupAddressId" INTEGER,
    "deliveryAddressId" INTEGER,
    "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "discountAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rentalStart" TIMESTAMP(3) NOT NULL,
    "rentalEnd" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "availableQty" INTEGER NOT NULL,
    "status" "StockStatus" NOT NULL DEFAULT 'RESERVED',

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLog" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "changeQty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "createdByUserId" INTEGER NOT NULL,
    "rentalAmount" DOUBLE PRECISION NOT NULL,
    "securityDeposit" DOUBLE PRECISION NOT NULL,
    "deliveryCharge" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "for" "PaymentFor" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripeRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pickup" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "handledByUserId" INTEGER NOT NULL,
    "pickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "handledByUserId" INTEGER,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "handledByUserId" INTEGER NOT NULL,
    "returnedAt" TIMESTAMP(3) NOT NULL,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "damageFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositRefunded" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDeliveryConfig" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "isDeliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chargeType" "DeliveryChargeType" NOT NULL,
    "flatCharge" DOUBLE PRECISION,
    "ratePerKm" DOUBLE PRECISION,
    "freeAboveAmount" DOUBLE PRECISION,
    "maxDeliveryKm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorDeliveryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VendorStaff_vendorId_staffId_key" ON "VendorStaff"("vendorId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_name_key" ON "Attribute"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_attributeId_value_key" ON "AttributeValue"("attributeId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "VariantAttributeValue_variantId_attributeId_key" ON "VariantAttributeValue"("variantId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPeriod_duration_unit_key" ON "RentalPeriod"("duration", "unit");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPrice_variantId_periodId_key" ON "RentalPrice"("variantId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_customerId_key" ON "Cart"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_rentalStart_rentalEnd_key" ON "CartItem"("cartId", "variantId", "rentalStart", "rentalEnd");

-- CreateIndex
CREATE UNIQUE INDEX "RentalOrder_quotationId_key" ON "RentalOrder"("quotationId");

-- CreateIndex
CREATE INDEX "Reservation_variantId_startDate_endDate_idx" ON "Reservation"("variantId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Pickup_orderId_key" ON "Pickup"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Return_orderId_key" ON "Return"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorDeliveryConfig_vendorId_key" ON "VendorDeliveryConfig"("vendorId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorStaff" ADD CONSTRAINT "VendorStaff_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorStaff" ADD CONSTRAINT "VendorStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantAttributeValue" ADD CONSTRAINT "VariantAttributeValue_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantAttributeValue" ADD CONSTRAINT "VariantAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantAttributeValue" ADD CONSTRAINT "VariantAttributeValue_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "AttributeValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPrice" ADD CONSTRAINT "RentalPrice_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPrice" ADD CONSTRAINT "RentalPrice_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "RentalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalOrder" ADD CONSTRAINT "RentalOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalOrder" ADD CONSTRAINT "RentalOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RentalOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDeliveryConfig" ADD CONSTRAINT "VendorDeliveryConfig_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
