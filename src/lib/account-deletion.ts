import { deleteUser, GoogleAuthProvider, reauthenticateWithPopup, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { getFirebaseFirestore, getFirebaseStorage } from "@/lib/firebase";

/**
 * Browser-side account removal for the current Firebase data model.
 * This is not an atomic cross-service transaction. A failed step leaves the
 * account signed in so the owner can retry; production-scale use should move
 * deletion orchestration to a trusted backend with a retry queue.
 */
export async function deleteMyLinkAccount(user: User, username: string): Promise<void> {
  // Reauthentication happens before the first destructive operation.
  await reauthenticateWithPopup(user, new GoogleAuthProvider());

  const db = getFirebaseFirestore();
  const uid = user.uid;

  // Remove the stored avatar while the owner is still authenticated.
  try {
    await deleteObject(storageRef(getFirebaseStorage(), `profile-images/${uid}/avatar`));
  } catch (cause) {
    if ((cause as { code?: string })?.code !== "storage/object-not-found") throw cause;
  }

  // Firestore batched writes are limited to 500 operations. Keep enough margin.
  const links = await getDocs(collection(db, "users", uid, "links"));
  for (let offset = 0; offset < links.docs.length; offset += 400) {
    const batch = writeBatch(db);
    for (const item of links.docs.slice(offset, offset + 400)) batch.delete(item.ref);
    await batch.commit();
  }

  // Prevent deleting a username owned by a different account.
  const name = username.trim().toLowerCase();
  const nameRef = name ? doc(db, "usernames", name) : null;
  if (nameRef) {
    const mapped = await getDoc(nameRef);
    if (mapped.exists() && mapped.data().uid !== uid) {
      throw new Error("고유 주소 소유권이 일치하지 않습니다. 삭제를 중단했어요.");
    }
  }

  const batch = writeBatch(db);
  batch.delete(doc(db, "users", uid, "metrics", "profile"));
  batch.delete(doc(db, "users", uid, "profile", "main"));
  if (nameRef) batch.delete(nameRef);
  batch.delete(doc(db, "users", uid));
  await batch.commit();

  // Auth must be last: deleting it first would revoke the Firestore permissions.
  await deleteUser(user);
}
