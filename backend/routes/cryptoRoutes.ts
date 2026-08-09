import { Router } from 'express';
import { buyAsset, depositCash, executeTrade, getCashBalance, getCoinChart, getCoinDetails, getCoinNews, getPortfolio, getTransactionHistory, sellAsset, getMarkets, getFearGreedIndex } from '../controllers/cryptoController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// נתיבי שוק פתוחים לכולם, בלי requireAuth - כדי שהדשבורד ייטען מהר גם למי שעוד לא התחבר
router.get('/markets', getMarkets);
router.get('/coin/:coinId', getCoinDetails);
router.get('/coin/:coinId/chart', getCoinChart);
router.get('/coin/:coinId/news', getCoinNews);

// מדד Fear & Greed - גם פתוח לכולם, זה נתון ציבורי. הקריאה ל-CoinMarketCap מתבצעת מהשרת
// (לא ישירות מהדפדפן) כדי למנוע בעיית CORS
router.get('/fear-greed', getFearGreedIndex);

// מכאן והלאה כל הנתיבים דורשים התחברות, כי הם נוגעים לתיק ולכסף האישי של המשתמש
router.get('/balance', requireAuth, getCashBalance);
router.post('/deposit', requireAuth, depositCash);
router.get('/transactions', requireAuth, getTransactionHistory);
router.post('/trade', requireAuth, executeTrade);
router.post('/buy', requireAuth, buyAsset);
router.get('/portfolio', requireAuth, getPortfolio);
router.post('/sell', requireAuth, sellAsset);

export default router;
