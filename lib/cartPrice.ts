import { prisma } from "@/lib/prisma";

/**
 * Compute rental price for a variant over the given date range.
 * Uses the best matching period (prefer daily, then hourly, then weekly).
 */
export async function computeRentalPrice(
  variantId: number,
  rentalStart: Date,
  rentalEnd: Date
): Promise<number> {
  const durationMs = rentalEnd.getTime() - rentalStart.getTime();
  const durationHours = durationMs / (60 * 60 * 1000);
  const durationDays = durationHours / 24;

  const prices = await prisma.rentalPrice.findMany({
    where: { variantId },
    include: { period: true },
  });

  if (prices.length === 0) return 0;

  const unit = (p: (typeof prices)[0]) => p.period.unit.toUpperCase();
  const daily = prices.find(
    (p) => unit(p) === "DAY" && p.period.duration === 1
  );
  const hourly = prices.find(
    (p) => unit(p) === "HOUR" && p.period.duration === 1
  );
  const weekly = prices.find(
    (p) => unit(p) === "WEEK" && p.period.duration === 1
  );
  const monthly = prices.find(
    (p) => unit(p) === "MONTH" && p.period.duration === 1
  );

  if (durationDays >= 1 && daily) {
    return daily.price * Math.ceil(durationDays);
  }
  if (durationHours < 24 && hourly) {
    return hourly.price * Math.ceil(durationHours);
  }
  if (weekly && durationDays >= 1) {
    return weekly.price * Math.max(1, Math.ceil(durationDays / 7));
  }
  if (monthly && durationDays >= 1) {
    return monthly.price * Math.max(1, Math.ceil(durationDays / 30));
  }
  // Fallback: use first available period (e.g. daily)
  const fallback = daily ?? hourly ?? weekly ?? monthly ?? prices[0];
  if (unit(fallback) === "DAY") return fallback.price * Math.ceil(durationDays);
  if (unit(fallback) === "HOUR") return fallback.price * Math.ceil(durationHours);
  return fallback.price * Math.ceil(durationDays);
}
