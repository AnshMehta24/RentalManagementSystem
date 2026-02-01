"use server";

import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";
import type { DeliveryChargeType } from "@/generated/prisma/enums";
import s3Service from "@/lib/aws";
import { revalidatePath } from "next/cache";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB for profile

export type VendorProfile = {
  id: number;
  name: string;
  email: string;
  profileLogo: string | null;
  companyName: string | null;
  companyLogo: string | null;
  gstin: string | null;
  createdAt: Date;
};

export type VendorDeliveryConfigRecord = {
  id: number;
  isDeliveryEnabled: boolean;
  chargeType: DeliveryChargeType;
  flatCharge: number | null;
  ratePerKm: number | null;
  freeAboveAmount: number | null;
  maxDeliveryKm: number | null;
};

export async function getVendorProfile(): Promise<VendorProfile | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") return null;

  const vendorId = typeof user.id === "number" ? user.id : parseInt(String(user.id), 10);
  const profile = await prisma.user.findUnique({
    where: { id: vendorId, role: "VENDOR" },
    select: {
      id: true,
      name: true,
      email: true,
      profileLogo: true,
      companyName: true,
      companyLogo: true,
      gstin: true,
      createdAt: true,
    },
  });

  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    profileLogo: profile.profileLogo,
    companyName: profile.companyName,
    companyLogo: profile.companyLogo,
    gstin: profile.gstin,
    createdAt: profile.createdAt,
  };
}

export async function getVendorDeliveryConfig(): Promise<VendorDeliveryConfigRecord | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENDOR") return null;

  const vendorId = typeof user.id === "number" ? user.id : parseInt(String(user.id), 10);
  const config = await prisma.vendorDeliveryConfig.findUnique({
    where: { vendorId },
  });

  if (!config) return null;

  return {
    id: config.id,
    isDeliveryEnabled: config.isDeliveryEnabled,
    chargeType: config.chargeType as DeliveryChargeType,
    flatCharge: config.flatCharge,
    ratePerKm: config.ratePerKm,
    freeAboveAmount: config.freeAboveAmount,
    maxDeliveryKm: config.maxDeliveryKm,
  };
}

export type UpdateDeliveryConfigInput = {
  isDeliveryEnabled: boolean;
  chargeType: DeliveryChargeType;
  flatCharge?: number | null;
  ratePerKm?: number | null;
  freeAboveAmount?: number | null;
  maxDeliveryKm?: number | null;
};

export async function updateVendorDeliveryConfig(
  data: UpdateDeliveryConfigInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "VENDOR") {
      return { success: false, error: "Unauthorized" };
    }

    const vendorId = typeof user.id === "number" ? user.id : parseInt(String(user.id), 10);

    const payload = {
      isDeliveryEnabled: data.isDeliveryEnabled,
      chargeType: data.chargeType,
      flatCharge: data.flatCharge ?? null,
      ratePerKm: data.ratePerKm ?? null,
      freeAboveAmount: data.freeAboveAmount ?? null,
      maxDeliveryKm: data.maxDeliveryKm ?? null,
    };

    await prisma.vendorDeliveryConfig.upsert({
      where: { vendorId },
      create: { vendorId, ...payload },
      update: payload,
    });

    return { success: true };
  } catch (e) {
    console.error("updateVendorDeliveryConfig error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update delivery config",
    };
  }
}

export async function uploadVendorProfileImage(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "VENDOR") {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("image") as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "No image file provided" };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Use JPEG, PNG, WebP or GIF.",
      };
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: "Image must be 2MB or smaller." };
    }

    const vendorId = typeof user.id === "number" ? user.id : parseInt(String(user.id), 10);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const key = `profile/vendor/${vendorId}/${Date.now()}-avatar.${ext}`;

    await s3Service.save(file, key);
    const publicUrl = await s3Service.saveAndGetPreviewUrl(file, key);

    await prisma.user.update({
      where: { id: vendorId, role: "VENDOR" },
      data: { profileLogo: publicUrl, companyLogo: publicUrl },
    });

    revalidatePath("/vendor/settings");
    return { success: true, url: publicUrl };
  } catch (e) {
    console.error("uploadVendorProfileImage error:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to upload profile image",
    };
  }
}
