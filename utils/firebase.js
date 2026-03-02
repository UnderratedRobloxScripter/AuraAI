// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAS3I9GFQwlD1alTVmX7Cu_oXRDOrv1jXE", // Your actual key
  authDomain: "aura-pro-81c94.firebaseapp.com",
  projectId: "aura-pro-81c94",
  storageBucket: "aura-pro-81c94.firebasestorage.app",
  messagingSenderId: "10478074461",
  appId: "1:10478074461:web:f226d7bea6bbffb3c3abb4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
