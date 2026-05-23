// ── State ──────────────────────────────────────────────────────────────────
const state = {
  currentTopic: null,
  currentMode: 'study',
  // Test
  testQuestions: [],
  currentQuestionIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  mistakes: [],
  answered: false,
  // Flashcards
  fcDeck: [],
  fcUnknown: [],
  fcIndex: 0,
  fcKnown: 0,
  fcFlipped: false,
  // Match
  matchWords: [],
  matchRoundIndex: 0,
  matchRoundSize: 5,
  matchSelected: null,
  matchMatched: 0
};

// ── Init ───────────────────────────────────────────────────────────────────
function init() {
  renderTopics();
  showScreen('home');
}

function renderTopics() {
  const total = vocabularyData.topics.reduce((s, t) => s + t.words.length, 0);
  document.querySelectorAll('.stat-number')[1].textContent = total;
  document.querySelectorAll('.stat-number')[0].textContent = vocabularyData.topics.length;

  const grid = document.getElementById('topics-grid');
  grid.innerHTML = vocabularyData.topics.map((topic, i) => `
    <div class="topic-card" onclick="openTopic(${topic.id})" style="animation-delay:${i*0.04}s">
      <div class="topic-card-header" style="background:${topic.color}">
        <span class="topic-icon">${topic.icon}</span>
        <span class="topic-badge">${topic.words.length} words</span>
      </div>
      <div class="topic-card-body">
        <h3>${topic.name}</h3>
        <p>${topic.description}</p>
      </div>
      <div class="topic-card-footer"><span>Study & Test →</span></div>
    </div>
  `).join('');
}

// ── Topic ──────────────────────────────────────────────────────────────────
function openTopic(topicId) {
  const topic = vocabularyData.topics.find(t => t.id === topicId);
  state.currentTopic = topic;
  document.getElementById('study-topic-name').textContent = topic.name;
  document.getElementById('study-topic-desc').textContent = topic.description;
  document.getElementById('study-word-count').textContent = `${topic.words.length} words`;
  switchMode('study');
  showScreen('study');
}

function goHome() { showScreen('home'); }

// ── Mode Switching ─────────────────────────────────────────────────────────
function switchMode(mode) {
  state.currentMode = mode;
  ['study','cards','match'].forEach(m => {
    document.getElementById('mode-' + m).style.display = m === mode ? 'block' : 'none';
    const tab = document.getElementById('tab-' + m);
    if (tab) tab.classList.toggle('active', m === mode);
  });
  document.getElementById('tab-test').classList.remove('active');

  if (mode === 'study') renderWordList();
  if (mode === 'cards') startCards(false);
  if (mode === 'match') startMatch();
}

// ── Study Mode ─────────────────────────────────────────────────────────────
function renderWordList() {
  const topic = state.currentTopic;
  const list = document.getElementById('words-list');
  list.innerHTML = topic.words.map((item, i) => `
    <div class="word-card" style="animation-delay:${i*0.025}s">
      <div class="word-number">${i + 1}</div>
      <div class="word-content">
        <div class="word-term">${item.word}</div>
        <div class="word-definition">${item.definition}</div>
        ${ruTranslations[item.word] ? `<div class="word-ru">🇷🇺 ${ruTranslations[item.word]}</div>` : ''}
      </div>
    </div>
  `).join('');
  list.scrollTop = 0;
}

// ── Flashcard Mode ─────────────────────────────────────────────────────────
function startCards(reviewOnly) {
  const topic = state.currentTopic;
  state.fcDeck = reviewOnly && state.fcUnknown.length
    ? shuffleArray([...state.fcUnknown])
    : shuffleArray([...topic.words]);
  state.fcUnknown = [];
  state.fcIndex = 0;
  state.fcKnown = 0;
  state.fcFlipped = false;

  document.getElementById('fc-done').style.display = 'none';
  document.getElementById('flashcard-container') && (document.getElementById('flashcard-container').style.display = 'block');
  showFcCard();
}

function showFcCard() {
  const deck = state.fcDeck;
  if (state.fcIndex >= deck.length) { showFcDone(); return; }

  const card = deck[state.fcIndex];
  const total = deck.length;
  state.fcFlipped = false;

  const fc = document.getElementById('flashcard');
  fc.classList.remove('flipped');
  document.getElementById('fc-word').textContent = card.word;
  document.getElementById('fc-word-sm').textContent = card.word;
  document.getElementById('fc-def').textContent = card.definition;
  document.getElementById('fc-ru').textContent = ruTranslations[card.word] ? '🇷🇺 ' + ruTranslations[card.word] : '';

  document.getElementById('fc-counter').textContent = `${state.fcIndex + 1} / ${total}`;
  document.getElementById('fc-left').textContent = `${total - state.fcIndex} left`;
  document.getElementById('fc-known').textContent = `✓ ${state.fcKnown} known`;
  document.getElementById('fc-progress-bar').style.width = (state.fcKnown / state.currentTopic.words.length * 100) + '%';

  document.getElementById('fc-buttons').style.display = 'none';
  document.getElementById('fc-done').style.display = 'none';
  document.querySelector('.flashcard-container').style.display = 'block';
}

