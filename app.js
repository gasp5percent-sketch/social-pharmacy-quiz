
(function () {
  'use strict';

  var QUESTIONS = window.QUESTIONS || [];
  var LETTERS = 'アイウエオカキクケコサシスセソ';
  var KEY = 'social_pharmacy_pwa_v1';

  var state = {
    category: 'all',
    mode: 'all',
    shuffle: false,
    order: [],
    index: 0,
    stats: {}
  };

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalize(s) {
    s = String(s || '');
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var code = s.charCodeAt(i);
      if (code >= 0xFF01 && code <= 0xFF5E) out += String.fromCharCode(code - 0xFEE0);
      else out += s.charAt(i);
    }
    return out
      .replace(/[\s　]/g, '')
      .replace(/＞/g, '>')
      .replace(/＜/g, '<')
      .replace(/・/g, '')
      .replace(/,/g, '、')
      .toLowerCase();
  }

  function loadStats() {
    try { state.stats = JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { state.stats = {}; }
  }

  function saveStats() {
    try { localStorage.setItem(KEY, JSON.stringify(state.stats)); }
    catch (e) {}
  }

  function categories() {
    var result = ['all'];
    for (var i = 0; i < QUESTIONS.length; i++) {
      var c = QUESTIONS[i].category;
      if (result.indexOf(c) < 0) result.push(c);
    }
    return result;
  }

  function setupCategorySelect() {
    var sel = $('categorySelect');
    var cats = categories();
    sel.innerHTML = '';
    for (var i = 0; i < cats.length; i++) {
      var op = document.createElement('option');
      op.value = cats[i];
      op.textContent = cats[i] === 'all' ? '全カテゴリ' : cats[i];
      sel.appendChild(op);
    }
  }

  function makeOrder() {
    var arr = [];
    for (var i = 0; i < QUESTIONS.length; i++) {
      var q = QUESTIONS[i];
      var s = state.stats[q.id];
      var ok = true;

      if (state.category !== 'all' && q.category !== state.category) ok = false;
      if (state.mode === 'weak' && !(s && s.last === false)) ok = false;
      if (state.mode === 'unseen' && s) ok = false;
      if (state.mode === 'text' && q.type !== 'text') ok = false;
      if (state.mode === 'select' && q.type === 'text') ok = false;

      if (ok) arr.push(i);
    }

    if (state.shuffle) {
      for (var j = arr.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var temp = arr[j];
        arr[j] = arr[k];
        arr[k] = temp;
      }
    }

    state.order = arr;
    if (state.index >= state.order.length) state.index = Math.max(0, state.order.length - 1);
  }

  function currentQuestion() {
    if (!state.order.length) return null;
    return QUESTIONS[state.order[state.index]];
  }

  function showView(name) {
    var views = document.querySelectorAll('.view');
    for (var i = 0; i < views.length; i++) views[i].classList.remove('active');
    $(name).classList.add('active');
  }

  function updateSummary() {
    var attempts = 0, correct = 0, weak = 0;

    for (var id in state.stats) {
      if (Object.prototype.hasOwnProperty.call(state.stats, id)) {
        attempts += state.stats[id].tries || 0;
        correct += state.stats[id].correct || 0;
        if (state.stats[id].last === false) weak += 1;
      }
    }

    $('totalCount').textContent = QUESTIONS.length;
    $('totalAttempts').textContent = attempts;
    $('totalRate').textContent = attempts ? Math.round(correct / attempts * 100) + '%' : '0%';
    $('weakCount').textContent = weak;
    renderCategoryStats();
  }

  function renderCategoryStats() {
    var box = $('categoryStats');
    var cats = categories().filter(function (x) { return x !== 'all'; });
    var html = '';

    for (var i = 0; i < cats.length; i++) {
      var cat = cats[i];
      var total = 0, done = 0, rateTry = 0, rateCorrect = 0;

      for (var j = 0; j < QUESTIONS.length; j++) {
        var q = QUESTIONS[j];
        if (q.category !== cat) continue;
        total += 1;
        var s = state.stats[q.id];
        if (s) {
          done += 1;
          rateTry += s.tries || 0;
          rateCorrect += s.correct || 0;
        }
      }

      var rate = rateTry ? Math.round(rateCorrect / rateTry * 100) + '%' : '0%';
      html += '<div class="cat-row"><div class="cat-row-top"><span>' + esc(cat) + '</span><span>' + done + '/' + total + '</span></div><small>正答率 ' + rate + '</small></div>';
    }

    box.innerHTML = html;
  }

  function startQuiz() {
    state.category = $('categorySelect').value;
    state.mode = $('modeSelect').value;
    state.shuffle = $('shuffleToggle').checked;
    state.index = 0;
    makeOrder();
    showView('quizView');
    renderQuestion();
  }

  function renderQuestion() {
    var q = currentQuestion();
    var card = $('questionCard');

    if (!q) {
      $('progressText').textContent = '0 / 0';
      $('progressBar').style.width = '0%';
      card.innerHTML = '<p class="prompt">表示できる問題がありません。</p>';
      return;
    }

    $('progressText').textContent = (state.index + 1) + ' / ' + state.order.length;
    $('progressBar').style.width = ((state.index + 1) / state.order.length * 100) + '%';

    card.className = 'question-card';
    var kindLabel = q.type === 'text' ? '記述・空欄' : (q.type === 'multi' ? '複数選択' : '単一選択');
    var s = state.stats[q.id];

    var html = '';
    html += '<div class="meta">';
    html += '<span class="pill">' + esc(q.category) + '</span>';
    html += '<span class="pill">' + kindLabel + '</span>';
    html += '<span class="pill">' + (s ? s.tries : 0) + '回</span>';
    html += '</div>';
    html += '<p class="prompt">' + esc(q.prompt) + '</p>';

    if (q.type === 'text') {
      html += '<input id="textAnswer" type="text" autocomplete="off" placeholder="答えを入力">';
    } else {
      var inputType = q.type === 'multi' ? 'checkbox' : 'radio';
      html += '<div class="choices">';
      for (var i = 0; i < q.choices.length; i++) {
        var isCorrect = q.answer.indexOf(i) >= 0;
        var cls = isCorrect ? 'correct' : 'wrong';
        html += '<div class="choice-row">';
        html += '<input id="choice' + i + '" name="answer" type="' + inputType + '" value="' + i + '">';
        html += '<label class="choice ' + cls + '" for="choice' + i + '">';
        html += '<span class="letter">' + LETTERS.charAt(i) + '</span><span>' + esc(q.choices[i]) + '</span>';
        html += '</label></div>';
      }
      html += '</div>';
    }

    html += '<div id="result" class="result"></div>';
    html += '<button id="answerToggle" class="answer-toggle" type="button">答え・解説を見る</button>';
    html += answerPanelHtml(q);

    card.innerHTML = html;

    $('answerToggle').addEventListener('click', function () {
      var panel = document.querySelector('.answer-panel');
      panel.classList.toggle('show');
    });
  }

  function answerPanelHtml(q) {
    var html = '<section class="answer-panel">';

    if (q.type === 'text') {
      html += '<p><b>正解：</b>' + esc(q.answers.join('／')) + '</p>';
      html += '<p>' + esc(q.explain) + '</p>';
    } else {
      var ans = [];
      for (var i = 0; i < q.answer.length; i++) ans.push(LETTERS.charAt(q.answer[i]));
      html += '<p><b>正解：</b>' + esc(ans.join('、')) + '</p>';
      html += '<p>' + esc(q.explain) + '</p>';
      html += '<div class="option-title">選択肢ごとの解説</div>';

      for (var j = 0; j < q.choices.length; j++) {
        var ok = q.answer.indexOf(j) >= 0;
        var badge = ok ? '<span class="badge-ok">正しい</span>' : '<span class="badge-ng">誤り</span>';
        var exp = q.choiceExplanations && q.choiceExplanations[j] ? q.choiceExplanations[j] : '';
        html += '<div class="option-exp"><p><b>' + LETTERS.charAt(j) + '. ' + esc(q.choices[j]) + '</b> ' + badge + '</p><p>' + esc(exp) + '</p></div>';
      }
    }

    html += '</section>';
    return html;
  }

  function selectedValues() {
    var checked = document.querySelectorAll('.choice-row input:checked');
    var arr = [];
    for (var i = 0; i < checked.length; i++) arr.push(Number(checked[i].value));
    return arr.sort(function (a, b) { return a - b; });
  }

  function sameArray(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function gradeCurrent() {
    var q = currentQuestion();
    if (!q) return;

    var ok = false;
    var result = $('result');

    if (q.type === 'text') {
      var value = normalize($('textAnswer').value);
      for (var i = 0; i < q.answers.length; i++) {
        if (normalize(q.answers[i]) === value) {
          ok = true;
          break;
        }
      }
      result.className = 'result ' + (ok ? 'ok' : 'ng');
      result.textContent = ok ? '正解です。' : '不正解です。答え・解説を確認してください。';
    } else {
      var selected = selectedValues();
      if (!selected.length) {
        result.className = 'result ng';
        result.textContent = '選択肢を選んでください。';
        return;
      }
      var answer = q.answer.slice().sort(function (a, b) { return a - b; });
      ok = sameArray(selected, answer);
      $('questionCard').classList.add('graded');
      result.className = 'result ' + (ok ? 'ok' : 'ng');
      result.textContent = ok ? '正解です。' : '不正解です。緑が正解、赤が選んだ誤答です。';
    }

    if (!state.stats[q.id]) state.stats[q.id] = { tries: 0, correct: 0, last: null };
    state.stats[q.id].tries += 1;
    if (ok) state.stats[q.id].correct += 1;
    state.stats[q.id].last = ok;
    saveStats();

    var panel = document.querySelector('.answer-panel');
    if (panel) panel.classList.add('show');

    updateSummary();
  }

  function renderQuestionList() {
    var box = $('questionList');
    var html = '';

    for (var i = 0; i < QUESTIONS.length; i++) {
      var q = QUESTIONS[i];
      var s = state.stats[q.id];
      var tries = s ? s.tries : 0;
      var last = s ? (s.last ? '直近正解' : '直近不正解') : '未採点';

      html += '<button class="list-item" type="button" data-index="' + i + '">';
      html += '<b>No.' + q.no + ' ' + esc(q.prompt) + '</b>';
      html += '<small>' + esc(q.category) + ' / ' + tries + '回 / ' + last + '</small>';
      html += '</button>';
    }

    box.innerHTML = html;

    var buttons = box.querySelectorAll('.list-item');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener('click', function () {
        var originalIndex = Number(this.getAttribute('data-index'));
        state.order = [originalIndex];
        state.index = 0;
        showView('quizView');
        renderQuestion();
      });
    }
  }

  function prevQuestion() {
    if (state.index > 0) {
      state.index -= 1;
      renderQuestion();
      window.scrollTo(0, 0);
    }
  }

  function nextQuestion() {
    if (state.index < state.order.length - 1) {
      state.index += 1;
      renderQuestion();
      window.scrollTo(0, 0);
    }
  }

  function resetHistory() {
    if (!confirm('履歴を削除しますか？')) return;
    state.stats = {};
    saveStats();
    updateSummary();
    renderQuestion();
  }

  function exportHistory() {
    var blob = new Blob([JSON.stringify(state.stats, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'social_pharmacy_history.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importHistory(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        state.stats = JSON.parse(String(reader.result || '{}'));
        saveStats();
        updateSummary();
        alert('履歴を読み込みました。');
      } catch (e) {
        alert('読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  }

  function bindEvents() {
    $('startBtn').addEventListener('click', startQuiz);
    $('listBtn').addEventListener('click', function () {
      renderQuestionList();
      showView('listView');
    });
    $('backHomeBtn').addEventListener('click', function () {
      updateSummary();
      showView('homeView');
    });
    $('listHomeBtn').addEventListener('click', function () {
      updateSummary();
      showView('homeView');
    });
    $('prevBtn').addEventListener('click', prevQuestion);
    $('nextBtn').addEventListener('click', nextQuestion);
    $('gradeBtn').addEventListener('click', gradeCurrent);

    $('settingsBtn').addEventListener('click', function () {
      $('settingsDialog').showModal();
    });
    $('resetHistoryBtn').addEventListener('click', resetHistory);
    $('exportBtn').addEventListener('click', exportHistory);
    $('importInput').addEventListener('change', function () {
      importHistory(this.files && this.files[0]);
    });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(function () {});
    }
  }

  function init() {
    loadStats();
    setupCategorySelect();
    bindEvents();
    updateSummary();
    registerServiceWorker();
  }

  init();
})();
