import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export type OgProfile = { username: string; displayName: string; bio: string };

function hasKorean(text: string) {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);
}

// 한글이 포함된 프로필을 공유할 때 필요한 문자만 폰트로 불러옵니다.
async function getKoreanFont(text: string): Promise<ArrayBuffer | null> {
  if (!hasKorean(text)) return null;
  try {
    const response = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=" + encodeURIComponent(text),
      {
        signal: AbortSignal.timeout(4500),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)" },
      }
    );
    if (!response.ok) return null;
    const css = await response.text();
    const source = css.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)\s*format\(['"]?(?:truetype|opentype|woff)['"]?\)/);
    if (!source) return null;
    const font = await fetch(source[1], { signal: AbortSignal.timeout(4500) });
    return font.ok ? font.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function generateOgImage(profile?: OgProfile) {
  const koreanText = profile ? [profile.displayName, profile.bio].join(" ").slice(0, 170) : "";
  const font = await getKoreanFont(koreanText);
  const showKorean = !hasKorean(koreanText) || Boolean(font);
  const name = profile ? (showKorean ? profile.displayName.slice(0, 20) : profile.username) : "One link.";
  const subline = profile ? (showKorean ? profile.bio.slice(0, 65) || "My links, all in one place." : "My links, all in one place.") : "Your story, beautifully connected.";
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", padding: "56px 64px",
        position: "relative", overflow: "hidden", backgroundColor: "#F9FBFF",
        color: "#191F28", fontFamily: font ? "NotoKR" : "Arial", flexDirection: "column" }}>
        <div style={{ display: "flex", position: "absolute", width: 560, height: 560,
          right: -100, top: -240, backgroundColor: "#E8F3FF", borderRadius: 300 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1 }}>
          <div style={{ display: "flex", width: 45, height: 45, borderRadius: 15,
            backgroundColor: "#3182F6", color: "#FFFFFF", fontSize: 27,
            fontWeight: 700, alignItems: "center", justifyContent: "center" }}>∞</div>
          <span style={{ display: "flex", fontSize: 29, fontWeight: 700 }}>
            My<span style={{ color: "#3182F6" }}>Link</span>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "row", alignItems: "center",
          flex: 1, width: "100%", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", width: "57%", paddingRight: 28 }}>
            <span style={{ display: "flex", alignSelf: "flex-start", borderRadius: 30,
              padding: "10px 18px", backgroundColor: "#E8F3FF", color: "#3182F6",
              fontSize: 16, fontWeight: 700 }}>
              {profile ? "PERSONAL LINK SPACE" : "ALL YOUR LINKS, ONE PLACE"}
            </span>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 27,
              fontSize: name.length > 13 ? 54 : 73, fontWeight: 700, lineHeight: 1.15 }}>
              <span>{name}</span>
              <span style={{ display: "flex", color: "#3182F6", fontSize: profile ? 42 : 73, marginTop: 6 }}>
                {profile ? `@${profile.username}` : "All of you."}
              </span>
            </div>
            <div style={{ display: "flex", marginTop: 29, fontSize: 22,
              lineHeight: 1.45, color: "#6B7684" }}>{subline}</div>
          </div>
          <div style={{ display: "flex", width: "43%", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 390, height: 398, flexDirection: "column",
              borderRadius: 30, border: "1px solid #E5E8EB", backgroundColor: "#FFFFFF",
              boxShadow: "0 15px 50px rgba(25,31,40,0.08)", padding: 28 }}>
              <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                <span style={{ display: "flex", width: 64, height: 64, borderRadius: 22,
                  alignItems: "center", justifyContent: "center", fontSize: 28,
                  backgroundColor: "#E8F3FF", color: "#3182F6", fontWeight: 700 }}>
                  {profile ? (showKorean ? name.slice(0, 1) : profile.username[0].toUpperCase()) : "M"}
                </span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ display: "flex", fontWeight: 700, fontSize: 22 }}>
                    {profile ? name.slice(0, 12) : "My profile"}
                  </span>
                  <span style={{ display: "flex", fontSize: 15, color: "#8B95A1", marginTop: 5 }}>
                    {profile ? `@${profile.username}` : "@yourname"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", height: 1, backgroundColor: "#E5E8EB",
                marginTop: 25, marginBottom: 23 }} />
              {["Projects", "Blog", "Portfolio"].map((label, index) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14,
                  marginBottom: 14, padding: "0 16px", height: 65,
                  borderRadius: 16, border: "1px solid #E5E8EB" }}>
                  <span style={{ display: "flex", width: 36, height: 36,
                    alignItems: "center", justifyContent: "center", borderRadius: 12,
                    fontSize: 20, color: "#3182F6",
                    backgroundColor: index === 0 ? "#E8F3FF" : "#F2F4F6" }}>↗</span>
                  <span style={{ display: "flex", flex: 1, fontWeight: 700, fontSize: 18 }}>{label}</span>
                  <span style={{ display: "flex", color: "#3182F6", fontSize: 21 }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", zIndex: 1, justifyContent: "space-between",
          color: "#8B95A1", fontSize: 18 }}>
          <span>mylink · all in one place</span>
          <span>mylink</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "NotoKR", data: font, weight: 700 as const, style: "normal" as const }] : [],
    }
  );
}
