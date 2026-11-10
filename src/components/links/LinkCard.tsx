"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CodeXml,
  Globe2,
  Pencil,
  Package,
  Trash2,
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
}

export function LinkCard({ link, onUpdate, onDelete }: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const Icon = categoryIcons[link.category];

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

  return (
    <Card className="h-full rounded-3xl border-border/70 bg-card p-5 shadow-tds-1 sm:p-6">
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
        <CardContent className="flex items-start gap-4 px-0">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-muted text-secondary-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <CardTitle className="text-title-2">{link.title}</CardTitle>
            {link.description ? (
              <CardDescription className="mt-1 text-body-3 leading-relaxed">
                {link.description}
              </CardDescription>
            ) : null}
            <p className="mt-2 break-all text-caption text-muted-foreground">
              {link.url}
            </p>
            {link.updatedAt ? (
              <p className="mt-1 text-caption-s text-muted-foreground">
                수정 {link.updatedAt.toLocaleString("ko-KR")}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {onUpdate ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
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
                size="icon"
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