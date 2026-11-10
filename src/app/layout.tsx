import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const deployHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ??
  (deployHost ? `https://${deployHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "MyLink | 내 모든 링크, 딱 한 페이지에", template: "%s | MyLink" },
  description: "블로그, 프로젝트, 포트폴리오까지. 나만의 프로필과 모든 링크를 하나의 주소로 공유하세요.",
  applicationName: "MyLink",
  openGraph: {
    type: "website", locale: "ko_KR", siteName: "MyLink",
    title: "MyLink | 내 모든 링크, 딱 한 페이지에",
    description: "나를 보여주는 모든 링크를 한 페이지에 모아 공유하세요.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyLink | 내 모든 링크, 딱 한 페이지에",
    description: "나의 모든 링크를 한 곳에 모아 공유하세요.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
