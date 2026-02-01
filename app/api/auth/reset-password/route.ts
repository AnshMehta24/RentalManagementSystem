import { NextResponse } from "next/server";
import crypto from "crypto";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "Bait_home_assistant",
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    let decoded;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      decoded = payload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired reset token. Please request a new one.",
        },
        { status: 400 },
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(decoded.jti as string)
      .digest("hex");

    const storedToken = await prisma.userToken.findFirst({
      where: {
        userId: decoded.userId as number,
        purpose: "password-reset",
        tokenHash,
        expiresAt: {
          gt: new Date(), 
        },
      },
    });

    if (!storedToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired reset token. Please request a new one.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: decoded.userId as number },
      data: { password: hashedPassword },
    });

    await prisma.userToken.deleteMany({
      where: {
        userId: decoded.userId as number,
        purpose: "password-reset",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password has been reset successfully. You can now login.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
