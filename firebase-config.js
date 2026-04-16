// -------------------------------------------------------
// Replace the placeholder values below with your Firebase
// project config from:
//   console.firebase.google.com
//   → Your project → Project Settings → Your Apps → Web App
//
// Also make sure to enable:
//   • Authentication  → Sign-in providers → Email/Password
//   • Firestore Database (start in test mode for development)
// -------------------------------------------------------
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
