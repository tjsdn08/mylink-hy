import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "클릭 통계",
  description: "내 링크의 총 클릭 수와 링크별 클릭 통계를 확인하는 개인 화면입니다.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "클릭 통계 | MyLink",
    description: "내 링크 클릭 통계를 한눈에 확인하세요.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "MyLink 통계" }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
