"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Building2, Layers, Tag, Calendar } from "lucide-react";

const API = "/api/super-admin/products";

interface RentalPeriod {
  id: number;
  name: string;
  duration: number;
  unit: string;
}

interface VariantAttribute {
  attribute: { id: number; name: string; displayType: string };
  value: { id: number; value: string; extraPrice: number };
}

interface VariantPrice {
  id: number;
  price: number;
  period: RentalPeriod;
}

interface VariantReservation {
  id: number;
  quantity: number;
  status: string;
  startDate: string;
  endDate: string;
}

interface ProductVariant {
  id: number;
  sku: string | null;
  quantity: number;
  costPrice: number;
  salePrice: number;
  attributes: VariantAttribute[];
  prices: VariantPrice[];
  reservations: VariantReservation[];
  reservedQty: number;
}

interface ProductDetail {
  id: number;
  name: string;
  description: string | null;
  isRentable: boolean;
  published: boolean;
  vendorId: number;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: number;
    name: string;
    email: string;
    companyName: string | null;
    gstin: string | null;
  } | null;
  variants: ProductVariant[];
  totalStock: number;
  reservedOrOut: number;
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

export default function SuperAdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load product");
        setProduct(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading && !product) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/products" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Link href="/super-admin/products" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{error ?? "Product not found"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/super-admin/products" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900">{product.name}</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              product.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
            }`}
          >
            {product.published ? "Published" : "Unpublished"}
          </span>
          {!product.isRentable && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Not rentable</span>
          )}
        </div>
      </div>

      <DetailCard title="Product info" icon={Package}>
        {product.description && (
          <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        )}
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-gray-500 text-sm">Created</dt>
            <dd className="text-gray-900">{new Date(product.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Updated</dt>
            <dd className="text-gray-900">{new Date(product.updatedAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Total stock</dt>
            <dd className="font-medium text-gray-900">{product.totalStock}</dd>
          </div>
          <div>
            <dt className="text-gray-500 text-sm">Reserved / out</dt>
            <dd className="font-medium text-blue-600">{product.reservedOrOut}</dd>
          </div>
        </dl>
      </DetailCard>

      <DetailCard title="Vendor" icon={Building2}>
        {product.vendor ? (
          <>
            <p className="font-medium text-gray-900">{product.vendor.companyName ?? product.vendor.name}</p>
            <p className="text-gray-600 text-sm">{product.vendor.email}</p>
            {product.vendor.gstin && <p className="text-gray-500 text-sm mt-1">GSTIN: {product.vendor.gstin}</p>}
            <Link href={`/super-admin/vendors/${product.vendor.id}`} className="text-blue-600 text-sm hover:underline mt-2 inline-block">
              View vendor →
            </Link>
          </>
        ) : (
          <p className="text-gray-500">No vendor linked</p>
        )}
      </DetailCard>

      <DetailCard title="Variants" icon={Layers}>
        {product.variants.length === 0 ? (
          <p className="text-gray-500 text-sm">No variants</p>
        ) : (
          <div className="space-y-4">
            {product.variants.map((v) => (
              <div key={v.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">Variant #{v.id}</span>
                  {v.sku && <span className="text-gray-500 text-sm">SKU: {v.sku}</span>}
                </div>
                <dl className="grid gap-2 grid-cols-2 sm:grid-cols-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Quantity</dt>
                    <dd className="font-medium text-gray-900">{v.quantity}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Reserved</dt>
                    <dd className="font-medium text-blue-600">{v.reservedQty}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Cost</dt>
                    <dd className="text-gray-900">₹{v.costPrice.toLocaleString("en-IN")}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Sale price</dt>
                    <dd className="text-gray-900">₹{v.salePrice.toLocaleString("en-IN")}</dd>
                  </div>
                </dl>
                {v.attributes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Tag className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    {v.attributes.map((a) => (
                      <span key={a.attribute.id} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                        {a.attribute.name}: {a.value.value}
                        {a.value.extraPrice > 0 ? ` (+₹${a.value.extraPrice})` : ""}
                      </span>
                    ))}
                  </div>
                )}
                {v.prices.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Rental prices</p>
                    <div className="flex flex-wrap gap-2">
                      {v.prices.map((rp) => (
                        <span key={rp.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-800">
                          <Calendar className="w-3 h-3" />
                          {rp.period.name}: ₹{rp.price.toLocaleString("en-IN")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DetailCard>
    </div>
  );
}
