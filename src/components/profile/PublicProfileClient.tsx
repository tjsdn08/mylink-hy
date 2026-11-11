"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query, Timestamp, increment, setDoc } from "firebase/firestore";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { ArrowUpRight, AtSign, BookOpen, Check, Copy, Github, Globe2, Instagram, Link2, Linkedin, Music2, Share2, Youtube, type LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkList } from "@/components/links/LinkList";
import { getFirebaseFirestore } from "@/lib/firebase";
import { showToast } from "@/lib/toast";
import { appearanceVariables, normalizeSocialLinks, type ProfileAppearance } from "@/lib/profile-design";
import type { Link } from "@/types/link";

interface PublicProfile extends ProfileAppearance {
  username: string;
  displayName: string;
  photoURL: string;
  bio: string;
}

const socialIconMap: Record<string, LucideIcon> = {
  Instagram, GitHub: Github, YouTube: Youtube, TikTok: Music2,
  LinkedIn: Linkedin, X: AtSign, Blog: BookOpen, Website: Globe2,
};
type LoadState = "loading" | "ready" | "missing" | "error";
type LoadStep = "username" | "profile" | "links";

export function PublicProfileClient({ username }: { username: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<{ step: LoadStep; message: string; code?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeLinks: (() => void) | undefined;
    let step: LoadStep = "username";

    async function loadProfile() {
      try {
        const firestore = getFirebaseFirestore();
        const usernameKey = username.trim().toLowerCase();
        const usernameDoc = await getDoc(doc(firestore, "usernames", usernameKey));
        if (cancelled) return;
        if (!usernameDoc.exists() || typeof usernameDoc.data().uid !== "string") {
          setState("missing");
          return;
        }

        const uid = usernameDoc.data().uid as string;
        step = "profile";
        const profileDoc = await getDoc(doc(firestore, "users", uid, "profile", "main"));
        if (cancelled) return;
        if (!profileDoc.exists()) {
          setState("missing");
          return;
        }
        const data = profileDoc.data();
        if (data.username !== usernameKey) {
          setState("missing");
          return;
        }

        // 방문마다 1회 증가합니다. 게시된 보안 규칙에서 +1만 허용합니다.
        // 규칙이 아직 배포되지 않았더라도 공개 페이지는 정상 표시되어야 합니다.
        void setDoc(doc(firestore, "users", uid, "metrics", "profile"),
          { views: increment(1) }, { merge: true }).catch((cause) => {
          console.warn("프로필 조회 수 기록 실패:", cause);
        });
        setOwnerId(uid);
        setProfile({
          username: usernameKey,
          displayName: typeof data.displayName === "string" ? data.displayName : usernameKey,
          photoURL: typeof data.photoURL === "string" ? data.photoURL : "",
          bio: typeof data.bio === "string" ? data.bio : "",
          theme: data.theme === "lavender" || data.theme === "midnight" ? data.theme : "cream",
          backgroundColor: typeof data.backgroundColor === "string" ? data.backgroundColor : "",
          buttonStyle: data.buttonStyle === "pill" || data.buttonStyle === "square" ? data.buttonStyle : "rounded",
          socialLinks: normalizeSocialLinks(data.socialLinks),
        });

        step = "links";
        unsubscribeLinks = onSnapshot(
          query(collection(firestore, "users", uid, "links"), orderBy("createdAt", "desc")),
          (snapshot) => {
            if (cancelled) return;
            const nextLinks = snapshot.docs.flatMap((linkDoc): Link[] => {
              const link = linkDoc.data();
              if (typeof link.title !== "string" || typeof link.url !== "string") return [];
              const categories: Link["category"][] = ["github", "blog", "portfolio", "project", "other"];
              if (link.isActive === false) return [];
              return [{
                id: linkDoc.id,
                title: link.title,
                url: link.url,
                description: typeof link.description === "string" ? link.description : "",
                category: categories.includes(link.category) ? link.category as Link["category"] : "other",
                clickCount: typeof link.clickCount === "number" ? link.clickCount : 0,
                thumbnailUrl: typeof link.thumbnailUrl === "string" ? link.thumbnailUrl : "",
                isActive: link.isActive !== false,
                isFeatured: link.isFeatured === true,
                sortOrder: typeof link.sortOrder === "number" ? link.sortOrder : undefined,
                updatedAt: link.updatedAt instanceof Timestamp ? link.updatedAt.toDate() : undefined,
              }];
            });
            setLinks(nextLinks.sort((a, b) => (a.sortOrder ?? 100000) - (b.sortOrder ?? 100000)));
            setError(null);
            setState("ready");
          },
          (snapshotError) => {
            if (cancelled) return;
            console.error("공개 링크 구독 실패:", snapshotError);
            setError({ step: "links", code: snapshotError.code, message: snapshotError.message });
            setState("error");
          }
        );
      } catch (cause) {
        if (cancelled) return;
        console.error(`공개 프로필 조회 실패 (${step}):`, cause);
        const firebaseError = cause as { code?: string; message?: string };
        setError({
          step,
          code: typeof firebaseError?.code === "string" ? firebaseError.code : undefined,
          message: typeof firebaseError?.message === "string" ? firebaseError.message : "조회 중 알 수 없는 오류가 발생했어요.",
        });
        setState("error");
      }
    }

    void Promise.resolve().then(() => {
      if (cancelled) return;
      setState("loading");
      setProfile(null);
      setLinks([]);
      setOwnerId("");
      setError(null);
      void loadProfile();
    });
    return () => {
      cancelled = true;
      unsubscribeLinks?.();
    };
  }, [username]);

  if (state === "missing") notFound();

  if (state === "loading") {
    return (
      <main className="mx-auto w-full max-w-[560px] px-4 py-8 text-body-2 text-muted-foreground" role="status">
        프로필을 불러오고 있어요.
      </main>
    );
  }

  if (state === "error") {
    const labels: Record<LoadStep, string> = {
      username: "공개 주소 조회",
      profile: "프로필 조회",
      links: "링크 목록 조회",
    };
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[560px] items-center px-4 py-8">
        <section className="w-full space-y-3 rounded-3xl border border-border bg-card p-6 text-center">
          <h1 className="text-title-1">프로필을 불러오지 못했어요</h1>
          <p role="alert" className="text-body-2 text-muted-foreground">
            {labels[error?.step ?? "profile"]}에 실패했어요. Firestore 연결과 권한을 확인해 주세요.
          </p>
          <p className="break-words text-caption text-muted-foreground">
            오류 코드: {error?.code ?? "unknown"}
          </p>
        </section>
      </main>
    );
  }

  if (!profile || !ownerId) return null;


  async function copyPublicUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast("프로필 주소를 복사했어요.");
    } catch {
      showToast("주소 복사에 실패했어요.", "error");
    }
  }

  async function shareProfile() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.displayName ?? "MyLink"} | MyLink`,
          text: profile?.bio || "내 링크를 확인해 보세요.",
          url: window.location.href,
        });
      } catch (cause) {
        if (cause instanceof Error && cause.name !== "AbortError") {
          await copyPublicUrl();
        }
      }
    } else {
      await copyPublicUrl();
    }
  }

  return (
    <div className="mylink-public min-h-screen pb-20" data-theme={profile.theme ?? "cream"} style={appearanceVariables(profile)}>
      <header className="relative z-20 mx-auto flex h-[76px] w-full max-w-5xl items-center justify-between px-5 sm:px-8">
        <NextLink href="/" className="inline-flex items-center gap-2 text-xl font-black tracking-[-0.07em]">
          <span className="inline-flex size-8 -rotate-6 items-center justify-center rounded-[10px] bg-[#252823] text-[#DDF76B] dark:bg-[#DDF76B] dark:text-[#252823]">
            <Link2 className="size-4" aria-hidden="true" />
          </span>
          mylink<span className="text-[#F06D4E]">.</span>
        </NextLink>
        <button type="button" onClick={() => void shareProfile()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#262920]/15 bg-white/85 px-5 text-sm font-extrabold text-[#252823] transition-transform hover:-translate-y-0.5 dark:border-white/20 dark:bg-[#282E29] dark:text-white">
          <Share2 className="size-4" aria-hidden="true" /> 공유하기
        </button>
      </header>

      <main className="relative mx-auto w-full max-w-[620px] px-5 pb-10 sm:px-7">
        <section className="relative mt-4 overflow-hidden rounded-[30px] border border-[#262920]/10 bg-white shadow-[0_22px_80px_rgba(52,48,34,0.08)] dark:border-white/10 dark:bg-[#282E29]">
          <div className="relative h-44 overflow-hidden sm:h-52" style={{ background: "var(--profile-cover)" }}>
            <div aria-hidden="true" className="absolute -left-10 -top-20 size-64 rounded-full border-[30px] border-white/35" />
            <div aria-hidden="true" className="absolute -right-10 -bottom-24 size-64 rounded-full bg-[#F6B59E]/70 blur-[3px]" />
            <span className="absolute bottom-4 right-5 rotate-[-7deg] text-[11px] font-black tracking-[0.13em] text-[#51632E]">MY LITTLE CORNER ✳</span>
          </div>
          <div className="relative px-6 pb-8 pt-16 text-center sm:px-10">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <Avatar className="size-24 border-[5px] border-white bg-[#EFF1E5] shadow-md">
                {profile.photoURL ? <AvatarImage src={profile.photoURL} alt={`${profile.displayName} 프로필 사진`} /> : null}
                <AvatarFallback className="text-3xl font-black">{profile.displayName.slice(0, 1) || "?"}</AvatarFallback>
              </Avatar>
            </div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#EFF5D6] px-3 py-1.5 text-xs font-extrabold text-[#526C36]">
              <span className="size-1.5 rounded-full bg-[#839D50]" /> @{profile.username}
            </div>
            <h1 className="break-words text-[clamp(1.9rem,5vw,2.7rem)] font-black leading-tight tracking-[-0.065em]">{profile.displayName}</h1>
            {profile.bio ? <p className="mx-auto mt-4 max-w-md whitespace-pre-wrap break-words text-sm leading-7 text-[#656B60] dark:text-white/70">{profile.bio}</p> : null}
            {profile.socialLinks && profile.socialLinks.length > 0 ? (
              <nav aria-label="SNS 프로필" className="mt-5 flex flex-wrap justify-center gap-2">
                {profile.socialLinks.map((item) => {
                  const SocialIcon = socialIconMap[item.platform] ?? Globe2;
                  return (
                    <a key={item.platform} href={item.url} target="_blank" rel="noopener noreferrer"
                      aria-label={`${item.platform} 열기`} title={item.platform}
                      className="flex size-11 items-center justify-center rounded-full border border-[#252823]/10 bg-[#F3F6E7] text-[#252823] transition-transform hover:-translate-y-1 dark:bg-white/10 dark:text-white">
                      <SocialIcon className="size-5" aria-hidden="true" />
                    </a>
                  );
                })}
              </nav>
            ) : null}
            <button type="button" onClick={() => void copyPublicUrl()}
              className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#252823]/15 bg-[#F7F6F0] px-4 text-xs font-bold text-[#444A3F] transition-colors hover:bg-[#DDF76B] dark:border-white/20 dark:bg-white/10 dark:text-white">
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "주소 복사 완료" : "내 페이지 주소 복사"}
            </button>
          </div>
        </section>

        <section className="mt-9 w-full" aria-label="공개 링크">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#D97757]">DISCOVER MORE</p>
              <h2 className="mt-1 text-[23px] font-black tracking-[-0.05em]">여기서 더 만나보세요.</h2>
            </div>
            <span className="rounded-full border border-[#262920]/15 px-3 py-1 text-xs font-bold dark:border-white/15">{links.length} links</span>
          </div>
          {links.length > 0 ? (
            <LinkList links={links} trackingUserId={ownerId} compact />
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#262920]/20 bg-white/60 px-6 py-12 text-center dark:border-white/20 dark:bg-white/5">
              <Link2 aria-hidden="true" className="mx-auto mb-3 size-8 text-[#89917D]" />
              <p className="text-sm text-[#73796D] dark:text-white/70">아직 등록된 링크가 없어요.</p>
            </div>
          )}
        </section>
        <div className="mt-12 flex items-center justify-center">
          <button type="button" onClick={() => void shareProfile()}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#252823] px-6 text-sm font-bold text-white transition-transform hover:-translate-y-1 dark:bg-[#DDF76B] dark:text-[#252823]">
            이 페이지 공유하기 <ArrowUpRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </main>
      <footer className="relative mx-auto mt-12 max-w-[620px] border-t border-[#262920]/10 px-5 py-8 text-center text-xs font-medium text-[#8A8D80] dark:border-white/10">
        <NextLink href="/" className="font-black tracking-tight text-[#4D5840] hover:underline dark:text-[#DDF76B]">made with mylink.</NextLink>
        <p className="mt-1">내 링크를 위한 작은 공간.</p>
      </footer>
    </div>
  );
}
