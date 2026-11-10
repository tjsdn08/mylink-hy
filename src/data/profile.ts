import type { ProfilePageData } from "@/types/profile";

export const profilePageData: ProfilePageData = {
  profile: {
    imageUrl: "/avatar.jpg",
    imageAlt: "홍길동 개발자 프로필",
    fallbackText: "홍",
    name: "홍길동",
    role: "백엔드 개발자",
    level: "Junior",
    tagline: "Java · Spring Boot 생태계를 연구해요",
    bio: "Java와 Spring Boot 기반의 백엔드 개발에 관심을 두고 지속적으로 성장하고 있어요. 탄탄한 기술을 바탕으로 사용자에게 실질적인 가치를 제공하는 서비스를 만드는 개발자를 지향해요.",
  },
  highlights: [
    {
      label: "관심 분야",
      title: "안정적인 백엔드 시스템 & 아키텍처",
      description:
        "Java와 Spring Boot 생태계를 기반으로 객체지향적인 코드 설계와 안정적인 대용량 API 서버 구현에 집중하고 있어요.",
    },
    {
      label: "개발 목표",
      title: "실질적인 가치를 만드는 엔지니어링",
      description:
        "기술 자체에 머무르지 않고, 사용자의 일상과 비즈니스 문제를 해결하며 확실한 가치를 전달하는 서비스를 만들고자 해요.",
    },
  ],
  technologies: [
    { name: "Java", featured: true },
    { name: "Spring Boot", featured: true },
    { name: "TypeScript", featured: false },
    { name: "Next.js", featured: false },
    { name: "MySQL", featured: false },
    { name: "JPA / Hibernate", featured: false },
    { name: "Docker", featured: false },
    { name: "AWS", featured: false },
    { name: "Git", featured: false },
  ],
  contactHref: "mailto:ssunoo050808@naver.com",
};