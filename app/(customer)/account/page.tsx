import { redirect } from "next/navigation";
import { getCustomerProfile } from "@/app/(customer)/actions/profile";
import Header from "@/components/productPage/Header";
import ChangePasswordForm from "./ChangePasswordForm";
import AddressList from "./AddressList";
import { User, Mail, Calendar } from "lucide-react";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(d);
}

export default async function AccountPage() {
  const profile = await getCustomerProfile();

  if (!profile) {
    redirect("/products");
  }

  return (
    <>
      <Header showSearch />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My profile</h1>
          <p className="text-gray-600 text-sm mb-6">
            View and manage your account details.
          </p>

          {/* Profile card */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
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
                  <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
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

          {/* Change password */}
          <div className="mb-6">
            <ChangePasswordForm />
          </div>

          {/* Addresses (edit / delete) */}
          <AddressList addresses={profile.addresses} />
        </div>
      </main>
    </>
  );
}
