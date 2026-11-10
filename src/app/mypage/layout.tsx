import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "내 프로필과 링크를 관리하는 MyLink 개인 화면입니다.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "마이페이지 | MyLink",
    description: "내 링크와 프로필 관리",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "MyLink" }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
