// Accounts and the public profile document (UC-S1, UC-S2) — Student B.
// The only browser code that talks to Firebase Auth. Screens use useAuth() and
// the functions below, never firebase/auth directly.
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// Firebase's own emails (verification, password reset) in Romanian.
auth.languageCode = "ro";

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 8;

export function normaliseUsername(raw = "") {
  return raw.trim().toLowerCase();
}

/** Observer: calls back with the Firebase user (or null). Returns unsubscribe. */
export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/** Live users/{uid}. Calls onData(null) while the document doesn't exist yet. */
export function observeProfile(uid, onData, onError) {
  return onSnapshot(
    doc(db, "users", uid),
    (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError
  );
}

/** Reads the admin custom claim. forceRefresh picks up a claim set since login. */
export async function readIsAdmin(user, forceRefresh = false) {
  if (!user) return false;
  const { claims } = await user.getIdTokenResult(forceRefresh);
  return claims.admin === true;
}

/**
 * Creates users/{uid} exactly once, with public fields only (emails stay in Auth).
 * C's onCreate trigger reacts to this document: welcome email + wallet with the
 * 100-token bonus. If a username is given, usernames/{username} is claimed in the
 * same transaction so two people can't take the same one.
 */
export async function createProfileIfMissing(user, { username, displayName, faculty } = {}) {
  const userRef = doc(db, "users", user.uid);
  const name = username ? normaliseUsername(username) : null;
  const nameRef = name ? doc(db, "usernames", name) : null;

  return runTransaction(db, async (tx) => {
    const existing = await tx.get(userRef);
    if (existing.exists()) return { created: false };

    if (nameRef) {
      const taken = await tx.get(nameRef);
      if (taken.exists()) {
        const err = new Error("Username already taken");
        err.code = "caca/username-taken";
        throw err;
      }
      tx.set(nameRef, { uid: user.uid });
    }

    tx.set(userRef, {
      username: name,
      displayName: (displayName || user.displayName || name || "Student").trim(),
      photoURL: user.photoURL ?? null,
      faculty: faculty?.trim() || null,
      bio: "",
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: serverTimestamp(),
    });
    return { created: true };
  });
}

/** UC-S1, email path. Profile creation runs after the account exists. */
export async function registerWithEmail({ email, password, username, displayName, faculty }) {
  if (!USERNAME_PATTERN.test(normaliseUsername(username))) {
    const err = new Error("Invalid username");
    err.code = "caca/invalid-username";
    throw err;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    const err = new Error("Weak password");
    err.code = "auth/weak-password";
    throw err;
  }

  // Quick check first so most clashes never create an account. The transaction in
  // createProfileIfMissing is still the real guard against a simultaneous signup.
  if ((await getDoc(doc(db, "usernames", normaliseUsername(username)))).exists()) {
    const err = new Error("Username already taken");
    err.code = "caca/username-taken";
    throw err;
  }

  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await updateProfile(user, { displayName: displayName.trim() });
    await createProfileIfMissing(user, { username, displayName, faculty });
  } catch (err) {
    // Username lost a race after the account was created: remove the half-made
    // account so the student can retry with another name.
    if (err.code === "caca/username-taken") await user.delete().catch(() => {});
    throw err;
  }
  // Verification is best-effort; a failure here shouldn't block registration.
  sendEmailVerification(user).catch(() => {});
  return user;
}

/**
 * UC-S1 / UC-S2, Google path. Call straight from a click handler so the popup
 * isn't blocked (redirect sign-in breaks with third-party storage blocking).
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const { user } = await signInWithPopup(auth, provider);
  await createProfileIfMissing(user);
  return user;
}

export async function signInWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  // Covers accounts whose profile write failed during registration.
  await createProfileIfMissing(user);
  return user;
}

export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function resendVerificationEmail() {
  return auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.resolve();
}

export function signOutUser() {
  return signOut(auth);
}
