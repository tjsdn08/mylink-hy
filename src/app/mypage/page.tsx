"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChartNoAxesColumn, ChevronDown, Globe2, Link2, LogOut, Pencil, Plus, Save } from "lucide-react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { LinkList } from "@/components/links/LinkList";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";
import { showToast } from "@/lib/toast";
import { validateLinkForm } from "@/lib/link-validation";
import {
  ensureUserProfileDocument,
  saveUserProfile,
  type EditableUserProfile,
  type UserProfileDocument,
} from "@/lib/user-profile";
import type { Link } from "@/types/link";
import { useRouter } from "next/navigation";
import NextLink from "next/link";

interface LinkFormValues {
  title: string;
  url: string;
}

interface ProfileFormValues {
  username: string;
  displayName: string;
  bio: string;
}

const emptyForm: LinkFormValues = { title: "", url: "" };
const reservedUsernames = new Set([
  "api",
  "dashboard",
  "login",
  "mypage",
  "settings",
  "stats",
]);

export default function MyPage() {
  const router = useRouter();
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileDocument | null>(null);
  const [profileError, setProfileError] = useState("");
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileForm, setProfileForm] = useState<ProfileFormValues>({
    username: "",
    displayName: "",
    bio: "",
  });
  const [firestoreLinks, setFirestoreLinks] = useState<Link[]>([]);
  const [linksUserId, setLinksUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<LinkFormValues>(emptyForm);
  const [error, setError] = useState("");
  const links =
    user && isProfileReady && linksUserId === user.uid ? firestoreLinks : [];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        accountMenuRef.current.open = false;
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && accountMenuRef.current?.open) {
        accountMenuRef.current.open = false;
        accountMenuRef.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let activeUid: string | null = null;
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve()
      .then(() => {
        if (isCancelled) return;

        unsubscribe = onAuthStateChanged(
          getFirebaseAuth(),
          (authenticatedUser) => {
            activeUid = authenticatedUser?.uid ?? null;
            setUser(authenticatedUser);
            setAuthError("");
            setProfileError("");
            setLoadError("");
            setFirestoreLinks([]);
            setLinksUserId(null);
            setIsProfileReady(false);
            setUserProfile(null);
            setIsProfileDialogOpen(false);
            setProfileSaveError("");
                    setIsDialogOpen(false);
            setLinkToDelete(null);
            setForm(emptyForm);
            setError("");
            if (!authenticatedUser) {
              setIsAuthLoading(false);
              router.replace("/");
              return;
            }

            void ensureUserProfileDocument(authenticatedUser)
              .then((profile) => {
                if (isCancelled || activeUid !== authenticatedUser.uid) return;
                setUserProfile(profile);
                setProfileForm({
                  username: profile.username,
                  displayName: profile.displayName,
                  bio: profile.bio,
                });
                setIsProfileReady(true);
                setIsAuthLoading(false);
              })
              .catch((profileSaveError: unknown) => {
                if (isCancelled || activeUid !== authenticatedUser.uid) return;
                setProfileError(
                  profileSaveError instanceof Error
                    ? `로그인은 성공했지만 Firestore 프로필 저장에 실패했어요: ${profileSaveError.message}`
                    : "로그인은 성공했지만 Firestore 프로필 저장에 실패했어요. 권한과 연결을 확인해 주세요."
                );
                setIsAuthLoading(false);
              });
          },
          (observerError) => {
            setAuthError(`로그인 상태를 확인하지 못했어요: ${observerError.message}`);
            setIsAuthLoading(false);
          }
        );
      })
      .catch((initializationError: unknown) => {
        if (isCancelled) return;
        setAuthError(
          initializationError instanceof Error
            ? `Firebase 인증을 초기화하지 못했어요: ${initializationError.message}`
            : "Firebase 인증을 초기화하지 못했어요. 설정을 확인해 주세요."
        );
        setIsAuthLoading(false);
      });

    return () => {
      isCancelled = true;
      unsubscribe?.();
    };
  }, [router]);

  useEffect(() => {
    if (!user || !isProfileReady) return;

    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;
    const userId = user.uid;

    void Promise.resolve()
      .then(() => {
        const linksCollection = collection(
          getFirebaseFirestore(),
          "users",
          userId,
          "links"
        );

        if (isCancelled) return;

        unsubscribe = onSnapshot(
          query(linksCollection, orderBy("createdAt", "desc")),
          (snapshot) => {
            if (isCancelled) return;

            const savedLinks = snapshot.docs.flatMap((document) => {
              const data = document.data();
              if (
                typeof data.title !== "string" ||
                typeof data.url !== "string"
              ) {
                return [];
              }

              return [
                {
                  id: document.id,
                  title: data.title,
                  url: data.url,
                  description:
                    typeof data.description === "string"
                      ? data.description
                      : "",
                  category:
                    typeof data.category === "string" &&
                    ["github", "blog", "portfolio", "project", "other"].includes(
                      data.category
                    )
                      ? (data.category as Link["category"])
                      : "other",
                  clickCount: typeof data.clickCount === "number" ? data.clickCount : 0,
                  updatedAt:
                    data.updatedAt instanceof Timestamp
                      ? data.updatedAt.toDate()
                      : undefined,
                },
              ];
            });

            setFirestoreLinks(savedLinks);
            setLinksUserId(userId);
            setLoadError("");
          },
          (snapshotError) => {
            if (isCancelled) return;
            setLoadError(`링크를 불러오지 못했어요: ${snapshotError.message}`);
          }
        );
      })
      .catch((initializationError: unknown) => {
        if (isCancelled) return;

        setLoadError(
          initializationError instanceof Error
            ? `Firebase를 초기화하지 못했어요: ${initializationError.message}`
            : "Firebase를 초기화하지 못했어요. 설정을 확인해 주세요."
        );
      });

    return () => {
      isCancelled = true;
      unsubscribe?.();
    };
  }, [user, isProfileReady]);

  async function handleGoogleSignIn() {
    setAuthError("");
    setIsSigningIn(true);
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch (signInError) {
      const errorCode =
        typeof signInError === "object" &&
        signInError !== null &&
        "code" in signInError
          ? signInError.code
          : undefined;
      setAuthError(
        errorCode === "auth/popup-closed-by-user"
          ? "로그인을 취소했어요. 다시 시도해 주세요."
          : signInError instanceof Error
            ? `Google 로그인에 실패했어요: ${signInError.message}`
            : "Google 로그인에 실패했어요. 다시 시도해 주세요."
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleGoogleSignOut() {
    setAuthError("");
    setIsSigningOut(true);
    try {
      await signOut(getFirebaseAuth());
      setFirestoreLinks([]);
      setLinksUserId(null);
    } catch (signOutError) {
      setAuthError(
        signOutError instanceof Error
          ? `로그아웃하지 못했어요: ${signOutError.message}`
          : "로그아웃하지 못했어요. 다시 시도해 주세요."
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  function openProfileEditor() {
    if (!userProfile) return;
    setProfileForm({
      username: userProfile.username,
      displayName: userProfile.displayName,
      bio: userProfile.bio,
    });
    setProfileSaveError("");
    setIsProfileDialogOpen(true);
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !userProfile || !isProfileReady) return;

    const profile: EditableUserProfile = {
      username: profileForm.username.trim().toLowerCase(),
      displayName: profileForm.displayName.trim(),
      bio: profileForm.bio.trim(),
    };

    if (!/^[a-z0-9_]{3,20}$/.test(profile.username)) {
      setProfileSaveError(
        "Username은 영문 소문자, 숫자, 밑줄로 3~20자 입력해 주세요."
      );
      return;
    }
    if (reservedUsernames.has(profile.username)) {
      setProfileSaveError("사용할 수 없는 Username이에요.");
      return;
    }
    if (!profile.displayName) {
      setProfileSaveError("이름을 입력해 주세요.");
      return;
    }

    setIsProfileSaving(true);
    setProfileSaveError("");
    try {
      await saveUserProfile(user.uid, profile);
      setUserProfile((currentProfile) =>
        currentProfile ? { ...currentProfile, ...profile } : currentProfile
      );
      setIsProfileDialogOpen(false);
      showToast("프로필이 저장되었어요.");
    } catch (saveError) {
      setProfileSaveError(
        saveError instanceof Error
          ? saveError.message
          : "프로필을 저장하지 못했어요. 다시 시도해 주세요."
      );
    } finally {
      setIsProfileSaving(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setError("");
  }

  function handleDialogOpenChange(open: boolean) {
    setIsDialogOpen(open);
    if (!open) resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !isProfileReady) {
      setError("로그인과 프로필 준비가 완료된 후 링크를 추가할 수 있어요.");
      return;
    }

    const title = form.title.trim();
    const url = form.url.trim();

    const validationError = validateLinkForm({ title, url });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await addDoc(
        collection(getFirebaseFirestore(), "users", user.uid, "links"),
        {
          title,
          url,
          description: "",
          category: "other",
          clickCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
      resetForm();
      setIsDialogOpen(false);
      showToast("링크가 추가되었어요.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `링크를 저장하지 못했어요: ${saveError.message}`
          : "링크를 저장하지 못했어요. 다시 시도해 주세요."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateLink(link: Link) {
    if (!user || !isProfileReady) {
      throw new Error("로그인과 프로필 준비가 필요해요.");
    }

    await updateDoc(
      doc(getFirebaseFirestore(), "users", user.uid, "links", link.id),
      {
        title: link.title,
        url: link.url,
        updatedAt: serverTimestamp(),
      }
    );
    showToast("링크가 수정되었어요.");
  }

  async function handleDeleteLink() {
    if (!linkToDelete) return;
    if (!user || !isProfileReady) {
      setLoadError("로그인과 프로필 준비가 완료된 후 링크를 삭제할 수 있어요.");
      setLinkToDelete(null);
      return;
    }

    setIsDeleting(true);
    setLoadError("");
    try {
      await deleteDoc(
        doc(
          getFirebaseFirestore(),
          "users",
          user.uid,
          "links",
          linkToDelete.id
        )
      );
      setLinkToDelete(null);
      showToast("링크가 삭제되었어요.");
    } catch (deleteError) {
      setLoadError(
        deleteError instanceof Error
          ? `링크를 삭제하지 못했어요: ${deleteError.message}`
          : "링크를 삭제하지 못했어요. 다시 시도해 주세요."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-7 px-4 pb-20 pt-0 text-foreground">
      <header className="sticky top-0 z-50 -mx-[calc((100vw-100%)/2)] mb-8 flex min-h-16 items-center justify-between border-b border-border/50 bg-background/90 px-5 py-3 backdrop-blur-md">
        <NextLink href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight" aria-label="MyLink 홈">
          <Globe2 className="size-5 text-[#5b5fc7]" aria-hidden="true" />
          MyLink
        </NextLink>
        {isAuthLoading || (user && !isProfileReady && !profileError) ? (
          <span role="status" className="text-xs text-muted-foreground">계정 확인 중...</span>
        ) : user ? (
          <details ref={accountMenuRef} className="group relative">
            <summary
              aria-label="계정 메뉴 열기"
              className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full px-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"
            >
              <Avatar className="size-8 border border-border">
                {userProfile?.photoURL ? <AvatarImage src={userProfile.photoURL} alt="계정 프로필 사진" /> : null}
                <AvatarFallback>{(userProfile?.displayName ?? user.email ?? "G").slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
                {userProfile?.username || userProfile?.displayName || "내 계정"} 님
              </span>
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-full z-[70] mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl">
              <div className="border-b border-border bg-muted/30 px-4 py-3">
                <p className="truncate text-sm font-bold">{userProfile?.displayName || "Google 사용자"}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{userProfile?.email || user.email}</p>
              </div>
              <nav aria-label="계정 메뉴" className="flex flex-col gap-1 p-2">
                {userProfile?.username ? (
                  <NextLink
                    href={`/${encodeURIComponent(userProfile.username)}`}
                    onClick={() => { if (accountMenuRef.current) accountMenuRef.current.open = false; }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <Globe2 className="size-4" aria-hidden="true" /> 내 공개 페이지
                  </NextLink>
                ) : null}
                <NextLink
                  href="/stats"
                  onClick={() => { if (accountMenuRef.current) accountMenuRef.current.open = false; }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <ChartNoAxesColumn className="size-4" aria-hidden="true" /> 통계 대시보드
                </NextLink>
                <button
                  type="button"
                  onClick={() => { if (accountMenuRef.current) accountMenuRef.current.open = false; openProfileEditor(); }}
                  disabled={!isProfileReady}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil className="size-4" aria-hidden="true" /> 프로필 수정
                </button>
                <div className="my-1 h-px bg-border" role="separator" />
                <button
                  type="button"
                  onClick={() => { if (accountMenuRef.current) accountMenuRef.current.open = false; void handleGoogleSignOut(); }}
                  disabled={isSigningOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  {isSigningOut ? "로그아웃 중..." : "로그아웃"}
                </button>
              </nav>
            </div>
          </details>
        ) : (
          <Button onClick={handleGoogleSignIn} disabled={isSigningIn} className="rounded-full px-4">
            {isSigningIn ? "로그인 중..." : "로그인"}
          </Button>
        )}
      </header>

      {authError ? (
        <p role="alert" className="text-sm text-destructive">
          {authError}
        </p>
      ) : null}
      {profileError ? (
        <section className="space-y-3 rounded-3xl border border-destructive/30 bg-card p-6">
          <p role="alert" className="text-sm text-destructive">
            {profileError}
          </p>
          <Button
            variant="outline"
            onClick={() => void handleGoogleSignOut()}
            disabled={isSigningOut}
          >
            프로필 저장 문제로 로그아웃
          </Button>
        </section>
      ) : null}

      {user && isProfileReady && userProfile ? (
        <>
          <section className="relative flex w-full flex-col items-center pt-1 text-center">
            <div className="relative">
              <Avatar className="mb-4 size-24 border-4 border-background bg-muted shadow-sm">
                {userProfile.photoURL ? <AvatarImage src={userProfile.photoURL} alt={`${userProfile.displayName} 프로필 사진`} /> : null}
                <AvatarFallback className="text-xl font-bold">{userProfile.displayName.slice(0, 1) || "?"}</AvatarFallback>
              </Avatar>
              <button type="button" onClick={openProfileEditor}
                aria-label="프로필 수정" title="프로필 수정"
                className="absolute bottom-4 right-0 flex size-8 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-muted">
                <Pencil className="size-3.5 text-muted-foreground" aria-hidden="true" />
              </button>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{userProfile.displayName}</h1>
            {userProfile.username ? (
              <NextLink href={`/${encodeURIComponent(userProfile.username)}`} className="mt-1 text-xs text-[#5b5fc7] hover:underline">
                @{userProfile.username}
              </NextLink>
            ) : null}
            {userProfile.bio ? (
              <p className="mt-3 max-w-[300px] whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{userProfile.bio}</p>
            ) : null}
          </section>
          <Dialog
            open={isProfileDialogOpen}
            onOpenChange={setIsProfileDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>프로필 수정</DialogTitle>
                <DialogDescription>
                  Username, 이름, 소개글을 수정할 수 있어요.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleProfileSave}>
                <div className="space-y-2">
                  <label htmlFor="profile-username" className="text-label-s">
                    Username
                  </label>
                  <Input
                    id="profile-username"
                    autoComplete="username"
                    value={profileForm.username}
                    placeholder="sunwoo_08"
                    onChange={(event) => {
                      setProfileForm((current) => ({
                        ...current,
                        username: event.target.value.toLowerCase(),
                      }));
                      setProfileSaveError("");
                    }}
                    aria-invalid={Boolean(profileSaveError)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-display-name" className="text-label-s">
                    이름
                  </label>
                  <Input
                    id="profile-display-name"
                    autoComplete="name"
                    value={profileForm.displayName}
                    onChange={(event) => {
                      setProfileForm((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }));
                      setProfileSaveError("");
                    }}
                    aria-invalid={Boolean(
                      profileSaveError && !profileForm.displayName.trim()
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-bio" className="text-label-s">
                    소개글
                  </label>
                  <textarea
                    id="profile-bio"
                    rows={4}
                    value={profileForm.bio}
                    onChange={(event) => {
                      setProfileForm((current) => ({
                        ...current,
                        bio: event.target.value,
                      }));
                      setProfileSaveError("");
                    }}
                    className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-body-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {profileSaveError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {profileSaveError}
                  </p>
                ) : null}
                <DialogFooter>
                  <DialogClose
                    render={<Button type="button" variant="outline" />}
                    disabled={isProfileSaving}
                  >
                    취소
                  </DialogClose>
                  <Button type="submit" disabled={isProfileSaving}>
                    {isProfileSaving ? "저장 중..." : "저장"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      {isAuthLoading ? (
        <p role="status" className="text-body-2 text-muted-foreground">
          로그인 상태를 확인하고 있어요.
        </p>
      ) : profileError ? null : user && !isProfileReady ? (
        <p role="status" className="text-body-2 text-muted-foreground">
          로그인은 완료됐어요. 프로필을 준비하고 있어요.
        </p>
      ) : !user ? (
        <section className="mx-auto w-full max-w-xl space-y-3 rounded-3xl border border-border bg-card p-6 text-center shadow-tds-1 sm:p-8">
          <h1 className="text-h2 text-foreground">로그인 화면으로 이동하고 있어요</h1>
          <p className="text-body-2 leading-relaxed text-muted-foreground">
            마이페이지는 Google 로그인 후 이용할 수 있어요.
          </p>
        </section>
      ) : (
        <>
          <section className="w-full" aria-label="내 링크 추가">
            {isDialogOpen ? (
              <form onSubmit={handleSubmit} noValidate className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                <Input
                  id="link-title"
                  autoFocus
                  value={form.title}
                  placeholder="링크 제목 (예: 인스타그램)"
                  aria-label="링크 제목"
                  aria-invalid={Boolean(error && !form.title.trim())}
                  onChange={(event) => { setForm((current) => ({ ...current, title: event.target.value })); setError(""); }}
                  className="h-10 text-center font-medium"
                />
                <Input
                  id="link-url"
                  type="url"
                  value={form.url}
                  placeholder="https://example.com"
                  aria-label="링크 URL"
                  aria-invalid={Boolean(error && form.title.trim())}
                  onChange={(event) => { setForm((current) => ({ ...current, url: event.target.value })); setError(""); }}
                  className="h-10 text-center text-xs"
                />
                {error ? <p role="alert" className="text-center text-xs font-medium text-destructive">{error}</p> : null}
                <div className="flex justify-center gap-2 pt-1">
                  <Button variant="outline" size="sm" type="button" disabled={isSaving} onClick={() => handleDialogOpenChange(false)}>취소</Button>
                  <Button size="sm" type="submit" disabled={isSaving} className="bg-[#5b5fc7] text-white hover:bg-[#4c50ab]">
                    <Save className="size-3.5" aria-hidden="true" /> {isSaving ? "추가 중..." : "추가하기"}
                  </Button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => handleDialogOpenChange(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#5b5fc7]/35 bg-[#5b5fc7]/10 font-semibold text-[#5b5fc7] transition-all hover:bg-[#5b5fc7]/20 active:scale-[0.98]">
                <Plus aria-hidden="true" className="size-5" /> 새로운 링크 추가하기
              </button>
            )}
          </section>
          {loadError ? <p role="alert" className="text-sm text-destructive">{loadError}</p> : null}
          <section aria-label="내 링크" className="w-full">
            {links.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Link2 className="mb-3 size-8 text-muted-foreground/30" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">아직 등록된 링크가 없습니다.</p>
              </div>
            ) : (
              <LinkList links={links} onUpdate={handleUpdateLink} onDelete={setLinkToDelete} trackingUserId={user.uid} compact />
            )}
          </section>
        </>
      )}

      <footer className="py-8 text-center text-xs font-semibold text-muted-foreground">
        <Globe2 aria-hidden="true" className="mr-1 inline size-3" /> Powered by MyLink
      </footer>
      <Dialog
        open={linkToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setLinkToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
            <DialogDescription>
              삭제할 링크: <span className="font-medium text-foreground">{linkToDelete?.title}</span>
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium text-destructive">
            이 작업은 되돌릴 수 없습니다
          </p>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" type="button" />}
              disabled={isDeleting}
            >
              취소
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteLink}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}