import { Router } from 'express';
// יבוא הפונקציות מהקונטרולר, כולל getFearGreedIndex החדשה
import { buyAsset, depositCash, executeTrade, getCashBalance, getCoinChart, getCoinDetails, getCoinNews, getPortfolio, getTransactionHistory, sellAsset, getMarkets, getFearGreedIndex } from '../controllers/cryptoController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// נתיב לקבלת נתוני שוק המנוהלים בשרת
// שים לב: הנתיב הזה אינו משתמש ב-requireAuth כדי לאפשר טעינה מהירה וחופשית בדשבורד ללא תלות בטוקן
router.get('/markets', getMarkets);
router.get('/coin/:coinId', getCoinDetails);
router.get('/coin/:coinId/chart', getCoinChart);
router.get('/coin/:coinId/news', getCoinNews);

// נתיב חדש למדד Fear & Greed (סנטימנט השוק)
// גם הוא פתוח ללא requireAuth, מאותה סיבה - זה נתון ציבורי שמוצג בדשבורד לכל מבקר
// הקריאה בפועל ל-API החיצוני (CoinMarketCap) מתבצעת בתוך הקונטרולר, בצד השרת -
// כך נמנעים מבעיית CORS שהייתה נוצרת אילו קראנו ל-CMC ישירות מהדפדפן
router.get('/fear-greed', getFearGreedIndex);

// הגנת נתיבים מבוססת טוקן לפעולות התיק והמסחר האישי (נשאר בדיוק כפי שהיה אצלך פתוח)
router.get('/balance', requireAuth, getCashBalance);
router.post('/deposit', requireAuth, depositCash);
router.get('/transactions', requireAuth, getTransactionHistory);
router.post('/trade', requireAuth, executeTrade);
router.post('/buy', requireAuth, buyAsset);
router.get('/portfolio', requireAuth, getPortfolio);
router.post('/sell', requireAuth, sellAsset);

export default router;
