// ELEVATE QA 2026 — FIREBASE CORE CONFIG
// Shared by Admin and Scanner for real-time synchronization.

const firebaseConfig = {
  apiKey: "AIzaSyDXXMVES3Nfdd_cHiIhbKH2vt7-z5pQIeg",
  authDomain: "elevateqa-97676.firebaseapp.com",
  databaseURL: "https://elevateqa-97676-default-rtdb.firebaseio.com/",
  projectId: "elevateqa-97676",
  storageBucket: "elevateqa-97676.firebasestorage.app",
  messagingSenderId: "256868551449",
  appId: "1:256868551449:web:2f5f87e002c80f3f72d388",
  measurementId: "G-B831C40MKX"
};

// Global instance variables (initialized in respective HTML files)
let firebaseApp, firebaseDb;
