import type { Metadata, Viewport } from "next";

import { AuthProvider } from "@/features/auth/AuthProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Just Black Admin",
    template: "%s | Just Black Admin",
  },
  description: "Internal B2B administration portal for Just Black.",
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
      <body className="min-h-screen bg-[#F7F7F7] text-[#111111] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
