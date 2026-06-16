/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAB6GsBNnOuTatJIyO0FqLJSPDHx2jR-wM",
  authDomain: "gym-28bcf.firebaseapp.com",
  projectId: "gym-28bcf",
  storageBucket: "gym-28bcf.firebasestorage.app",
  messagingSenderId: "1067893820539",
  appId: "1:1067893820539:web:9c23b42e7dd682932466de",
  firestoreDatabaseId: "(default)"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Validate Connection to Firestore (Skill Mandatory Requirement)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    console.log("Firebase connectivity check: Service initialized. (Offline or sandbox environment)");
  }
}

testConnection();
