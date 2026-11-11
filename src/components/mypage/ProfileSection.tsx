"use client";

import NextLink from "next/link";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileSectionProps {
  displayName: string;
  username: string;
  photoURL?: string;
  bio?: string;
  onEdit: () => void;
}

export function ProfileSection({ displayName, username, photoURL, bio, onEdit }: ProfileSectionProps) {
  return (
    <section className="relative flex w-full flex-col items-center pt-1 text-center" aria-label="내 프로필">
      <div className="relative">
        <Avatar className="mb-4 size-24 border-4 border-background bg-muted shadow-sm">
          {photoURL ? <AvatarImage src={photoURL} alt={`${displayName} 프로필 사진`} /> : null}
          <AvatarFallback className="text-xl font-bold">{displayName.slice(0, 1) || "?"}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={onEdit}
          aria-label="프로필 수정"
          title="프로필 수정"
          className="absolute bottom-4 right-0 flex size-9 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-[#5b5fc7]"
        >
          <Pencil className="size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
      <h1 className="max-w-full break-words text-2xl font-bold tracking-tight text-foreground">{displayName}</h1>
      {username ? (
        <NextLink href={`/${encodeURIComponent(username)}`} className="mt-1 text-sm font-medium text-[#5b5fc7] hover:underline">
          @{username}
        </NextLink>
      ) : (
        <button type="button" className="mt-1 text-xs text-muted-foreground underline" onClick={onEdit}>
          Username 설정하기
        </button>
      )}
      <p className="mt-3 max-w-[320px] whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
        {bio || "나를 소개하는 문장을 입력해 보세요."}
      </p>
    </section>
  );
}
