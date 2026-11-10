import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "링크 목록",
  description: "MyLink의 링크 카드와 카테고리를 살펴볼 수 있는 예시 목록입니다.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "링크 목록 | MyLink",
    description: "MyLink의 링크 목록 화면을 살펴보세요.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "MyLink 링크 목록" }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