function flipCard() {
  if (state.fcIndex >= state.fcDeck.length) return;
  state.fcFlipped = !state.fcFlipped;
  document.getElementById('flashcard').classList.toggle('flipped', state.fcFlipped);
  if (state.fcFlipped) {
    document.getElementById('fc-buttons').style.display = 'flex';
  }
}

function cardAction(knew) {
  if (!state.fcFlipped) return;
  const card = state.fcDeck[state.fcIndex];
  if (knew) {
    state.fcKnown++;
  } else {
    state.fcUnknown.push(card);
  }
  state.fcIndex++;
  showFcCard();
}

function showFcDone() {
  document.querySelector('.flashcard-container').style.display = 'none';
  document.getElementById('fc-buttons').style.display = 'none';
  const done = document.getElementById('fc-done');
  done.style.display = 'block';
  const total = state.currentTopic.words.length;
  const unknown = state.fcUnknown.length;
  document.getElementById('fc-done-sub').textContent =
    unknown === 0
      ? `Perfect! You know all ${total} words! 🎉`
      : `You know ${state.fcKnown} / ${total}. ${unknown} word${unknown > 1 ? 's' : ''} to review.`;
  const reviewBtn = document.getElementById('fc-review-btn');
  reviewBtn.style.display = unknown > 0 ? 'flex' : 'none';
}

// ── Match Mode ─────────────────────────────────────────────────────────────
function startMatch() {
  state.matchWords = shuffleArray([...state.currentTopic.words]);
  state.matchRoundIndex = 0;
  state.matchMatched = 0;
  state.matchSelected = null;
  document.getElementById('match-done').style.display = 'none';
  document.getElementById('match-grid').style.display = 'grid';
  renderMatchRound();
}

function renderMatchRound() {
  const start = state.matchRoundIndex * state.matchRoundSize;
  const slice = state.matchWords.slice(start, start + state.matchRoundSize);
  if (slice.length === 0) { showMatchDone(); return; }

  const totalRounds = Math.ceil(state.matchWords.length / state.matchRoundSize);
  const currentRound = state.matchRoundIndex + 1;
  document.getElementById('match-round').textContent = `Round ${currentRound}/${totalRounds}`;
  document.getElementById('match-score-txt').textContent = `${state.matchMatched} matched`;
  document.getElementById('match-progress-bar').style.width =
    (state.matchMatched / state.matchWords.length * 100) + '%';

  const shuffledDefs = shuffleArray([...slice]);

  const grid = document.getElementById('match-grid');
  grid.innerHTML = [
    ...slice.map(w => `<div class="match-item word-item" data-word="${escQ(w.word)}" onclick="matchClick(this,'word','${escQ(w.word)}')">${w.word}</div>`),
    ...shuffledDefs.map(w => `<div class="match-item def-item" data-word="${escQ(w.word)}" onclick="matchClick(this,'def','${escQ(w.word)}')">${truncDef(w.definition)}</div>`)
  ].join('');
}

function truncDef(def) {
  return def.length > 70 ? def.slice(0, 68) + '…' : def;
}

function matchClick(el, type, word) {
  if (el.classList.contains('matched') || el.classList.contains('wrong-flash')) return;

  if (!state.matchSelected) {
    document.querySelectorAll('.match-item.selected').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    state.matchSelected = { el, word };
    return;
  }

  // Second click — check if same type (deselect) or pair
  if (state.matchSelected.el === el) {
    el.classList.remove('selected');
    state.matchSelected = null;
    return;
  }

  const prev = state.matchSelected;
  state.matchSelected = null;

  if (prev.word === word) {
    // Correct!
    prev.el.classList.remove('selected');
    prev.el.classList.add('matched');
    el.classList.add('matched');
    state.matchMatched++;
    document.getElementById('match-score-txt').textContent = `${state.matchMatched} matched`;
    document.getElementById('match-progress-bar').style.width =
      (state.matchMatched / state.matchWords.length * 100) + '%';

    // Check if round complete
    const allMatched = document.querySelectorAll('.match-item:not(.matched)').length === 0;
    if (allMatched) {
      state.matchRoundIndex++;
      setTimeout(() => renderMatchRound(), 500);
    }
  } else {
    // Wrong
    prev.el.classList.remove('selected');
    prev.el.classList.add('wrong-flash');
    el.classList.add('wrong-flash');
    setTimeout(() => {
      prev.el.classList.remove('wrong-flash');
      el.classList.remove('wrong-flash');
    }, 400);
  }
}

