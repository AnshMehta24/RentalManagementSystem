"use server";

import { prisma } from "@/lib/prisma";
import { ProductSchema, type ProductFormValues } from "@/schema/product";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/getCurrentUser";

export async function getVendor() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized: Please log in to continue",
      };
    }

    if (currentUser.role !== "VENDOR") {
      return {
        success: false,
        error: "Unauthorized: Only vendors can access this resource",
      };
    }

    const vendor = await prisma.user.findUnique({
      where: {
        id: currentUser.id,
        role: "VENDOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        companyLogo: true,
        gstin: true,
      },
    });

    if (!vendor) {
      return {
        success: false,
        error: "Vendor not found",
      };
    }

    return {
      success: true,
      data: vendor,
    };
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return {
      success: false,
      error: "Failed to fetch vendor data",
    };
  }
}

export async function getProducts() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized: Please log in to continue",
      };
    }

    if (currentUser.role !== "VENDOR") {
      return {
        success: false,
        error: "Unauthorized: Only vendors can access this resource",
      };  
    }

    const vendorId = currentUser.id;

    const products = await prisma.product.findMany({
      where: {
        vendorId: vendorId,
      },
      include: {
        variants: {
          include: {
            prices: {
              include: {
                period: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      error: "Failed to fetch products",
    };
  }
}

export async function createProduct(data: ProductFormValues) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized: Please log in to continue",
      };
    }

    if (currentUser.role !== "VENDOR") {
      return {
        success: false,
        error: "Unauthorized: Only vendors can create products",
      };
    }

    const vendorId = currentUser.id;

    const validationResult = ProductSchema.safeParse(data);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(
        (issue) => issue.message,
      );

      return {
        success: false,
        error: `Validation failed:\n${errorMessages.join("\n")}`,
      };
    }

    const validatedData = validationResult.data;

    const allPeriodIds: number[] = [];
    if (
      validatedData.variantMode === "default" &&
      validatedData.defaultVariant
    ) {
      allPeriodIds.push(
        ...validatedData.defaultVariant.rentalPrices.map((rp) => rp.periodId),
      );
    } else if (
      validatedData.variantMode === "variants" &&
      validatedData.variants
    ) {
      validatedData.variants.forEach((v) => {
        allPeriodIds.push(...v.rentalPrices.map((rp) => rp.periodId));
      });
    }

    if (allPeriodIds.length > 0) {
      const uniquePeriodIds = [...new Set(allPeriodIds)];
      const existingPeriods = await prisma.rentalPeriod.findMany({
        where: {
          id: { in: uniquePeriodIds },
          isActive: true,
        },
      });

      const existingPeriodIds = new Set(existingPeriods.map((p) => p.id));
      const missingPeriodIds = uniquePeriodIds.filter(
        (id) => !existingPeriodIds.has(id),
      );
      if (missingPeriodIds.length > 0) {
        return {
          success: false,
          error: `Invalid or inactive rental period IDs: ${missingPeriodIds.join(", ")}`,
        };
      }
    }

    let variantsToCreate: Array<{
      sku: string | null;
      quantity: number;
      costPrice: number;
      salePrice: number;
      prices: Array<{ periodId: number; price: number }>;
      attributeValues?: Array<{
        attributeId: number;
        attributeValueId: number;
      }>;
    }> = [];

    if (
      validatedData.variantMode === "default" &&
      validatedData.defaultVariant
    ) {
      variantsToCreate = [
        {
          sku: validatedData.defaultVariant.sku || null,
          quantity: validatedData.defaultVariant.quantity,
          costPrice: validatedData.defaultVariant.costPrice,
          salePrice: validatedData.defaultVariant.salePrice,
          prices: validatedData.defaultVariant.rentalPrices
            .filter((rp) => rp.price > 0)
            .map((rp) => ({
              periodId: rp.periodId,
              price: rp.price,
            })),
        },
      ];
    } else if (
      validatedData.variantMode === "variants" &&
      validatedData.variants
    ) {
      variantsToCreate = validatedData.variants.map((variant) => ({
        sku: variant.sku || null,
        quantity: variant.quantity,
        costPrice: variant.costPrice,
        salePrice: variant.salePrice,
        prices: variant.rentalPrices
          .filter((rp) => rp.price > 0)
          .map((rp) => ({
            periodId: rp.periodId,
            price: rp.price,
          })),
        attributeValues: variant.attributeValues,
      }));
    }

    const product = await prisma.product.create({
      data: {
        vendorId: vendorId,
        name: validatedData.name,
        description: validatedData.description,
        isRentable: validatedData.isRentable,
        published: validatedData.published,
        variants: {
          create: variantsToCreate.map((variant) => ({
            sku: variant.sku,
            quantity: variant.quantity,
            costPrice: variant.costPrice,
            salePrice: variant.salePrice,
            prices: {
              create: variant.prices,
            },
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    if (validatedData.variantMode === "variants" && validatedData.variants) {
      for (let i = 0; i < validatedData.variants.length; i++) {
        const variant = validatedData.variants[i];
        const createdVariant = product.variants[i];

        if (
          variant.attributeValues &&
          variant.attributeValues.length > 0 &&
          createdVariant
        ) {
          for (const attrVal of variant.attributeValues) {
            const attribute = await prisma.attribute.findUnique({
              where: { id: attrVal.attributeId },
            });

            if (!attribute) {
              throw new Error(
                `Attribute with ID ${attrVal.attributeId} not found`,
              );
            }

            const attributeValue = await prisma.attributeValue.findUnique({
              where: { id: attrVal.attributeValueId },
            });

            if (!attributeValue) {
              throw new Error(
                `Attribute value with ID ${attrVal.attributeValueId} not found`,
              );
            }

            await prisma.variantAttributeValue.create({
              data: {
                variantId: createdVariant.id,
                attributeId: attrVal.attributeId,
                attributeValueId: attrVal.attributeValueId,
              },
            });
          }
        }
      }
    }

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: {
          include: {
            prices: {
              include: {
                period: true,
              },
            },
            attributes: {
              include: {
                attribute: {
                  include: {
                    values: true,
                  },
                },
                value: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/vendor/products");
    return {
      success: true,
      data: fullProduct,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "Failed to create product",
    };
  }
}

export async function getRentalPeriods() {
  try {
    const periods = await prisma.rentalPeriod.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      success: true,
      data: periods,
    };
  } catch (error) {
    console.error("Error fetching rental periods:", error);
    return {
      success: false,
      error: "Failed to fetch rental periods",
    };
  }
}

export async function getAttributes() {
  try {
    const attributes = await prisma.attribute.findMany({
      where: {
        isActive: true,
      },
      include: {
        values: {
          where: {
            isActive: true,
          },
          orderBy: {
            value: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: attributes,
    };
  } catch (error) {
    console.error("Error fetching attributes:", error);
    return {
      success: false,
      error: "Failed to fetch attributes",
    };
  }
}

export async function getProduct(productId: number) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized: Please log in to continue",
      };
    }

    if (currentUser.role !== "VENDOR") {
      return {
        success: false,
        error: "Unauthorized: Only vendors can access this resource",
      };
    }

    const vendorId = currentUser.id;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId: vendorId,
      },
      include: {
        variants: {
          include: {
            prices: {
              include: {
                period: true,
              },
            },
            attributes: {
              include: {
                attribute: {
                  include: {
                    values: true,
                  },
                },
                value: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found or you don't have permission to access it",
      };
    }

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      success: false,
      error: "Failed to fetch product",
    };
  }
}

export async function updateProduct(
  productId: number,
  data: ProductFormValues,
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error: "Unauthorized: Please log in to continue",
      };
    }

    if (currentUser.role !== "VENDOR") {
      return {
        success: false,
        error: "Unauthorized: Only vendors can update products",
      };
    }

    const vendorId = currentUser.id;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        vendorId: vendorId,
      },
    });

    if (!existingProduct) {
      return {
        success: false,
        error: "Product not found or you don't have permission to update it",
      };
    }

    const validationResult = ProductSchema.safeParse(data);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(
        (issue) => issue.message,
      );

      return {
        success: false,
        error: `Validation failed:\n${errorMessages.join("\n")}`,
      };
    }

    const validatedData = validationResult.data;

    const allPeriodIds: number[] = [];
    if (
      validatedData.variantMode === "default" &&
      validatedData.defaultVariant
    ) {
      allPeriodIds.push(
        ...validatedData.defaultVariant.rentalPrices.map((rp) => rp.periodId),
      );
    } else if (
      validatedData.variantMode === "variants" &&
      validatedData.variants
    ) {
      validatedData.variants.forEach((v) => {
        allPeriodIds.push(...v.rentalPrices.map((rp) => rp.periodId));
      });
    }

    if (allPeriodIds.length > 0) {
      const uniquePeriodIds = [...new Set(allPeriodIds)];
      const existingPeriods = await prisma.rentalPeriod.findMany({
        where: {
          id: { in: uniquePeriodIds },
          isActive: true,
        },
      });

      const existingPeriodIds = new Set(existingPeriods.map((p) => p.id));
      const missingPeriodIds = uniquePeriodIds.filter(
        (id) => !existingPeriodIds.has(id),
      );
      if (missingPeriodIds.length > 0) {
        return {
          success: false,
          error: `Invalid or inactive rental period IDs: ${missingPeriodIds.join(", ")}`,
        };
      }
    }

    await prisma.rentalPrice.deleteMany({
      where: {
        variant: {
          productId: productId,
        },
      },
    });

    await prisma.variantAttributeValue.deleteMany({
      where: {
        variant: {
          productId: productId,
        },
      },
    });

    await prisma.productVariant.deleteMany({
      where: {
        productId: productId,
      },
    });

    let variantsToCreate: Array<{
      sku: string | null;
      quantity: number;
      costPrice: number;
      salePrice: number;
      prices: Array<{ periodId: number; price: number }>;
      attributeValues?: Array<{
        attributeId: number;
        attributeValueId: number;
      }>;
    }> = [];

    if (
      validatedData.variantMode === "default" &&
      validatedData.defaultVariant
    ) {
      variantsToCreate = [
        {
          sku: validatedData.defaultVariant.sku || null,
          quantity: validatedData.defaultVariant.quantity,
          costPrice: validatedData.defaultVariant.costPrice,
          salePrice: validatedData.defaultVariant.salePrice,
          prices: validatedData.defaultVariant.rentalPrices
            .filter((rp) => rp.price > 0)
            .map((rp) => ({
              periodId: rp.periodId,
              price: rp.price,
            })),
        },
      ];
    } else if (
      validatedData.variantMode === "variants" &&
      validatedData.variants
    ) {
      variantsToCreate = validatedData.variants.map((variant) => ({
        sku: variant.sku || null,
        quantity: variant.quantity,
        costPrice: variant.costPrice,
        salePrice: variant.salePrice,
        prices: variant.rentalPrices
          .filter((rp) => rp.price > 0)
          .map((rp) => ({
            periodId: rp.periodId,
            price: rp.price,
          })),
        attributeValues: variant.attributeValues,
      }));
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        isRentable: validatedData.isRentable,
        published: validatedData.published,
        variants: {
          create: variantsToCreate.map((variant) => ({
            sku: variant.sku,
            quantity: variant.quantity,
            costPrice: variant.costPrice,
            salePrice: variant.salePrice,
            prices: {
              create: variant.prices,
            },
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    if (validatedData.variantMode === "variants" && validatedData.variants) {
      for (let i = 0; i < validatedData.variants.length; i++) {
        const variant = validatedData.variants[i];
        const createdVariant = product.variants[i];

        if (
          variant.attributeValues &&
          variant.attributeValues.length > 0 &&
          createdVariant
        ) {
          for (const attrVal of variant.attributeValues) {
            const attribute = await prisma.attribute.findUnique({
              where: { id: attrVal.attributeId },
            });

            if (!attribute) {
              throw new Error(
                `Attribute with ID ${attrVal.attributeId} not found`,
              );
            }

            const attributeValue = await prisma.attributeValue.findUnique({
              where: { id: attrVal.attributeValueId },
            });

            if (!attributeValue) {
              throw new Error(
                `Attribute value with ID ${attrVal.attributeValueId} not found`,
              );
            }

            await prisma.variantAttributeValue.create({
              data: {
                variantId: createdVariant.id,
                attributeId: attrVal.attributeId,
                attributeValueId: attrVal.attributeValueId,
              },
            });
          }
        }
      }
    }

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        variants: {
          include: {
            prices: {
              include: {
                period: true,
              },
            },
            attributes: {
              include: {
                attribute: {
                  include: {
                    values: true,
                  },
                },
                value: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/vendor/products");
    return {
      success: true,
      data: fullProduct,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "Failed to update product",
    };
  }
}
