import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN, normaliseUsername } from "../../services/users";

// Client-side checks before calling Firebase (UC-S1 rules). Returns an error message or null.
export function validateRegistration(form) {
  if (!form.displayName.trim()) return "Enter your full name.";
  if (!USERNAME_PATTERN.test(normaliseUsername(form.username)))
    return "Usernames are 3–20 characters: lowercase letters, numbers, _ and . only.";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "That email address doesn't look right.";
  if (form.password.length < MIN_PASSWORD_LENGTH) return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!form.faculty.trim()) return "Enter your faculty.";
  return null;
}
