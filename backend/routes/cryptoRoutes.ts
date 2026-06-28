import { Router } from 'express';
// יבוא של getMarkets החדש לצד הפונקציות הקיימות שלך
import { buyAsset, getPortfolio, sellAsset, getMarkets } from '../controllers/cryptoController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// נתיב חדש לקבלת נתוני שוק המנוהלים בשרת
// שים לב: הנתיב הזה אינו משתמש ב-requireAuth כדי לאפשר טעינה מהירה וחופשית בדשבורד ללא תלות בטוקן
router.get('/markets', getMarkets);

// הגנת נתיבים מבוססת טוקן לפעולות התיק והמסחר האישי (נשאר בדיוק כפי שהיה אצלך פתוח)
router.post('/buy', requireAuth, buyAsset);
router.get('/portfolio', requireAuth, getPortfolio);
router.post('/sell', requireAuth, sellAsset);

export default router;