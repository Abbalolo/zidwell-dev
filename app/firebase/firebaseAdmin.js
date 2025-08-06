import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.ADMIN_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const authAdmin = admin.auth();
const dbAdmin = admin.firestore();

export {admin, authAdmin, dbAdmin}