function showMatchDone() {
  document.getElementById('match-grid').style.display = 'none';
  document.getElementById('match-done').style.display = 'block';
}

function escQ(str) {
  return str.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

// ── Test Mode ──────────────────────────────────────────────────────────────
function startTest() {
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
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

function exitTest() { showScreen('study'); }

function renderQuestion() {
  const topic = state.currentTopic;
  const question = state.testQuestions[state.currentQuestionIndex];
  const total = state.testQuestions.length;
  const current = state.currentQuestionIndex + 1;
  state.answered = false;

  document.getElementById('test-progress-text').textContent = `${current}/${total}`;
  document.getElementById('progress-bar').style.width = ((current - 1) / total * 100) + '%';
  document.getElementById('question-definition').textContent = question.definition;
  const ruEl = document.getElementById('question-ru');
  if (ruEl) ruEl.textContent = ruTranslations[question.word] ? `🇷🇺 ${ruTranslations[question.word]}` : '';

  const wrongOptions = topic.words
    .filter(w => w.word !== question.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = shuffleArray([question, ...wrongOptions]);
  const labels = ['A','B','C','D'];

  document.getElementById('options-list').innerHTML = options.map((opt, i) => `
    <button class="option-btn" onclick="selectAnswer('${escapeQuotes(opt.word)}', this, '${escapeQuotes(question.word)}')">
      <span class="option-label">${labels[i]}</span>
      <span class="option-text">${opt.word}</span>
    </button>
  `).join('');

  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'none';
  const isLast = state.currentQuestionIndex === total - 1;
  nextBtn.innerHTML = (isLast
    ? 'See Results'
    : 'Next Question') +
    ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function selectAnswer(selectedWord, btnEl, correctWord) {
  if (state.answered) return;
  state.answered = true;
  const isCorrect = selectedWord === correctWord;

  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    const text = btn.querySelector('.option-text').textContent;
    if (text === correctWord) btn.classList.add('correct');
    else if (text === selectedWord && !isCorrect) btn.classList.add('wrong');
  });

  if (isCorrect) {
    state.correctCount++;
    document.getElementById('correct-count').textContent = state.correctCount;
  } else {
    state.wrongCount++;
    document.getElementById('wrong-count').textContent = state.wrongCount;
    const q = state.testQuestions[state.currentQuestionIndex];
    state.mistakes.push({ word: q.word, definition: q.definition, ru: ruTranslations[q.word] || '', chosen: selectedWord });
  }
  document.getElementById('next-btn').style.display = 'flex';
}

function nextQuestion() {
  if (!state.answered) return;
  state.currentQuestionIndex++;
  if (state.currentQuestionIndex >= state.testQuestions.length) showResults();
  else renderQuestion();
}

// ── Results ────────────────────────────────────────────────────────────────
function showResults() {
  const total = state.testQuestions.length;
  const correct = state.correctCount;
  const pct = Math.round((correct / total) * 100);

  const grades = [
    [90,'A+','#10b981','Outstanding! You have mastered this topic! 🏆'],
    [80,'A', '#10b981','Excellent work! Almost perfect! 🎉'],
    [70,'B', '#3b82f6','Good job! Keep practicing! 👍'],
    [60,'C', '#f59e0b','Not bad! Review your mistakes.'],
    [50,'D', '#f97316','Keep studying! You can do better.'],
    [0, 'F', '#ef4444','Don\'t give up! Study the words and try again.']
  ];
  const [, grade, color, message] = grades.find(([min]) => pct >= min);

  document.getElementById('score-percent').textContent = pct + '%';
  document.getElementById('score-grade').textContent = grade;
  document.getElementById('score-circle').style.background =
    `conic-gradient(${color} ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg)`;
  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-wrong').textContent = state.wrongCount;
  document.getElementById('results-message').textContent = message;
  document.getElementById('results-message').style.color = color;

  const mistakesSection = document.getElementById('mistakes-section');
  if (state.mistakes.length === 0) {
    mistakesSection.style.display = 'none';
  } else {
    mistakesSection.style.display = 'block';
    document.getElementById('mistakes-list').innerHTML = state.mistakes.map(m => `
      <div class="mistake-card">
        <div class="mistake-word">${m.word}</div>
        <div class="mistake-definition">${m.definition}</div>
        ${m.ru ? `<div class="mistake-ru">🇷🇺 ${m.ru}</div>` : ''}
        <div class="mistake-chosen">Ваш ответ: <span>${m.chosen}</span></div>
      </div>
    `).join('');
  }
  showScreen('results');
}

// ── Helpers ────────────────────────────────────────────────────────────────
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
