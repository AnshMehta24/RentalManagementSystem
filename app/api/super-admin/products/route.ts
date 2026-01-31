import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superAdminAuth";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const vendorId = searchParams.get("vendorId");
    const published = searchParams.get("published"); // "true" | "false"
    const isRentable = searchParams.get("isRentable"); // "true" | "false"

    const where: {
      name?: { contains: string; mode: "insensitive" };
      vendorId?: number;
      published?: boolean;
      isRentable?: boolean;
    } = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    const parsedVendorId = vendorId ? parseInt(vendorId, 10) : NaN;
    if (Number.isInteger(parsedVendorId)) where.vendorId = parsedVendorId;
    if (published === "true" || published === "false") where.published = published === "true";
    if (isRentable === "true" || isRentable === "false") where.isRentable = isRentable === "true";

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          vendor: {
            select: { id: true, name: true, companyName: true, email: true },
          },
          variants: {
            include: {
              reservations: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const list = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isRentable: p.isRentable,
      published: p.published,
      vendorId: p.vendorId,
      vendor: p.vendor ?? null,
      variantCount: p.variants.length,
      totalStock: p.variants.reduce((s, v) => s + v.quantity, 0),
      reservedOrOut: p.variants.reduce(
        (s, v) => s + (v.reservations?.reduce((r, res) => r + res.quantity, 0) ?? 0),
        0
      ),
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: list,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Super Admin products list error:", error);
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

export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, published } = body as { productId: number; published?: boolean };

    if (!productId) {
      return NextResponse.json({ success: false, error: "Missing productId" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const updateData: { published?: boolean } = {};
    if (typeof published === "boolean") updateData.published = published;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "No valid updates (e.g. published)" }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Product updated",
    });
  } catch (error) {
    console.error("Super Admin product update error:", error);
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
