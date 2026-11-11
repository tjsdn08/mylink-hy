"use client";

import { useEffect } from "react";
import { Copy, X } from "lucide-react";
import { showToast } from "@/lib/toast";

interface Props {
  url: string;
  onClose: () => void;
}

export function ProfileQrDialog({ url, onClose }: Props) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      showToast("공개 프로필 주소를 복사했어요.");
    } catch {
      showToast("주소를 복사하지 못했어요.", "error");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4"
      role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="profile-qr-title"
        className="w-full max-w-sm rounded-[28px] bg-white p-6 text-[#252823] shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="profile-qr-title" className="text-lg font-black">내 프로필 QR 코드</h2>
          <button type="button" autoFocus onClick={onClose} aria-label="QR 코드 닫기"
            className="flex size-10 items-center justify-center rounded-xl hover:bg-[#F0F1E9]">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm text-[#6C7165]">카메라로 스캔하면 공개 프로필로 이동해요.</p>
        <div className="mx-auto mt-6 flex size-[236px] items-center justify-center rounded-2xl border border-[#E7E8DF] bg-white p-3">
          {/* QR 이미지는 외부 서비스에서 생성하며 공개 URL만 전달합니다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=8&data=${encodeURIComponent(url)}`}
            alt="공개 프로필 주소를 담은 QR 코드" width={210} height={210} referrerPolicy="no-referrer"
            className="size-[210px]" />
        </div>
        <p className="mt-4 break-all text-center text-xs text-[#626A5B]">{url}</p>
        <button type="button" onClick={() => void copy()}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#252823] font-bold text-white hover:bg-[#3B4234]">
          <Copy className="size-4" aria-hidden="true" /> 주소 복사
        </button>
        <p className="mt-3 text-center text-[11px] leading-5 text-[#7C8178]">QR 생성 시 공개 프로필 주소가 외부 QR 서비스로 전달됩니다.</p>
      </section>
    </div>
  );
}
