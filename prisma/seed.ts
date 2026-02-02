import { UserRole, AddressType, FulfillmentType, StaffPermission, QuotationStatus, OrderStatus, InvoiceStatus, PaymentStatus, PaymentFor, StockStatus, CouponType, NotificationType, PeriodUnit, AttributeDisplayType, DeliveryChargeType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";


// ─── HELPERS ────────────────────────────────────────────────────────────────

/** Returns the target vendor ID 50 % of the time, otherwise a random one from the rest */
function pickVendor(targetVendorId: number, otherVendorIds: number[]): number {
    return Math.random() < 0.5 ? targetVendorId : otherVendorIds[Math.floor(Math.random() * otherVendorIds.length)];
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function pastDate(daysAgo: number): Date {
    return addDays(new Date(), -daysAgo);
}

function futureDate(daysAhead: number): Date {
    return addDays(new Date(), daysAhead);
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const VENDOR_COUNT = 10;       // total vendor users (IDs will be 2–11, but we force ID 7 via seeding order)
const CUSTOMER_COUNT = 40;
const STAFF_COUNT = 20;
const PRODUCT_COUNT = 60;
const VARIANTS_PER_PRODUCT = 3;
const QUOTATION_COUNT = 80;
const ORDER_CONVERSION_RATE = 0.65; // 65 % of quotations become orders

const INDIAN_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Anand', 'Vadodara', 'Surat', 'Gandhinagar'];
const INDIAN_STATES = ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Rajasthan', 'Uttar Pradesh', 'Gujarat'];

const PRODUCT_NAMES = [
    'Portable Projector', 'Drone Camera', 'Tent Set', 'Camping Stove', 'Kayak',
    'Power Drill', 'Concrete Mixer', 'Pressure Washer', 'Scaffold Kit', 'Ladder 20ft',
    'Folding Table', 'Event Tent 10x10', 'PA Sound System', 'LED Light Bar', 'Generator 5KW',
    'Mini Excavator', 'Floor Sander', 'Tile Cutter', 'Welding Machine', 'Air Compressor',
    'Bounce House', 'Snow Machine', 'Fog Machine', 'Karaoke System', 'Photo Booth Kit',
    'Inflatable Pool', 'BBQ Grill Pro', 'Pizza Oven', 'Smoothie Bar', 'Ice Cream Cart',
    'VR Headset Kit', 'RC Boat', 'Fishing Rod Set', 'Mountain Bike', 'Electric Scooter',
    'Wheelchair', 'Crutches Set', 'Hospital Bed', 'Baby Stroller', 'Car Seat Combo',
    'Wedding Arch', 'Flower Wall', 'Balloon Column', 'Lighting Rig', 'Dance Floor',
    'Camera Body A7', 'Lens 24-70mm', 'Tripod Pro', 'Stabilizer Gimbal', 'Ring Light Kit',
    'Laptop Dell XPS', 'MacBook Pro 16', 'iPad Pro Set', 'Monitor 27in', 'Standing Desk',
    'Party Bus', 'Limousine', 'Classic Car', 'Harley Davidson', 'Luxury Yacht'
];

const ATTRIBUTE_NAMES = ['Color', 'Size', 'Material', 'Brand', 'Style'];
const COLOR_VALUES = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Orange', 'Pink'];
const SIZE_VALUES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const MATERIAL_VALUES = ['Wood', 'Metal', 'Plastic', 'Fabric', 'Leather', 'Glass'];
const BRAND_VALUES = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE'];
const STYLE_VALUES = ['Classic', 'Modern', 'Industrial', 'Minimalist', 'Rustic'];

const ALL_ATTRIBUTE_VALUES: Record<string, string[]> = {
    Color: COLOR_VALUES,
    Size: SIZE_VALUES,
    Material: MATERIAL_VALUES,
    Brand: BRAND_VALUES,
    Style: STYLE_VALUES,
};

// ─── SEED ───────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱  Clearing existing data …');
    // TRUNCATE all tables and restart identity sequences so IDs always start at 1.
    // This avoids FK violations when re-running the seed multiple times.
//     await prisma.$queryRaw`
//     DO $$
//     BEGIN
//       EXECUTE string_agg(format('TRUNCATE TABLE %I CASCADE', relname), '; ')
//         FROM pg_class
//         WHERE relkind = 'r'
//           AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
//     END $$;
//   `;
//     await prisma.$queryRaw`
//     DO $$
//     DECLARE
//       seq RECORD;
//     BEGIN
//       FOR seq IN
//         SELECT sequence_name
//         FROM information_schema.sequences
//         WHERE sequence_schema = 'public'
//       LOOP
//         EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq.sequence_name);
//       END LOOP;
//     END $$;
//   `;

    // ── 1. ADMIN ──────────────────────────────────────────────────────────────
    console.log('👤  Creating admin …');
    const admin = await prisma.user.create({
        data: {
            role: 'ADMIN',
            name: 'Super Admin',
            email: 'admin@example.com',
                password: await bcrypt.hash("Admin@123", 10),
        },
    });

    // console.log('🏪  Creating vendors …');
    // const vendors: any[] = [];
    // for (let i = 1; i <= VENDOR_COUNT; i++) {
    //     const v = await prisma.user.create({
    //         data: {
    //             role: 'VENDOR',
    //             name: `Vendor ${i}`,
    //             email: `vendor${i}@rentamarket.com`,
    //             password: await bcrypt.hash("Admin@123", 10),
    //             companyName: `Rental Co ${i}`,
    //             companyLogo: `https://placeholder.com/logo${i}.png`,
    //             gstin: `${String(i).padStart(2, '0')}AABBCC1234Z`,
    //             stripeCustomerId: `cus_vendor_${i}_seed`,
    //         },
    //     });
    //     vendors.push(v);
    // }

    // const vendorIds = vendors.map(v => v.id);
    // // We'll treat vendors[6].id as "vendor 7" in the business sense.
    // const TARGET_VENDOR_ID = vendors[1].id;  // the vendor we bias toward

    // const otherVendorIds = vendorIds.filter(id => id !== TARGET_VENDOR_ID);

    // // ── 3. CUSTOMERS (40) ─────────────────────────────────────────────────────
    // console.log('🧑‍💼  Creating customers …');
    // const customers: any[] = [];
    // for (let i = 1; i <= CUSTOMER_COUNT; i++) {
    //     const c = await prisma.user.create({
    //         data: {
    //             role: 'CUSTOMER',
    //             name: `Customer ${i}`,
    //             email: `customer${i}@example.com`,
    //             password: '$2b$10$abcdefghijklmnopqrstuuHELLOWORLD1234567890abcdefghi',
    //             stripeCustomerId: `cus_customer_${i}_seed`,
    //         },
    //     });
    //     customers.push(c);
    // }
    // const customerIds = customers.map(c => c.id);

    // // ── 4. STAFF (20) ─────────────────────────────────────────────────────────
    // console.log('👷  Creating staff …');
    // const staffUsers: any[] = [];
    // for (let i = 1; i <= STAFF_COUNT; i++) {
    //     const s = await prisma.user.create({
    //         data: {
    //             role: 'CUSTOMER', // staff are also Users with CUSTOMER role who get linked via VendorStaff
    //             name: `Staff Member ${i}`,
    //             email: `staff${i}@rentamarket.com`,
    //             password: '$2b$10$abcdefghijklmnopqrstuuHELLOWORLD1234567890abcdefghi',
    //         },
    //     });
    //     staffUsers.push(s);
    // }

    // // Link staff → vendors (2 per vendor)
    // console.log('🔗  Linking staff to vendors …');
    // for (let i = 0; i < staffUsers.length; i++) {
    //     const vendorId = vendorIds[i % VENDOR_COUNT];
    //     const perms: StaffPermission[] = [];
    //     const allPerms: StaffPermission[] = ['MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_PICKUP', 'MANAGE_RETURN', 'MANAGE_INVOICES', 'VIEW_REPORTS'];
    //     const permCount = randInt(1, allPerms.length);
    //     for (let p = 0; p < permCount; p++) {
    //         const perm = allPerms[p];
    //         if (!perms.includes(perm)) perms.push(perm);
    //     }
    //     await prisma.vendorStaff.create({
    //         data: {
    //             vendorId,
    //             staffId: staffUsers[i].id,
    //             permissions: perms,
    //             isActive: Math.random() < 0.85,
    //         },
    //     });
    // }

    // // ── 5. ADDRESSES ──────────────────────────────────────────────────────────
    // console.log('📍  Creating addresses …');
    // // 2 addresses per customer + 1 per vendor
    // const allUsers = [...vendors, ...customers];
    // for (const user of allUsers) {
    //     const count = user.role === 'VENDOR' ? 1 : 2;
    //     for (let a = 0; a < count; a++) {
    //         await prisma.address.create({
    //             data: {
    //                 userId: user.id,
    //                 type: a === 0 ? 'BILLING' : 'SHIPPING',
    //                 name: `${user.name} Address ${a + 1}`,
    //                 line1: `${randInt(1, 999)} ${randElement(['MG Road', 'Patel Street', 'Brigade Road', 'Park Lane', 'Lake View Dr'])}`,
    //                 line2: randInt(1, 20) % 3 === 0 ? `Apt ${randInt(1, 50)}` : undefined,
    //                 city: randElement(INDIAN_CITIES),
    //                 state: randElement(INDIAN_STATES),
    //                 country: 'India',
    //                 pincode: String(randInt(100000, 999999)),
    //                 isDefault: a === 0,
    //             },
    //         });
    //     }
    // }

    // // Fetch all addresses for later use
    // const customerAddresses = await prisma.address.findMany({ where: { userId: { in: customerIds } } });

    // // ── 6. VENDOR DELIVERY CONFIG ─────────────────────────────────────────────
    // console.log('🚚  Creating vendor delivery configs …');
    // const chargeTypes: DeliveryChargeType[] = ['FLAT', 'PER_KM', 'FREE'];
    // for (const vid of vendorIds) {
    //     const ct = randElement(chargeTypes);
    //     await prisma.vendorDeliveryConfig.create({
    //         data: {
    //             vendorId: vid,
    //             isDeliveryEnabled: Math.random() < 0.8,
    //             chargeType: ct,
    //             flatCharge: ct === 'FLAT' ? randFloat(50, 500) : undefined,
    //             ratePerKm: ct === 'PER_KM' ? randFloat(5, 30) : undefined,
    //             freeAboveAmount: ct === 'FREE' ? randFloat(1000, 5000) : undefined,
    //             maxDeliveryKm: randFloat(10, 100),
    //         },
    //     });
    // }

    // // ── 7. ATTRIBUTES & VALUES ────────────────────────────────────────────────
    // console.log('🏷️  Creating attributes …');
    // const displayTypes: AttributeDisplayType[] = ['RADIO', 'PILLS', 'CHECKBOX', 'IMAGE'];
    // const attributes: any[] = [];
    // for (const name of ATTRIBUTE_NAMES) {
    //     const attr = await prisma.attribute.create({
    //         data: { name, displayType: randElement(displayTypes), isActive: true },
    //     });
    //     attributes.push(attr);
    //     for (const val of ALL_ATTRIBUTE_VALUES[name]) {
    //         await prisma.attributeValue.create({
    //             data: { attributeId: attr.id, value: val, extraPrice: randFloat(0, 200), isActive: true },
    //         });
    //     }
    // }

    // // Fetch all attribute values keyed by attributeId
    // const allAttrValues = await prisma.attributeValue.findMany();
    // const attrValueMap = new Map<number, any[]>();
    // for (const av of allAttrValues) {
    //     if (!attrValueMap.has(av.attributeId)) attrValueMap.set(av.attributeId, []);
    //     attrValueMap.get(av.attributeId)!.push(av);
    // }

    // // ── 8. RENTAL PERIODS ─────────────────────────────────────────────────────
    // console.log('📅  Creating rental periods …');
    // const periodDefs: { name: string; duration: number; unit: PeriodUnit }[] = [
    //     { name: '1 Hour', duration: 1, unit: 'HOUR' },
    //     { name: '4 Hours', duration: 4, unit: 'HOUR' },
    //     { name: '1 Day', duration: 1, unit: 'DAY' },
    //     { name: '3 Days', duration: 3, unit: 'DAY' },
    //     { name: '1 Week', duration: 1, unit: 'WEEK' },
    //     { name: '2 Weeks', duration: 2, unit: 'WEEK' },
    //     { name: '1 Month', duration: 1, unit: 'MONTH' },
    //     { name: '3 Months', duration: 3, unit: 'MONTH' },
    // ];
    // const rentalPeriods: any[] = [];
    // for (const pd of periodDefs) {
    //     const rp = await prisma.rentalPeriod.create({ data: { ...pd, isActive: true } });
    //     rentalPeriods.push(rp);
    // }

    // // ── 9. PRODUCTS & VARIANTS ────────────────────────────────────────────────
    // console.log('📦  Creating products & variants …');
    // const allVariants: any[] = [];
    // const productVendorMap = new Map<number, number>(); // productId → vendorId

    // for (let p = 0; p < PRODUCT_COUNT; p++) {
    //     const vendorId = pickVendor(TARGET_VENDOR_ID, otherVendorIds);
    //     const product = await prisma.product.create({
    //         data: {
    //             vendorId,
    //             name: PRODUCT_NAMES[p % PRODUCT_NAMES.length] + (p >= PRODUCT_NAMES.length ? ` v${Math.floor(p / PRODUCT_NAMES.length) + 1}` : ''),
    //             description: `High quality rental item #${p + 1}. Perfect for short and long term needs.`,
    //             isRentable: Math.random() < 0.9,
    //             published: Math.random() < 0.85,
    //         },
    //     });
    //     productVendorMap.set(product.id, vendorId);

    //     // Pick 2 random attributes for this product
    //     const prodAttrs = attributes.slice(0, randInt(1, 3));

    //     for (let v = 0; v < VARIANTS_PER_PRODUCT; v++) {
    //         const variant = await prisma.productVariant.create({
    //             data: {
    //                 productId: product.id,
    //                 sku: `SKU-${product.id}-${v + 1}`,
    //                 quantity: randInt(2, 30),
    //                 costPrice: randFloat(500, 50000),
    //                 salePrice: randFloat(800, 80000),
    //             },
    //         });
    //         allVariants.push(variant);

    //         // Attach attribute values
    //         for (const attr of prodAttrs) {
    //             const vals = attrValueMap.get(attr.id) || [];
    //             if (vals.length === 0) continue;
    //             const pickedVal = randElement(vals);
    //             await prisma.variantAttributeValue.create({
    //                 data: {
    //                     variantId: variant.id,
    //                     attributeId: attr.id,
    //                     attributeValueId: pickedVal.id,
    //                 },
    //             });
    //         }

    //         // Rental prices for each period
    //         for (const period of rentalPeriods) {
    //             await prisma.rentalPrice.create({
    //                 data: {
    //                     variantId: variant.id,
    //                     periodId: period.id,
    //                     price: randFloat(200, 15000),
    //                 },
    //             });
    //         }
    //     }
    // }

    // // ── 10. COUPONS (15) ──────────────────────────────────────────────────────
    // console.log('🎟️  Creating coupons …');
    // const coupons: any[] = [];
    // for (let i = 1; i <= 15; i++) {
    //     const type: CouponType = randElement(['FLAT', 'PERCENTAGE']);
    //     const coupon = await prisma.coupon.create({
    //         data: {
    //             code: `RENT${String(i).padStart(3, '0')}`,
    //             type,
    //             value: type === 'FLAT' ? randFloat(100, 2000) : randFloat(5, 40),
    //             maxDiscount: type === 'PERCENTAGE' ? randFloat(500, 5000) : undefined,
    //             validFrom: pastDate(randInt(30, 365)),
    //             validTill: i <= 10 ? futureDate(randInt(1, 180)) : pastDate(randInt(1, 30)), // some expired
    //             isActive: i <= 12,
    //         },
    //     });
    //     coupons.push(coupon);
    // }

    // // ── 11. WISHLISTS ─────────────────────────────────────────────────────────
    // console.log('❤️  Creating wishlists …');
    // const productIds = (await prisma.product.findMany({ select: { id: true } })).map(p => p.id);
    // for (let i = 0; i < 60; i++) {
    //     try {
    //         await prisma.wishlistItem.create({
    //             data: {
    //                 userId: randElement(customerIds),
    //                 productId: randElement(productIds),
    //             },
    //         });
    //     } catch {
    //         // unique constraint – skip duplicates silently
    //     }
    // }

    // // ── 12. CARTS ─────────────────────────────────────────────────────────────
    // console.log('🛒  Creating carts …');
    // // Give 15 random customers a cart with 1–3 items
    // const cartCustomers = customers.slice(0, 15);
    // for (const cust of cartCustomers) {
    //     const cart = await prisma.cart.create({ data: { customerId: cust.id } });
    //     const itemCount = randInt(1, 3);
    //     const usedKeys = new Set<string>();
    //     for (let ci = 0; ci < itemCount; ci++) {
    //         const variant = randElement(allVariants);
    //         const start = futureDate(randInt(1, 30));
    //         const end = addDays(start, randInt(1, 14));
    //         const key = `${variant.id}-${start.toISOString()}-${end.toISOString()}`;
    //         if (usedKeys.has(key)) continue;
    //         usedKeys.add(key);
    //         await prisma.cartItem.create({
    //             data: {
    //                 cartId: cart.id,
    //                 variantId: variant.id,
    //                 quantity: randInt(1, 3),
    //                 rentalStart: start,
    //                 rentalEnd: end,
    //                 price: randFloat(300, 12000),
    //             },
    //         });
    //     }
    // }

    // // ── 13. QUOTATIONS (80) ──────────────────────────────────────────────────
    // console.log('📝  Creating quotations …');
    // const quotationStatuses: QuotationStatus[] = ['DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED'];
    // const quotations: any[] = [];

    // for (let q = 0; q < QUOTATION_COUNT; q++) {
    //     const customerId = randElement(customerIds);
    //     const vendorId = pickVendor(TARGET_VENDOR_ID, otherVendorIds);
    //     const status = randElement(quotationStatuses);
    //     const useCoupon = Math.random() < 0.3;
    //     const fulfillment: FulfillmentType = randElement(['STORE_PICKUP', 'DELIVERY']);

    //     // pick a delivery & billing address belonging to this customer
    //     const custAddrs = customerAddresses.filter(a => a.userId === customerId);
    //     const deliveryAddr = custAddrs.find(a => a.type === 'SHIPPING') || custAddrs[0];
    //     const billingAddr = custAddrs.find(a => a.type === 'BILLING') || custAddrs[0];

    //     const quotation = await prisma.quotation.create({
    //         data: {
    //             customerId,
    //             vendorId,
    //             status,
    //             couponId: useCoupon ? randElement(coupons).id : undefined,
    //             fulfillmentType: fulfillment,
    //             deliveryCharge: fulfillment === 'DELIVERY' ? randFloat(50, 800) : 0,
    //             deliveryAddressId: fulfillment === 'DELIVERY' && deliveryAddr ? deliveryAddr.id : undefined,
    //             billingAddressId: billingAddr?.id,
    //         },
    //     });
    //     quotations.push(quotation);

    //     // 2–4 items per quotation
    //     const itemCount = randInt(2, 4);
    //     for (let i = 0; i < itemCount; i++) {
    //         const variant = randElement(allVariants);
    //         const start = pastDate(randInt(1, 60));
    //         const end = addDays(start, randInt(1, 30));
    //         await prisma.quotationItem.create({
    //             data: {
    //                 quotationId: quotation.id,
    //                 variantId: variant.id,
    //                 quantity: randInt(1, 5),
    //                 rentalStart: start,
    //                 rentalEnd: end,
    //                 price: randFloat(500, 20000),
    //             },
    //         });
    //     }
    // }

    // // ── 14. RENTAL ORDERS (from CONFIRMED quotations + some extras) ───────────
    // console.log('🛍️  Creating rental orders …');
    // const orderStatuses: OrderStatus[] = ['CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
    // const orders: any[] = [];

    // for (const quot of quotations) {
    //     // Convert ~65 % of quotations to orders; always convert CONFIRMED ones
    //     if (quot.status !== 'CONFIRMED' && Math.random() > ORDER_CONVERSION_RATE) continue;

    //     const fulfillment: FulfillmentType = quot.fulfillmentType || 'STORE_PICKUP';
    //     const status = quot.status === 'CANCELLED' ? 'CANCELLED' : randElement(orderStatuses);

    //     const order = await prisma.rentalOrder.create({
    //         data: {
    //             quotationId: quot.id,
    //             customerId: quot.customerId,
    //             status,
    //             fulfillmentType: fulfillment,
    //             deliveryAddressId: fulfillment === 'DELIVERY' ? quot.deliveryAddressId : undefined,
    //             deliveryCharge: quot.deliveryCharge || 0,
    //             couponCode: quot.couponId ? `RENT${String(quot.couponId).padStart(3, '0')}` : undefined,
    //             discountAmt: quot.couponId ? randFloat(50, 1500) : 0,
    //         },
    //     });
    //     orders.push({ ...order, _vendorId: quot.vendorId });

    //     // Mirror quotation items as order items
    //     const qItems = await prisma.quotationItem.findMany({ where: { quotationId: quot.id } });
    //     for (const qi of qItems) {
    //         await prisma.orderItem.create({
    //             data: {
    //                 orderId: order.id,
    //                 variantId: qi.variantId,
    //                 quantity: qi.quantity,
    //                 rentalStart: qi.rentalStart,
    //                 rentalEnd: qi.rentalEnd,
    //                 price: qi.price,
    //             },
    //         });

    //         // Reservation per order item
    //         await prisma.reservation.create({
    //             data: {
    //                 variantId: qi.variantId,
    //                 orderId: order.id,
    //                 startDate: qi.rentalStart,
    //                 endDate: qi.rentalEnd,
    //                 quantity: qi.quantity,
    //                 availableQty: randInt(0, qi.quantity),
    //                 status: status === 'COMPLETED' ? 'WITH_CUSTOMER' : status === 'CANCELLED' ? 'AVAILABLE' : 'RESERVED',
    //             },
    //         });

    //         // Inventory log
    //         await prisma.inventoryLog.create({
    //             data: {
    //                 variantId: qi.variantId,
    //                 orderId: order.id,
    //                 changeQty: -qi.quantity,
    //                 reason: `Reserved for order #${order.id}`,
    //             },
    //         });
    //     }
    // }

    // // ── 15. INVOICES ──────────────────────────────────────────────────────────
    // console.log('🧾  Creating invoices …');
    // const invoiceStatuses: InvoiceStatus[] = ['DRAFT', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'];

    // for (const order of orders) {
    //     if (order.status === 'CANCELLED' && Math.random() < 0.7) continue; // skip most cancelled

    //     const rentalAmt = randFloat(1000, 80000);
    //     const securityDep = randFloat(500, 20000);
    //     const deliveryCharge = order.fulfillmentType === 'DELIVERY' ? randFloat(50, 800) : 0;
    //     const totalAmount = rentalAmt + securityDep + deliveryCharge;
    //     const invStatus = order.status === 'COMPLETED' ? 'PAID' : randElement(invoiceStatuses);
    //     const paidAmount = invStatus === 'PAID' ? totalAmount : invStatus === 'PARTIALLY_PAID' ? randFloat(0, totalAmount) : 0;

    //     const invoice = await prisma.invoice.create({
    //         data: {
    //             orderId: order.id,
    //             createdByUserId: order._vendorId,
    //             rentalAmount: rentalAmt,
    //             securityDeposit: securityDep,
    //             deliveryCharge,
    //             totalAmount,
    //             paidAmount,
    //             status: invStatus,
    //         },
    //     });

    //     // ── 16. PAYMENTS (1–3 per invoice) ──────────────────────────────────────
    //     const paymentCount = invStatus === 'DRAFT' ? 0 : randInt(1, 3);
    //     const paymentFors: PaymentFor[] = ['RENT', 'SECURITY_DEPOSIT', 'DELIVERY_CHARGE'];
    //     let remaining = paidAmount;

    //     for (let pi = 0; pi < paymentCount && remaining > 0; pi++) {
    //         const isLast = pi === paymentCount - 1;
    //         const amt = isLast ? parseFloat(remaining.toFixed(2)) : randFloat(100, remaining * 0.6);
    //         remaining -= amt;

    //         const payStatus: PaymentStatus = invStatus === 'REFUNDED' && pi === paymentCount - 1
    //             ? 'REFUNDED'
    //             : amt > 0 ? 'SUCCEEDED' : 'FAILED';

    //         await prisma.payment.create({
    //             data: {
    //                 invoiceId: invoice.id,
    //                 amount: amt,
    //                 for: randElement(paymentFors),
    //                 status: payStatus,
    //                 stripePaymentIntentId: `pi_seed_${invoice.id}_${pi}_${Date.now()}`,
    //                 stripeCheckoutSessionId: `cs_seed_${invoice.id}_${pi}`,
    //                 stripeRefundId: payStatus === 'REFUNDED' ? `re_seed_${invoice.id}_${pi}` : undefined,
    //             },
    //         });
    //     }
    // }

    // // ── 17. PICKUPS ───────────────────────────────────────────────────────────
    // console.log('📦  Creating pickups …');
    // for (const order of orders) {
    //     if (order.fulfillmentType !== 'STORE_PICKUP') continue;
    //     if (['CONFIRMED'].includes(order.status) && Math.random() < 0.5) continue;

    //     await prisma.pickup.create({
    //         data: {
    //             orderId: order.id,
    //             handledByUserId: order._vendorId,
    //             pickedAt: pastDate(randInt(0, 30)),
    //         },
    //     });
    // }

    // // ── 18. DELIVERIES ────────────────────────────────────────────────────────
    // console.log('🚛  Creating deliveries …');
    // for (const order of orders) {
    //     if (order.fulfillmentType !== 'DELIVERY') continue;
    //     if (order.status === 'CONFIRMED' && Math.random() < 0.4) continue;

    //     const shipped = pastDate(randInt(2, 40));
    //     const delivered = order.status === 'ACTIVE' || order.status === 'COMPLETED'
    //         ? addDays(shipped, randInt(1, 5))
    //         : undefined;

    //     await prisma.delivery.create({
    //         data: {
    //             orderId: order.id,
    //             handledByUserId: order._vendorId,
    //             shippedAt: shipped,
    //             deliveredAt: delivered,
    //             deliveryCharge: order.deliveryCharge,
    //         },
    //     });
    // }

    // // ── 19. RETURNS ───────────────────────────────────────────────────────────
    // console.log('🔄  Creating returns …');
    // for (const order of orders) {
    //     if (order.status !== 'COMPLETED') continue;
    //     if (Math.random() < 0.3) continue; // not all completed orders have returns logged yet

    //     const lateFee = Math.random() < 0.2 ? randFloat(100, 3000) : 0;
    //     const damageFee = Math.random() < 0.15 ? randFloat(200, 5000) : 0;

    //     await prisma.return.create({
    //         data: {
    //             orderId: order.id,
    //             handledByUserId: order._vendorId,
    //             returnedAt: pastDate(randInt(0, 20)),
    //             lateFee,
    //             damageFee,
    //             depositRefunded: randFloat(500, 15000),
    //         },
    //     });
    // }

    // // ── 20. NOTIFICATIONS ─────────────────────────────────────────────────────
    // console.log('🔔  Creating notifications …');
    // const notifTypes: NotificationType[] = ['RETURN_REMINDER', 'LATE_ALERT', 'PAYMENT_CONFIRMATION'];
    // const notifMessages: Record<string, string> = {
    //     RETURN_REMINDER: 'Your rental return is due soon. Please arrange to return the item.',
    //     LATE_ALERT: 'Your rental is overdue. Late fees may apply.',
    //     PAYMENT_CONFIRMATION: 'Your payment has been successfully processed.',
    // };

    // for (let n = 0; n < 120; n++) {
    //     const type = randElement(notifTypes);
    //     await prisma.notification.create({
    //         data: {
    //             userId: randElement([...customerIds, ...vendorIds]),
    //             type,
    //             message: notifMessages[type],
    //             isRead: Math.random() < 0.6,
    //         },
    //     });
    // }

    // // ── 21. ACTIVITY LOGS ─────────────────────────────────────────────────────
    // console.log('📋  Creating activity logs …');
    // const entities = ['User', 'Product', 'Quotation', 'RentalOrder', 'Invoice', 'Payment', 'Return'];
    // const actions = ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PAYMENT_RECEIVED'];

    // for (let a = 0; a < 200; a++) {
    //     const entity = randElement(entities);
    //     await prisma.activityLog.create({
    //         data: {
    //             userId: randElement([admin.id, ...vendorIds, ...customerIds]),
    //             action: randElement(actions),
    //             entity,
    //             entityId: randInt(1, 100),
    //         },
    //     });
    // }

    // // ── SUMMARY ───────────────────────────────────────────────────────────────
    // const counts = {
    //     users: 1 + VENDOR_COUNT + CUSTOMER_COUNT + STAFF_COUNT,
    //     vendors: VENDOR_COUNT,
    //     customers: CUSTOMER_COUNT,
    //     staff: STAFF_COUNT,
    //     addresses: await prisma.address.count(),
    //     attributes: ATTRIBUTE_NAMES.length,
    //     attributeValues: await prisma.attributeValue.count(),
    //     products: PRODUCT_COUNT,
    //     variants: await prisma.productVariant.count(),
    //     rentalPeriods: rentalPeriods.length,
    //     rentalPrices: await prisma.rentalPrice.count(),
    //     coupons: 15,
    //     wishlistItems: await prisma.wishlistItem.count(),
    //     carts: await prisma.cart.count(),
    //     cartItems: await prisma.cartItem.count(),
    //     quotations: QUOTATION_COUNT,
    //     quotationItems: await prisma.quotationItem.count(),
    //     orders: orders.length,
    //     orderItems: await prisma.orderItem.count(),
    //     reservations: await prisma.reservation.count(),
    //     inventoryLogs: await prisma.inventoryLog.count(),
    //     invoices: await prisma.invoice.count(),
    //     payments: await prisma.payment.count(),
    //     pickups: await prisma.pickup.count(),
    //     deliveries: await prisma.delivery.count(),
    //     returns: await prisma.return.count(),
    //     notifications: await prisma.notification.count(),
    //     activityLogs: await prisma.activityLog.count(),
    //     deliveryConfigs: VENDOR_COUNT,
    //     vendorStaff: STAFF_COUNT,
    // };

    // const total = Object.values(counts).reduce((s, v) => s + v, 0);

    // console.log('\n✅  Seed complete!\n');
    // console.log('┌─────────────────────────┬────────┐');
    // console.log('│ Entity                  │ Count  │');
    // console.log('├─────────────────────────┼────────┤');
    // for (const [key, val] of Object.entries(counts)) {
    //     console.log(`│ ${key.padEnd(23)} │ ${String(val).padStart(6)} │`);
    // }
    // console.log('├─────────────────────────┼────────┤');
    // console.log(`│ ${'TOTAL'.padEnd(23)} │ ${String(total).padStart(6)} │`);
    // console.log('└─────────────────────────┴────────┘');
    // console.log(`\n🎯  Target vendor (bias 50%) ID: ${TARGET_VENDOR_ID}`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });