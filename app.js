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
        try {
            vocabulary = await getVocabulary();
            setVocabularyCache(vocabulary);
            renderHome();
        } catch (error) {
            showModal("Could not load vocabulary. Please check your internet connection and try again.");
        }
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
        app.innerHTML = ''; // Clear previous content

        if (currentCardIndex >= deck.length) {
            const h2 = document.createElement('h2');
            h2.textContent = 'Practice Complete!';
            app.appendChild(h2);

            const backBtn = document.createElement('button');
            backBtn.id = 'back-btn';
            backBtn.textContent = 'Back to Subjects';
            backBtn.onclick = () => renderSubjectSelection('practice');
            app.appendChild(backBtn);
            return;
        }

        const card = deck[currentCardIndex];

        const flashcard = document.createElement('div');
        flashcard.className = 'flashcard';

        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';

        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        const mandarinDiv = document.createElement('div');
        mandarinDiv.className = 'mandarin';
        mandarinDiv.textContent = card.mandarin;
        const pinyinDiv = document.createElement('div');
        pinyinDiv.className = 'pinyin';
        pinyinDiv.textContent = card.pinyin;
        cardFront.appendChild(mandarinDiv);
        cardFront.appendChild(pinyinDiv);

        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        const englishP = document.createElement('p');
        englishP.textContent = card.english;
        cardBack.appendChild(englishP);

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        flashcard.appendChild(cardInner);

        const nextButton = document.createElement('button');
        nextButton.id = 'next-card-btn';
        nextButton.textContent = 'Next Card';

        app.appendChild(flashcard);
        app.appendChild(nextButton);

        flashcard.addEventListener('click', (e) => {
            e.currentTarget.querySelector('.card-inner').classList.toggle('is-flipped');
        });

        nextButton.addEventListener('click', () => {
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
        app.innerHTML = ''; // Clear previous content

        if (currentCardIndex >= deck.length) {
            const h2 = document.createElement('h2');
            h2.textContent = 'Game Over!';
            app.appendChild(h2);

            const p = document.createElement('p');
            p.textContent = `Your score: ${score} / ${deck.length}`;
            app.appendChild(p);

            const backBtn = document.createElement('button');
            backBtn.id = 'back-btn';
            backBtn.textContent = 'Back to Subjects';
            backBtn.onclick = () => renderSubjectSelection('game');
            app.appendChild(backBtn);
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

        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';

        const mandarinDiv = document.createElement('div');
        mandarinDiv.className = 'mandarin';
        mandarinDiv.textContent = card.mandarin;
        gameCard.appendChild(mandarinDiv);

        const pinyinDiv = document.createElement('div');
        pinyinDiv.className = 'pinyin';
        pinyinDiv.textContent = card.pinyin;
        gameCard.appendChild(pinyinDiv);

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';

        options.forEach(optionText => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'option-btn';
            optionBtn.textContent = optionText;
            optionBtn.onclick = async (e) => {
                if (e.target.textContent === card.english) {
                    score++;
                    await showModal('Correct!');
                } else {
                    await showModal('Wrong!');
                }
                currentCardIndex++;
                renderQuestion();
            };
            optionsDiv.appendChild(optionBtn);
        });

        app.appendChild(gameCard);
        app.appendChild(optionsDiv);
    }

    renderQuestion();
}


init();
