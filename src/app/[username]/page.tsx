import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { LinkList } from "@/components/links/LinkList";
import { getFirebaseFirestore } from "@/lib/firebase";
import type { Link } from "@/types/link";

export const instant = false;

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[560px] px-4 py-8 text-body-2 text-muted-foreground">
          프로필을 불러오고 있어요.
        </main>
      }
    >
      <PublicProfileContent params={params} />
    </Suspense>
  );
}

function PublicProfileError({
  message,
  errorCode,
}: {
  message: string;
  errorCode?: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[560px] items-center px-4 py-8">
      <section className="w-full space-y-3 rounded-3xl border border-border bg-card p-6 text-center">
        <h1 className="text-title-1">프로필을 불러오지 못했어요</h1>
        <p role="alert" className="text-body-2 text-muted-foreground">
          {message}
        </p>
        {errorCode ? (
          <p className="text-caption text-muted-foreground">
            오류 코드: {errorCode}
          </p>
        ) : null}
      </section>
    </main>
  );
}

async function PublicProfileContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  await connection();
  const { username } = await params;
  const firestore = getFirebaseFirestore();
  let usernameSnapshot;

  try {
    usernameSnapshot = await getDoc(
      doc(firestore, "usernames", username.toLowerCase())
    );
  } catch (error) {
    return (
      <PublicProfileError
        message="프로필 조회 권한이나 Firestore 설정을 확인해 주세요."
        errorCode={
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof error.code === "string"
            ? error.code
            : undefined
        }
      />
    );
  }

  if (!usernameSnapshot.exists()) notFound();

  const usernameRecord = usernameSnapshot.data();
  if (typeof usernameRecord.uid !== "string") notFound();
  const userId = usernameRecord.uid;
  let profileSnapshot;
  try {
    profileSnapshot = await getDoc(
      doc(firestore, "users", userId, "profile", "main")
    );
  } catch (error) {
    return (
      <PublicProfileError
        message="프로필 조회 권한이나 Firestore 설정을 확인해 주세요."
        errorCode={
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof error.code === "string"
            ? error.code
            : undefined
        }
      />
    );
  }
  if (!profileSnapshot.exists()) notFound();

  const profile = profileSnapshot.data();
  if (typeof profile.username !== "string" || !profile.username.trim()) {
    notFound();
  }
  if (profile.username.toLowerCase() !== username.toLowerCase()) notFound();

  let linksSnapshot;
  try {
    linksSnapshot = await getDocs(
      query(
        collection(firestore, "users", userId, "links"),
        orderBy("createdAt", "desc")
      )
    );
  } catch (error) {
    return (
      <PublicProfileError
        message="공개 링크를 불러올 수 없어요. Firestore 읽기 권한을 확인해 주세요."
        errorCode={
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof error.code === "string"
            ? error.code
            : undefined
        }
      />
    );
  }

  const links: Link[] = linksSnapshot.docs.flatMap((linkDocument) => {
    const data = linkDocument.data();
    if (typeof data.title !== "string" || typeof data.url !== "string") {
      return [];
    }

    return [
      {
        id: linkDocument.id,
        title: data.title,
        url: data.url,
        description:
          typeof data.description === "string" ? data.description : "",
        category:
          typeof data.category === "string" &&
          ["github", "blog", "portfolio", "project", "other"].includes(
            data.category
          )
            ? (data.category as Link["category"])
            : "other",
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : undefined,
      },
    ];
  });
  const displayName =
    typeof profile.displayName === "string" ? profile.displayName : username;
  const photoURL =
    typeof profile.photoURL === "string" ? profile.photoURL : null;
  const bio = typeof profile.bio === "string" ? profile.bio : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-4 bg-background px-4 py-6 text-foreground sm:py-8">
      <ProfileCard
        profile={{
          imageUrl: photoURL || null,
          imageAlt: `${displayName} 프로필 사진`,
          fallbackText: displayName.slice(0, 1) || "?",
          name: displayName,
          role: `@${profile.username}`,
          level: "MyLink 사용자",
          tagline: "",
          bio,
        }}
      />
      <section className="space-y-4" aria-labelledby="public-links-heading">
        <h2 id="public-links-heading" className="text-title-2">
          링크
        </h2>
        {links.length > 0 ? (
          <LinkList links={links} />
        ) : (
          <p className="rounded-2xl border border-border bg-card px-5 py-8 text-center text-body-2 text-muted-foreground">
            아직 공개된 링크가 없어요.
          </p>
        )}
      </section>
      <footer className="py-4 text-center text-caption text-muted-foreground">
        MyLink
      </footer>
    </main>
  );
}