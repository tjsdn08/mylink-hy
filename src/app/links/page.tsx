import { LinkList } from "@/components/links/LinkList";
import { mockLinks } from "@/data/mockLinks";

export default function LinksPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">링크 목록</h1>
        <p className="text-muted-foreground">
          관심 있는 링크를 확인하고 방문해 보세요.
        </p>
      </header>

      <LinkList links={mockLinks} />
    </main>
  );
}