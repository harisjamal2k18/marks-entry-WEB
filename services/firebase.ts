
// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPhiMe4iDEaktRA7T30wL36nvpzkcNAH8",
  authDomain: "marks-entry-ai.firebaseapp.com",
  databaseURL: "https://marks-entry-ai-default-rtdb.firebaseio.com",
  projectId: "marks-entry-ai",
  storageBucket: "marks-entry-ai.firebasestorage.app",
  messagingSenderId: "694179966706",
  appId: "1:694179966706:web:480aa9f73e130ed430aa6b",
  measurementId: "G-XZCJ4G7Y5R"
};

// Initialize Firebase
// Check if apps are already initialized to avoid errors during hot reload
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// const analytics = getAnalytics(app);

// Export dummy values since Firebase is not actively used in the app
const app: any = null;
const analytics: any = null;

export { app, analytics };
