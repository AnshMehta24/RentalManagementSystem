import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendorAuth";

type ReportType = "revenue" | "product" | "late";

function escapeCsvCell(val: unknown): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.join(","), ...rows.map((r) => r.map(escapeCsvCell).join(","))];
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const auth = await requireVendor(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const vendorId = auth.userId;

  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "revenue") as ReportType;
    const format = (searchParams.get("format") || "json") as "json" | "csv" | "xlsx";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    if (!["revenue", "product", "late"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid type. Use: revenue | product | late" },
        { status: 400 }
      );
    }

    if (type === "revenue") {
      const invoices = await prisma.invoice.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: fromDate, lte: toDate },
          order: { quotation: { vendorId } },
        },
        include: {
          order: {
            include: {
              customer: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const rows = invoices.map((inv) => ({
        date: inv.createdAt.toISOString().slice(0, 10),
        invoiceId: inv.id,
        orderId: inv.orderId,
        customer: inv.order?.customer?.name ?? "",
        rentalAmount: inv.rentalAmount,
        securityDeposit: inv.securityDeposit,
        deliveryCharge: inv.deliveryCharge,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        status: inv.status,
      }));

      const summary = {
        totalRevenue: rows.reduce((s, r) => s + r.paidAmount, 0),
        totalInvoices: rows.length,
        from: fromDate.toISOString().slice(0, 10),
        to: toDate.toISOString().slice(0, 10),
      };

      if (format === "csv") {
        const headers = [
          "date",
          "invoiceId",
          "orderId",
          "customer",
          "rentalAmount",
          "securityDeposit",
          "deliveryCharge",
          "totalAmount",
          "paidAmount",
          "status",
        ];
        const csv = toCsv(
          headers,
          rows.map((r) => [
            r.date,
            r.invoiceId,
            r.orderId,
            r.customer,
            r.rentalAmount,
            r.securityDeposit,
            r.deliveryCharge,
            r.totalAmount,
            r.paidAmount,
            r.status,
          ])
        );
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="vendor-revenue-${fromDate.toISOString().slice(0, 10)}-${toDate.toISOString().slice(0, 10)}.csv"`,
          },
        });
      }

      if (format === "xlsx") {
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Revenue");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="vendor-revenue-${fromDate.toISOString().slice(0, 10)}.xlsx"`,
          },
        });
      }

      return NextResponse.json({ success: true, data: { summary, rows } });
    }

    if (type === "product") {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: fromDate, lte: toDate },
            quotation: { vendorId },
          },
        },
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
      });

      const byVariant = new Map<
        number,
        { variantId: number; productName: string; totalQty: number; orderIds: Set<number> }
      >();
      orderItems.forEach((oi) => {
        const v = oi.variant;
        const key = v.id;
        const existing = byVariant.get(key);
        const productName = v.product?.name ?? "Unknown";
        if (existing) {
          existing.totalQty += oi.quantity;
          existing.orderIds.add(oi.orderId);
        } else {
          const orderIds = new Set<number>();
          orderIds.add(oi.orderId);
          byVariant.set(key, {
            variantId: v.id,
            productName,
            totalQty: oi.quantity,
            orderIds,
          });
        }
      });

      const rows = Array.from(byVariant.values())
        .map((x) => ({
          variantId: x.variantId,
          productName: x.productName,
          totalQty: x.totalQty,
          orderCount: x.orderIds.size,
        }))
        .sort((a, b) => b.totalQty - a.totalQty);

      if (format === "csv") {
        const headers = ["variantId", "productName", "totalQty", "orderCount"];
        const csv = toCsv(
          headers,
          rows.map((r) => [r.variantId, r.productName, r.totalQty, r.orderCount])
        );
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="vendor-product-frequency-${fromDate.toISOString().slice(0, 10)}.csv"`,
          },
        });
      }

      if (format === "xlsx") {
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Products");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="vendor-product-frequency-${fromDate.toISOString().slice(0, 10)}.xlsx"`,
          },
        });
      }

      return NextResponse.json({ success: true, data: { from: fromDate, to: toDate, rows } });
    }

    if (type === "late") {
      const now = new Date();
      const orders = await prisma.rentalOrder.findMany({
        where: {
          status: "ACTIVE",
          quotation: { vendorId },
        },
        include: {
          customer: { select: { name: true, email: true } },
          items: true,
          return: true,
        },
      });

      const lateRows: {
        orderId: number;
        customerName: string;
        rentalEnd: string;
        daysLate: number;
        lateFee: number;
        status: string;
      }[] = [];

      orders.forEach((order) => {
        order.items.forEach((item) => {
          const end = new Date(item.rentalEnd);
          if (end < now) {
            const daysLate = Math.ceil((now.getTime() - end.getTime()) / (24 * 60 * 60 * 1000));
            const lateFee = order.return?.lateFee ?? 0;
            lateRows.push({
              orderId: order.id,
              customerName: order.customer?.name ?? "",
              rentalEnd: item.rentalEnd.toISOString().slice(0, 10),
              daysLate,
              lateFee,
              status: order.return ? "Returned" : "Late",
            });
          }
        });
      });

      if (format === "csv") {
        const headers = ["orderId", "customerName", "rentalEnd", "daysLate", "lateFee", "status"];
        const csv = toCsv(
          headers,
          lateRows.map((r) => [r.orderId, r.customerName, r.rentalEnd, r.daysLate, r.lateFee, r.status])
        );
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="vendor-late-returns-${now.toISOString().slice(0, 10)}.csv"`,
          },
        });
      }

      if (format === "xlsx") {
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(lateRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Late Returns");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="vendor-late-returns-${now.toISOString().slice(0, 10)}.xlsx"`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: { rows: lateRows, totalLateFee: lateRows.reduce((s, r) => s + r.lateFee, 0) },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Vendor reports error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
