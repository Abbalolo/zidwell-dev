// lib/firebaseAdmin.ts

import * as admin from 'firebase-admin';

// Prevent initializing multiple times (important for hot reloads in dev)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.ADMIN_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized.');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

const authAdmin = admin.auth();
const dbAdmin = admin.firestore();

export { admin, authAdmin, dbAdmin };

export default async function handler(req, res) {
  try {
    const doc = await db.collection('invoices').doc('someDocId').get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.status(200).json(doc.data());
  } catch (error) {
    console.error("Error fetching doc:", error);
    res.status(500).json({ message: error.message });
  }
}