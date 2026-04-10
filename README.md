# Lpoints — מרכז ניהול נקודות

ריפו יחיד לכל אתרי הנקודות, עם בסיס נתונים Firebase אחד משותף.

## מבנה הריפו

```
Lpoints/
├── index.html          ← האב: מציג את כל הטבלאות
├── style.css           ← עיצוב להאב
│
├── shared/
│   ├── firebase.js     ← ⚠️  קובץ אחד לכל הפרויקטים — עדכן כאן
│   └── utils.js        ← פונקציות Chart.js, פירמוט תאריכים, rich-text
│
├── liri/               ← נקודות לירי  (dark/neon)
│   ├── index.html
│   └── style.css
│
├── shanan/             ← נקודות שאנן (vintage/warm)
│   ├── index.html
│   └── style.css
│
├── segev/              ← פרויקט עתידי (placeholder)
│   └── index.html
│
└── migrate-data.js     ← סקריפט חד-פעמי להעברת נתונים ישנים
```

## צעדי הכנה לפני העלאה ל-GitHub Pages

### 1. הגדר Firebase חדש
1. פתח https://console.firebase.google.com → פרויקט חדש
2. **Authentication**: Enable → Google sign-in
3. **Firestore**: Create database (production mode)
4. **Project settings → Web app** → העתק את `firebaseConfig`
5. הדבק ב-`shared/firebase.js`

### 2. הגדר Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // כל אחד יכול לקרוא
    match /{document=**} {
      allow read: if true;
    }

    // liri — רק אדמין של liri יכול לכתוב
    match /liri_friends/{doc} {
      allow write: if request.auth.uid == "LIRI_ADMIN_UID";
    }
    match /liri_history/{doc} {
      allow write: if request.auth.uid == "LIRI_ADMIN_UID";
    }
    match /liri_updates/{doc} {
      allow write: if request.auth.uid == "LIRI_ADMIN_UID";
    }

    // shanan — רק אדמין של shanan יכול לכתוב
    match /shanan_friends/{doc} {
      allow write: if request.auth.uid == "SHANAN_ADMIN_UID";
    }
    match /shanan_history/{doc} {
      allow write: if request.auth.uid == "SHANAN_ADMIN_UID";
    }
    match /shanan_updates/{doc} {
      allow write: if request.auth.uid == "SHANAN_ADMIN_UID";
    }
  }
}
```

### 3. קבל UIDs של האדמינים
1. פתח את האתר (לירי / שאנן)
2. לחץ "Admin Login" → התחבר עם Google
3. פתח DevTools → Console → הקלד: `auth.currentUser.uid`
4. העתק ל-`shared/firebase.js` תחת `ADMIN_UIDS`
5. **חשוב**: עדכן גם את Firebase Rules עם ה-UIDs האמיתיים

### 4. GitHub Pages — הגדר repository
1. שנה את ה-repository ל-`Lpoints`
2. Settings → Pages → Source: `main` branch, `/ (root)`
3. כתובות:
   - האב:   `https://USERNAME.github.io/Lpoints/`
   - לירי:  `https://USERNAME.github.io/Lpoints/liri/`
   - שאנן:  `https://USERNAME.github.io/Lpoints/shanan/`

### 5. העבר נתונים מהפרויקטים הישנים
ראה הוראות ב-`migrate-data.js`

## הוספת אתר חדש (לדוגמה: segev)
1. העתק `liri/` → `segev/`
2. פתח `segev/index.html` → שנה `COL = COLLECTIONS.segev`
3. ב-`shared/firebase.js` בטל הערה על שורות `segev`
4. הוסף את `segev` ל-`index.html` של ההאב
5. עדכן Firestore Rules עם UID של אדמין חדש
