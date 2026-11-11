import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-[65vh] w-full flex-col items-center justify-center gap-4 px-4" role="status" aria-live="polite">
      <LoaderCircle aria-hidden="true" className="size-9 animate-spin text-[#5b5fc7]" />
      <p className="text-sm font-medium text-muted-foreground">페이지를 불러오고 있어요...</p>
    </main>
  );
}
