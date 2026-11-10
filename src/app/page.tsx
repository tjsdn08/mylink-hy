import Image from "next/image";

export default function Home() {
  const coreTech = [
    { name: "Java", featured: true },
    { name: "Spring Boot", featured: true },
    { name: "TypeScript", featured: false },
    { name: "Next.js", featured: false },
    { name: "MySQL", featured: false },
    { name: "JPA / Hibernate", featured: false },
    { name: "Docker", featured: false },
    { name: "AWS", featured: false },
    { name: "Git", featured: false },
  ];

  const links = [
    {
      title: "GitHub 저장소",
      subtitle: "github.com/tjsdn08",
      url: "https://github.com/tjsdn08",
      icon: (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      title: "기술 블로그",
      subtitle: "배운 지식과 트러블슈팅 경험을 기록해요",
      url: "https://velog.io",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      title: "백엔드 프로젝트 포트폴리오",
      subtitle: "아키텍처 설계와 성능 최적화 사례",
      url: "#",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F4F6] text-[#191F28] font-sans antialiased flex flex-col">
      {/* 1. TDS TopBar (56pt) */}
      <header className="sticky top-0 z-30 bg-[#F2F4F6]/90 backdrop-blur-md border-b border-[#E5E8EB]">
        <div className="max-w-[560px] mx-auto h-14 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3182F6]" />
            <span className="text-[17px] font-bold tracking-tight text-[#191F28]">
              MyLink
            </span>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F3FF] text-[#3182F6]">
            포트폴리오
          </span>
        </div>
      </header>

      {/* 2. Main Container (Single-column layout conforming to TDS Mobile rules) */}
      <main className="flex-1 w-full max-w-[560px] mx-auto px-4 py-5 space-y-4 pb-32">
        {/* Profile Hero Card */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#E5E8EB]/70">
          <div className="flex items-start gap-4 sm:gap-5">
            {/* 80px Profile Avatar */}
            <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-[#F2F4F6] border border-[#E5E8EB] flex-shrink-0">
              <Image
                src="/avatar.jpg"
                alt="홍길동 개발자 프로필"
                fill
                sizes="88px"
                priority
                className="object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F3FF] text-[#3182F6]">
                  백엔드 개발자
                </span>
                <span className="text-xs text-[#8B95A1] font-medium">
                  Junior
                </span>
              </div>

              <h1 className="text-2xl sm:text-[26px] font-bold text-[#191F28] tracking-tight">
                홍길동
              </h1>

              <p className="text-xs sm:text-[13px] text-[#6B7684] mt-0.5">
                Java · Spring Boot 생태계를 연구해요
              </p>
            </div>
          </div>

          {/* Intro Paragraph (해요체) */}
          <div className="mt-5 pt-4 border-t border-[#F2F4F6]">
            <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#333D4B] break-keep font-normal">
              Java와 Spring Boot 기반의 백엔드 개발에 관심을 두고 지속적으로
              성장하고 있어요. 탄탄한 기술을 바탕으로 사용자에게 실질적인 가치를
              제공하는 서비스를 만드는 개발자를 지향해요.
            </p>
          </div>
        </section>

        {/* About Section: Focus & Vision (TDS Card) */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#E5E8EB]/70">
          <h2 className="text-[17px] font-bold text-[#191F28] mb-4">
            어떤 개발자인가요?
          </h2>

          <div className="space-y-3">
            <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E8EB]/50">
              <span className="text-xs font-bold text-[#3182F6] block mb-1">
                관심 분야
              </span>
              <h3 className="text-[15px] font-bold text-[#191F28] mb-1">
                안정적인 백엔드 시스템 &amp; 아키텍처
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#6B7684] leading-relaxed break-keep">
                Java와 Spring Boot 생태계를 기반으로 객체지향적인 코드 설계와
                안정적인 대용량 API 서버 구현에 집중하고 있어요.
              </p>
            </div>

            <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#E5E8EB]/50">
              <span className="text-xs font-bold text-[#3182F6] block mb-1">
                개발 목표
              </span>
              <h3 className="text-[15px] font-bold text-[#191F28] mb-1">
                실질적인 가치를 만드는 엔지니어링
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#6B7684] leading-relaxed break-keep">
                기술 자체에 머무르지 않고, 사용자의 일상과 비즈니스 문제를
                해결하며 확실한 가치를 전달하는 서비스를 만들고자 해요.
              </p>
            </div>
          </div>
        </section>

        {/* Tech Stack Chips (TDS Chip 34px Full-Pill Pattern) */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#E5E8EB]/70">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-[17px] font-bold text-[#191F28]">
              주로 사용하는 기술이에요
            </h2>
            <span className="text-xs text-[#8B95A1] font-medium">
              {coreTech.length}개 기술
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {coreTech.map((tech) => (
              <span
                key={tech.name}
                className={`h-[34px] inline-flex items-center px-3.5 rounded-full text-[14px] font-medium transition-colors ${
                  tech.featured
                    ? "bg-[#E8F3FF] text-[#3182F6] font-semibold border border-[#3182F6]/20"
                    : "bg-[#F2F4F6] text-[#333D4B] hover:bg-[#E5E8EB]"
                }`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </section>

        {/* Links Section (TDS ListRow Component Pattern) */}
        <section className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#E5E8EB]/70">
          <div className="p-6 pb-2">
            <h2 className="text-[17px] font-bold text-[#191F28]">
              더 알아보기
            </h2>
          </div>

          <div className="divide-y divide-[#F2F4F6]">
            {links.map((link) => (
              <a
                key={link.title}
                href={link.url}
                target={link.url.startsWith("http") ? "_blank" : undefined}
                rel={
                  link.url.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB] active:bg-[#F2F4F6] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* 44px TDS Avatar/Icon Container */}
                  <div className="w-11 h-11 rounded-[14px] bg-[#F2F4F6] text-[#4E5968] flex items-center justify-center flex-shrink-0">
                    {link.icon}
                  </div>

                  <div className="min-w-0 truncate">
                    <span className="text-[16px] font-semibold text-[#191F28] block truncate">
                      {link.title}
                    </span>
                    <span className="text-[13px] text-[#8B95A1] block truncate">
                      {link.subtitle}
                    </span>
                  </div>
                </div>

                {/* TDS Chevron Arrow */}
                <svg
                  className="w-5 h-5 text-[#B0B8C1] flex-shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            ))}
          </div>
        </section>

        {/* Footer info */}
        <footer className="text-center pt-3 pb-6">
          <p className="text-xs text-[#8B95A1] leading-relaxed">
            MyLink · 토스 디자인 시스템(TDS) 가이드라인을 바탕으로 제작되었어요
          </p>
        </footer>
      </main>

      {/* 3. TDS BottomCTA (화면당 유일한 Blue-500 채움 Primary Action) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 pb-6 px-4">
        <div className="max-w-[560px] mx-auto">
          <a
            href="mailto:ssunoo050808@naver.com"
            className="w-full h-14 bg-[#3182F6] hover:bg-[#1B64DA] active:scale-[0.99] text-white text-[17px] font-bold rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(49,130,246,0.25)] transition-all"
          >
            이메일로 연락하기
          </a>
        </div>
      </div>
    </div>
  );
}
