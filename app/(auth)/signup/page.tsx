"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import ProgressIndicator from "@/components/auth/ProgressIndicator";
import AuthLayout from "@/components/auth/AuthLayout";
import { Eye, EyeOff } from "lucide-react";

const step1Schema = z.object({
  userType: z.enum(["CUSTOMER", "VENDOR"], {
    required_error: "Please select an account type to continue",
  }),
});

const step2CustomerSchema = z
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
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const step2VendorSchema = z
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

type Step1Data = z.infer<typeof step1Schema>;
type Step2CustomerData = z.infer<typeof step2CustomerSchema>;
type Step2VendorData = z.infer<typeof step2VendorSchema>;

const VENDOR_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Tools & Equipment",
  "Party & Events",
  "Sports & Outdoor",
  "Photography & Video",
  "Vehicles",
  "Others",
];

export default function SignUpPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  });

  const step2CustomerForm = useForm<Step2CustomerData>({
    resolver: zodResolver(step2CustomerSchema),
  });

  const step2VendorForm = useForm<Step2VendorData>({
    resolver: zodResolver(step2VendorSchema),
  });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
    setError(null);
  };

  const onStep2CustomerSubmit = async (data: Step2CustomerData) => {
    if (!step1Data) return;

    setIsLoading(true);
    setError(null);

    const completeData = {
      ...data,
      userType: step1Data.userType,
    };

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create account. Please try again"
        );
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onStep2VendorSubmit = async (data: Step2VendorData) => {
    if (!step1Data) return;

    setIsLoading(true);
    setError(null);

    const completeData = {
      ...data,
      userType: step1Data.userType,
    };

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeData),
      });

      const result = await response.json();

      if (!response.ok) {
        // 🆕 Handle GSTIN-specific errors
        if (result.error?.includes("GSTIN")) {
          step2VendorForm.setError("gstin", {
            type: "manual",
            message: result.error,
          });
        }
        throw new Error(
          result.error || "Failed to create account. Please try again"
        );
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setCurrentStep(1);
    setError(null);
  };

  const isVendor = step1Data?.userType === "VENDOR";

  return (
    <AuthLayout>
      <div className="w-full max-w-md space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep === 1 ? "Create your account" : "Complete your profile"}
          </h2>
          <p className="text-gray-600">
            {currentStep === 1 ? (
              <>
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign in
                </a>
              </>
            ) : (
              "Fill in the details below to get started"
            )}
          </p>

          {currentStep === 2 && (
            <div className="mt-6">
              <ProgressIndicator
                currentStep={1}
                totalSteps={1}
                stepLabels={[isVendor ? "Business Details" : "Personal Details"]}
              />
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

       
        {currentStep === 1 && (
          <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select account type
              </label>
              <div className="space-y-3">
                <label
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${step1Form.watch("userType") === "CUSTOMER"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                >
                  <input
                    {...step1Form.register("userType")}
                    type="radio"
                    value="CUSTOMER"
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900">Customer</div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      Browse and rent products from vendors
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${step1Form.watch("userType") === "VENDOR"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                >
                  <input
                    {...step1Form.register("userType")}
                    type="radio"
                    value="VENDOR"
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="font-semibold text-gray-900">Vendor</div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      List your products and manage rental orders
                    </div>
                  </div>
                </label>
              </div>
              {step1Form.formState.errors.userType && (
                <p className="mt-2 text-sm text-red-600">
                  {step1Form.formState.errors.userType.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Continue
            </button>
          </form>
        )}

       
        {currentStep === 2 && !isVendor && (
          <form
            onSubmit={step2CustomerForm.handleSubmit(onStep2CustomerSubmit)}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...step2CustomerForm.register("firstName")}
                  type="text"
                  id="firstName"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="John"
                />
                {step2CustomerForm.formState.errors.firstName && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2CustomerForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...step2CustomerForm.register("lastName")}
                  type="text"
                  id="lastName"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Doe"
                />
                {step2CustomerForm.formState.errors.lastName && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2CustomerForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                {...step2CustomerForm.register("email")}
                type="email"
                id="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="john@example.com"
              />
              {step2CustomerForm.formState.errors.email && (
                <p className="mt-1.5 text-sm text-red-600">
                  {step2CustomerForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    {...step2CustomerForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                   text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {step2CustomerForm.formState.errors.password && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2CustomerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    {...step2CustomerForm.register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                   text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {step2CustomerForm.formState.errors.confirmPassword && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2CustomerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Must be 8+ characters with uppercase, lowercase, number, and special character
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={goBack}
                className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>
        )}

      
        {currentStep === 2 && isVendor && (
          <form
            onSubmit={step2VendorForm.handleSubmit(onStep2VendorSubmit)}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...step2VendorForm.register("firstName")}
                  type="text"
                  id="firstName"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="John"
                />
                {step2VendorForm.formState.errors.firstName && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2VendorForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...step2VendorForm.register("lastName")}
                  type="text"
                  id="lastName"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Doe"
                />
                {step2VendorForm.formState.errors.lastName && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2VendorForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...step2VendorForm.register("companyName")}
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Acme Inc."
                />
                {step2VendorForm.formState.errors.companyName && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2VendorForm.formState.errors.companyName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...step2VendorForm.register("category")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  <option value="">Select category</option>
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {step2VendorForm.formState.errors.category && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2VendorForm.formState.errors.category.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-1.5">
                GSTIN <span className="text-red-500">*</span>
              </label>
              <input
                {...step2VendorForm.register("gstin")}
                type="text"
                id="gstin"
                maxLength={15}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition uppercase"
                placeholder="22AAAAA0000A1Z5"
              />
              {step2VendorForm.formState.errors.gstin && (
                <p className="mt-1.5 text-sm text-red-600">
                  {step2VendorForm.formState.errors.gstin.message}
                </p>
              )}

            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                {...step2VendorForm.register("email")}
                type="email"
                id="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="john@example.com"
              />
              {step2VendorForm.formState.errors.email && (
                <p className="mt-1.5 text-sm text-red-600">
                  {step2VendorForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...step2VendorForm.register("password")}
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {step2VendorForm.formState.errors.password && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2VendorForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...step2VendorForm.register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {step2VendorForm.formState.errors.confirmPassword && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {step2VendorForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 -mt-2">
              Password must be 8+ characters with uppercase, lowercase, number, and special character
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={goBack}
                className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-gray-500 pt-2">
          By signing up, you agree to our{" "}
          <a href="/terms" className="text-blue-600 hover:text-blue-700 transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-blue-600 hover:text-blue-700 transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}