const state = {
  currentTopic: null,
  testQuestions: [],
  currentQuestionIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  mistakes: [],
  answered: false,
  selectedOption: null
};

function init() {
  renderTopics();
  showScreen('home');
}

function renderTopics() {
  const grid = document.getElementById('topics-grid');
  grid.innerHTML = vocabularyData.topics.map((topic, i) => `
    <div class="topic-card" onclick="openTopic(${topic.id})" style="animation-delay: ${i * 0.05}s">
      <div class="topic-card-header" style="background: ${topic.color}">
        <span class="topic-icon">${topic.icon}</span>
        <span class="topic-badge">${topic.words.length} words</span>
      </div>
      <div class="topic-card-body">
        <h3>${topic.name}</h3>
        <p>${topic.description}</p>
      </div>
      <div class="topic-card-footer">
        <span>Study & Test →</span>
      </div>
    </div>
  `).join('');
}

function openTopic(topicId) {
  const topic = vocabularyData.topics.find(t => t.id === topicId);
  state.currentTopic = topic;

  document.getElementById('study-topic-name').textContent = topic.name;
  document.getElementById('study-topic-desc').textContent = topic.description;
  document.getElementById('study-word-count').textContent = `${topic.words.length} words`;

  const topicIconEl = document.getElementById('study-topic-icon');
  if (topicIconEl) {
    topicIconEl.textContent = topic.icon;
    topicIconEl.style.background = topic.color;
  }

  const wordsList = document.getElementById('words-list');
  wordsList.innerHTML = topic.words.map((item, i) => `
    <div class="word-card" style="animation-delay: ${i * 0.03}s">
      <div class="word-number">${i + 1}</div>
      <div class="word-content">
        <div class="word-term">${item.word}</div>
        <div class="word-definition">${item.definition}</div>
      </div>
    </div>
  `).join('');

  showScreen('study');
  wordsList.scrollTop = 0;
}

function goHome() {
  showScreen('home');
}

function startTest() {
  const topic = state.currentTopic;

  state.testQuestions = shuffleArray([...topic.words]);
  state.currentQuestionIndex = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.mistakes = [];
  state.answered = false;

  document.getElementById('correct-count').textContent = '0';
  document.getElementById('wrong-count').textContent = '0';

  showScreen('test');
  renderQuestion();
}

function exitTest() {
  showScreen('study');
}

function renderQuestion() {
  const topic = state.currentTopic;
  const question = state.testQuestions[state.currentQuestionIndex];
  const total = state.testQuestions.length;
  const current = state.currentQuestionIndex + 1;

  state.answered = false;
  state.selectedOption = null;

  document.getElementById('test-progress-text').textContent = `${current}/${total}`;
  const progressPct = ((current - 1) / total) * 100;
  document.getElementById('progress-bar').style.width = progressPct + '%';

  document.getElementById('question-definition').textContent = question.definition;

  const wrongOptions = topic.words
    .filter(w => w.word !== question.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const options = shuffleArray([question, ...wrongOptions]);
  const labels = ['A', 'B', 'C', 'D'];

  const optionsList = document.getElementById('options-list');
  optionsList.innerHTML = options.map((opt, i) => `
    <button class="option-btn" onclick="selectAnswer('${escapeQuotes(opt.word)}', this, '${escapeQuotes(question.word)}')">
      <span class="option-label">${labels[i]}</span>
      <span class="option-text">${opt.word}</span>
    </button>
  `).join('');

  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'none';

  const isLast = state.currentQuestionIndex === total - 1;
  nextBtn.textContent = isLast ? 'See Results' : 'Next Question';
  nextBtn.innerHTML = isLast
    ? 'See Results <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>'
    : 'Next Question <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function selectAnswer(selectedWord, btnEl, correctWord) {
  if (state.answered) return;
  state.answered = true;
  state.selectedOption = selectedWord;

  const allBtns = document.querySelectorAll('.option-btn');
  const isCorrect = selectedWord === correctWord;

  allBtns.forEach(btn => {
    const text = btn.querySelector('.option-text').textContent;
    btn.disabled = true;
    if (text === correctWord) {
      btn.classList.add('correct');
    } else if (text === selectedWord && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  if (isCorrect) {
    state.correctCount++;
    document.getElementById('correct-count').textContent = state.correctCount;
  } else {
    state.wrongCount++;
    document.getElementById('wrong-count').textContent = state.wrongCount;
    const question = state.testQuestions[state.currentQuestionIndex];
    state.mistakes.push({
      word: question.word,
      definition: question.definition,
      chosen: selectedWord
    });
  }

  document.getElementById('next-btn').style.display = 'flex';
}

function nextQuestion() {
  if (!state.answered) return;

  state.currentQuestionIndex++;

  if (state.currentQuestionIndex >= state.testQuestions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

function showResults() {
  const total = state.testQuestions.length;
  const correct = state.correctCount;
  const pct = Math.round((correct / total) * 100);

  let grade, gradeColor, message;
  if (pct >= 90) {
    grade = 'A+'; gradeColor = '#10b981';
    message = 'Outstanding! You have mastered this topic!';
  } else if (pct >= 80) {
    grade = 'A'; gradeColor = '#10b981';
    message = 'Excellent work! Almost perfect!';
  } else if (pct >= 70) {
    grade = 'B'; gradeColor = '#3b82f6';
    message = 'Good job! Keep practicing!';
  } else if (pct >= 60) {
    grade = 'C'; gradeColor = '#f59e0b';
    message = 'Not bad! Review your mistakes.';
  } else if (pct >= 50) {
    grade = 'D'; gradeColor = '#f97316';
    message = 'Keep studying! You can do better.';
  } else {
    grade = 'F'; gradeColor = '#ef4444';
    message = 'Don\'t give up! Study the words and try again.';
  }

  document.getElementById('score-percent').textContent = pct + '%';
  document.getElementById('score-grade').textContent = grade;
  document.getElementById('score-circle').style.background = `conic-gradient(${gradeColor} ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg)`;
  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-wrong').textContent = state.wrongCount;
  document.getElementById('results-message').textContent = message;
  document.getElementById('results-message').style.color = gradeColor;

  const mistakesSection = document.getElementById('mistakes-section');
  const mistakesList = document.getElementById('mistakes-list');

  if (state.mistakes.length === 0) {
    mistakesSection.style.display = 'none';
  } else {
    mistakesSection.style.display = 'block';
    mistakesList.innerHTML = state.mistakes.map(m => `
      <div class="mistake-card">
        <div class="mistake-word">${m.word}</div>
        <div class="mistake-definition">${m.definition}</div>
        <div class="mistake-chosen">Your answer: <span>${m.chosen}</span></div>
      </div>
    `).join('');
  }

  showScreen('results');
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  window.scrollTo(0, 0);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

document.addEventListener('DOMContentLoaded', init);
