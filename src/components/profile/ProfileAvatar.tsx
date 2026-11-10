import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export interface ProfileAvatarProps {
  imageUrl: string | null;
  alt: string;
  fallbackText: string;
}

export function ProfileAvatar({
  imageUrl,
  alt,
  fallbackText,
}: ProfileAvatarProps) {
  return (
    <Avatar size="lg" className="size-20 border border-border bg-muted sm:size-[88px]">
      {imageUrl ? <AvatarImage src={imageUrl} alt={alt} /> : null}
      <AvatarFallback aria-label={alt} className="text-h3">
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
}