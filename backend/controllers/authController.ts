import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// חוקי אימות נתונים עבור הרשמה
const registerSchema = Joi.object({
    username: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

// חוקי אימות נתונים עבור התחברות (Login)
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // בדיקת תקינות הקלט מהלקוח מול הסכמה
        const { error } = registerSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.details[0].message });
            return;
        }

        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'Email already exists in the system' });
            return;
        }

        // הצפנת הסיסמה לפני שמירתה במסד הנתונים באמצעות bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully! 🚀' });
    } catch (err) {
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // אימות תקינות הקלט מהלקוח באמצעות JOI
        const { error } = loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.details[0].message });
            return;
        }

        const { email, password } = req.body;

        // חיפוש המשתמש במסד הנתונים לפי אימייל (פעולת Read ב-CRUD)
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }

        // השוואת הסיסמה שהוזנה מול הסיסמה המוצפנת השמורה ב-DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid email or password' });
            return;
        }

        // שליפת מפתח ה-JWT הסודי מקובץ ה-env
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';

        // יצירת טוקן חתום ומאובטח המכיל את מזהה המשתמש, בתוקף ל-12 שעות
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            jwtSecret,
            { expiresIn: '12h' }
        );

        // החזרת הטוקן המאובטח ללקוח
        res.status(200).json({
            message: 'Login successful! 👋',
            token
        });
    } catch (err) {
        // הדפסת השגיאה המלאה ל-Terminal לצורך דיבוג
        console.error('Critical eror during login:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// שליפת פרטי המשתמש המחובר (כולל תמונת הפרופיל) עבור ה-Header בצד הלקוח
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const user = await User.findById(userId).select('username email avatarUrl');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error while fetching user profile' });
    }
};