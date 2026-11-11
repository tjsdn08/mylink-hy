"use client";

import { useState } from "react";
import { Globe2 } from "lucide-react";

/** 사이트 파비콘 로드가 실패하면 기본 아이콘을 표시합니다. */
export function LinkFavicon({ url, className = "size-5" }: { url: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  let hostname: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("URL");
    hostname = parsed.hostname;
  } catch {
    return <Globe2 aria-hidden="true" className={className} />;
  }
  if (failed === url) return <Globe2 aria-hidden="true" className={className} />;
  return (
    // 임의 도메인을 사용하는 링크 모음이므로 Next Image의 원격 호스트 목록을 요구하지 않습니다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      referrerPolicy="no-referrer"
      width={24}
      height={24}
      onError={() => setFailed(url)}
      className={`${className} rounded-sm object-contain`}
    />
  );
}
