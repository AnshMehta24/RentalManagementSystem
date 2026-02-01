import Link from "next/link";
import { getVendorProfile, getVendorDeliveryConfig } from "./action";
import RedirectToLogin from "./RedirectToLogin";
import DeliveryConfigForm from "./DeliveryConfigForm";
import { User, Mail, Calendar, Building2, FileText, LogOut, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(d);
}

export default async function VendorSettingsPage() {
  const [profile, deliveryConfig] = await Promise.all([
    getVendorProfile(),
    getVendorDeliveryConfig(),
  ]);

  if (!profile) {
    return <RedirectToLogin />;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 text-sm mt-1">
          Your profile and company information.
        </p>
      </div>

      {/* Profile (vendor) info */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-start gap-6">
          <div className="shrink-0 w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
            {profile.profileLogo ? (
              <img
                src={profile.profileLogo}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">Account holder</p>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Email</dt>
                  <dd className="text-gray-900 font-medium">{profile.email}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Member since</dt>
                  <dd className="text-gray-900 font-medium">
                    {formatDate(profile.createdAt)}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Company</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-start gap-6">
          <div className="shrink-0 w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
            {profile.companyLogo ? (
              <img
                src={profile.companyLogo}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {profile.companyName ?? "—"}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">Company name</p>
            </div>
            {profile.gstin && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <dt className="text-gray-500 font-medium text-sm">GSTIN</dt>
                  <dd className="text-gray-900 font-medium">{profile.gstin}</dd>
                </div>
              </div>
            )}
            {!profile.companyName && !profile.gstin && (
              <p className="text-sm text-gray-500">
                No company details on file.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delivery config */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Delivery</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Configure how delivery charges are calculated for orders. Customers see these charges at checkout based on your charge type and their delivery address.
          </p>
          <DeliveryConfigForm initial={deliveryConfig} />
        </div>
      </div>

      {/* Logout */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          <Link
            href="/api/auth/logout?redirect=/login"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
}
