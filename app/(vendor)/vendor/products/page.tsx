import { JSX } from "react";
import { getProducts } from "./actions";
import Link from "next/link";
import { Plus, Package, Eye, EyeOff, Edit } from "lucide-react";

export default async function ProductsPage(): Promise<JSX.Element> {
  const result = await getProducts();

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2 text-sm">Manage your product catalog</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-700 font-medium">Error: {result.error}</p>
        </div>
      </div>
    );
  }

  const products = result.data || [];

  const productsWithStats = products.map((product) => {
    const totalInventory = product.variants.reduce((sum, variant) => sum + variant.quantity, 0);
    const variantCount = product.variants.length;

    let startingPrice: number | null = null;

    for (const variant of product.variants) {
      if (variant.prices && variant.prices.length > 0) {
        const variantMinPrice = Math.min(...variant.prices.map((p) => p.price));
        if (startingPrice === null || variantMinPrice < startingPrice) {
          startingPrice = variantMinPrice;
        }
      }
    }

    return {
      ...product,
      totalInventory,
      startingPrice,
      variantCount,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2 text-sm">Manage your product catalog</p>
        </div>
        <Link
          href="/vendor/products/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {productsWithStats.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-6 text-sm">
            Get started by creating your first product
          </p>
          <Link
            href="/vendor/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create your first product
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Variants
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Inventory
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Starting Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productsWithStats.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 border border-gray-200">
                          <Package className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-sm text-gray-600 line-clamp-1 mt-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {product.published ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            product.published
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.published ? "Published" : "Unpublished"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {product.variantCount} {product.variantCount === 1 ? "variant" : "variants"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {product.totalInventory}
                        </span>
                        <span className="text-xs text-gray-600">units</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.startingPrice !== null && product.startingPrice > 0 ? (
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{product.startingPrice.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(product.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/vendor/products/${product.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
