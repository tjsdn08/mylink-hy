import { LinkCategory } from "@/components/links/LinkCategory";
import { LinkCard } from "@/components/links/LinkCard";
import type {
  Link as LinkItem,
  LinkCategory as LinkCategoryId,
} from "@/types/link";

const categoryOrder: LinkCategoryId[] = [
  "github",
  "blog",
  "portfolio",
  "project",
  "other",
];

export interface LinkListProps {
  links: LinkItem[];
  onUpdate?: (link: LinkItem) => Promise<void>;
  onDelete?: (link: LinkItem) => void;
  onDraftChange?: (draft: LinkItem | null) => void;
  trackingUserId?: string;
  compact?: boolean;
  onReorder?: (fromId: string, toId: string) => Promise<void>;
}

export function LinkList({ links, onUpdate, onDelete, onDraftChange, trackingUserId, compact = false, onReorder }: LinkListProps) {
  if (compact) {
    if (!onReorder) {
      const featured = links.filter((link) => link.isFeatured);
      const remaining = links.filter((link) => !link.isFeatured);
      const categoryNames: Partial<Record<LinkCategoryId, string>> = {
        github: "개발과 코드",
        blog: "글과 기록",
        portfolio: "포트폴리오",
        project: "프로젝트",
      };
      const sectionName = (link: LinkItem) =>
        link.group?.trim() || (link.category !== "other" ? categoryNames[link.category] ?? "다른 링크" : "다른 링크");
      const names = [...new Set(remaining.map(sectionName))];
      const renderCard = (link: LinkItem, index: number) => (
        <li key={link.id} className="motion-safe:animate-[mylink-rise_450ms_ease-out_both]"
          style={{ animationDelay: `${Math.min(index * 60, 420)}ms` }}>
          <LinkCard link={link} trackingUserId={trackingUserId} compact />
        </li>
      );

      return (
        <div className="space-y-7">
          {featured.length > 0 ? (
            <section aria-label="추천 링크" className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-base font-black tracking-tight">✳ 가장 먼저 소개할게요</h3>
                <span className="text-[10px] font-bold uppercase tracking-[.15em] opacity-60">FEATURED</span>
              </div>
              <ul className="profile-link-list profile-featured-list flex flex-col gap-3">
                {featured.map(renderCard)}
              </ul>
            </section>
          ) : null}
          {names.map((name) => (
            <section key={name} className="space-y-3" aria-label={name}>
              <div className="flex items-center gap-3 px-1">
                <span aria-hidden="true" className="h-px w-5 bg-current opacity-35" />
                <h3 className="text-[15px] font-extrabold tracking-tight">{name}</h3>
                <span className="ml-auto text-[11px] font-semibold opacity-55">
                  {remaining.filter((link) => sectionName(link) === name).length.toString().padStart(2, "0")}
                </span>
              </div>
              <ul className="profile-link-list flex flex-col gap-3">
                {remaining.filter((link) => sectionName(link) === name).map(renderCard)}
              </ul>
            </section>
          ))}
        </div>
      );
    }
    return (
      <ul className="profile-link-list flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", link.id);
            }}
            onDragOver={(event) => { event.preventDefault(); }}
            onDrop={(event) => {
              event.preventDefault();
              const from = event.dataTransfer.getData("text/plain");
              if (from) void onReorder(from, link.id);
            }}
            className="relative"
          >
            <LinkCard link={link} onUpdate={onUpdate} onDelete={onDelete} onDraftChange={onDraftChange} trackingUserId={trackingUserId} compact />
            <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                <span className="mr-auto">끌어서 순서 변경</span>
                <button type="button" disabled={links[0].id === link.id} onClick={() => void onReorder(link.id, links[links.indexOf(link) - 1].id)}
                  className="rounded-md px-2 py-1 hover:bg-muted disabled:opacity-30" aria-label={`${link.title} 위로 이동`}>↑ 위로</button>
                <button type="button" disabled={links[links.length - 1].id === link.id} onClick={() => void onReorder(link.id, links[links.indexOf(link) + 1].id)}
                  className="rounded-md px-2 py-1 hover:bg-muted disabled:opacity-30" aria-label={`${link.title} 아래로 이동`}>↓ 아래로</button>
              </div>
          </li>
        ))}
      </ul>
    );
  }
  const categories = categoryOrder
    .map((category) => ({
      category,
      links: links.filter((link) => link.category === category),
    }))
    .filter((group) => group.links.length > 0);

  return (
    <div className="space-y-6">
      {categories.map((group) => (
        <LinkCategory
          key={group.category}
          category={group.category}
          links={group.links}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDraftChange={onDraftChange}
          trackingUserId={trackingUserId}
        />
      ))}
    </div>
  );
}