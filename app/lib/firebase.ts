// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCICewgpTdR3GykDsasyrUnblfz2kn8K5A",
  authDomain: "nutritrack-ab75c.firebaseapp.com",
  projectId: "nutritrack-ab75c",
  storageBucket: "nutritrack-ab75c.appspot.com",
  messagingSenderId: "484619747269",
  appId: "1:484619747269:web:31f080aaa64e98a02855ac",
  measurementId: "G-HVW7QEV4JV"
};

// Initialize Firebase
let app;

// Vérification de l'environnement pour éviter les erreurs côté serveur
if (typeof window !== 'undefined') {
  // Initialiser Firebase uniquement côté client
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} else {
  // Pour les environnements non-navigateur (SSR)
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
}

// Initialiser les services Firebase
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Supprimer l'exportation d'analytics pour éviter les erreurs
export { app, auth, db, googleProvider };
