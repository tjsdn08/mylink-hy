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
    <section className="relative flex w-full flex-col items-center overflow-hidden rounded-[26px] border border-[#252823]/10 bg-white px-5 pb-8 pt-10 text-center shadow-[0_8px_30px_rgba(32,33,30,0.04)] dark:border-white/10 dark:bg-[#282E29]" aria-label="내 프로필">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(110deg,#E5F1BB_0%,#F6E5D8_48%,#E4E8F7_100%)] dark:opacity-40" />
      <div className="relative mt-8">
        <Avatar className="mb-4 size-24 border-[5px] border-white bg-muted shadow-lg">
          {photoURL ? <AvatarImage src={photoURL} alt={`${displayName} 프로필 사진`} /> : null}
          <AvatarFallback className="text-xl font-bold">{displayName.slice(0, 1) || "?"}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={onEdit}
          aria-label="프로필 수정"
          title="프로필 수정"
          className="absolute bottom-4 right-0 flex size-10 items-center justify-center rounded-full border-[3px] border-white bg-[#252823] shadow-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#DDF76B]"
        >
          <Pencil className="size-4 text-white" aria-hidden="true" />
        </button>
      </div>
      <h1 className="max-w-full break-words text-[28px] font-black tracking-[-0.055em]">{displayName}</h1>
      {username ? (
        <NextLink href={`/${encodeURIComponent(username)}`} className="mt-1 rounded-full bg-[#EFF5D6] px-3 py-1 text-xs font-extrabold text-[#526C36] hover:underline">
          @{username}
        </NextLink>
      ) : (
        <button type="button" className="mt-1 text-xs text-muted-foreground underline" onClick={onEdit}>
          Username 설정하기
        </button>
      )}
      <p className="mt-4 max-w-[480px] whitespace-pre-wrap break-words text-sm leading-7 text-[#62685D] dark:text-white/70">
        {bio || "나를 소개하는 문장을 입력해 보세요."}
      </p>
    </section>
  );
}
