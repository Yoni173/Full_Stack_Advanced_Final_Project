import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';

// שמירת קובץ שהועלה (Multer) כתמונת פרופיל של המשתמש המחובר
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const avatarUrl = `/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            userId,
            { avatarUrl },
            { new: true }
        );

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({
            message: 'Avatar uploaded successfully! 📸',
            avatarUrl
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error while uploading avatar' });
    }
};
