import z from "zod";

export const step1Schema = z.object({
  userType: z.enum(["CUSTOMER", "VENDOR"], {
    required_error: "Please select an account type to continue",
  }),
});

export const step2CustomerSchema = z
  .object({
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
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const step2VendorSchema = z
  .object({
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
        "Invalid GSTIN format. Please enter a valid 15-character GSTIN",
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
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2CustomerData = z.infer<typeof step2CustomerSchema>;
export type Step2VendorData = z.infer<typeof step2VendorSchema>;
