import { connection } from "next/server";
import { generateOgImage, size, contentType } from "@/lib/og-image";
import { getPublicOgProfile } from "@/lib/public-og-profile";

export { size, contentType };
export const alt = "MyLink 공개 프로필 미리보기";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  await connection();
  const { username } = await params;
  const handle = /^[a-z0-9_]{3,20}$/.test(username.toLowerCase()) ? username.toLowerCase() : "profile";
  const profile = await getPublicOgProfile(handle);
  return generateOgImage(profile ?? { username: handle, displayName: handle, bio: "" });
}
