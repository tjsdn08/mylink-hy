/**
 * 검색엔진과 SNS 공유 메타데이터에서 사용할 공개 서비스 주소입니다.
 * Production에서는 Vercel의 고정 프로덕션 URL을 우선합니다.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const hostname =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const origin = configured ?? (hostname ? `https://${hostname}` : "http://localhost:3000");
  return origin.replace(/\/+$/, "");
}
