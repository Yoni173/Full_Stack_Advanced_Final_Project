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
    // הכותרת אמורה להגיע בפורמט "Bearer <token>", בהתאם לסטנדרט של JWT
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Access denied. No token provided ⛔' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
        const decoded = jwt.verify(token, jwtSecret) as { userId: string; username: string };

        // מצמידים את המשתמש המפוענח לבקשה, כדי שהקונטרולר הבא בתור יוכל להשתמש בו
        req.user = decoded;
        next();
    } catch (err) {
        // הטוקן פג תוקף או זויף
        res.status(401).json({ message: 'Invalid or expired token ⛔' });
    }
};