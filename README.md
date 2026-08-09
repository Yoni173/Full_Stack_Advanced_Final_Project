# CryptoSimulator 💎 | פרויקט סימולטור קריפטו

## 🚀 קישור חי (Live Demo)
- **אתר (Frontend):** https://frontend-dun-psi-39.vercel.app
- **שרת (Backend API):** https://cryptovault-7dch.onrender.com

> כתובת ה-URL של השרת נשארה עם שם קודם של הפרויקט (`cryptovault`) — כתובת שירות ה-Render נקבעת פעם אחת ביצירה ואינה משתנה עם שינוי שם תצוגה, ולכן לא שונתה כדי לא לסכן את יציבות הדיפלוי הקיים.

> **הערה לגבי פלטפורמת הפריסה של השרת:** ההנחיות המקוריות מציינות פריסת הבאקאנד ל-Heroku. Heroku ביטלה לחלוטין את ה-tier החינמי שלה (נובמבר 2022) ומחייבת כעת אימות כרטיס אשראי ליצירת כל אפליקציה, גם בתשלום הנמוך ביותר. לכן השרת פרוס ב-[Render](https://render.com) כ-Web Service — שירות ענן שקול המספק בדיוק את אותה יכולת (אירוח Node.js/Express חי, משתני סביבה, פריסה אוטומטית מ-GitHub), ללא צורך באמצעי תשלום.
>
> **לתשומת לב:** ה-instance החינמי של Render "נרדם" לאחר חוסר פעילות ומתעורר מחדש עם בקשה ראשונה (יכול לקחת עד 50 שניות לבקשה הראשונה).

---

## 📖 אודות הפרויקט
מערכת Full Stack מתקדמת לניהול ומסחר מדומה במטבעות קריפטוגרפיים בזמן אמת. הפרויקט נועד לפתור את הצורך בלמידה ותרגול של שוק ההון והקריפטו בסביבה מדומה, תוך שימוש בנתונים חיים, ניהול תיק אישי (Portfolio), ואבטחת מידע ברמה גבוהה.

---

## 🏗️ ארכיטקטורת המערכת (Architecture)
הפרויקט בנוי במבנה Client-Server מובהק:
- **צד שרת (Backend):** מנוהל באמצעות Node.js ו-Express, מספק REST API מאובטח, מבצע ולידציות קפדניות בעזרת Joi, ומקושר למסד נתונים MongoDB באמצעות Mongoose.
- **צד לקוח (Frontend):** אפליקציית Single Page Application (SPA) מבוססת React ו-TypeScript, המשתמשת ב-React Router לניתוב, ב-Axios לקריאות שרת, וב-Context API לניהול מצב גלובלי (כמו מצב לילה - Dark Mode).

---

## 🔒 אבטחה ואימות משתמשים (Security & Authentication)
- **הצפנת סיסמאות:** שימוש בספריית `bcrypt` להצפנת סיסמאות המשתמשים לפני שמירתן במסד הנתונים.
- **JSON Web Tokens (JWT):** הנפקת טוקן אימות מאובטח למשתמשים בעת התחברות.
- **נתיבים מוגנים (Protected Routes):** אבטחת נתיבי ה-API בשרת ונתיבי ה-React בצד הלקוח כך שרק משתמשים מחוברים יוכלו לגשת אליהם.

---

## 🗄️ מבנה מסד הנתונים (Database Schemas)
הפרויקט כולל קשרים (Relations) מרכזיים בין ה-Collections ב-MongoDB:
1. **User Schema:** - `username` (String)
   - `email` (String, Unique)
   - `password` (String, Hashed)
2. **Asset / Transaction Schema (קשור ל-User):**
   - `userId` (ObjectId, קשר לטבלת המשתמשים)
   - `coinId` (String - לדוגמה: bitcoin)
   - `symbol` (String)
   - `quantity` (Number)
   - `avgPurchasePrice` (Number)

---

## ⚙️ משתני סביבה נדרשים ($ENV$)
כדי להריץ את הפרויקט מקומית, יש ליצור קובץ `.env` בתיקיית ה-`backend` ולהגדיר בו את המשתנים הבאים:

PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/crypto-db
JWT_SECRET=your_super_secret_jwt_key_here