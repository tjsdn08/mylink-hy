"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { TOAST_EVENT, type ToastKind } from "@/lib/toast";

type Notice = { id: number; message: string; kind: ToastKind };
const TOAST_DURATION = 5000;

export function ToastViewport() {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    let nextId = 0;
    const timeouts = new Map<number, ReturnType<typeof setTimeout>>();
    const remove = (id: number) => {
      setNotices((current) => current.filter((notice) => notice.id !== id));
      const timeout = timeouts.get(id);
      if (timeout) clearTimeout(timeout);
      timeouts.delete(id);
    };
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; kind?: ToastKind }>).detail;
      if (!detail || typeof detail.message !== "string" || !detail.message.trim()) return;
      const id = ++nextId;
      const notice: Notice = { id, message: detail.message, kind: detail.kind === "error" ? "error" : "success" };
      setNotices((current) => [...current.slice(-2), notice]);
      timeouts.set(id, setTimeout(() => remove(id), TOAST_DURATION));
    };

    // 클릭 등 비동기 작업이 완료되는 즉시 알림을 받아 표시합니다.
    window.addEventListener(TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  if (notices.length === 0) return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-4 bottom-5 z-[9999] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6" aria-live="polite" aria-atomic="false">
      {notices.map((notice) => {
        const NoticeIcon = notice.kind === "success" ? CheckCircle2 : CircleAlert;
        return (
          <div key={notice.id} role="status" className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 text-foreground shadow-tds-toast sm:min-w-[300px]">
            <NoticeIcon aria-hidden="true" className={`size-5 shrink-0 ${notice.kind === "success" ? "text-[#6B8544]" : "text-destructive"}`} />
            <span className="min-w-0 flex-1 text-sm font-medium">{notice.message}</span>
            <button type="button" aria-label="알림 닫기" onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-[#6B8544]">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
