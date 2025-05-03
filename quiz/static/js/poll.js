let questions = [];
let currentQuestionIndex = 0;
const answers = [];
const categoryScores = {};

document.addEventListener('DOMContentLoaded', initPoll);

async function initPoll() {
  const res = await fetch('/api/questions/');
  const data = await res.json();
  questions = data.questions || [];

  // Initialisiere Kategorie-Punkte (setzen auf 0 für jede Kategorie)
  questions.forEach(q => {
    if (!categoryScores[q.category]) {
      categoryScores[q.category] = 0; // Kategorie initialisieren
    }
  });

  let maxPossibleScore = 0;
  questions.forEach(q => {
    const maxScoreForQuestion = Math.max(...q.options.map(opt => opt.score));
    maxPossibleScore += maxScoreForQuestion;
  });
  localStorage.setItem('maxPossibleScore', maxPossibleScore);
  console.log("maxPossibleScore saved:", localStorage.getItem('maxPossibleScore'));

  if (!questions.length) {
    document.getElementById('question-block').textContent = "Keine Fragen verfügbar.";
    return;
  }

  showQuestion(0);
  document.getElementById('poll-form').addEventListener('submit', onSubmit);
}

function showQuestion(index) {
  const container = document.getElementById('question-block');
  const q = questions[index];
  container.innerHTML = ''; // Vorherige Frage entfernen

  const block = document.createElement('div');
  block.className = 'mb-4 mx-auto';
  block.style.maxWidth = '600px';

  const h5 = document.createElement('h5');
  h5.className = 'mb-3 text-center';
  h5.textContent = `${index + 1}. ${q.text}`;
  block.appendChild(h5);

  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'd-grid gap-2';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline-success';
    btn.textContent = opt.text;
    btn.dataset.optionIndex = idx;

    btn.addEventListener('click', () => {
      // Auswahl speichern
      answers[index] = {
        question_id: q.id,    // Frage-ID speichern
        option_id: opt.id,    // Option-ID speichern
        category: q.category, // Kategorie speichern
        score: opt.score,     // Punkte für die Option speichern
        text: opt.text,       // Option-Text für die Anzeige
        extra: opt.extra || "",    // Lob für gewählte option
        improvement: opt.improvement || ""          // Tip für gewählte option
      };

      // Punkte zur Kategorie hinzufügen
      categoryScores[q.category] += opt.score;

      // Alle Buttons dieser Frage deaktivieren
      const allButtons = container.querySelectorAll('button[data-option-index]');
      allButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });

    buttonGroup.appendChild(btn);
  });

  block.appendChild(buttonGroup);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn btn-outline-primary mt-4';
  nextBtn.textContent = index < questions.length - 1 ? 'continue ➡️' : 'finish ✅';

  nextBtn.addEventListener('click', () => {
    if (!answers[index]) {
      alert("Please select an option.");
      return;
    }
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
      updateProgress();
      showQuestion(currentQuestionIndex);
    } else {
      updateProgress();
      document.getElementById('question-block').innerHTML =
        '<p class="text-success fw-bold text-center">You answered all questions ✅</br> Thank you for participating!</p>';
      document.getElementById('submit-button').classList.remove('d-none');
    }
  });

  block.appendChild(nextBtn);
  container.appendChild(block);
  updateProgress();
}

function updateProgress() {
  const progress = document.getElementById('progress-bar');
  progress.value = ((currentQuestionIndex) / questions.length) * 100;
}

async function onSubmit(evt) {
  evt.preventDefault();

  const totalScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);

  localStorage.setItem('totalScore', totalScore);
  localStorage.setItem('pollAnswers', JSON.stringify(answers));
  localStorage.setItem('categoryScores', JSON.stringify(categoryScores));

  console.log("totalScore saved:", localStorage.getItem('totalScore'));
  console.log("categoryScores saved:", localStorage.getItem('categoryScores'));


  // Sende Antworten an den Server
  const response = await fetch('/api/save-answers/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answers: answers,
      total_score: totalScore,
      participantName: localStorage.getItem('participantName'),
      include_in_leaderboard: localStorage.getItem('leaderboardChoice') === 'yes'
    }),
  });

  if (response.ok) {
    window.location.href = '/results/';
  } else {
    console.error('Fehler beim Speichern der Antworten');
  }
}
