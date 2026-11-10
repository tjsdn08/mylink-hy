import type { Link } from "@/types/link";

export const mockLinks: Link[] = [
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com",
    description: "오픈 소스 프로젝트와 코드를 둘러보세요.",
    category: "github",
  },
  {
    id: "tech-blog",
    title: "DEV Community",
    url: "https://dev.to",
    description: "개발자들이 기술 지식과 경험을 나누는 커뮤니티예요.",
    category: "blog",
  },
  {
    id: "portfolio",
    title: "포트폴리오 예시",
    url: "https://example.com/portfolio",
    description: "개인 작업물을 소개하는 예시 페이지예요.",
    category: "portfolio",
  },
  {
    id: "nextjs-project",
    title: "Next.js 프로젝트 소개",
    url: "https://github.com/vercel/next.js",
    description: "Next.js 프레임워크의 공개 저장소예요.",
    category: "project",
  },
  {
    id: "wikipedia",
    title: "Wikipedia",
    url: "https://www.wikipedia.org",
    description: "다양한 주제의 정보를 찾아볼 수 있는 백과사전이에요.",
    category: "other",
  },
];