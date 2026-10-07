/* 戦力推移ボード 表示プログラム。データは data.js（変換ツールが作る）から読みます。 */
(function(){
'use strict';
var SITE_NAME='戦力推移ボード';   // サイト名を変えるときはここを書き換える
var D=window.BOARD_DATA||{months:[],players:[],updated:''};
var app=document.getElementById('app');
var page=document.body.getAttribute('data-page');

function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function find(id){for(var i=0;i<D.players.length;i++){if(D.players[i].id===id)return D.players[i];}return null;}
function param(k){var m=new RegExp('[?&]'+k+'=([^&#]*)').exec(location.search);return m?decodeURIComponent(m[1].replace(/\+/g,' ')):null;}
function mLabel(m){return m.slice(2,4)+'/'+m.slice(5,7);}
function val(p,m,i){var a=p.power&&p.power[m];var v=a?a[i]:null;return (typeof v==='number'&&isFinite(v))?v:null;}
function prevVal(p,m,i){var k=D.months.indexOf(m);for(var j=k-1;j>=0;j--){var v=val(p,D.months[j],i);if(v!==null)return v;}return null;}
function fmt(n){return n.toLocaleString('ja-JP');}
function delta(cur,prev){
  if(cur===null||prev===null)return '';
  var d=cur-prev;
  if(d>0)return '<span class="d up">+'+fmt(d)+'</span>';
  if(d<0)return '<span class="d down">−'+fmt(-d)+'</span>';
  return '<span class="d">±0</span>';
}
function armyClass(t){t=String(t||'');return t.indexOf('陸')>=0?'ar':t.indexOf('海')>=0?'nv':t.indexOf('空')>=0?'af':'';}
function chip(t){return t?'<span class="chip '+armyClass(t)+'">'+esc(t)+'</span>':'<span class="chip">未設定</span>';}
function icon(p,big){
  var c='ico'+(big?' big':''),ini=esc((p.name||'?').slice(0,1));
  if(p.icon)return '<img class="'+c+'" src="icons/'+encodeURIComponent(p.icon)+'" alt="" data-ini="'+ini+'">';
  return '<span class="'+c+'" aria-hidden="true">'+ini+'</span>';
}
function link(p){return 'player.html?id='+encodeURIComponent(p.id);}
function who(p){return '<a class="who" href="'+link(p)+'">'+icon(p)+'<span>'+esc(p.name||'名前なし')+'</span></a>';}
function latestMonth(){
  for(var k=D.months.length-1;k>=0;k--){for(var i=0;i<D.players.length;i++){if(val(D.players[i],D.months[k],0)!==null)return D.months[k];}}
  return D.months[D.months.length-1]||null;
}
function ranking(m){
  var rows=[];
  D.players.forEach(function(p){var v=val(p,m,0);if(v!==null)rows.push({p:p,v:v});});
  rows.sort(function(a,b){return b.v-a.v;});
  rows.forEach(function(r,i){r.pos=(i>0&&rows[i-1].v===r.v)?rows[i-1].pos:i+1;});
  return rows;
}
function posOf(rows,id){for(var i=0;i<rows.length;i++){if(rows[i].p.id===id)return rows[i].pos;}return null;}
function kindOf(t){return /売買|所有者/.test(t)?'所有者変更':/移転/.test(t)?'サーバー移転':/改名/.test(t)?'改名':'その他';}

function header(cur){
  return '<header class="top"><a class="brand" href="index.html"><i>戦</i><b>'+esc(SITE_NAME)+'</b></a>'
   +'<nav class="tabs" aria-label="ページ"><a href="index.html"'+(cur==='index'?' aria-current="page"':'')+'>戦力推移</a>'
   +'<a href="ranking.html"'+(cur==='ranking'?' aria-current="page"':'')+'>1軍ランキング</a></nav></header>';
}
function footer(){return '<footer>'+(D.updated?'最終更新 '+esc(D.updated):'')+'</footer>';}
function powerTable(players,solo){
  var ms=D.months;
  var h='<div class="scroll"><table class="grid'+(solo?' solo':'')+'"><thead><tr>'+(solo?'':'<th class="c-name">プレイヤー</th>')+'<th class="c-army">軍</th>';
  ms.forEach(function(m){h+='<th>'+mLabel(m)+'</th>';});
  h+='<th class="fill"></th></tr></thead><tbody>';
  players.forEach(function(p){
    for(var i=0;i<3;i++){
      h+='<tr'+(i===0?' class="first"':'')+'>';
      if(i===0&&!solo)h+='<th class="c-name" rowspan="3">'+who(p)+'</th>';
      h+='<th class="c-army"><span class="slot">'+(i+1)+'軍</span>'+chip(p.armies[i])+'</th>';
      ms.forEach(function(m){var v=val(p,m,i);h+='<td>'+(v===null?'':'<span class="num">'+fmt(v)+'</span>'+delta(v,prevVal(p,m,i)))+'</td>';});
      h+='<td class="fill"></td></tr>';
    }
  });
  return h+'</tbody></table></div>';
}

function pageIndex(){
  var sort=param('sort')==='first'?'first':'reg',ps=D.players.slice();
  if(sort==='first'){var m=latestMonth();ps.sort(function(a,b){return (val(b,m,0)||0)-(val(a,m,0)||0);});}
  var h=header('index')+'<div class="bar"><h1>各軍の戦力と前月からの増減</h1><label for="sort">並び順<select id="sort"><option value="reg"'+(sort==='reg'?' selected':'')+'>登録順</option><option value="first"'+(sort==='first'?' selected':'')+'>1軍が強い順</option></select></label></div>';
  h+=ps.length?powerTable(ps,false)+'<p class="lead">名前を押すと、アイコン・サーバー・履歴などの詳しいデータを開きます。数字の下の小さな値は前の月からの増減です。</p>':'<div class="empty">まだデータがありません。</div>';
  app.innerHTML=h+footer();
  var s=document.getElementById('sort');if(s)s.addEventListener('change',function(){location.href='index.html'+(s.value==='first'?'?sort=first':'');});
}
function fact(label,v){return '<div><dt>'+label+'</dt><dd'+(v?'':' class="none"')+'>'+(v?esc(v):'未設定')+'</dd></div>';}
function pagePlayer(){
  var p=find(param('id'));
  if(!p){app.innerHTML=header('')+'<div class="empty">このプレイヤーは見つかりませんでした。<a href="index.html">戦力推移にもどる</a></div>'+footer();return;}
  document.title=(p.name||'名前なし')+' | '+SITE_NAME;
  var m=latestMonth(),rows=m?ranking(m):[],pos=posOf(rows,p.id);
  var h=header('')+'<a class="back" href="index.html">← 戦力推移にもどる</a><section class="profile"><div>'+icon(p,true)+'</div><div class="body"><h1>'+esc(p.name||'名前なし')+'</h1><dl class="facts">'
    +fact('配信元',p.platform)+fact('国籍',p.nation)+fact('サーバー',p.server)+fact('所有者',p.owner)
    +'<div><dt>1軍ランキング（'+(m?mLabel(m):'—')+'）</dt><dd'+(pos?'':' class="none"')+'>'+(pos?'<a href="ranking.html">'+pos+'位 / '+rows.length+'人</a>':'記録なし')+'</dd></div></dl></div></section>';
  h+='<section class="sec"><h2>各軍の戦力</h2>'+powerTable([p],true)+'</section>';
  h+='<section class="sec"><h2>備考</h2>'+(p.note?'<p class="note">'+esc(p.note)+'</p>':'<p class="lead">備考はありません。</p>')+'</section>';
  h+='<section class="sec"><h2>履歴（サーバー移転・改名・所有者変更）</h2>';
  var ev=(p.events||[]).slice().reverse();
  if(ev.length){
    h+='<ul class="events">';
    ev.forEach(function(e){var k=kindOf(e.text);h+='<li><time>'+esc(e.month?mLabel(e.month):'')+'</time><span class="chip'+(k==='所有者変更'?' k-own':'')+'">'+k+'</span><span class="txt">'+esc(e.text)+'</span></li>';});
    h+='</ul>';
  }else{h+='<p class="lead">記録された履歴はありません。</p>';}
  app.innerHTML=h+'</section>'+footer();
}
function pageRanking(){
  var ms=D.months.filter(function(m){return ranking(m).length>0;}),q=param('m');
  var m=(q&&ms.indexOf(q)>=0)?q:ms[ms.length-1];
  var h=header('ranking')+'<div class="bar"><h1>1軍の戦力ランキング</h1>';
  if(!m){app.innerHTML=h+'</div><div class="empty">1軍の戦力がまだ入力されていません。</div>'+footer();return;}
  h+='<label for="rmonth">対象月<select id="rmonth">'+ms.map(function(x){return '<option value="'+x+'"'+(x===m?' selected':'')+'>'+mLabel(x)+'</option>';}).join('')+'</select></label></div>';
  var rows=ranking(m),k=D.months.indexOf(m),pm=k>0?D.months[k-1]:null,prev=pm?ranking(pm):[],max=rows[0].v||1;
  h+='<div class="scroll"><table class="rank"><thead><tr><th>順位</th><th>プレイヤー</th><th>1軍の種類</th><th class="wide"></th><th class="r">戦力</th></tr></thead><tbody>';
  rows.forEach(function(r){
    var pp=posOf(prev,r.p.id),mv='';
    if(pm){if(pp===null)mv='<span class="mv">初</span>';else if(pp>r.pos)mv='<span class="mv up">▲'+(pp-r.pos)+'</span>';else if(pp<r.pos)mv='<span class="mv down">▼'+(r.pos-pp)+'</span>';else mv='<span class="mv">—</span>';}
    h+='<tr'+(r.pos<=3?' class="top3"':'')+'><td><span class="pos">'+r.pos+'</span>'+mv+'</td><td>'+who(r.p)+'</td><td>'+chip(r.p.armies[0])+'</td><td class="wide"><div class="meter"><i style="width:'+Math.max(2,Math.round(r.v/max*100))+'%"></i></div></td><td class="r"><span class="num">'+fmt(r.v)+'</span>'+delta(r.v,prevVal(r.p,m,0))+'</td></tr>';
  });
  h+='</tbody></table></div><p class="lead">'+mLabel(m)+' 時点で1軍の戦力が入力されている '+rows.length+' 人の順位です。▲▼は前の月からの順位の変動です。</p>';
  app.innerHTML=h+footer();
  var s=document.getElementById('rmonth');s.addEventListener('change',function(){location.href='ranking.html?m='+encodeURIComponent(s.value);});
}

if(page==='player')pagePlayer();else if(page==='ranking')pageRanking();else pageIndex();
/* アイコン画像が見つからないときは頭文字の表示に切り替える */
Array.prototype.forEach.call(app.querySelectorAll('img.ico'),function(img){
  function fb(){var s=document.createElement('span');s.className=img.className;s.textContent=img.getAttribute('data-ini');img.replaceWith(s);}
  if(img.complete&&!img.naturalWidth)fb();else img.addEventListener('error',fb);
});
})();
