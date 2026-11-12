"use client";

import { useState, type FormEvent } from "react";
import { saveUserProfile, type UserProfileDocument } from "@/lib/user-profile";

const RESERVED = new Set(["api", "dashboard", "login", "links", "onboarding", "mypage", "settings", "stats"]);

interface Props {
  profile: UserProfileDocument;
  onComplete: (profile: UserProfileDocument) => void;
}

/** 최초 가입자의 공개 URL을 설정하기 전에는 편집 기능을 열지 않습니다. */
export function ProfileOnboarding({ profile, onComplete }: Props) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const name = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(name) || RESERVED.has(name)) {
      setError("아이디는 영문 소문자·숫자·밑줄 3~20자로 설정하고 예약어는 제외해 주세요.");
      return;
    }
    if (!displayName.trim()) {
      setError("표시 이름을 입력해 주세요.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await saveUserProfile(profile.uid, { username: name, displayName: displayName.trim(), bio: bio.trim() });
      onComplete({ ...profile, username: name, displayName: displayName.trim(), bio: bio.trim() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "프로필을 저장하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F6F1] px-5 py-12 text-[#252823]">
      <div className="w-full max-w-lg rounded-[28px] border border-[#DCE2CE] bg-white p-6 shadow-lg sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#648040]">WELCOME TO MYLINK</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight">나만의 페이지를 시작해요.</h1>
        <p className="mt-3 text-sm leading-6 text-[#5A6257]">공유할 주소와 표시 이름을 정하면 바로 링크를 등록할 수 있어요. 기존에 사용 중인 아이디와 중복되지 않아야 해요.</p>
        <form className="mt-7 space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <label htmlFor="onboarding-username" className="text-sm font-bold">고유 아이디 <span aria-hidden="true">*</span></label>
            <div className="flex items-center rounded-xl border border-[#C8D0C0] bg-white px-3 focus-within:ring-2 focus-within:ring-[#6B8544]">
              <span className="shrink-0 text-xs text-[#7B8276]">mylink-hy.vercel.app/</span>
              <input id="onboarding-username" autoComplete="username" maxLength={20} required
                pattern="[a-z0-9_]{3,20}" value={username}
                onChange={(event) => { setUsername(event.target.value.toLowerCase()); setError(""); }}
                placeholder="yourname" className="h-12 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none" />
            </div>
            <p className="text-xs text-[#616A5E]">영문 소문자, 숫자, 밑줄(_) 3~20자</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="onboarding-display-name" className="text-sm font-bold">표시 이름 <span aria-hidden="true">*</span></label>
            <input id="onboarding-display-name" required maxLength={80} value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-12 w-full rounded-xl border border-[#C8D0C0] px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#6B8544]" />
          </div>
          <div className="space-y-2">
            <label htmlFor="onboarding-bio" className="text-sm font-bold">자기소개 (선택)</label>
            <textarea id="onboarding-bio" rows={3} maxLength={300} value={bio} onChange={(event) => setBio(event.target.value)}
              placeholder="어떤 사람인지 짧게 소개해 주세요." className="w-full rounded-xl border border-[#C8D0C0] px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-[#6B8544]" />
          </div>
          {error ? <p role="alert" className="text-sm font-semibold text-red-700">{error}</p> : null}
          <button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-[#252823] px-5 font-bold text-white disabled:opacity-50">
            {pending ? "페이지를 만들고 있어요..." : "내 페이지 만들기"}
          </button>
        </form>
      </div>
    </main>
  );
}
