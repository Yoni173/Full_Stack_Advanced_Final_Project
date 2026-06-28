import { Router } from 'express';
import { register, login } from '../controllers/authController';

// יצירת מופע של ה-Router מתוך Express לניהול נתיבים מבודד
const router = Router();

// הגדרת נתיב מסוג POST עבור הרשמת משתמש חדש במערכת
// הכתובת המלאה שלו תהיה מורכבת מנתיב הבסיס שנגדיר ב-index.ts + /register
router.post('/register', register);

// נתיב להתחברות משתמש קיים
router.post('/login', login);


// ייצוא ה-Router כדי שנוכל לחבר אותו לשרת הראשי
export default router;