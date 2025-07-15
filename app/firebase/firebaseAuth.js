// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",

  // ✅ Required for Realtime Database
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize other Firebase services
export const database = getDatabase(app);
export const db = getFirestore(app);
export const firebaseStorage = getStorage(app);
export const auth = getAuth(app);

// Analytics Initialization
export let analytics = null;

if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        } else {
            console.warn("Firebase Analytics is not supported in this environment.");
        }
    }).catch((error) => {
        console.error("Error checking analytics support: ", error);
    });
}


// Set persistence for auth to use local storage
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Error setting persistence: ", error.message);
    });

// Admin check function
export async function isAdmin() {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const tokenResult = await user.getIdTokenResult(true);
        // console.log("Token claims: ", tokenResult.claims);
        return tokenResult.claims.isAdmin;
    } catch (error) {
        console.error("Error verifying admin status: ", error.message);
        return false;
    }
}
