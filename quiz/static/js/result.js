document.addEventListener('DOMContentLoaded', () => {
    const answers = JSON.parse(localStorage.getItem('pollAnswers'));
    const categoryScores = JSON.parse(localStorage.getItem('categoryScores'));
    const totalScore = localStorage.getItem('totalScore');

    const allImprovements = answers.map(a => a.improvement).filter(Boolean);
    const allExtras = answers.map(a => a.extra).filter(Boolean);

    // Array mit allen Kategorien sortiert nach Score
    const sortedCategories = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);

    // Beste und schlechteste Kategorie auswählen
    const bestCategory = sortedCategories[0][0];
    let worstCategory = sortedCategories[sortedCategories.length - 1][0];

    // Falls beste und schlechteste gleich sind (z.B. bei Gleichstand), nimm nächste schlechteste
    if (bestCategory === worstCategory && sortedCategories.length > 1) {
        worstCategory = sortedCategories[sortedCategories.length - 2][0];
    }

    // Daten ins HTML einfügen
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('best-category').textContent = bestCategory;
    document.getElementById('worst-category').textContent = worstCategory;

    // Zeige die Verbesserungen (improvement) an
    document.getElementById('improvement').innerHTML = allImprovements.length
        ? '<ul style="list-style-type: none; padding-left: 0;">' + allImprovements.map(i => `<li> ${i}</li>`).join('') + '</ul>'
        : '💬 Keep it up – you’re on the right track!';

    // Zeige die Extras (extra) an
    document.getElementById('extra').innerHTML = allExtras.length
        ? '<ul style="list-style-type: none; padding-left: 0;">' + allExtras.map(e => `<li> ${e}</li>`).join('') + '</ul>'
        : '🌟 you did well!';

    if (window.DEBUG) {
        console.log("Total Score:", totalScore);
    }
    if (!totalScore || !categoryScores) {
        console.warn("Fehlende Daten!");
    }

    // SVG anzeige
    const maxScore = localStorage.getItem('maxPossibleScore');
    console.log("Max Score:", maxScore);
    console.log("Total Score:", totalScore);

    if (maxScore && totalScore) {
        const scoreRatio = totalScore / maxScore;
        console.log("Score Ratio:", scoreRatio);
        let imagePath = '';

        if (scoreRatio <= 0.25) {
            imagePath = '/static/img/Forest_04.svg';
        } else if (scoreRatio <= 0.5) {
            imagePath = '/static/img/Forest_03.svg';
        } else if (scoreRatio <= 0.75) {
            imagePath = '/static/img/Forest_02.svg';
        } else {
            imagePath = '/static/img/Forest_01.svg';
        }

        // Debug: Überprüfe den Bildpfad
        console.log("Image Path:", imagePath);

        // Hole den Container, in den das Bild eingefügt werden soll
        const imageContainer = document.getElementById('result-image');
        imageContainer.innerHTML = ''; // Vorheriges Bild entfernen, falls vorhanden

        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = 'Score-Level Illustration';
        img.className = 'score-image img-fluid';

        imageContainer.appendChild(img);

    }
});

