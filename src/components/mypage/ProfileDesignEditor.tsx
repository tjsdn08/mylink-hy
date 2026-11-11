"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Check, Palette, Save, Share2 } from "lucide-react";
import { getFirebaseFirestore } from "@/lib/firebase";
import { showToast } from "@/lib/toast";
import {
  SOCIAL_PLATFORMS,
  THEME_PRESETS,
  safeHttpUrl,
  validColor,
  type ProfileAppearance,
  type ProfileTheme,
  type ButtonStyle,
} from "@/lib/profile-design";

interface Props {
  userId: string;
  appearance: ProfileAppearance;
  onSaved: (next: ProfileAppearance) => void;
  onDraftChange?: (draft: ProfileAppearance) => void;
}

export function ProfileDesignEditor({ userId, appearance, onSaved, onDraftChange }: Props) {
  const [theme, setTheme] = useState<ProfileTheme>(appearance.theme ?? "cream");
  const [backgroundColor, setBackgroundColor] = useState(appearance.backgroundColor ?? "");
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(appearance.buttonStyle ?? "rounded");
  const [socialUrls, setSocialUrls] = useState<Record<string, string>>(
    Object.fromEntries((appearance.socialLinks ?? []).map((item) => [item.platform, item.url]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateDraft = (patch: Partial<ProfileAppearance>) => {
    const next = {
      theme, backgroundColor, buttonStyle,
      socialLinks: SOCIAL_PLATFORMS.flatMap((platform) => {
        const url = socialUrls[platform]?.trim();
        return url ? [{ platform, url }] : [];
      }),
      ...patch,
    };
    onDraftChange?.(next);
  };

  async function saveDesign() {
    setError("");
    if (backgroundColor && !validColor(backgroundColor)) {
      setError("배경색은 #RRGGBB 형식으로 입력해 주세요.");
      return;
    }
    const socialLinks: { platform: string; url: string }[] = [];
    for (const platform of SOCIAL_PLATFORMS) {
      const input = (socialUrls[platform] ?? "").trim();
      if (!input) continue;
      const url = safeHttpUrl(input);
      if (!url) {
        setError(`${platform} 링크는 http 또는 https URL이어야 해요.`);
        return;
      }
      socialLinks.push({ platform, url });
    }
    setSaving(true);
    try {
      const next: ProfileAppearance = { theme, backgroundColor, buttonStyle, socialLinks };
      await updateDoc(doc(getFirebaseFirestore(), "users", userId, "profile", "main"), {
        ...next, updatedAt: serverTimestamp(),
      });
      onSaved(next);
      showToast("프로필 디자인과 SNS가 저장되었어요.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "디자인을 저장하지 못했어요.");
    } finally { setSaving(false); }
  }

  return (
    <section className="w-full space-y-6 rounded-[26px] border border-[#252823]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#282E29] dark:text-[#F8F6F1] sm:p-7" aria-label="프로필 디자인 설정">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#B95C45]">PERSONALIZE</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight"><Palette className="size-5" aria-hidden="true" /> 디자인과 SNS</h2>
          <p className="mt-2 text-sm text-muted-foreground">공개 프로필의 배경, 링크 버튼, SNS 아이콘을 꾸며 보세요.</p>
        </div>
        <button type="button" onClick={() => void saveDesign()} disabled={saving}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#252823] px-5 text-sm font-bold text-white hover:bg-[#40483A] disabled:opacity-50 dark:bg-[#DDF76B] dark:text-[#252823]">
          <Save className="size-4" aria-hidden="true" /> {saving ? "저장 중..." : "디자인 저장"}
        </button>
      </div>
      <div>
        <p className="mb-3 text-sm font-extrabold">테마 선택</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {(Object.keys(THEME_PRESETS) as ProfileTheme[]).map((key) => {
            const item = THEME_PRESETS[key];
            return (
              <button type="button" key={key} aria-pressed={theme === key}
                onClick={() => { setTheme(key); setBackgroundColor(""); updateDraft({ theme: key, backgroundColor: "" }); }}
                className={`rounded-2xl border-2 p-2 text-left text-foreground transition-colors ${theme === key ? "border-[#637D40]" : "border-transparent hover:border-[#B3C18F]"}`}>
                <span className="relative block h-20 rounded-xl" style={{ backgroundColor: item.background }}>
                  <span className="absolute bottom-3 left-3 right-3 h-6 rounded-md" style={{ backgroundColor: item.button }} />
                  {theme === key ? <Check className="absolute right-2 top-2 size-5 text-[#637D40]" aria-hidden="true" /> : null}
                </span>
                <span className="mt-2 block text-xs font-bold text-foreground">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-background" className="mb-2 block text-sm font-extrabold">배경색 직접 지정</label>
          <div className="flex items-center gap-3">
            <input type="color" id="profile-background" aria-label="배경색 고르기" value={validColor(backgroundColor) ?? THEME_PRESETS[theme].background}
              onChange={(event) => { setBackgroundColor(event.target.value); updateDraft({ backgroundColor: event.target.value }); }} className="size-11 cursor-pointer rounded-lg border border-border bg-transparent p-1" />
            <button type="button" onClick={() => { setBackgroundColor(""); updateDraft({ backgroundColor: "" }); }} className="text-xs font-medium text-muted-foreground underline">테마 기본색</button>
            {backgroundColor ? <span className="text-xs tabular-nums text-muted-foreground">{backgroundColor}</span> : null}
          </div>
        </div>
        <div>
          <label htmlFor="profile-button-style" className="mb-2 block text-sm font-extrabold">링크 버튼 모양</label>
          <select id="profile-button-style" value={buttonStyle} onChange={(event) => { const value = event.target.value as ButtonStyle; setButtonStyle(value); updateDraft({ buttonStyle: value }); }}
            className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground">
            <option value="rounded">둥근 모서리</option>
            <option value="pill">캡슐형</option>
            <option value="square">각진 모서리</option>
          </select>
        </div>
      </div>
      <div className="border-t border-border pt-5">
        <h3 className="flex items-center gap-2 text-sm font-extrabold"><Share2 className="size-4" aria-hidden="true" /> SNS 아이콘</h3>
        <p className="mt-1 text-xs text-muted-foreground">주소를 입력한 플랫폼만 공개 프로필에 표시돼요.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <label key={platform} className="space-y-1.5 text-xs font-semibold">
              <span>{platform}</span>
              <input type="url" value={socialUrls[platform] ?? ""} placeholder="https://..."
                onChange={(event) => {
                  const value = event.target.value;
                  const nextUrls = { ...socialUrls, [platform]: value };
                  setSocialUrls(nextUrls);
                  onDraftChange?.({ theme, backgroundColor, buttonStyle,
                    socialLinks: SOCIAL_PLATFORMS.flatMap((p) => nextUrls[p]?.trim() ? [{ platform: p, url: nextUrls[p].trim() }] : []),
                  });
                }}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal text-foreground placeholder:text-muted-foreground outline-none focus:border-[#71864D]" />
            </label>
          ))}
        </div>
      </div>
      {error ? <p role="alert" className="text-sm font-semibold text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">변경 사항은 ‘디자인 저장’을 누르면 공개 페이지에 반영돼요.</p>
    </section>
  );
}
