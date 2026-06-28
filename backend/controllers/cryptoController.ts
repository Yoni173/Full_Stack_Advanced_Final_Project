import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Asset from '../models/Asset';
import Joi from 'joi';
// 🪙 הוספת היבוא של getMarketData לצד getCoinPrice הקיים
import { getCoinPrice, getMarketData } from '../services/cryptoService';

// חוקי אימות לקניית/הוספת מטבע לתיק
const buyAssetSchema = Joi.object({
    coinId: Joi.string().required(),
    symbol: Joi.string().required(),
    name: Joi.string().required(),
    quantity: Joi.number().positive().required(),
});

// 1. פעולת Create / Update - הוספת מטבע לתיק (קנייה סימולטיבית)
export const buyAsset = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        //  אימות הקלט מהמשתמש
        const { error } = buyAssetSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.details[0].message });
            return;
        }

        const userId = req.user?.userId;
        const { coinId, symbol, name, quantity } = req.body;

        // 2. קריאה לשירות החיצוני כדי לקבל את המחיר האמיתי של המטבע בשוק 📈
        const realTimePrice = await getCoinPrice(coinId);

        // 3. חיפוש האם המטבע כבר קיים בתיק של המשתמש
        let asset = await Asset.findOne({ userId, coinId });

        if (asset) {
            // חישוב ממוצע קנייה חדש ועדכון כמות (Update)
            const totalCost = (asset.quantity * asset.avgPurchasePrice) + (quantity * realTimePrice);
            asset.quantity += quantity;
            asset.avgPurchasePrice = totalCost / asset.quantity;
            asset.updatedAt = new Date();
        } else {
            // יצירת נכס חדש בתיק (Create) עם המחיר האמיתי שקיבלנו מה-API
            asset = new Asset({
                userId,
                coinId,
                symbol,
                name,
                quantity,
                avgPurchasePrice: realTimePrice // כאן נכנס המחיר האמיתי!
            });
        }

        // 4. שמירה במסד הנתונים
        await asset.save();
        res.status(201).json({ message: `${name} added to portfolio successfully! 📈`, asset });

    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error during asset purchase' });
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

// חוקי אימות למכירת מטבע
const sellAssetSchema = Joi.object({
    coinId: Joi.string().required(),
    quantity: Joi.number().positive().required()
});

// 3. פעולת Update / Delete - מכירת מטבע מהתיק
export const sellAsset = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // אימות הקלט מהמשתמש
        const { error } = sellAssetSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.details[0].message });
            return;
        }

        const userId = req.user?.userId;
        const { coinId, quantity } = req.body;

        // 1. קריאה לשירות החיצוני לקבלת מחיר השוק הנוכחי בזמן המכירה 🪙
        const realTimePrice = await getCoinPrice(coinId);

        // חיפוש המטבע בתיק של המשתמש
        const asset = await Asset.findOne({ userId, coinId });

        if (!asset) {
            res.status(404).json({ message: "You do not own this coin ⛔" });
            return;
        }

        if (asset.quantity < quantity) {
            res.status(400).json({
                message: `Insufficient funds. You only have ${asset.quantity} units ⛔`
            });
            return;
        }

        // חישוב הרווח/הפסד
        const revenue = quantity * realTimePrice;
        const costBasis = quantity * asset.avgPurchasePrice;
        const profitOrLoss = revenue - costBasis;

        // הפחתת הכמות
        asset.quantity -= quantity;

        if (asset.quantity === 0) {
            // תרחיש א': הכמות התאפסה -> מוחקים את המסמך
            await Asset.deleteOne({ _id: asset._id });
            res.status(200).json({
                message: `${asset.name} sold completely at $${realTimePrice}! 🗑️`,
                profitOrLoss
            });
        } else {
            // תרחיש ב': נשארה כמות -> מעדכנים את המסמך
            asset.updatedAt = new Date();
            await asset.save();
            res.status(200).json({
                message: `Successfully sold ${quantity} of ${asset.name} at $${realTimePrice} 📉`,
                profitOrLoss,
                asset
            });
        }
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error during asset sale' });
    }
};

// ==========================================
// --- פעולה חדשה: שליפת נתוני שוק כלליים ---
// ==========================================
// פונקציה זו משתמשת ב-Request הרגיל של אקספרס כיוון שהיא פתוחה לכל המשתמשים ואינה דורשת טוקן אבטחה.
export const getMarkets = async (req: Request, res: Response): Promise<void> => {
    try {
        // קריאה לשירות המטמון החכם שמונע קריסות וחסימות מול CoinGecko
        const data = await getMarketData();
        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error while fetching market data' });
    }
};