// ============================================================
//  shared/firebase.js — נקודת חיבור מרכזית לפיירבייס
// ============================================================

import { initializeApp }               from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore }                from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey:            "AIzaSyAMFl5qF73bo7ifc3NJQXUt2KuNJFBHaQQ",
    authDomain:        "lpoints.firebaseapp.com",
    projectId:         "lpoints",
    storageBucket:     "lpoints.firebasestorage.app",
    messagingSenderId: "870599365209",
    appId:             "1:870599365209:web:3b4af79ee3c08583c55748"
};

// 🔐 UIDs של אדמינים
// להשיג UID: התחבר עם גוגל/מייל, פתח DevTools → Console → auth.currentUser.uid
export const ADMIN_UIDS = {
    liri:   "2imzcJneZegV4jgnDW51lwHDiGY2",
    shanan: "lmEJTFHPjjU6Xic6ZYxlrTWGp3y1",
    segev:  "rvLBnexQkqUH65vQRUmioFL9H873",
    pse:    "REPLACE_WITH_PSE_ADMIN_UID",
};

// 📦 שמות קולקציות — namespace לכל אתר כדי שלא ידרסו זה את זה
export const COLLECTIONS = {
    liri:   { friends: "liri_friends",   history: "liri_history",   updates: "liri_updates"   },
    shanan: { friends: "shanan_friends", history: "shanan_history", updates: "shanan_updates" },
    segev:  { friends: "segev_friends",  history: "segev_history",  updates: "segev_updates"  },

    // בורסת הנקודות — קולקציות משלה, לא נוגעות בנתוני האתרים המקוריים (read-only מבחינתה)
    pse: {
        users:        "pse_users",         // פרופיל + סטטוס אישור + יתרת נקודות בורסה
        investments:  "pse_investments",   // השקעות (פעילות + היסטוריות)
        participants: "pse_participants",  // מיפוי אדם -> מזהי מסמך בכל אתר נקודות
    },
};

// 🌐 רשימת "אתרי נקודות" שהבורסה יודעת לשאוב מהם.
// כשמוסיפים אתר חדש: להוסיף אותו כאן + ב-COLLECTIONS + ב-ADMIN_UIDS.
export const POINTS_SITES = [
    { key: "liri",   label: "לירי",  color: "#9d4edd" },
    { key: "shanan", label: "שאנן",  color: "#f0e2c0" },
    { key: "segev",  label: "שגב",   color: "#ffd700" },
];

// אתחול — מיוצא פעם אחת ומשותף לכל הקבצים
const app = initializeApp(firebaseConfig);
export const db       = getFirestore(app);
export const auth     = getAuth(app);
export const provider = new GoogleAuthProvider();
