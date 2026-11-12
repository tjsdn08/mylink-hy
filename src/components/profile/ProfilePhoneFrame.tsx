"use client";

import { Link2 } from "lucide-react";
import { ProfileVisual, type ProfileVisualData } from "@/components/profile/ProfileVisual";
import type { Link } from "@/types/link";

interface ProfilePhoneFrameProps {
  profile: ProfileVisualData;
  links: Link[];
  label?: string;
  interactive?: boolean;
  trackingUserId?: string;
}

/** 온보딩 예시와 마이페이지 미리보기에서 동일한 휴대폰 프레임을 사용합니다. */
export function ProfilePhoneFrame({ profile, links, label = "미리보기", interactive = false, trackingUserId }: ProfilePhoneFrameProps) {
  return (
    <div className="mx-auto flex h-[460px] w-full max-w-[390px] flex-col overflow-hidden rounded-[32px] border-[6px] sm:h-[520px] border-[#252823] bg-[#252823] shadow-[0_20px_60px_rgba(24,28,25,.18)]">
      <div className="flex h-7 shrink-0 items-center justify-center bg-white">
        <div aria-hidden="true" className="h-1.5 w-16 rounded-full bg-[#B8B9BA]" />
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 bg-white px-4 py-3 text-[#252823]">
        <span className="inline-flex items-center gap-2 text-xs font-black tracking-tight">
          <Link2 className="size-4 text-[#49622E]" aria-hidden="true" /> mylink.
        </span>
        <span className="rounded-full bg-[#EAF4CB] px-3 py-1 text-[10px] font-extrabold text-[#405829]">{label}</span>
      </div>
      <div
        className="mylink-preview-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white"
        tabIndex={0}
        role="region"
        aria-label={`${label} 내용. 이 영역 안에서 스크롤해 전체 프로필을 확인할 수 있어요.`}
      >
        <ProfileVisual compact profile={profile} links={links} interactive={interactive} trackingUserId={trackingUserId} />
      </div>
    </div>
  );
}
