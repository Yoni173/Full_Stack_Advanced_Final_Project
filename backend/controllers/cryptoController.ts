import { Request, Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/authMiddleware';
import Asset from '../models/Asset';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Joi from 'joi';
import { getCoinPrice, getMarketData } from '../services/cryptoService';
import { getCachedData, setCachedData, getStaleData, fetchWithRetry } from '../services/apiCache';

const DEFAULT_CASH_BALANCE = 10000;

// רשימת בורסות אמיתיות ומוכרות - לצורך תיוג קוסמטי בלבד של "היכן בוצעה" העסקה בהיסטוריה.
// זהו סימולטור מסחר פנימי; אין ניתוב אמיתי לאף בורסה, זה רק לחוויית משתמש ריאליסטית יותר.
const SIMULATED_EXCHANGES = ['Binance', 'Coinbase', 'Kraken', 'Bitstamp', 'KuCoin', 'OKX'];
const pickSimulatedExchange = (): string =>
    SIMULATED_EXCHANGES[Math.floor(Math.random() * SIMULATED_EXCHANGES.length)];

const decodeXmlValue = (value: string): string => {
    return value
        .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
};

// חוקי אימות לקניית/הוספת מטבע לתיק
const buyAssetSchema = Joi.object({
    coinId: Joi.string().required(),
    symbol: Joi.string().required(),
    name: Joi.string().required(),
    quantity: Joi.number().positive().required(),
}).unknown(true);

// חוקי אימות לפקודת מסחר מאוחדת שמגיעה ממסך Trade
const tradeSchema = Joi.object({
    coinId: Joi.string().required(),
    symbol: Joi.string().required(),
    name: Joi.string().required(),
    type: Joi.string().valid('buy', 'sell').required(),
    quantity: Joi.number().positive().required(),
    price: Joi.number().positive().optional()
});

const depositSchema = Joi.object({
    amount: Joi.number().positive().max(1000000).required()
});

// 1. פעולת Create / Update - הוספת מטבע לתיק (קנייה סימולטיבית)
export const buyAsset = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error } = buyAssetSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.details[0].message });
            return;
        }

        const userId = req.user?.userId;
        const { coinId, symbol, name, quantity } = req.body;

        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const realTimePrice = await getCoinPrice(coinId);
        const orderCost = quantity * realTimePrice;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const currentCashBalance = user.cashBalance ?? DEFAULT_CASH_BALANCE;
        if (currentCashBalance < orderCost) {
            res.status(400).json({
                message: `Insufficient USD balance. You have $${currentCashBalance.toFixed(2)}, but this order costs $${orderCost.toFixed(2)}.`
            });
            return;
        }

        let asset = await Asset.findOne({ userId, coinId });

        if (asset) {
            const totalCost = (asset.quantity * asset.avgPurchasePrice) + (quantity * realTimePrice);
            asset.quantity += quantity;
            asset.avgPurchasePrice = totalCost / asset.quantity;
            asset.updatedAt = new Date();
        } else {
            asset = new Asset({
                userId,
                coinId,
                symbol,
                name,
                quantity,
                avgPurchasePrice: realTimePrice
            });
        }

        user.cashBalance = currentCashBalance - orderCost;

        await asset.save();
        await user.save();
        await Transaction.create({
            userId,
            coinId,
            symbol,
            name,
            type: 'buy',
            quantity,
            price: realTimePrice,
            totalUsd: orderCost,
            cashBalanceAfter: user.cashBalance,
            exchange: pickSimulatedExchange()
        });

        res.status(201).json({
            message: `${name} added to portfolio successfully! 📈`,
            asset,
            cashBalance: user.cashBalance,
            orderCost
        });

    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error during asset purchase' });
    }
};

// שליפת יתרת המזומן הזמינה של המשתמש המחובר
export const getCashBalance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (typeof user.cashBalance !== 'number') {
            user.cashBalance = DEFAULT_CASH_BALANCE;
            await user.save();
        }

        res.status(200).json({ cashBalance: user.cashBalance });
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error while fetching cash balance' });
    }
};

// הוספת כסף וירטואלי לחשבון, כמו הפקדה מהבנק לברוקר
export const depositCash = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error } = depositSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.details[0].message });
            return;
        }

        const userId = req.user?.userId;
        const { amount } = req.body;

        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.cashBalance = (user.cashBalance ?? DEFAULT_CASH_BALANCE) + amount;
        await user.save();

        const transaction = await Transaction.create({
            userId,
            coinId: 'usd',
            symbol: 'USD',
            name: 'US Dollar',
            type: 'deposit',
            quantity: amount,
            price: 1,
            totalUsd: amount,
            cashBalanceAfter: user.cashBalance
        });

        res.status(200).json({
            message: 'USD deposit completed successfully.',
            cashBalance: user.cashBalance,
            transaction
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error while depositing cash' });
    }
};

