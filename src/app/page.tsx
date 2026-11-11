"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight, ArrowUpRight, BarChart3, BookOpen, CheckCircle2,
  ChevronRight, CodeXml, Globe2, Link2, MousePointerClick,
  Palette, ShieldCheck, Sparkles, WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import {
  ensureUserProfileDocument,
  type UserProfileDocument,
} from "@/lib/user-profile";
import MyPage from "@/app/mypage/page";


const highlights = [
  { icon: Link2, title: "링크는 한곳에", body: "블로그부터 포트폴리오까지, 흩어진 링크를 보기 좋게 정리해요." },
  { icon: Palette, title: "나답게 소개하기", body: "프로필과 자기소개로 첫인상을 만들어요." },
  { icon: BarChart3, title: "관심도 알아보기", body: "어떤 링크가 인기 있는지 클릭 통계로 확인해요." },
];
const demoLinks = [
  { icon: CodeXml, title: "GitHub", subtitle: "나의 프로젝트와 코드" },
  { icon: BookOpen, title: "기술 블로그", subtitle: "배운 것을 차곡차곡" },
  { icon: Globe2, title: "포트폴리오", subtitle: "내 작업 한눈에" },
];

function LandingPreview() {
  const [active, setActive] = useState(0);
  const ItemIcon = demoLinks[active].icon;
  return (
    <div className="relative mx-auto w-full max-w-[420px] motion-safe:animate-[mylink-rise_700ms_ease-out_both]" aria-label="MyLink 프로필 예시 미리보기">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-5 -z-10 rounded-[40px] bg-gradient-to-br from-[var(--tds-blue-50)] via-white to-teal-50 blur-2xl" />
      <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_24px_70px_-30px_rgba(25,31,40,0.30)]">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-bold"><Link2 className="size-4 text-primary" />MyLink</span>
          <span className="rounded-full bg-[var(--tds-blue-50)] px-3 py-1 text-xs font-semibold text-primary">미리보기</span>
        </div>
        <div className="px-5 py-7 sm:px-7">
          <div className="flex flex-col items-center text-center">
            <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-[26px] bg-[var(--tds-blue-50)] text-3xl">👩🏻‍💻</span>
            <h2 className="mt-4 text-xl font-bold">나만의 링크 공간</h2>
            <p className="mt-1 text-sm text-muted-foreground">만든 것, 배우는 것, 좋아하는 것까지 ✨</p>
            <span className="mt-3 rounded-full bg-[var(--tds-blue-50)] px-3 py-1.5 text-xs font-semibold text-primary">@yourname</span>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2" aria-label="예시 링크 선택">
            {demoLinks.map((item, index) => (
              <button key={item.title} type="button" aria-pressed={active === index}
                onClick={() => setActive(index)}
                className={`rounded-xl px-1 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active === index ? "bg-[var(--tds-blue-50)] text-primary" : "bg-muted text-muted-foreground hover:bg-border/70"}`}>
                {item.title}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-[var(--tds-shadow-1)]">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted"><ItemIcon aria-hidden="true" className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{demoLinks[active].title}</p>
              <p className="truncate text-xs text-muted-foreground">{demoLinks[active].subtitle}</p>
            </div>
            <ArrowUpRight aria-hidden="true" className="size-4 text-primary" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-muted/70 py-3 text-xs text-muted-foreground">
            <Link2 aria-hidden="true" className="size-4" /> mylink.example/yourname
          </div>
        </div>
      </div>
      <div className="absolute -right-3 -top-5 hidden items-center gap-2 rounded-2xl motion-safe:animate-[mylink-float_5s_ease-in-out_infinite] bg-card px-3 py-2 text-xs font-semibold shadow-[var(--tds-shadow-3)] sm:flex">
        <MousePointerClick aria-hidden="true" className="size-4 text-primary" /> 하나의 주소로 공유!
      </div>
    </div>
  );
}

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfileDocument | null>(null);
  const { user, loading: isAuthLoading, error: authError, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setError("");
      setIsProfileSaving(true);
      void ensureUserProfileDocument(user)
        .then((profile) => {
          if (cancelled) return;
          setUserProfile(profile);
          setIsProfileSaving(false);
        })
        .catch((cause: unknown) => {
          if (cancelled) return;
          setError(cause instanceof Error
            ? `프로필 정보를 불러오지 못했어요: ${cause.message}`
            : "프로필 정보를 불러오지 못했어요.");
          setIsProfileSaving(false);
        });
    });
    return () => { cancelled = true; };
  }, [user]);

  async function handleGoogleSignIn() {
    setError("");
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
    } catch (signInError) {
      const errorCode =
        typeof signInError === "object" &&
        signInError !== null &&
        "code" in signInError
          ? signInError.code
          : undefined;
      setError(
        errorCode === "auth/popup-closed-by-user"
          ? "로그인을 취소했어요. 원할 때 다시 시도해 주세요."
          : signInError instanceof Error
            ? `Google 로그인에 실패했어요: ${signInError.message}`
            : "Google 로그인에 실패했어요. 다시 시도해 주세요."
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  if (user && userProfile && !isAuthLoading && !isProfileSaving) {
    return <MyPage />;
  }

  const busy = isAuthLoading || isSigningIn || isProfileSaving;
  const visibleError = error || (authError ? `로그인 상태를 확인하지 못했어요: ${authError}` : "");
  const loginLabel = isProfileSaving ? "프로필 준비 중..." : isSigningIn ? "로그인 중..." : "Google로 시작하기";

  return (
    <div className="marketing-light min-h-screen overflow-x-hidden bg-white text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="MyLink 홈" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white"><Link2 aria-hidden="true" className="size-5" /></span>
            <span className="text-xl font-extrabold tracking-tight">My<span className="text-primary">Link</span></span>
          </Link>
          <nav aria-label="서비스 안내" className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">서비스 소개</a>
            <a href="#steps" className="hover:text-foreground">이용 방법</a>
          </nav>
          <Button variant="outline" className="h-10 rounded-xl px-4" onClick={handleGoogleSignIn} disabled={busy}>
            {isSigningIn ? "로그인 중..." : isProfileSaving ? "준비 중..." : "로그인"}
          </Button>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-gradient-to-b from-white via-[#F8FBFF] to-white">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-12 -z-10 size-[320px] rounded-full bg-[var(--tds-blue-50)] blur-[95px] sm:size-[450px]" />
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 sm:pt-20 lg:min-h-[680px] lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div className="max-w-xl text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full bg-[var(--tds-blue-50)] px-4 py-2 text-xs font-bold text-primary">
                <Sparkles aria-hidden="true" className="size-4" /> 나를 소개하는 가장 간단한 방법
              </p>
              <h1 className="mt-7 text-[clamp(2.5rem,6vw,4.8rem)] font-extrabold leading-[1.16] tracking-[-0.055em]">
                내 모든 링크,<br /><span className="text-primary">딱 한 페이지에.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-[480px] text-[15px] leading-[1.8] text-muted-foreground sm:text-[17px] lg:mx-0">
                블로그, 프로젝트, 포트폴리오까지.<br className="hidden sm:block" />
                나를 보여주는 링크를 모아 <strong className="font-semibold text-foreground">하나의 주소로 공유</strong>하세요.
              </p>
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button size="lg" className="h-12 w-full rounded-2xl px-7 text-sm font-bold sm:w-auto" disabled={busy} onClick={handleGoogleSignIn}>
                  {loginLabel}<ArrowRight aria-hidden="true" className="ml-1 size-4" />
                </Button>
                <a href="#steps" className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl px-5 text-sm font-semibold text-muted-foreground hover:bg-muted sm:w-auto">
                  어떻게 사용하나요? <ChevronRight aria-hidden="true" className="size-4" />
                </a>
              </div>
              <div className="mt-5 min-h-6" aria-live="polite">
                {isAuthLoading ? <p role="status" className="text-xs text-muted-foreground">로그인 상태를 확인하고 있어요.</p> : null}
                {isSigningIn || isProfileSaving ? <p role="status" className="text-xs text-muted-foreground">{isProfileSaving ? "로그인 완료! 프로필을 준비하고 있어요." : "Google 인증 화면을 확인해 주세요."}</p> : null}
                {error ? <p role="alert" className="text-sm text-destructive">{visibleError}</p> : null}
              </div>
              <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 aria-hidden="true" className="size-4 text-primary" /> Google로 간편 시작</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="size-4 text-primary" /> 내 링크는 내가 관리</span>
              </div>
            </div>
            <LandingPreview />
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-[#F8FAFC] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-sm font-bold text-primary">WHY MYLINK?</p>
            <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.65rem)] font-bold leading-tight tracking-tight">링크 정리는 간단하게,<br />소개는 더 근사하게.</h2>
            <p className="mt-4 text-sm text-muted-foreground">작은 링크 하나도 나를 설명할 수 있으니까요.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-[26px] border border-border/60 bg-white p-6 shadow-[var(--tds-shadow-1)] transition-transform duration-300 hover:-translate-y-1 sm:p-7">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--tds-blue-50)] text-primary"><Icon aria-hidden="true" className="size-6" /></span>
                    <h3 className="mt-6 text-lg font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-[1.8] text-muted-foreground">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="steps" className="scroll-mt-24 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-center text-sm font-bold text-primary">HOW IT WORKS</p>
            <h2 className="mt-3 text-center text-[clamp(1.8rem,4vw,2.65rem)] font-bold tracking-tight">세 단계면 충분해요</h2>
            <ol className="mt-11 grid gap-5 md:grid-cols-3">
              {[
                { icon: WandSparkles, title: "Google로 시작", description: "복잡한 가입 없이 계정으로 시작해요." },
                { icon: Link2, title: "링크 모으기", description: "소개하고 싶은 링크를 자유롭게 추가해요." },
                { icon: Globe2, title: "한 번에 공유", description: "나만의 URL로 프로필을 보여줘요." },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="rounded-3xl border border-border/70 p-6 sm:p-7">
                    <div className="flex items-center justify-between text-primary"><strong className="text-xs">STEP 0{index + 1}</strong><Icon aria-hidden="true" className="size-5" /></div>
                    <h3 className="mt-6 text-lg font-bold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="bg-[#EDF5FF] px-5 py-16 text-center sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-primary"><Sparkles aria-hidden="true" className="size-4" /> 나만의 작은 홈페이지</p>
            <h2 className="mt-5 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight">이제, 나를 링크해 볼까요?</h2>
            <p className="mt-4 text-sm text-muted-foreground">한 페이지에 나다운 이야기를 담아보세요.</p>
            <Button className="mt-8 h-12 rounded-2xl px-7" disabled={busy} onClick={handleGoogleSignIn}>{loginLabel}<ArrowRight aria-hidden="true" className="size-4" /></Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-border/60 bg-white px-5 py-7">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <strong className="flex items-center gap-2 text-foreground"><Link2 aria-hidden="true" className="size-4 text-primary" /> MyLink</strong>
          <p>© 2026 MyLink. 하나의 링크로 나를 소개해요.</p>
          <a href="#features" className="hover:text-foreground">서비스 소개로 이동</a>
        </div>
      </footer>
    </div>
  );
}
