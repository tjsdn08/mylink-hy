import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import { ToastViewport } from "@/components/ui/toast-viewport";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "MyLink | 내 모든 링크, 딱 한 페이지에", template: "%s | MyLink" },
  description: "블로그, 프로젝트, 포트폴리오까지. 나만의 프로필과 모든 링크를 하나의 주소로 공유하세요.",
  applicationName: "MyLink",
  keywords: ["MyLink", "마이링크", "링크 모음", "프로필 링크", "포트폴리오", "블로그 링크", "SNS 링크", "링크 공유"],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website", locale: "ko_KR", siteName: "MyLink",
    title: "MyLink | 내 모든 링크, 딱 한 페이지에",
    description: "나를 보여주는 모든 링크를 한 페이지에 모아 공유하세요.",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "MyLink - 내 모든 링크, 딱 한 페이지에" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyLink | 내 모든 링크, 딱 한 페이지에",
    description: "나의 모든 링크를 한 곳에 모아 공유하세요.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var t=localStorage.getItem(\"mylink-theme\");var d=t===\"dark\"||(t!==\"light\"&&window.matchMedia(\"(prefers-color-scheme: dark)\").matches);document.documentElement.classList.toggle(\"dark\",d);document.documentElement.style.colorScheme=d?\"dark\":\"light\"}catch(e){}})();" }} />
      </head>
      <body className="min-h-full flex flex-col"><ThemeProvider>{children}<ToastViewport /></ThemeProvider></body>
    </html>
  );
}
