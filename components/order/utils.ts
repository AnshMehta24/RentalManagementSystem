import type { OrderBoardData } from "@/types/order";


export function getFulfillmentProgress(order: OrderBoardData): string {
  if (order.status === "COMPLETED") {
    return "Completed";
  }

  if (order.fulfillmentType === "DELIVERY") {
    if (order.delivery?.deliveredAt) {
      return "Delivered";
    }
    if (order.delivery?.shippedAt) {
      return "In Transit";
    }
    return "Preparing";
  } else {
    if (order.pickup?.pickedAt) {
      return "Picked Up";
    }
    return "Ready for Pickup";
  }
}



