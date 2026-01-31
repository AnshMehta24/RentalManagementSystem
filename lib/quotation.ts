
export function computeQuotationTotals(quotation: {
    items: { quantity: number; price: number }[];
    coupon: { type: string; value: number; maxDiscount: number | null } | null;
    deliveryCharge: number | null;
}) {
    const subtotal = quotation.items.reduce(
        (s, i) => s + i.quantity * i.price,
        0
    );

    let discountAmt = 0;

    if (quotation.coupon) {
        if (quotation.coupon.type === "FLAT") {
            discountAmt = Math.min(quotation.coupon.value, subtotal);
        } else {
            const pct = (subtotal * quotation.coupon.value) / 100;
            discountAmt =
                quotation.coupon.maxDiscount != null
                    ? Math.min(pct, quotation.coupon.maxDiscount)
                    : pct;
        }
    }

    const deliveryCharge = quotation.deliveryCharge ?? 0;
    const total = Math.max(0, subtotal - discountAmt + deliveryCharge);

    return { subtotal, discountAmt, deliveryCharge, total };
}
