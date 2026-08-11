import { Router } from 'express';
import { register, login, getMe, deleteAccount, getAllUsers } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

// יצירת מופע של ה-Router מתוך Express לניהול נתיבים מבודד
const router = Router();

// הגדרת נתיב מסוג POST עבור הרשמת משתמש חדש במערכת
// הכתובת המלאה שלו תהיה מורכבת מנתיב הבסיס שנגדיר ב-index.ts + /register
router.post('/register', register);

// נתיב להתחברות משתמש קיים
router.post('/login', login);

// פרטי המשתמש המחובר (שם, מייל, תמונת פרופיל)
router.get('/me', requireAuth, getMe);

// מחיקת חשבון המשתמש המחובר לצמיתות
router.delete('/me', requireAuth, deleteAccount);

// רשימת כל המשתמשים - מוגן גם ב-requireAuth וגם בבדיקת אדמין בתוך הקונטרולר
router.get('/users', requireAuth, getAllUsers);


// ייצוא ה-Router כדי שנוכל לחבר אותו לשרת הראשי
export default router;