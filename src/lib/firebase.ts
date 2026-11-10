import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const missingValues = Object.entries(config)
    .filter(([key, value]) => key !== "measurementId" && !value)
    .map(([key]) => key);

  if (missingValues.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missingValues.join(", ")}`
    );
  }

  return config;
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0
    ? getApp()
    : initializeApp(getFirebaseConfig());
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}

export async function getFirebaseAnalytics() {
  if (typeof window === "undefined") return null;

  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (!(await isSupported())) return null;

  return getAnalytics(getFirebaseApp());
}