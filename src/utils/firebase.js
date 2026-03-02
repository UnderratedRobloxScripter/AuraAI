import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    GoogleAuthProvider, 
    browserLocalPersistence, 
    setPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAS3I9GFQwlD1alTVmX7Cu_oXRDOrv1jXE",
  authDomain: "aura-pro-81c94.firebaseapp.com",
  projectId: "aura-pro-81c94",
  storageBucket: "aura-pro-81c94.firebasestorage.app",
  messagingSenderId: "10478074461",
  appId: "1:10478074461:web:f226d7bea6bbffb3c3abb4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
  .catch((error) => console.error("Persistence error gang:", error));
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const db = getFirestore(app);

export default app;
