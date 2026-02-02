"use client";

import { JSX } from "react";
import {
  ArrowRight,
  ShoppingCart, 
  Package,
  CreditCard,
  Shield,
  Zap,
  BarChart3,
  Clock,
  Sparkles,
} from "lucide-react";

export default function Home(): JSX.Element {
  const features = [
    {
      icon: Package,
      title: "Smart Inventory",
      description:
        "Real-time stock tracking with intelligent reservation system",
    },
    {
      icon: CreditCard,
      title: "Flexible Payments",
      description: "Partial payments, deposits, and secure online transactions",
    },
    {
      icon: Clock,
      title: "Time-Based Pricing",
      description: "Hourly, daily, weekly, or custom rental periods",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive insights into your rental business",
    },
    {
      icon: Shield,
      title: "Prevent Overbooking",
      description: "Advanced reservation logic keeps your rentals organized",
    },
    {
      icon: Zap,
      title: "Automated Workflows",
      description: "From quotation to return, everything flows seamlessly",
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "50K+", label: "Rentals/Month" },
    { value: "24/7", label: "Support" },
    { value: "100+", label: "Businesses" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 text-slate-900 font-sans overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <header className="relative z-10 border-b border-blue-200 bg-white/80 backdrop-blur-xl">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">
                  RentalPro
                </h1>
                <p className="text-xs text-slate-600">Rental Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-700 transition-colors"
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Get Started
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-blue-100 border border-blue-300 rounded-full backdrop-blur-sm animate-fade-in">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">
              Complete Rental Management Solution
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight animate-slide-up">
            <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
              Rent Smarter,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
              Grow Faster
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-700 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-delay">
            End-to-end rental management platform for modern businesses.
            Automate quotations, track inventory, process payments, and scale
            your rental operations effortlessly.
          </p>

          {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-delay-2">
            <a
              href="/signup"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transform flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/demo"
              className="px-8 py-4 bg-white border-2 border-blue-300 rounded-xl font-semibold text-lg text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all"
            >
              View Demo
            </a>
          </div> */}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-fade-in-delay-3">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white border border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 transform"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to streamline your rental operations
              and delight your customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white border border-blue-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 transform hover:border-blue-400"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 container mx-auto px-6 py-24 bg-gradient-to-b from-transparent via-blue-50/50 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              Simple{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Workflow
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              From quotation to return, manage your entire rental lifecycle
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-12 left-12 right-12 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 hidden lg:block" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Quotation",
                  desc: "Customer browses and creates rental quote",
                },
                {
                  step: "02",
                  title: "Order",
                  desc: "Confirm and reserve inventory automatically",
                },
                {
                  step: "03",
                  title: "Payment",
                  desc: "Secure payment with flexible options",
                },
                {
                  step: "04",
                  title: "Return",
                  desc: "Track delivery, pickup, and returns",
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-white border border-blue-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mb-6 text-white font-bold text-lg relative z-10 shadow-lg shadow-blue-500/30">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-24 mb-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 md:p-16 text-center shadow-2xl shadow-blue-500/30">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Transform Your{" "}
            <span className="text-blue-100">Rental Business?</span>
          </h2>
          <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses already managing their rentals smarter
            with RentalPro
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="group px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/contact"
              className="px-8 py-4 text-lg font-semibold text-white hover:text-blue-100 transition-colors border-2 border-white/30 hover:border-white/50 rounded-xl"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-blue-200 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent">
                  RentalPro
                </h3>
              </div>
              <p className="text-slate-600 text-sm">
                Modern rental management for modern businesses
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-slate-900">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-blue-700 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-slate-900">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-blue-700 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-slate-900">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>
                  <a href="#" className="hover:text-blue-700 transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-700 transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-200 pt-8 text-center text-sm text-slate-600">
            <p>© 2024 RentalPro. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-fade-in-delay {
          opacity: 0;
          animation: fade-in 0.8s ease-out 0.2s forwards;
        }

        .animate-fade-in-delay-2 {
          opacity: 0;
          animation: fade-in 0.8s ease-out 0.4s forwards;
        }

        .animate-fade-in-delay-3 {
          opacity: 0;
          animation: fade-in 0.8s ease-out 0.6s forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
}
