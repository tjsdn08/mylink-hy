import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const handle = username.toLowerCase();
  const title = `@${handle}의 링크 모음`;
  const description = `@${handle}의 프로필, 프로젝트, 블로그와 링크를 MyLink에서 확인하세요.`;
  return {
    title,
    description,
    alternates: { canonical: `/${encodeURIComponent(handle)}` },
    openGraph: {
      type: "profile",
      url: `/${encodeURIComponent(handle)}`,
      title: `${title} | MyLink`,
      description,
    },
    twitter: { card: "summary_large_image", title: `${title} | MyLink`, description },
  };
}

export default function UsernameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
