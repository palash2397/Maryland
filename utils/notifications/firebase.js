import admin from "firebase-admin";

if (!admin.apps.length) {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  const beginIndex = rawKey.indexOf("-----BEGIN PRIVATE KEY-----");

  const privateKey = rawKey.slice(beginIndex).replace(/\\n/g, "\n").trim();

  console.log(
    "KEY OK:",
    privateKey.startsWith("-----BEGIN PRIVATE KEY-----"),
    privateKey.endsWith("-----END PRIVATE KEY-----")
  );

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

export const firebaseAdmin = admin;
