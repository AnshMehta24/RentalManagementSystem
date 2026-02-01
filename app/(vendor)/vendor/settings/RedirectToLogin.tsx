"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirect once on mount
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[200px] text-gray-500 text-sm">
      Redirecting to login…
    </div>
  );
}
