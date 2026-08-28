import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/features/auth/AuthProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Admin Panel",
    template: "%s | Admin Panel",
  },
  description: "Administration portal for the B2B wholesale clothing platform.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
