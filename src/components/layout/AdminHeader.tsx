"use client";

import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthProvider";

type AdminHeaderProps = {
  onMenuClick: () => void;
};

function getInitials(name?: string) {
  if (!name) return "A";
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/categories") return "Categories";
  if (pathname === "/subcategories") return "Sub-categories";
  if (pathname === "/colours") return "Colours";
  if (pathname === "/size-sets") return "Size Sets";
  if (pathname === "/fits") return "Fits";
  if (pathname === "/fabrics") return "Fabrics";
  if (pathname === "/products/new") return "Add Product";
  if (pathname.endsWith("/edit") && pathname.startsWith("/products/")) return "Edit Product";
  if (pathname.startsWith("/products/")) return "Product Details";
  if (pathname === "/products") return "Products";
  if (pathname.startsWith("/inventory/")) return "Inventory Details";
  if (pathname === "/inventory") return "Inventory";
  return "Administration";
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md border border-neutral-300 p-2 text-neutral-600 hover:bg-neutral-50 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1F2B]/30 lg:hidden"
          aria-label="Open navigation"
          aria-controls="admin-sidebar"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <p className="truncate text-base font-semibold text-neutral-950">{getPageTitle(pathname)}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden min-w-0 text-right sm:block">
          <p className="max-w-48 truncate text-sm font-semibold text-neutral-900">{user?.name ?? "Administrator"}</p>
          <p className="max-w-48 truncate text-xs text-neutral-500">Admin</p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-xs font-semibold text-white" aria-hidden="true">
          {getInitials(user?.name)}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="px-2.5 sm:px-3">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><path d="M10 17 15 12 10 7M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>
          <span className="hidden sm:inline">Logout</span>
          <span className="sr-only sm:hidden">Logout</span>
        </Button>
      </div>
    </header>
  );
}
