// Friendly messages for Firebase Auth error codes (UC-S2).
// Returns null for errors the user caused on purpose (closing the popup).

const MESSAGES = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/wrong-password": "Wrong email or password.",
  "auth/user-not-found": "Wrong email or password.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/missing-password": "Enter your password.",
  "auth/email-already-in-use":
    "An account with this email already exists. Sign in instead, or use Google if you registered with it.",
  "auth/weak-password": "Passwords need at least 8 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes, or reset your password.",
  "auth/user-disabled": "This account has been blocked. Contact an admin.",
  "auth/network-request-failed": "No connection. Check your internet and try again.",
  "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again.",
  "auth/account-exists-with-different-credential":
    "This email already has an account with a password. Sign in with your password first.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled yet.",
  "caca/username-taken": "That username is taken. Try another one.",
  "caca/invalid-username": "Usernames are 3–20 characters: lowercase letters, numbers, _ and . only.",
  "permission-denied": "The server refused this action. Try signing out and in again.",
};

const SILENT = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

export function authErrorMessage(err) {
  const code = err?.code ?? "";
  if (SILENT.has(code)) return null;
  return MESSAGES[code] ?? "Something went wrong. Please try again.";
}
