import { getCart } from "@/app/(customer)/actions/cart";
import { getCustomerAddresses } from "@/app/(customer)/actions/checkout";
import { getCurrentUser } from "@/lib/getCurrentUser";
import CheckoutClient from "@/componenets/CheckoutClient";
import Header from "@/componenets/Header";

export default async function CartPage() {
  const [grouped, addresses, user] = await Promise.all([
    getCart(),
    getCustomerAddresses().catch(() => []),
    getCurrentUser(),
  ]);

  return (
    <>
      <Header showSearch />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Checkout</h1>
          <p className="text-gray-600 text-sm mb-6">Review your cart and complete your order.</p>
        <CheckoutClient
          initialGrouped={grouped}
          initialAddresses={addresses}
          customerEmail={user?.email ?? ""}
        />
        </div>
      </main>
    </>
  );
}
