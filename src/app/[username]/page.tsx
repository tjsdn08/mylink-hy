import { Suspense } from "react";
import { connection } from "next/server";
import { PublicProfileClient } from "@/components/profile/PublicProfileClient";

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

async function PublicProfileContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  await connection();
  const { username } = await params;
  return <PublicProfileClient username={username} />;
}
