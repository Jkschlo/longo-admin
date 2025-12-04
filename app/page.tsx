"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  console.log("Deployment Test!");

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}
