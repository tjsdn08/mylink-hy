"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { Globe2, Link2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkList } from "@/components/links/LinkList";
import { getFirebaseFirestore } from "@/lib/firebase";
import type { Link } from "@/types/link";

interface PublicProfile {
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

        setOwnerId(uid);
        setProfile({
          username: usernameKey,
          displayName: typeof data.displayName === "string" ? data.displayName : usernameKey,
          photoURL: typeof data.photoURL === "string" ? data.photoURL : "",
          bio: typeof data.bio === "string" ? data.bio : "",
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
              return [{
                id: linkDoc.id,
                title: link.title,
                url: link.url,
                description: typeof link.description === "string" ? link.description : "",
                category: categories.includes(link.category) ? link.category as Link["category"] : "other",
                clickCount: typeof link.clickCount === "number" ? link.clickCount : 0,
                updatedAt: link.updatedAt instanceof Timestamp ? link.updatedAt.toDate() : undefined,
              }];
            });
            setLinks(nextLinks);
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

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border/50 bg-background/90 px-5 backdrop-blur-md">
        <NextLink href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Globe2 aria-hidden="true" className="size-5 text-[#5b5fc7]" /> MyLink
        </NextLink>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-4 pt-10">
        <section className="flex w-full flex-col items-center text-center">
          <Avatar className="mb-4 size-24 border-4 border-background bg-muted shadow-sm">
            {profile.photoURL ? <AvatarImage src={profile.photoURL} alt={`${profile.displayName} 프로필 사진`} /> : null}
            <AvatarFallback className="text-xl font-semibold">{profile.displayName.slice(0, 1) || "?"}</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold tracking-tight">{profile.displayName}</h1>
          {profile.bio ? <p className="mt-3 max-w-[300px] whitespace-pre-wrap break-words text-sm leading-relaxed">{profile.bio}</p> : null}
        </section>
        <section className="w-full" aria-label="공개 링크">
          {links.length > 0 ? (
            <LinkList links={links} trackingUserId={ownerId} compact />
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <Link2 aria-hidden="true" className="mb-3 size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">아직 등록된 링크가 없습니다.</p>
            </div>
          )}
        </section>
      </main>
      <footer className="mt-16 py-8 text-center text-xs font-semibold text-muted-foreground">
        <Globe2 aria-hidden="true" className="mr-1 inline size-3" /> Powered by MyLink
      </footer>
    </div>
  );
}
