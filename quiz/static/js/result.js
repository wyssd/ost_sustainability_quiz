document.addEventListener('DOMContentLoaded', () => {
    const answers = JSON.parse(localStorage.getItem('pollAnswers'));
    const categoryScores = JSON.parse(localStorage.getItem('categoryScores'));

    if (!answers || !categoryScores) {
        alert('Keine Daten gefunden 😕');
        return;
    }

    // Gesamtpunktzahl berechnen
    let totalScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);

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

    // AJAX-Anfrage
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
        console.log(data);
        if (data.error) {
            alert('Fehler: ' + data.error);
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
        alert('Fehler beim Laden der Ergebnisse.');
    });
});
