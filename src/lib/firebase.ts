
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "khanewala",
  appId: "1:971815385459:web:a9bf557cf2ec214c62ad06",
  storageBucket: "khanewala.firebasestorage.app",
  apiKey: "AIzaSyAbJ5m68CtF10XdLiEAIiP7_jXpC51CHHY",
  authDomain: "khanewala-4f06c.firebaseapp.com",
  messagingSenderId: "971815385459",
  databaseURL: "https://khanewala-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export { app, database };
