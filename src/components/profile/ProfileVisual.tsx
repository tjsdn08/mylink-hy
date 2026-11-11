"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpRight, Link2, Sparkles } from "lucide-react";
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
  interactive?: boolean;
  children?: React.ReactNode;
}

/** 랜딩, 편집 미리보기, 공개 프로필의 공통 시각 구조입니다. */
export function ProfileVisual({ profile, links, compact = false, trackingUserId, interactive = false, children }: ProfileVisualProps) {
  const social = normalizeSocialLinks(profile.socialLinks);
  const visibleLinks = [...links]
    .filter((link) => link.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 100000) - (b.sortOrder ?? 100000));

  const highlighted = visibleLinks.filter((link) => link.isFeatured).length;
  const hasDetails = Boolean(profile.bio.trim() || profile.headline?.trim() || social.length > 0);

  return (
    <div
      className={`profile-visual min-w-0 overflow-hidden ${compact ? "rounded-[28px]" : "rounded-[32px]"}`}
      data-theme={profile.theme ?? "cream"}
      data-cover={profile.coverStyle ?? "orbits"}
      style={appearanceVariables(profile)}
    >
      <section className="profile-visual-hero overflow-hidden bg-[var(--profile-button-bg)] text-[var(--profile-button-text)]">
        <div className={`profile-visual-cover relative overflow-hidden bg-[var(--profile-cover)] ${compact ? "h-[120px]" : "h-52 sm:h-60"}`}>
          <div aria-hidden="true" className="profile-cover-circle absolute -left-14 -top-24 size-64 rounded-full border-[35px] border-white/30" />
          <div aria-hidden="true" className="profile-cover-orb absolute -bottom-24 -right-12 size-64 rounded-full bg-[#F6B59E]/65" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/10 to-transparent" />
          <span className={`absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-white/75 px-3 py-1.5 font-extrabold tracking-[.13em] text-[#33432D] backdrop-blur ${compact ? "text-[8px]" : "text-[10px]"}`}>
            <Sparkles className="size-3" aria-hidden="true" /> PERSONAL SPACE
          </span>
          <span className={`absolute bottom-4 right-5 font-black tracking-[.12em] text-[#34452B]/85 ${compact ? "text-[8px]" : "text-[10px]"}`}>
            MY LITTLE CORNER ✳
          </span>
        </div>
        <div className={`relative text-center ${compact ? "px-4 pb-7 pt-12" : "px-6 pb-10 pt-16 sm:px-10"}`}>
          <div className={`absolute left-1/2 -translate-x-1/2 ${compact ? "-top-10" : "-top-14"}`}>
            <Avatar className={`border-[5px] border-white bg-[#EFF1E5] shadow-[0_10px_24px_rgba(37,40,35,.18)] ${compact ? "size-20" : "size-28"}`}>
              {profile.photoURL ? <AvatarImage src={profile.photoURL} alt={`${profile.displayName} 프로필 사진`} /> : null}
              <AvatarFallback className={compact ? "text-xl font-black" : "text-3xl font-black"}>
                {profile.displayName.slice(0, 1) || "?"}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#EAF2D2] px-3 py-1.5 text-xs font-extrabold text-[#405829]">
            @{profile.username}
          </span>
          <h2 className={`mt-3 break-words font-black leading-tight tracking-[-.06em] ${compact ? "text-[22px]" : "text-[clamp(2rem,5vw,2.9rem)]"}`}>
            {profile.displayName}
          </h2>
          {profile.headline ? <p className={`mx-auto mt-3 max-w-sm font-extrabold tracking-tight ${compact ? "text-[13px]" : "text-base"}`}>{profile.headline}</p> : null}
          {profile.bio ? <p className={`mx-auto mt-3 max-w-md whitespace-pre-wrap break-words leading-relaxed opacity-85 ${compact ? "text-xs" : "text-sm"}`}>{profile.bio}</p> : null}
          {!hasDetails && compact ? <p className="mt-3 text-xs leading-6 opacity-60">소개글과 SNS를 추가해 나만의 공간을 완성해 보세요.</p> : null}
          {social.length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="SNS 프로필">
              {social.map((item) => (
                compact && !interactive ? (
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
          <div className={`mx-auto mt-6 flex max-w-[310px] items-center justify-center gap-3 border-t border-current/10 pt-4 ${compact ? "text-[10px]" : "text-xs"}`}>
            <span className="inline-flex items-center gap-1.5 font-semibold opacity-75"><Link2 className="size-3.5" aria-hidden="true" /> {visibleLinks.length}개 링크</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-current opacity-30" />
            <span className="font-semibold opacity-75">{highlighted > 0 ? `추천 링크 ${highlighted}개` : "한곳에 모인 나의 기록"}</span>
          </div>
        </div>
      </section>

      <section aria-label="프로필 링크" className={`profile-visual-links ${compact ? "px-3 pb-6 pt-6" : "px-6 pb-10 pt-10 sm:px-10"}`}>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold tracking-[.2em] opacity-75">EXPLORE MY WORLD</p>
            <h3 className={`mt-1 font-black tracking-[-.045em] ${compact ? "text-[17px]" : "text-[25px]"}`}>여기서 더 만나보세요.</h3>
          </div>
          <span className="shrink-0 rounded-full border border-current/25 px-2.5 py-1 text-[10px] font-bold">{visibleLinks.length} links</span>
        </div>
        {visibleLinks.length ? (
          <div className={compact && !interactive ? "profile-visual-demo-links pointer-events-none" : undefined}>
            <LinkList links={visibleLinks} compact trackingUserId={interactive ? trackingUserId : undefined} />
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-current/30 p-6 text-center text-xs opacity-75">아직 등록된 링크가 없어요.</p>
        )}
      </section>
      {profile.about?.trim() || profile.now?.trim() ? (
        <div className={`grid gap-3 border-t border-current/10 ${compact ? "px-3 py-5" : "px-6 py-8 sm:px-10"}`}>
          {profile.about?.trim() ? (
            <section className="rounded-[20px] border border-current/10 bg-[var(--profile-button-bg)] p-5 text-[var(--profile-button-text)]">
              <p className="text-[10px] font-black tracking-[.2em] opacity-60">01 / ABOUT ME</p>
              <h3 className={`mt-2 font-black tracking-tight ${compact ? "text-base" : "text-xl"}`}>나에 대해</h3>
              <p className={`mt-3 whitespace-pre-wrap break-words leading-6 opacity-80 ${compact ? "text-xs" : "text-sm"}`}>{profile.about}</p>
            </section>
          ) : null}
          {profile.now?.trim() ? (
            <section className="rounded-[20px] border border-current/10 bg-[var(--profile-cover)] p-5 text-[var(--profile-cover-text)]">
              <p className="text-[10px] font-black tracking-[.2em] opacity-65">02 / CURRENTLY</p>
              <h3 className={`mt-2 font-black tracking-tight ${compact ? "text-base" : "text-xl"}`}>요즘 하고 있는 일</h3>
              <p className={`mt-3 whitespace-pre-wrap break-words leading-6 opacity-85 ${compact ? "text-xs" : "text-sm"}`}>{profile.now}</p>
            </section>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-center justify-center gap-1.5 border-t border-current/10 px-5 py-5 text-center text-[10px] font-bold tracking-[.02em] opacity-65">
        <ArrowUpRight className="size-3" aria-hidden="true" /> made with mylink.
      </div>
    </div>
  );
}
