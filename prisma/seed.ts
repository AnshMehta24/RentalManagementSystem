import {
  AddressType,
  CouponType,
  FulfillmentType,
  InvoiceStatus,
  NotificationType,
  OrderStatus,
  PaymentFor,
  PaymentStatus,
  QuotationStatus,
  StaffPermission,
  StockStatus,
  UserRole,
  PeriodUnit,
  AttributeDisplayType,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const password = await bcrypt.hash("password123", 10);

  // await prisma.user.create({
  //   data: {
  //     role: UserRole.ADMIN,
  //     name: "Super Admin",
  //     email: "admin@test.com",
  //     password,
  //   },
  // });

  // const vendor = await prisma.user.create({
  //   data: {
  //     role: UserRole.VENDOR,
  //     name: "City Rentals Owner",
  //     email: "vendor@test.com",
  //     password,
  //     companyName: "City Rentals",
  //     gstin: "24ABCDE1234F1Z5",
  //   },
  // });

  // const staff = await prisma.user.create({
  //   data: {
  //     role: UserRole.VENDOR,
  //     name: "Operations Staff",
  //     email: "staff@test.com",
  //     password,
  //   },
  // });

  // const customer = await prisma.user.create({
  //   data: {
  //     role: UserRole.CUSTOMER,
  //     name: "John Doe",
  //     email: "customer@test.com",
  //     password,
  //   },
  // });

  // const pickupAddress = await prisma.address.create({
  //   data: {
  //     userId: vendor.id,
  //     type: AddressType.PICKUP,
  //     line1: "Main Warehouse, Sector 5",
  //     city: "Ahmedabad",
  //     state: "Gujarat",
  //     country: "India",
  //     pincode: "380001",
  //     isDefault: true,
  //   },
  // });

  // const shippingAddress = await prisma.address.create({
  //   data: {
  //     userId: customer.id,
  //     type: AddressType.SHIPPING,
  //     line1: "Residential Complex A",
  //     city: "Ahmedabad",
  //     state: "Gujarat",
  //     country: "India",
  //     pincode: "380015",
  //     isDefault: true,
  //   },
  // });

  // await prisma.vendorStaff.create({
  //   data: {
  //     vendorId: vendor.id,
  //     staffId: staff.id,
  //     permissions: Object.values(StaffPermission),
  //   },
  // });

  // const colorAttr = await prisma.attribute.create({
  //   data: {
  //     name: "Color",
  //     displayType: AttributeDisplayType.IMAGE,
  //   },
  // });

  // await prisma.attributeValue.createMany({
  //   data: [
  //     { attributeId: colorAttr.id, value: "Red", extraPrice: 0 },
  //     { attributeId: colorAttr.id, value: "Blue", extraPrice: 0 },
  //     { attributeId: colorAttr.id, value: "Green", extraPrice: 0 },
  //     { attributeId: colorAttr.id, value: "Black", extraPrice: 0 },
  //     { attributeId: colorAttr.id, value: "White", extraPrice: 0 },
  //     { attributeId: colorAttr.id, value: "Silver", extraPrice: 0 },
  //     { attributeId: colorAttr.id, value: "Gold", extraPrice: 100 },
  //   ],
  // });

  // const sizeAttr = await prisma.attribute.create({
  //   data: {
  //     name: "Size",
  //     displayType: AttributeDisplayType.PILLS,
  //   },
  // });

  // await prisma.attributeValue.createMany({
  //   data: [
  //     { attributeId: sizeAttr.id, value: "Small", extraPrice: 0 },
  //     { attributeId: sizeAttr.id, value: "Medium", extraPrice: 0 },
  //     { attributeId: sizeAttr.id, value: "Large", extraPrice: 50 },
  //     { attributeId: sizeAttr.id, value: "X-Large", extraPrice: 100 },
  //   ],
  // });

  // const materialAttr = await prisma.attribute.create({
  //   data: {
  //     name: "Material",
  //     displayType: AttributeDisplayType.RADIO,
  //   },
  // });

  // await prisma.attributeValue.createMany({
  //   data: [
  //     { attributeId: materialAttr.id, value: "Cotton", extraPrice: 0 },
  //     { attributeId: materialAttr.id, value: "Polyester", extraPrice: 0 },
  //     { attributeId: materialAttr.id, value: "Leather", extraPrice: 200 },
  //     { attributeId: materialAttr.id, value: "Silk", extraPrice: 300 },
  //   ],
  // });

  // const blackValue = await prisma.attributeValue.findFirst({
  //   where: {
  //     attributeId: colorAttr.id,
  //     value: "Black",
  //   },
  // });

  // const hourly = await prisma.rentalPeriod.create({
  //   data: { name: "Hourly", duration: 1, unit: PeriodUnit.HOUR },
  // });
  // const daily = await prisma.rentalPeriod.create({
  //   data: { name: "Daily", duration: 1, unit: PeriodUnit.DAY },
  // });

  // const product = await prisma.product.create({
  //   data: {
  //     vendorId: vendor.id,
  //     name: "Professional DSLR Camera",
  //     description: "High-end photography equipment",
  //     published: true,
  //   },
  // });

  // const variant = await prisma.productVariant.create({
  //   data: {
  //     productId: product.id,
  //     sku: "CAM-DSLR-BLK-01",
  //     quantity: 5,
  //     costPrice: 45000,
  //     salePrice: 1200, 
  //   },
  // });

  // if (blackValue) {
  //   await prisma.variantAttributeValue.create({
  //     data: {
  //       variantId: variant.id,
  //       attributeId: colorAttr.id,
  //       attributeValueId: blackValue.id,
  //     },
  //   });
  // }

  // await prisma.rentalPrice.createMany({
  //   data: [
  //     { variantId: variant.id, periodId: hourly.id, price: 200 },
  //     { variantId: variant.id, periodId: daily.id, price: 1200 },
  //   ],
  // });

  // const coupon = await prisma.coupon.create({
  //   data: {
  //     code: "RENTNEW",
  //     type: CouponType.PERCENTAGE,
  //     value: 10,
  //     validFrom: new Date(),
  //     validTill: new Date(Date.now() + 60 * 86400000),
  //   },
  // });

  const quotation = await prisma.quotation.create({
    data: {
      customerId: 4,
      vendorId: 5,
      status: QuotationStatus.CONFIRMED,
      // couponId: coupon.id,
      items: {
        create: {
          variantId: 1,
          quantity: 1,
          rentalStart: new Date(),
          rentalEnd: new Date(Date.now() + 86400000), // 1 day later
          price: 1200,
        },
      },
    },
  });

  // const order = await prisma.rentalOrder.create({
  //   data: {
  //     quotationId: quotation.id,
  //     customerId: customer.id,
  //     fulfillmentType: FulfillmentType.DELIVERY,
  //     deliveryAddressId: shippingAddress.id,
  //     pickupAddressId: pickupAddress.id,
  //     deliveryCharge: 150,
  //     discountAmt: 120, // 10% of 1200
  //     status: OrderStatus.ACTIVE,
  //   },
  // });

  // await prisma.reservation.create({
  //   data: {
  //     variantId: variant.id,
  //     orderId: order.id,
  //     startDate: new Date(),
  //     endDate: new Date(Date.now() + 86400000),
  //     quantity: 1,
  //     availableQty: 4, // 5 - 1
  //     status: StockStatus.RESERVED,
  //   },
  // });

  // await prisma.inventoryLog.create({
  //   data: {
  //     variantId: variant.id,
  //     orderId: order.id,
  //     changeQty: -1,
  //     reason: "Order Reserved - " + order.id,
  //   },
  // });

  // 9. Finance: Invoice & Payment
  // const invoice = await prisma.invoice.create({
  //   data: {
  //     orderId: order.id,
  //     createdByUserId: staff.id,
  //     rentalAmount: 1080, // 1200 - 120
  //     securityDeposit: 5000,
  //     deliveryCharge: 150,
  //     totalAmount: 6230,
  //     status: InvoiceStatus.PAID,
  //   },
  // });

  // await prisma.payment.create({
  //   data: {
  //     invoiceId: invoice.id,
  //     amount: 6230,
  //     for: PaymentFor.RENT,
  //     status: PaymentStatus.SUCCEEDED,
  //     stripePaymentIntentId: "pi_custom_999",
  //     stripeCheckoutSessionId: "cs_custom_999",
  //   },
  // });

  // 10. Operations: Delivery & Return
  // await prisma.delivery.create({
  //   data: {
  //     orderId: order.id,
  //     handledByUserId: staff.id,
  //     shippedAt: new Date(),
  //     deliveredAt: new Date(),
  //     deliveryCharge: 150,
  //   },
  // });

  // await prisma.return.create({
  //   data: {
  //     orderId: order.id,
  //     handledByUserId: staff.id,
  //     returnedAt: new Date(),
  //     lateFee: 0,
  //     damageFee: 0,
  //     depositRefunded: 5000,
  //   },
  // });

  // 11. Engagement & Logs
  // await prisma.notification.create({
  //   data: {
  //     userId: customer.id,
  //     type: NotificationType.PAYMENT_CONFIRMATION,
  //     message: "Your rental payment of 6230 was successful.",
  //   },
  // });

  // await prisma.activityLog.create({
  //   data: {
  //     userId: staff.id,
  //     action: "PROCESS_RETURN",
  //     entity: "ORDER",
  //     entityId: order.id,
  //   },
  // });

  console.log("✅ DATABASE SEEDED FOR RENTAL SYSTEM V2");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
