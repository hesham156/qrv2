import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWqSVKT-ezEuGZFxI0fztNEXqaBnixu50",
  authDomain: "wafarle-f16a0.firebaseapp.com",
  projectId: "wafarle-f16a0",
  storageBucket: "wafarle-f16a0.firebasestorage.app",
  messagingSenderId: "473633074583",
  appId: "1:473633074583:web:79d443fb4f2d188fe2a8d2",
  measurementId: "G-7WHS1K7TCQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'default-app-id'; // أو القيمة القادمة من البيئة
export const initialAuthToken = null;
