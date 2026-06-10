import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import type { Functions } from "firebase/functions";
import { getFirebaseClientConfig } from "@/lib/env";
 
const firebaseConfig = getFirebaseClientConfig();

// Single Firebase app instance — safe to initialize at module level
export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─── Lazy singletons (dynamic require to avoid SSR module-eval errors) ────────

let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;
let _functions: Functions | undefined;

export function getAuthInstance(): Auth {
  if (!_auth) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAuth } = require("firebase/auth");
    _auth = getAuth(app) as Auth;
  }
  return _auth!;
}

export function getDbInstance(): Firestore {
  if (!_db) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getFirestore } = require("firebase/firestore");
    _db = getFirestore(app) as Firestore;
  }
  return _db!;
}

export function getStorageInstance(): FirebaseStorage {
  if (!_storage) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getStorage } = require("firebase/storage");
    _storage = getStorage(app) as FirebaseStorage;
  }
  return _storage!;
}

export function getFunctionsInstance(): Functions {
  if (!_functions) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getFunctions } = require("firebase/functions");
    _functions = getFunctions(app, "us-central1") as Functions;
  }
  return _functions!;
}

// Aliases
export { getAuthInstance as getAuth };
export { getDbInstance as getFirebaseDb };

// ─── Proxy exports for backward compatibility ─────────────────────────────────
// Safe to use inside function bodies / event handlers / useEffect.
// Do NOT call these at module scope outside a function body.

export const auth: Auth = new Proxy({} as Auth, {
  get(_t, p, r) { return Reflect.get(getAuthInstance(), p, r); },
  set(_t, p, v) { return Reflect.set(getAuthInstance(), p, v); },
  has(_t, p) { return Reflect.has(getAuthInstance(), p); },
  getPrototypeOf() { return Reflect.getPrototypeOf(getAuthInstance()); },
});

export const db: Firestore = new Proxy({} as Firestore, {
  get(_t, p, r) { return Reflect.get(getDbInstance(), p, r); },
  set(_t, p, v) { return Reflect.set(getDbInstance(), p, v); },
  has(_t, p) { return Reflect.has(getDbInstance(), p); },
  getPrototypeOf() { return Reflect.getPrototypeOf(getDbInstance()); },
});

export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get(_t, p, r) { return Reflect.get(getStorageInstance(), p, r); },
  set(_t, p, v) { return Reflect.set(getStorageInstance(), p, v); },
  has(_t, p) { return Reflect.has(getStorageInstance(), p); },
  getPrototypeOf() { return Reflect.getPrototypeOf(getStorageInstance()); },
});

export const functions: Functions = new Proxy({} as Functions, {
  get(_t, p, r) { return Reflect.get(getFunctionsInstance(), p, r); },
  set(_t, p, v) { return Reflect.set(getFunctionsInstance(), p, v); },
  has(_t, p) { return Reflect.has(getFunctionsInstance(), p); },
  getPrototypeOf() { return Reflect.getPrototypeOf(getFunctionsInstance()); },
});
