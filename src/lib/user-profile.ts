import {
  doc,
  deleteField,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseFirestore } from "@/lib/firebase";

export interface UserProfileDocument {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  username: string;
  bio: string;
  theme?: "cream" | "lavender" | "midnight";
  backgroundColor?: string;
  buttonStyle?: "rounded" | "pill" | "square";
  coverStyle?: "orbits" | "grid" | "minimal";
  headline?: string;
  about?: string;
  now?: string;
  socialLinks?: { platform: string; url: string }[];
}

export interface EditableUserProfile {
  username: string;
  displayName: string;
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
    const firestore = getFirebaseFirestore();
    const userRef = doc(firestore, "users", user.uid);
    const userSnapshot = await getDoc(userRef);
    const userData = userSnapshot.data();
    const profileRef = doc(firestore, "users", user.uid, "profile", "main");
    const profileSnapshot = await getDoc(profileRef);

    const storedProfile = profileSnapshot.data() ?? userData ?? {};
    const migratedProfile: UserProfileDocument = {
      uid: user.uid,
      displayName:
        (typeof storedProfile.displayName === "string" &&
          storedProfile.displayName) ||
        (typeof userData?.displayName === "string" && userData.displayName) ||
        user.email?.split("@")[0] ||
        "사용자",
      email:
        (typeof storedProfile.email === "string" && storedProfile.email) ||
        (typeof userData?.email === "string" && userData.email) ||
        user.email ||
        "",
      photoURL:
        (typeof storedProfile.photoURL === "string" &&
          storedProfile.photoURL) ||
        user.photoURL ||
        "",
      username:
        (typeof storedProfile.username === "string" &&
          storedProfile.username) ||
        (typeof userData?.username === "string" && userData.username) ||
        "",
      bio:
        (typeof storedProfile.bio === "string" && storedProfile.bio) ||
        (typeof userData?.bio === "string" && userData.bio) ||
        "",
      theme: ["cream", "lavender", "midnight"].includes(storedProfile.theme) ? storedProfile.theme : "cream",
      backgroundColor: typeof storedProfile.backgroundColor === "string" ? storedProfile.backgroundColor : "",
      buttonStyle: ["rounded", "pill", "square"].includes(storedProfile.buttonStyle) ? storedProfile.buttonStyle : "rounded",
      coverStyle: ["orbits", "grid", "minimal"].includes(storedProfile.coverStyle) ? storedProfile.coverStyle : "orbits",
      headline: typeof storedProfile.headline === "string" ? storedProfile.headline : "",
      about: typeof storedProfile.about === "string" ? storedProfile.about : "",
      now: typeof storedProfile.now === "string" ? storedProfile.now : "",
      socialLinks: Array.isArray(storedProfile.socialLinks) ? storedProfile.socialLinks.filter((item: unknown) => item !== null && typeof item === "object" && "platform" in item && "url" in item).slice(0, 8) as { platform: string; url: string }[] : [],
    };

    await runTransaction(firestore, async (transaction) => {
      const usernameRef = migratedProfile.username
        ? doc(
            firestore,
            "usernames",
            migratedProfile.username.toLowerCase()
          )
        : null;
      const [currentUserSnapshot, currentProfileSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(profileRef),
      ]);
      const usernameSnapshot = usernameRef
        ? await transaction.get(usernameRef)
        : null;

      if (
        usernameSnapshot?.exists() &&
        usernameSnapshot.data().uid !== user.uid
      ) {
        throw new Error("이미 다른 계정에서 사용 중인 Username이에요.");
      }

      if (!currentUserSnapshot.exists()) {
        transaction.set(userRef, {
          ...migratedProfile,
          createdAt: serverTimestamp(),
        });
      } else if (typeof currentUserSnapshot.data().email !== "string") {
        transaction.update(userRef, { email: migratedProfile.email });
      }

      if (!currentProfileSnapshot.exists()) {
        transaction.set(profileRef, {
          uid: migratedProfile.uid,
          username: migratedProfile.username,
          displayName: migratedProfile.displayName,
          photoURL: migratedProfile.photoURL,
          bio: migratedProfile.bio,
          createdAt: serverTimestamp(),
        });
      } else if ("email" in currentProfileSnapshot.data()) {
        transaction.update(profileRef, { email: deleteField() });
      }

      if (usernameRef && !usernameSnapshot?.exists()) {
        transaction.set(usernameRef, {
          uid: user.uid,
          username: migratedProfile.username.toLowerCase(),
          createdAt: serverTimestamp(),
        });
      }
    });

    return migratedProfile;
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

export async function saveUserProfile(
  userId: string,
  profile: EditableUserProfile
): Promise<void> {
  const firestore = getFirebaseFirestore();
  const username = profile.username.trim().toLowerCase();
  const userRef = doc(firestore, "users", userId);
  const profileRef = doc(firestore, "users", userId, "profile", "main");
  const usernameRef = doc(firestore, "usernames", username);

  await runTransaction(firestore, async (transaction) => {
    const [userSnapshot, profileSnapshot, usernameSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(profileRef),
      transaction.get(usernameRef),
    ]);

    if (!userSnapshot.exists()) {
      throw new Error("사용자 프로필을 찾을 수 없어요. 다시 로그인해 주세요.");
    }

    const currentProfile = profileSnapshot.data() ?? userSnapshot.data();
    const currentUsername =
      typeof currentProfile.username === "string"
        ? currentProfile.username.toLowerCase()
        : "";
    const oldUsernameRef = currentUsername
      ? doc(firestore, "usernames", currentUsername)
      : null;
    const oldUsernameSnapshot = oldUsernameRef
      ? await transaction.get(oldUsernameRef)
      : null;

    if (
      usernameSnapshot.exists() &&
      usernameSnapshot.data().uid !== userId
    ) {
      throw new Error("이미 사용 중인 Username이에요.");
    }

    transaction.set(usernameRef, {
      uid: userId,
      username,
      updatedAt: serverTimestamp(),
    });

    if (
      oldUsernameRef &&
      oldUsernameSnapshot?.exists() &&
      oldUsernameSnapshot.data().uid === userId &&
      currentUsername !== username
    ) {
      transaction.delete(oldUsernameRef);
    }

    const updatedProfile = {
      uid: userId,
      username,
      displayName: profile.displayName.trim(),
      photoURL: userSnapshot.data().photoURL ?? "",
      bio: profile.bio.trim(),
      updatedAt: serverTimestamp(),
    };

    transaction.set(profileRef, updatedProfile, { merge: true });
    transaction.update(userRef, {
      username,
      displayName: updatedProfile.displayName,
      bio: updatedProfile.bio,
      updatedAt: serverTimestamp(),
    });
  });
}