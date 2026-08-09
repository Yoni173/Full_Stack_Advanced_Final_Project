import axios from 'axios';
import { fetchWithRetry } from './apiCache';

// מטמון פשוט בזיכרון של השרת לנתוני השוק, כדי לא לפנות ל-CoinGecko בכל בקשה ולהיחסם
let marketCache: any = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION = 3 * 60 * 1000; // 3 דקות

// מטבעות שלא רלוונטיים לסימולטור (נכסים חדשים/נישתיים) - מוסרים מרשימת השוק
const EXCLUDED_COIN_IDS = new Set(['figure-heloc', 'hyperliquid']);

// שליפת נתוני השוק המלאים עבור הדשבורד, עם מטמון כדי למנוע חסימות קצב (Rate Limits) מ-CoinGecko
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
                // שולפים קצת יותר מ-10 כדי שאחרי סינון המטבעות הלא-רלוונטיים עדיין יישארו 10 בטבלה
                per_page: 15,
                page: 1,
                sparkline: true,
                // בלי הפרמטר הזה CoinGecko לא מחזירים שינויי אחוזים לפי תקופה (נדרש גם ל-Portfolio P&L יומי/שבועי/שנתי)
                price_change_percentage: '24h,7d,1y'
            }
        });

        // שמירת הנתונים הטריים ועדכון חותמת הזמן הנוכחית, אחרי סינון מטבעות לא רלוונטיים וחיתוך ל-10
        marketCache = (response.data as any[])
            .filter((coin) => !EXCLUDED_COIN_IDS.has(coin.id))
            .slice(0, 10);
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

// קבלת מחיר עדכני של מטבע בודד, לצורך ביצוע קנייה/מכירה.
// קודם בודקת אם המטבע כבר נמצא במטמון השוק (מתעדכן כל 3 דקות) ורק אם לא - פונה ל-CoinGecko בנפרד
export const getCoinPrice = async (coinId: string): Promise<number> => {
    const cachedCoin = (marketCache as any[])?.find((coin) => coin.id === coinId.toLowerCase());
    if (cachedCoin?.current_price) {
        return cachedCoin.current_price;
    }

    try {
        // מנגנון retry אחד על 429 - קריאת מחיר בזמן קנייה/מכירה קריטית מכדי שתיכשל בלי ניסיון נוסף
        const response = await fetchWithRetry(() => axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId.toLowerCase()}&vs_currencies=usd`
        ));
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