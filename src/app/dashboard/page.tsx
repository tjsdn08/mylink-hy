"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { ArrowUpRight, BarChart3, Globe2, Link2, LogOut, Palette, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { getFirebaseFirestore } from "@/lib/firebase";
import { ensureUserProfileDocument, type UserProfileDocument } from "@/lib/user-profile";

export default function DashboardPage({ initialProfile }: { initialProfile?: UserProfileDocument }) {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfileDocument | null>(initialProfile ?? null);
  const [links, setLinks] = useState({ total: 0, public: 0 });
  const [views, setViews] = useState<number | "error" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (!authError) router.replace("/");
      return;
    }
    let cancelled = false;
    if (!initialProfile || initialProfile.uid !== user.uid) {
      void ensureUserProfileDocument(user).then((next) => {
        if (cancelled) return;
        if (!next.username) router.replace("/");
        else setProfile(next);
      }).catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "프로필을 불러오지 못했어요.");
      });
    }
    const db = getFirebaseFirestore();
    const stopLinks = onSnapshot(collection(db, "users", user.uid, "links"), (snapshot) => {
      if (cancelled) return;
      setLinks({ total: snapshot.size, public: snapshot.docs.filter((item) => item.data().isActive !== false).length });
    }, (cause) => { if (!cancelled) setError(cause.message); });
    const stopViews = onSnapshot(doc(db, "users", user.uid, "metrics", "profile"), (snapshot) => {
      if (cancelled) return;
      const value = snapshot.data()?.views;
      setViews(typeof value === "number" ? value : 0);
    }, () => { if (!cancelled) setViews("error"); });
    return () => { cancelled = true; stopLinks(); stopViews(); };
  }, [user, authLoading, authError, initialProfile, router]);

  const actions = [
    { href: "/mypage?tab=links", icon: Link2, title: "링크 관리", body: "링크를 추가하고 순서와 공개 여부를 관리해요." },
    { href: "/mypage?tab=profile", icon: UserRound, title: "프로필 관리", body: "공개 이름, 소개글과 고유 주소를 관리해요." },
    { href: "/mypage?tab=design", icon: Palette, title: "디자인·SNS", body: "테마, 색상, SNS 아이콘을 꾸며요." },
    { href: "/stats", icon: BarChart3, title: "클릭 통계", body: "조회 수와 링크별 클릭 수를 확인해요." },
  ];

  return (
    <main className="mylink-workspace mx-auto min-h-screen w-full max-w-6xl px-5 py-10 text-[#252823] dark:text-[#F8F6F1] sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <Link href="/" className="text-2xl font-black tracking-tight">mylink<span className="text-[#708E36]">.</span></Link>
        <div className="flex items-center gap-2">
          <Link href="/mypage" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#252823] px-5 text-sm font-bold text-white dark:bg-[#DDF76B] dark:text-[#252823]">
            편집하러 가기 <ArrowUpRight className="size-4" aria-hidden="true"/>
          </Link>
          <button type="button" onClick={() => void signOut().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "로그아웃하지 못했어요."))}
            className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-border px-3 text-sm font-semibold">
            <LogOut className="size-4" aria-hidden="true"/> 로그아웃
          </button>
        </div>
      </header>
      <section className="mt-10 rounded-[28px] bg-[#252823] px-6 py-10 text-white sm:px-10">
        <p className="text-xs font-extrabold tracking-[.18em] text-[#DDF76B]">MYLINK / DASHBOARD</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{profile ? `${profile.displayName}님의 페이지` : "내 페이지 현황"}</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">링크를 관리하고 공개 페이지에 어떤 내용이 표시되는지 확인해 보세요.</p>
        {profile?.username ? (
          <Link href={`/${encodeURIComponent(profile.username)}`} target="_blank" rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#DDF76B] px-5 text-sm font-bold text-[#252823]">
            <Globe2 className="size-4" aria-hidden="true" /> @{profile.username} 공개 페이지 열기
          </Link>
        ) : null}
      </section>

      {error || authError ? <p role="alert" className="mt-6 rounded-xl border border-red-300 p-4 text-sm text-red-700">{error || authError}</p> : null}
      <section aria-label="페이지 현황" className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          { label: "등록한 링크", value: links.total.toLocaleString("ko-KR"), note: "전체 링크" },
          { label: "공개 중인 링크", value: links.public.toLocaleString("ko-KR"), note: "방문자가 볼 수 있는 링크" },
          { label: "프로필 조회", value: views === null ? "확인 중" : views === "error" ? "미집계" : views.toLocaleString("ko-KR"), note: "반복 조회 포함" },
        ].map(({ label, value, note }) => (
          <article key={label} className="rounded-[22px] border border-border bg-card p-6">
            <p className="text-sm font-bold text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-black tabular-nums">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{note}</p>
          </article>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-black">내 페이지 관리</h2>
        <p className="mt-2 text-sm text-muted-foreground">원하는 작업을 선택해서 바로 편집할 수 있어요.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {actions.map(({ href, icon: Icon, title, body }) => (
            <Link href={href} key={href} className="group rounded-[22px] border border-border bg-card p-6 transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#EAF4CB] text-[#405829]"><Icon className="size-5" aria-hidden="true"/></span>
                <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true"/>
              </div>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
