
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

  var state = { set:'all', category:'all', mode:'all', typeFilter:'all', search:'', shuffle:false, order:[], index:0, stats:{}, mock:{active:false, finished:false, answers:{}, result:null, lastConfig:null} };


  var ANALYSIS_CATEGORIES = [
    {id:'law', label:'法・責任・倫理', short:'法・倫理'},
    {id:'pharm_med', label:'薬剤師法・医療法', short:'薬剤師法'},
    {id:'pmda_def', label:'薬機法：定義・薬局・販売', short:'薬機法1'},
    {id:'pmda_handle', label:'薬機法：取扱い・広告・製造', short:'薬機法2'},
    {id:'dev_safety', label:'開発・市販後・薬害', short:'開発・薬害'},
    {id:'controlled', label:'管理薬・毒劇', short:'管理薬'},
    {id:'social', label:'社会保障・医療経済・地域薬局', short:'社会保障'}
  ];

  function analysisCategory(q){
    var sid=q.setId||'', cat=String(q.category||''), setName=String(q.setName||''), src=String(q.source||''), text=(cat+' '+setName+' '+src+' '+String(q.prompt||'')).toLowerCase();

    var examMap = {
      'exam_01':'law',
      'exam_02':'pharm_med',
      'exam_03':'pmda_def',
      'exam_04':'pmda_handle',
      'exam_05':'dev_safety',
      'exam_06':'controlled',
      'exam_07':'social'
    };
    if(examMap[sid]) return examMap[sid];

    if(sid==='r8'){
      var pm=src.match(/p\.(\d+)/); var p=pm?Number(pm[1]):0;
      if(cat.indexOf('法規制度倫理')>=0 || (p>=2 && p<=8)) return 'law';
      if(cat.indexOf('薬剤師法')>=0 || (p>=19 && p<=24)) return 'pharm_med';
      if(cat.indexOf('医薬品医療機器等法')>=0 || (p>=9 && p<=18)) return 'pmda_def';
      if(p>=29 && p<=30) return 'pmda_handle';
      if(cat.indexOf('管理薬')>=0 || (p>=25 && p<=28)) return 'controlled';
      if(cat.indexOf('薬害')>=0 || cat.indexOf('医薬品等開発')>=0 || (p>=31 && p<=37) || (p>=51 && p<=72)) return 'dev_safety';
      if(cat.indexOf('社会保障')>=0 || (p>=38 && p<=50)) return 'social';
    }

    if(sid==='set1'){
      if(cat.indexOf('問1')>=0 || cat.indexOf('基礎')>=0) return 'law';
      if(cat.indexOf('問3')>=0 || cat.indexOf('問4')>=0 || cat.indexOf('薬剤師法')>=0 || cat.indexOf('医療法')>=0 || cat.indexOf('医師法')>=0) return 'pharm_med';
      if(cat.indexOf('問2')>=0 || cat.indexOf('薬機法')>=0) return 'pmda_def';
      if(cat.indexOf('問5')>=0 || cat.indexOf('問6')>=0 || cat.indexOf('管理薬')>=0 || cat.indexOf('毒物劇物')>=0) return 'controlled';
      if(cat.indexOf('問7')>=0 || cat.indexOf('問11')>=0 || cat.indexOf('薬害')>=0 || cat.indexOf('開発')>=0) return 'dev_safety';
      if(cat.indexOf('問8')>=0 || cat.indexOf('問9')>=0 || cat.indexOf('問10')>=0 || cat.indexOf('社会保障')>=0 || cat.indexOf('医療保険')>=0 || cat.indexOf('介護保険')>=0 || cat.indexOf('国民医療費')>=0) return 'social';
    }

    if(text.indexOf('薬剤師法')>=0 || text.indexOf('医療法')>=0 || text.indexOf('医師法')>=0 || text.indexOf('疑義照会')>=0 || text.indexOf('薬袋')>=0) return 'pharm_med';
    if(text.indexOf('麻薬')>=0 || text.indexOf('向精神')>=0 || text.indexOf('覚醒剤')>=0 || text.indexOf('大麻')>=0 || text.indexOf('あへん')>=0 || text.indexOf('毒物')>=0 || text.indexOf('劇物')>=0) return 'controlled';
    if(text.indexOf('治験')>=0 || text.indexOf('gcp')>=0 || text.indexOf('rmp')>=0 || text.indexOf('再審査')>=0 || text.indexOf('再評価')>=0 || text.indexOf('薬害')>=0 || text.indexOf('副作用')>=0 || text.indexOf('救済')>=0 || text.indexOf('開発')>=0) return 'dev_safety';
    if(text.indexOf('社会保障')>=0 || text.indexOf('医療保険')>=0 || text.indexOf('介護保険')>=0 || text.indexOf('調剤報酬')>=0 || text.indexOf('医療経済')>=0 || text.indexOf('地域薬局')>=0 || text.indexOf('国民医療費')>=0) return 'social';
    if(text.indexOf('広告')>=0 || text.indexOf('製造')>=0 || text.indexOf('承認')>=0 || text.indexOf('gmp')>=0 || text.indexOf('gvp')>=0 || text.indexOf('gqp')>=0) return 'pmda_handle';
    if(text.indexOf('薬機法')>=0 || text.indexOf('医薬品')>=0 || text.indexOf('薬局')>=0 || text.indexOf('販売')>=0 || text.indexOf('要指導')>=0 || text.indexOf('一般用')>=0) return 'pmda_def';
    return 'law';
  }

  function analysisFilteredQuestions(){
    return QUESTIONS.filter(function(q){
      return state.set==='all' || q.setId===state.set;
    });
  }


  function analysisTypeScope(){
    return $('analysisTypeScopeSelect') ? $('analysisTypeScopeSelect').value : 'all';
  }

  function analysisTypeScopeLabel(scope){
    var map={
      all:'全形式',
      select:'選択問題のみ',
      single:'単一選択のみ',
      multi:'複数選択のみ',
      text:'記述・空欄のみ',
      self:'自己採点カードのみ',
      figure:'図表つきのみ'
    };
    return map[scope] || '全形式';
  }

  function analysisScopeMatches(q){
    return typeMatches(q, analysisTypeScope());
  }

  function setShortName(s){
    var n=String(s.name||'');
    if(n.indexOf('既存')>=0) return '既存';
    if(n.indexOf('まとめ')>=0) return 'R8まとめ';
    var m=n.match(/第\s*([0-9,，\-ー]+)回/);
    if(m) return m[1].replace('，',',');
    return n.replace(/^R8\s*/,'').slice(0,8);
  }

  function calcGroupStats(groups){
    groups.forEach(function(g){
      g.answerRate=g.total?Math.round(g.done/g.total*100):0;
      g.accuracy=g.attempts?Math.round(g.correct/g.attempts*100):0;
    });
    return groups;
  }

  function analysisCategoryStats(){
    var base={};
    ANALYSIS_CATEGORIES.forEach(function(c){
      base[c.id]={id:c.id,label:c.label,short:c.short,total:0,done:0,attempts:0,correct:0,wrong:0,lastWrong:0,bookmarked:0,kind:'category'};
    });

    QUESTIONS.forEach(function(q){
      if(state.set!=='all' && q.setId!==state.set) return;
      if(!analysisScopeMatches(q)) return;
      var id=analysisCategory(q);
      if(!base[id]) return;
      var b=base[id], s=state.stats[q.id];
      b.total++;
      if(s){
        b.attempts+=s.tries||0;
        b.correct+=s.correct||0;
        b.wrong+=s.wrong||0;
        if(s.tries>0) b.done++;
        if(s.last===false) b.lastWrong++;
        if(s.bookmarked) b.bookmarked++;
      }
    });

    return calcGroupStats(ANALYSIS_CATEGORIES.map(function(c){return base[c.id];}));
  }

  function analysisSetStats(){
    var base={};
    SETS.forEach(function(s){
      base[s.id]={id:s.id,label:s.name,short:setShortName(s),total:0,done:0,attempts:0,correct:0,wrong:0,lastWrong:0,bookmarked:0,kind:'set'};
    });

    QUESTIONS.forEach(function(q){
      if(!analysisScopeMatches(q)) return;
      if(!base[q.setId]) return;
      var b=base[q.setId], s=state.stats[q.id];
      b.total++;
      if(s){
        b.attempts+=s.tries||0;
        b.correct+=s.correct||0;
        b.wrong+=s.wrong||0;
        if(s.tries>0) b.done++;
        if(s.last===false) b.lastWrong++;
        if(s.bookmarked) b.bookmarked++;
      }
    });

    return calcGroupStats(SETS.map(function(s){return base[s.id];}));
  }

  function analysisStats(){
    var mode=$('analysisModeSelect') ? $('analysisModeSelect').value : 'category';
    return mode==='set' ? analysisSetStats() : analysisCategoryStats();
  }

  function radarPoint(i, value, n, cx, cy, rmax){
    var angle=-Math.PI/2 + (Math.PI*2*i/n);
    var r=rmax*(Math.max(0, Math.min(100, value))/100);
    return {x:cx+Math.cos(angle)*r, y:cy+Math.sin(angle)*r, angle:angle};
  }

  function radarPolygon(stats, key, cx, cy, rmax){
    return stats.map(function(s,i){
      var p=radarPoint(i, s[key], stats.length, cx, cy, rmax);
      return p.x.toFixed(1)+','+p.y.toFixed(1);
    }).join(' ');
  }

  function renderAnalysisRadar(stats){
    var cx=180, cy=180, rmax=106, n=stats.length;
    var svg='';
    svg+='<svg class="radar-svg" viewBox="0 0 360 360" role="img" aria-label="カテゴリ別の回答率と正答率">';
    [20,40,60,80,100].forEach(function(v){
      var pts=[];
      for(var i=0;i<n;i++) pts.push(radarPoint(i,v,n,cx,cy,rmax).x.toFixed(1)+','+radarPoint(i,v,n,cx,cy,rmax).y.toFixed(1));
      svg+='<polygon class="radar-ring" points="'+pts.join(' ')+'"></polygon>';
      if(v===80) svg+='<polygon class="radar-target" points="'+pts.join(' ')+'"></polygon>';
    });

    for(var i=0;i<n;i++){
      var end=radarPoint(i,100,n,cx,cy,rmax);
      svg+='<line class="radar-axis" x1="'+cx+'" y1="'+cy+'" x2="'+end.x.toFixed(1)+'" y2="'+end.y.toFixed(1)+'"></line>';
      var lp=radarPoint(i,123,n,cx,cy,rmax);
      var anchor=lp.x<150?'end':(lp.x>210?'start':'middle');
      var label=stats[i].short;
      svg+='<text class="radar-label" x="'+lp.x.toFixed(1)+'" y="'+lp.y.toFixed(1)+'" text-anchor="'+anchor+'">'+esc(label)+'</text>';
    }

    svg+='<text class="radar-scale" x="180" y="'+(cy-rmax*0.8-3).toFixed(1)+'" text-anchor="middle">80%</text>';
    svg+='<text class="radar-scale" x="180" y="'+(cy-rmax-3).toFixed(1)+'" text-anchor="middle">100%</text>';

    svg+='<polygon class="radar-area answer" points="'+radarPolygon(stats,'answerRate',cx,cy,rmax)+'"></polygon>';
    svg+='<polygon class="radar-area accuracy" points="'+radarPolygon(stats,'accuracy',cx,cy,rmax)+'"></polygon>';

    stats.forEach(function(s,i){
      var p1=radarPoint(i,s.answerRate,n,cx,cy,rmax);
      var p2=radarPoint(i,s.accuracy,n,cx,cy,rmax);
      svg+='<circle class="radar-dot answer" cx="'+p1.x.toFixed(1)+'" cy="'+p1.y.toFixed(1)+'" r="3.2"></circle>';
      svg+='<circle class="radar-dot accuracy" cx="'+p2.x.toFixed(1)+'" cy="'+p2.y.toFixed(1)+'" r="3.2"></circle>';
    });

    svg+='</svg>';
    svg+='<div class="radar-legend"><span><i class="legend-answer"></i>回答率</span><span><i class="legend-accuracy"></i>正答率</span><span><i class="legend-target"></i>目標80%</span></div>';
    return svg;
  }

  function renderAnalysisDashboard(){
    if(!$('analysisRadar')) return;
    var mode=$('analysisModeSelect') ? $('analysisModeSelect').value : 'category';
    var scope=analysisTypeScope();
    var scopeLabel=analysisTypeScopeLabel(scope);
    var stats=analysisStats();
    var total=stats.reduce(function(a,b){return a+b.total;},0);
    var done=stats.reduce(function(a,b){return a+b.done;},0);
    var attempts=stats.reduce(function(a,b){return a+b.attempts;},0);
    var correct=stats.reduce(function(a,b){return a+b.correct;},0);
    var answerRate=total?Math.round(done/total*100):0;
    var accuracy=attempts?Math.round(correct/attempts*100):0;

    var setLabel=state.set==='all'?'全セット横断':(SETS.find(function(s){return s.id===state.set;})||{name:'選択セット'}).name;
    var modeLabel=mode==='set'?'問題セット別（全セット）':'カテゴリ別（'+setLabel+'）';
    $('analysisSummary').innerHTML='<div><b>'+esc(modeLabel)+'</b></div><div>対象 <b>'+esc(scopeLabel)+'</b></div><div>回答率 <b>'+answerRate+'%</b>（'+done+'/'+total+'問）</div><div>正答率 <b>'+accuracy+'%</b>（'+correct+'/'+attempts+'回）</div>';

    $('analysisRadar').innerHTML=renderAnalysisRadar(stats);

    var html='';
    stats.forEach(function(s){
      html+='<div class="analysis-card" data-analysis-card="'+esc(s.id)+'">';
      html+='<div class="analysis-card-head"><b>'+esc(s.label)+'</b><span>'+s.done+'/'+s.total+'問</span></div>';
      html+='<div class="mini-bars"><label>回答率 '+s.answerRate+'%</label><div><i style="width:'+s.answerRate+'%"></i></div><label>正答率 '+s.accuracy+'%</label><div><i class="accuracy" style="width:'+s.accuracy+'%"></i></div></div>';
      html+='<small>対象 '+esc(scopeLabel)+' / 回答 '+s.attempts+'回 / 誤答 '+s.wrong+'回 / 直近不正解 '+s.lastWrong+'問 / ブックマーク '+s.bookmarked+'問</small>';
      html+='<div class="analysis-actions">';
      html+='<button type="button" data-analysis-kind="'+esc(s.kind)+'" data-analysis-action="all" data-analysis-id="'+esc(s.id)+'">この範囲を解く</button>';
      html+='<button type="button" data-analysis-kind="'+esc(s.kind)+'" data-analysis-action="unseen" data-analysis-id="'+esc(s.id)+'">未回答</button>';
      html+='<button type="button" data-analysis-kind="'+esc(s.kind)+'" data-analysis-action="wrong" data-analysis-id="'+esc(s.id)+'">誤答復習</button>';
      html+='<button type="button" data-analysis-kind="'+esc(s.kind)+'" data-analysis-action="mock" data-analysis-id="'+esc(s.id)+'">テスト</button>';
      html+='</div></div>';
    });
    $('analysisCategoryCards').innerHTML=html||'<div class="panel">対象範囲に該当する問題がありません。</div>';

    $('analysisCategoryCards').querySelectorAll('[data-analysis-action]').forEach(function(btn){
      btn.addEventListener('click', function(){
        startAnalysisAction(this.getAttribute('data-analysis-id'), this.getAttribute('data-analysis-action'), this.getAttribute('data-analysis-kind'));
      });
    });
  }

  function indicesByAnalysisCategory(catId, mode, selectOnly){
    var arr=[];
    QUESTIONS.forEach(function(q,i){
      if(state.set!=='all' && q.setId!==state.set) return;
      if(analysisCategory(q)!==catId) return;
      if(!analysisScopeMatches(q)) return;
      if(selectOnly && !(q.type==='single'||q.type==='multi')) return;
      var s=state.stats[q.id];
      if(mode==='unseen' && s && s.tries>0) return;
      if(mode==='wrong' && !(s && s.wrong>0)) return;
      arr.push(i);
    });
    return arr;
  }


  function indicesByAnalysisSet(setId, mode, selectOnly){
    var arr=[];
    QUESTIONS.forEach(function(q,i){
      if(q.setId!==setId) return;
      if(!analysisScopeMatches(q)) return;
      if(selectOnly && !(q.type==='single'||q.type==='multi')) return;
      var s=state.stats[q.id];
      if(mode==='unseen' && s && s.tries>0) return;
      if(mode==='wrong' && !(s && s.wrong>0)) return;
      arr.push(i);
    });
    return arr;
  }

  function shuffleIndices(arr){
    arr=arr.slice();
    for(var j=arr.length-1;j>0;j--){ var k=Math.floor(Math.random()*(j+1)); var t=arr[j]; arr[j]=arr[k]; arr[k]=t; }
    return arr;
  }

  function startAnalysisAction(targetId, action, kind){
    kind=kind||'category';
    var order;
    if(action==='mock'){
      var scope=analysisTypeScope();
      if(scope==='text' || scope==='self'){
        alert('模擬テストは自動採点できる選択問題のみ対象です。グラフ対象を「全形式」「選択問題のみ」「単一選択のみ」「複数選択のみ」「図表つきのみ」に変更してください。');
        return;
      }
      order=shuffleIndices(kind==='set' ? indicesByAnalysisSet(targetId, 'all', true) : indicesByAnalysisCategory(targetId, 'all', true));
      if(!order.length){ alert('この範囲に選択問題がありません。'); return; }
      var countValue=$('mockCountSelect') ? $('mockCountSelect').value : '25';
      var count=countValue==='all'?order.length:Math.min(Number(countValue||25), order.length);
      state.order=order.slice(0,count);
      state.index=0;
      state.mock={active:true, finished:false, answers:{}, result:null, lastConfig:{analysisTarget:targetId, analysisKind:kind, analysisScope:scope, count:countValue}};
      showView('quizView'); renderQuestion(); window.scrollTo(0,0);
      return;
    }

    var mode=(action==='unseen'||action==='wrong')?action:'all';
    order=kind==='set' ? indicesByAnalysisSet(targetId, mode, false) : indicesByAnalysisCategory(targetId, mode, false);
    if(!order.length){
      alert(action==='unseen'?'この範囲に未回答問題はありません。':(action==='wrong'?'この範囲に誤答あり問題はありません。':'この範囲に問題がありません。'));
      return;
    }
    state.mock.active=false; state.mock.finished=false;
    state.order=order; state.index=0;
    showView('quizView'); renderQuestion(); window.scrollTo(0,0);
  }



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

  function statusMatches(q, s, mode){
    if(mode==='weak') return !!(s && s.wrong>0);
    if(mode==='lastWrong') return !!(s && s.last===false);
    if(mode==='unseen') return !(s && s.tries>0);
    if(mode==='bookmark') return !!(s && s.bookmarked);
    return true;
  }

  function typeMatches(q, typeFilter){
    if(typeFilter==='select') return q.type==='single' || q.type==='multi';
    if(typeFilter==='single') return q.type==='single';
    if(typeFilter==='multi') return q.type==='multi';
    if(typeFilter==='text') return q.type==='text';
    if(typeFilter==='self') return q.type==='self';
    if(typeFilter==='figure') return !!(q.figures && q.figures.length);
    return true;
  }

  function currentTypeFilter(){
    return $('typeFilterSelect') ? $('typeFilterSelect').value : (state.typeFilter || 'all');
  }

  function makeOrder(){
    var arr=[]; var query=String(state.search||'').toLowerCase();
    QUESTIONS.forEach(function(q,i){
      var s=state.stats[q.id]; var ok=true;
      if(state.set!=='all' && q.setId!==state.set) ok=false;
      if(state.category!=='all' && q.category!==state.category) ok=false;
      if(!statusMatches(q, s, state.mode)) ok=false;
      if(!typeMatches(q, state.typeFilter || 'all')) ok=false;
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
    renderSetStats(); renderCategoryStats(); renderAnalysisDashboard();
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
    state.set=$('setSelect').value;
    state.category=$('categorySelect').value;
    state.mode=$('modeSelect').value;
    state.typeFilter=currentTypeFilter();
    state.search=$('searchInput').value||'';
    state.shuffle=$('shuffleToggle').checked;
    state.index=0;
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
    var inMock=state.mock && state.mock.active && !state.mock.finished;

    if(!q){
      $('progressText').textContent='0 / 0';
      $('progressBar').style.width='0%';
      card.innerHTML='<p class="prompt">表示できる問題がありません。</p>';
      $('prevBtn').disabled=true;
      $('nextBtn').disabled=true;
      $('gradeBtn').disabled=true;
      return;
    }

    $('progressText').textContent=(state.index+1)+' / '+state.order.length;
    $('progressBar').style.width=((state.index+1)/state.order.length*100)+'%';
    card.className='question-card'+(inMock?' mock-active':'');

    var s=state.stats[q.id]||emptyStats();
    var rate=s.tries?Math.round(s.correct/s.tries*100)+'%':'未回答';
    var kind=q.type==='self'?'自己採点':(q.type==='text'?'記述・空欄':(q.type==='multi'?'複数選択':'単一選択'));

    var html='<div class="meta"><span class="pill">'+esc(q.setName)+'</span><span class="pill">'+esc(q.category)+'</span><span class="pill">'+kind+'</span>';
    if(inMock) html+='<span class="pill mock-pill">模擬テスト中</span>';
    html+='<span class="pill">回答'+s.tries+'回</span><span class="pill">誤答'+s.wrong+'回</span><span class="pill">正答率'+rate+'</span></div>';

    html+='<p class="prompt">'+esc(q.prompt)+'</p>';
    var displayCtx=displayContextForQuestion(q);
    if(displayCtx) html+='<div class="context-block">'+esc(displayCtx)+'</div>';

    if(q.figures&&q.figures.length){
      if(inMock) html+='<div class="mock-hidden-note">模擬テスト中はPDF原文画像を非表示にしています。結果画面・通常演習では確認できます。</div>';
      else html+=renderFigures(q.figures);
    }

    if(q.type==='text'){
      html+='<input id="textAnswer" type="text" autocomplete="off" placeholder="答えを入力">';
    } else if(q.type==='self'){
      html+='<textarea id="selfMemo" placeholder="自分の解答メモを入力してから「答えを見る」を押してください"></textarea>';
    } else {
      var inputType=q.type==='multi'?'checkbox':'radio';
      var saved=(inMock && state.mock.answers && state.mock.answers[q.id]) ? state.mock.answers[q.id] : [];
      html+='<div class="choices">';
      (q.choices||[]).forEach(function(c,i){
        var correct=(q.answer||[]).indexOf(i)>=0;
        var checked=(saved.indexOf(i)>=0)?' checked':'';
        html+='<div class="choice-row"><input id="choice'+i+'" name="answer" type="'+inputType+'" value="'+i+'"'+checked+'><label class="choice '+(correct?'correct':'wrong')+'" for="choice'+i+'"><span class="letter">'+LETTERS.charAt(i)+'</span><span>'+esc(c)+'</span></label></div>';
      });
      html+='</div>';
    }

    if(inMock){
      var savedNow=state.mock.answers && state.mock.answers[q.id] && state.mock.answers[q.id].length;
      html+='<div id="result" class="result '+(savedNow?'ok':'')+'">'+(savedNow?'回答を保存済みです。':'')+'</div>';
      html+='<div class="mock-note">模擬テスト中です。解答・解説は最後の結果画面で表示します。回答後は「次へ」、最後の問題では「結果へ」を押してください。</div>';
    } else {
      html+='<div id="result" class="result"></div><div class="actions-row"><button id="answerToggle" class="answer-toggle" type="button">'+(q.type==='self'?'答えを見る':'答え・解説を見る')+'</button><button id="bookmarkBtn" class="'+(s.bookmarked?'bookmark-on ':'')+'secondary-btn" type="button">'+(s.bookmarked?'★ ブックマーク中':'☆ ブックマーク')+'</button></div>'+answerPanelHtml(q);
    }

    card.innerHTML=html;

    if(inMock){
      $('gradeBtn').disabled=false;
      $('gradeBtn').textContent='回答を保存';
      $('prevBtn').disabled=state.index<=0;
      $('nextBtn').disabled=false;
      $('nextBtn').textContent=state.index>=state.order.length-1?'結果へ':'次 →';
      return;
    }

    $('nextBtn').textContent='次 →';
    if($('answerToggle')) $('answerToggle').addEventListener('click', function(){ document.querySelector('.answer-panel').classList.toggle('show'); });
    if($('bookmarkBtn')) $('bookmarkBtn').addEventListener('click', function(){ var st=getStat(q.id); st.bookmarked=!st.bookmarked; saveStats(); renderQuestion(); updateSummary(); });

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
    $('gradeBtn').disabled=false;
    $('prevBtn').disabled=state.index<=0;
    $('nextBtn').disabled=state.index>=state.order.length-1;
  }
  
  function selectedValues(){ return Array.from(document.querySelectorAll('.choice-row input:checked')).map(function(x){return Number(x.value);}).sort(function(a,b){return a-b;}); }
  function sameArray(a,b){ if(a.length!==b.length)return false; for(var i=0;i<a.length;i++) if(a[i]!==b[i]) return false; return true; }

  function shuffleArray(arr){
    for(var j=arr.length-1;j>0;j--){
      var k=Math.floor(Math.random()*(j+1));
      var t=arr[j]; arr[j]=arr[k]; arr[k]=t;
    }
    return arr;
  }

  function mockEligibleIndices(){
    var selectedSet=$('setSelect').value;
    var selectedCategory=$('categorySelect').value;
    var selectedMode=$('modeSelect').value;
    var selectedType=currentTypeFilter();
    var query=String($('searchInput').value||'').toLowerCase();
    var arr=[];

    QUESTIONS.forEach(function(q,i){
      var s=state.stats[q.id];
      if(!(q.type==='single'||q.type==='multi')) return;
      if(selectedSet!=='all' && q.setId!==selectedSet) return;
      if(selectedCategory!=='all' && q.category!==selectedCategory) return;
      if(query && questionText(q).indexOf(query)<0) return;
      if(!statusMatches(q, s, selectedMode)) return;
      if(selectedType==='text' || selectedType==='self') return;
      if(!typeMatches(q, selectedType)) return;
      arr.push(i);
    });

    var unseenFirst=$('mockUnseenFirstToggle') && $('mockUnseenFirstToggle').checked;
    if(unseenFirst){
      var unseen=[], seen=[];
      arr.forEach(function(i){
        var st=state.stats[QUESTIONS[i].id];
        if(!st || !st.tries) unseen.push(i); else seen.push(i);
      });
      arr=shuffleArray(unseen).concat(shuffleArray(seen));
    } else {
      arr=shuffleArray(arr);
    }
    return arr;
  }

  function startMockTest(){
    state.set=$('setSelect').value;
    state.category=$('categorySelect').value;
    state.mode=$('modeSelect').value;
    state.typeFilter=currentTypeFilter();
    state.search=$('searchInput').value||'';

    var arr=mockEligibleIndices();
    if(!arr.length){
      alert('この条件で出題できる選択問題がありません。出題状態や問題形式を変更してください。');
      return;
    }

    var countValue=$('mockCountSelect').value;
    var count=countValue==='all'?arr.length:Math.min(Number(countValue||10), arr.length);
    var selected=arr.slice(0,count);

    state.order=selected;
    state.index=0;
    state.mock={
      active:true,
      finished:false,
      answers:{},
      result:null,
      lastConfig:{
        set:state.set,
        category:state.category,
        mode:state.mode,
        typeFilter:state.typeFilter,
        search:state.search,
        count:countValue,
        unseenFirst:!!($('mockUnseenFirstToggle') && $('mockUnseenFirstToggle').checked)
      }
    };

    showView('quizView');
    renderQuestion();
    window.scrollTo(0,0);
  }

  function saveMockAnswerFromCurrent(showMessage){
    if(!(state.mock && state.mock.active && !state.mock.finished)) return false;
    var q=currentQuestion();
    if(!q) return false;
    var selected=selectedValues();
    state.mock.answers[q.id]=selected;
    if(showMessage){
      var res=$('result');
      if(res){
        res.className='result ok';
        res.textContent=selected.length?'回答を保存しました。':'未選択として保存しました。';
      }
    }
    return true;
  }

  function finishMockTest(){
    if(!(state.mock && state.mock.active && !state.mock.finished)) return;
    saveMockAnswerFromCurrent(false);

    var result={total:state.order.length, correct:0, wrong:0, skipped:0, items:[]};

    state.order.forEach(function(idx){
      var q=QUESTIONS[idx];
      var selected=(state.mock.answers[q.id]||[]).slice().sort(function(a,b){return a-b;});
      var correct=(q.answer||[]).slice().sort(function(a,b){return a-b;});
      var ok=sameArray(selected, correct);
      var skipped=!selected.length;
      if(ok) result.correct++;
      else result.wrong++;
      if(skipped) result.skipped++;

      var st=getStat(q.id);
      st.tries++;
      if(ok) st.correct++;
      else st.wrong++;
      st.last=ok;

      result.items.push({index:idx, id:q.id, ok:ok, skipped:skipped, selected:selected, correct:correct});
    });

    saveStats();
    state.mock.finished=true;
    state.mock.result=result;
    updateSummary();
    renderMockResult();
    showView('mockResultView');
    window.scrollTo(0,0);
  }

  function answerLettersFromArray(arr){
    return (arr||[]).map(function(i){return LETTERS.charAt(i);}).join('、') || '未選択';
  }

  function renderMockResult(){
    var r=state.mock && state.mock.result;
    if(!r) return;
    var percent=r.total?Math.round(r.correct/r.total*100):0;

    var html='<div class="mock-score '+(percent>=80?'good':(percent>=60?'mid':'low'))+'"><div><b>'+percent+'%</b><span>得点率</span></div><div><b>'+r.correct+' / '+r.total+'</b><span>正答数</span></div></div>';
    html+='<div class="mock-result-grid"><div>正解：<b>'+r.correct+'</b></div><div>不正解：<b>'+r.wrong+'</b></div><div>未回答：<b>'+r.skipped+'</b></div></div>';
    html+='<p class="hint-text">この結果は各問題の回答履歴にも反映しました。下の一覧から、間違えた問題と正答を確認できます。</p>';
    $('mockResultSummary').innerHTML=html;

    var list='';
    r.items.forEach(function(item,n){
      var q=QUESTIONS[item.index];
      var status=item.ok?'正解':'不正解';
      list+='<div class="mock-review-item '+(item.ok?'ok':'ng')+'">';
      list+='<div class="mock-review-head"><b>問'+(n+1)+'：'+esc(status)+'</b><span>'+esc(q.setName)+'</span></div>';
      list+='<p>'+esc(q.prompt)+'</p>';
      list+='<small>あなたの回答：'+esc(answerLettersFromArray(item.selected))+' / 正解：'+esc(answerLettersFromArray(item.correct))+'</small>';
      if(q.explain) list+='<details><summary>解説を見る</summary><div class="context-block">'+esc(q.explain)+'</div></details>';
      list+='</div>';
    });
    $('mockReviewList').innerHTML=list;
  }

  function retryMockWrong(){
    var r=state.mock && state.mock.result;
    if(!r) return;
    var wrong=r.items.filter(function(x){return !x.ok;}).map(function(x){return x.index;});
    if(!wrong.length){
      alert('不正解の問題はありません。');
      return;
    }
    state.mock.active=false;
    state.mock.finished=false;
    state.order=wrong;
    state.index=0;
    showView('quizView');
    renderQuestion();
    window.scrollTo(0,0);
  }

  function repeatMockTest(){
    var cfg=state.mock && state.mock.lastConfig;
    showView('homeView');
    if(cfg){
      $('setSelect').value=cfg.set || 'all';
      state.set=$('setSelect').value;
      setupCategorySelect();
      $('categorySelect').value=cfg.category || 'all';
      $('modeSelect').value=cfg.mode || 'all';
      if($('typeFilterSelect')) $('typeFilterSelect').value=cfg.typeFilter || 'all';
      $('searchInput').value=cfg.search || '';
      $('mockCountSelect').value=cfg.count || '10';
      if($('mockUnseenFirstToggle')) $('mockUnseenFirstToggle').checked=!!cfg.unseenFirst;
      updateSummary();
      startMockTest();
    }
  }


  function gradeSelf(ok){
    var q=currentQuestion(); if(!q) return;
    var st=getStat(q.id); st.tries++; if(ok) st.correct++; else st.wrong++; st.last=ok; saveStats(); updateSummary();
    renderQuestion(); document.querySelector('.answer-panel').classList.add('show');
    var res=$('result'); res.className='result '+(ok?'ok':'ng'); res.textContent=ok?'正解として記録しました。':'不正解として記録しました。';
  }
  function gradeCurrent(){
    if(state.mock && state.mock.active && !state.mock.finished){ saveMockAnswerFromCurrent(true); return; }
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
    state.set=$('setSelect').value;
    state.category=$('categorySelect').value;
    state.mode=$('modeSelect').value;
    state.typeFilter=currentTypeFilter();
    var box=$('questionList'), query=String($('listSearchInput').value||'').toLowerCase(), html='';
    QUESTIONS.forEach(function(q,i){
      var s=state.stats[q.id];
      if(state.set!=='all'&&q.setId!==state.set) return;
      if(state.category!=='all'&&q.category!==state.category) return;
      if(!statusMatches(q, s, state.mode)) return;
      if(!typeMatches(q, state.typeFilter||'all')) return;
      if(query&&questionText(q).indexOf(query)<0)return;
      var ss=s||emptyStats(); var rate=ss.tries?Math.round(ss.correct/ss.tries*100)+'%':'未回答';
      html+='<button class="list-item" type="button" data-index="'+i+'"><b>'+(ss.bookmarked?'★ ':'')+esc(q.setName)+' / No.'+(q.no||'')+' '+esc(q.prompt)+'</b><small>'+esc(q.category)+' / '+q.type+' / 回答 '+ss.tries+'回 / 誤答 '+ss.wrong+'回 / 正答率 '+rate+'</small></button>';
    });
    box.innerHTML=html||'<div class="panel">該当する問題がありません。</div>';
    box.querySelectorAll('.list-item').forEach(function(btn){ btn.addEventListener('click',function(){ state.mock.active=false; state.mock.finished=false; state.order=[Number(this.getAttribute('data-index'))]; state.index=0; showView('quizView'); renderQuestion(); }); });
  }
  function prevQuestion(){
    if(state.mock && state.mock.active && !state.mock.finished) saveMockAnswerFromCurrent(false);
    if(state.index>0){state.index--; renderQuestion(); window.scrollTo(0,0);}
  }
  function nextQuestion(){
    if(state.mock && state.mock.active && !state.mock.finished){
      saveMockAnswerFromCurrent(false);
      if(state.index>=state.order.length-1){ finishMockTest(); return; }
      state.index++; renderQuestion(); window.scrollTo(0,0); return;
    }
    if(state.index<state.order.length-1){state.index++; renderQuestion(); window.scrollTo(0,0);}
  }
  function resetHistory(){ if(!confirm('履歴を削除しますか？'))return; state.stats={}; saveStats(); updateSummary(); renderQuestion(); }
  function exportHistory(){ var blob=new Blob([JSON.stringify(state.stats,null,2)],{type:'application/json'}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url; a.download='social_pharmacy_autograded_history.json'; a.click(); URL.revokeObjectURL(url); }
  function importHistory(file){ if(!file)return; var reader=new FileReader(); reader.onload=function(){ try{ state.stats=JSON.parse(String(reader.result||'{}')); for(var id in state.stats) state.stats[id]=normalizeStat(state.stats[id]); saveStats(); updateSummary(); alert('履歴を読み込みました。'); }catch(e){ alert('読み込みに失敗しました。'); } }; reader.readAsText(file); }
  function bindEvents(){
    $('setSelect').addEventListener('change', function(){ state.set=this.value; setupCategorySelect(); updateSummary(); });
    $('categorySelect').addEventListener('change', function(){ state.category=this.value; });
    $('modeSelect').addEventListener('change', function(){ state.mode=this.value; });
    if($('typeFilterSelect')) $('typeFilterSelect').addEventListener('change', function(){ state.typeFilter=this.value; });
    if($('analysisModeSelect')) $('analysisModeSelect').addEventListener('change', renderAnalysisDashboard);
    $('searchInput').addEventListener('input', function(){ state.search=this.value||''; });
    $('startBtn').addEventListener('click', startQuiz);
    $('listBtn').addEventListener('click', function(){ state.mock.active=false; state.mock.finished=false; state.set=$('setSelect').value; renderQuestionList(); showView('listView'); });
    if($('mockStartBtn')) $('mockStartBtn').addEventListener('click', startMockTest);
    if($('mockHomeBtn')) $('mockHomeBtn').addEventListener('click', function(){ state.mock.active=false; state.mock.finished=false; updateSummary(); showView('homeView'); });
    if($('mockRetryWrongBtn')) $('mockRetryWrongBtn').addEventListener('click', retryMockWrong);
    if($('mockRepeatBtn')) $('mockRepeatBtn').addEventListener('click', repeatMockTest);
    $('backHomeBtn').addEventListener('click', function(){ state.mock.active=false; state.mock.finished=false; updateSummary(); showView('homeView'); });
    $('listHomeBtn').addEventListener('click', function(){ state.mock.active=false; state.mock.finished=false; updateSummary(); showView('homeView'); });
    $('prevBtn').addEventListener('click', prevQuestion); $('nextBtn').addEventListener('click', nextQuestion); $('gradeBtn').addEventListener('click', gradeCurrent);
    $('listSearchInput').addEventListener('input', renderQuestionList);
    $('settingsBtn').addEventListener('click', function(){ $('settingsDialog').showModal(); });
    $('resetHistoryBtn').addEventListener('click', resetHistory); $('exportBtn').addEventListener('click', exportHistory);
    $('importInput').addEventListener('change', function(){ importHistory(this.files&&this.files[0]); });
  }
  
  function cleanupOldServiceWorkers(){
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(regs){
          regs.forEach(function(reg){ reg.unregister(); });
        }).catch(function(){});
      }
      if (window.caches) {
        caches.keys().then(function(keys){
          keys.forEach(function(key){ caches.delete(key); });
        }).catch(function(){});
      }
    } catch(e) {}
  }

  function registerServiceWorker(){ cleanupOldServiceWorkers(); }
  function init(){ loadStats(); setupSetSelect(); setupCategorySelect(); bindEvents(); updateSummary(); registerServiceWorker(); }
  init();
})();
