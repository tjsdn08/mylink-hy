export interface ProfileInfo {
  imageUrl: string | null;
  imageAlt: string;
  fallbackText: string;
  name: string;
  role: string;
  level: string;
  tagline: string;
  bio: string;
}

export interface ProfileHighlight {
  label: string;
  title: string;
  description: string;
}

export interface ProfileTechnology {
  name: string;
  featured: boolean;
}

export interface ProfilePageData {
  profile: ProfileInfo;
  highlights: ProfileHighlight[];
  technologies: ProfileTechnology[];
  contactHref: string;
}