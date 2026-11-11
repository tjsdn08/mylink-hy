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
import { validateLinkForm } from "@/lib/link-validation";
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
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const Icon = categoryIcons[link.category];
  const clickCount = link.clickCount ?? 0;

  // Firestore의 원자적 증가 연산으로 동시 클릭 시 덮어쓰기 문제를 방지합니다.
  // 외부 링크는 새 탭으로 바로 열고, 클릭 기록은 현재 페이지에서 비동기 저장합니다.
  function handleLinkClick() {
    if (!trackingUserId) return;

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
    setError("");
    setIsEditing(false);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onUpdate) return;

    const updatedLink = { ...link, title: title.trim(), url: url.trim() };
    const validationError = validateLinkForm(updatedLink);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onUpdate(updatedLink);
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
          <Input aria-label="링크 제목" value={title} onChange={(event) => { setTitle(event.target.value); setError(""); }} placeholder="링크 제목" className="h-9" />
          <Input aria-label="링크 URL" type="url" value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="https://example.com" className="h-9 text-xs" />
          {error ? <p role="alert" className="text-xs font-medium text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={cancelEdit} disabled={isSaving}>취소</Button>
            <Button size="sm" type="submit" disabled={isSaving} className="bg-[#5b5fc7] text-white hover:bg-[#4c50ab]">{isSaving ? "저장 중..." : "저장"}</Button>
          </div>
        </form>
      );
    }
    return (
      <div className="group flex w-full items-stretch">
        <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}
          aria-label={`${link.title} 링크 열기`}
          className={`min-w-0 flex-1 rounded-xl border border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-sm ${onUpdate || onDelete ? "rounded-r-none border-r-0" : ""}`}>
          <div className="flex items-center gap-4 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted">
              <Icon aria-hidden="true" className="size-5 text-muted-foreground transition-colors group-hover:text-[#5b5fc7]" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[15px] font-semibold text-card-foreground group-hover:text-[#5b5fc7]">
                {link.title}
                {onUpdate || onDelete ? <span className="ml-2 text-[11px] font-normal text-muted-foreground">{clickCount.toLocaleString("ko-KR")} 클릭</span> : null}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{link.url}</p>
              {link.description ? <p className="mt-1 truncate text-xs text-muted-foreground">{link.description}</p> : null}
            </div>
            {!(onUpdate || onDelete) ? <ArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground" /> : null}
          </div>
        </a>
        {onUpdate || onDelete ? (
          <div className="flex shrink-0 flex-col overflow-hidden rounded-r-xl border border-border/70 bg-card">
            {onUpdate ? (
              <button type="button" title="수정" aria-label={`${link.title} 수정`} onClick={() => setIsEditing(true)}
                className="flex min-h-10 w-11 flex-1 items-center justify-center border-b border-border/70 text-muted-foreground transition-colors hover:bg-[#5b5fc7]/10 hover:text-[#5b5fc7]">
                <Pencil aria-hidden="true" className="size-4" />
              </button>
            ) : null}
            {onDelete ? (
              <button type="button" title="삭제" aria-label={`${link.title} 삭제`} onClick={() => onDelete(link)}
                className="flex min-h-10 w-11 flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
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