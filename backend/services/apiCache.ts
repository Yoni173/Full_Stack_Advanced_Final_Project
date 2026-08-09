// מטמון משותף לנתוני CoinGecko (פרטי מטבע, גרפים, חדשות) - נגיש גם לבקרים וגם לחימום הרקע

type CacheEntry = { data: any; expiresAt: number };

// המטמון ה"טרי" - נשלף מיידית כל עוד לא פג תוקפו
const freshCache = new Map<string, CacheEntry>();
// המטמון ה"אחרון הידוע כתקין" - לעולם לא נמחק, משמש רק כרשת ביטחון כש-CoinGecko חוסמים אותנו
const staleCache = new Map<string, any>();

export const getCachedData = (key: string): any | null => {
    const item = freshCache.get(key);
    if (!item || item.expiresAt < Date.now()) {
        return null;
    }
    return item.data;
};

export const setCachedData = (key: string, data: any, durationMs: number): void => {
    freshCache.set(key, { data, expiresAt: Date.now() + durationMs });
    staleCache.set(key, data);
};

export const getStaleData = (key: string): any | null => {
    return staleCache.get(key) ?? null;
};

// עוטף קריאת axios: על שגיאת 429 (Rate Limit) ממתין (עם backoff הולך וגדל) ומנסה שוב לפני שנכשל סופית
export const fetchWithRetry = async <T>(request: () => Promise<T>, delaysMs: number[] = [1500, 3000]): Promise<T> => {
    try {
        return await request();
    } catch (err: any) {
        if (err?.response?.status === 429 && delaysMs.length > 0) {
            const [nextDelay, ...restDelays] = delaysMs;
            await new Promise((resolve) => setTimeout(resolve, nextDelay));
            return await fetchWithRetry(request, restDelays);
        }
        throw err;
    }
};
