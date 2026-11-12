"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChartNoAxesColumn, Check, ChevronDown, Copy, Eye, Globe2, Link2, LogOut, Moon, Pencil, Plus, Save, Sun } from "lucide-react";
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
  writeBatch,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
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
import { ProfileSection } from "@/components/mypage/ProfileSection";
import { ProfileDesignEditor } from "@/components/mypage/ProfileDesignEditor";
import { ProfileLivePreview } from "@/components/mypage/ProfileLivePreview";
import { normalizeExternalUrl } from "@/lib/url-normalize";
import { safeHttpUrl } from "@/lib/profile-design";
import type { ProfileAppearance } from "@/lib/profile-design";
import { getFirebaseFirestore } from "@/lib/firebase";
import { deleteMyLinkAccount } from "@/lib/account-deletion";
import { useAuth } from "@/components/auth-provider";
import { showToast } from "@/lib/toast";
import { getLinkFieldErrors, validateLinkForm } from "@/lib/link-validation";
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
  group: string;
  description: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  isActive: boolean;
}

interface ProfileFormValues {
  username: string;
  displayName: string;
  bio: string;
}

const emptyForm: LinkFormValues = { title: "", url: "", group: "", description: "", thumbnailUrl: "", isFeatured: false, isActive: true };
const reservedUsernames = new Set([
  "api",
  "dashboard",
  "login",
  "links",
  "onboarding",
  "mypage",
  "settings",
  "stats",
]);

