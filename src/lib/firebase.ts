"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

// The web config is public by design; access is controlled by firestore.rules.
// NEXT_PUBLIC_FIREBASE_* env variables override the live project's values (e.g. for local testing).
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAxy6lpPyxw0nMs5fXk83BCdaMof-vDVfw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "smarthomekj-ea651.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "smarthomekj-ea651",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "smarthomekj-ea651.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "994311642135",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:994311642135:web:8a94b97c9f75053837d052",
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

// Local testing against `firebase emulators:start` (README → Local development).
const emulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1";
const connected = new WeakSet<object>();

let app: FirebaseApp | null = null;

export function firebaseApp() {
  if (!firebaseConfigured) return null;
  app ??= getApps().length ? getApp() : initializeApp(config);
  return app;
}

/** Firestore, or null when Firebase is not configured yet (the site then shows the bundled starter catalogue). */
export function firestore(): Firestore | null {
  const a = firebaseApp();
  if (!a) return null;
  const db = getFirestore(a);
  if (emulator && !connected.has(db)) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connected.add(db);
  }
  return db;
}

export function firebaseAuth(): Auth | null {
  const a = firebaseApp();
  return a ? withEmulator(getAuth(a)) : null;
}

function withEmulator(auth: Auth) {
  if (emulator && !connected.has(auth)) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connected.add(auth);
  }
  return auth;
}

/** A second app instance lets an admin create accounts for colleagues without being signed out. */
export function secondaryAuth(): Auth | null {
  if (!firebaseConfigured) return null;
  const existing = getApps().find((a) => a.name === "secondary");
  return withEmulator(getAuth(existing ?? initializeApp(config, "secondary")));
}
