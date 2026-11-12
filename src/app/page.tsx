"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight, BarChart3, Globe2, Link2, MousePointerClick,
  Palette, Sparkles, WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import {
  ensureUserProfileDocument,
  type UserProfileDocument,
} from "@/lib/user-profile";
import DashboardPage from "@/app/dashboard/page";
import { ProfileOnboarding } from "@/components/mypage/ProfileOnboarding";
import { ProfilePhoneFrame } from "@/components/profile/ProfilePhoneFrame";
import { THEME_PRESETS, type ProfileTheme } from "@/lib/profile-design";


const highlights = [
  { icon: Link2, title: "링크는 한곳에", body: "프로젝트·블로그·SNS 링크를 그룹별로 정리하고 중요한 링크는 강조해요." },
  { icon: Palette, title: "나답게 소개하기", body: "테마, 커버, 자기소개를 직접 꾸며 나만의 페이지를 만들어요." },
  { icon: BarChart3, title: "관심도 알아보기", body: "방문 수와 링크별 클릭 수로 관심을 받은 콘텐츠를 확인해요." },
];
const demoLinks = [
  { id: "demo-github", title: "GitHub", description: "프로젝트와 개발 기록", url: "https://github.com", category: "github" as const, group: "프로젝트", isActive: true, sortOrder: 0 },
  { id: "demo-blog", title: "기술 블로그", description: "배운 것을 차곡차곡", url: "https://velog.io", category: "blog" as const, group: "프로젝트", isActive: true, sortOrder: 1 },
  { id: "demo-portfolio", title: "포트폴리오", description: "작업과 경험 모아보기", url: "https://example.com", category: "portfolio" as const, group: "소개", isActive: true, isFeatured: true, sortOrder: 2 },
];

