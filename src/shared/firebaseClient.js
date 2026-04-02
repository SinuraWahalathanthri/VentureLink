import { getAppConfig } from "./appConfig.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const { firebase } = getAppConfig();
if (!firebase.apiKey || !firebase.projectId) {
  // Keep module importable even if config missing (page will show error).
  // Throwing here would break all script execution.
  console.warn(
    "[firebase] Missing config. Set window.__APP_CONFIG__.firebase in the page.",
  );
}

const app = initializeApp(firebase);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const firestore = {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  runTransaction,
};

export const authApi = {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
};

