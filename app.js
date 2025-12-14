import { getVocabulary, generateDeck } from './data-service.js';
import { getVocabularyCache, setVocabularyCache, checkForUpdates, redownloadVocabulary } from './storage-service.js';

const app = document.getElementById('app');
let vocabulary = [];

async function init() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    const cachedData = getVocabularyCache();

    if (cachedData && cachedData.parsedData) {
        vocabulary = cachedData.parsedData;
        console.log('Loaded vocabulary from cache.');
        renderHome();
        // Check for updates in the background
        const updateInfo = await checkForUpdates();
        if (updateInfo.updateAvailable) {
            console.log("Update available!");
            const newVocab = await getVocabulary();
            setVocabularyCache({
                parsedData: newVocab,
                etag: updateInfo.etag,
                lastModified: updateInfo.lastModified,
                updateAvailable: true
            });
            showUpdateBanner();
        }
    } else {
        console.log('No cache found, fetching fresh vocabulary.');
        vocabulary = await getVocabulary();
        const updateInfo = await checkForUpdates(); // To get etag etc.
        setVocabularyCache({
            parsedData: vocabulary,
            etag: updateInfo.etag,
            lastModified: updateInfo.lastModified
        });
        console.log('Vocabulary fetched and cached.');
        renderHome();
    }
}

function showUpdateBanner() {
    const banner = document.createElement('div');
    banner.className = 'update-banner';
    banner.innerHTML = `
        A new version of the vocabulary is available.
        <button id="refresh-btn">Refresh</button>
    `;
    document.body.prepend(banner);

    document.getElementById('refresh-btn').addEventListener('click', () => {
        location.reload();
    });
}

function renderHome() {
    app.innerHTML = `
        <h1>SJKC Fun Learning Companion</h1>
        <h2>Select a Mode</h2>
        <button id="practice-btn">Practice Mode</button>
        <button id="game-btn">Game Mode</button>
        <hr>
        <button id="redownload-btn">Redownload Vocabulary</button>
    `;

    document.getElementById('practice-btn').addEventListener('click', () => renderSubjectSelection('practice'));
    document.getElementById('game-btn').addEventListener('click', () => renderSubjectSelection('game'));
    document.getElementById('redownload-btn').addEventListener('click', () => {
        if(confirm("Are you sure you want to redownload all vocabulary? This will clear any saved progress.")) {
            redownloadVocabulary();
        }
    });
}

function renderSubjectSelection(mode) {
    app.innerHTML = `
        <h2>Select a Subject</h2>
        <button data-subject="Mandarin">Mandarin</button>
        <button data-subject="Science">Science</button>
        <button data-subject="Math">Math</button>
        <button data-subject="Mixed">Mixed</button>
        <hr>
        <button id="back-btn">Back to Mode Selection</button>
    `;

    document.getElementById('back-btn').addEventListener('click', renderHome);

    app.querySelectorAll('[data-subject]').forEach(btn => {
        btn.addEventListener('click', () => {
            const subject = btn.getAttribute('data-subject');
            if (mode === 'practice') {
                startPractice(subject);
            } else {
                startGame(subject);
            }
        });
    });
}

function startPractice(subject) {
    const deck = generateDeck(vocabulary, subject);
    let currentCardIndex = 0;

    function renderCard() {
        if (currentCardIndex >= deck.length) {
            app.innerHTML = `
                <h2>Practice Complete!</h2>
                <button id="back-btn">Back to Subjects</button>
            `;
            document.getElementById('back-btn').addEventListener('click', () => renderSubjectSelection('practice'));
            return;
        }

        const card = deck[currentCardIndex];
        app.innerHTML = `
            <div class="flashcard">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="mandarin">${card.mandarin}</div>
                        <div class="pinyin">${card.pinyin}</div>
                    </div>
                    <div class="card-back">
                        <p>${card.english}</p>
                    </div>
                </div>
            </div>
            <button id="next-card-btn">Next Card</button>
        `;

        document.querySelector('.flashcard').addEventListener('click', (e) => {
            e.currentTarget.querySelector('.card-inner').classList.toggle('is-flipped');
        });

        document.getElementById('next-card-btn').addEventListener('click', () => {
            currentCardIndex++;
            renderCard();
        });
    }

    renderCard();
}

function startGame(subject) {
    const deck = generateDeck(vocabulary, subject);
    let score = 0;
    let currentCardIndex = 0;

    function renderQuestion() {
         if (currentCardIndex >= deck.length) {
            app.innerHTML = `
                <h2>Game Over!</h2>
                <p>Your score: ${score} / ${deck.length}</p>
                <button id="back-btn">Back to Subjects</button>
            `;
            document.getElementById('back-btn').addEventListener('click', () => renderSubjectSelection('game'));
            return;
        }

        const card = deck[currentCardIndex];
        const options = [card.english];
        // Get a random wrong answer
        let randomCard = card;
        while(randomCard.id === card.id) {
            randomCard = vocabulary[Math.floor(Math.random() * vocabulary.length)];
        }
        options.push(randomCard.english);

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        app.innerHTML = `
            <h2>What is the meaning of "${card.mandarin}"?</h2>
            <div class="options">
                <button class="option-btn">${options[0]}</button>
                <button class="option-btn">${options[1]}</button>
            </div>
        `;

        app.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.textContent === card.english) {
                    score++;
                    alert('Correct!');
                } else {
                    alert('Wrong!');
                }
                currentCardIndex++;
                renderQuestion();
            });
        });
    }

    renderQuestion();
}


init();
