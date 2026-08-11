import nodemailer from 'nodemailer';

// שולח מייל התראה בכל פעם שמישהו מתחבר למערכת. מוגדר רק אם משתני הסביבה קיימים -
// אם לא, פשוט מדלג בשקט (לא מונע מהאפליקציה עצמה לעבוד בלי הגדרת מייל)
const NOTIFY_TO = process.env.NOTIFY_EMAIL_TO;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const transporter = (GMAIL_USER && GMAIL_APP_PASSWORD)
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
    })
    : null;

export const sendLoginNotification = async (username: string, email: string): Promise<void> => {
    if (!transporter || !NOTIFY_TO) return;

    try {
        await transporter.sendMail({
            from: `"CryptoSimulator" <${GMAIL_USER}>`,
            to: NOTIFY_TO,
            subject: `🔑 New login: ${username}`,
            text: `${username} (${email}) just logged in to CryptoSimulator at ${new Date().toLocaleString('en-US')}.`
        });
    } catch (err: any) {
        // כשל בשליחת מייל לא אמור אף פעם למנוע התחברות תקינה - רק מתעד ל-log
        console.warn('Failed to send login notification email:', err.message);
    }
};
