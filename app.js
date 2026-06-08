
(function(){
  'use strict';

  var QUESTIONS = window.QUESTIONS || [];
  var SETS = window.SETS || [];
  var LETTERS = 'アイウエオカキクケコサシスセソ';
  var KEY = 'social_pharmacy_integrated_autograded_r8_v2';

  var ABBR = {
    'GLP':'Good Laboratory Practice（医薬品の安全性に関する非臨床試験の実施基準）',
    'GCP':'Good Clinical Practice（医薬品の臨床試験の実施基準）',
    'GMP':'Good Manufacturing Practice（医薬品等の製造管理及び品質管理の基準）',
    'GQP':'Good Quality Practice（医薬品等の品質管理の基準）',
    'GVP':'Good Vigilance Practice（医薬品等の製造販売後安全管理の基準）',
    'RMP':'Risk Management Plan（医薬品リスク管理計画）',
    'DPC':'Diagnosis Procedure Combination（診断群分類包括評価）',
    'ICER':'Incremental Cost-Effectiveness Ratio（増分費用効果比）',
    'QALY':'Quality Adjusted Life Year（質調整生存年）',
    'PMS':'Post-Marketing Surveillance（製造販売後調査）',
    'GPSP':'Good Post-Marketing Study Practice（医薬品の製造販売後の調査及び試験の実施基準）',
    'CRO':'Contract Research Organization（開発業務受託機関）',
    'CRA':'Clinical Research Associate（臨床開発モニター）',
    'SMO':'Site Management Organization（治験施設支援機関）',
    'CRC':'Clinical Research Coordinator（治験コーディネーター）',
    'IRB':'Institutional Review Board（治験審査委員会）',
    'ICH':'International Council for Harmonisation of Technical Requirements for Pharmaceuticals for Human Use（医薬品規制調和国際会議）',
    'CJD':'Creutzfeldt-Jakob Disease（クロイツフェルト・ヤコブ病）'
  };

  var state = { set:'all', category:'all', mode:'all', search:'', shuffle:false, order:[], index:0, stats:{} };

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function normalize(s){
    s=String(s||''); var out='';
    for(var i=0;i<s.length;i++){ var c=s.charCodeAt(i); out += (c>=0xFF01&&c<=0xFF5E) ? String.fromCharCode(c-0xFEE0) : s.charAt(i); }
    return out.replace(/[\s　]/g,'').replace(/＞/g,'>').replace(/＜/g,'<').replace(/・/g,'').replace(/,/g,'、').toLowerCase();
  }
  function emptyStats(){ return {tries:0, correct:0, wrong:0, last:null, bookmarked:false}; }
  function normalizeStat(s){
    var n=emptyStats(); if(!s) return n;
    n.tries=Number(s.tries||0); n.correct=Number(s.correct||0); n.wrong=Number(s.wrong!=null?s.wrong:Math.max(0,n.tries-n.correct));
    n.last=(s.last===true||s.last===false)?s.last:null; n.bookmarked=!!s.bookmarked; return n;
  }
  function loadStats(){ try{ state.stats=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ state.stats={}; } for(var id in state.stats) state.stats[id]=normalizeStat(state.stats[id]); }
  function saveStats(){ try{ localStorage.setItem(KEY, JSON.stringify(state.stats)); }catch(e){} }
  function getStat(id){ if(!state.stats[id]) state.stats[id]=emptyStats(); return state.stats[id]; }

  function setupSetSelect(){
    var sel=$('setSelect'); sel.innerHTML='<option value="all">全セット横断</option>';
    SETS.forEach(function(s){ var op=document.createElement('option'); op.value=s.id; op.textContent=s.name+'（'+s.count+'）'; sel.appendChild(op); });
  }
  function categories(){
    var res=['all'];
    QUESTIONS.forEach(function(q){ if((state.set==='all'||q.setId===state.set) && res.indexOf(q.category)<0) res.push(q.category); });
    return res;
  }
  function setupCategorySelect(){
    var sel=$('categorySelect'); var keep=sel.value||'all'; sel.innerHTML='';
    categories().forEach(function(c){ var op=document.createElement('option'); op.value=c; op.textContent=c==='all'?'全カテゴリ':c; sel.appendChild(op); });
    sel.value = Array.from(sel.options).some(function(o){return o.value===keep;}) ? keep : 'all';
  }
  function questionText(q){
    var parts=[q.setName,q.category,q.prompt,q.context||'',q.explain||'',q.source||''];
    if(q.choices) parts=parts.concat(q.choices);
    if(q.answers) parts=parts.concat(q.answers);
    if(q.choiceExplanations) parts=parts.concat(q.choiceExplanations);
    return parts.join(' ').toLowerCase();
  }
  function makeOrder(){
    var arr=[]; var query=String(state.search||'').toLowerCase();
    QUESTIONS.forEach(function(q,i){
      var s=state.stats[q.id]; var ok=true;
      if(state.set!=='all' && q.setId!==state.set) ok=false;
      if(state.category!=='all' && q.category!==state.category) ok=false;
      if(state.mode==='weak' && !(s && s.wrong>0)) ok=false;
      if(state.mode==='lastWrong' && !(s && s.last===false)) ok=false;
      if(state.mode==='unseen' && s && s.tries>0) ok=false;
      if(state.mode==='bookmark' && !(s && s.bookmarked)) ok=false;
      if(state.mode==='text' && q.type!=='text') ok=false;
      if(state.mode==='select' && !(q.type==='single'||q.type==='multi')) ok=false;
      if(state.mode==='self' && q.type!=='self') ok=false;
      if(state.mode==='figure' && !(q.figures && q.figures.length)) ok=false;
      if(query && questionText(q).indexOf(query)<0) ok=false;
      if(ok) arr.push(i);
    });
    if(state.mode==='weak') arr.sort(function(a,b){ return (state.stats[QUESTIONS[b].id]?.wrong||0)-(state.stats[QUESTIONS[a].id]?.wrong||0); });
    if(state.shuffle){ for(var j=arr.length-1;j>0;j--){ var k=Math.floor(Math.random()*(j+1)); var t=arr[j]; arr[j]=arr[k]; arr[k]=t; } }
    state.order=arr; if(state.index>=arr.length) state.index=Math.max(0,arr.length-1);
  }
  function currentQuestion(){ return state.order.length ? QUESTIONS[state.order[state.index]] : null; }
  function showView(name){ document.querySelectorAll('.view').forEach(function(v){v.classList.remove('active');}); $(name).classList.add('active'); }
  function totals(filterSet){
    var t={attempts:0,correct:0,wrong:0,weak:0,bookmarked:0,done:0,total:0};
    QUESTIONS.forEach(function(q){
      if(filterSet && filterSet!=='all' && q.setId!==filterSet) return;
      t.total++;
      var s=state.stats[q.id];
      if(s){ t.attempts+=s.tries||0; t.correct+=s.correct||0; t.wrong+=s.wrong||0; if(s.tries>0)t.done++; if(s.wrong>0)t.weak++; if(s.bookmarked)t.bookmarked++; }
    });
    return t;
  }
  function updateSummary(){
    var t=totals(state.set);
    $('totalCount').textContent=t.total; $('totalAttempts').textContent=t.attempts; $('totalWrong').textContent=t.wrong; $('totalRate').textContent=t.attempts?Math.round(t.correct/t.attempts*100)+'%':'0%';
    renderSetStats(); renderCategoryStats();
  }
  function renderSetStats(){
    var box=$('setStats'); var html='';
    SETS.forEach(function(s){
      var t=totals(s.id); var rate=t.attempts?Math.round(t.correct/t.attempts*100)+'%':'0%';
      html+='<div class="cat-row"><div class="cat-row-top"><span>'+esc(s.name)+'</span><span>'+t.done+'/'+t.total+'</span></div><small>回答 '+t.attempts+'回 / 誤答 '+t.wrong+'回 / 正答率 '+rate+'</small></div>';
    });
    box.innerHTML=html;
  }
  function renderCategoryStats(){
    var box=$('categoryStats'); var html='';
    categories().filter(function(c){return c!=='all';}).forEach(function(cat){
      var total=0, done=0, tries=0, correct=0, wrong=0;
      QUESTIONS.forEach(function(q){
        if((state.set!=='all'&&q.setId!==state.set)||q.category!==cat) return;
        total++; var s=state.stats[q.id]; if(s&&s.tries>0){done++; tries+=s.tries; correct+=s.correct; wrong+=s.wrong;}
      });
      var rate=tries?Math.round(correct/tries*100)+'%':'0%';
      html+='<div class="cat-row"><div class="cat-row-top"><span>'+esc(cat)+'</span><span>'+done+'/'+total+'</span></div><small>回答 '+tries+'回 / 誤答 '+wrong+'回 / 正答率 '+rate+'</small></div>';
    });
    box.innerHTML=html;
  }
  function startQuiz(){
    state.set=$('setSelect').value; state.category=$('categorySelect').value; state.mode=$('modeSelect').value; state.search=$('searchInput').value||''; state.shuffle=$('shuffleToggle').checked; state.index=0;
    makeOrder(); showView('quizView'); renderQuestion();
  }
  function renderFigures(figures){
    if(!figures||!figures.length) return '';
    var html='';
    figures.forEach(function(f){
      var content='<figure class="figure-block"><figcaption>'+esc(f.title||'図表')+'</figcaption><a href="'+esc(f.src)+'" target="_blank" rel="noopener"><img src="'+esc(f.src)+'" alt="'+esc(f.title||'図表')+'" loading="lazy"></a>'+(f.note?'<p class="figure-note">'+esc(f.note)+'</p>':'')+'</figure>';
      if(f.collapsed) html+='<details class="figure-details"><summary>'+esc(f.title||'PDF画像を表示')+'</summary>'+content+'</details>';
      else html+='<div class="figure-list">'+content+'</div>';
    });
    return html;
  }
  function glossaryItems(q){
    var text=questionText(q); var items=[];
    Object.keys(ABBR).forEach(function(k){ if(text.indexOf(k.toLowerCase())>=0) items.push('<li><b>'+esc(k)+'</b> = '+esc(ABBR[k])+'</li>'); });
    return items;
  }
  function answerPanelHtml(q){
    var html='<section class="answer-panel">';
    if(q.type==='self'){
      html+='<p><b>解答・解説：</b></p><div class="context-block">'+esc(q.explain||'解説はありません。')+'</div>';
      html+='<div class="self-grade"><button class="self-ok" type="button" id="selfOkBtn">自己採点：正解</button><button class="self-ng" type="button" id="selfNgBtn">自己採点：不正解</button></div>';
    } else if(q.type==='text'){
      html+='<p><b>正解：</b>'+esc((q.answers||[]).join('／'))+'</p><p>'+esc(q.explain||'')+'</p>';
    } else {
      var ans=(q.answer||[]).map(function(i){return LETTERS.charAt(i);});
      html+='<p><b>正解：</b>'+esc(ans.join('、'))+'</p><p>'+esc(q.explain||'')+'</p>';
      if(q.choices && q.choices.length){
        html+='<div class="option-title">選択肢ごとの解説</div>';
        (q.choices||[]).forEach(function(c,j){ var ok=(q.answer||[]).indexOf(j)>=0; html+='<div class="option-exp"><p><b>'+LETTERS.charAt(j)+'. '+esc(c)+'</b> '+(ok?'<span class="badge-ok">正しい</span>':'<span class="badge-ng">誤り</span>')+'</p><p>'+esc((q.choiceExplanations||[])[j]||'')+'</p></div>'; });
      }
    }
    var gl=glossaryItems(q); if(gl.length) html+='<div class="glossary"><b>略語のフルスペル</b><ul>'+gl.join('')+'</ul></div>';
    html+='</section>'; return html;
  }

  function stripChoiceLinesForDisplay(ctx) {
    ctx = String(ctx || '').replace(/\r/g, '');
    var lines = ctx.split('\n');
    var kept = [];
    for (var i = 0; i < lines.length; i++) {
      var s = lines[i].trim();
      if (!s) {
        if (kept.length && kept[kept.length - 1] !== '') kept.push('');
        continue;
      }
      if (/^[1-9][\s\.．、:：]+/.test(s)) break;
      if (/^[A-Ea-eＡ-Ｅａ-ｅ][\s\.．、:：]+/.test(s)) break;
      if (/^[・･●○◆◇]\s*/.test(s)) break;
      if (/(選択肢|選択肢群|以下の語句|次の用語|語群|当てはまる語句)/.test(s)) break;
      s = s.split(/\s+1\s+.+?\s+2\s+/)[0].trim();
      kept.push(s);
    }
    var stem = kept.join('\n').trim();
    return stem.length >= 12 ? stem : ctx;
  }

  function displayContextForQuestion(q) {
    var ctx = q && q.context ? String(q.context) : '';
    if (q && String(q.setId || '').indexOf('exam_') === 0 && (q.type === 'single' || q.type === 'multi' || q.type === 'text')) {
      return stripChoiceLinesForDisplay(ctx);
    }
    return ctx;
  }

  function renderQuestion(){
    var q=currentQuestion(); var card=$('questionCard');
    if(!q){ $('progressText').textContent='0 / 0'; $('progressBar').style.width='0%'; card.innerHTML='<p class="prompt">表示できる問題がありません。</p>'; $('prevBtn').disabled=true; $('nextBtn').disabled=true; return; }
    $('progressText').textContent=(state.index+1)+' / '+state.order.length; $('progressBar').style.width=((state.index+1)/state.order.length*100)+'%';
    card.className='question-card'; var s=state.stats[q.id]||emptyStats(); var rate=s.tries?Math.round(s.correct/s.tries*100)+'%':'未回答';
    var kind=q.type==='self'?'自己採点':(q.type==='text'?'記述・空欄':(q.type==='multi'?'複数選択':'単一選択'));
    var html='<div class="meta"><span class="pill">'+esc(q.setName)+'</span><span class="pill">'+esc(q.category)+'</span><span class="pill">'+kind+'</span><span class="pill">回答'+s.tries+'回</span><span class="pill">誤答'+s.wrong+'回</span><span class="pill">正答率'+rate+'</span></div>';
    html+='<p class="prompt">'+esc(q.prompt)+'</p>';
    var displayCtx=displayContextForQuestion(q); if(displayCtx) html+='<div class="context-block">'+esc(displayCtx)+'</div>';
    if(q.figures&&q.figures.length) html+=renderFigures(q.figures);

    if(q.type==='text') html+='<input id="textAnswer" type="text" autocomplete="off" placeholder="答えを入力">';
    else if(q.type==='self') html+='<textarea id="selfMemo" placeholder="自分の解答メモを入力してから「答えを見る」を押してください"></textarea>';
    else {
      var inputType=q.type==='multi'?'checkbox':'radio'; html+='<div class="choices">';
      (q.choices||[]).forEach(function(c,i){ var correct=(q.answer||[]).indexOf(i)>=0; html+='<div class="choice-row"><input id="choice'+i+'" name="answer" type="'+inputType+'" value="'+i+'"><label class="choice '+(correct?'correct':'wrong')+'" for="choice'+i+'"><span class="letter">'+LETTERS.charAt(i)+'</span><span>'+esc(c)+'</span></label></div>'; });
      html+='</div>';
    }
    html+='<div id="result" class="result"></div><div class="actions-row"><button id="answerToggle" class="answer-toggle" type="button">'+(q.type==='self'?'答えを見る':'答え・解説を見る')+'</button><button id="bookmarkBtn" class="'+(s.bookmarked?'bookmark-on ':'')+'secondary-btn" type="button">'+(s.bookmarked?'★ ブックマーク中':'☆ ブックマーク')+'</button></div>'+answerPanelHtml(q);
    card.innerHTML=html;

    $('answerToggle').addEventListener('click', function(){ document.querySelector('.answer-panel').classList.toggle('show'); });
    $('bookmarkBtn').addEventListener('click', function(){ var st=getStat(q.id); st.bookmarked=!st.bookmarked; saveStats(); renderQuestion(); updateSummary(); });
    if(q.type==='self'){
      $('gradeBtn').textContent='答えを見る';
      setTimeout(function(){
        var ok=$('selfOkBtn'), ng=$('selfNgBtn');
        if(ok) ok.addEventListener('click', function(){ gradeSelf(true); });
        if(ng) ng.addEventListener('click', function(){ gradeSelf(false); });
      },0);
    } else {
      $('gradeBtn').textContent='採点';
    }
    $('prevBtn').disabled=state.index<=0; $('nextBtn').disabled=state.index>=state.order.length-1;
  }
  function selectedValues(){ return Array.from(document.querySelectorAll('.choice-row input:checked')).map(function(x){return Number(x.value);}).sort(function(a,b){return a-b;}); }
  function sameArray(a,b){ if(a.length!==b.length)return false; for(var i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; }
  function gradeSelf(ok){
    var q=currentQuestion(); if(!q) return;
    var st=getStat(q.id); st.tries++; if(ok) st.correct++; else st.wrong++; st.last=ok; saveStats(); updateSummary();
    renderQuestion(); document.querySelector('.answer-panel').classList.add('show');
    var res=$('result'); res.className='result '+(ok?'ok':'ng'); res.textContent=ok?'正解として記録しました。':'不正解として記録しました。';
  }
  function gradeCurrent(){
    var q=currentQuestion(); if(!q)return;
    if(q.type==='self'){ document.querySelector('.answer-panel').classList.add('show'); return; }
    var ok=false, result=$('result');
    if(q.type==='text'){
      var value=normalize($('textAnswer').value); (q.answers||[]).forEach(function(a){ if(normalize(a)===value) ok=true; });
      result.className='result '+(ok?'ok':'ng'); result.textContent=ok?'正解です。':'不正解です。答え・解説を確認してください。';
    } else {
      var selected=selectedValues(); if(!selected.length){ result.className='result ng'; result.textContent='選択肢を選んでください。'; return; }
      ok=sameArray(selected,(q.answer||[]).slice().sort(function(a,b){return a-b;})); $('questionCard').classList.add('graded');
      result.className='result '+(ok?'ok':'ng'); result.textContent=ok?'正解です。':'不正解です。緑が正解、赤が選んだ誤答です。';
    }
    var st=getStat(q.id); st.tries++; if(ok)st.correct++; else st.wrong++; st.last=ok; saveStats(); updateSummary();
    document.querySelector('.answer-panel').classList.add('show');
    renderQuestion();
    var res=$('result'); if(res){ res.className='result '+(ok?'ok':'ng'); res.textContent=ok?'正解です。':'不正解です。答え・解説を確認してください。'; }
    var p=document.querySelector('.answer-panel'); if(p)p.classList.add('show'); if(q.type!=='text') $('questionCard').classList.add('graded');
  }
  function renderQuestionList(){
    var box=$('questionList'), query=String($('listSearchInput').value||'').toLowerCase(), html='';
    QUESTIONS.forEach(function(q,i){
      if(state.set!=='all'&&q.setId!==state.set) return;
      if(query&&questionText(q).indexOf(query)<0)return;
      var s=state.stats[q.id]||emptyStats(); var rate=s.tries?Math.round(s.correct/s.tries*100)+'%':'未回答';
      html+='<button class="list-item" type="button" data-index="'+i+'"><b>'+(s.bookmarked?'★ ':'')+esc(q.setName)+' / No.'+(q.no||'')+' '+esc(q.prompt)+'</b><small>'+esc(q.category)+' / 回答 '+s.tries+'回 / 誤答 '+s.wrong+'回 / 正答率 '+rate+'</small></button>';
    });
    box.innerHTML=html||'<div class="panel">該当する問題がありません。</div>';
    box.querySelectorAll('.list-item').forEach(function(btn){ btn.addEventListener('click',function(){ state.order=[Number(this.getAttribute('data-index'))]; state.index=0; showView('quizView'); renderQuestion(); }); });
  }
  function prevQuestion(){ if(state.index>0){state.index--; renderQuestion(); window.scrollTo(0,0);} }
  function nextQuestion(){ if(state.index<state.order.length-1){state.index++; renderQuestion(); window.scrollTo(0,0);} }
  function resetHistory(){ if(!confirm('履歴を削除しますか？'))return; state.stats={}; saveStats(); updateSummary(); renderQuestion(); }
  function exportHistory(){ var blob=new Blob([JSON.stringify(state.stats,null,2)],{type:'application/json'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='social_pharmacy_autograded_history.json'; a.click(); URL.revokeObjectURL(url); }
  function importHistory(file){ if(!file)return; var reader=new FileReader(); reader.onload=function(){ try{ state.stats=JSON.parse(String(reader.result||'{}')); for(var id in state.stats) state.stats[id]=normalizeStat(state.stats[id]); saveStats(); updateSummary(); alert('履歴を読み込みました。'); }catch(e){ alert('読み込みに失敗しました。'); } }; reader.readAsText(file); }
  function bindEvents(){
    $('setSelect').addEventListener('change', function(){ state.set=this.value; setupCategorySelect(); updateSummary(); });
    $('startBtn').addEventListener('click', startQuiz);
    $('listBtn').addEventListener('click', function(){ state.set=$('setSelect').value; renderQuestionList(); showView('listView'); });
    $('backHomeBtn').addEventListener('click', function(){ updateSummary(); showView('homeView'); });
    $('listHomeBtn').addEventListener('click', function(){ updateSummary(); showView('homeView'); });
    $('prevBtn').addEventListener('click', prevQuestion); $('nextBtn').addEventListener('click', nextQuestion); $('gradeBtn').addEventListener('click', gradeCurrent);
    $('listSearchInput').addEventListener('input', renderQuestionList);
    $('settingsBtn').addEventListener('click', function(){ $('settingsDialog').showModal(); });
    $('resetHistoryBtn').addEventListener('click', resetHistory); $('exportBtn').addEventListener('click', exportHistory);
    $('importInput').addEventListener('change', function(){ importHistory(this.files&&this.files[0]); });
  }
  function registerServiceWorker(){ if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(function(){}); }
  function init(){ loadStats(); setupSetSelect(); setupCategorySelect(); bindEvents(); updateSummary(); registerServiceWorker(); }
  init();
})();
