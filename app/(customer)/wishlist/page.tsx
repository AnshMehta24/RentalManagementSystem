import { getWishlist } from "@/app/(customer)/actions/wishlist";
import WishlistClient from "@/components/productPage/WishlistClient";
import Header from "@/components/productPage/Header";

export default async function WishlistPage() {
  const products = await getWishlist();

  return (
    <>
      <Header showSearch />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Wishlist</h1>
          <p className="text-gray-600 text-sm mb-6">Products you&apos;ve saved for later.</p>
          <WishlistClient initialProducts={products} />
        </div>
      </main>
    </>
  );
}
