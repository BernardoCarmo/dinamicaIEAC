import { initializeApp } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

// Em modo emulador não precisamos de um projeto Firebase real: um projectId
// "demo-*" é suficiente e evita qualquer chamada à nuvem.
const app = initializeApp(
  useEmulator ? { ...firebaseConfig, projectId: "demo-dinamica-iaec" } : firebaseConfig
);

export const db = getDatabase(app);

if (useEmulator) {
  connectDatabaseEmulator(db, "127.0.0.1", 9000);
}
