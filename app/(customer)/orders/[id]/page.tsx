import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/productPage/Header";
import { getCustomerOrderById } from "@/app/(customer)/actions/orders";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { Package, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  let className = "inline-flex px-2 py-0.5 rounded text-xs font-medium ";
  if (s === "confirmed" || s === "active") className += "bg-blue-100 text-blue-800";
  else if (s === "completed") className += "bg-green-100 text-green-800";
  else if (s === "cancelled") className += "bg-red-100 text-red-800";
  else className += "bg-gray-100 text-gray-800";
  return <span className={className}>{status.replace("_", " ")}</span>;
}

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/orders/${id}`);
  if (user.role !== "CUSTOMER") notFound();
  const orderId = parseInt(id, 10);
  if (!Number.isInteger(orderId) || orderId < 1) notFound();

  const order = await getCustomerOrderById(orderId);
  if (!order) notFound();

  return (
    <>
      <Header showSearch />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to orders
          </Link>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Order #{String(order.id).padStart(6, "0")}</h1>
                  <p className="text-sm text-gray-500">
                    Quotation #{order.quotationId} • {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              {statusBadge(order.status)}
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">Vendor</h2>
                <p className="font-medium text-gray-900">
                  {order.vendorCompanyName ?? order.vendorName}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-2">Fulfillment</h2>
                <p className="text-gray-900">{order.fulfillmentType.replace("_", " ")}</p>
                {order.rentalStart && order.rentalEnd && (
                  <p className="text-sm text-gray-600 mt-1">
                    Rental period: {formatDate(order.rentalStart)} – {formatDate(order.rentalEnd)}
                  </p>
                )}
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-3">Items</h2>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-700">Product</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-700">Qty</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-700">Unit price</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.productName}</div>
                            {item.variantAttributes.length > 0 && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {item.variantAttributes.map((a) => `${a.name}: ${a.value}`).join(" • ")}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-700">₹{item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-56 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discountAmt > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                      <span>- ₹{order.discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  {order.deliveryCharge > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping / Delivery</span>
                      <span>₹{order.deliveryCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
