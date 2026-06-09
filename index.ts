import express from 'express';
import cors from 'cors';

// יצירת מופע של השרת וניהול בקשות האינטרנט
const app = express();

// הפעלת מנגנון CORS המאפשר ל-Frontend להתחבר לשרת ללא חסימות אבטחה
app.use(cors());

// הגדרת נתיב ראשי (נקודת קצה) מסוג GET המחזירה הודעת טקסט לדפדפן
app.get('/', (req, res) => {
    res.send('Welcome to Crypto Simulator Backend! 🚀');
});

// הגדרת מספר הפורט (הנתיב הייעודי) שבו השרת יקשיב לתקשורת
const PORT = 5001;

// הפעלת השרת בפועל והשארתו במצב האזנה לבקשות נכנסות
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});