export type LinkCategory = "github" | "blog" | "portfolio" | "project" | "other";

export interface Link {
  id: string;
  title: string;
  url: string;
  description: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  category: LinkCategory;
  clickCount?: number;
  updatedAt?: Date;
}