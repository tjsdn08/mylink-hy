"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(
        getFirebaseAuth(),
        (nextUser) => {
          if (disposed) return;
          setUser(nextUser);
          setError("");
          setLoading(false);
        },
        (cause) => {
          if (disposed) return;
          setError(cause.message);
          setLoading(false);
        }
      );
    } catch (cause) {
      queueMicrotask(() => {
        if (disposed) return;
        setError(cause instanceof Error ? cause.message : "Firebase 인증을 초기화하지 못했어요.");
        setLoading(false);
      });
    }
    return () => { disposed = true; unsubscribe?.(); };
  }, []);

  async function signInWithGoogle(): Promise<void> {
    const auth = getFirebaseAuth();
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async function signOut(): Promise<void> {
    await firebaseSignOut(getFirebaseAuth());
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth은 AuthProvider 안에서 사용해야 합니다.");
  return context;
}
