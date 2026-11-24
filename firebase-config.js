/**
 * ZEKRA FIREBASE CONFIGURATION 🛡️
 * Initialized for Zekra-9454 Platform
 */

const firebaseConfig = {
    apiKey: "AIzaSyCIFqGpG3OgQPG9xWMqk0fY9pqwaoe7jk8",
    authDomain: "zekra-9454.firebaseapp.com",
    databaseURL: "https://zekra-9454-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "zekra-9454",
    // Storage migrated to Cloudinary 🛡️
    messagingSenderId: "758732830703",
    appId: "1:758732830703:web:bc19e4deb21f5cd00a281a",
    measurementId: "G-63LVWXMD6X"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global Reference for easier access in legacy scripts
window.firebaseData = firebase.database();
console.log("🛡️ ZEKRA: Firebase Connection Establised.");