import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import User from '../models/User';

// 1. הגדרת חוקי אימות הנתונים הנכנסים מהלקוח באמצעות ספריית JOI
const registerSchema = Joi.object({
    username: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

// 2. פונקציית הלוגיקה של ההרשמה (Register)
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // ביצוע בדיקת התאמה (Validation) על הנתונים שהגיעו בגוף הבקשה (req.body)
        const { error } = registerSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.details[0].message });
            return;
        }

        const { username, email, password } = req.body;

        // בדיקה האם קיים כבר משתמש רשום במערכת עם אותו אימייל
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'Email already exists in the system' });
            return;
        }

        // הצפנת הסיסמה של המשתמש באמצעות bcrypt לפני שמירתה בדיסק
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // יצירת אובייקט משתמש חדש ושמירתו בתוך מסד הנתונים MongoDB (פעולת Create)
        const newUser = new User({
            username,
            email,
            password: hashedPassword // שמירת הסיסמה המוצפנת בלבד
        });

        await newUser.save();

        // החזרת תשובת הצלחה ללקוח
        res.status(201).json({ message: 'User registered successfully! 🚀' });
    } catch (err) {
        // טיפול בשגיאות שרת כלליות
        res.status(500).json({ message: 'Server error during registration' });
    }
};