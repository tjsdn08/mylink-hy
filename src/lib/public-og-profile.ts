interface FirestoreDocument {
  fields?: Record<string, { stringValue?: string }>;
}

export interface PublicOgProfile {
  username: string;
  displayName: string;
  bio: string;
}

async function getPublicDocument(projectId: string, path: string): Promise<FirestoreDocument | null> {
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${path}`
  );
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (apiKey) url.searchParams.set("key", apiKey);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3500) });
  return response.ok ? (await response.json()) as FirestoreDocument : null;
}

/** Firebase 보안 규칙에 따라 공개로 읽을 수 있는 데이터만 사용합니다. */
export async function getPublicOgProfile(username: string): Promise<PublicOgProfile | null> {
  const key = username.toLowerCase();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId || !/^[a-z0-9_]{3,20}$/.test(key)) return null;

  try {
    const mapping = await getPublicDocument(projectId, `usernames/${encodeURIComponent(key)}`);
    const uid = mapping?.fields?.uid?.stringValue;
    if (!uid || !/^[a-zA-Z0-9_-]{8,128}$/.test(uid)) return null;

    const profile = await getPublicDocument(projectId, `users/${encodeURIComponent(uid)}/profile/main`);
    const fields = profile?.fields;
    if (fields?.username?.stringValue?.toLowerCase() !== key) return null;

    return {
      username: key,
      displayName: fields.displayName?.stringValue?.trim() || key,
      bio: fields.bio?.stringValue?.trim() || "",
    };
  } catch {
    return null;
  }
}
