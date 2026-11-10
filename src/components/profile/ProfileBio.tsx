import { Badge } from "@/components/ui/badge";
import type { ProfileInfo } from "@/types/profile";

export interface ProfileBioProps {
  profile: ProfileInfo;
}

export function ProfileBio({ profile }: ProfileBioProps) {
  return (
    <>
      <div className="min-w-0 pt-0.5">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-accent text-accent-foreground"
          >
            {profile.role}
          </Badge>
          <span className="text-caption text-muted-foreground">
            {profile.level}
          </span>
        </div>
        <h1 className="text-h1 text-foreground">{profile.name}</h1>
        <p className="mt-0.5 text-body-3 text-muted-foreground">
          {profile.tagline}
        </p>
      </div>
      <div className="col-span-2 mt-5 border-t border-muted pt-4">
        <p className="break-keep text-body-2 text-secondary-foreground">
          {profile.bio}
        </p>
      </div>
    </>
  );
}