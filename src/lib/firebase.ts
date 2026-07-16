import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (with custom databaseId if specified in configuration)
const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
const db = getFirestore(app, databaseId);

// Initialize Auth
const auth = getAuth(app);

export { app, db, auth };
