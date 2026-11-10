"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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
import { LinkList } from "@/components/links/LinkList";
import { mockLinks } from "@/data/mockLinks";
import { getFirebaseFirestore } from "@/lib/firebase";
import type { Link } from "@/types/link";

interface LinkFormValues {
  title: string;
  url: string;
}

const emptyForm: LinkFormValues = { title: "", url: "" };

function validateUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "http 또는 https 주소를 입력해 주세요.";
    }
    return null;
  } catch {
    return "올바른 URL을 입력해 주세요. 예: https://example.com";
  }
}

export default function MyPage() {
  const [firestoreLinks, setFirestoreLinks] = useState<Link[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<LinkFormValues>(emptyForm);
  const [error, setError] = useState("");
  const links = [...firestoreLinks, ...mockLinks];

  useEffect(() => {
    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;

    void Promise.resolve()
      .then(() => {
        const linksCollection = collection(
          getFirebaseFirestore(),
          "users",
          "anonymous",
          "links"
        );

        if (isCancelled) return;

        unsubscribe = onSnapshot(
          query(linksCollection, orderBy("createdAt", "desc")),
          (snapshot) => {
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
                },
              ];
            });

            setFirestoreLinks(savedLinks);
            setLoadError("");
          },
          (snapshotError) => {
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
  }, []);

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

    const title = form.title.trim();
    const url = form.url.trim();

    if (!title) {
      setError("링크 제목을 입력해 주세요.");
      return;
    }

    if (!url) {
      setError("URL을 입력해 주세요.");
      return;
    }

    const urlError = validateUrl(url);
    if (urlError) {
      setError(urlError);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await addDoc(
        collection(getFirebaseFirestore(), "users", "anonymous", "links"),
        {
          title,
          url,
          description: "",
          category: "other",
          createdAt: serverTimestamp(),
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

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-h1 text-foreground">마이페이지</h1>
          <p className="text-body-2 text-muted-foreground">
            내 페이지에 표시할 링크를 확인하고 추가해요.
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
                <DialogClose render={<Button variant="outline" type="button" />}>
                  취소
                </DialogClose>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "저장 중..." : "추가"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {loadError ? (
        <p role="alert" className="text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      <LinkList links={links} />
    </main>
  );
}