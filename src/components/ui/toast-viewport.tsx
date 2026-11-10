"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { TOAST_EVENT, type ToastKind } from "@/lib/toast";

type Notice = { message: string; kind: ToastKind };
export function ToastViewport() {
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<Notice>).detail;
      if (typeof detail?.message !== "string") return;
      if (timer) clearTimeout(timer);
      setNotice(detail);
      timer = setTimeout(() => setNotice(null), 4000);
    };
    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      if (timer) clearTimeout(timer);
    };
  }, []);
  if (!notice) return null;
  const Icon = notice.kind === "success" ? CheckCircle2 : CircleAlert;
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-5 z-[100] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6" role="status" aria-live="polite">
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5 text-foreground shadow-tds-toast sm:min-w-[300px]">
        <Icon aria-hidden="true" className={`size-5 shrink-0 ${notice.kind === "success" ? "text-primary" : "text-destructive"}`} />
        <p className="min-w-0 flex-1 text-sm font-semibold">{notice.message}</p>
        <button type="button" aria-label="알림 닫기" onClick={() => setNotice(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"><X aria-hidden="true" className="size-4" /></button>
      </div>
    </div>
  );
}
