"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, ChartNoAxesColumn, ChevronDown, ExternalLink, Link2, Pencil, Plus, Sparkles } from "lucide-react";
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
import { buttonVariants } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <main className="mx-auto w-full max-w-4xl space-y-7 px-4 py-5 sm:px-6 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 px-4 py-3 shadow-tds-1 sm:px-5">
        <NextLink href="/" aria-label="MyLink 홈" className="flex shrink-0 items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Link2 aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-foreground">My<span className="text-primary">Link</span></span>
        </NextLink>
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthLoading || (user && !isProfileReady && !profileError) ? (
            <span role="status" className="text-xs text-muted-foreground">{user ? "프로필 확인 중..." : "로그인 확인 중..."}</span>
          ) : user ? (
            <>
              {userProfile?.username ? (
                <NextLink
                  href={`/${encodeURIComponent(userProfile.username)}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3"
                >
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">내 공개 페이지</span>
                  <span className="sm:hidden">공개 페이지</span>
                </NextLink>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="h-10 gap-2 rounded-xl border-border/80 bg-background px-2.5 shadow-none hover:bg-muted sm:px-3" aria-label="계정 메뉴 열기" />
                  }
                >
                  <Avatar size="sm" className="size-7">
                    {userProfile?.photoURL ? <AvatarImage src={userProfile.photoURL} alt="계정 프로필 사진" /> : null}
                    <AvatarFallback>{(userProfile?.displayName ?? user.email ?? "G").slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate text-xs font-semibold sm:inline">{userProfile?.displayName ?? "내 계정"}</span>
                  <ChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56 rounded-xl p-2">
                  <DropdownMenuLabel className="px-2 py-2">
                    <span className="block truncate text-sm font-semibold text-foreground">{userProfile?.displayName ?? "Google 사용자"}</span>
                    <span className="mt-0.5 block max-w-60 truncate text-xs text-muted-foreground">{userProfile?.email ?? user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userProfile?.username ? (
                    <DropdownMenuItem render={<NextLink href={`/${encodeURIComponent(userProfile.username)}`} />} >
                      <ArrowUpRight aria-hidden="true" /> 공개 페이지 보기
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem render={<NextLink href="/stats" />}>
                    <ChartNoAxesColumn aria-hidden="true" /> 클릭 통계
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openProfileEditor} disabled={!isProfileReady}>
                    <Pencil aria-hidden="true" /> 프로필 수정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void handleGoogleSignOut()} disabled={isSigningOut}>
                    {isSigningOut ? "로그아웃 중..." : "로그아웃"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={handleGoogleSignIn} disabled={isSigningIn}>
              {isSigningIn ? "로그인 중..." : "Google로 계속하기"}
            </Button>
          )}
        </div>
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
          <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-tds-2">
            <div aria-hidden="true" className="relative h-24 overflow-hidden bg-gradient-to-r from-[#E9F2FF] via-[#F0F6FF] to-[#EAFBFF] sm:h-28">
              <div className="absolute -right-8 -top-24 size-64 rounded-full border-[34px] border-white/35" />
              <div className="absolute left-12 top-9 size-24 rounded-full bg-white/30 blur-2xl" />
            </div>
            <div className="relative px-5 pb-6 sm:px-8 sm:pb-7">
              <div className="-mt-10 flex items-end justify-between gap-3 sm:-mt-11">
                <Avatar className="size-[84px] shrink-0 rounded-[24px] border-4 border-card bg-accent shadow-tds-2 sm:size-24">
                  {userProfile.photoURL ? <AvatarImage src={userProfile.photoURL} alt={`${userProfile.displayName} 프로필 사진`} /> : null}
                  <AvatarFallback className="text-2xl font-bold text-primary">{userProfile.displayName.slice(0, 1) || "?"}</AvatarFallback>
                </Avatar>
                <Button variant="outline" className="mb-1 h-9 gap-1.5 rounded-xl px-3 text-xs font-semibold" onClick={openProfileEditor}>
                  <Pencil aria-hidden="true" className="size-3.5" /> 프로필 편집
                </Button>
              </div>
              <div className="mt-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Sparkles aria-hidden="true" className="size-3.5" /> 나만의 MyLink
                </p>
                <h1 className="mt-2 text-[clamp(1.55rem,4vw,2.15rem)] font-extrabold tracking-tight text-foreground">{userProfile.displayName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    {userProfile.username ? `@${userProfile.username}` : "Username 미설정"}
                  </span>
                  <span className="text-xs text-muted-foreground">공개 프로필</span>
                </div>
                <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-secondary-foreground">
                  {userProfile.bio || "나를 소개하는 한 줄을 작성해 보세요."}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Link2 aria-hidden="true" className="size-4 text-primary" />
                  등록한 링크 <strong className="font-bold text-foreground">{links.length}개</strong>
                </span>
                {userProfile.username ? (
                  <NextLink href={`/${encodeURIComponent(userProfile.username)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    내 공개 프로필 보기 <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </NextLink>
                ) : null}
              </div>
            </div>
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
          <section className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs font-bold tracking-[0.13em] text-primary">MY LINKS</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-[28px]">내 링크 관리</h2>
              <p className="text-sm text-muted-foreground">링크를 모으고 나만의 페이지에 공유해 보세요.</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <Button className="h-10 rounded-xl px-4 font-semibold" onClick={() => setIsDialogOpen(true)}>
                <Plus aria-hidden="true" />
                링크 추가
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>링크 추가</DialogTitle>
                  <DialogDescription>
                    제목과 연결할 웹사이트 주소를 입력해 주세요.
                  </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" noValidate onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="link-title" className="text-label-s">
                      링크 제목
                    </label>
                    <Input
                      id="link-title"
                      autoFocus
                      value={form.title}
                      placeholder="예: 나의 포트폴리오"
                      aria-invalid={Boolean(error && !form.title.trim())}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }));
                        setError("");
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="link-url" className="text-label-s">
                      URL
                    </label>
                    <Input
                      id="link-url"
                      type="url"
                      value={form.url}
                      placeholder="https://example.com"
                      aria-invalid={Boolean(error && form.title.trim())}
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          url: event.target.value,
                        }));
                        setError("");
                      }}
                    />
                  </div>

                  {error ? (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  ) : null}

                  <DialogFooter>
                    <DialogClose
                      render={<Button variant="outline" type="button" />}
                    >
                      취소
                    </DialogClose>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "저장 중..." : "추가"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </section>

          {loadError ? (
            <p role="alert" className="text-sm text-destructive">
              {loadError}
            </p>
          ) : null}

          {links.length === 0 ? (
            <section className="space-y-2 rounded-3xl border border-border bg-card px-6 py-10 text-center">
              <h2 className="text-title-1 text-foreground">
                아직 등록된 링크가 없어요
              </h2>
              <p className="text-body-2 text-muted-foreground">
                링크 추가 버튼을 눌러 첫 링크를 등록해 보세요.
              </p>
            </section>
          ) : (
            <LinkList
              links={links}
              onUpdate={handleUpdateLink}
              onDelete={setLinkToDelete}
              trackingUserId={user.uid}
            />
          )}
        </>
      )}

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