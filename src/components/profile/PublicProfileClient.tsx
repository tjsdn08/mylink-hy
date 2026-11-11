"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query, Timestamp, setDoc, increment } from "firebase/firestore";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { ArrowUpRight, Check, Copy, Globe2, Link2, Share2 } from "lucide-react";
import { ProfileVisual } from "@/components/profile/ProfileVisual";
import { ProfileQrDialog } from "@/components/profile/ProfileQrDialog";
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

type LoadState = "loading" | "ready" | "missing" | "error";
type LoadStep = "username" | "profile" | "links";

export function PublicProfileClient({ username }: { username: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
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

        void setDoc(doc(firestore, "users", uid, "metrics", "profile"),
          { views: increment(1) }, { merge: true }).catch(() => {});
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
          coverStyle: data.coverStyle === "grid" || data.coverStyle === "minimal" ? data.coverStyle : "orbits",
          headline: typeof data.headline === "string" ? data.headline : "",
          about: typeof data.about === "string" ? data.about : "",
          now: typeof data.now === "string" ? data.now : "",
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
                group: typeof link.group === "string" ? link.group : "",
                category: categories.includes(link.category) ? link.category as Link["category"] : "other",
                clickCount: typeof link.clickCount === "number" ? link.clickCount : 0,
                isActive: link.isActive !== false,
                isFeatured: link.isFeatured === true,
                thumbnailUrl: typeof link.thumbnailUrl === "string" ? link.thumbnailUrl : "",
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
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-current/20 bg-transparent px-5 text-sm font-extrabold transition-transform hover:-translate-y-0.5 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-current">
          <Share2 className="size-4" aria-hidden="true" /> 공유하기
        </button>
      </header>

      <main className="relative mx-auto w-full max-w-[620px] px-5 pb-10 sm:px-7">
        <div className="mt-4 overflow-hidden rounded-[30px] border border-current/10 shadow-[0_22px_80px_rgba(52,48,34,0.08)]">
          <ProfileVisual profile={profile} links={links} trackingUserId={ownerId}>
            <button type="button" onClick={() => void copyPublicUrl()}
              className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-current/25 px-4 text-xs font-bold transition-colors hover:bg-black/10">
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "주소 복사 완료" : "내 페이지 주소 복사"}
            </button>
          </ProfileVisual>
        </div>
        <div className="mt-5 flex items-center justify-center">
          <button type="button" onClick={() => setQrOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-current/25 px-5 text-sm font-bold transition-colors hover:bg-white/10">
            내 프로필 QR 공유하기
          </button>
        </div>
        {qrOpen ? <ProfileQrDialog url={`${typeof window !== "undefined" ? window.location.origin : "https://mylink-hy.vercel.app"}/${encodeURIComponent(profile.username)}`}
          onClose={() => setQrOpen(false)} /> : null}
        <div className="mt-12 flex items-center justify-center">
          <button type="button" onClick={() => void shareProfile()}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-current/25 bg-transparent px-6 text-sm font-bold transition-transform hover:-translate-y-1 hover:bg-black/10">
            이 페이지 공유하기 <ArrowUpRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </main>
      <footer className="relative mx-auto mt-12 max-w-[620px] border-t border-current/20 px-5 py-8 text-center text-xs font-medium opacity-80">
        <NextLink href="/" className="font-black tracking-tight hover:underline">made with mylink.</NextLink>
        <p className="mt-1">내 링크를 위한 작은 공간.</p>
      </footer>
    </div>
  );
}
