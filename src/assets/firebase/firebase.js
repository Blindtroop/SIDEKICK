import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiLr-6hYUt5ezv5zgdPihNV1Me-wHSDIo",
  authDomain: "sidekick-a2167.firebaseapp.com",
  projectId: "sidekick-a2167",
  storageBucket: "sidekick-a2167.firebasestorage.app",
  messagingSenderId: "480846736667",
  appId: "1:480846736667:web:a2ee21f3cd96f73b62f7be",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);