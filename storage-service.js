// StorageService: Persistence, update detection, and recovery actions

const VOCAB_CACHE_KEY = 'vocabularyCache';

function getVocabularyCache() {
    try {
        const cache = localStorage.getItem(VOCAB_CACHE_KEY);
        // We only store the parsedData now, so we can return it directly
        return cache ? JSON.parse(cache) : null;
    } catch (e) {
        console.error("Error getting vocabulary cache:", e);
        return null;
    }
}

function setVocabularyCache(data) {
    try {
        // We only store the parsedData now
        localStorage.setItem(VOCAB_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Error setting vocabulary cache:", e);
    }
}

function redownloadVocabulary() {
    localStorage.removeItem(VOCAB_CACHE_KEY);
    // This will trigger a full re-download on next load
    location.reload();
}

export { getVocabularyCache, setVocabularyCache, redownloadVocabulary };
