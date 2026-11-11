"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkFavicon } from "@/components/links/LinkFavicon";
import { LinkList } from "@/components/links/LinkList";
import { appearanceVariables, normalizeSocialLinks, type ProfileAppearance } from "@/lib/profile-design";
import type { Link as ProfileLink } from "@/types/link";

export interface ProfileVisualData extends ProfileAppearance {
  username: string;
  displayName: string;
  bio: string;
  photoURL?: string;
}

interface ProfileVisualProps {
  profile: ProfileVisualData;
  links: ProfileLink[];
  compact?: boolean;
  trackingUserId?: string;
  children?: React.ReactNode;
}

/** 랜딩, 편집 미리보기, 공개 프로필의 공통 시각 구조입니다. */
export function ProfileVisual({ profile, links, compact = false, trackingUserId, children }: ProfileVisualProps) {
  const social = normalizeSocialLinks(profile.socialLinks);
  const visibleLinks = [...links]
    .filter((link) => link.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 100000) - (b.sortOrder ?? 100000));

  return (
    <div
      className={`profile-visual min-w-0 overflow-hidden ${compact ? "rounded-[25px]" : "rounded-[30px]"}`}
      data-theme={profile.theme ?? "cream"}
      style={appearanceVariables(profile)}
    >
      <section className="profile-visual-hero overflow-hidden bg-[var(--profile-button-bg)] text-[var(--profile-button-text)]">
        <div className={`relative overflow-hidden bg-[var(--profile-cover)] ${compact ? "h-[92px]" : "h-44 sm:h-52"}`}>
          <div aria-hidden="true" className="absolute -left-10 -top-16 size-44 rounded-full border-[22px] border-white/30" />
          <div aria-hidden="true" className="absolute -bottom-20 -right-12 size-44 rounded-full bg-[#F6B59E]/60" />
          <span className={`absolute bottom-3 right-4 font-black tracking-[.12em] text-[#34452B]/85 ${compact ? "text-[8px]" : "text-[10px]"}`}>
            MY LITTLE CORNER ✳
          </span>
        </div>
        <div className={`relative text-center ${compact ? "px-4 pb-5 pt-11" : "px-6 pb-8 pt-16 sm:px-10"}`}>
          <div className={`absolute left-1/2 -translate-x-1/2 ${compact ? "-top-8" : "-top-12"}`}>
            <Avatar className={`border-[4px] border-white bg-[#EFF1E5] shadow-md ${compact ? "size-16" : "size-24"}`}>
              {profile.photoURL ? <AvatarImage src={profile.photoURL} alt={`${profile.displayName} 프로필 사진`} /> : null}
              <AvatarFallback className={compact ? "text-xl font-black" : "text-3xl font-black"}>
                {profile.displayName.slice(0, 1) || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#EAF2D2] px-3 py-1 text-xs font-extrabold text-[#405829]">
            @{profile.username}
          </span>
          <h2 className={`mt-3 break-words font-black leading-tight tracking-[-.05em] ${compact ? "text-lg" : "text-[clamp(1.9rem,5vw,2.7rem)]"}`}>
            {profile.displayName}
          </h2>
          {profile.bio ? <p className={`mx-auto mt-3 max-w-md whitespace-pre-wrap break-words leading-relaxed opacity-85 ${compact ? "text-xs" : "text-sm"}`}>{profile.bio}</p> : null}
          {social.length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="SNS 프로필">
              {social.map((item) => (
                compact ? (
                  <span key={item.platform} title={item.platform} className="flex size-9 items-center justify-center rounded-full border border-current/20">
                    <LinkFavicon url={item.url} className="size-5" />
                  </span>
                ) : (
                  <a key={item.platform} href={item.url} target="_blank" rel="noopener noreferrer" title={item.platform}
                    aria-label={`${item.platform} 열기`} className="flex size-11 items-center justify-center rounded-full border border-current/20 transition-colors hover:bg-black/5">
                    <LinkFavicon url={item.url} className="size-5" />
                  </a>
                )
              ))}
            </div>
          ) : null}
          {children}
        </div>
      </section>

      <section aria-label="프로필 링크" className={`profile-visual-links ${compact ? "px-3 pb-5 pt-5" : "px-5 pb-8 pt-8 sm:px-7"}`}>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold tracking-[.16em] opacity-75">DISCOVER MORE</p>
            <h3 className={`mt-1 font-black tracking-[-.045em] ${compact ? "text-base" : "text-[23px]"}`}>여기서 더 만나보세요.</h3>
          </div>
          <span className="shrink-0 rounded-full border border-current/25 px-2.5 py-1 text-[10px] font-bold">{visibleLinks.length} links</span>
        </div>
        {visibleLinks.length ? (
          <div className={compact ? "profile-visual-demo-links pointer-events-none" : undefined}>
            <LinkList links={visibleLinks} compact trackingUserId={compact ? undefined : trackingUserId} />
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-current/30 p-6 text-center text-xs opacity-75">아직 등록된 링크가 없어요.</p>
        )}
      </section>
      <div className="px-5 pb-5 text-center text-[10px] font-semibold opacity-65">
        made with mylink.
      </div>
    </div>
  );
}
