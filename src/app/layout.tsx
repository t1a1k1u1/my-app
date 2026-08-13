import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "たべごろ",
  description:
    "冷蔵庫の中身を可視化し、賞味期限を考慮しながら食材を使い切るための食材在庫管理アプリ",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "たべごろ",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#EA580C",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
