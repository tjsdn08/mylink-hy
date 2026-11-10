import { Card } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileBio } from "@/components/profile/ProfileBio";
import type { ProfileInfo } from "@/types/profile";

export interface ProfileCardProps {
  profile: ProfileInfo;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card className="gap-0 rounded-3xl border-border/70 bg-card p-6 shadow-tds-1 sm:p-7">
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 sm:gap-x-5">
        <ProfileAvatar
          imageUrl={profile.imageUrl}
          alt={profile.imageAlt}
          fallbackText={profile.fallbackText}
        />
        <ProfileBio profile={profile} />
      </div>
    </Card>
  );
}