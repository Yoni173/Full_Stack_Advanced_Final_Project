import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import cryptoRoutes from './routes/cryptoRoutes'; // ייבוא נתיבי הקריפטו החדשים
import uploadRoutes from './routes/uploadRoutes';
import { startCacheWarmer } from './services/cacheWarmer';

// טעינת משתני הסביבה מקובץ .env לתוך התוכנית
dotenv.config();

const app = express();

// הפעלת מנגנון CORS לאישור גישה מה-Frontend
app.use(cors());
// הגדרת יישום ביניים לקריאת בקשות המכילות מידע בפורמט JSON
app.use(express.json());

// חיבור נתיבי האימות של האפליקציה תחת תחילית קבועה של API
app.use('/api/auth', authRoutes);

// חיבור נתיבי הקריפטו והסימולטור תחלא ת תחילית קבועה של API
app.use('/api/crypto', cryptoRoutes);

// נתיב העלאת קבצים (תמונת פרופיל) - Multer
app.use('/api/upload', uploadRoutes);

// הגשת קבצים סטטיים שהועלו (תמונות פרופיל)
app.use('/uploads', express.static('uploads'));

// הגדרת נתיב בדיקה ראשי לשרת
app.get('/', (req, res) => {
    res.send('Welcome to CryptoVault Backend! 🚀');
});

// נתיב שלא קיים בכלל - 404 אחיד
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// מנגנון גלובלי לטיפול בשגיאות - רשת ביטחון לכל שגיאה שלא נתפסה בתוך controller ספציפי
// (חובה שיהיה עם 4 פרמטרים כדי ש-Express יזהה אותו כ-error handler)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error'
    });
});

// שליפת הפורט מתוך קובץ ה-env, או שימוש ב-5001 כברירת מחדל
const PORT = process.env.PORT || 5001;
// שליפת מחרוזת החיבור למסד הנתונים מתוך קובץ ה-env
const MONGO_URI = process.env.MONGO_URI || '';

// התחברות למסד הנתונים MongoDB והפעלת האזנה של השרת רק לאחר חיבור מוצלח
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB 🍃');
        app.listen(PORT, () => {
            console.log(`Server is running successfully on port ${PORT}`);
            startCacheWarmer();
        });
    })
    .catch((err) => {
        console.error('Database connection error:', err);
    });