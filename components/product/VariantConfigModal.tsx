"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { RHFNumberInput, RHFTextInput } from "@/components/rhf";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const VariantConfigSchema = z.object({
  sku: z.string().optional(),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
  costPrice: z.number().min(0, "Cost price must be 0 or greater"),
  salePrice: z.number().min(0, "Sale price must be 0 or greater"),
  rentalPrices: z
    .array(
      z.object({
        periodId: z.number().int().positive(),
        price: z.number().min(0.01, "Price must be greater than 0"),
      }),
    )
    .min(1, "At least one rental price is required"),
});

type VariantConfigFormValues = z.infer<typeof VariantConfigSchema>;

interface VariantConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VariantConfigFormValues) => void;
  initialData?: VariantConfigFormValues;
  rentalPeriods: Array<{ id: number; name: string; unit: string }>;
  variantLabel: string;
}

export function VariantConfigModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  rentalPeriods,
  variantLabel,
}: VariantConfigModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<VariantConfigFormValues>({
    resolver: zodResolver(VariantConfigSchema),
    defaultValues: initialData || {
      sku: "",
      quantity: 0,
      costPrice: 0,
      salePrice: 0,
      rentalPrices: rentalPeriods.map((p) => ({ periodId: p.id, price: 0 })),
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset(initialData);
    } else if (isOpen && !initialData) {
      reset({
        sku: "",
        quantity: 0,
        costPrice: 0,
        salePrice: 0,
        rentalPrices: rentalPeriods.map((p) => ({ periodId: p.id, price: 0 })),
      });
    }
  }, [isOpen, initialData, reset, rentalPeriods]);

  if (!isOpen) return null;

  const onSubmit = (data: VariantConfigFormValues) => {
    onSave(data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Configure Variant: {variantLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 hover:bg-accent transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            <RHFTextInput
              name="sku"
              control={control}
              label="SKU (Optional)"
              placeholder="Enter SKU"
              error={errors.sku?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <RHFNumberInput
                name="quantity"
                control={control}
                label="Quantity *"
                min={0}
                error={errors.quantity?.message}
              />

              <RHFNumberInput
                name="costPrice"
                control={control}
                label="Cost Price (₹) *"
                min={0}
                step="0.01"
                error={errors.costPrice?.message}
              />
            </div>

            <RHFNumberInput
              name="salePrice"
              control={control}
              label="Sale Price (₹) *"
              min={0}
              step="0.01"
              error={errors.salePrice?.message}
            />
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Rental Prices *
              </label>
              <p className="text-xs text-muted-foreground mb-4">
                Set rental prices for different time periods. At least one price
                must be greater than 0.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {rentalPeriods.map((period) => {
                  const currentPrices = watch("rentalPrices") || [];
                  let priceIndex = currentPrices.findIndex(
                    (rp) => rp.periodId === period.id,
                  );

                  if (priceIndex === -1) {
                    const newPrices = [
                      ...currentPrices,
                      { periodId: period.id, price: 0 },
                    ];
                    setValue("rentalPrices", newPrices);
                    priceIndex = currentPrices.length;
                  }

                  return (
                    <RHFNumberInput
                      key={period.id}
                      name={`rentalPrices.${priceIndex}.price` as const}
                      control={control}
                      label={`${period.name} (₹)`}
                      min={0}
                      step="0.01"
                      error={
                        errors.rentalPrices?.[priceIndex]?.price?.message ||
                        errors.rentalPrices?.message
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Save Variant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
