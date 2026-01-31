import { getWishlist } from "@/app/(customer)/actions/wishlist";
import WishlistClient from "@/componenets/WishlistClient";
import Header from "@/componenets/Header";

export default async function WishlistPage() {
  const products = await getWishlist();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header showSearch />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Wishlist</h1>
        <WishlistClient initialProducts={products} />
      </div>
    </div>
  );
}
