"use client";

import { useState, type FormEvent } from "react";
import { doc, increment, updateDoc } from "firebase/firestore";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CodeXml,
  Globe2,
  Pencil,
  Package,
  Trash2,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLinkFieldErrors, validateLinkForm } from "@/lib/link-validation";
import { LinkFavicon } from "@/components/links/LinkFavicon";
import { safeHttpUrl } from "@/lib/profile-design";
import { normalizeExternalUrl } from "@/lib/url-normalize";
import { getFirebaseFirestore } from "@/lib/firebase";
import type { Link as LinkItem, LinkCategory as LinkCategoryId } from "@/types/link";

const categoryIcons: Record<LinkCategoryId, LucideIcon> = {
  github: CodeXml,
  blog: BookOpen,
  portfolio: BriefcaseBusiness,
  project: Package,
  other: Globe2,
};

export interface LinkCardProps {
  link: LinkItem;
  onUpdate?: (link: LinkItem) => Promise<void>;
  onDelete?: (link: LinkItem) => void;
  trackingUserId?: string;
  compact?: boolean;
}

export function LinkCard({ link, onUpdate, onDelete, trackingUserId, compact = false }: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [description, setDescription] = useState(link.description ?? "");
  const [group, setGroup] = useState(link.group ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(link.thumbnailUrl ?? "");
  const [isActive, setIsActive] = useState(link.isActive !== false);
  const [isFeatured, setIsFeatured] = useState(link.isFeatured === true);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; url?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const Icon = categoryIcons[link.category];
  const clickCount = link.clickCount ?? 0;

  // Firestore의 원자적 증가 연산으로 동시 클릭 시 덮어쓰기 문제를 방지합니다.
  // 외부 링크는 새 탭으로 바로 열고, 클릭 기록은 현재 페이지에서 비동기 저장합니다.
  function handleLinkClick() {
    if (!trackingUserId || link.isActive === false) return;

    try {
      void updateDoc(
        doc(getFirebaseFirestore(), "users", trackingUserId, "links", link.id),
        { clickCount: increment(1) }
      ).catch((clickError: unknown) => {
        console.error("링크 클릭 수 저장 실패:", clickError);
      });
    } catch (clickError) {
      console.error("링크 클릭 수 저장 실패:", clickError);
    }
  }

  function cancelEdit() {
    setTitle(link.title);
    setUrl(link.url);
    setDescription(link.description ?? "");
    setGroup(link.group ?? "");
    setThumbnailUrl(link.thumbnailUrl ?? "");
    setIsActive(link.isActive !== false);
    setIsFeatured(link.isFeatured === true);
    setError("");
    setFieldErrors({});
    setIsEditing(false);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onUpdate) return;

    const updatedLink = { ...link, title: title.trim(), url: normalizeExternalUrl(url), description: description.trim(), group: group.trim(), thumbnailUrl: thumbnailUrl.trim(), isActive, isFeatured };
    if (thumbnailUrl.trim() && !safeHttpUrl(thumbnailUrl.trim())) { setError("썸네일은 http 또는 https 이미지 주소를 입력해 주세요."); return; }
    const errors = getLinkFieldErrors(updatedLink);
    setFieldErrors(errors);
    const validationError = validateLinkForm(updatedLink);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onUpdate(updatedLink);
      setThumbnailFailed(false);
      setIsEditing(false);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? `링크를 수정하지 못했어요: ${updateError.message}`
          : "링크를 수정하지 못했어요. 다시 시도해 주세요."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (compact) {
    if (isEditing) {
      return (
        <form noValidate onSubmit={handleUpdate} className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <Input aria-label="링크 제목" aria-invalid={Boolean(fieldErrors.title)} value={title} onChange={(event) => { setTitle(event.target.value); setError(""); setFieldErrors((current) => ({ ...current, title: undefined })); }} placeholder="링크 제목" className="h-10" />
          <Input aria-label="링크 URL" type="url" aria-invalid={Boolean(fieldErrors.url)} value={url} onBlur={() => setUrl((previous) => normalizeExternalUrl(previous))} onChange={(event) => { setUrl(event.target.value); setError(""); setFieldErrors((current) => ({ ...current, url: undefined })); }} placeholder="https://example.com" className="h-10 text-sm" />
          {fieldErrors.title ? <p role="alert" className="text-xs text-destructive">{fieldErrors.title}</p> : null}
          {fieldErrors.url ? <p role="alert" className="text-xs text-destructive">{fieldErrors.url}</p> : null}
          {error && !fieldErrors.title && !fieldErrors.url ? <p role="alert" className="text-xs font-medium text-destructive">{error}</p> : null}
          <label className="block space-y-1 text-xs font-semibold">
            <span>링크 그룹 (선택)</span>
            <input value={group} maxLength={40} placeholder="예: 프로젝트, SNS, 포트폴리오"
              onChange={(event) => setGroup(event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold">
              <span>링크 설명</span>
              <input value={description} maxLength={160} onChange={(event) => setDescription(event.target.value)}
                placeholder="이 링크에 대한 짧은 소개" className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-semibold">
              <span>썸네일 이미지 URL</span>
              <input value={thumbnailUrl} type="url" onChange={(event) => setThumbnailUrl(event.target.value)}
                placeholder="https://.../image.jpg" className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" />
            </label>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="size-4 accent-[#6B8544]" />
              공개하기
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold">
              <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} className="size-4 accent-[#6B8544]" />
              대표 링크로 강조
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={cancelEdit} disabled={isSaving}>취소</Button>
            <Button size="sm" type="submit" disabled={isSaving} className="bg-[#6B8544] text-white hover:bg-[#536C33]">{isSaving ? "저장 중..." : "저장"}</Button>
          </div>
        </form>
      );
    }
    return (
      <div className="group flex w-full items-stretch transition-transform duration-200 hover:-translate-y-[2px]">
        <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}
          aria-label={`${link.title} 링크 열기`}
          className={`public-link-button min-w-0 flex-1 overflow-hidden rounded-[18px] border border-[#252823]/10 bg-white transition-all duration-200 hover:border-[#7F9856] hover:bg-[#F8FAEE] hover:shadow-[0_6px_0_rgba(65,77,45,0.08)] dark:border-white/10 dark:bg-[#323A33] dark:hover:bg-[#3E463E] ${onUpdate || onDelete ? "rounded-r-none border-r-0" : ""}`}>
          {link.isFeatured && link.thumbnailUrl && safeHttpUrl(link.thumbnailUrl) && !thumbnailFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer"
              onError={() => setThumbnailFailed(true)} className="h-36 w-full object-cover" />
          ) : null}
          <div className="flex min-h-[76px] items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] border border-[#252823]/5 bg-[#F1F3E7] dark:bg-white/10">
              {link.thumbnailUrl && !link.isFeatured && safeHttpUrl(link.thumbnailUrl) && !thumbnailFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={link.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setThumbnailFailed(true)} className="size-10 rounded-lg object-cover" />
              ) : <LinkFavicon url={link.url} className="size-5 text-muted-foreground" />}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="link-title truncate text-[15px] font-extrabold tracking-tight text-[#252823] group-hover:text-[#566F32] dark:text-[#F8F6F1] dark:group-hover:text-[#DDF76B]">
                {link.title}
                {link.isFeatured ? <span className="ml-2 rounded-full bg-[#DDF76B] px-2 py-0.5 text-[10px] font-bold text-[#354027]">추천</span> : null}
                {onUpdate || onDelete ? <span className="ml-2 text-[11px] font-normal text-muted-foreground">{clickCount.toLocaleString("ko-KR")} 클릭</span> : null}
              </p>
              {onUpdate || onDelete ? <p className="mt-1 truncate text-xs text-muted-foreground">{link.url}</p> : null}
              {link.description ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{link.description}</p> : null}
              {(onUpdate || onDelete) && link.isActive === false ? <p className="mt-1 text-[11px] font-bold text-[#B95C45]">비공개 · 방문자에게 숨겨짐</p> : null}
            </div>
            {!(onUpdate || onDelete) ? <ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground" /> : null}
          </div>
        </a>
        {onUpdate || onDelete ? (
          <div className="flex shrink-0 flex-col overflow-hidden rounded-r-[18px] border border-[#252823]/10 bg-white dark:border-white/10 dark:bg-[#323A33]">
            {onUpdate ? (
              <button type="button" title="수정" aria-label={`${link.title} 수정`} onClick={() => setIsEditing(true)}
                className="flex min-h-11 w-12 flex-1 items-center justify-center border-b border-border/70 text-muted-foreground transition-colors hover:bg-[#6B8544]/10 hover:text-[#6B8544]">
                <Pencil aria-hidden="true" className="size-4" />
              </button>
            ) : null}
            {onDelete ? (
              <button type="button" title="삭제" aria-label={`${link.title} 삭제`} onClick={() => onDelete(link)}
                className="flex min-h-11 w-12 flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="h-full rounded-2xl border-border/70 bg-card p-4 shadow-tds-1 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-tds-2 sm:p-5">
      {isEditing ? (
        <form className="space-y-4" noValidate onSubmit={handleUpdate}>
          <CardHeader className="px-0">
            <CardTitle className="text-title-2">링크 수정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-0">
            <div className="space-y-2">
              <label htmlFor={`edit-title-${link.id}`} className="text-label-s">
                링크 제목
              </label>
              <Input
                id={`edit-title-${link.id}`}
                value={title}
                aria-invalid={Boolean(error && !title.trim())}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError("");
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={`edit-url-${link.id}`} className="text-label-s">
                URL
              </label>
              <Input
                id={`edit-url-${link.id}`}
                type="url"
                value={url}
                aria-invalid={Boolean(error && title.trim())}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError("");
                }}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end gap-2 px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEdit}
              disabled={isSaving}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <>
        <CardContent className="flex items-start gap-3 px-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-2 text-[15px] font-bold leading-snug">{link.title}</CardTitle>
            {link.description ? (
              <CardDescription className="mt-1 line-clamp-2 text-body-3 leading-relaxed">
                {link.description}
              </CardDescription>
            ) : null}
            <p className="mt-1.5 truncate text-caption text-muted-foreground" title={link.url}>
              {link.url}
            </p>
            <p
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-caption text-muted-foreground"
              aria-label={`${link.title} 링크 클릭 ${clickCount.toLocaleString("ko-KR")}회`}
            >
              <MousePointerClick aria-hidden="true" className="size-3.5" />
              <span aria-hidden="true">{clickCount.toLocaleString("ko-KR")}</span>
            </p>
            {link.updatedAt ? (
              <p className="mt-1 text-caption-s text-muted-foreground">
                수정 {link.updatedAt.toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                  hourCycle: "h23",
                })}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {onUpdate ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`${link.title} 수정`}
                title="수정"
                onClick={() => setIsEditing(true)}
              >
                <Pencil aria-hidden="true" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`${link.title} 삭제`}
                title="삭제"
                onClick={() => onDelete(link)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            ) : null}
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.title} 새 탭에서 열기`}
              title="새 탭에서 열기"
              onClick={handleLinkClick}
              className={buttonVariants({
                variant: "ghost",
                size: "icon",
                className: "rounded-full text-muted-foreground",
              })}
            >
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </CardContent>
        </>
      )}
    </Card>
  );
}