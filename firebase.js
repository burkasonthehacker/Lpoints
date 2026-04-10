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
    apiKey:            "REPLACE_WITH_YOUR_API_KEY",
    authDomain:        "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
    projectId:         "REPLACE_WITH_YOUR_PROJECT_ID",
    storageBucket:     "REPLACE_WITH_YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "REPLACE_WITH_SENDER_ID",
    appId:             "REPLACE_WITH_APP_ID"
};

// 🔐 UIDs של אדמינים — הוסף אחרי ההתחברות הראשונה
// להשיג UID: התחבר עם גוגל, פתח DevTools → Console → auth.currentUser.uid
export const ADMIN_UIDS = {
    liri:   "REPLACE_WITH_LIRI_ADMIN_UID",
    shanan: "REPLACE_WITH_SHANAN_ADMIN_UID",
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
