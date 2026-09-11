"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const iconClass = "h-[18px] w-[18px]";

const navigationSections: Array<{
  label?: string;
  items: NavigationItem[];
}> = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        label: "Products",
        href: "/products",
        icon: (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m5 7 7-4 7 4v10l-7 4-7-4V7Z" />
            <path d="m5 7 7 4 7-4M12 11v10" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        label: "Categories",
        href: "/categories",
        icon: (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 6.5h16M4 12h16M4 17.5h10" />
            <circle cx="18" cy="17.5" r="2" />
          </svg>
        ),
      },
      {
        label: "Sub-categories",
        href: "/subcategories",
        icon: <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h7v5H4V6Zm9 7h7v5h-7v-5ZM8 11v4h5" /></svg>,
      },
      {
        label: "Colours",
        href: "/colours",
        icon: <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 15h.01M8 9h.01M12 7h.01M16 10h.01" /></svg>,
      },
      {
        label: "Size Sets",
        href: "/size-sets",
        icon: <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7h16v10H4zM8 7v4m4-4v2m4-2v4" /></svg>,
      },
      {
        label: "Fits",
        href: "/fits",
        icon: <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 4h14v16H5zM9 4v4m6-4v4M9 16v4m6-4v4" /></svg>,
      },
      {
        label: "Fabrics",
        href: "/fabrics",
        icon: <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m4 7 8-4 8 4-8 4-8-4Zm0 5 8 4 8-4M4 17l8 4 8-4" /></svg>,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Inventory",
        href: "/inventory",
        icon: (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 8h16v12H4V8ZM3 4h18v4H3V4Z" />
            <path d="M9 12h6" />
          </svg>
        ),
      },
      {
        label: "Stock Upload",
        href: "/inventory/import",
        icon: <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M5 14v5h14v-5"/></svg>,
      },
    ],
  },
  {
    label: "Accounts",
    items: [
      { label: "Wholesalers", href: "/wholesalers", icon: <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5"/></svg> },
      { label: "Retailers", href: "/retailers", icon: <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><path d="M2 20a6 6 0 0 1 12 0M12 20a5 5 0 0 1 10 0"/></svg> },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Orders", href: "/orders", icon: <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg> },
    ],
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const isCatalogRoute = navigationSections.find((section) => section.label === "Catalog")?.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? false;
  const [isCatalogOpen, setIsCatalogOpen] = useState(isCatalogRoute);

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-neutral-800 bg-black text-white transition-transform duration-200 lg:static lg:z-auto lg:visible lg:translate-x-0 ${
          isOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-800 px-5">
          <Link href="/dashboard" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50" onClick={onClose}>
            <span className="grid h-8 w-8 place-items-center rounded bg-[#7A1F2B] text-xs font-bold tracking-wide text-white">JB</span>
            <span>
              <span className="block text-sm font-bold tracking-[0.14em] text-white">JUST BLACK</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-neutral-500">Admin</span>
            </span>
          </Link>
          <button type="button" onClick={onClose} className="rounded p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white lg:hidden" aria-label="Close navigation">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.label ?? "overview"} className={sectionIndex === 0 ? "" : "mt-7"}>
              {section.label === "Catalog" ? (
                <button type="button" aria-expanded={isCatalogOpen} aria-controls="catalog-navigation" onClick={() => setIsCatalogOpen((open) => !open)} className={`mb-2 flex h-10 w-full items-center justify-between rounded-md px-3 text-sm font-semibold transition-colors ${isCatalogRoute ? "text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"}`}>
                  <span>Catalog</span>
                  <svg className={`h-4 w-4 transition-transform ${isCatalogOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
              ) : section.label ? <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{section.label}</p> : null}
              <ul id={section.label === "Catalog" ? "catalog-navigation" : undefined} className={`space-y-1 ${section.label === "Catalog" && !isCatalogOpen ? "hidden" : ""}`}>
                {section.items.map((item) => {
                  const isInventoryIndex = item.href === "/inventory";
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && (!isInventoryIndex || !pathname.startsWith("/inventory/import")) && pathname.startsWith(`${item.href}/`));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                          isActive ? "bg-[#7A1F2B] text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-neutral-800 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-600">Internal B2B system</p>
          <p className="mt-1 text-xs text-neutral-400">Just Black administration</p>
        </div>
      </aside>
    </>
  );
}
