import {
  BookOpen,
  BriefcaseBusiness,
  CodeXml,
  Globe2,
  Package,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LinkCard } from "@/components/links/LinkCard";
import type {
  Link as LinkItem,
  LinkCategory as LinkCategoryId,
} from "@/types/link";

const categoryDetails: Record<
  LinkCategoryId,
  { title: string; icon: LucideIcon }
> = {
  github: { title: "GitHub", icon: CodeXml },
  blog: { title: "기술 블로그", icon: BookOpen },
  portfolio: { title: "포트폴리오", icon: BriefcaseBusiness },
  project: { title: "프로젝트 소개", icon: Package },
  other: { title: "기타", icon: Globe2 },
};

export interface LinkCategoryProps {
  category: LinkCategoryId;
  links: LinkItem[];
  onUpdate?: (link: LinkItem) => Promise<void>;
  onDelete?: (link: LinkItem) => void;
}

export function LinkCategory({
  category,
  links,
  onUpdate,
  onDelete,
}: LinkCategoryProps) {
  const { title, icon: Icon } = categoryDetails[category];

  return (
    <section aria-labelledby={`link-category-${category}`} className="space-y-3">
      <header className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <h2
            id={`link-category-${category}`}
            className="truncate text-title-1 text-foreground"
          >
            {title}
          </h2>
        </div>
        <Badge variant="secondary" aria-label={`${links.length}개 링크`}>
          {links.length}
        </Badge>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.id}>
            <LinkCard link={link} onUpdate={onUpdate} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </section>
  );
}