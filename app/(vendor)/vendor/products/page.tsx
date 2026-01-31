import { JSX } from "react";
import { getProducts } from "./actions";
import Link from "next/link";
import { Plus, Package, Eye, EyeOff, Edit } from "lucide-react";

export default async function ProductsPage(): Promise<JSX.Element> {
  const result = await getProducts();

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Products</h1>
                <p className="text-muted-foreground mt-2">Manage your product catalog</p>
              </div>
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6">
              <p className="text-destructive font-medium">Error: {result.error}</p>
            </div>
          </div>
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Products</h1>
              <p className="text-muted-foreground mt-2">Manage your product catalog</p>
            </div>
            <Link
              href="/vendor/products/new"
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </div>

          {productsWithStats.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center shadow-sm">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first product
              </p>
              <Link
                href="/vendor/products/new"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create your first product
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Variants
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Inventory
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Starting Price
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {productsWithStats.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-accent/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted border border-border">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-foreground truncate">
                                {product.name}
                              </div>
                              {product.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
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
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              }`}
                            >
                              {product.published ? "Published" : "Unpublished"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-foreground">
                            {product.variantCount} {product.variantCount === 1 ? "variant" : "variants"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {product.totalInventory}
                            </span>
                            <span className="text-xs text-muted-foreground">units</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {product.startingPrice !== null && product.startingPrice > 0 ? (
                            <span className="text-sm font-semibold text-foreground">
                              ₹{product.startingPrice.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
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
                            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
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
      </div>
    </div>
  );
}
