document.addEventListener('DOMContentLoaded', () => {
    const answers = JSON.parse(localStorage.getItem('pollAnswers'));
    const categoryScores = JSON.parse(localStorage.getItem('categoryScores'));
    const totalScore = localStorage.getItem('totalScore');

    const allImprovements = answers.map(a => a.improvement).filter(Boolean);
    const allExtras = answers.map(a => a.extra).filter(Boolean);

    if (!totalScore || !categoryScores) {
        console.warn("Fehlende Daten!");
        return;
    }

    document.getElementById('total-score').textContent = totalScore;

    // Fetch questions to calculate max scores per category
    fetch('/api/questions/')
        .then(res => res.json())
        .then(data => {
            const questions = data.questions || [];
            const categoryMaxScores = {};

            questions.forEach(q => {
                const category = q.category;
                const maxScore = Math.max(...q.options.map(opt => opt.score));
                if (!categoryMaxScores[category]) categoryMaxScores[category] = 0;
                categoryMaxScores[category] += maxScore;
            });

            // Sort by relative score: actual / max
            const sortedCategories = Object.entries(categoryScores).sort((a, b) => {
                const ratioA = a[1] / (categoryMaxScores[a[0]] || 1);
                const ratioB = b[1] / (categoryMaxScores[b[0]] || 1);
                return ratioB - ratioA;
            });

            const bestCategory = sortedCategories[0][0];
            let worstCategory = sortedCategories[sortedCategories.length - 1][0];

            if (bestCategory === worstCategory && sortedCategories.length > 1) {
                worstCategory = sortedCategories[sortedCategories.length - 2][0];
            }

            // Set into DOM
            document.getElementById('best-category').textContent = bestCategory;
            document.getElementById('worst-category').textContent = worstCategory;

            // Show improvement / extra
            document.getElementById('improvement').innerHTML = allImprovements.length
                ? '<ul style="list-style-type: none; padding-left: 0;">' + allImprovements.map(i => `<li> ${i}</li>`).join('') + '</ul>'
                : '💬 Keep it up – you are on the right track!';

                const extraEl = document.getElementById('extra');

                if (allExtras.length) {
                    extraEl.innerHTML = `<ul style="list-style-type: none; padding-left: 0;">
                        ${allExtras.map(e => `<li>${e}</li>`).join('')}
                    </ul>`;
                } else {
                    const ratio = maxScore && totalScore 
                        ? parseFloat(totalScore) / parseFloat(maxScore) 
                        : null;
                
                    const fallbackText = ratio === null ? 
                        '🌟 Keep going – your results will appear here soon!' :
                        ratio <= 0.25 ? '🌱 You should consider taking action, begin with small steps!' :
                        ratio <= 0.5  ? '💪 You have made a start – there is potential!' :
                        ratio <= 0.75 ? '👍 You are on a good path – keep it up!' :
                                        '🌟 Great job – you are doing really well!';
                
                    extraEl.textContent = fallbackText;
                }
                
            // Danach: breakdown rendern
            createCategoryBreakdown(categoryMaxScores);

        }).catch(err => {
            console.error("Fehler beim Laden der Fragen:", err);
        });

    // images, score dots color, extra 
    const maxScore = localStorage.getItem('maxPossibleScore');
    if (maxScore && totalScore) {
        const scoreRatio = parseFloat(totalScore) / parseFloat(maxScore);
        const dotEl = document.getElementById('score-dot');
        let imagePath = '';

        if (scoreRatio <= 0.25) {
            dotEl.textContent = '🔴';
            imagePath = '/static/img/Forest_04.svg';
        } else if (scoreRatio <= 0.5) {
            dotEl.textContent = '🟠';
            imagePath = '/static/img/Forest_03.svg';
        } else if (scoreRatio <= 0.75) {
            dotEl.textContent = '🟡';
            imagePath = '/static/img/Forest_02.svg';
        } else {
            dotEl.textContent = '🟢';
            imagePath = '/static/img/Forest_01.svg';
        }

        const imageContainer = document.getElementById('result-image');
        imageContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = 'Score-Level Illustration';
        img.className = 'score-image img-fluid';
        imageContainer.appendChild(img);
    }
});


// Function to calculate max possible score per category
function createCategoryBreakdown(categoryMaxScores) {
    const categoryScores = JSON.parse(localStorage.getItem('categoryScores')) || {};
    const breakdownContainer = document.getElementById('category-breakdown');
    if (!breakdownContainer) return;

    breakdownContainer.innerHTML = '<h3 class="text-success mb-4">Category Breakdown</h3>';

    const table = document.createElement('table');
    table.className = 'table table-hover';
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Category</th>
            <th>Your Score</th>
            <th>Maximum Possible</th>
            <th>Progress</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    const sortedCategories = Object.keys(categoryMaxScores).sort((a, b) => {
        return (categoryScores[b] || 0) / categoryMaxScores[b] -
               (categoryScores[a] || 0) / categoryMaxScores[a];
    });

    sortedCategories.forEach(category => {
        const userScore = categoryScores[category] || 0;
        const maxScore = categoryMaxScores[category];
        const percentage = Math.round((userScore / maxScore) * 100);

        let progressColor = "bg-danger";
        if (percentage >= 75) {
            progressColor = "bg-success";
        } else if (percentage >= 50) {
            progressColor = "bg-warning";
        } else if (percentage >= 25) {
            progressColor = "bg-info";
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${category}</strong></td>
            <td>${userScore}</td>
            <td>${maxScore}</td>
            <td class="w-50">
                <div class="progress">
                    <div class="progress-bar ${progressColor}" role="progressbar" 
                        style="width: ${percentage}%" 
                        aria-valuenow="${percentage}" 
                        aria-valuemin="0" 
                        aria-valuemax="100">
                        ${percentage}%
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    breakdownContainer.appendChild(table);
}
