import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CodeXml,
  Globe2,
  Package,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
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
}

export function LinkCard({ link }: LinkCardProps) {
  const Icon = categoryIcons[link.category];

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${link.title}: ${link.description}`}
      className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full rounded-3xl border-border/70 bg-card p-5 shadow-tds-1 transition-colors hover:bg-muted/50 sm:p-6">
        <CardContent className="flex items-start gap-4 px-0">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-muted text-secondary-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <CardTitle className="text-title-2">{link.title}</CardTitle>
            <CardDescription className="mt-1 text-body-3 leading-relaxed">
              {link.description}
            </CardDescription>
            <p className="mt-2 break-all text-caption text-muted-foreground">
              {link.url}
            </p>
          </div>

          <span
            aria-hidden="true"
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "shrink-0 rounded-full text-muted-foreground",
            })}
          >
            <ArrowUpRight />
          </span>
        </CardContent>
      </Card>
    </a>
  );
}