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
    <div className="min-h-screen bg-background text-foreground">
      <Header showSearch />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <CheckoutClient
          initialGrouped={grouped}
          initialAddresses={addresses}
          customerEmail={user?.email ?? ""}
        />
      </div>
    </div>
  );
}
