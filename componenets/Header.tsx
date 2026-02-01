"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingCart, Heart, User, Menu } from "lucide-react";
import { useAuth } from "@/app/(customer)/AuthContext";
import { getCartCount } from "@/app/(customer)/actions/cart";
import { getWishlistCount } from "@/app/(customer)/actions/wishlist";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export default function Header({
  searchQuery = "",
  onSearchChange,
  showSearch = true,
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const user = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    getCartCount()
      .then(setCartCount)
      .catch(() => setCartCount(0));
    getWishlistCount()
      .then(setWishlistCount)
      .catch(() => setWishlistCount(0));
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowMobileNav(!showMobileNav)}
                className="lg:hidden p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link
                href="/products"
                className="text-lg font-bold text-blue-600 hover:text-blue-700 shrink-0"
              >
                Rental Management
              </Link>
              <nav className="hidden lg:flex items-center gap-6">
                <Link
                  href="/products"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  Products
                </Link>
              </nav>
            </div>

            {showSearch && (
              <div className="flex-1 max-w-md mx-4 hidden sm:flex">
                <div className="flex items-center w-full rounded-lg border border-gray-200 bg-gray-50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    className="p-2.5 border-l border-gray-200 hover:bg-gray-100 transition text-gray-600"
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Link
                href="/wishlist"
                className="relative p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-700"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className="relative p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-700"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                {user ? (
                  <>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-200 hover:border-blue-500 text-gray-700 transition"
                    >
                      <User className="w-5 h-5" />
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-52 py-2 rounded-lg border border-gray-200 bg-white shadow-xl z-50">
                        <div className="px-4 py-2 text-xs text-gray-500">
                          {user.email}
                        </div>

                        <Link
                          href="/account"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          My Profile
                        </Link>

                        <Link
                          href="/orders"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          My Orders
                        </Link>

                        <hr className="my-2 border-gray-200" />

                        <Link
                          href="/api/auth/logout"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Logout
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-sm"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>

          {showSearch && (
            <div className="sm:hidden mt-3">
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-500"
                />
                <Search className="w-5 h-5 mr-3 text-gray-500" />
              </div>
            </div>
          )}

          {showMobileNav && (
            <nav className="lg:hidden mt-4 py-4 border-t border-gray-200 flex flex-col gap-2">
              <Link
                href="/products"
                className="py-2 text-gray-700 hover:text-gray-900"
                onClick={() => setShowMobileNav(false)}
              >
                Products
              </Link>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