// שליפת היסטוריית פעולות הקנייה והמכירה של המשתמש
export const getTransactionHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json(transactions);
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error while fetching transaction history' });
    }
};

// 2. פעולת Read - שליפת כל תיק ההשקעות של המשתמש המחובר
export const getPortfolio = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
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
}).unknown(true);

// 3. פעולת Update / Delete - מכירת מטבע מהתיק
export const sellAsset = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { error } = sellAssetSchema.validate(req.body);
        if (error) {
            res.status(400).json({ message: error.details[0].message });
            return;
        }

        const userId = req.user?.userId;
        const { coinId, quantity } = req.body;

        if (!userId) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const realTimePrice = await getCoinPrice(coinId);
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

        const revenue = quantity * realTimePrice;
        const costBasis = quantity * asset.avgPurchasePrice;
        const profitOrLoss = revenue - costBasis;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        user.cashBalance = (user.cashBalance ?? DEFAULT_CASH_BALANCE) + revenue;
        asset.quantity -= quantity;

        if (asset.quantity === 0) {
            await Asset.deleteOne({ _id: asset._id });
            await user.save();
            await Transaction.create({
                userId,
                coinId,
                symbol: asset.symbol,
                name: asset.name,
                type: 'sell',
                quantity,
                price: realTimePrice,
                totalUsd: revenue,
                cashBalanceAfter: user.cashBalance,
                profitOrLoss,
                exchange: pickSimulatedExchange()
            });
            res.status(200).json({
                message: `${asset.name} sold completely at $${realTimePrice}! 🗑️`,
                profitOrLoss,
                cashBalance: user.cashBalance,
                revenue
            });
        } else {
            asset.updatedAt = new Date();
            await asset.save();
            await user.save();
            await Transaction.create({
                userId,
                coinId,
                symbol: asset.symbol,
                name: asset.name,
                type: 'sell',
                quantity,
                price: realTimePrice,
                totalUsd: revenue,
                cashBalanceAfter: user.cashBalance,
                profitOrLoss,
                exchange: pickSimulatedExchange()
            });
            res.status(200).json({
                message: `Successfully sold ${quantity} of ${asset.name} at $${realTimePrice} 📉`,
                profitOrLoss,
                cashBalance: user.cashBalance,
                revenue,
                asset
            });
        }
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error during asset sale' });
    }
};

// פעולה מאוחדת למסך Trade: מנתבת קנייה/מכירה לאותה לוגיקת שרת מאובטחת
export const executeTrade = async (req: AuthRequest, res: Response): Promise<void> => {
    const { error, value } = tradeSchema.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }

    req.body = value;

    if (value.type === 'buy') {
        await buyAsset(req, res);
        return;
    }

    await sellAsset(req, res);
};


// שליפת נתוני שוק כלליים (כל המטבעות לטבלת הדשבורד) - פתוח לכולם, בלי צורך בטוקן אבטחה
export const getMarkets = async (req: Request, res: Response): Promise<void> => {
    try {
        // קריאה לשירות המטמון החכם שמונע קריסות וחסימות מול CoinGecko
        const data = await getMarketData();
        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error while fetching market data' });
    }
};

// שליפת פרטי מטבע מלאים דרך השרת כדי למנוע בעיות CORS ו-rate limit בדפדפן
export const getCoinDetails = async (req: Request, res: Response): Promise<void> => {
    const { coinId } = req.params;
    const cacheKey = `coin-details:${coinId}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
        res.status(200).json(cached);
        return;
    }

    try {
        const response = await fetchWithRetry(() => axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
            timeout: 8000,
            params: {
                localization: false,
                tickers: true,
                community_data: false,
                developer_data: false,
                sparkline: false
            }
        }));

        setCachedData(cacheKey, response.data, 5 * 60 * 1000);
        res.status(200).json(response.data);
    } catch (err: any) {
        // גם אם CoinGecko חוסמים אותנו (429) עדיין נעדיף להציג נתונים ישנים על פני מסך שבור
        const stale = getStaleData(cacheKey);
        if (stale) {
            res.status(200).json(stale);
            return;
        }
        res.status(503).json({ message: 'Coin data is temporarily unavailable (CoinGecko rate limit). Please try again in a moment.' });
    }
};

// שליפת גרף מחיר אמיתי למטבע. אין כאן יצירת נתוני דמו כדי לא להציג צורה מטעה.
export const getCoinChart = async (req: Request, res: Response): Promise<void> => {
    const { coinId } = req.params;
    const requestedDays = String(req.query.days || '30');
    const days = ['1', '7', '30', '365', 'max'].includes(requestedDays) ? requestedDays : '30';
    const cacheKey = `coin-chart:${coinId}:${days}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
        res.status(200).json(cached);
        return;
    }

    try {
        const response = await fetchWithRetry(() => axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
            timeout: 8000,
            params: {
                vs_currency: 'usd',
                days
            }
        }), [2000, 4000, 8000]);

        setCachedData(cacheKey, response.data, 5 * 60 * 1000);
        res.status(200).json(response.data);
    } catch (err: any) {
        const stale = getStaleData(cacheKey);
        if (stale) {
            res.status(200).json(stale);
            return;
        }
        res.status(503).json({ message: 'Chart data is temporarily unavailable (CoinGecko rate limit). Please try again in a moment.' });
    }
};

