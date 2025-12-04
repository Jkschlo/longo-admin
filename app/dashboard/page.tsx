"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Content page (modules) as the default landing page
    router.replace("/dashboard/modules");
  }, [router]);

  return (
    <div className="w-full flex items-center justify-center h-[70vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093075]"></div>
        <p className="text-gray-500">Redirecting to Content...</p>
      </div>
    </div>
  );
}
