import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superAdminAuth";

const PERIOD_UNITS = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"] as const;
const DISPLAY_TYPES = ["RADIO", "PILLS", "CHECKBOX", "IMAGE"] as const;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Super Admin settings: GET for rental periods and attributes.
 * PATCH for batch inline updates.
 */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource"); // rental-periods | attributes

    if (resource === "rental-periods") {
      const periods = await prisma.rentalPeriod.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { rentalPrices: true } },
        },
      });
      return NextResponse.json({ success: true, data: periods });
    }

    if (resource === "attributes") {
      const attributes = await prisma.attribute.findMany({
        orderBy: { id: "desc" },
        include: {
          values: {
            where: { isActive: true },
            include: {
              _count: { select: { variantAttributeValues: true } },
            },
          },
          _count: { select: { values: true } },
        },
      });
      return NextResponse.json({ success: true, data: attributes });
    }

    return jsonError("Invalid resource. Use: rental-periods | attributes", 400);
  } catch (error) {
    console.error("Super Admin settings GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Batch update rental periods or attributes.
 * Body: { type: "rental-periods" | "attributes", ... }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const { type } = body;

    if (type === "rental-periods") {
      return await patchRentalPeriods(body);
    }
    if (type === "attributes") {
      return await patchAttributes(body);
    }

    return jsonError("Invalid type. Use: rental-periods | attributes", 400);
  } catch (error) {
    console.error("Super Admin settings PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function patchRentalPeriods(body: {
  periods?: Array<{ id: number; name?: string; duration?: number; unit?: string; isActive?: boolean }>;
}) {
  const { periods } = body;
  if (!Array.isArray(periods) || periods.length === 0) {
    return jsonError("Missing or empty periods array", 400);
  }

  for (const p of periods) {
    if (!p || typeof p.id !== "number") {
      return jsonError("Each period must have a numeric id", 400);
    }
    if (p.name !== undefined && (typeof p.name !== "string" || !p.name.trim())) {
      return jsonError("Period name must be a non-empty string", 400);
    }
    if (p.duration !== undefined && (typeof p.duration !== "number" || Number.isNaN(p.duration) || p.duration < 1)) {
      return jsonError("Duration must be a positive number", 400);
    }
    if (p.unit !== undefined && !PERIOD_UNITS.includes(p.unit)) {
      return jsonError(`Invalid unit. Valid: ${PERIOD_UNITS.join(", ")}`, 400);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const p of periods) {
        const existing = await tx.rentalPeriod.findUnique({ where: { id: p.id } });
        if (!existing) {
          throw new Error(`Rental period ${p.id} not found`);
        }
        const updateData: Record<string, unknown> = {};
        if (p.name !== undefined) updateData.name = p.name.trim();
        if (p.duration !== undefined) updateData.duration = p.duration;
        if (p.unit !== undefined) updateData.unit = p.unit;
        if (p.isActive !== undefined) updateData.isActive = p.isActive;
        if (Object.keys(updateData).length > 0) {
          await tx.rentalPeriod.update({
            where: { id: p.id },
            data: updateData,
          });
        }
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transaction failed";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Rental periods updated successfully",
  });
}

async function patchAttributes(body: {
  attributes?: Array<{
    id: number;
    name?: string;
    displayType?: string;
    values?: Array<{ id?: number; value?: string; extraPrice?: number }>;
  }>;
}) {
  const { attributes } = body;
  if (!Array.isArray(attributes) || attributes.length === 0) {
    return jsonError("Missing or empty attributes array", 400);
  }

  for (const a of attributes) {
    if (!a || typeof a.id !== "number") {
      return jsonError("Each attribute must have a numeric id", 400);
    }
    if (a.name !== undefined && (typeof a.name !== "string" || !a.name.trim())) {
      return jsonError("Attribute name must be a non-empty string", 400);
    }
    if (a.displayType !== undefined && !DISPLAY_TYPES.includes(a.displayType)) {
      return jsonError(`Invalid displayType. Valid: ${DISPLAY_TYPES.join(", ")}`, 400);
    }
    if (a.values !== undefined && !Array.isArray(a.values)) {
      return jsonError("values must be an array", 400);
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
    for (const attr of attributes) {
      const existing = await tx.attribute.findUnique({
        where: { id: attr.id },
        include: {
          values: { include: { _count: { select: { variantAttributeValues: true } } } },
        },
      });
      if (!existing) {
        throw new Error(`Attribute ${attr.id} not found`);
      }

      if (attr.name !== undefined || attr.displayType !== undefined) {
        const updateData: Record<string, unknown> = {};
        if (attr.name !== undefined) updateData.name = attr.name.trim();
        if (attr.displayType !== undefined) updateData.displayType = attr.displayType;
        await tx.attribute.update({
          where: { id: attr.id },
          data: updateData,
        });
      }

      if (attr.values !== undefined) {
        const sentValueIds = new Set(
          attr.values.filter((v) => v.id != null).map((v) => Number(v.id))
        );
        const toRemove = existing.values.filter(
          (v) => v.isActive && !sentValueIds.has(v.id)
        );
        for (const v of toRemove) {
          if (v._count.variantAttributeValues > 0) {
            throw new Error(
              `Cannot remove value "${v.value}" (ID ${v.id}): it is in use by product variants`
            );
          }
          await tx.attributeValue.update({
            where: { id: v.id },
            data: { isActive: false },
          });
        }

        for (const v of attr.values) {
          if (v.id != null) {
            const ev = existing.values.find((x) => x.id === Number(v.id));
            if (!ev) continue;
            const updateData: Record<string, unknown> = {};
            if (v.value !== undefined) updateData.value = String(v.value).trim();
            if (v.extraPrice !== undefined) updateData.extraPrice = Number(v.extraPrice);
            if (Object.keys(updateData).length > 0) {
              await tx.attributeValue.update({
                where: { id: ev.id },
                data: updateData,
              });
            }
          } else if (v.value !== undefined && String(v.value).trim()) {
            const valStr = String(v.value).trim();
            const inactive = existing.values.find(
              (x) => !x.isActive && x.value.toLowerCase() === valStr.toLowerCase()
            );
            if (inactive) {
              await tx.attributeValue.update({
                where: { id: inactive.id },
                data: { isActive: true, extraPrice: v.extraPrice !== undefined ? Number(v.extraPrice) : 0 },
              });
            } else {
              await tx.attributeValue.create({
                data: {
                  attributeId: attr.id,
                  value: valStr,
                  extraPrice: v.extraPrice !== undefined ? Number(v.extraPrice) : 0,
                },
              });
            }
          }
        }
      }
    }
  });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transaction failed";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Attributes updated successfully",
  });
}