// חדשות לפי מטבע. CoinGecko News הרשמי דורש API key בתשלום, לכן משתמשים ב-RSS חדשות כגיבוי חינמי.
export const getCoinNews = async (req: Request, res: Response): Promise<void> => {
    const { coinId } = req.params;
    const range = String(req.query.range || 'week');
    const rangeToDays: Record<string, number> = { day: 1, week: 7, month: 30 };
    const days = rangeToDays[range] || 7;
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const cacheKey = `coin-news:${coinId}:${days}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
        res.status(200).json(cached.slice(0, limit));
        return;
    }

    try {
        let coinName = coinId;
        let symbol = '';
        const detailsCache = getCachedData(`coin-details:${coinId}`);

        if (detailsCache) {
            coinName = detailsCache.name || coinId;
            symbol = detailsCache.symbol || '';
        } else {
            try {
                const detailsRes = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
                    timeout: 5000,
                    params: {
                        localization: false,
                        tickers: false,
                        community_data: false,
                        developer_data: false,
                        sparkline: false
                    }
                });
                coinName = detailsRes.data?.name || coinId;
                symbol = detailsRes.data?.symbol || '';
            } catch {
                coinName = coinId;
            }
        }

        const query = `${coinName} ${symbol.toUpperCase()} cryptocurrency when:${days}d`;
        const newsRes = await axios.get('https://news.google.com/rss/search', {
            timeout: 8000,
            responseType: 'text',
            params: {
                q: query,
                hl: 'en-US',
                gl: 'US',
                ceid: 'US:en'
            }
        });

        const itemBlocks = String(newsRes.data).match(/<item\b[\s\S]*?<\/item>/g) || [];
        const articles = itemBlocks.map((block, index) => {
            const getField = (field: string): string => {
                const match = block.match(new RegExp(`<${field}[^>]*>([\\s\\S]*?)<\\/${field}>`, 'i'));
                return decodeXmlValue(match?.[1] || '');
            };

            return {
                id: `${coinId}-${index}`,
                title: getField('title'),
                url: getField('link'),
                source: getField('source') || 'Google News',
                publishedAt: getField('pubDate')
            };
        }).filter(article => article.title && article.url);

        setCachedData(cacheKey, articles, 10 * 60 * 1000);
        res.status(200).json(articles.slice(0, limit));
    } catch (err: any) {
        const stale = getStaleData(cacheKey);
        if (stale) {
            res.status(200).json(stale.slice(0, limit));
            return;
        }
        res.status(200).json([]);
    }
};


// שליפת מדד Fear & Greed (סנטימנט השוק). קוראת ל-CoinMarketCap מהשרת ולא מהדפדפן כדי למנוע CORS,
// ואם המקור הראשי הזה נופל - יש גיבוי ל-alternative.me עם סימון source: 'fallback' בתשובה
export const getFearGreedIndex = async (req: Request, res: Response): Promise<void> => {
    try {
        // ניסיון ראשון: המקור הרשמי, CoinMarketCap
        const cmcRes = await axios.get(
            'https://pro-api.coinmarketcap.com/public-api/v3/fear-and-greed/latest',
            { timeout: 5000 }
        );

        const item = cmcRes.data?.data;

        if (item && typeof item.value === 'number') {
            res.status(200).json({
                value: item.value,
                value_classification: item.value_classification,
                source: 'cmc'
            });
            return;
        }

        throw new Error('מבנה תשובה לא תקין מ-CMC');

    } catch (cmcErr) {
        console.warn('קריאה ל-CMC נכשלה, עובר למקור גיבוי:', (cmcErr as Error).message);

        try {
            // ניסיון שני (גיבוי): alternative.me - שים לב, מדד שונה במתודולוגיה מ-CMC
            const fallbackRes = await axios.get('https://api.alternative.me/fng/?limit=1', { timeout: 5000 });
            const item = fallbackRes.data?.data?.[0];

            if (item) {
                res.status(200).json({
                    value: Number(item.value),
                    value_classification: item.value_classification,
                    source: 'fallback'
                });
                return;
            }

            throw new Error('מבנה תשובה לא תקין ממקור הגיבוי');

        } catch (fallbackErr: any) {
            res.status(500).json({
                message: fallbackErr.message || 'שליפת מדד Fear & Greed נכשלה משני המקורות'
            });
        }
    }
};
