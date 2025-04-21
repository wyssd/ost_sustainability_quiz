let questions = [];
let improvementTips = {};
let currentQuestionIndex = 0;
const answers = [];
const categoryScores = {}; // Dieses Objekt speichert die Punktzahlen pro Kategorie

document.addEventListener('DOMContentLoaded', initPoll);

async function initPoll() {
  const res = await fetch('/api/questions/');
  const data = await res.json();
  questions = data.questions || [];
  improvementTips = data.tips || {};

  // Initialisiere Kategorie-Punkte (setzen auf 0 für jede Kategorie)
  questions.forEach(q => {
    q.options.forEach(opt => {
      if (!categoryScores[opt.category]) {
        categoryScores[opt.category] = 0; // Kategorie initialisieren
      }
    });
  });

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
        category: opt.category, // Kategorie speichern
        score: opt.score,     // Punkte für die Option speichern
        text: opt.text        // Option-Text für die Anzeige
      };

      // Punkte zur Kategorie hinzufügen
      categoryScores[opt.category] += opt.score;

      // Alle Buttons dieser Frage deaktivieren
      const allButtons = container.querySelectorAll('button[data-option-index]');
      allButtons.forEach(b => b.classList.remove('active'));

      // Diesen aktivieren
      btn.classList.add('active');
    });

    buttonGroup.appendChild(btn);
  });

  block.appendChild(buttonGroup);

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn btn-outline-primary mt-4';
  nextBtn.textContent = index < questions.length - 1 ? 'Weiter ➡️' : 'Fertigstellen ✅';

  nextBtn.addEventListener('click', () => {
    if (!answers[index]) {
      alert("Bitte wähle eine Option aus.");
      return;
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
      updateProgress();
      showQuestion(currentQuestionIndex);
    } else {
      updateProgress();
      document.getElementById('question-block').innerHTML =
        '<p class="text-success fw-bold text-center">Alle Fragen beantwortet ✅</p>';
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
  
  // Antworten an den Server senden
  const response = await fetch('/save-answers/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      answers: answers.map(answer => answer.option_id)  // Nur die Option-IDs senden
    })
  });

  if (response.ok) {
    // Weiter zur Ergebnisanzeige
    window.location.href = '/results/';
  } else {
    alert('Fehler beim Speichern der Antworten. Bitte versuche es erneut.');
  }
}
