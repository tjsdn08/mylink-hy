"use client";
export type ToastKind = "success" | "error";
export const TOAST_EVENT = "mylink:toast";
export function showToast(message: string, kind: ToastKind = "success"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, kind } }));
}
