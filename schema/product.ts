import { z } from "zod";

const SelectedAttributeValueSchema = z.object({
  attributeId: z.number().int().positive(),
  attributeValueId: z.number().int().positive(),
});

const VariantConfigSchema = z.object({
  sku: z.string().optional(),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
  costPrice: z.number().min(0, "Cost price must be 0 or greater"),
  salePrice: z.number().min(0, "Sale price must be 0 or greater"),
  attributeValues: z.array(SelectedAttributeValueSchema).optional(),
  rentalPrices: z
    .array(
      z.object({
        periodId: z.number().int().positive("Period ID must be a positive integer"),
        price: z.number().min(0.01, "Price must be greater than 0"),
      })
    )
    .min(1, "At least one rental price is required"),
});

export const ProductSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(200, "Name must be less than 200 characters"),
    description: z.string().max(5000, "Description must be less than 5000 characters").optional(),
    isRentable: z.boolean(),
    published: z.boolean(),
    selectedAttributes: z.array(z.number().int().positive()).optional(),
    variantMode: z.enum(["default", "variants"]),
    variants: z.array(VariantConfigSchema).optional(),
    defaultVariant: VariantConfigSchema.omit({ attributeValues: true }).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.variantMode === "default") {
      if (!data.defaultVariant) {
        ctx.addIssue({
          code: "custom",
          message: "Default variant configuration is required",
          path: ["defaultVariant"],
        });
        return;
      }

      const variant = data.defaultVariant;
      const variantPath = ["defaultVariant"];

      if (variant.quantity < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Quantity must be 0 or greater",
          path: [...variantPath, "quantity"],
        });
      }

      if (variant.costPrice < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Cost price must be 0 or greater",
          path: [...variantPath, "costPrice"],
        });
      }

      if (variant.salePrice < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Sale price must be 0 or greater",
          path: [...variantPath, "salePrice"],
        });
      }

      if (!variant.rentalPrices || variant.rentalPrices.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "At least one rental price is required",
          path: [...variantPath, "rentalPrices"],
        });
      } else {
        const hasValidPrice = variant.rentalPrices.some((rp) => rp.price > 0);
        if (!hasValidPrice) {
          ctx.addIssue({
            code: "custom",
            message: "At least one rental price must be greater than 0",
            path: [...variantPath, "rentalPrices"],
          });
        }

        variant.rentalPrices.forEach((rp, rpIndex) => {
          if (!rp.periodId || rp.periodId <= 0) {
            ctx.addIssue({
              code: "custom",
              message: `Rental price ${rpIndex + 1} must have a valid period ID`,
              path: [...variantPath, "rentalPrices", rpIndex, "periodId"],
            });
          }
          if (rp.price < 0) {
            ctx.addIssue({
              code: "custom",
              message: `Rental price ${rpIndex + 1} must be 0 or greater`,
              path: [...variantPath, "rentalPrices", rpIndex, "price"],
            });
          }
        });

        const periodIds = variant.rentalPrices.map((rp) => rp.periodId);
        const uniquePeriodIds = new Set(periodIds);
        if (periodIds.length !== uniquePeriodIds.size) {
          ctx.addIssue({
            code: "custom",
            message: "Each rental period can only be set once",
            path: [...variantPath, "rentalPrices"],
          });
        }
      }
    }

    if (data.variantMode === "variants") {
      if (!data.variants || data.variants.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "At least one variant is required when using variant mode",
          path: ["variants"],
        });
        return;
      }

      data.variants.forEach((variant, variantIndex) => {
        const variantNum = variantIndex + 1;
        const variantPath = ["variants", variantIndex];

        if (variant.quantity < 0) {
          ctx.addIssue({
            code: "custom",
            message: `Variant ${variantNum}: Quantity must be 0 or greater`,
            path: [...variantPath, "quantity"],
          });
        }

        if (variant.costPrice < 0) {
          ctx.addIssue({
            code: "custom",
            message: `Variant ${variantNum}: Cost price must be 0 or greater`,
            path: [...variantPath, "costPrice"],
          });
        }

        if (variant.salePrice < 0) {
          ctx.addIssue({
            code: "custom",
            message: `Variant ${variantNum}: Sale price must be 0 or greater`,
            path: [...variantPath, "salePrice"],
          });
        }

        if (!variant.rentalPrices || variant.rentalPrices.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: `Variant ${variantNum}: At least one rental price is required`,
            path: [...variantPath, "rentalPrices"],
          });
        } else {
          const hasValidPrice = variant.rentalPrices.some((rp) => rp.price > 0);
          if (!hasValidPrice) {
            ctx.addIssue({
              code: "custom",
              message: `Variant ${variantNum}: At least one rental price must be greater than 0`,
              path: [...variantPath, "rentalPrices"],
            });
          }

          variant.rentalPrices.forEach((rp, rpIndex) => {
            if (!rp.periodId || rp.periodId <= 0) {
              ctx.addIssue({
                code: "custom",
                message: `Variant ${variantNum}: Rental price ${rpIndex + 1} must have a valid period ID`,
                path: [...variantPath, "rentalPrices", rpIndex, "periodId"],
              });
            }
            if (rp.price < 0) {
              ctx.addIssue({
                code: "custom",
                message: `Variant ${variantNum}: Rental price ${rpIndex + 1} must be 0 or greater`,
                path: [...variantPath, "rentalPrices", rpIndex, "price"],
              });
            }
          });

          const periodIds = variant.rentalPrices.map((rp) => rp.periodId);
          const uniquePeriodIds = new Set(periodIds);
          if (periodIds.length !== uniquePeriodIds.size) {
            ctx.addIssue({
              code: "custom",
              message: `Variant ${variantNum}: Each rental period can only be set once`,
              path: [...variantPath, "rentalPrices"],
            });
          }
        }

        if (variant.attributeValues && variant.attributeValues.length > 0) {
          variant.attributeValues.forEach((attrVal, attrIndex) => {
            if (!attrVal.attributeId || attrVal.attributeId <= 0) {
              ctx.addIssue({
                code: "custom",
                message: `Variant ${variantNum}: Attribute ${attrIndex + 1} ID is required`,
                path: [...variantPath, "attributeValues", attrIndex, "attributeId"],
              });
            }
            if (!attrVal.attributeValueId || attrVal.attributeValueId <= 0) {
              ctx.addIssue({
                code: "custom",
                message: `Variant ${variantNum}: Attribute ${attrIndex + 1} value ID is required`,
                path: [...variantPath, "attributeValues", attrIndex, "attributeValueId"],
              });
            }
          });
        }
      });

      if (data.selectedAttributes && data.selectedAttributes.length > 0) {
        const selectedAttrIds = new Set(data.selectedAttributes);
        data.variants.forEach((variant, variantIndex) => {
          if (variant.attributeValues && variant.attributeValues.length > 0) {
            variant.attributeValues.forEach((attrVal) => {
              if (!selectedAttrIds.has(attrVal.attributeId)) {
                ctx.addIssue({
                  code: "custom",
                  message: `Variant ${variantIndex + 1}: Attribute ID ${attrVal.attributeId} is not in selected attributes`,
                  path: ["variants", variantIndex, "attributeValues"],
                });
              }
            });
          }
        });
      }
    }
  });

export type ProductFormValues = z.infer<typeof ProductSchema>;
