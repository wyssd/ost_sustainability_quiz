// static/js/poll.js

// Globale Container für Fragen + Tipps
let questions = [];
let improvementTips = {};

document.addEventListener('DOMContentLoaded', initPoll);

async function initPoll() {
  // 1) Fragen vom Server / static/questions.json oder API‑Endpunkt holen
  const res = await fetch('/api/questions/');
  const data = await res.json();
  questions       = data.questions || [];
  improvementTips = data.tips      || {};

  if (!questions.length) {
    document.getElementById('questions-container').textContent = "Keine Fragen verfügbar.";
    return;
  }

  // 2) Fragen in das Formular injizieren
  const container = document.getElementById('questions-container');
  questions.forEach((q, i) => {
    const block = document.createElement('div');
    block.className = 'mb-4';

    // Frage-Text
    const h5 = document.createElement('h5');
    h5.textContent = `${i + 1}. ${q.text}`;
    block.appendChild(h5);

    // Options als Radio‑Buttons
    q.options.forEach((opt, idx) => {
      const id = `q${i}_opt${idx}`;

      const formCheck = document.createElement('div');
      formCheck.className = 'form-check';

      formCheck.innerHTML = `
        <input class="form-check-input" type="radio"
               name="question-${i}" id="${id}" value="${idx}" required>
        <label class="form-check-label" for="${id}">${opt.text}</label>
      `;

      block.appendChild(formCheck);
    });

    container.appendChild(block);
  });

  // 3) submit‑Handler registrieren
  document.getElementById('poll-form')
          .addEventListener('submit', onSubmit);
}

async function onSubmit(evt) {
  evt.preventDefault();

  // Antworten auslesen
  const answers = questions.map((_, i) => {
    const sel = document.querySelector(`input[name="question-${i}"]:checked`);
    return sel ? Number(sel.value) : null;
  });

  // Validierung: alle Fragen beantwortet?
  if (answers.some(a => a === null)) {
    return alert("Bitte beantworte alle Fragen, bevor Du abschickst.");
  }

  // 4) Antworten zwischenspeichern (optional im localStorage)
  localStorage.setItem('pollAnswers', JSON.stringify(answers));

  // 5) Jetzt kannst Du entweder:
  //    a) die Daten per fetch POSTen ...
  /*
  await fetch('/api/save-poll/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, timestamp: new Date().toISOString() })
  });
  */

  //    b) oder zum Quiz / zur Result‑Seite weiterleiten:
  window.location.href = 'results';
}
