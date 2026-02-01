"use server";

import { OrderStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";


export async function getVendorDashboardData(vendorId: number) {
    const [
        totalOrders,
        activeRentals, 
        inventoryItems,
        revenueAgg,
        recentOrders
    ] = await Promise.all([
        prisma.rentalOrder.count({
            where: {
                quotation: {
                    vendorId
                }
            }
        }),
        prisma.rentalOrder.count({
            where: {
                quotation: {
                    vendorId
                },
                status: OrderStatus.ACTIVE
            }
        }),
        prisma.productVariant.aggregate({
            where: {
                product: {
                    vendorId
                }
            },
            _sum: {
                quantity: true
            }
        }),
        prisma.invoice.aggregate({
            where: {
                order: {
                    quotation: {
                        vendorId
                    }
                },
                status: "PAID"
            },
            _sum: {
                totalAmount: true
            }
        }),
        prisma.rentalOrder.findMany({
            where: {
                quotation: {
                    vendorId
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 5,
            select: {
                id: true,
                status: true,
                createdAt: true
            }
        })
    ]);

    return {
        totalOrders,
        activeRentals,
        inventoryItems: inventoryItems._sum.quantity ?? 0,
        totalRevenue: revenueAgg._sum.totalAmount ?? 0,
        recentOrders
    };
}
