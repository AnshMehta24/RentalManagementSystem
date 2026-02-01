"use server";

import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { prisma } from "@/lib/prisma";

export type CustomerProfile = {
  id: number;
  name: string;
  email: string;
  profileLogo: string | null;
  createdAt: Date;
  addresses: {
    id: number;
    type: string;
    name: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    country: string;
    pincode: string;
    isDefault: boolean;
  }[];
};

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CUSTOMER") return null;

  const customerId = typeof user.id === "number" ? user.id : parseInt(String(user.id), 10);
  const profile = await prisma.user.findUnique({
    where: { id: customerId, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      profileLogo: true,
      createdAt: true,
      addresses: {
        orderBy: [{ isDefault: "desc" }, { id: "asc" }],
        select: {
          id: true,
          type: true,
          name: true,
          line1: true,
          line2: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          isDefault: true,
        },
      },
    },
  });

  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    profileLogo: profile.profileLogo,
    createdAt: profile.createdAt,
    addresses: profile.addresses.map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      country: a.country,
      pincode: a.pincode,
      isDefault: a.isDefault,
    })),
  };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CUSTOMER") {
      return { success: false, error: "Unauthorized" };
    }

    const customerId = typeof user.id === "number" ? user.id : parseInt(String(user.id), 10);
    const dbUser = await prisma.user.findUnique({
      where: { id: customerId, role: "CUSTOMER" },
      select: { password: true },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) {
      return { success: false, error: "Current password is incorrect" };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters" };
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: customerId },
      data: { password: hashed },
    });

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to change password",
    };
  }
}
