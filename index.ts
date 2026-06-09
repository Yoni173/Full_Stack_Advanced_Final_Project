import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

// טעינת משתני הסביבה מקובץ .env לתוך התוכנית
dotenv.config();

const app = express();

// הפעלת מנגנון CORS לאישור גישה מה-Frontend
app.use(cors());
// הגדרת יישום ביניים לקריאת בקשות המכילות מידע בפורמט JSON
app.use(express.json());

// חיבור נתיבי האימות של האפליקציה תחת תחילית קבועה של API
app.use('/api/auth', authRoutes);

// הגדרת נתיב בדיקה ראשי לשרת
app.get('/', (req, res) => {
    res.send('Welcome to Crypto Simulator Backend! 🚀');
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
        });
    })
    .catch((err) => {
        console.error('Database connection error:', err);
    });