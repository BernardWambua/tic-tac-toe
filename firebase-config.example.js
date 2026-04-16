// Copy this file to firebase-config.js and fill in your values.
// firebase-config.js is git-ignored and must never be committed.
//
// Get your config from:
//   console.firebase.google.com → Project Settings → Your Apps → Web
//
// Enable in Firebase Console:
//   • Authentication → Sign-in providers → Email/Password
//   • Firestore Database (test mode for dev)
//   • Restrict your API key at: console.cloud.google.com/apis/credentials

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
  measurementId:     "YOUR_MEASUREMENT_ID"
};

firebase.initializeApp(firebaseConfig);
