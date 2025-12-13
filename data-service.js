// DataService: CSV parsing, validation, and deck generation

async function getVocabulary() {
    try {
        const response = await fetch('vocabulary.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error("Failed to fetch or parse vocabulary:", error);
        return [];
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const vocabulary = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const card = {};
        headers.forEach((header, index) => {
            card[header] = values[index].trim();
        });
        vocabulary.push(card);
    }
    return vocabulary;
}

function generateDeck(vocabulary, subject) {
    let filteredCards = vocabulary;
    if (subject && subject !== 'Mixed') {
        filteredCards = vocabulary.filter(card => card.subject === subject);
    }
    // Simple shuffle
    return filteredCards.sort(() => Math.random() - 0.5);
}

export { getVocabulary, generateDeck };
