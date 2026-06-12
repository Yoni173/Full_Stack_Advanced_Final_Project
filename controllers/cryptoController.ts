import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Asset from '../models/Asset';
import Joi from 'joi';

// חוקי אימות לקניית/הוספת מטבע לתיק
const buyAssetSchema = Joi.object({
    coinId: Joi.string().required(),
    symbol: Joi.string().required(),
    name: Joi.string().required(),
    quantity: Joi.number().positive().required(),
    purchasePrice: Joi.number().positive().required()
});

// 1. פעולת Create / Update - הוספת מטבע לתיק (קנייה סימולטיבית)
export const buyAsset = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error } = buyAssetSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.details[0].message });
            return;
        }

        // שליפת ה-userId שהוזרק אוטומטית על ידי ה-Middleware (השומר) שלנו!
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        const { coinId, symbol, name, quantity, purchasePrice } = req.body;

        // בדיקה האם המטבע כבר קיים בתיק של המשתמש הזה
        let asset = await Asset.findOne({ userId, coinId });

        if (asset) {
            // אם קיים - מעדכנים כמות ומחשבים מחיר קנייה ממוצע חדש (פעולת Update)
            const totalCost = (asset.quantity * asset.avgPurchasePrice) + (quantity * purchasePrice);
            asset.quantity += quantity;
            asset.avgPurchasePrice = totalCost / asset.quantity;
            asset.updatedAt = new Date();
            await asset.save();
        } else {
            // אם לא קיים - מייצרים מסמך חדש לחלוטין (פעולת Create)
            asset = new Asset({
                userId,
                coinId,
                symbol,
                name,
                quantity,
                avgPurchasePrice: purchasePrice
            });
            await asset.save();
        }

        res.status(200).json({ message: `${name} added to portfolio successfully! 📈`, asset });
    } catch (err) {
        res.status(500).json({ message: 'Server error during asset purchase' });
    }
};

// 2. פעולת Read - שליפת כל תיק ההשקעות של המשתמש המחובר
export const getPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        
        // מוצאים את כל הנכסים השייכים ל-ID של המשתמש הנוכחי בלבד
        const portfolio = await Asset.find({ userId });
        
        res.status(200).json(portfolio);
    } catch (err) {
        res.status(500).json({ message: 'Server error while fetching portfolio' });
    }
};