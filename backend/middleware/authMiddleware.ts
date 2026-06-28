import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// הגדרת ממשק להרחבת אובייקט הבקשה (Request) של Express
// זה מאפשר לנו להצמיד את נתוני המשתמש המאומת לבקשה עצמה
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        username: string;
    };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // 1. שליפת כותרת האבטחה (Authorization) מתוך ה-Headers של הבקשה
    const authHeader = req.headers.authorization;

    // 2. בדיקה שהכותרת קיימת ומתחילה במילה Bearer (הסטנדרט של JWT)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Access denied. No token provided ⛔' });
        return;
    }

    // 3. חיתוך המחרוזת כדי לקבל את הטוקן הנטו ללא המילה Bearer
    const token = authHeader.split(' ')[1];

    try {
        // 4. אימות חתימת הטוקן באמצעות המפתח הסודי מה-env
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
        const decoded = jwt.verify(token, jwtSecret) as { userId: string; username: string };

        // 5. הצמדת נתוני המשתמש המפוענחים לאובייקט הבקשה כדי שהנתיבים הבאים יוכלו להשתמש בהם
        req.user = decoded;

        // 6. הכל תקין! מעבירים את המשתמש לתחנה הבאה (לנתיב הלוגיקה שלו)
        next();
    } catch (err) {
        // אם הטוקן פג תוקף או שונה/זויף
        res.status(401).json({ message: 'Invalid or expired token ⛔' });
    }
};