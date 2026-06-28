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
    createdAt: {
        type: Date,
        default: Date.now // מגדיר תאריך יצירה אוטומטי לרגע ההרשמה
    }
});

// יצירת המודל מתוך הסכימה וייצוא שלו לשימוש בשאר חלקי האפליקציה
const User = model('User', userSchema);
export default User;