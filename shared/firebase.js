// ============================================================
//  shared/firebase.js — נקודת חיבור מרכזית לפיירבייס
//
//  ⚠️  לפני העלאה:
//     1. פתח את פרויקט הפיירבייס החדש שלך
//     2. Project settings → Your apps → Add app (Web)
//     3. העתק את firebaseConfig והחלף כאן
// ============================================================

import { initializeApp }           from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore }            from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔧 החלף בפרטי הפרויקט החדש
const firebaseConfig = {
  apiKey: "AIzaSyAMFl5qF73bo7ifc3NJQXUt2KuNJFBHaQQ",
  authDomain: "lpoints.firebaseapp.com",
  projectId: "lpoints",
  storageBucket: "lpoints.firebasestorage.app",
  messagingSenderId: "870599365209",
  appId: "1:870599365209:web:3b4af79ee3c08583c55748"
};

// 🔐 UIDs של אדמינים — הוסף אחרי ההתחברות הראשונה
// להשיג UID: התחבר עם גוגל, פתח DevTools → Console → auth.currentUser.uid
export const ADMIN_UIDS = {
    liri:   "2imzcJneZegV4jgnDW51lwHDiGY2",
    shanan: "lmEJTFHPjjU6Xic6ZYxlrTWGp3y1",
    // segev: "REPLACE_WITH_SEGEV_ADMIN_UID",
    // site4: "REPLACE_WITH_SITE4_ADMIN_UID",
};

// 📦 שמות קולקציות — namespace לכל אתר כדי שלא ידרסו זה את זה
export const COLLECTIONS = {
    liri:   { friends: "liri_friends",   history: "liri_history",   updates: "liri_updates"   },
    shanan: { friends: "shanan_friends", history: "shanan_history", updates: "shanan_updates" },
    // segev:  { friends: "segev_friends",  history: "segev_history",  updates: "segev_updates"  },
};

// אתחול — מיוצא פעם אחת ומשותף לכל הקבצים
const app = initializeApp(firebaseConfig);
export const db       = getFirestore(app);
export const auth     = getAuth(app);
export const provider = new GoogleAuthProvider();
