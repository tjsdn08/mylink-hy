"use client";

import { useMemo } from "react";
import { ExternalLink, Globe2, Link2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkFavicon } from "@/components/links/LinkFavicon";
import { appearanceVariables, normalizeSocialLinks, type ProfileAppearance } from "@/lib/profile-design";
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
  const visible = useMemo(() => links.filter((item) => item.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 100000) - (b.sortOrder ?? 100000)), [links]);
  const social = normalizeSocialLinks(appearance.socialLinks);
  const groups = [...new Set(visible.map((link) => link.group?.trim() || ""))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold tracking-[.18em] text-[#D97757]">LIVE PREVIEW</p>
          <h2 className="text-lg font-black">방문자에게 보이는 모습</h2>
        </div>
        <span className="rounded-full bg-[#E6F1C5] px-3 py-1 text-[11px] font-bold text-[#435E2C]">미리보기</span>
      </div>
      <div className="mylink-preview overflow-hidden rounded-[30px] border-[5px] border-[#252823] shadow-[0_16px_48px_rgba(37,40,35,.13)]"
        style={appearanceVariables(appearance)}>
        <div className="h-20" style={{ background: "var(--profile-cover)" }} />
        <div className="px-4 pb-7 text-center">
          <Avatar className="mx-auto -mt-9 size-[72px] border-4 border-white shadow-md">
            {photoURL ? <AvatarImage src={photoURL} alt="프로필 이미지" /> : null}
            <AvatarFallback className="text-xl font-bold">{displayName.slice(0, 1) || "?"}</AvatarFallback>
          </Avatar>
          <p className="mt-3 break-words text-lg font-extrabold">{displayName || "이름을 입력해 주세요"}</p>
          <p className="mt-1 text-xs opacity-80">@{username || "username"}</p>
          {bio ? <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 opacity-90">{bio}</p> : null}
          {social.length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {social.map((item) => <span key={item.platform} className="inline-flex size-9 items-center justify-center rounded-full border border-current/15 bg-white/10" title={item.platform}>
                <LinkFavicon url={item.url} className="size-4" />
              </span>)}
            </div>
          ) : null}
          <div className="mt-6 space-y-3 text-left">
            {groups.map((group) => {
              const items = visible.filter((link) => (link.group?.trim() || "") === group);
              return <section key={group || "default"} className="space-y-2">
                {group ? <h3 className="px-1 text-xs font-bold opacity-75">{group}</h3> : null}
                {items.map((item) => <div key={item.id} className="flex items-center gap-3 border px-3 py-3 text-xs"
                  style={{ borderColor: "var(--profile-outline)", background: "var(--profile-button-bg)", color: "var(--profile-button-text)", borderRadius: "var(--profile-radius)" }}>
                  <LinkFavicon url={item.url} className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-bold">{item.title}{item.isFeatured ? " ★" : ""}</span>
                  <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden="true" />
                </div>)}
              </section>;
            })}
            {visible.length === 0 ? <p className="py-4 text-center text-xs opacity-60">링크를 추가하면 여기에 나타나요.</p> : null}
          </div>
        </div>
      </div>
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Globe2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        프로필과 디자인은 저장 후 공개돼요. 링크 순서 변경은 자동 저장돼요.
      </p>
      {username ? <a href={`/${encodeURIComponent(username)}`} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-bold text-[#546D35] hover:underline"><Link2 className="size-3.5" /> 실제 공개 페이지 열기</a> : null}
    </div>
  );
}
