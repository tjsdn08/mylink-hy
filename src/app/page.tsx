import { profilePageData } from "@/data/profile";
import { ProfilePage } from "@/components/profile/ProfilePage";

export default function Home() {
  return <ProfilePage data={profilePageData} />;
}
