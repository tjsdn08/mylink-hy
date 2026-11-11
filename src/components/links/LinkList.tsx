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
  trackingUserId?: string;
  compact?: boolean;
  onReorder?: (fromId: string, toId: string) => Promise<void>;
}

export function LinkList({ links, onUpdate, onDelete, trackingUserId, compact = false, onReorder }: LinkListProps) {
  if (compact) {
    if (!onReorder) {
      const names = [...new Set(links.map((link) => link.group?.trim() || ""))];
      return (
        <div className="space-y-7">
          {names.map((name) => (
            <section key={name || "ungrouped"} className="space-y-3" aria-label={name || "기타 링크"}>
              {name ? <h3 className="px-1 text-base font-extrabold tracking-tight">{name}</h3> : null}
              <ul className="profile-link-list flex flex-col gap-3">
                {links.filter((link) => (link.group?.trim() || "") === name).map((link) => (
                  <li key={link.id}><LinkCard link={link} trackingUserId={trackingUserId} compact /></li>
                ))}
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
            draggable={Boolean(onReorder)}
            onDragStart={(event) => {
              if (onReorder) event.dataTransfer.setData("text/plain", link.id);
            }}
            onDragOver={(event) => { if (onReorder) event.preventDefault(); }}
            onDrop={(event) => {
              if (!onReorder) return;
              event.preventDefault();
              const from = event.dataTransfer.getData("text/plain");
              if (from) void onReorder(from, link.id);
            }}
            className="relative"
          >
            <LinkCard link={link} onUpdate={onUpdate} onDelete={onDelete} trackingUserId={trackingUserId} compact />
            {onReorder ? (
              <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                <span className="mr-auto">끌어서 순서 변경</span>
                <button type="button" disabled={links[0].id === link.id} onClick={() => void onReorder(link.id, links[links.indexOf(link) - 1].id)}
                  className="rounded-md px-2 py-1 hover:bg-muted disabled:opacity-30" aria-label={`${link.title} 위로 이동`}>↑ 위로</button>
                <button type="button" disabled={links[links.length - 1].id === link.id} onClick={() => void onReorder(link.id, links[links.indexOf(link) + 1].id)}
                  className="rounded-md px-2 py-1 hover:bg-muted disabled:opacity-30" aria-label={`${link.title} 아래로 이동`}>↓ 아래로</button>
              </div>
            ) : null}
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
          trackingUserId={trackingUserId}
        />
      ))}
    </div>
  );
}