export default function MyPage() {
  const router = useRouter();
  const { user, loading: isAuthLoading, error: authContextError, signInWithGoogle, signOut } = useAuth();
  const { isDark, setTheme } = useTheme();
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const [authError, setAuthError] = useState("");
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileDocument | null>(null);
  const [profileError, setProfileError] = useState("");
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [showAccountDelete, setShowAccountDelete] = useState(false);
  const [accountDeleteText, setAccountDeleteText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountDeleteError, setAccountDeleteError] = useState("");
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
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "links" | "design">("links");
  const [appearanceDraft, setAppearanceDraft] = useState<ProfileAppearance | null>(null);
  const [pendingTab, setPendingTab] = useState<"links" | "profile" | null>(null);
  const [inlineDraft, setInlineDraft] = useState<{ displayName: string; bio: string } | null>(null);
  const [linkFieldErrors, setLinkFieldErrors] = useState<{ title?: string; url?: string }>({});
  const [previewDraftLink, setPreviewDraftLink] = useState<Link | null>(null);
  const links = user && isProfileReady && linksUserId === user.uid
    ? [...firestoreLinks].sort((a, b) => (a.sortOrder ?? 100000) - (b.sortOrder ?? 100000))
    : [];
  const draftUrl = normalizeExternalUrl(form.url);
  const newLinkPreview: Link | null = isDialogOpen && form.title.trim() && !validateLinkForm({ title: form.title, url: draftUrl })
    ? {
        id: "unsaved-new-link",
        title: form.title.trim(),
        url: draftUrl,
        category: "other",
        description: form.description,
        group: form.group,
        thumbnailUrl: safeHttpUrl(form.thumbnailUrl) ?? "",
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        sortOrder: -1,
      }
    : null;
  const previewLinks = [
    ...links.map((item) => previewDraftLink?.id === item.id ? { ...previewDraftLink, sortOrder: item.sortOrder } : item),
    ...(newLinkPreview ? [newLinkPreview] : []),
  ];

  const profileChecklist: { label: string; done: boolean; tab: "links" | "design" }[] = [
    { label: "나를 표현하는 한 줄 소개", done: Boolean(userProfile?.headline?.trim()), tab: "design" },
    { label: "About me 이야기", done: Boolean(userProfile?.about?.trim()), tab: "design" },
    { label: "요즘 하고 있는 일", done: Boolean(userProfile?.now?.trim()), tab: "design" },
    { label: "SNS 주소 연결", done: Boolean(userProfile?.socialLinks?.length), tab: "design" },
    { label: "설명 있는 링크 등록", done: links.some((link) => Boolean(link.description?.trim())), tab: "links" },
    { label: "대표 링크 설정", done: links.some((link) => link.isFeatured === true), tab: "links" },
  ];
  const completedCount = profileChecklist.filter((item) => item.done).length;
  const nextSuggestion = profileChecklist.find((item) => !item.done);
  function changeTab(tab: "profile" | "links" | "design") {
    if (tab === activeTab) return;
    if (activeTab === "design" && appearanceDraft && tab !== "design") {
      setPendingTab(tab);
      return;
    }
    if (tab !== "links") setPreviewDraftLink(null);
    setActiveTab(tab);
  }


  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "profile" || requestedTab === "links" || requestedTab === "design") {
      queueMicrotask(() => setActiveTab(requestedTab));
    }
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
    let cancelled = false;
    const uid = user?.uid;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setAuthError(authContextError ? `로그인 상태 확인 오류: ${authContextError}` : "");
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
      if (!user) {
        if (!isAuthLoading && !authContextError) router.replace("/");
        return;
      }
      void ensureUserProfileDocument(user).then((profile) => {
        if (cancelled || uid !== user.uid) return;
        if (!profile.username) {
          router.replace("/");
          return;
        }
        setUserProfile(profile);
        setProfileForm({
          username: profile.username,
          displayName: profile.displayName,
          bio: profile.bio,
        });
        setIsProfileReady(true);
      }).catch((cause: unknown) => {
        if (cancelled || uid !== user.uid) return;
        setProfileError(cause instanceof Error
          ? `프로필 정보를 불러오지 못했어요: ${cause.message}`
          : "프로필을 불러오지 못했어요.");
      });
    });
    return () => { cancelled = true; };
  }, [user, isAuthLoading, authContextError, router]);

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
                  group: typeof data.group === "string" ? data.group : "",
                  category:
                    typeof data.category === "string" &&
                    ["github", "blog", "portfolio", "project", "other"].includes(
                      data.category
                    )
                      ? (data.category as Link["category"])
                      : "other",
                  clickCount: typeof data.clickCount === "number" ? data.clickCount : 0,
                  thumbnailUrl: typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : "",
                  isActive: data.isActive !== false,
                  isFeatured: data.isFeatured === true,
                  sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : undefined,
                  updatedAt:
                    data.updatedAt instanceof Timestamp
                      ? data.updatedAt.toDate()
                      : undefined,
                },
              ];
            });

            // 과거 문서의 isActive 누락값은 기존 공개 상태(true)로 마이그레이션합니다.
            // 공개 목록은 isActive == true 조건으로 읽으므로 누락 문서를 보완해야 합니다.
            const legacy = snapshot.docs.filter((item) => typeof item.data().isActive !== "boolean");
            for (let offset = 0; offset < legacy.length; offset += 400) {
              const batch = writeBatch(getFirebaseFirestore());
              for (const item of legacy.slice(offset, offset + 400)) batch.update(item.ref, { isActive: true });
              void batch.commit().catch((cause: unknown) => {
                if (!isCancelled) setLoadError(cause instanceof Error ? `기존 링크 마이그레이션 실패: ${cause.message}` : "기존 링크 설정을 업데이트하지 못했어요.");
              });
            }
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
      await signInWithGoogle();
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

  async function handleAccountDeletion() {
    if (!user || !userProfile || accountDeleteText !== "탈퇴합니다" || deletingAccount) return;
    setDeletingAccount(true);
    setAccountDeleteError("");
    try {
      await deleteMyLinkAccount(user, userProfile.username);
      setShowAccountDelete(false);
      setAccountDeleteText("");
      showToast("계정과 데이터를 삭제했어요.");
      router.replace("/");
    } catch (cause) {
      setAccountDeleteError(cause instanceof Error ? cause.message : "계정을 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setDeletingAccount(false);
    }
  }

  async function handleGoogleSignOut() {
    setAuthError("");
    setIsSigningOut(true);
    try {
      await signOut();
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
    setLinkFieldErrors({});
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

    if (isSaving) return;
    const title = form.title.trim();
    const url = normalizeExternalUrl(form.url);
    const thumbnailUrl = form.thumbnailUrl.trim();

    const fieldErrors = getLinkFieldErrors({ title, url });
    setLinkFieldErrors(fieldErrors);
    const validationError = validateLinkForm({ title, url });
    if (validationError) {
      setError(validationError);
      return;
    }
    if (thumbnailUrl && !safeHttpUrl(thumbnailUrl)) {
      setError("썸네일 이미지에는 http 또는 https 주소만 사용할 수 있어요.");
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
          group: form.group.trim(),
          description: form.description.trim(),
          thumbnailUrl,
          isFeatured: form.isFeatured,
          isActive: form.isActive,
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
        description: link.description ?? "",
        group: link.group ?? "",
        thumbnailUrl: link.thumbnailUrl ?? "",
        isActive: link.isActive !== false,
        isFeatured: link.isFeatured === true,
        updatedAt: serverTimestamp(),
      }
    );
    showToast("링크가 수정되었어요.");
  }

  async function handleReorder(fromId: string, toId: string) {
    if (!user || fromId === toId) return;
    const sorted = [...links];
    const from = sorted.findIndex((item) => item.id === fromId);
    const to = sorted.findIndex((item) => item.id === toId);
    if (from === -1 || to === -1) return;
    const [moved] = sorted.splice(from, 1);
    sorted.splice(to, 0, moved);
    const firestore = getFirebaseFirestore();
    const batch = writeBatch(firestore);
    sorted.forEach((link, index) => {
      batch.update(doc(firestore, "users", user.uid, "links", link.id), { sortOrder: index });
    });
    try {
      await batch.commit();
      setFirestoreLinks((old) => old.map((item) => ({ ...item, sortOrder: sorted.findIndex((link) => link.id === item.id) })));
      showToast("링크 순서를 저장했어요.");
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "순서를 저장하지 못했어요.", "error");
    }
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
    <main className="mylink-workspace mx-auto min-h-screen w-full max-w-[1180px] space-y-7 px-5 pb-24 text-[#252823] dark:text-[#F8F6F1] sm:px-8">
      <header className="sticky top-0 z-50 -mx-5 mb-8 flex min-h-[76px] items-center justify-between border-b border-[#252823]/10 bg-[#F8F6F1]/95 px-5 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#1D211D]/95 sm:-mx-8 sm:px-8">
        <NextLink href="/" className="flex items-center gap-2 text-2xl font-black tracking-[-0.07em]" aria-label="MyLink 홈">
          <span className="inline-flex size-8 -rotate-6 items-center justify-center rounded-[10px] bg-[#252823] text-[#DDF76B] dark:bg-[#DDF76B] dark:text-[#252823]"><Link2 className="size-4" aria-hidden="true" /></span>
          mylink<span className="text-[#708E36]">.</span>
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
                {userProfile?.username ? (
                  <>
                    <button type="button"
                      onClick={async () => {
                        const url = `${window.location.origin}/${encodeURIComponent(userProfile.username)}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          setCopied(true);
                          showToast("내 페이지 주소를 복사했어요.");
                        } catch {
                          showToast("주소 복사에 실패했어요. 브라우저 권한을 확인해 주세요.", "error");
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted">
                      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                      {copied ? "주소 복사 완료" : "내 페이지 링크 복사"}
                    </button>
                  </>
                ) : null}
                <NextLink href="/dashboard"
                  onClick={() => { if (accountMenuRef.current) accountMenuRef.current.open = false; }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted">
                  <Globe2 className="size-4" aria-hidden="true" /> 대시보드
                </NextLink>
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
                <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    {isDark ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
                    다크 모드
                  </span>
                  <Switch
                    checked={isDark}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    aria-label="다크 모드 전환"
                  />
                </div>
                <div className="my-1 h-px bg-border" role="separator" />
                <button type="button"
                  onClick={() => { if (accountMenuRef.current) accountMenuRef.current.open = false; setShowAccountDelete(true); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10">
                  계정 탈퇴 및 데이터 삭제
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

      {user && isProfileReady && userProfile ? (
        <section aria-label="페이지 관리 안내" className="relative overflow-hidden rounded-[26px] bg-[#252823] px-6 py-7 text-white sm:px-9 sm:py-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-14 size-56 rounded-full border-[28px] border-[#DDF76B]/20" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-[11px] font-black tracking-[0.2em] text-[#DDF76B]">YOUR SPACE / EDITOR</p>
              <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.7rem)] font-black tracking-[-0.055em]">내 페이지, 내 방식대로.</h1>
              <p className="mt-2 text-sm leading-6 text-white/65">프로필과 링크를 관리하고, 방문자에게 보이는 모습을 확인해 보세요.</p>
            </div>
            {userProfile.username ? (
              <NextLink href={`/${encodeURIComponent(userProfile.username)}`} target="_blank"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#DDF76B] px-5 text-sm font-extrabold text-[#252823] transition-transform hover:-translate-y-0.5">
                공개 페이지 보기 <Eye className="size-4" aria-hidden="true" />
              </NextLink>
            ) : null}
          </div>
        </section>
      ) : null}

      {user && isProfileReady && userProfile && !userProfile.username ? (
        <section aria-label="첫 프로필 설정" className="rounded-[24px] border border-[#A0B579] bg-[#EEF3E1] p-5 text-[#252823] sm:p-7">
          <h2 className="text-lg font-black">나만의 페이지 주소를 먼저 정해 주세요</h2>
          <p className="mt-2 text-sm leading-6 text-[#495642]">
            Google 로그인은 완료됐어요. 고유 Username과 표시 이름을 저장하면 공개 프로필 주소가 만들어져요.
            링크를 공유하기 전에 먼저 설정해 주세요.
          </p>
          <Button type="button" className="mt-4 rounded-xl" onClick={openProfileEditor}>
            Username과 이름 설정하기
          </Button>
        </section>
      ) : null}

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
          <nav aria-label="관리 메뉴" className="flex flex-wrap gap-2 rounded-2xl border border-[#252823]/10 bg-white p-2 text-[#252823] dark:border-white/10 dark:bg-[#282E29] dark:text-[#F8F6F1]">
            {([["links", "링크 관리"], ["profile", "프로필"], ["design", "디자인·SNS"]] as const).map(([tab, name]) => (
              <button key={tab} type="button" aria-current={activeTab === tab ? "page" : undefined}
                onClick={() => changeTab(tab)}
                className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-bold transition-colors ${activeTab === tab ? "bg-[#252823] text-white dark:bg-[#DDF76B] dark:text-[#252823]" : "hover:bg-[#EEF2E4] dark:hover:bg-white/10"}`}>{name}</button>
            ))}
          </nav>
          <div className="grid gap-3 rounded-[22px] border border-[#252823]/10 bg-[#EEF3E1] px-5 py-4 text-[#35432A] sm:grid-cols-3 dark:border-[#DDF76B]/15 dark:bg-[#34412F] dark:text-[#E3EBCF]">
            <div><p className="text-[10px] font-extrabold tracking-wider opacity-70">MY PAGE</p><p className="mt-1 truncate text-sm font-black">@{userProfile.username || "username"}</p></div>
            <div><p className="text-[10px] font-extrabold tracking-wider opacity-70">LINKS</p><p className="mt-1 text-sm font-black">{links.length}개 등록 · {links.filter((link) => link.isActive !== false).length}개 표시</p></div>
            <div><p className="text-[10px] font-extrabold tracking-wider opacity-70">PERSONAL STYLE</p><p className="mt-1 text-sm font-black">{userProfile.theme === "midnight" ? "미드나잇" : userProfile.theme === "lavender" ? "라벤더" : "크림 & 라임"} 테마</p></div>
          </div>
          <section aria-label="개인 페이지 꾸미기 안내" className="rounded-[24px] border border-[#252823]/10 bg-white px-5 py-5 text-[#252823] dark:border-white/10 dark:bg-[#282E29] dark:text-[#F8F6F1]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black tracking-[.16em] text-[#677D4A] dark:text-[#DDF76B]">MAKE IT YOURS</p>
                <h2 className="mt-1 text-base font-black tracking-tight">내 페이지를 더 나답게</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">내용을 채우면 공개 페이지에도 실제로 표시돼요. 필수 입력은 아니에요.</p>
              </div>
              <span className="rounded-full bg-[#E8F1C8] px-3 py-1.5 text-xs font-black text-[#40582E] dark:bg-[#DDF76B] dark:text-[#252823]">
                {completedCount} / {profileChecklist.length} 완성
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E6E8DE] dark:bg-white/15"
              role="progressbar" aria-label="프로필 꾸미기 진행률" aria-valuemin={0}
              aria-valuemax={profileChecklist.length} aria-valuenow={completedCount}>
              <div className="h-full rounded-full bg-[#7D9650] transition-[width] duration-300 dark:bg-[#DDF76B]"
                style={{ width: `${completedCount / profileChecklist.length * 100}%` }} />
            </div>
            {nextSuggestion ? (
              <button type="button" onClick={() => changeTab(nextSuggestion.tab)}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#252823] px-4 text-xs font-bold text-white transition-colors hover:bg-[#455239] dark:bg-[#DDF76B] dark:text-[#252823]">
                다음 추천: {nextSuggestion.label} <span aria-hidden="true">↗</span>
              </button>
            ) : <p className="mt-3 text-xs font-semibold text-[#556F37] dark:text-[#DDF76B]">나만의 페이지를 풍성하게 채웠어요!</p>}
          </section>
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
            <div className="min-w-0 space-y-6">
          {activeTab === "profile" ? <ProfileSection
            displayName={userProfile.displayName}
            username={userProfile.username}
            photoURL={userProfile.photoURL}
            bio={userProfile.bio}
            onEdit={openProfileEditor}
            onDraftChange={setInlineDraft}
            onSaveInline={async (name, bio) => {
              if (!user || !userProfile) throw new Error("로그인 후 수정할 수 있어요.");
              await saveUserProfile(user.uid, { username: userProfile.username, displayName: name, bio });
              setUserProfile((current) => current ? { ...current, displayName: name, bio } : current);
              setInlineDraft(null);
              showToast("프로필 이름과 소개글을 저장했어요.");
            }}
          /> : null}
          {activeTab === "design" ? (
            <ProfileDesignEditor
              userId={user.uid}
              appearance={userProfile}
              onDraftChange={setAppearanceDraft}
              onSaved={(next) => {
                setUserProfile((current) => current ? { ...current, ...next } : current);
                setAppearanceDraft(null);
              }}
              onSocialOrderSaved={(socialLinks) => {
                setUserProfile((current) => current ? { ...current, socialLinks } : current);
              }}
            />
          ) : null}
          {activeTab === "links" ? (
        <div className="space-y-6">
          <section className="w-full rounded-[26px] border border-[#252823]/10 bg-white p-5 text-[#252823] shadow-[0_8px_30px_rgba(32,33,30,0.04)] dark:border-white/10 dark:bg-[#282E29] dark:text-[#F8F6F1] sm:p-6" aria-label="내 링크 추가">
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!isSaving) handleDialogOpenChange(open); }}>
              <DialogContent className="max-h-[min(90dvh,900px)] overflow-y-auto sm:max-w-2xl" showCloseButton={!isSaving}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-black">새 링크 추가</DialogTitle>
                  <DialogDescription>제목·주소·설명·썸네일·공개 설정을 한 번에 입력해요.</DialogDescription>
                </DialogHeader>
              <form onSubmit={handleSubmit} noValidate aria-label="새 링크 추가" className="space-y-4">
                <div>
                  <p className="text-[11px] font-extrabold tracking-[.15em] text-[#6B8544]">NEW LINK</p>
                  <h3 className="mt-1 text-lg font-black tracking-tight">링크를 한 번에 등록해요</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">제목·주소 외에 설명, 이미지, 공개 여부도 바로 설정할 수 있어요.</p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="link-title" className="text-xs font-bold">링크 제목 <span className="text-destructive">*</span></label>
                  <Input id="link-title" autoFocus value={form.title} maxLength={100}
                    placeholder="예: GitHub | 개발 기록" aria-invalid={Boolean(linkFieldErrors.title)}
                    aria-describedby={linkFieldErrors.title ? "link-title-error" : undefined}
                    onChange={(event) => { setForm((current) => ({ ...current, title: event.target.value })); setError(""); setLinkFieldErrors((current) => ({ ...current, title: undefined })); }}
                    className="h-11 text-left font-medium" />
                  {linkFieldErrors.title ? <p id="link-title-error" role="alert" className="text-xs text-destructive">{linkFieldErrors.title}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="link-url" className="text-xs font-bold">링크 주소 <span className="text-destructive">*</span></label>
                  <Input id="link-url" type="url" value={form.url} placeholder="https://github.com"
                    aria-invalid={Boolean(linkFieldErrors.url)}
                    aria-describedby={linkFieldErrors.url ? "link-url-error" : undefined}
                    onBlur={() => setForm((current) => ({ ...current, url: normalizeExternalUrl(current.url) }))}
                    onChange={(event) => { setForm((current) => ({ ...current, url: event.target.value })); setError(""); setLinkFieldErrors((current) => ({ ...current, url: undefined })); }}
                    className="h-11 text-left text-sm" />
                  {linkFieldErrors.url ? <p id="link-url-error" role="alert" className="text-xs text-destructive">{linkFieldErrors.url}</p> : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="link-group" className="text-xs font-bold">그룹 이름 <span className="font-normal text-muted-foreground">(선택)</span></label>
                    <Input id="link-group" value={form.group} maxLength={40} placeholder="예: 개발과 프로젝트"
                      onChange={(event) => setForm((current) => ({ ...current, group: event.target.value }))} className="h-11 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="link-description" className="text-xs font-bold">링크 설명 <span className="font-normal text-muted-foreground">(선택)</span></label>
                    <Input id="link-description" value={form.description} maxLength={160} placeholder="무엇을 볼 수 있는 링크인가요?"
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="h-11 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="link-thumbnail" className="text-xs font-bold">썸네일 이미지 URL <span className="font-normal text-muted-foreground">(선택)</span></label>
                  <Input id="link-thumbnail" type="url" value={form.thumbnailUrl} placeholder="https://.../image.png"
                    onChange={(event) => { setForm((current) => ({ ...current, thumbnailUrl: event.target.value })); setError(""); }} className="h-11 text-sm" />
                  <p className="text-[11px] text-muted-foreground">외부 이미지 주소를 사용해요. 대표 링크의 이미지가 크게 표시돼요.</p>
                </div>
                <div className="flex flex-wrap gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-xs font-semibold">
                    <input type="checkbox" checked={form.isActive} className="size-4 accent-[#657D3E]"
                      onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                    공개 페이지에 표시
                  </label>
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-xs font-semibold">
                    <input type="checkbox" checked={form.isFeatured} className="size-4 accent-[#657D3E]"
                      onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} />
                    대표 링크로 강조
                  </label>
                </div>
                {error && !linkFieldErrors.title && !linkFieldErrors.url ? <p role="alert" className="text-xs font-medium text-destructive">{error}</p> : null}
                <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
                  <Button variant="outline" type="button" disabled={isSaving} onClick={() => handleDialogOpenChange(false)}>취소</Button>
                  <Button type="submit" disabled={isSaving} aria-busy={isSaving} className="bg-[#252823] text-white hover:bg-[#41483A] dark:bg-[#DDF76B] dark:text-[#252823]">
                    <Save className="size-4" aria-hidden="true" /> {isSaving ? "링크 저장 중..." : "링크 등록하기"}
                  </Button>
                </div>
              </form>
              </DialogContent>
            </Dialog>
              <button type="button" onClick={() => handleDialogOpenChange(true)}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#879C56] bg-[#EFF5D6] px-4 py-3 text-sm font-extrabold text-[#3E5529] transition-all hover:border-[#252823] hover:bg-[#DDF76B] focus-visible:outline-2 focus-visible:outline-[#252823] active:scale-[0.98] dark:border-[#DDF76B]/40 dark:bg-[#DDF76B]/10 dark:text-[#DDF76B]">
                <Plus aria-hidden="true" className="size-5" /> 새로운 링크 추가하기
              </button>
          </section>
          {loadError ? <p role="alert" className="text-sm text-destructive">{loadError}</p> : null}
          <section aria-label="내 링크" className="w-full rounded-[26px] border border-[#252823]/10 bg-white p-5 shadow-[0_8px_30px_rgba(32,33,30,0.04)] dark:border-white/10 dark:bg-[#282E29] sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#E77955]">MY COLLECTION</p>
                <h2 className="mt-1 text-xl font-black tracking-[-0.04em]">등록한 링크</h2>
              </div>
              <span className="rounded-full bg-[#EFF5D6] px-3 py-1 text-xs font-extrabold text-[#405928] dark:bg-[#37482E] dark:text-[#DDF76B]">{links.length}개</span>
            </div>
            {links.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Link2 className="mb-3 size-8 text-muted-foreground/30" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">아직 등록된 링크가 없습니다.</p>
              </div>
            ) : (
              <LinkList links={links} onUpdate={handleUpdateLink} onDelete={setLinkToDelete} onDraftChange={setPreviewDraftLink} onReorder={handleReorder} trackingUserId={user.uid} compact />
            )}
          </section>
        </div>
          ) : null}
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
                    maxLength={20}
                    aria-describedby="profile-username-help"
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
                <p id="profile-username-help" className="text-xs text-muted-foreground">영문 소문자, 숫자, 밑줄을 사용해 3~20자로 입력해 주세요.</p>
                <div className="space-y-2">
                  <label htmlFor="profile-display-name" className="text-label-s">
                    이름
                  </label>
                  <Input
                    id="profile-display-name"
                    maxLength={80}
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
                    maxLength={250}
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
                    aria-describedby="profile-bio-count"
                  />
                </div>
                <p id="profile-bio-count" className="text-right text-xs text-muted-foreground">{profileForm.bio.length}/250</p>
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
            </div>
            <aside className="min-w-0 rounded-[26px] border border-[#252823]/10 bg-white p-4 text-[#252823] dark:border-white/10 dark:bg-[#282E29] dark:text-[#F8F6F1] lg:sticky lg:top-24" aria-label="실시간 미리보기">
              <ProfileLivePreview username={userProfile.username} displayName={inlineDraft?.displayName ?? (activeTab === "profile" && isProfileDialogOpen ? profileForm.displayName : userProfile.displayName)}
                bio={inlineDraft?.bio ?? (activeTab === "profile" && isProfileDialogOpen ? profileForm.bio : userProfile.bio)}
                photoURL={userProfile.photoURL} appearance={appearanceDraft ?? userProfile} links={previewLinks} />
            </aside>
          </div>
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
      ) : null}

      <footer className="py-8 text-center text-xs font-semibold tracking-wide text-[#898D7C]">
        <Globe2 aria-hidden="true" className="mr-1 inline size-3" /> Powered by MyLink
      </footer>
      <Dialog open={showAccountDelete} onOpenChange={(open) => { if (!deletingAccount) { setShowAccountDelete(open); if (!open) { setAccountDeleteText(""); setAccountDeleteError(""); } } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MyLink 계정을 영구 삭제할까요?</DialogTitle>
            <DialogDescription>
              MyLink 프로필, 모든 링크, 조회·클릭 통계, 고유 주소 및 MyLink 계정이 삭제됩니다. Google 계정과 Google 프로필 사진 자체는 삭제되지 않아요.
              복구할 수 없으며, 삭제 전에 Google 재인증이 필요해요.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="account-deletion-confirm" className="text-sm font-bold">확인을 위해 ‘탈퇴합니다’를 입력해 주세요.</label>
          <Input id="account-deletion-confirm" value={accountDeleteText} disabled={deletingAccount}
            onChange={(event) => setAccountDeleteText(event.target.value)} placeholder="탈퇴합니다" />
          {accountDeleteError ? <p role="alert" className="text-sm text-destructive">{accountDeleteError}</p> : null}
          <p className="text-xs text-muted-foreground">삭제 도중 연결이 끊기면 일부 데이터만 삭제될 수 있습니다. 오류가 표시되면 재시도해 주세요.</p>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={deletingAccount} onClick={() => setShowAccountDelete(false)}>취소</Button>
            <Button type="button" variant="destructive" disabled={deletingAccount || accountDeleteText !== "탈퇴합니다"}
              onClick={() => void handleAccountDeletion()}>
              {deletingAccount ? "계정 삭제 중..." : "영구 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={pendingTab !== null} onOpenChange={(open) => { if (!open) setPendingTab(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>저장하지 않은 변경사항이 있어요</DialogTitle>
            <DialogDescription>
              지금 다른 메뉴로 이동하면 디자인·소개글·SNS에 입력한 내용이 저장되지 않아요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingTab(null)}>계속 편집</Button>
            <Button type="button" onClick={() => {
              if (!pendingTab) return;
              const next = pendingTab;
              setPendingTab(null);
              setAppearanceDraft(null);
              setActiveTab(next);
            }}>저장하지 않고 이동</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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