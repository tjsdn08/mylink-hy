import type { Metadata } from "next";
import { connection } from "next/server";
import { getPublicOgProfile } from "@/lib/public-og-profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  await connection();
  const { username } = await params;
  const handle = username.toLowerCase();
  const valid = /^[a-z0-9_]{3,20}$/.test(handle);
  const profile = valid ? await getPublicOgProfile(handle) : null;
  const displayName = profile?.displayName || `@${handle}`;
  const title = `${displayName}의 프로필과 링크 모음`;
  const description = profile?.bio
    ? `${profile.bio.slice(0, 130)} | ${displayName}의 링크를 MyLink에서 만나보세요.`
    : `${displayName}의 프로젝트, 블로그, 포트폴리오 등 링크를 MyLink에서 확인하세요.`;
  const publicPath = `/${encodeURIComponent(handle)}`;
  const image = `${publicPath}/opengraph-image`;

  return {
    title,
    description,
    keywords: [displayName, handle, "MyLink", "프로필", "링크 모음", "포트폴리오"],
    robots: profile
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
      : { index: false, follow: false },
    alternates: { canonical: publicPath },
    openGraph: {
      type: "profile",
      locale: "ko_KR",
      siteName: "MyLink",
      url: publicPath,
      title: `${title} | MyLink`,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: `${displayName} MyLink 프로필` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | MyLink`,
      description,
      images: [image],
    },
  };
}

export default function UsernameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
