"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to login page
    router.replace("/login");
  }, [router]);

  return null;
}
