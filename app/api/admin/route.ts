// app/api/admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/superAdminAuth";

function isPrismaError(e: unknown): e is { code: string; message?: string } {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as { code: unknown }).code === "string";
}

// ============================================================================
// ENUMS (matching your requirements)
// ============================================================================

enum PeriodUnit {
  HOUR = "HOUR",
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR",
}

enum AttributeDisplayType {
  RADIO = "RADIO",
  PILLS = "PILLS",
  CHECKBOX = "CHECKBOX",
  IMAGE = "IMAGE",
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkAuth(request: NextRequest) {
  return requireSuperAdmin(request);
}

// ============================================================================
// MAIN HANDLERS
// ============================================================================

export async function GET(request: NextRequest) {
  const auth = await checkAuth(request);
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");

  try {
    switch (resource) {
      case "rental-periods":
        return await getRentalPeriods(searchParams);
      case "rental-period":
        return await getRentalPeriod(searchParams);
      case "attributes":
        return await getAttributes(searchParams);
      case "attribute":
        return await getAttribute(searchParams);
      case "attribute-values":
        return await getAttributeValues(searchParams);
      case "attribute-value":
        return await getAttributeValue(searchParams);
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid resource",
            validResources: [
              "rental-periods",
              "rental-period", 
              "attributes",
              "attribute",
              "attribute-values",
              "attribute-value"
            ]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth(request);
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { resource } = body;

    switch (resource) {
      case "rental-period":
        return await createRentalPeriod(body);
      case "attribute":
        return await createAttribute(body);
      case "attribute-value":
        return await createAttributeValue(body);
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid resource in body",
            validResources: ["rental-period", "attribute", "attribute-value"]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("POST Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (isPrismaError(error) && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A record with these values already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Operation failed", message: msg },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await checkAuth(request);
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { resource } = body;

    switch (resource) {
      case "rental-period":
        return await updateRentalPeriod(body);
      case "attribute":
        return await updateAttribute(body);
      case "attribute-value":
        return await updateAttributeValue(body);
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid resource in body",
            validResources: ["rental-period", "attribute", "attribute-value"]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await checkAuth(request);
  if (!auth) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");

  try {
    switch (resource) {
      case "rental-period":
        return await deleteRentalPeriod(searchParams);
      case "attribute":
        return await deleteAttribute(searchParams);
      case "attribute-value":
        return await deleteAttributeValue(searchParams);
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: "Invalid resource",
            validResources: ["rental-period", "attribute", "attribute-value"]
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// RENTAL PERIODS - CRUD OPERATIONS
// ============================================================================

async function getRentalPeriods(searchParams: URLSearchParams) {
  const isActive = searchParams.get("isActive");

  const whereClause = isActive !== null 
    ? { isActive: isActive === "true" } 
    : {};

  const rentalPeriods = await prisma.rentalPeriod.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { rentalPrices: true }
      }
    }
  });

  return NextResponse.json({
    success: true,
    data: rentalPeriods,
    count: rentalPeriods.length,
  });
}

async function getRentalPeriod(searchParams: URLSearchParams) {
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing rental period ID" },
      { status: 400 }
    );
  }

  const rentalPeriod = await prisma.rentalPeriod.findUnique({
    where: { id: parseInt(id) },
    include: {
      rentalPrices: {
        include: {
          variant: {
            include: {
              product: true
            }
          }
        }
      }
    }
  });

  if (!rentalPeriod) {
    return NextResponse.json(
      { success: false, error: "Rental period not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: rentalPeriod,
  });
}

async function createRentalPeriod(body: any) {
  const { name, duration, unit, isActive } = body;

  // Validation
  if (!name || duration === undefined || !unit) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Missing required fields",
        required: ["name", "duration", "unit"]
      },
      { status: 400 }
    );
  }

  const durationNum = parseInt(String(duration), 10);
  if (isNaN(durationNum) || durationNum < 1) {
    return NextResponse.json(
      { success: false, error: "Duration must be a positive number" },
      { status: 400 }
    );
  }

  // Validate unit enum
  if (!Object.values(PeriodUnit).includes(unit as PeriodUnit)) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid unit",
        validUnits: Object.values(PeriodUnit)
      },
      { status: 400 }
    );
  }

  // Check unique constraint: duration + unit
  const existing = await prisma.rentalPeriod.findFirst({
    where: { duration: durationNum, unit: unit as PeriodUnit },
  });
  if (existing) {
    return NextResponse.json(
      { 
        success: false, 
        error: `A rental period with ${durationNum} ${unit} already exists. Use a different duration or unit.`
      },
      { status: 400 }
    );
  }

  try {
    const rentalPeriod = await prisma.rentalPeriod.create({
      data: {
        name: String(name).trim(),
        duration: durationNum,
        unit: unit as PeriodUnit,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: rentalPeriod,
        message: "Rental period created successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    if (isPrismaError(err) && err.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A rental period with this duration and unit already exists." },
        { status: 400 }
      );
    }
    throw err;
  }
}

