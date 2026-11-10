"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ExternalLink, Plus } from "lucide-react";
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
import { ProfileCard } from "@/components/profile/ProfileCard";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { LinkList } from "@/components/links/LinkList";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase";
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
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
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
            setProfileSaveSuccess(false);
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
    setProfileSaveSuccess(false);
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
    setProfileSaveSuccess(false);
    try {
      await saveUserProfile(user.uid, profile);
      setUserProfile((currentProfile) =>
        currentProfile ? { ...currentProfile, ...profile } : currentProfile
      );
      setIsProfileDialogOpen(false);
      setProfileSaveSuccess(true);
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
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="size-2.5 rounded-full bg-primary" />
          <span className="text-title-2 font-bold text-foreground">MyLink</span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          {isAuthLoading || (user && !isProfileReady && !profileError) ? (
            <span className="text-caption text-muted-foreground">
              {user ? "프로필 확인 중..." : "로그인 확인 중..."}
            </span>
          ) : user ? (
            <>
              {userProfile?.username ? (
                <NextLink
                  href={`/${encodeURIComponent(userProfile.username)}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <ExternalLink aria-hidden="true" />
                  내 공개 페이지
                </NextLink>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="프로필 메뉴"
                    />
                  }
                >
                  <Avatar size="sm">
                    {userProfile?.photoURL ? (
                      <AvatarImage
                        src={userProfile.photoURL}
                        alt={`${userProfile.displayName} 프로필 사진`}
                      />
                    ) : null}
                    <AvatarFallback>
                      {(userProfile?.displayName ?? user.email ?? "G").slice(
                        0,
                        1
                      )}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <span className="block max-w-56 truncate">
                      {userProfile?.displayName ?? "Google 사용자"}
                    </span>
                    {userProfile?.email ? (
                      <span className="block max-w-56 truncate text-caption text-muted-foreground">
                        {userProfile.email}
                      </span>
                    ) : null}
                  </DropdownMenuLabel>
                  {userProfile?.username ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        render={
                          <NextLink
                            href={`/${encodeURIComponent(userProfile.username)}`}
                          />
                        }
                      >
                        내 공개 페이지
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => void handleGoogleSignOut()}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? "로그아웃 중..." : "로그아웃"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex min-w-0 items-center gap-2">
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-label-s">
                    {userProfile?.displayName ?? "Google 사용자"}
                  </p>
                  {userProfile?.email ? (
                    <p className="truncate text-caption-s text-muted-foreground">
                      {userProfile.email}
                    </p>
                  ) : null}
                </div>
              </div>
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
          <div className="flex justify-end">
            <Button variant="outline" onClick={openProfileEditor}>
              프로필 수정
            </Button>
          </div>
          {profileSaveSuccess ? (
            <p role="status" className="text-sm text-primary">
              프로필을 저장했어요.
            </p>
          ) : null}
          <ProfileCard
            profile={{
              imageUrl: userProfile.photoURL || null,
              imageAlt: `${userProfile.displayName} 프로필 사진`,
              fallbackText: userProfile.displayName.slice(0, 1) || "?",
              name: userProfile.displayName,
              role: userProfile.username
                ? `@${userProfile.username}`
                : "Username을 설정해 주세요",
              level: "Google 계정",
              tagline: userProfile.email,
              bio: userProfile.bio,
            }}
          />
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
          <section className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-h1 text-foreground">마이페이지</h1>
              <p className="text-body-2 text-muted-foreground">
                내 페이지에 표시할 링크를 확인해요.
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <Button onClick={() => setIsDialogOpen(true)}>
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