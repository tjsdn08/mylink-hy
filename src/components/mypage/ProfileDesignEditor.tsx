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
  type SocialLink,
  type ProfileTheme,
  type ButtonStyle,
  type CoverStyle,
} from "@/lib/profile-design";

interface Props {
  userId: string;
  appearance: ProfileAppearance;
  onSaved: (next: ProfileAppearance) => void;
  onDraftChange?: (draft: ProfileAppearance | null) => void;
  onSocialOrderSaved?: (links: SocialLink[]) => void;
}

export function ProfileDesignEditor({ userId, appearance, onSaved, onDraftChange, onSocialOrderSaved }: Props) {
  const [theme, setTheme] = useState<ProfileTheme>(appearance.theme ?? "cream");
  const [backgroundColor, setBackgroundColor] = useState(appearance.backgroundColor ?? "");
  const [buttonColor, setButtonColor] = useState(appearance.buttonColor ?? "");
  const [textColor, setTextColor] = useState(appearance.textColor ?? "");
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(appearance.buttonStyle ?? "rounded");
  const [coverStyle, setCoverStyle] = useState<CoverStyle>(appearance.coverStyle ?? "orbits");
  const [headline, setHeadline] = useState(appearance.headline ?? "");
  const [about, setAbout] = useState(appearance.about ?? "");
  const [now, setNow] = useState(appearance.now ?? "");
  const [socialOrder, setSocialOrder] = useState<string[]>([
    ...(appearance.socialLinks ?? []).map((item) => item.platform),
    ...SOCIAL_PLATFORMS.filter((platform) => !(appearance.socialLinks ?? []).some((item) => item.platform === platform)),
  ]);
  const [socialUrls, setSocialUrls] = useState<Record<string, string>>(
    Object.fromEntries((appearance.socialLinks ?? []).map((item) => [item.platform, item.url]))
  );
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState("");

  const updateDraft = (patch: Partial<ProfileAppearance>) => {
    const next = {
      theme, backgroundColor, buttonColor, textColor, buttonStyle, coverStyle, headline, about, now,
      socialLinks: socialOrder.flatMap((platform) => {
        const url = socialUrls[platform]?.trim();
        return url ? [{ platform, url }] : [];
      }),
      ...patch,
    };
    onDraftChange?.(next);
  };

  async function moveSocial(fromPlatform: string, toPlatform: string) {
    if (saving || reordering || fromPlatform === toPlatform) return;
    const from = socialOrder.indexOf(fromPlatform);
    const to = socialOrder.indexOf(toPlatform);
    if (from < 0 || to < 0) return;
    const nextOrder = [...socialOrder];
    nextOrder.splice(from, 1);
    nextOrder.splice(to, 0, fromPlatform);

    const draftLinks = nextOrder.flatMap((platform) => {
      const url = socialUrls[platform]?.trim();
      return url ? [{ platform, url }] : [];
    });
    const storedLinks = nextOrder.flatMap((platform) =>
      (appearance.socialLinks ?? []).filter((item) => item.platform === platform)
    );

    setSocialOrder(nextOrder);
    updateDraft({ socialLinks: draftLinks });
    setReordering(true);
    try {
      // Existing saved SNS URLs are reordered; unsaved input changes are not
      // published until the user clicks the Design Save button.
      await updateDoc(doc(getFirebaseFirestore(), "users", userId, "profile", "main"),
        { socialLinks: storedLinks, updatedAt: serverTimestamp() });
      onSocialOrderSaved?.(storedLinks);
      showToast("SNS 순서를 자동 저장했어요.");
    } catch (cause) {
      setSocialOrder(socialOrder);
      updateDraft({ socialLinks: socialOrder.flatMap((platform) => {
        const url = socialUrls[platform]?.trim();
        return url ? [{ platform, url }] : [];
      }) });
      setError(cause instanceof Error ? cause.message : "SNS 순서를 저장하지 못했어요.");
    } finally {
      setReordering(false);
    }
  }

  async function saveDesign() {
    if (saving) return;
    setError("");
    if ([backgroundColor, buttonColor, textColor].some((color) => color && !validColor(color))) {
      setError("색상은 #RRGGBB 형식으로 입력해 주세요.");
      return;
    }
    if (about.trim().length > 600 || now.trim().length > 240) { setError("소개는 600자, 최근 활동은 240자 이내로 입력해 주세요."); return; }
    if (headline.trim().length > 60) { setError("한 줄 소개는 60자 이내로 입력해 주세요."); return; }
    const socialLinks: { platform: string; url: string }[] = [];
    for (const platform of socialOrder) {
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
      const next: ProfileAppearance = { theme, backgroundColor, buttonColor, textColor, buttonStyle, coverStyle, headline: headline.trim(), about: about.trim(), now: now.trim(), socialLinks };
      await updateDoc(doc(getFirebaseFirestore(), "users", userId, "profile", "main"), {
        ...next, updatedAt: serverTimestamp(),
      });
      onSaved(next);
      showToast("프로필 꾸미기와 SNS 변경사항을 저장했어요.");
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
          <p className="mt-2 text-sm text-muted-foreground">소개 문구, 커버, 링크 스타일과 SNS를 설정해 나만의 페이지를 꾸며 보세요.</p>
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
      <div className="space-y-2 border-t border-border pt-5">
        <label htmlFor="profile-headline" className="block text-sm font-extrabold">프로필 한 줄 소개</label>
        <input id="profile-headline" value={headline} maxLength={60} placeholder="예: 코드를 만들고 이야기를 기록하는 사람"
          onChange={(event) => { setHeadline(event.target.value); updateDraft({ headline: event.target.value }); }}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground" />
        <p className="text-right text-xs text-muted-foreground">{headline.length}/60 · 프로필 이름 아래에 표시돼요.</p>
      </div>
      <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
        <div>
          <h3 className="text-sm font-extrabold">나의 이야기</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">공개 페이지에 나만의 소개와 최근 활동을 추가해요. 입력하지 않으면 보이지 않아요.</p>
        </div>
        <label className="block space-y-2 text-xs font-bold">
          <span>About me · 나에 대해</span>
          <textarea rows={4} maxLength={600} value={about}
            placeholder="어떤 일을 하고, 무엇에 관심이 있는지 이야기해 보세요."
            onChange={(event) => { setAbout(event.target.value); updateDraft({ about: event.target.value }); }}
            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm font-normal text-foreground placeholder:text-muted-foreground" />
          <span className="block text-right font-normal text-muted-foreground">{about.length}/600</span>
        </label>
        <label className="block space-y-2 text-xs font-bold">
          <span>Now · 요즘 하고 있는 일</span>
          <textarea rows={2} maxLength={240} value={now}
            placeholder="요즘 집중하는 프로젝트나 목표를 적어 보세요."
            onChange={(event) => { setNow(event.target.value); updateDraft({ now: event.target.value }); }}
            className="w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm font-normal text-foreground placeholder:text-muted-foreground" />
          <span className="block text-right font-normal text-muted-foreground">{now.length}/240</span>
        </label>
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-extrabold">커버 패턴</legend>
        <div className="grid grid-cols-3 gap-2">
          {([
            ["orbits", "서클"],
            ["grid", "그리드"],
            ["minimal", "미니멀"],
          ] as const).map(([value, label]) => (
            <button type="button" key={value} aria-pressed={coverStyle === value}
              onClick={() => { setCoverStyle(value); updateDraft({ coverStyle: value }); }}
              className={`rounded-xl border-2 p-2 transition-colors ${coverStyle === value ? "border-[#6F8B40]" : "border-border"}`}>
              <span className={`profile-cover-swatch profile-cover-swatch-${value} block h-14 rounded-lg`}
                style={{ backgroundColor: THEME_PRESETS[theme].cover }} />
              <span className="mt-2 block text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </fieldset>
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
      <div className="grid gap-4 sm:grid-cols-2">
        {([
          { id: "profile-button-color", label: "링크 버튼 색상", value: buttonColor, preset: THEME_PRESETS[theme].button,
            set: setButtonColor, prop: "buttonColor" as const },
          { id: "profile-text-color", label: "프로필 글자 색상", value: textColor, preset: THEME_PRESETS[theme].foreground,
            set: setTextColor, prop: "textColor" as const },
        ]).map(({ id, label, value, preset, set, prop }) => (
          <div key={id} className="space-y-2">
            <label htmlFor={id} className="text-sm font-extrabold">{label}</label>
            <div className="flex items-center gap-3">
              <input id={id} type="color" value={validColor(value) ?? preset}
                onChange={(event) => { set(event.target.value); updateDraft({ [prop]: event.target.value }); }}
                className="size-11 cursor-pointer rounded-lg border border-border bg-transparent p-1" />
              <button type="button" onClick={() => { set(""); updateDraft({ [prop]: "" }); }}
                className="text-xs text-muted-foreground underline">테마 기본색</button>
            </div>
            <p className="text-xs text-muted-foreground">텍스트 대비를 확인한 후 저장해 주세요.</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-5">
        <h3 className="flex items-center gap-2 text-sm font-extrabold"><Share2 className="size-4" aria-hidden="true" /> SNS 아이콘</h3>
        <p className="mt-1 text-xs text-muted-foreground">주소를 입력한 플랫폼만 표시돼요. 순서는 드래그 또는 화살표로 변경하면 자동 저장돼요. URL 수정은 디자인 저장이 필요해요.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {socialOrder.map((platform, index) => (
            <div key={platform} draggable={!saving && !reordering}
              onDragStart={(event) => event.dataTransfer.setData("text/plain", platform)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); const from = event.dataTransfer.getData("text/plain"); if (from) void moveSocial(from, platform); }}
              className="space-y-1.5 rounded-lg border border-border/50 p-2 text-xs font-semibold">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`social-${platform}`}>{platform}</label>
                <span className="flex gap-1">
                  <button type="button" disabled={reordering || saving || index === 0} aria-label={`${platform} 위로 이동`}
                    onClick={() => void moveSocial(platform, socialOrder[index - 1])}
                    className="rounded border border-border px-2 py-1 disabled:opacity-30">↑</button>
                  <button type="button" disabled={reordering || saving || index === socialOrder.length - 1} aria-label={`${platform} 아래로 이동`}
                    onClick={() => void moveSocial(platform, socialOrder[index + 1])}
                    className="rounded border border-border px-2 py-1 disabled:opacity-30">↓</button>
                </span>
              </div>
              <input id={`social-${platform}`} type="url" value={socialUrls[platform] ?? ""} placeholder="https://..."
                onChange={(event) => {
                  const value = event.target.value;
                  const nextUrls = { ...socialUrls, [platform]: value };
                  setSocialUrls(nextUrls);
                  onDraftChange?.({ theme, backgroundColor, buttonColor, textColor, buttonStyle, coverStyle, headline, about, now,
                    socialLinks: socialOrder.flatMap((p) => nextUrls[p]?.trim() ? [{ platform: p, url: nextUrls[p].trim() }] : []),
                  });
                }}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal text-foreground placeholder:text-muted-foreground outline-none focus:border-[#71864D]" />
            </div>
          ))}
        </div>
      </div>
      {error ? <p role="alert" className="text-sm font-semibold text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">미리보기는 입력 즉시 바뀌지만, 방문자에게는 ‘디자인 저장’ 이후 반영돼요.</p>
    </section>
  );
}
