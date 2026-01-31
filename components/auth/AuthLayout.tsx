import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual Section (Fixed) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-between text-white fixed left-0 top-0 bottom-0">
        <div>
          <h1 className="text-4xl font-bold mb-4">Welcome to RentEase</h1>
          <p className="text-lg text-blue-100 leading-relaxed">
            Join our platform to rent products seamlessly or grow your business by listing your inventory.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Quick & Easy Setup</h3>
              <p className="text-sm text-blue-100 leading-relaxed">
                Get started in minutes with our streamlined registration process
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Trusted Community</h3>
              <p className="text-sm text-blue-100 leading-relaxed">
                Join thousands of satisfied customers and verified vendors
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Secure & Reliable</h3>
              <p className="text-sm text-blue-100 leading-relaxed">
                Your data is protected with enterprise-grade encryption
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-blue-100">
          © 2024 RentEase. All rights reserved.
        </p>
      </div>

      {/* Right Side - Form Section (Scrollable) */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen p-8 lg:p-12">
          <div className="max-w-xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}