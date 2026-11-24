// Security rules tests for users/ and usernames/ (Student B, with C).
// Run: npm run test:rules   (needs firebase-tools and Java 21 for the emulator)
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";

let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-caca-rules",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
beforeEach(() => env.clearFirestore());
afterAll(() => env.cleanup());

const db = (uid) => env.authenticatedContext(uid).firestore();

function profile(overrides = {}) {
  return {
    username: null,
    displayName: "Ana Pop",
    photoURL: null,
    faculty: "AC",
    bio: "",
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

function signupBatch(firestore, uid, username) {
  const batch = writeBatch(firestore);
  batch.set(doc(firestore, "users", uid), profile({ username }));
  if (username) batch.set(doc(firestore, "usernames", username), { uid });
  return batch;
}

async function seedUser(uid, data = {}) {
  await env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), "users", uid), { ...profile(), createdAt: new Date(), ...data })
  );
}

describe("users/{uid} create", () => {
  test("a student creates their own profile with a username claim", async () => {
    await assertSucceeds(signupBatch(db("ana"), "ana", "ana.pop").commit());
  });

  test("a Google student creates a profile without a username", async () => {
    await assertSucceeds(setDoc(doc(db("ana"), "users/ana"), profile()));
  });

  test("nobody creates someone else's profile", async () => {
    await assertFails(setDoc(doc(db("mallory"), "users/ana"), profile()));
  });

  test("signed-out visitors can't create profiles", async () => {
    await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), "users/ana"), profile()));
  });

  test("a role field is refused", async () => {
    await assertFails(setDoc(doc(db("ana"), "users/ana"), profile({ role: "admin" })));
  });

  test("rating totals must start at zero", async () => {
    await assertFails(setDoc(doc(db("ana"), "users/ana"), profile({ ratingAvg: 5, ratingCount: 99 })));
  });

  test("a username without its claim document is refused", async () => {
    await assertFails(setDoc(doc(db("ana"), "users/ana"), profile({ username: "ana.pop" })));
  });

  test("a username already claimed by someone else is refused", async () => {
    await assertSucceeds(signupBatch(db("ana"), "ana", "popular").commit());
    await assertFails(signupBatch(db("bob"), "bob", "popular").commit());
  });

  test("an existing profile can't claim a second username later", async () => {
    await seedUser("ana");
    await assertFails(setDoc(doc(db("ana"), "usernames/second"), { uid: "ana" }));
  });
});

describe("users/{uid} read and update", () => {
  test("signed-in students read profiles, guests don't", async () => {
    await seedUser("ana");
    await assertSucceeds(getDoc(doc(db("bob"), "users/ana")));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users/ana")));
  });

  test("owners edit profile fields", async () => {
    await seedUser("ana");
    await assertSucceeds(updateDoc(doc(db("ana"), "users/ana"), { bio: "Selling my old books", faculty: "ETC" }));
  });

  test("owners can't change ratings, username or add a role", async () => {
    await seedUser("ana", { username: "ana.pop" });
    await assertFails(updateDoc(doc(db("ana"), "users/ana"), { ratingAvg: 5 }));
    await assertFails(updateDoc(doc(db("ana"), "users/ana"), { username: "admin" }));
    await assertFails(updateDoc(doc(db("ana"), "users/ana"), { role: "admin" }));
  });

  test("strangers can't edit a profile", async () => {
    await seedUser("ana");
    await assertFails(updateDoc(doc(db("bob"), "users/ana"), { bio: "hacked" }));
  });
});

describe("usernames/{name}", () => {
  test("anyone can check if a name is free, nobody can list them", async () => {
    const guest = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(guest, "usernames/someone")));
  });

  test("claims can't be moved or released", async () => {
    await assertSucceeds(signupBatch(db("ana"), "ana", "ana.pop").commit());
    await assertFails(setDoc(doc(db("ana"), "usernames/ana.pop"), { uid: "bob" }));
    await assertFails(setDoc(doc(db("bob"), "usernames/ana.pop"), { uid: "bob" }));
  });
});
