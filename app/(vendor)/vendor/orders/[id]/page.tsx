import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getOrderByIdForVendor } from "../actions";
import OrderStepperClient from "./OrderStepperClient";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId < 1) notFound();

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/login?redirect=/vendor/orders/${id}`);
  }
  if (currentUser.role !== "VENDOR") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-4 text-gray-600">Only vendors can view order details.</p>
      </div>
    );
  }

  const order = await getOrderByIdForVendor(orderId);
  if (!order) notFound();

  return (
    <OrderStepperClient
      order={order}
      currentVendorId={currentUser.id}
    />
  );
}
