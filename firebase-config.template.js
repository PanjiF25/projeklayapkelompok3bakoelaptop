// ======================================
// FIREBASE CONFIGURATION TEMPLATE
// ======================================
// 
// INSTRUCTIONS:
// 1. Go to: https://console.firebase.google.com
// 2. Select your project
// 3. Click Settings (⚙️) → Project settings
// 4. Scroll to "Your apps" section
// 5. Click "Web app" (</> icon)
// 6. Copy the firebaseConfig object
// 7. Replace the values below with YOUR credentials
// 8. Save this file as: firebase-config.js
//
// ⚠️ IMPORTANT: Never commit real credentials to GitHub!
// ======================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
window.firebaseAuth = firebase.auth();
window.firebaseDB = firebase.firestore();

console.log('✅ Firebase initialized successfully');

// ======================================
// EXAMPLE (DO NOT USE):
// ======================================
// const firebaseConfig = {
//   apiKey: "AIzaSyB1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q",
//   authDomain: "bakoelaptop-12345.firebaseapp.com",
//   projectId: "bakoelaptop-12345",
//   storageBucket: "bakoelaptop-12345.appspot.com",
//   messagingSenderId: "123456789012",
//   appId: "1:123456789012:web:abc123def456",
// };
// ======================================
