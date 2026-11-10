"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { notFound } from "next/navigation";
import { LinkList } from "@/components/links/LinkList";
import { ProfileCard } from "@/components/profile/ProfileCard";
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
    <main className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-4 bg-background px-4 py-6 text-foreground sm:py-8">
      <ProfileCard
        profile={{
          imageUrl: profile.photoURL || null,
          imageAlt: `${profile.displayName} 프로필 사진`,
          fallbackText: profile.displayName.slice(0, 1) || "?",
          name: profile.displayName,
          role: `@${profile.username}`,
          level: "MyLink 사용자",
          tagline: "",
          bio: profile.bio,
        }}
      />
      <section className="space-y-4" aria-labelledby="public-links-heading">
        <h2 id="public-links-heading" className="text-title-2">링크</h2>
        {links.length > 0 ? (
          <LinkList links={links} trackingUserId={ownerId} />
        ) : (
          <p className="rounded-2xl border border-border bg-card px-5 py-8 text-center text-body-2 text-muted-foreground">
            아직 공개된 링크가 없어요.
          </p>
        )}
      </section>
      <footer className="py-4 text-center text-caption text-muted-foreground">MyLink</footer>
    </main>
  );
}
