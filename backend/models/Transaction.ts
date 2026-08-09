import { Schema, model } from 'mongoose';

// תיעוד פעולה פיננסית שביצע המשתמש בסימולטור
const transactionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coinId: {
        type: String,
        required: true,
        trim: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['buy', 'sell', 'deposit'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    totalUsd: {
        type: Number,
        required: true,
        min: 0
    },
    cashBalanceAfter: {
        type: Number,
        required: true,
        min: 0
    },
    profitOrLoss: {
        type: Number,
        default: null
    },
    // בורסה מדומה שדרכה "בוצעה" העסקה - קוסמטי בלבד, לצורך ריאליזם (זהו סימולטור מסחר פנימי בפועל)
    exchange: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

transactionSchema.index({ userId: 1, createdAt: -1 });

const Transaction = model('Transaction', transactionSchema);
export default Transaction;
