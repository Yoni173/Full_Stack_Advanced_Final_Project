import { Schema, model } from 'mongoose';

// הגדרת מבנה הנתונים (הסכימה) של משתמש במסד הנתונים
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // מבטיח שלא יהיו שני משתמשים עם אותו אימייל במערכת
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    cashBalance: {
        type: Number,
        default: 10000,
        min: [0, 'Cash balance cannot be negative']
    },
    avatarUrl: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now // מגדיר תאריך יצירה אוטומטי לרגע ההרשמה
    },
    lastLoginAt: {
        type: Date,
        default: null
    }
});

// יצירת המודל מתוך הסכימה וייצוא שלו לשימוש בשאר חלקי האפליקציה
const User = model('User', userSchema);
export default User;
