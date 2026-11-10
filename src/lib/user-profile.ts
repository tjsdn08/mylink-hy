import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseFirestore } from "@/lib/firebase";

export interface UserProfileDocument {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  username: string;
  bio: string;
}

const pendingProfileChecks = new Map<
  string,
  Promise<UserProfileDocument>
>();

export function ensureUserProfileDocument(
  user: User
): Promise<UserProfileDocument> {
  const pendingCheck = pendingProfileChecks.get(user.uid);
  if (pendingCheck) return pendingCheck;

  const profileCheck = (async () => {
    const profileRef = doc(getFirebaseFirestore(), "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (profileSnapshot.exists()) {
      const profile = profileSnapshot.data();
      return {
        uid: user.uid,
        displayName:
          typeof profile.displayName === "string"
            ? profile.displayName
            : user.email?.split("@")[0] || "사용자",
        email: typeof profile.email === "string" ? profile.email : user.email ?? "",
        photoURL:
          typeof profile.photoURL === "string" ? profile.photoURL : user.photoURL ?? "",
        username: typeof profile.username === "string" ? profile.username : "",
        bio: typeof profile.bio === "string" ? profile.bio : "",
      };
    }

    const newProfile: UserProfileDocument = {
      uid: user.uid,
      displayName: user.email?.split("@")[0] || "사용자",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      username: "",
      bio: "",
    };

    await setDoc(profileRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
    });
    return newProfile;
  })();

  pendingProfileChecks.set(user.uid, profileCheck);
  const clearPendingCheck = () => {
    if (pendingProfileChecks.get(user.uid) === profileCheck) {
      pendingProfileChecks.delete(user.uid);
    }
  };
  void profileCheck.then(clearPendingCheck, clearPendingCheck);

  return profileCheck;
}