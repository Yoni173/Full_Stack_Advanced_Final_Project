import { Schema, model } from 'mongoose';

// הגדרת מבנה הנתונים (הסכמה) של נכס קריפטו בתיק של משתמש
const assetSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId, // מפתח המקשר את הנכס ישירות ל-ID של המשתמש שיצר אותו
        ref: 'User',
        required: true
    },
    coinId: {
        type: String, // למשל: 'bitcoin', 'ethereum' (ה-ID הרשמי שמגיע מה-API בהמשך)
        required: true
    },
    symbol: {
        type: String, // למשל: 'btc', 'eth'
        required: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String, // למשל: 'Bitcoin'
        required: true
    },
    quantity: {
        type: Number, // כמות המטבעות שיש ברשות המשתמש
        required: true,
        min: [0, 'Quantity cannot be negative']
    },
    avgPurchasePrice: {
        type: Number, // מחיר הקנייה הממוצע (בשביל חישוב רווח/הפסד בהמשך)
        required: true,
        min: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// יצירת אינדקס ייחודי משולב: למשתמש לא יכולים להיות שני מסמכים נפרדים עבור אותו מטבע
assetSchema.index({ userId: 1, coinId: 1 }, { unique: true });

const Asset = model('Asset', assetSchema);
export default Asset;