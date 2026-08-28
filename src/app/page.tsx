"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth/AuthProvider";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const hasAdminAccess = user?.role === "admin" && user.status === "active";
    router.replace(hasAdminAccess ? "/dashboard" : "/login");
  }, [isLoading, router, user]);

  return <LoadingSpinner fullScreen label="Opening admin portal" />;
}