async function updateRentalPeriod(body: any) {
  const { id, name, duration, unit, isActive } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing rental period ID" },
      { status: 400 }
    );
  }

  const existing = await prisma.rentalPeriod.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Rental period not found" },
      { status: 404 }
    );
  }

  // Validate unit if provided
  if (unit && !Object.values(PeriodUnit).includes(unit as PeriodUnit)) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid unit",
        validUnits: Object.values(PeriodUnit)
      },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = String(name).trim();
  if (duration !== undefined) {
    const d = parseInt(String(duration), 10);
    if (isNaN(d) || d < 1) {
      return NextResponse.json(
        { success: false, error: "Duration must be a positive number" },
        { status: 400 }
      );
    }
    updateData.duration = d;
  }
  if (unit !== undefined) updateData.unit = unit as PeriodUnit;
  if (isActive !== undefined) updateData.isActive = Boolean(isActive);

  // If changing duration/unit, check unique constraint
  const newDuration = (updateData.duration ?? existing.duration) as number;
  const newUnit = (updateData.unit ?? existing.unit) as PeriodUnit;
  const conflict = await prisma.rentalPeriod.findFirst({
    where: {
      duration: newDuration,
      unit: newUnit,
      NOT: { id: parseInt(String(id)) },
    },
  });
  if (conflict) {
    return NextResponse.json(
      { success: false, error: `A rental period with ${newDuration} ${newUnit} already exists.` },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.rentalPeriod.update({
      where: { id: parseInt(String(id)) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Rental period updated successfully",
    });
  } catch (err) {
    if (isPrismaError(err) && err.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A rental period with this duration and unit already exists." },
        { status: 400 }
      );
    }
    throw err;
  }
}

async function deleteRentalPeriod(searchParams: URLSearchParams) {
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing rental period ID" },
      { status: 400 }
    );
  }

  const existing = await prisma.rentalPeriod.findUnique({
    where: { id: parseInt(id) },
    include: {
      rentalPrices: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Rental period not found" },
      { status: 404 }
    );
  }

  if (existing.rentalPrices.length > 0) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Cannot delete rental period that is being used in pricing",
        suggestion: "Consider deactivating it instead by setting isActive to false"
      },
      { status: 400 }
    );
  }

  await prisma.rentalPeriod.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({
    success: true,
    message: "Rental period deleted successfully",
  });
}



async function getAttributes(searchParams: URLSearchParams) {
  const includeValues = searchParams.get("includeValues") !== "false";

  const attributes = await prisma.attribute.findMany({
    include: {
      values: includeValues,
      _count: {
        select: { values: true }
      }
    },
    orderBy: {
      id: "desc",
    },
  });

  return NextResponse.json({
    success: true,
    data: attributes,
    count: attributes.length,
  });
}

async function getAttribute(searchParams: URLSearchParams) {
  const id = searchParams.get("id");
  const includeValues = searchParams.get("includeValues") !== "false";

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing attribute ID" },
      { status: 400 }
    );
  }

  const attribute = await prisma.attribute.findUnique({
    where: { id: parseInt(id) },
    include: {
      values: includeValues,
    },
  });

  if (!attribute) {
    return NextResponse.json(
      { success: false, error: "Attribute not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: attribute,
  });
}

async function createAttribute(body: any) {
  const { name, displayType, values } = body;

  if (!name) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Missing required field: name"
      },
      { status: 400 }
    );
  }

  if (displayType && !Object.values(AttributeDisplayType).includes(displayType as AttributeDisplayType)) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid displayType",
        validTypes: Object.values(AttributeDisplayType)
      },
      { status: 400 }
    );
  }

  const nameStr = String(name).trim();
  const existingAttr = await prisma.attribute.findUnique({
    where: { name: nameStr },
  });
  if (existingAttr) {
    return NextResponse.json(
      { success: false, error: `An attribute named "${nameStr}" already exists.` },
      { status: 400 }
    );
  }

  try {
    const attribute = await prisma.attribute.create({
      data: {
        name: nameStr,
        displayType: (displayType as AttributeDisplayType) || AttributeDisplayType.RADIO,
        ...(values && Array.isArray(values) && values.length > 0 && {
          values: {
            createMany: {
              data: values
                .filter((v: { value?: string }) => v?.value && String(v.value).trim())
                .map((v: { value: string; extraPrice?: number }) => ({
                  value: String(v.value).trim(),
                  extraPrice: v.extraPrice !== undefined ? parseFloat(String(v.extraPrice)) : 0,
                })),
            },
          },
        }),
      },
      include: {
        values: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: attribute,
        message: "Attribute created successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    if (isPrismaError(err) && err.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "An attribute with this name already exists." },
        { status: 400 }
      );
    }
    throw err;
  }
}

