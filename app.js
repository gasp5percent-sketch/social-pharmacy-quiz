
(function () {
  'use strict';

  var QUESTIONS = window.QUESTIONS || [];
  var LETTERS = 'アイウエオカキクケコサシスセソ';
  var KEY = 'social_pharmacy_pwa_v3_pdf_enhanced';
  var OLD_KEYS = ['social_pharmacy_pwa_v1', 'sosha_v6_stats'];

  var ABBR = {
    'GLP': 'Good Laboratory Practice（医薬品の安全性に関する非臨床試験の実施基準）',
    'GCP': 'Good Clinical Practice（医薬品の臨床試験の実施基準）',
    'GMP': 'Good Manufacturing Practice（医薬品等の製造管理及び品質管理の基準）',
    'GQP': 'Good Quality Practice（医薬品等の品質管理の基準）',
    'GVP': 'Good Vigilance Practice（医薬品等の製造販売後安全管理の基準）',
    'RMP': 'Risk Management Plan（医薬品リスク管理計画）',
    'DPC': 'Diagnosis Procedure Combination（診断群分類包括評価）',
    'CRO': 'Contract Research Organization（開発業務受託機関）',
    'CRA': 'Clinical Research Associate（臨床開発モニター）',
    'SMO': 'Site Management Organization（治験施設支援機関）',
    'CRC': 'Clinical Research Coordinator（治験コーディネーター）',
    'IRB': 'Institutional Review Board（治験審査委員会）',
    'ICH': 'International Council for Harmonisation of Technical Requirements for Pharmaceuticals for Human Use（医薬品規制調和国際会議）',
    'CJD': 'Creutzfeldt-Jakob Disease（クロイツフェルト・ヤコブ病）'
  };

  var state = {
    category: 'all',
    mode: 'all',
    search: '',
    shuffle: false,
    order: [],
    index: 0,
    stats: {}
  };

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
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
    return out.replace(/[\s　]/g, '').replace(/＞/g, '>').replace(/＜/g, '<')
      .replace(/・/g, '').replace(/,/g, '、').toLowerCase();
  }

  function emptyStats() {
    return { tries: 0, correct: 0, wrong: 0, last: null, bookmarked: false };
  }

  function normalizeStat(s) {
    if (!s) return null;
    var n = emptyStats();
    n.tries = Number(s.tries || 0);
    n.correct = Number(s.correct || 0);
    n.wrong = Number(s.wrong != null ? s.wrong : Math.max(0, n.tries - n.correct));
    n.last = (s.last === true || s.last === false) ? s.last : null;
    n.bookmarked = !!s.bookmarked;
    return n;
  }

  function loadStats() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        state.stats = JSON.parse(raw);
      } else {
        for (var i = 0; i < OLD_KEYS.length; i++) {
          var old = localStorage.getItem(OLD_KEYS[i]);
          if (old) {
            state.stats = JSON.parse(old);
            break;
          }
        }
      }
    } catch (e) {
      state.stats = {};
    }
    for (var id in state.stats) {
      if (Object.prototype.hasOwnProperty.call(state.stats, id)) {
        state.stats[id] = normalizeStat(state.stats[id]);
      }
    }
  }

  function saveStats() {
    try { localStorage.setItem(KEY, JSON.stringify(state.stats)); } catch (e) {}
  }

  function getStat(id) {
    if (!state.stats[id]) state.stats[id] = emptyStats();
    return state.stats[id];
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

  function questionText(q) {
    var parts = [q.category, q.prompt, q.explain, q.context || '', q.source || ''];
    if (q.choices) parts = parts.concat(q.choices);
    if (q.answers) parts = parts.concat(q.answers);
    if (q.choiceExplanations) parts = parts.concat(q.choiceExplanations);
    return parts.join(' ').toLowerCase();
  }

  function makeOrder() {
    var arr = [];
    var query = String(state.search || '').toLowerCase();

    for (var i = 0; i < QUESTIONS.length; i++) {
      var q = QUESTIONS[i];
      var s = state.stats[q.id];
      var ok = true;

      if (state.category !== 'all' && q.category !== state.category) ok = false;
      if (state.mode === 'weak' && !(s && s.wrong > 0)) ok = false;
      if (state.mode === 'lastWrong' && !(s && s.last === false)) ok = false;
      if (state.mode === 'unseen' && s && s.tries > 0) ok = false;
      if (state.mode === 'bookmark' && !(s && s.bookmarked)) ok = false;
      if (state.mode === 'text' && q.type !== 'text') ok = false;
      if (state.mode === 'select' && q.type === 'text') ok = false;
      if (query && questionText(q).indexOf(query) < 0) ok = false;

      if (ok) arr.push(i);
    }

    if (state.mode === 'weak') {
      arr.sort(function(a, b) {
        var sa = state.stats[QUESTIONS[a].id] || emptyStats();
        var sb = state.stats[QUESTIONS[b].id] || emptyStats();
        return (sb.wrong || 0) - (sa.wrong || 0);
      });
    }

    if (state.shuffle) {
      for (var j = arr.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var temp = arr[j]; arr[j] = arr[k]; arr[k] = temp;
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

  function statTotals() {
    var attempts = 0, correct = 0, wrong = 0, weak = 0, bookmarked = 0;
    for (var id in state.stats) {
      if (Object.prototype.hasOwnProperty.call(state.stats, id)) {
        var s = normalizeStat(state.stats[id]);
        attempts += s.tries || 0;
        correct += s.correct || 0;
        wrong += s.wrong || 0;
        if ((s.wrong || 0) > 0) weak += 1;
        if (s.bookmarked) bookmarked += 1;
      }
    }
    return { attempts: attempts, correct: correct, wrong: wrong, weak: weak, bookmarked: bookmarked };
  }

  function updateSummary() {
    var t = statTotals();
    $('totalCount').textContent = QUESTIONS.length;
    $('totalAttempts').textContent = t.attempts;
    $('totalWrong').textContent = t.wrong;
    $('totalRate').textContent = t.attempts ? Math.round(t.correct / t.attempts * 100) + '%' : '0%';
    renderCategoryStats();
  }

  function renderCategoryStats() {
    var box = $('categoryStats');
    var cats = categories().filter(function(x) { return x !== 'all'; });
    var html = '';

    for (var i = 0; i < cats.length; i++) {
      var cat = cats[i], total = 0, done = 0, tries = 0, correct = 0, wrong = 0;
      for (var j = 0; j < QUESTIONS.length; j++) {
        var q = QUESTIONS[j];
        if (q.category !== cat) continue;
        total += 1;
        var s = state.stats[q.id];
        if (s && s.tries > 0) {
          done += 1;
          tries += s.tries || 0;
          correct += s.correct || 0;
          wrong += s.wrong || 0;
        }
      }
      var rate = tries ? Math.round(correct / tries * 100) + '%' : '0%';
      html += '<div class="cat-row"><div class="cat-row-top"><span>' + esc(cat) + '</span><span>' + done + '/' + total + '</span></div><small>回答 ' + tries + '回 / 誤答 ' + wrong + '回 / 正答率 ' + rate + '</small></div>';
    }
    box.innerHTML = html;
  }

  function startQuiz() {
    state.category = $('categorySelect').value;
    state.mode = $('modeSelect').value;
    state.search = $('searchInput').value || '';
    state.shuffle = $('shuffleToggle').checked;
    state.index = 0;
    makeOrder();
    showView('quizView');
    renderQuestion();
  }

  function glossaryItems(q) {
    var text = questionText(q);
    var items = [];
    for (var key in ABBR) {
      if (Object.prototype.hasOwnProperty.call(ABBR, key)) {
        if (text.indexOf(key.toLowerCase()) >= 0 || text.indexOf(toFullWidth(key).toLowerCase()) >= 0) {
          items.push('<li><b>' + esc(key) + '</b> = ' + esc(ABBR[key]) + '</li>');
        }
      }
    }
    return items;
  }

  function toFullWidth(s) {
    return String(s).replace(/[A-Za-z0-9]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) + 0xFEE0);
    });
  }


  function renderFigures(figures) {
    var html = '<div class="figure-list">';
    for (var i = 0; i < figures.length; i++) {
      var f = figures[i];
      html += '<figure class="figure-block">';
      html += '<figcaption>' + esc(f.title || '図表') + '</figcaption>';
      html += '<a href="' + esc(f.src) + '" target="_blank" rel="noopener">';
      html += '<img src="' + esc(f.src) + '" alt="' + esc(f.title || '図表') + '" loading="lazy">';
      html += '</a>';
      if (f.note) html += '<p class="figure-note">' + esc(f.note) + '</p>';
      html += '</figure>';
    }
    html += '</div>';
    return html;
  }

  function renderQuestion() {
    var q = currentQuestion();
    var card = $('questionCard');

    if (!q) {
      $('progressText').textContent = '0 / 0';
      $('progressBar').style.width = '0%';
      card.innerHTML = '<p class="prompt">表示できる問題がありません。</p>';
      $('prevBtn').disabled = true;
      $('nextBtn').disabled = true;
      return;
    }

    $('progressText').textContent = (state.index + 1) + ' / ' + state.order.length;
    $('progressBar').style.width = ((state.index + 1) / state.order.length * 100) + '%';

    card.className = 'question-card';
    var kindLabel = q.type === 'text' ? '記述・空欄' : (q.type === 'multi' ? '複数選択' : '単一選択');
    var s = state.stats[q.id] || emptyStats();
    var qRate = s.tries ? Math.round(s.correct / s.tries * 100) + '%' : '未回答';

    var html = '';
    html += '<div class="meta">';
    html += '<span class="pill">' + esc(q.category) + '</span>';
    html += '<span class="pill">' + kindLabel + '</span>';
    html += '<span class="pill">回答' + (s.tries || 0) + '回</span>';
    html += '<span class="pill">誤答' + (s.wrong || 0) + '回</span>';
    html += '<span class="pill">正答率' + qRate + '</span>';
    html += '</div>';
    html += '<p class="prompt">' + esc(q.prompt) + '</p>';

    if (q.context) {
      html += '<div class="context-block">' + esc(q.context) + '</div>';
    }

    if (q.figures && q.figures.length) {
      html += renderFigures(q.figures);
    }

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
    html += '<div class="actions-row">';
    html += '<button id="answerToggle" class="answer-toggle" type="button">答え・解説を見る</button>';
    html += '<button id="bookmarkBtn" class="' + (s.bookmarked ? 'bookmark-on ' : '') + 'secondary-btn" type="button">' + (s.bookmarked ? '★ ブックマーク中' : '☆ ブックマーク') + '</button>';
    html += '</div>';
    html += answerPanelHtml(q);

    card.innerHTML = html;

    $('answerToggle').addEventListener('click', function () {
      var panel = document.querySelector('.answer-panel');
      panel.classList.toggle('show');
    });

    $('bookmarkBtn').addEventListener('click', function () {
      var st = getStat(q.id);
      st.bookmarked = !st.bookmarked;
      saveStats();
      renderQuestion();
      updateSummary();
    });

    $('prevBtn').disabled = state.index <= 0;
    $('nextBtn').disabled = state.index >= state.order.length - 1;
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

    var gl = glossaryItems(q);
    if (gl.length) {
      html += '<div class="glossary"><b>略語のフルスペル</b><ul>' + gl.join('') + '</ul></div>';
    }

    html += '</section>';
    return html;
  }

  function selectedValues() {
    var checked = document.querySelectorAll('.choice-row input:checked');
    var arr = [];
    for (var i = 0; i < checked.length; i++) arr.push(Number(checked[i].value));
    return arr.sort(function(a, b) { return a - b; });
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
      var answer = q.answer.slice().sort(function(a, b) { return a - b; });
      ok = sameArray(selected, answer);
      $('questionCard').classList.add('graded');
      result.className = 'result ' + (ok ? 'ok' : 'ng');
      result.textContent = ok ? '正解です。' : '不正解です。緑が正解、赤が選んだ誤答です。';
    }

    var st = getStat(q.id);
    st.tries += 1;
    if (ok) st.correct += 1;
    else st.wrong += 1;
    st.last = ok;
    saveStats();

    var panel = document.querySelector('.answer-panel');
    if (panel) panel.classList.add('show');

    updateSummary();
    renderQuestion();
    var res = $('result');
    if (res) {
      res.className = 'result ' + (ok ? 'ok' : 'ng');
      res.textContent = ok ? '正解です。' : '不正解です。答え・解説を確認してください。';
    }
    var p = document.querySelector('.answer-panel');
    if (p) p.classList.add('show');
    if (q.type !== 'text') $('questionCard').classList.add('graded');
  }

  function renderQuestionList() {
    var box = $('questionList');
    var query = String($('listSearchInput').value || '').toLowerCase();
    var html = '';

    for (var i = 0; i < QUESTIONS.length; i++) {
      var q = QUESTIONS[i];
      if (query && questionText(q).indexOf(query) < 0) continue;
      var s = state.stats[q.id] || emptyStats();
      var rate = s.tries ? Math.round(s.correct / s.tries * 100) + '%' : '未回答';
      var last = s.tries ? (s.last ? '直近正解' : '直近不正解') : '未採点';
      var star = s.bookmarked ? '★ ' : '';
      html += '<button class="list-item" type="button" data-index="' + i + '">';
      html += '<b>' + star + 'No.' + q.no + ' ' + esc(q.prompt) + '</b>';
      html += '<small>' + esc(q.category) + ' / 回答 ' + (s.tries || 0) + '回 / 誤答 ' + (s.wrong || 0) + '回 / 正答率 ' + rate + ' / ' + last + '</small>';
      html += '</button>';
    }

    box.innerHTML = html || '<div class="panel">該当する問題がありません。</div>';

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
        for (var id in state.stats) state.stats[id] = normalizeStat(state.stats[id]);
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

    $('listSearchInput').addEventListener('input', renderQuestionList);

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
