import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "milestones-30f26.firebaseapp.com",
  projectId: "milestones-30f26",
  storageBucket: "milestones-30f26.appspot.com",
  messagingSenderId: "778684729643",
  appId: "1:778684729643:web:23b556f9a88623e2315d6e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);