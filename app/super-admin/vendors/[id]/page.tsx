"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Building2, Package, FileText, ShoppingCart } from "lucide-react";

const API = "/api/super-admin/vendors";

interface VendorDetail {
  id: number;
  name: string;
  email: string;
  companyName: string | null;
  companyLogo: string | null;
  gstin: string | null;
  profileLogo: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { products: number };
  revenue: number;
  orderCount: number;
  quotationCount: number;
  isBlocked: boolean;
  staff: {
    id: number;
    permissions: string[];
    isActive: boolean;
    staff: { id: number; name: string; email: string };
  }[];
}

function DetailCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <Icon className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function SuperAdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchVendor() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load vendor");
        setVendor(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load vendor");
      } finally {
        setLoading(false);
      }
    }
    fetchVendor();
  }, [id]);

  async function toggleBlock() {
    if (!vendor) return;
    setActionLoading(true);
    try {
      const res = await fetch(API, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          action: vendor.isBlocked ? "unblock" : "block",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setVendor((v) => (v ? { ...v, isBlocked: !v.isBlocked } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !vendor) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/vendors" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Vendors
        </Link>
        <p className="text-gray-500">Loading vendor...</p>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/vendors" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Vendors
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/super-admin/vendors" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Vendors
        </Link>
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              vendor.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
            }`}
          >
            {vendor.isBlocked ? "Blocked" : "Active"}
          </span>
          <button
            onClick={toggleBlock}
            disabled={actionLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              vendor.isBlocked
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            } disabled:opacity-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {actionLoading ? "..." : vendor.isBlocked ? "Unblock" : "Block"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {vendor.profileLogo && (
          <img
            src={vendor.profileLogo}
            alt=""
            className="w-16 h-16 rounded-full object-cover border border-gray-200"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
          <p className="text-gray-600">{vendor.email}</p>
          {vendor.companyName && <p className="text-gray-600 font-medium mt-1">{vendor.companyName}</p>}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <DetailCard title="Company & tax" icon={Building2}>
          <dl className="space-y-2">
            <div>
              <dt className="text-gray-500 text-sm">Company name</dt>
              <dd className="font-medium text-gray-900">{vendor.companyName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">GSTIN</dt>
              <dd className="font-medium text-gray-900">{vendor.gstin ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Registered</dt>
              <dd className="text-gray-900">{new Date(vendor.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </DetailCard>

        <DetailCard title="Stats" icon={Package}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-gray-500 text-sm flex items-center gap-1">
                <Package className="w-4 h-4" /> Products
              </dt>
              <dd className="font-medium text-gray-900">{vendor._count.products}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm flex items-center gap-1">
                <FileText className="w-4 h-4" /> Quotations
              </dt>
              <dd className="font-medium text-gray-900">
                <Link href={`/super-admin/quotations?vendorId=${vendor.id}`} className="text-blue-600 hover:underline">
                  {vendor.quotationCount}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" /> Orders
              </dt>
              <dd className="font-medium text-gray-900">
                <Link href={`/super-admin/orders?vendorId=${vendor.id}`} className="text-blue-600 hover:underline">
                  {vendor.orderCount}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Revenue (paid invoices)</dt>
              <dd className="font-bold text-blue-600">₹{vendor.revenue.toLocaleString("en-IN")}</dd>
            </div>
          </dl>
        </DetailCard>
      </div>

      {vendor.staff.length > 0 && (
        <DetailCard title="Staff" icon={User}>
          <ul className="space-y-2">
            {vendor.staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{s.staff.name}</p>
                  <p className="text-gray-500 text-sm">{s.staff.email}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Permissions: {s.permissions.join(", ")} • {s.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </DetailCard>
      )}

      <div className="flex flex-wrap gap-4">
        <Link
          href={`/super-admin/quotations?vendorId=${vendor.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          <FileText className="w-4 h-4" /> View quotations
        </Link>
        <Link
          href={`/super-admin/orders?vendorId=${vendor.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          <ShoppingCart className="w-4 h-4" /> View orders
        </Link>
      </div>
    </div>
  );
}
