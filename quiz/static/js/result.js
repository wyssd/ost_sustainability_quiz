document.addEventListener('DOMContentLoaded', () => {
    const answers = JSON.parse(localStorage.getItem('pollAnswers'));
    const categoryScores = JSON.parse(localStorage.getItem('categoryScores'));
    const participantName = localStorage.getItem('participantName');
    const leaderboardChoice = document.querySelector('input[name="leaderboard-choice"]:checked')?.value;
    const totalScore = localStorage.getItem('totalScore');

    if (!answers || !categoryScores) {
        alert('Keine Daten gefunden 😕');
        return;
    }

    if (leaderboardChoice === 'yes') {
        // Wenn der Benutzer "Ja" gewählt hat, speichern wir ihn in der Rangliste
        fetch('/save_to_leaderboard/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                participantName: participantName,
                totalScore: totalScore
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Fehler:', data.error);
                return;
            }

            console.log('Benutzer erfolgreich in die Rangliste aufgenommen');
        })
        .catch(error => {
            console.error('Fehler beim Hinzufügen zur Rangliste:', error);
        });
    }

    // Beste und schlechteste Kategorie finden
    let bestCategory = null;
    let worstCategory = null;
    let maxScore = -Infinity;
    let minScore = Infinity;

    for (const [category, score] of Object.entries(categoryScores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCategory = category;
        }
        if (score < minScore) {
            minScore = score;
            worstCategory = category;
        }
    }

    // CSRF-Funktion definieren
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Übertragen der Benutzerdaten in die Datenbank
    fetch('/save_answers/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            participantName: participantName,
            totalScore: totalScore,
            leaderboardChoice: leaderboardChoice // Nur wenn der Benutzer "Ja" für die Rangliste gewählt hat
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Fehler:', data.error);
            return;
        }

        console.log('Benutzerdaten erfolgreich gespeichert');
    })
    .catch(error => {
        console.error('Fehler beim Übertragen der Benutzerdaten:', error);
    });

    // Feedback vom Server laden
    fetch('/get_feedback/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            bestCategory: bestCategory,
            worstCategory: worstCategory
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Fehler:', data.error);
                return;
            }

            const { praise, tip } = data;

            // Daten ins HTML einfügen
            document.getElementById('total-score').textContent = totalScore;
            document.getElementById('best-category').textContent = bestCategory;
            document.getElementById('worst-category').textContent = worstCategory;
            document.getElementById('praise').textContent = praise;
            document.getElementById('tip').textContent = tip;
        })
        .catch(error => {
            console.error('Fehler beim Laden der Ergebnisse:', error);
        });

    // Abrufen der Rangliste
    fetch('/get-leaderboard/')
        .then(response => response.json())
        .then(data => {
            const leaderboard = data.leaderboard;
            const leaderboardElement = document.getElementById('leaderboard');

            // Leaderboard leeren
            leaderboardElement.innerHTML = '';

            // Rangliste anzeigen
            leaderboard.forEach((entry, index) => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';

                // Namen anzeigen basierend auf Benutzereinstellungen
                let displayName;
                if (entry.name === participantName) {
                    // Eigenen Namen anzeigen wie gespeichert
                    displayName = entry.name;
                    li.style.fontWeight = 'bold';  // Markiere den eigenen Namen fett
                    li.style.backgroundColor = '#f0faf0';  // Hintergrund leicht hervorheben
                } else {
                    // Andere Teilnehmer anonym anzeigen
                    displayName = "Andere Teilnehmer";
                }

                li.textContent = `${index + 1}. ${displayName}`;

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


    // Funktion, um den LocalStorage zu löschen
    function clearLocalStorage() {
        localStorage.clear();  // Löscht den gesamten LocalStorage
        console.log('LocalStorage wurde gelöscht');
    }

    // Button "Zurück zur Startseite" mit LocalStorage löschen
    const backButton = document.querySelector('a[href="{% url \'index\' %}"]');
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            
            // Lösche LocalStorage, bevor der Benutzer zur Startseite zurückkehrt
            clearLocalStorage();
        });
    }
});