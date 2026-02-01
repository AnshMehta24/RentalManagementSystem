"use client";

import { JSX, useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema, type ProductFormValues } from "@/schema/product";
import { RHFTextInput, RHFTextarea, RHFCheckbox } from "@/components/rhf";
import {
  createProduct,
  uploadProductImage,
  getRentalPeriods,
  getVendor,
  getAttributes,
} from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Settings,
  Package,
  AlertCircle,
  IndianRupeeIcon,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { ColorPicker, VariantConfigModal } from "@/components/product";
import type { AttributeDisplayType } from "@/generated/prisma/enums";

type Attribute = {
  id: number;
  name: string;
  displayType: AttributeDisplayType;
  values: Array<{ id: number; value: string; extraPrice: number }>;
};

export default function NewProductPage(): JSX.Element {
  const router = useRouter();
  const [rentalPeriods, setRentalPeriods] = useState<
    Array<{ id: number; name: string; unit: string }>
  >([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState<{
    name: string;
    email: string;
    companyName: string | null;
    companyLogo: string | null;
    gstin: string | null;
  } | null>(null);
  const [variantConfigModal, setVariantConfigModal] = useState<{
    isOpen: boolean;
    variantKey: string | null;
    initialData?: {
      sku?: string;
      quantity: number;
      costPrice: number;
      salePrice: number;
      rentalPrices: Array<{ periodId: number; price: number }>;
    };
  }>({ isOpen: false, variantKey: null });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
    unregister,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    mode: "onSubmit",
    shouldUnregister: true,
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      isRentable: true,
      published: true,
      variantMode: "default",
      selectedAttributes: [],
      variants: [],
    },
  });

  console.log(errors);

  const variantMode = watch("variantMode");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selectedAttributes = watch("selectedAttributes") || [];
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<
    Record<number, number[]>
  >({});
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (variantMode === "default") {
      unregister("variants");
      unregister("selectedAttributes");

      setSelectedAttributeValues({});
      setValue("defaultVariant", {
        sku: "",
        quantity: 0,
        costPrice: 0,
        salePrice: 0,
        rentalPrices: rentalPeriods.map((p) => ({
          periodId: p.id,
          price: 0,
        })),
      });

      clearErrors();
    }

    if (variantMode === "variants") {
      unregister("defaultVariant");

      setValue("variants", []);
      setValue("selectedAttributes", []);
      clearErrors();
    }
  }, [variantMode, rentalPeriods, unregister, setValue, clearErrors]);

  useEffect(() => {
    Promise.all([getRentalPeriods(), getVendor(), getAttributes()]).then(
      ([periodsResult, vendorResult, attributesResult]) => {
        if (periodsResult.success && periodsResult.data) {
          setRentalPeriods(periodsResult.data);
          const periods = periodsResult.data.map((p) => ({
            periodId: p.id,
            price: 0,
          }));
          setValue("defaultVariant.rentalPrices", periods);
        }
        if (vendorResult.success && vendorResult.data) {
          setVendorData(vendorResult.data);
        }
        if (attributesResult.success && attributesResult.data) {
          setAttributes(attributesResult.data);
        }
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedAttributesMemo = useMemo(
    () => selectedAttributes || [],
    [selectedAttributes],
  );

  const variantCombinations = useMemo(() => {
    if (variantMode !== "variants" || selectedAttributesMemo.length === 0) {
      return [];
    }

    const selectedAttrs = attributes.filter((attr) =>
      selectedAttributesMemo.includes(attr.id),
    );
    if (selectedAttrs.length === 0) return [];

    const combinations: Array<
      Array<{ attributeId: number; attributeValueId: number }>
    > = [];

    function generateCombinations(
      attrs: Attribute[],
      current: Array<{ attributeId: number; attributeValueId: number }>,
      attrIndex: number,
    ) {
      if (attrIndex === attrs.length) {
        combinations.push([...current]);
        return;
      }

      const attr = attrs[attrIndex];
      const selectedValues = selectedAttributeValues[attr.id] || [];

      if (selectedValues.length === 0) {
        generateCombinations(attrs, current, attrIndex + 1);
      } else {
        selectedValues.forEach((valueId: number) => {
          generateCombinations(
            attrs,
            [...current, { attributeId: attr.id, attributeValueId: valueId }],
            attrIndex + 1,
          );
        });
      }
    }

    generateCombinations(selectedAttrs, [], 0);
    return combinations;
  }, [
    variantMode,
    selectedAttributesMemo,
    attributes,
    selectedAttributeValues,
  ]);

  useEffect(() => {
    if (variantMode === "variants" && variantCombinations.length > 0) {
      const currentVariants = watch("variants") || [];
      const newVariants = variantCombinations.map((combo) => {
        const existing = currentVariants.find((v) => {
          if (!v.attributeValues || v.attributeValues.length !== combo.length)
            return false;
          return combo.every((c) =>
            v.attributeValues?.some(
              (av) =>
                av.attributeId === c.attributeId &&
                av.attributeValueId === c.attributeValueId,
            ),
          );
        });

        if (existing) return existing;

        return {
          sku: "",
          quantity: 0,
          costPrice: 0,
          salePrice: 0,
          attributeValues: combo,
          rentalPrices: rentalPeriods.map((p) => ({
            periodId: p.id,
            price: 0,
          })),
        };
      });

      setValue("variants", newVariants);
    }
  }, [variantCombinations, variantMode, rentalPeriods, watch, setValue]);

  const toggleAttribute = (attributeId: number) => {
    const current = selectedAttributes || [];
    if (current.includes(attributeId)) {
      setValue(
        "selectedAttributes",
        current.filter((id) => id !== attributeId),
      );
      const newValues = { ...selectedAttributeValues };
      delete newValues[attributeId];
      setSelectedAttributeValues(newValues);
    } else {
      setValue("selectedAttributes", [...current, attributeId]);
    }
  };

  const toggleAttributeValue = (attributeId: number, valueId: number) => {
    const currentValues = selectedAttributeValues[attributeId] || [];
    if (currentValues.includes(valueId)) {
      setSelectedAttributeValues({
        ...selectedAttributeValues,
        [attributeId]: currentValues.filter((id: number) => id !== valueId),
      });
    } else {
      setSelectedAttributeValues({
        ...selectedAttributeValues,
        [attributeId]: [...currentValues, valueId],
      });
    }
  };

  const getVariantLabel = (
    variant: NonNullable<ProductFormValues["variants"]>[0] | undefined,
  ) => {
    if (!variant?.attributeValues || variant.attributeValues.length === 0) {
      return "Default";
    }

    return variant.attributeValues
      .map((av) => {
        const attr = attributes.find((a) => a.id === av.attributeId);
        const value = attr?.values.find((v) => v.id === av.attributeValueId);
        return value?.value || "Unknown";
      })
      .join(" / ");
  };

  const openVariantConfig = (
    variant: NonNullable<ProductFormValues["variants"]>[0],
    index: number,
  ) => {
    setVariantConfigModal({
      isOpen: true,
      variantKey: `variant-${index}`,
      initialData: {
        sku: variant.sku,
        quantity: variant.quantity,
        costPrice: variant.costPrice,
        salePrice: variant.salePrice,
        rentalPrices: variant.rentalPrices,
      },
    });
  };

  const saveVariantConfig = (data: {
    sku?: string;
    quantity: number;
    costPrice: number;
    salePrice: number;
    rentalPrices: Array<{ periodId: number; price: number }>;
  }) => {
    const currentVariants = watch("variants") || [];
    const variantIndex = parseInt(
      variantConfigModal.variantKey?.split("-")[1] || "0",
    );
    const updated = [...currentVariants];
    if (updated[variantIndex]) {
      updated[variantIndex] = { ...updated[variantIndex], ...data };
      setValue("variants", updated);
    }
  };

  const openDefaultVariantConfig = () => {
    const defaultVariant = watch("defaultVariant");
    if (defaultVariant) {
      setVariantConfigModal({
        isOpen: true,
        variantKey: "default",
        initialData: {
          sku: defaultVariant.sku,
          quantity: defaultVariant.quantity,
          costPrice: defaultVariant.costPrice,
          salePrice: defaultVariant.salePrice,
          rentalPrices: defaultVariant.rentalPrices,
        },
      });
    }
  };

  const saveDefaultVariantConfig = (data: {
    sku?: string;
    quantity: number;
    costPrice: number;
    salePrice: number;
    rentalPrices: Array<{ periodId: number; price: number }>;
  }) => {
    setValue("defaultVariant", data);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      const result = await createProduct(data);
      if (result.success) {
        toast.success("Product created successfully");
        router.push("/vendor/products");
      } else {
        toast.error(result.error || "Failed to create product");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const watchedVariants = watch("variants") || [];
  const watchedDefaultVariant = watch("defaultVariant");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Add a new product to your catalog
          </p>
          {vendorData && (
            <p className="text-sm text-gray-600 mt-2">
              Vendor: {vendorData.companyName || vendorData.name}
              {vendorData.gstin && ` • GSTIN: ${vendorData.gstin}`}
            </p>
          )}
        </div>
        <Link
          href="/vendor/products"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Product Information
                </h2>
              </div>

              <RHFTextInput
                name="name"
                control={control}
                label="Product Name *"
                placeholder="e.g., Professional DSLR Camera"
                error={errors.name?.message}
              />

              <RHFTextarea
                name="description"
                control={control}
                label="Description"
                placeholder="Describe your product..."
                error={errors.description?.message}
                rows={6}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Product Image
                </label>
                <div className="flex items-start gap-4">
                  <div className="relative w-40 h-40 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {watch("imageUrl") ? (
                      <>
                        <img
                          src={watch("imageUrl")}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                        {imageUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setValue("imageUrl", "")}
                          disabled={imageUploading}
                          className="absolute top-1 right-1 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-700">
                        {imageUploading ? (
                          <Loader2 className="w-10 h-10 animate-spin mb-1" />
                        ) : (
                          <ImagePlus className="w-10 h-10 mb-1" />
                        )}
                        <span className="text-xs text-center px-2">
                          {imageUploading ? "Uploading…" : "Click to upload"}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={imageUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setImageUploading(true);
                            try {
                              const fd = new FormData();
                              fd.append("image", file);
                              const result = await uploadProductImage(fd);
                              if (result.success && result.url) {
                                setValue("imageUrl", result.url);
                              } else {
                                toast.error(result.error || "Upload failed");
                              }
                            } catch {
                              toast.error("Upload failed");
                            } finally {
                              setImageUploading(false);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 max-w-[200px]">
                    JPEG, PNG, WebP or GIF. Max 5MB.
                  </p>
                </div>
                {errors.imageUrl?.message && (
                  <p className="text-sm text-red-600">
                    {errors.imageUrl.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <RHFCheckbox
                  name="isRentable"
                  control={control}
                  label="Product is rentable"
                  error={errors.isRentable?.message}
                />

                <RHFCheckbox
                  name="published"
                  control={control}
                  label="Publish product"
                  error={errors.published?.message}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Variants
                </h2>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">
                  Variant Mode *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setValue("variantMode", "default")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      variantMode === "default"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="font-medium mb-1 text-gray-900">
                      Default Variant
                    </div>
                    <div className="text-sm text-gray-600">
                      Single product with no variations
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("variantMode", "variants")}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      variantMode === "variants"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="font-medium mb-1 text-gray-900">
                      Multiple Variants
                    </div>
                    <div className="text-sm text-gray-600">
                      Product with different options (Color, Size, etc.)
                    </div>
                  </button>
                </div>
                {errors.variantMode && (
                  <span className="text-xs text-red-600">
                    {errors.variantMode.message}
                  </span>
                )}
              </div>

              {variantMode === "variants" && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="text-sm font-medium text-gray-900 mb-3 block">
                      Select Attributes *
                    </label>
                    <p className="text-xs text-gray-600 mb-4">
                      Choose which attributes this product will have (e.g.,
                      Color, Size)
                    </p>
                    <div className="space-y-4">
                      {attributes.map((attr) => {
                        const isSelected = selectedAttributes.includes(attr.id);
                        const selectedValues =
                          selectedAttributeValues[attr.id] || [];

                        return (
                          <div
                            key={attr.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isSelected
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <label className="font-medium text-gray-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAttribute(attr.id)}
                                  className="mr-2"
                                />
                                {attr.name}
                              </label>
                              <span className="text-xs text-gray-600">
                                {attr.displayType}
                              </span>
                            </div>

                            {isSelected && (
                              <div className="mt-3 space-y-2">
                                {attr.displayType === "IMAGE" &&
                                attr.name.toLowerCase() === "color" ? (
                                  <ColorPicker
                                    colors={attr.values.map((v) => ({
                                      id: v.id,
                                      value: v.value,
                                    }))}
                                    selectedColorIds={selectedValues}
                                    onSelect={(id) =>
                                      toggleAttributeValue(attr.id, id)
                                    }
                                    onDeselect={(id) =>
                                      toggleAttributeValue(attr.id, id)
                                    }
                                  />
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {attr.values.map((value) => {
                                      const isValueSelected =
                                        selectedValues.includes(value.id);
                                      return (
                                        <button
                                          key={value.id}
                                          type="button"
                                          onClick={() =>
                                            toggleAttributeValue(
                                              attr.id,
                                              value.id,
                                            )
                                          }
                                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                            isValueSelected
                                              ? "bg-blue-600 text-white"
                                              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                          }`}
                                        >
                                          {value.value}
                                          {value.extraPrice > 0 && (
                                            <span className="ml-1 text-xs opacity-90">
                                              (+₹{value.extraPrice})
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                                {selectedValues.length === 0 && (
                                  <p className="text-xs text-gray-600">
                                    Select at least one value for {attr.name}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {attributes.length === 0 && (
                        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-center">
                          <p className="text-sm text-gray-600">
                            No attributes available. Contact admin to add
                            attributes.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {variantMode === "variants" && watchedVariants.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      ₹ Variants ({watchedVariants.length})
                    </h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {watchedVariants.map((variant, index) => {
                    const label = getVariantLabel(variant);
                    const variantErrors = errors.variants?.[index];
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          variantErrors ? "border-red-300" : "border-gray-200"
                        } bg-gray-50 hover:border-blue-300 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {label}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Qty: {variant.quantity || 0} • Cost: ₹
                              {variant.costPrice || 0} • Sale: ₹
                              {variant.salePrice || 0}
                            </div>
                            {variantErrors && (
                              <div className="mt-2 space-y-1">
                                {variantErrors.quantity?.root?.message && (
                                  <p className="text-xs text-red-600">
                                    {
                                      variantErrors.quantity.root
                                        .message as string
                                    }
                                  </p>
                                )}
                                {variantErrors.costPrice?.root?.message && (
                                  <p className="text-xs text-red-600">
                                    {
                                      variantErrors.costPrice.root
                                        .message as string
                                    }
                                  </p>
                                )}
                                {variantErrors.salePrice?.root?.message && (
                                  <p className="text-xs text-red-600">
                                    {
                                      variantErrors.salePrice.root
                                        .message as string
                                    }
                                  </p>
                                )}
                                {variantErrors.rentalPrices?.root?.message && (
                                  <p className="text-xs text-red-600">
                                    {
                                      variantErrors.rentalPrices.root
                                        .message as string
                                    }
                                  </p>
                                )}
                                {variantErrors.attributeValues?.root
                                  ?.message && (
                                  <p className="text-xs text-destructive">
                                    {
                                      variantErrors.attributeValues.root
                                        .message as string
                                    }
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openVariantConfig(variant, index)}
                            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ml-4"
                          >
                            Configure
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {errors.variants && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <span className="text-xs text-red-700 font-medium">
                      {errors.variants.message as string}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Default Variant Display */}
            {variantMode === "default" && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupeeIcon className="h-5 w-5 text-gray-500" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Pricing & Inventory
                    </h2>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border ${
                    errors.defaultVariant ? "border-red-300" : "border-gray-200"
                  } bg-gray-50`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Default Variant
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Qty: {watchedDefaultVariant?.quantity || 0} • Cost: ₹
                        {watchedDefaultVariant?.costPrice || 0} • Sale: ₹
                        {watchedDefaultVariant?.salePrice || 0}
                      </div>
                      {errors.defaultVariant && (
                        <div className="mt-2 space-y-1">
                          {errors.defaultVariant.quantity && (
                            <p className="text-xs text-red-600">
                              {errors.defaultVariant.quantity.message as string}
                            </p>
                          )}
                          {errors.defaultVariant.costPrice && (
                            <p className="text-xs text-red-600">
                              {
                                errors.defaultVariant.costPrice
                                  .message as string
                              }
                            </p>
                          )}
                          {errors.defaultVariant.salePrice && (
                            <p className="text-xs text-red-600">
                              {
                                errors.defaultVariant.salePrice
                                  .message as string
                              }
                            </p>
                          )}
                          {errors.defaultVariant.rentalPrices && (
                            <p className="text-xs text-red-600">
                              {
                                errors.defaultVariant.rentalPrices
                                  .message as string
                              }
                            </p>
                          )}
                          {typeof errors.defaultVariant.message ===
                            "string" && (
                            <p className="text-xs text-red-600">
                              {errors.defaultVariant.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={openDefaultVariantConfig}
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ml-4"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Product Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Published</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        watch("published")
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {watch("published") ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Rentable</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        watch("isRentable")
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {watch("isRentable") ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {loading ? "Creating..." : "Create Product"}
                </button>
                <Link
                  href="/vendor/products"
                  className="w-full text-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>

      <VariantConfigModal
        isOpen={variantConfigModal.isOpen}
        onClose={() =>
          setVariantConfigModal({ isOpen: false, variantKey: null })
        }
        onSave={
          variantConfigModal.variantKey === "default"
            ? saveDefaultVariantConfig
            : saveVariantConfig
        }
        initialData={variantConfigModal.initialData}
        rentalPeriods={rentalPeriods}
        variantLabel={
          variantConfigModal.variantKey === "default"
            ? "Default Variant"
            : variantConfigModal.variantKey
              ? getVariantLabel(
                  watchedVariants[
                    parseInt(variantConfigModal.variantKey.split("-")[1] || "0")
                  ] as
                    | NonNullable<ProductFormValues["variants"]>[0]
                    | undefined,
                )
              : "Variant"
        }
      />
    </div>
  );
}
