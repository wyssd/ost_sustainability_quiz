document.addEventListener('DOMContentLoaded', () => {
    const answers = JSON.parse(localStorage.getItem('pollAnswers'));
    const categoryScores = JSON.parse(localStorage.getItem('categoryScores'));
    const participantName = localStorage.getItem('participantName');
    const leaderboardChoice = document.querySelector('input[name="leaderboard-choice"]:checked')?.value;
    const totalScore = localStorage.getItem('totalScore');

    const allImprovements = answers.map(a => a.improvement).filter(Boolean);
    const allExtras = answers.map(a => a.extra).filter(Boolean);

    // Beste und schlechteste Kategorie finden

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
        : '💬 Weiter so – du bist auf einem guten Weg!';

    // Zeige die Extras (extra) an
    document.getElementById('extra').innerHTML = allExtras.length
        ? '<ul style="list-style-type: none; padding-left: 0;">' + allExtras.map(e => `<li> ${e}</li>`).join('') + '</ul>'
        : '🌟 Super, du hast dich gut geschlagen!';

    console.log("Total Score:", totalScore);
    console.log("Category Scores:", categoryScores);
    if (!totalScore || !categoryScores) {
        console.warn("Fehlende Daten! Wurde poll.js überhaupt aufgerufen?");
    }

    // Rangliste anzeigen
    fetch('/get-leaderboard/')
        .then(response => response.json())
        .then(data => {
            const leaderboard = data.leaderboard;
            const leaderboardElement = document.getElementById('leaderboard');
            leaderboardElement.innerHTML = ''; // Clear leaderboard

            leaderboard.forEach((entry, index) => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';

                // Überprüfen, ob der Teilnehmer auf der Rangliste erscheinen möchte
                if (entry.name === participantName && leaderboardChoice === 'yes') {
                    li.style.fontWeight = 'bold';
                    li.style.backgroundColor = '#e8f5e9';
                }

                li.textContent = `${index + 1}. ${entry.name}`;
                const span = document.createElement('span');
                span.className = 'badge bg-success rounded-pill';
                span.textContent = `${entry.total_score} Punkte`;

                li.appendChild(span);
                leaderboardElement.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Fehler beim Laden der Rangliste:', error);
            const leaderboardElement = document.getElementById('leaderboard');
            const errorLi = document.createElement('li');
            errorLi.className = 'list-group-item text-danger';
            errorLi.textContent = 'Fehler beim Laden der Rangliste';
            leaderboardElement.appendChild(errorLi);
        });
});

