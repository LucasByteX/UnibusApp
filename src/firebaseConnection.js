import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhjHCyRWRS6_CDAq9ZFypdj1r5aSPtrRM",
  authDomain: "testes-2c86c.firebaseapp.com",
  projectId: "testes-2c86c",
  storageBucket: "testes-2c86c.firebasestorage.app",
  messagingSenderId: "41614581568",
  appId: "1:41614581568:web:6ae7bd084f4061816d64a5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export {db}