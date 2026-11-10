import Image from "next/image";

export default function Home() {
  const techStack = [
    "Java",
    "Spring Boot",
    "JPA / Hibernate",
    "MySQL",
    "Redis",
    "Docker",
    "AWS",
    "Git",
  ];

  const links = [
    {
      title: "GitHub 저장소",
      description: "오픈소스 및 프로젝트 소스코드",
      url: "https://github.com/tjsdn08",
      badge: "GitHub",
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
      description: "배운 지식과 트러블슈팅 경험 기록",
      url: "https://velog.io",
      badge: "Blog",
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
      description: "아키텍처 설계와 성능 최적화 사례",
      url: "#",
      badge: "Portfolio",
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
    {
      title: "이메일 문의",
      description: "협업 제안 및 문의사항 연락처",
      url: "mailto:ssunoo050808@naver.com",
      badge: "Contact",
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
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:py-16 md:py-20 bg-gradient-to-b from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900/60 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* 배경 장식 블러 글로우 효과 */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[520px] h-[340px] sm:h-[520px] bg-gradient-to-tr from-blue-400/20 via-indigo-500/20 to-purple-500/20 dark:from-blue-600/15 dark:via-indigo-600/15 dark:to-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <main className="w-full max-w-lg sm:max-w-xl md:max-w-2xl flex flex-col items-center">
        {/* 프로필 카드 상단 */}
        <div className="w-full flex flex-col items-center text-center p-6 sm:p-8 md:p-10 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl sm:rounded-[32px] shadow-xl shadow-zinc-200/50 dark:shadow-black/40 border border-zinc-200/70 dark:border-zinc-800/80 transition-all">
          {/* 프로필 이미지 컨테이너 */}
          <div className="relative group mb-5">
            <div className="p-1 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src="/avatar.jpg"
                  alt="개발자 프로필 사진"
                  fill
                  sizes="(max-width: 640px) 96px, 112px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </div>

            {/* 온라인/활동 중 펄스 인디케이터 */}
            <span
              className="absolute bottom-1 right-1 flex h-4 w-4"
              title="활동 중"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-zinc-900" />
            </span>
          </div>

          {/* 이름 및 역할 배지 */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            홍길동
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800/70 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Backend Developer
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
              Junior Engineer
            </span>
          </div>

          {/* 개발자 자기소개 */}
          <p className="mt-5 text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-md break-keep font-normal">
            Java와 Spring Boot 기반의 백엔드 개발에 관심을 두고 지속적으로 성장하고 있습니다. 탄탄한 기술을 바탕으로 사용자에게 실질적인 가치를 제공하는 서비스를 만드는 개발자를 지향합니다.
          </p>

          {/* 기술 스택 칩 섹션 */}
          <div className="w-full mt-6 pt-5 border-t border-zinc-200/60 dark:border-zinc-800/80">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
              Tech Stack
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700/50 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 링크 목록 섹션 */}
        <div className="w-full mt-6 space-y-3">
          {links.map((link) => (
            <a
              key={link.title}
              href={link.url}
              target={link.url.startsWith("http") ? "_blank" : undefined}
              rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex items-center justify-between p-4 sm:p-4.5 rounded-2xl bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800/80 hover:border-indigo-400/80 dark:hover:border-indigo-500/70 shadow-sm hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 dark:group-hover:text-white transition-colors duration-200">
                  {link.icon}
                </div>
                <div className="text-left truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {link.title}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {link.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {link.description}
                  </p>
                </div>
              </div>

              {/* 오른쪽 화살표 */}
              <div className="flex-shrink-0 ml-3 text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200">
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* 푸터 */}
        <footer className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
          <p>© 2026 MyLink · Powered by Next.js &amp; Tailwind CSS</p>
        </footer>
      </main>
    </div>
  );
}
