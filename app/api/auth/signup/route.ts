import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { prisma } from "@/lib/prisma";

const customerSignUpSchema = z
  .object({
    userType: z.literal("CUSTOMER"),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name should contain only letters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name should contain only letters"),
    email: z
      .string()
      .min(1, "Email address is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const vendorSignUpSchema = z
  .object({
    userType: z.literal("VENDOR"),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name should contain only letters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must not exceed 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name should contain only letters"),
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name must not exceed 100 characters"),
    category: z.string().min(1, "Please select a business category"),
    gstin: z
      .string()
      .length(15, "GSTIN must be exactly 15 characters")
      .regex(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        "Invalid GSTIN format. Please enter a valid 15-character GSTIN"
      ),
    email: z
      .string()
      .min(1, "Email address is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const signUpSchema = z.discriminatedUnion("userType", [
  customerSignUpSchema,
  vendorSignUpSchema,
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = {
      ...signUpSchema.parse(body),
      email: body.email.toLowerCase(),
    };

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 400 }
      );
    }

    if (validated.userType === "VENDOR") {
      const existingGstin = await prisma.user.findFirst({
        where: { 
          gstin: validated.gstin.toUpperCase(),
          role: "VENDOR"
        },
      });

      if (existingGstin) {
        return NextResponse.json(
          { error: "This GSTIN is already registered. Each business must have a unique GSTIN" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: `${validated.firstName} ${validated.lastName}`,
        email: validated.email,
        password: hashedPassword,
        role: validated.userType,
        companyName: validated.userType === "VENDOR" ? validated.companyName : null,
        gstin: validated.userType === "VENDOR" ? validated.gstin.toUpperCase() : null,
    
      },
    });

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
        userType: user.role,
        message: "Account created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again" },
      { status: 500 }
    );
  }
}