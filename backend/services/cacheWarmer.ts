import axios from 'axios';
import { getMarketData } from './cryptoService';
import { getCachedData, setCachedData } from './apiCache';

// שומר את פרטי 10 המטבעות הנתמכים "חמים" במטמון ברקע, כדי שמשתמש שנכנס לדף מטבע
// כמעט תמיד יקבל תשובה מיידית מהמטמון ולא יגרום לקריאה חיה שעלולה להיחסם (429) על ידי CoinGecko.
const WARM_INTERVAL_MS = 3 * 60 * 1000;
const GAP_BETWEEN_COINS_MS = 8000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const warmCoinDetails = async (coinId: string): Promise<void> => {
    const cacheKey = `coin-details:${coinId}`;
    if (getCachedData(cacheKey)) return; // כבר חם, אין טעם לבזבז קריאה

    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
            timeout: 8000,
            params: {
                localization: false,
                tickers: true,
                community_data: false,
                developer_data: false,
                sparkline: false
            }
        });
        setCachedData(cacheKey, response.data, 5 * 60 * 1000);
    } catch (err: any) {
        console.warn(`Cache warmer: failed to warm details for ${coinId}:`, err.message);
    }
};

const runWarmCycle = async (): Promise<void> => {
    try {
        const markets = await getMarketData();
        const coinIds: string[] = (markets || []).map((c: any) => c.id).filter(Boolean);

        for (const coinId of coinIds) {
            await warmCoinDetails(coinId);
            await sleep(GAP_BETWEEN_COINS_MS);
        }
    } catch (err: any) {
        console.warn('Cache warmer: cycle failed:', err.message);
    }
};

export const startCacheWarmer = (): void => {
    console.log('Cache warmer started 🔥 (keeping supported coins pre-cached to avoid CoinGecko rate limits)');
    runWarmCycle();
    setInterval(runWarmCycle, WARM_INTERVAL_MS);
};
