import { getVocabulary, generateDeck } from './data-service.js';
import { getVocabularyCache, setVocabularyCache, redownloadVocabulary } from './storage-service.js';

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

        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'NEW_DATA_AVAILABLE') {
                showUpdateBanner();
            }
        });
    }

    const cachedData = getVocabularyCache();

    if (cachedData) {
        // Handle both old and new cache formats
        if (Array.isArray(cachedData)) {
            vocabulary = cachedData;
        } else if (cachedData.parsedData) {
            vocabulary = cachedData.parsedData;
        }
        renderHome();
    } else {
        vocabulary = await getVocabulary();
        setVocabularyCache(vocabulary);
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

function showModal(message, type = 'alert') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const content = document.createElement('div');
        content.className = 'modal-content';

        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        content.appendChild(messageEl);

        const buttons = document.createElement('div');
        buttons.className = 'modal-buttons';

        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };
        buttons.appendChild(okButton);

        if (type === 'confirm') {
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.onclick = () => {
                document.body.removeChild(overlay);
                resolve(false);
            };
            buttons.appendChild(cancelButton);
        }

        content.appendChild(buttons);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
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
    document.getElementById('redownload-btn').addEventListener('click', async () => {
        const confirmed = await showModal("Are you sure you want to redownload all vocabulary? This will clear any saved progress.", 'confirm');
        if (confirmed) {
            redownloadVocabulary();
        }
    });
}

function renderSubjectSelection(mode) {
    let selectedSubject = null;

    app.innerHTML = `
        <h2>Select a Subject</h2>
        <div class="subject-selection">
            <button data-subject="Mandarin">Mandarin</button>
            <button data-subject="Science">Science</button>
            <button data-subject="Math">Math</button>
            <button data-subject="Mixed">Mixed</button>
        </div>
        <hr>
        <h2>Number of Cards</h2>
        <select id="num-cards-select">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="All">All</option>
        </select>
        <hr>
        <button id="start-session-btn" disabled>Select a Subject</button>
        <button id="back-btn">Back to Mode Selection</button>
    `;

    document.getElementById('back-btn').addEventListener('click', renderHome);
    const startBtn = document.getElementById('start-session-btn');

    app.querySelectorAll('[data-subject]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedSubject = btn.getAttribute('data-subject');
            // Highlight the selected button
            app.querySelectorAll('[data-subject]').forEach(b => b.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            startBtn.disabled = false;
            startBtn.textContent = `Start ${mode}`;
        });
    });

    startBtn.addEventListener('click', () => {
        if (selectedSubject) {
            const numberOfCards = document.getElementById('num-cards-select').value;
            if (mode === 'practice') {
                startPractice(selectedSubject, numberOfCards);
            } else {
                startGame(selectedSubject, numberOfCards);
            }
        }
    });
}

function startPractice(subject, numberOfCards) {
    const deck = generateDeck(vocabulary, subject, numberOfCards);
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

function startGame(subject, numberOfCards) {
    const deck = generateDeck(vocabulary, subject, numberOfCards);
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
        let randomCard;
        if (vocabulary.length > 1) {
            do {
                randomCard = vocabulary[Math.floor(Math.random() * vocabulary.length)];
            } while (randomCard.mandarin === card.mandarin);
            options.push(randomCard.english);
        } else {
            // Handle case with only one vocabulary item
            options.push("(No other options)");
        }

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        app.innerHTML = `
            <div class="game-card">
                <div class="mandarin">${card.mandarin}</div>
                <div class="pinyin">${card.pinyin}</div>
            </div>
            <div class="options">
                <button class="option-btn">${options[0]}</button>
                <button class="option-btn">${options[1]}</button>
            </div>
        `;

        app.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (e.target.textContent === card.english) {
                    score++;
                    await showModal('Correct!');
                } else {
                    await showModal('Wrong!');
                }
                currentCardIndex++;
                renderQuestion();
            });
        });
    }

    renderQuestion();
}


init();
