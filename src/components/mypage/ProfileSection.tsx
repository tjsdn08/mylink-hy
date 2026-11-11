"use client";

import { useState, type FormEvent } from "react";
import NextLink from "next/link";
import { Check, Pencil, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileSectionProps {
  displayName: string;
  username: string;
  photoURL?: string;
  bio?: string;
  onEdit: () => void;
  onSaveInline?: (name: string, bio: string) => Promise<void>;
  onDraftChange?: (draft: { displayName: string; bio: string } | null) => void;
}

export function ProfileSection({ displayName, username, photoURL, bio = "", onEdit, onSaveInline, onDraftChange }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [bioDraft, setBioDraft] = useState(bio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEditing = () => {
    setNameDraft(displayName);
    setBioDraft(bio);
    setError("");
    setIsEditing(true);
  };
  const cancel = () => {
    if (saving) return;
    setIsEditing(false);
    setError("");
    onDraftChange?.(null);
  };
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSaveInline || saving) return;
    const nextName = nameDraft.trim();
    const nextBio = bioDraft.trim();
    if (!nextName) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (nextBio.length > 250) {
      setError("소개글은 250자 이내로 작성해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSaveInline(nextName, nextBio);
      setIsEditing(false);
      onDraftChange?.(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "프로필을 저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="relative flex w-full flex-col items-center overflow-hidden rounded-[26px] border border-[#252823]/10 bg-white px-5 pb-8 pt-10 text-center shadow-[0_8px_30px_rgba(32,33,30,0.04)] dark:border-white/10 dark:bg-[#282E29]" aria-label="내 프로필">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(110deg,#E5F1BB_0%,#F6E5D8_48%,#E4E8F7_100%)] dark:opacity-40" />
      <div className="relative mt-8">
        <Avatar className="mb-4 size-24 border-[5px] border-white bg-muted shadow-lg">
          {photoURL ? <AvatarImage src={photoURL} alt={`${displayName} 프로필 사진`} /> : null}
          <AvatarFallback className="text-xl font-bold">{displayName.slice(0, 1) || "?"}</AvatarFallback>
        </Avatar>
        <button type="button" onClick={onEdit} title="Username과 프로필 정보 수정" aria-label="Username 수정"
          className="absolute bottom-4 right-0 flex size-10 items-center justify-center rounded-full border-[3px] border-white bg-[#252823] shadow-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#DDF76B]">
          <Pencil className="size-4 text-white" aria-hidden="true" />
        </button>
      </div>
      {isEditing ? (
        <form onSubmit={(event) => void save(event)} className="mt-3 w-full max-w-md space-y-3 text-left"
          onKeyDown={(event) => { if (event.key === "Escape") cancel(); }}>
          <label className="block space-y-1 text-xs font-bold">
            <span>표시 이름</span>
            <input autoFocus value={nameDraft} maxLength={80}
              onChange={(event) => {
                setNameDraft(event.target.value);
                onDraftChange?.({ displayName: event.target.value, bio: bioDraft });
              }}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium" />
          </label>
          <label className="block space-y-1 text-xs font-bold">
            <span>소개글</span>
            <textarea value={bioDraft} maxLength={250} rows={3}
              onChange={(event) => {
                setBioDraft(event.target.value);
                onDraftChange?.({ displayName: nameDraft, bio: event.target.value });
              }}
              className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <p className="text-right text-xs text-muted-foreground">{bioDraft.length}/250</p>
          {error ? <p role="alert" className="text-xs font-medium text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancel} disabled={saving}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium"><X className="size-4" /> 취소</button>
            <button type="submit" disabled={saving}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-[#252823] px-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-[#DDF76B] dark:text-[#252823]">
              <Check className="size-4" /> {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <h2 className="max-w-full break-words text-[28px] font-black tracking-[-0.055em]">{displayName}</h2>
            {onSaveInline ? <button type="button" onClick={startEditing} className="rounded-full p-2 hover:bg-muted"
              aria-label="이름과 소개글 바로 수정" title="바로 수정"><Pencil className="size-4" aria-hidden="true" /></button> : null}
          </div>
          {username ? (
            <NextLink href={`/${encodeURIComponent(username)}`} className="mt-1 rounded-full bg-[#EFF5D6] px-3 py-1 text-xs font-extrabold text-[#526C36] hover:underline">@{username}</NextLink>
          ) : <button type="button" className="mt-1 text-xs text-muted-foreground underline" onClick={onEdit}>Username 설정하기</button>}
          <p className="mt-4 max-w-[480px] whitespace-pre-wrap break-words text-sm leading-7 text-[#62685D] dark:text-white/70">
            {bio || "나를 소개하는 문장을 입력해 보세요."}
          </p>
        </>
      )}
    </section>
  );
}
