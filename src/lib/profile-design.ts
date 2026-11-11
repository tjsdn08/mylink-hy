import type { CSSProperties } from "react";

export type ProfileTheme = "cream" | "lavender" | "midnight";
export type ButtonStyle = "rounded" | "pill" | "square";
export type CoverStyle = "orbits" | "grid" | "minimal";
export type SocialLink = { platform: string; url: string };
export type ProfileAppearance = {
  theme?: ProfileTheme;
  backgroundColor?: string;
  buttonStyle?: ButtonStyle;
  coverStyle?: CoverStyle;
  headline?: string;
  socialLinks?: SocialLink[];
};

export const THEME_PRESETS = {
  cream: { name: "크림 & 라임", background: "#F5F3E9", foreground: "#252823", button: "#FFFFFF", outline: "#C8CEB7", cover: "#DCECA8" },
  lavender: { name: "라벤더", background: "#F0EDFA", foreground: "#302B48", button: "#FFFFFF", outline: "#D7D0EC", cover: "#DCD0F5" },
  midnight: { name: "미드나잇", background: "#181C25", foreground: "#F8F8FA", button: "#2C3440", outline: "#4B5963", cover: "#33465B" },
} as const;

export const SOCIAL_PLATFORMS = ["Instagram", "GitHub", "YouTube", "TikTok", "LinkedIn", "X", "Blog", "Website"] as const;

export function safeHttpUrl(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch { return null; }
}

export function validColor(value: string | undefined): string | null {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
}

function readableInk(background: string): string {
  const values = [1, 3, 5].map((index) => parseInt(background.slice(index, index + 2), 16) / 255);
  const luminance = values.map((n) => n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4) * 1);
  return 0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2] > 0.36 ? "#252823" : "#FFFFFF";
}

export function appearanceVariables(value: ProfileAppearance): CSSProperties {
  const preset = THEME_PRESETS[value.theme && value.theme in THEME_PRESETS ? value.theme : "cream"];
  const background = validColor(value.backgroundColor) ?? preset.background;
  const ink = readableInk(background);
  const buttonInk = readableInk(preset.button);
  const radius = value.buttonStyle === "pill" ? "999px" : value.buttonStyle === "square" ? "9px" : "19px";
  return {
    backgroundColor: background,
    color: ink,
    "--profile-background": background,
    "--profile-text": ink,
    "--profile-button-bg": preset.button,
    "--profile-button-text": buttonInk,
    "--profile-cover": preset.cover,
    "--profile-outline": preset.outline,
    "--profile-radius": radius,
  } as CSSProperties;
}

export function normalizeSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): SocialLink[] => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    if (typeof entry.platform !== "string" || !SOCIAL_PLATFORMS.some((p) => p === entry.platform)) return [];
    const url = typeof entry.url === "string" ? safeHttpUrl(entry.url) : null;
    return url ? [{ platform: entry.platform, url }] : [];
  }).slice(0, 8);
}
