import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export type OgProfile = { username: string; displayName: string; bio: string; theme?: "cream" | "lavender" | "midnight"; backgroundColor?: string };

import { readFile } from "node:fs/promises";
import { join } from "node:path";

// 빌드·개발 서버 시작 전에 로컬로 복사한 폰트만 읽습니다.
// OG 이미지 요청에서는 Google Fonts나 CDN에 접속하지 않습니다.
let fontCache: Promise<ArrayBuffer> | undefined;
function getOgFont(): Promise<ArrayBuffer> {
  fontCache ??= readFile(join(process.cwd(), "public", "fonts", "noto-sans-kr-700.woff"))
    .then((buffer) => Uint8Array.from(buffer).buffer as ArrayBuffer)
    .catch((error: unknown) => {
      fontCache = undefined;
      throw new Error("로컬 OG 폰트가 없습니다. npm install 후 npm run dev 또는 npm run build를 실행하세요.", { cause: error });
    });
  return fontCache;
}


export async function generateOgImage(profile?: OgProfile) {
  const font = await getOgFont();
  const background = profile?.theme === "midnight" ? "#181C25" : profile?.theme === "lavender" ? "#F0EDFA" : "#F5F3E9";
  const cover = profile?.theme === "midnight" ? "#33465B" : profile?.theme === "lavender" ? "#DCD0F5" : "#DCECA8";
  const ink = profile?.theme === "midnight" ? "#F8F8FA" : "#252823";
  const showKorean = true;
  const name = profile ? (showKorean ? profile.displayName.slice(0, 20) : profile.username) : "One link.";
  const subline = profile ? (showKorean ? profile.bio.slice(0, 65) || "My links, all in one place." : "My links, all in one place.") : "Your story, beautifully connected.";
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", padding: "56px 64px",
        position: "relative", overflow: "hidden", backgroundColor: background,
        color: ink, fontFamily: "NotoKR", flexDirection: "column" }}>
        <div style={{ display: "flex", position: "absolute", width: 560, height: 560,
          right: -100, top: -240, backgroundColor: cover, borderRadius: 300 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", width: 45, height: 45, borderRadius: 15,
            backgroundColor: "#252823", color: "#DDF76B", fontSize: 27,
            fontWeight: 700, alignItems: "center", justifyContent: "center" }}>∞</div>
          <span style={{ display: "flex", fontSize: 29, fontWeight: 700 }}>
            my<span style={{ color: "#E87959" }}>link.</span>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "row", alignItems: "center",
          flex: 1, width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "57%", paddingRight: 28 }}>
            <span style={{ display: "flex", alignSelf: "flex-start", borderRadius: 30,
              padding: "10px 18px", backgroundColor: cover, color: "#252823",
              fontSize: 16, fontWeight: 700 }}>
              {profile ? "PERSONAL LINK SPACE" : "ALL YOUR LINKS, ONE PLACE"}
            </span>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 27,
              fontSize: name.length > 13 ? 54 : 73, fontWeight: 700, lineHeight: 1.15 }}>
              <span>{name}</span>
              <span style={{ display: "flex", color: profile?.theme === "midnight" ? "#DDF76B" : "#536B34", fontSize: profile ? 42 : 73, marginTop: 6 }}>
                {profile ? `@${profile.username}` : "All of you."}
              </span>
            </div>
            <div style={{ display: "flex", marginTop: 29, fontSize: 22,
              lineHeight: 1.45, color: profile?.theme === "midnight" ? "#C2C9BE" : "#50584E" }}>{subline}</div>
          </div>
          <div style={{ display: "flex", width: "43%", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 390, height: 398, flexDirection: "column",
              borderRadius: 30, border: "1px solid #CED5C2", backgroundColor: profile?.theme === "midnight" ? "#2C3440" : "#FFFFFF",
              boxShadow: "0 15px 50px rgba(25,31,40,0.08)", padding: 28 }}>
              <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                <span style={{ display: "flex", width: 64, height: 64, borderRadius: 22,
                  alignItems: "center", justifyContent: "center", fontSize: 28,
                  backgroundColor: cover, color: "#252823", fontWeight: 700 }}>
                  {profile ? (showKorean ? name.slice(0, 1) : profile.username[0].toUpperCase()) : "M"}
                </span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ display: "flex", fontWeight: 700, fontSize: 22 }}>
                    {profile ? name.slice(0, 12) : "My profile"}
                  </span>
                  <span style={{ display: "flex", fontSize: 15, color: profile?.theme === "midnight" ? "#C2C9BE" : "#637066", marginTop: 5 }}>
                    {profile ? `@${profile.username}` : "@yourname"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", height: 1, backgroundColor: profile?.theme === "midnight" ? "#536071" : "#D6DDCB",
                marginTop: 25, marginBottom: 23 }} />
              {["Projects", "Blog", "Portfolio"].map((label, index) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14,
                  marginBottom: 14, padding: "0 16px", height: 65,
                  borderRadius: 16, border: "1px solid #D6DDCB" }}>
                  <span style={{ display: "flex", width: 36, height: 36,
                    alignItems: "center", justifyContent: "center", borderRadius: 12,
                    fontSize: 20, color: "#40592C",
                    backgroundColor: index === 0 ? "#DCECA8" : "#EFF1EA" }}>↗</span>
                  <span style={{ display: "flex", flex: 1, fontWeight: 700, fontSize: 18 }}>{label}</span>
                  <span style={{ display: "flex", color: "#63834A", fontSize: 21 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          color: "#8B95A1", fontSize: 18 }}>
          <span>mylink · all in one place</span>
          <span>mylink</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "NotoKR", data: font, weight: 700 as const, style: "normal" as const }],
    }
  );
}
