// StorageService: Persistence, update detection, and recovery actions

const VOCAB_CACHE_KEY = 'vocabularyCache';

function getVocabularyCache() {
    try {
        const cache = localStorage.getItem(VOCAB_CACHE_KEY);
        return cache ? JSON.parse(cache) : null;
    } catch (e) {
        console.error("Error getting vocabulary cache:", e);
        return null;
    }
}

function setVocabularyCache(cache) {
    try {
        localStorage.setItem(VOCAB_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("Error setting vocabulary cache:", e);
    }
}

async function checkForUpdates() {
    const cache = getVocabularyCache();
    const headers = {};
    if (cache && cache.etag) {
        headers['If-None-Match'] = cache.etag;
    }
    if (cache && cache.lastModified) {
        headers['If-Modified-Since'] = cache.lastModified;
    }

    try {
        const response = await fetch('vocabulary.csv', { method: 'HEAD' });
        if (response.status === 304) {
            return { updateAvailable: false };
        }
        if (response.ok) {
            const newEtag = response.headers.get('etag');
            const newLastModified = response.headers.get('last-modified');
            return {
                updateAvailable: true,
                etag: newEtag,
                lastModified: newLastModified
            };
        }
    } catch (e) {
        console.error("Update check failed:", e);
    }
    return { updateAvailable: false };
}

function redownloadVocabulary() {
    localStorage.removeItem(VOCAB_CACHE_KEY);
    // This will trigger a full re-download on next load
    location.reload();
}

export { getVocabularyCache, setVocabularyCache, checkForUpdates, redownloadVocabulary };
