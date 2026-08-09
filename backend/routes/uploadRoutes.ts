import express from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../middleware/authMiddleware';
import { uploadAvatar } from '../controllers/uploadController';

const router = express.Router();

// אחסון הקובץ בדיסק תחת תיקיית uploads/, עם שם ייחודי שמונע דריסה בין משתמשים
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${Date.now()}${ext}`);
    }
});

// מגבילים לתמונות בלבד ועד 3MB, כדי שמישהו לא יעלה קובץ שרירותי לשרת
const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed'));
            return;
        }
        cb(null, true);
    }
});

router.post('/avatar', requireAuth, upload.single('avatar'), uploadAvatar);

export default router;
