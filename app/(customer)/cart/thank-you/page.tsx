import Link from "next/link";
import Header from "@/componenets/Header";
import { CheckCircle2 } from "lucide-react";

interface ThankYouPageProps {
  searchParams: Promise<{ count?: string; vendors?: string }>;
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const params = await searchParams;
  const count = Math.max(0, parseInt(params.count ?? "0", 10) || 0);
  const vendorNames = params.vendors
    ? decodeURIComponent(params.vendors).split(",").filter(Boolean).map((s) => s.trim())
    : [];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header showSearch />
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 md:p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
            Thank you!
          </h1>
          <p className="text-[var(--foreground)]/80 mb-6">
            {count > 0
              ? `Your quotation request${count !== 1 ? "s have" : " has"} been sent successfully.`
              : "Your quotation request has been sent successfully."}
          </p>
          {count > 0 && (
            <p className="text-sm text-[var(--foreground)]/70 mb-6">
              {count} quotation{count !== 1 ? "s" : ""} sent to vendor{count !== 1 ? "s" : ""}.
              {vendorNames.length > 0 && (
                <span className="block mt-2 font-medium text-[var(--foreground)]">
                  {vendorNames.join(", ")}
                </span>
              )}
            </p>
          )}
          <p className="text-sm text-[var(--foreground)]/60 mb-8">
            {count > 0
              ? `The vendor${vendorNames.length !== 1 ? "s" : ""} will review your request and contact you shortly with the next steps.`
              : "Vendors will review your request and contact you shortly."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] text-white font-medium px-6 py-3 hover:bg-[var(--accent-hover)] transition"
            >
              Continue shopping
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] font-medium px-6 py-3 hover:bg-[var(--card-bg)] transition"
            >
              Back to cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
