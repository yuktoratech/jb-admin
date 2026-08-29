"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
    ],
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

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
              {section.label ? <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{section.label}</p> : null}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
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
