import { LinkCategory } from "@/components/links/LinkCategory";
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
}

export function LinkList({ links, onUpdate, onDelete, trackingUserId }: LinkListProps) {
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