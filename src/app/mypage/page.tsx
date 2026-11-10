"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
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
import { LinkList } from "@/components/links/LinkList";
import { getFirebaseFirestore } from "@/lib/firebase";
import { validateLinkForm } from "@/lib/link-validation";
import type { Link } from "@/types/link";

interface LinkFormValues {
  title: string;
  url: string;
}

const emptyForm: LinkFormValues = { title: "", url: "" };

export default function MyPage() {
  const [firestoreLinks, setFirestoreLinks] = useState<Link[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<LinkFormValues>(emptyForm);
  const [error, setError] = useState("");
  const links = firestoreLinks;

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
                  updatedAt:
                    data.updatedAt instanceof Timestamp
                      ? data.updatedAt.toDate()
                      : undefined,
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

    const validationError = validateLinkForm({ title, url });
    if (validationError) {
      setError(validationError);
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
    await updateDoc(
      doc(getFirebaseFirestore(), "users", "anonymous", "links", link.id),
      {
        title: link.title,
        url: link.url,
        updatedAt: serverTimestamp(),
      }
    );
  }

  async function handleDeleteLink() {
    if (!linkToDelete) return;

    setIsDeleting(true);
    setLoadError("");
    try {
      await deleteDoc(
        doc(
          getFirebaseFirestore(),
          "users",
          "anonymous",
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

      <LinkList
        links={links}
        onUpdate={handleUpdateLink}
        onDelete={setLinkToDelete}
      />

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