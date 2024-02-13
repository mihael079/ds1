// Import the required functions from the Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';




 const firebaseConfig = {
    apiKey: "AIzaSyCvi_vIWg2RteioUxi92xJ1VQ21-rL9fKc",
    authDomain: "divergence-series.firebaseapp.com",
    databaseURL: "https://divergence-series-default-rtdb.firebaseio.com",
    projectId: "divergence-series",
    storageBucket: "divergence-series.appspot.com",
    messagingSenderId: "1088469006690",
    appId: "1:1088469006690:web:f6ec980f6b6464f6de943b"
  };
  
 // Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Export the Firebase objects for use in other files
export { db };
  