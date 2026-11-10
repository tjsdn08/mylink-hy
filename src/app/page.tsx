"use client";

import { useEffect, useState } from "react";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
} from "firebase/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  ensureUserProfileDocument,
  type UserProfileDocument,
} from "@/lib/user-profile";
import MyPage from "@/app/mypage/page";

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfileDocument | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;
    let activeUid: string | null = null;
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve()
      .then(() => {
        if (isCancelled) return;

        unsubscribe = onAuthStateChanged(
          getFirebaseAuth(),
          (user) => {
            if (!user) {
              activeUid = null;
              setUserProfile(null);
              setIsAuthLoading(false);
              setIsProfileSaving(false);
              return;
            }

            activeUid = user.uid;
            setIsProfileSaving(true);
            void ensureUserProfileDocument(user)
              .then((profile) => {
                if (isCancelled || activeUid !== user.uid) return;
                setUserProfile(profile);
                setIsAuthLoading(false);
                setIsProfileSaving(false);
              })
              .catch((profileError: unknown) => {
                if (isCancelled || activeUid !== user.uid) return;
                setIsAuthLoading(false);
                setIsProfileSaving(false);
                setError(
                  profileError instanceof Error
                    ? `Google 로그인은 성공했지만 Firestore 프로필 저장에 실패했어요: ${profileError.message}`
                    : "Google 로그인은 성공했지만 Firestore 프로필 저장에 실패했어요. 권한과 연결을 확인해 주세요."
                );
              });
          },
          (authError) => {
            setError(`로그인 상태를 확인하지 못했어요: ${authError.message}`);
            setIsAuthLoading(false);
          }
        );
      })
      .catch((authError: unknown) => {
        if (isCancelled) return;
        setError(
          authError instanceof Error
            ? `Firebase 인증을 초기화하지 못했어요: ${authError.message}`
            : "Firebase 인증을 초기화하지 못했어요. 설정을 확인해 주세요."
        );
        setIsAuthLoading(false);
      });

    return () => {
      isCancelled = true;
      unsubscribe?.();
    };
  }, []);

  async function handleGoogleSignIn() {
    setError("");
    setIsSigningIn(true);

    try {
      const auth = getFirebaseAuth();
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (signInError) {
      const errorCode =
        typeof signInError === "object" &&
        signInError !== null &&
        "code" in signInError
          ? signInError.code
          : undefined;
      setError(
        errorCode === "auth/popup-closed-by-user"
          ? "로그인을 취소했어요. 원할 때 다시 시도해 주세요."
          : signInError instanceof Error
            ? `Google 로그인에 실패했어요: ${signInError.message}`
            : "Google 로그인에 실패했어요. 다시 시도해 주세요."
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  if (userProfile && !isAuthLoading && !isProfileSaving) {
    return <MyPage />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 w-full items-center justify-between border-b border-border bg-card px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="MyLink 홈">
          <span className="size-2.5 rounded-full bg-primary" />
          <span className="text-title-2 font-bold">MyLink</span>
        </Link>
        <Button
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isAuthLoading || isSigningIn || isProfileSaving}
        >
          {isProfileSaving
            ? "프로필 저장 중..."
            : isSigningIn
              ? "로그인 중..."
              : "로그인"}
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        <div className="max-w-2xl space-y-6">
          <p className="text-label-s text-primary">나만의 링크 페이지</p>
          <h1 className="text-display-2 text-foreground">
            모든 링크를 하나로 모아 보세요
          </h1>
          <p className="mx-auto max-w-xl text-body-1 leading-relaxed text-muted-foreground">
            나를 소개하는 프로필과 자주 쓰는 링크를 한 페이지에 정리하고,
            필요한 곳에 간편하게 공유할 수 있어요.
          </p>

          <Button
            size="lg"
            className="h-12 rounded-2xl px-6 text-label-m"
            onClick={handleGoogleSignIn}
            disabled={isAuthLoading || isSigningIn || isProfileSaving}
          >
            {isProfileSaving
              ? "프로필 저장 중..."
              : isSigningIn
                ? "Google 인증 화면을 확인해 주세요..."
                : "Google로 시작하기"}
          </Button>

          {isAuthLoading ? (
            <p role="status" className="text-caption text-muted-foreground">
              로그인 상태를 확인하고 있어요.
            </p>
          ) : null}
          {isSigningIn || isProfileSaving ? (
            <p role="status" className="text-caption text-muted-foreground">
              {isProfileSaving
                ? "로그인이 완료됐어요. 프로필을 저장하고 있어요."
                : "Google 인증이 완료되면 프로필을 준비해요."}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
