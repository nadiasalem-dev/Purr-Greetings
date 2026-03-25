import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // ✅ Add this

const firebaseConfig = {
  apiKey: "AIzaSyCg_RMRVdoIpjEcGP8HGRebfDVE8atpPyg",
  authDomain: "milestones-30f26.firebaseapp.com",
  projectId: "milestones-30f26",
  storageBucket: "milestones-30f26.appspot.com",
  messagingSenderId: "778684729643",
  appId: "1:778684729643:web:23b556f9a88623e2315d6e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // ✅ Export this too
