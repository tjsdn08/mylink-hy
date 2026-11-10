import Image from "next/image";

export default function Home() {
  const coreTech = [
    {
      name: "Java",
      color: "bg-[#FFEF08]",
      label: "Language",
    },
    {
      name: "Spring Boot",
      color: "bg-[#A3C7FF]",
      label: "Backend Framework",
    },
    {
      name: "TypeScript",
      color: "bg-[#FFB3C6]",
      label: "Typed JavaScript",
    },
    {
      name: "Next.js",
      color: "bg-white",
      label: "React Framework",
    },
  ];

  const quickLinks = [
    {
      title: "GitHub",
      description: "github.com/tjsdn08",
      url: "https://github.com/tjsdn08",
      color: "hover:bg-[#FFEF08]",
      badge: "CODE",
    },
    {
      title: "Tech Blog",
      description: "배움과 트러블슈팅의 기록",
      url: "https://velog.io",
      color: "hover:bg-[#A3C7FF]",
      badge: "BLOG",
    },
    {
      title: "Email",
      description: "ssunoo050808@naver.com",
      url: "mailto:ssunoo050808@naver.com",
      color: "hover:bg-[#FFB3C6]",
      badge: "CONTACT",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-black font-sans flex flex-col selection:bg-[#FFEF08] selection:text-black">
      {/* 1. Header */}
      <header className="w-full bg-[#FFFDF5] border-b-[3px] border-black sticky top-0 z-50">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 bg-[#FFEF08] border-[2px] border-black rounded-[4px] shadow-[2px_2px_0px_0px_#000] inline-block" />
            <span className="text-xl sm:text-2xl font-black tracking-tight uppercase">
              MYLINK
            </span>
          </div>

          {/* Portfolio Badge */}
          <span className="bg-[#FFB3C6] border-[3px] border-black shadow-[3px_3px_0px_0px_#000] px-3.5 py-1 rounded-[8px] text-xs sm:text-sm font-black tracking-wider uppercase">
            PORTFOLIO
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[800px] mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center gap-6 sm:gap-8">
        {/* 2. Profile Hero Section */}
        <section className="w-full md:w-[80%] md:max-w-[480px] lg:w-full lg:max-w-[800px] bg-[#FFEF08] border-[3px] border-black shadow-[6px_6px_0px_0px_#000] rounded-[12px] p-6 sm:p-10 flex flex-col items-center text-center transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000]">
          {/* Profile Image (120px * 120px, 3px border, 4px hard shadow) */}
          <div className="relative w-[120px] h-[120px] rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden bg-white mb-5 flex-shrink-0">
            <Image
              src="/avatar.jpg"
              alt="홍길동 개발자 프로필"
              fill
              sizes="120px"
              priority
              className="object-cover"
            />
          </div>

          {/* Role Badge */}
          <div className="mb-3">
            <span className="inline-block bg-white border-[3px] border-black shadow-[3px_3px_0px_0px_#000] px-3.5 py-1 rounded-[8px] text-xs sm:text-sm font-black uppercase tracking-wider">
              Backend Developer
            </span>
          </div>

          {/* Name */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black mb-4">
            홍길동
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base font-bold text-black/90 leading-relaxed max-w-lg break-keep bg-white/90 border-[3px] border-black rounded-[10px] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000]">
            Java와 Spring Boot 기반의 백엔드 개발에 관심을 두고 지속적으로
            성장하고 있습니다. 탄탄한 기술을 바탕으로 사용자에게 실질적인 가치를
            제공하는 서비스를 만드는 개발자를 지향합니다.
          </p>
        </section>

        {/* 3. About Section */}
        <section className="w-full md:w-[80%] md:max-w-[480px] lg:w-full lg:max-w-[800px] bg-[#A3C7FF] border-[3px] border-black shadow-[6px_6px_0px_0px_#000] rounded-[12px] p-6 sm:p-8 flex flex-col transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000]">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-black inline-block rounded-xs" />
              About Me
            </h2>
            <span className="bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_#000] px-2.5 py-0.5 rounded-[6px] text-xs font-black uppercase">
              Vision &amp; Focus
            </span>
          </div>

          {/* About Content Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 관심 분야 */}
            <div className="bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] rounded-[10px] p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="inline-block bg-[#FFEF08] border-[2px] border-black px-2 py-0.5 rounded-[6px] text-xs font-black uppercase mb-2.5">
                  관심 분야
                </span>
                <h3 className="text-base sm:text-lg font-black text-black mb-1.5">
                  백엔드 시스템 &amp; 아키텍처
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-black/80 leading-normal break-keep">
                  Java와 Spring Boot 생태계를 기반으로 객체지향 설계와 안정적인 API 서버 구현에 집중하고 있습니다.
                </p>
              </div>
            </div>

            {/* 개발 목표 */}
            <div className="bg-[#FFB3C6] border-[3px] border-black shadow-[4px_4px_0px_0px_#000] rounded-[10px] p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <span className="inline-block bg-white border-[2px] border-black px-2 py-0.5 rounded-[6px] text-xs font-black uppercase mb-2.5">
                  개발 목표
                </span>
                <h3 className="text-base sm:text-lg font-black text-black mb-1.5">
                  실질적 가치 창출
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-black/80 leading-normal break-keep">
                  기술 자체에 매몰되지 않고, 사용자 경험과 비즈니스 문제를 주도적으로 해결하는 가치 중심 개발자를 목표로 합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Tech Stack Section */}
        <section className="w-full md:w-[80%] md:max-w-[480px] lg:w-full lg:max-w-[800px] bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] rounded-[12px] p-6 sm:p-8 flex flex-col transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000]">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-[#FFEF08] border-[2px] border-black inline-block rounded-xs" />
              Tech Stack
            </h2>
            <span className="bg-[#FFEF08] border-[2px] border-black shadow-[2px_2px_0px_0px_#000] px-2.5 py-0.5 rounded-[6px] text-xs font-black uppercase">
              Core Skills
            </span>
          </div>

          {/* Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {coreTech.map((tech) => (
              <div
                key={tech.name}
                className={`${tech.color} border-[3px] border-black shadow-[4px_4px_0px_0px_#000] rounded-[10px] p-3.5 sm:p-4 flex items-center justify-between transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]`}
              >
                <div>
                  <span className="text-base sm:text-lg font-black text-black block">
                    {tech.name}
                  </span>
                  <span className="text-xs font-bold text-black/70 block">
                    {tech.label}
                  </span>
                </div>
                <span className="w-3 h-3 rounded-full border-[2px] border-black bg-black inline-block" />
              </div>
            ))}
          </div>
        </section>

        {/* 5. Quick Links Section */}
        <section className="w-full md:w-[80%] md:max-w-[480px] lg:w-full lg:max-w-[800px] flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1 mb-1">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
              Connect &amp; Links
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {quickLinks.map((link) => (
              <a
                key={link.title}
                href={link.url}
                target={link.url.startsWith("http") ? "_blank" : undefined}
                rel={
                  link.url.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className={`w-full bg-white ${link.color} border-[3px] border-black shadow-[5px_5px_0px_0px_#000] rounded-[12px] p-4 flex items-center justify-between transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000]`}
              >
                <div className="flex items-center gap-3">
                  <span className="bg-black text-white text-[11px] font-black uppercase px-2 py-0.5 rounded-[4px]">
                    {link.badge}
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-black">
                      {link.title}
                    </h4>
                    <p className="text-xs font-bold text-black/70">
                      {link.description}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-[8px] border-[2px] border-black bg-white flex items-center justify-center font-black text-base shadow-[2px_2px_0px_0px_#000]">
                  →
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="w-full bg-[#FFFDF5] border-t-[3px] border-black py-6 sm:py-8 mt-12">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#FFB3C6] border-[2px] border-black rounded-[2px]" />
            <span className="text-sm font-black tracking-tight uppercase">
              MYLINK
            </span>
            <span className="text-xs font-bold text-black/60">
              · Neobrutalism Portfolio
            </span>
          </div>

          <p className="text-xs font-bold text-black/70">
            © 2026 MYLINK. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