function LandingPreview() {
  const [previewTheme, setPreviewTheme] = useState<ProfileTheme>("cream");
  return (
    <div className="relative mx-auto w-full max-w-[360px] motion-safe:animate-[mylink-rise_700ms_ease-out_both]"
      aria-label="실제 공개 프로필과 동일한 디자인으로 만든 예시 화면">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-6 -z-10 rounded-[45px] bg-[#DDF76B]/30 blur-3xl motion-safe:animate-[mylink-float_9s_ease-in-out_infinite]" />
      <div className="mx-auto w-full max-w-[330px]">
        <ProfilePhoneFrame
          label="프로필 예시"
          profile={{
            username: "yourname",
            displayName: "나만의 링크 공간",
            headline: "만드는 과정도 나만의 이야기",
            bio: "만든 것, 배우는 것, 좋아하는 것까지 ✨",
            about: "관심 있는 일을 배우고 작은 프로젝트로 만들어 기록합니다.",
            now: "요즘은 새로운 아이디어를 웹으로 구현하고 있어요.",
            socialLinks: [{ platform: "GitHub", url: "https://github.com" }, { platform: "Blog", url: "https://velog.io" }],
            theme: previewTheme,
            coverStyle: previewTheme === "lavender" ? "grid" : previewTheme === "midnight" ? "minimal" : "orbits",
            buttonStyle: "rounded",
          }}
          links={demoLinks}
        />
      </div>
      <div className="relative mt-3 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="프로필 미리보기 테마 선택">
        {(Object.keys(THEME_PRESETS) as ProfileTheme[]).map((theme) => (
          <button type="button" key={theme} onClick={() => setPreviewTheme(theme)} aria-pressed={previewTheme === theme}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-bold transition-colors
              ${previewTheme === theme ? "border-[#252823] bg-[#252823] text-white" : "border-[#252823]/15 bg-white text-[#49503F] hover:border-[#252823]/40"}`}>
            <span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: THEME_PRESETS[theme].cover }} />
            {THEME_PRESETS[theme].name}
          </button>
        ))}
      </div>
      <div className="absolute -right-3 -top-5 hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-[#252823] shadow-xl motion-safe:animate-[mylink-float_7s_ease-in-out_infinite] sm:flex">
        <MousePointerClick aria-hidden="true" className="size-4 text-[#516D34]" /> 하나의 주소로 공유!
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

  if (user && userProfile?.uid === user.uid && !isAuthLoading && !isProfileSaving) {
    if (!userProfile.username) return <ProfileOnboarding profile={userProfile} onComplete={setUserProfile} />;
    return <DashboardPage initialProfile={userProfile} />;
  }

  const busy = isAuthLoading || isSigningIn || isProfileSaving;
  const visibleError = error || (authError ? `로그인 상태를 확인하지 못했어요: ${authError}` : "");
  const loginLabel = isProfileSaving ? "프로필 준비 중..." : isSigningIn ? "로그인 중..." : "Google로 시작하기";

  return (
    <div className="marketing-light min-h-screen overflow-x-hidden bg-[#F8F6F1] text-[#252823]">
      <header className="sticky top-0 z-30 border-b border-[#252823]/10 bg-[#F8F6F1]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="MyLink 홈" className="flex items-center gap-2.5">
            <span className="flex size-9 -rotate-6 items-center justify-center rounded-xl bg-[#252823] text-[#DDF76B]"><Link2 aria-hidden="true" className="size-5" /></span>
            <span className="text-[23px] font-black tracking-[-0.07em]">my<span>link<span className="text-[#708E36]">.</span></span></span>
          </Link>
          <Button variant="outline" className="h-10 rounded-xl px-4" onClick={handleGoogleSignIn} disabled={busy}>
            {isSigningIn ? "로그인 중..." : isProfileSaving ? "준비 중..." : "로그인"}
          </Button>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-[#252823]/10 bg-[#F8F6F1]">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-12 -z-10 size-[320px] rounded-full bg-[#DDF76B]/45 blur-[95px] sm:size-[450px]" />
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-12 pt-10 sm:px-8 sm:pb-14 sm:pt-12 lg:min-h-[560px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-12">
            <div className="max-w-xl text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#EAF4CB] px-4 py-2 text-xs font-bold text-[#344A25] motion-safe:animate-[mylink-rise_600ms_ease-out_both]">
                <Sparkles aria-hidden="true" className="size-4" /> YOUR SPACE ON THE INTERNET
              </p>
              <h1 className="mt-7 text-[clamp(3.4rem,7vw,6.5rem)] font-black leading-[1.05] tracking-[-0.075em]">
                모든 나를<br /><span className="relative inline-block text-[#252823] after:absolute after:bottom-2 after:left-0 after:-z-10 after:h-[22%] after:w-full after:-rotate-2 after:bg-[#DDF76B]">한 곳에.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-[480px] text-[15px] leading-[1.8] text-muted-foreground sm:text-[17px] lg:mx-0">
                프로젝트, 블로그, SNS, 내가 하고 있는 일까지.<br className="hidden sm:block" />
                흩어진 링크를 모아 <strong className="font-extrabold text-[#252823]">나를 닮은 한 페이지</strong>로 소개해요.
              </p>
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button size="lg" className="h-14 w-full rounded-2xl bg-[#252823] px-7 text-sm font-bold text-white hover:bg-[#373D32] sm:w-auto" disabled={busy} onClick={handleGoogleSignIn}>
                  {loginLabel}<ArrowRight aria-hidden="true" className="ml-1 size-4" />
                </Button>
              </div>
              <div className="mt-5 min-h-6" aria-live="polite">
                {isAuthLoading ? <p role="status" className="text-xs text-muted-foreground">로그인 상태를 확인하고 있어요.</p> : null}
                {isSigningIn || isProfileSaving ? <p role="status" className="text-xs text-muted-foreground">{isProfileSaving ? "로그인 완료! 프로필을 준비하고 있어요." : "Google 인증 화면을 확인해 주세요."}</p> : null}
                {visibleError ? <p role="alert" className="text-sm text-destructive">{visibleError}</p> : null}
              </div>
            </div>
            <LandingPreview />
          </div>
        </section>

        <div className="border-b border-[#252823]/10 bg-[#DDF76B] py-4 text-center text-xs font-black tracking-[0.15em] text-[#333B29] sm:text-sm">YOUR LINKS <span className="mx-4">✳</span> YOUR STORIES <span className="mx-4">✳</span> YOUR SPACE</div>
        <section id="features" className="scroll-mt-24 bg-[#F8F6F1] py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-sm font-extrabold text-[#4A622C]">WHY MYLINK?</p>
            <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.65rem)] font-bold leading-tight tracking-tight">작은 링크 하나에도,<br />나만의 이야기가 있어.</h2>
            <p className="mt-4 text-sm text-muted-foreground">링크 관리부터 프로필 꾸미기와 클릭 통계까지, 한곳에서 관리해 보세요.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-[26px] border border-[#252823]/10 bg-[#252823] p-6 text-white transition-transform duration-300 hover:-translate-y-1 sm:p-7">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF4CB] text-[#344A25]"><Icon aria-hidden="true" className="size-6" /></span>
                    <h3 className="mt-6 text-lg font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-[1.8] text-white/65">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="steps" className="scroll-mt-24 border-t border-[#252823]/10 bg-[#F0EEE6] py-12 text-[#252823] sm:py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-center text-xs font-extrabold tracking-[0.16em] text-[#4A622C]">HOW IT WORKS</p>
            <h2 className="mt-3 text-center text-[clamp(1.8rem,4vw,2.65rem)] font-bold tracking-tight text-[#252823]">세 단계면 충분해요</h2>
            <ol className="mt-11 grid gap-5 md:grid-cols-3">
              {[
                { icon: WandSparkles, title: "Google로 시작", description: "복잡한 가입 없이 계정으로 시작해요." },
                { icon: Palette, title: "페이지 꾸미기", description: "내 소개와 링크를 추가하고 원하는 테마로 꾸며요." },
                { icon: Globe2, title: "주소 하나로 공유", description: "개인 URL을 복사하거나 QR 코드로 공유해요." },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="rounded-3xl border border-[#D7DACF] bg-[#FFFFFF]/80 p-6 shadow-[0_4px_18px_rgba(37,40,35,0.04)] sm:p-7">
                    <div className="flex items-center justify-between text-[#49652B]"><strong className="text-xs font-extrabold">STEP 0{index + 1}</strong><Icon aria-hidden="true" className="size-5" /></div>
                    <h3 className="mt-6 text-lg font-bold text-[#252823]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#5D6259]">{step.description}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="bg-[#DDF76B] px-5 py-12 text-center text-[#252823] sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF]/90 px-4 py-2 text-xs font-bold text-[#405A27]"><Sparkles aria-hidden="true" className="size-4" /> 나만의 작은 홈페이지</p>
            <h2 className="mt-5 text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold tracking-tight text-[#252823]">당신의 링크에도 무대가 필요해.</h2>
            <p className="mt-4 text-sm font-medium text-[#45543A]">프로필과 링크를 모아 나만의 웹페이지를 만들어 보세요.</p>
            <Button className="mt-8 h-12 rounded-2xl bg-[#252823] px-7 font-bold text-[#FFFFFF] shadow-[0_6px_0_rgba(37,40,35,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#40483A] hover:text-[#FFFFFF] disabled:opacity-60" disabled={busy} onClick={handleGoogleSignIn}>{loginLabel}<ArrowRight aria-hidden="true" className="size-4" /></Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#252823]/10 bg-[#252823] px-5 py-9 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-white/60 sm:flex-row">
          <strong className="flex items-center gap-2 font-bold text-[#FFFFFF]"><Link2 aria-hidden="true" className="size-4 text-[#DDF76B]" /> MyLink</strong>
          <p>© 2026 MyLink. 나를 소개하는 하나의 주소.</p>
        </div>
      </footer>
    </div>
  );
}
