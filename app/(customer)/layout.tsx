import { getCurrentUser } from "@/lib/getCurrentUser";
import { AuthProvider } from "./AuthContext";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <AuthProvider user={user}>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </AuthProvider>
  );
}
