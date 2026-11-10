import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: getSiteUrl(), changeFrequency: "weekly", priority: 1 },
  ];
}

// 공개 프로필은 Firestore username 컬렉션의 전체 목록 조회가 차단되어 있어
// 여기서 임의로 사용자를 열거하지 않습니다. 각 공개 프로필은 메타데이터에서
// canonical 및 index 정책을 개별적으로 제공합니다.