async function updateAttribute(body: any) {
  const { id, name, displayType } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing attribute ID" },
      { status: 400 }
    );
  }

  const existing = await prisma.attribute.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Attribute not found" },
      { status: 404 }
    );
  }

  // Validate displayType if provided
  if (displayType && !Object.values(AttributeDisplayType).includes(displayType as AttributeDisplayType)) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Invalid displayType",
        validTypes: Object.values(AttributeDisplayType)
      },
      { status: 400 }
    );
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (displayType !== undefined) updateData.displayType = displayType as AttributeDisplayType;

  const updated = await prisma.attribute.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      values: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: updated,
    message: "Attribute updated successfully",
  });
}

async function deleteAttribute(searchParams: URLSearchParams) {
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing attribute ID" },
      { status: 400 }
    );
  }

  const existing = await prisma.attribute.findUnique({
    where: { id: parseInt(id) },
    include: {
      values: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Attribute not found" },
      { status: 404 }
    );
  }

  await prisma.attribute.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({
    success: true,
    message: "Attribute and its values deleted successfully",
    deletedValues: existing.values.length,
  });
}


async function getAttributeValues(searchParams: URLSearchParams) {
  const attributeId = searchParams.get("attributeId");

  const whereClause = attributeId 
    ? { attributeId: parseInt(attributeId) } 
    : {};

  const values = await prisma.attributeValue.findMany({
    where: whereClause,
    include: {
      attribute: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return NextResponse.json({
    success: true,
    data: values,
    count: values.length,
  });
}

async function getAttributeValue(searchParams: URLSearchParams) {
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing attribute value ID" },
      { status: 400 }
    );
  }

  const value = await prisma.attributeValue.findUnique({
    where: { id: parseInt(id) },
    include: {
      attribute: true,
    },
  });

  if (!value) {
    return NextResponse.json(
      { success: false, error: "Attribute value not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: value,
  });
}

async function createAttributeValue(body: any) {
  const { attributeId, value, extraPrice, values } = body;

  // Validation
  if (!attributeId) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Missing required field: attributeId"
      },
      { status: 400 }
    );
  }

  // Check if attribute exists
  const attribute = await prisma.attribute.findUnique({
    where: { id: parseInt(attributeId) },
  });

  if (!attribute) {
    return NextResponse.json(
      { success: false, error: "Attribute not found" },
      { status: 404 }
    );
  }

  // Handle bulk creation
  if (values && Array.isArray(values) && values.length > 0) {
    const created = await prisma.attributeValue.createMany({
      data: values.map((v: any) => ({
        attributeId: parseInt(attributeId),
        value: v.value,
        extraPrice: v.extraPrice !== undefined ? parseFloat(v.extraPrice) : 0,
      })),
    });

    // Fetch created values to return
    const newValues = await prisma.attributeValue.findMany({
      where: { attributeId: parseInt(attributeId) },
      include: { attribute: true },
      orderBy: { id: "desc" },
      take: values.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: newValues,
        message: `${created.count} attribute values created successfully`,
      },
      { status: 201 }
    );
  }

  // Handle single creation
  if (!value) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Missing required field: value"
      },
      { status: 400 }
    );
  }

  const newValue = await prisma.attributeValue.create({
    data: {
      attributeId: parseInt(attributeId),
      value,
      extraPrice: extraPrice !== undefined ? parseFloat(extraPrice) : 0,
    },
    include: {
      attribute: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: newValue,
      message: "Attribute value created successfully",
    },
    { status: 201 }
  );
}

async function updateAttributeValue(body: any) {
  const { id, value, extraPrice, attributeId } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing attribute value ID" },
      { status: 400 }
    );
  }

  const existing = await prisma.attributeValue.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Attribute value not found" },
      { status: 404 }
    );
  }

  // If attributeId is being changed, verify new attribute exists
  if (attributeId && attributeId !== existing.attributeId) {
    const attribute = await prisma.attribute.findUnique({
      where: { id: parseInt(attributeId) },
    });
    if (!attribute) {
      return NextResponse.json(
        { success: false, error: "Attribute not found" },
        { status: 404 }
      );
    }
  }

  const updateData: any = {};
  if (value !== undefined) updateData.value = value;
  if (extraPrice !== undefined) updateData.extraPrice = parseFloat(extraPrice);
  if (attributeId !== undefined) updateData.attributeId = parseInt(attributeId);

  const updated = await prisma.attributeValue.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      attribute: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: updated,
    message: "Attribute value updated successfully",
  });
}

async function deleteAttributeValue(searchParams: URLSearchParams) {
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing attribute value ID" },
      { status: 400 }
    );
  }

  const existing = await prisma.attributeValue.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Attribute value not found" },
      { status: 404 }
    );
  }

  await prisma.attributeValue.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({
    success: true,
    message: "Attribute value deleted successfully",
  });
}