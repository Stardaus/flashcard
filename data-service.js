// DataService: CSV parsing, validation, and deck generation

async function getVocabulary() {
    console.log('Fetching vocabulary...');
    try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vQKcYywd1f4YQ0f3AJShcNVr5aIYBClHUkFF5a9tBoNS7n4CK4zvtzZboyHvFF5a9tBoNS7n4CK4zvtzZboyHvFS87Tt0dXMII7xPqTVL/pub?output=csv');
        console.log('Fetch response:', response);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        console.log('CSV Text:', csvText);
        const parsedData = parseCSV(csvText);
        console.log('Parsed Vocabulary:', parsedData);
        return parsedData;
    } catch (error) {
        console.error("Failed to fetch or parse vocabulary:", error);
        return [];
    }
}

function parseCSV(csvText) {
    console.log('Parsing CSV...');
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
    console.log('Finished parsing CSV.');
    return vocabulary;
}

function generateDeck(vocabulary, subject, numberOfCards) {
    let filteredCards = vocabulary;
    if (subject && subject !== 'Mixed') {
        filteredCards = vocabulary.filter(card => card.subject === subject);
    }

    // Shuffle the filtered cards
    const shuffled = filteredCards.sort(() => 0.5 - Math.random());

    if (numberOfCards && numberOfCards !== 'All') {
        return shuffled.slice(0, Number(numberOfCards));
    }

    return shuffled;
}

export { getVocabulary, generateDeck };
