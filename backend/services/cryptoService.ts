import axios from 'axios';

// ==========================================
// --- מנגנון ה-Cache (זיכרון מטמון בשרת) ---
// ==========================================
// משתנה מקומי לשמירת הנתונים המלאים של ה-API
let marketCache: any = null;
// משתנה לשמירת חותמת הזמן שבה בוצע העדכון האחרון
let lastFetchTime: number | null = null;
// הגדרת משך תוקף המטמון: 3 דקות בלבד (מבוטא במילישניות) כדי לא להיחסם
const CACHE_DURATION = 3 * 60 * 1000;

/**
 * פונקציה לשליפת נתוני השוק המלאים עבור הדשבורד.
 * משתמשת במנגנון מטמון חכם למניעת חסימות קצב (Rate Limits) מ-CoinGecko.
 */
export const getMarketData = async (): Promise<any> => {
    const currentTime = Date.now();

    // בדיקה: אם המידע קיים בזיכרון והוא עדיין בטווח של ה-3 דקות, החזר אותו מיד ללא פנייה לאינטרנט
    if (marketCache && lastFetchTime && (currentTime - lastFetchTime < CACHE_DURATION)) {
        console.log("Serving markets from Backend Cache ⚡");
        return marketCache;
    }

    try {
        console.log("Fetching fresh market data from CoinGecko API... 🌐");
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 10,
                page: 1,
                sparkline: true
            }
        });

        // שמירת הנתונים הטריים ועדכון חותמת הזמן הנוכחית
        marketCache = response.data;
        lastFetchTime = currentTime;
        return marketCache;

    } catch (error: any) {
        console.error("CoinGecko Markets API Error on Server:", error.message);

        // מנגנון הגנה א': אם ה-API נכשל אך יש לנו נתוני מטמון ישנים, נחזיר אותם לפחות שהאתר לא יקרוס
        if (marketCache) {
            console.log("Serving older cached market data due to API failure.");
            return marketCache;
        }

        // מנגנון הגנה ב' (מצב חירום קיצוני): החזרת נתונים קבועים מראש כדי למנוע בכל מחיר מסך לבן בדפדפן
        return [
            { id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 64016.63, price_change_percentage_24h: 0.52, market_cap: 1280000000000, sparkline_in_7d: { price: [63800, 64016] } },
            { id: 'ethereum', name: 'Ethereum', symbol: 'eth', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 1720.45, price_change_percentage_24h: -0.43, market_cap: 207630000000, sparkline_in_7d: { price: [1740, 1720] } },
            { id: 'tether', name: 'Tether', symbol: 'usdt', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', current_price: 0.998, price_change_percentage_24h: -0.02, market_cap: 116210000000, sparkline_in_7d: { price: [1, 0.998] } },
            { id: 'solana', name: 'Solana', symbol: 'sol', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 73.04, price_change_percentage_24h: 1.69, market_cap: 32010000000, sparkline_in_7d: { price: [71, 73.04] } }
        ];
    }
};

/**
 * פונקציה קיימת לקבלת מחיר של מטבע בודד (לצורך ביצוע פעולות קנייה ומכירה).
 */
export const getCoinPrice = async (coinId: string): Promise<number> => {
    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId.toLowerCase()}&vs_currencies=usd`
        );
        const price = response.data[coinId.toLowerCase()]?.usd;

        if (!price) {
            throw new Error(`Price for coin '${coinId}' not found 🪙`);
        }
        return price;
    } catch (error) {
        console.error('Error fetching coin price from CoinGecko:', error);
        throw new Error('Failed to fetch real-time crypto price 🛑');
    }
};