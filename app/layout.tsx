import type React from "react";
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { AppWrapper } from "@/components/app-wrapper";
import "./globals.css";

const bvp = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bvp",
});

export const metadata: Metadata = {
  title: "Made with App Studio",
  description: "AI PRO CAR — trợ lý chẩn đoán và tư vấn nâng cấp ô tô",
    generator: 'v0.app'
};

export const viewport: Viewport = {
  themeColor: "#1a1f27",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${bvp.variable} ${GeistMono.variable} bg-background`}>
      <body>
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
