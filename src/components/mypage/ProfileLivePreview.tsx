"use client";

import { Globe2, Link2 } from "lucide-react";
import { ProfilePhoneFrame } from "@/components/profile/ProfilePhoneFrame";
import type { ProfileAppearance } from "@/lib/profile-design";
import type { Link } from "@/types/link";

interface PreviewProps {
  username: string;
  displayName: string;
  bio: string;
  photoURL?: string;
  appearance: ProfileAppearance;
  links: Link[];
}

export function ProfileLivePreview({ username, displayName, bio, photoURL, appearance, links }: PreviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold tracking-[.18em] text-[#9C523A] dark:text-[#F0A58E]">LIVE PREVIEW</p>
          <h2 className="text-lg font-black">방문자에게 보이는 모습</h2>
        </div>
        <span className="rounded-full bg-[#E6F1C5] px-3 py-1 text-[11px] font-bold text-[#435E2C]">미리보기</span>
      </div>
      <ProfilePhoneFrame label="실시간 미리보기"
        profile={{ username, displayName, bio, photoURL, ...appearance }} links={links} />
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Globe2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        프로필과 디자인은 저장 후 공개돼요. 링크 순서 변경은 자동 저장돼요.
      </p>
      {username ? (
        <a href={`/${encodeURIComponent(username)}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#546D35] hover:underline dark:text-[#DDF76B]">
          <Link2 className="size-3.5" aria-hidden="true" /> 실제 공개 페이지 열기
        </a>
      ) : null}
    </div>
  );
}
