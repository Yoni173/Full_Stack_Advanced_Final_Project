import { Router } from 'express';
import { buyAsset, getPortfolio } from '../controllers/cryptoController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// הגנת נתיבים: אנחנו מזריקים את requireAuth כתחנת ביניים (Middleware)
// כל פנייה לנתיבים האלו תעבור קודם כל דרך השומר שבודק את ה-Token!
router.post('/buy', requireAuth, buyAsset);
router.get('/portfolio', requireAuth, getPortfolio);

export default router;