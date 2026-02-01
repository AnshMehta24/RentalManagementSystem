import { NextResponse } from "next/server";
import crypto from "crypto";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { transporter } from "@/lib/email";
import { getPasswordResetTemplate } from "@/lib/email/templates";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "Bait_home_assistant",
);

async function sendPasswordResetEmail({
  toEmail,
  name,
  resetUrl,
}: {
  toEmail: string;
  name?: string | null;
  resetUrl: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.MAIL_AUTH_USER,
    to: toEmail,
    subject: `Reset your password – ${process.env.APP_NAME || "Rental Management"}`,
    html: getPasswordResetTemplate({
      name,
      resetUrl,
      expiryMinutes: 60,
    }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: { email: ["Invalid request body"] } },
        { status: 400 },
      );
    }

    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    console.log(email, "EMAIL");

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account exists with this email, a password reset link has been sent.",
        },
        { status: 200 },
      );
    }

    await prisma.userToken.deleteMany({
      where: {
        userId: user.id,
        purpose: "password-reset",
      },
    });

    const EXPIRY_MS = 60 * 60 * 1000;
    const jti = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + EXPIRY_MS);

    const jwtToken = await new SignJWT({
      userId: user.id,
      purpose: "password-reset",
      jti,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + EXPIRY_MS / 1000)
      .sign(JWT_SECRET);

    const tokenHash = crypto.createHash("sha256").update(jti).digest("hex");

    await prisma.userToken.create({
      data: {
        userId: user.id,
        userType: "user",
        purpose: "password-reset",
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    const resetPath = "/reset-password";
    const resetUrl = `${baseUrl}${resetPath}?token=${encodeURIComponent(jwtToken)}`;

    try {
      await sendPasswordResetEmail({
        toEmail: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
