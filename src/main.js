(function(){
"use strict";
// ---------- Music data ----------
var QUAL = {
  maj:{iv:[0,4,7],lb:['R','3','5'],sym:''},
  min:{iv:[0,3,7],lb:['R','♭3','5'],sym:'m'},
  dim:{iv:[0,3,6],lb:['R','♭3','♭5'],sym:'°'},
  maj7:{iv:[0,4,7,11],lb:['R','3','5','7'],sym:'maj7'},
  '7':{iv:[0,4,7,10],lb:['R','3','5','♭7'],sym:'7'},
  m7:{iv:[0,3,7,10],lb:['R','♭3','5','♭7'],sym:'m7'},
  m7b5:{iv:[0,3,6,10],lb:['R','♭3','♭5','♭7'],sym:'m7♭5'}
};
var TRI = {maj7:'maj','7':'maj',m7:'min',m7b5:'dim'};
var ROLE = ['root','third','fifth','seventh'];
var F = '♭';
// [roman, semitones above key, quality (7th form), beats]
var PROGS = [
  {id:'blues', name:'12-bar blues', mode:'major', slots:[['I',0,'7',4],['IV',5,'7',4],['I',0,'7',4],['I',0,'7',4],['IV',5,'7',4],['IV',5,'7',4],['I',0,'7',4],['I',0,'7',4],['V',7,'7',4],['IV',5,'7',4],['I',0,'7',4],['V',7,'7',4]]},
  {id:'mblues', name:'Minor blues', mode:'minor', slots:[['i',0,'m7',4],['iv',5,'m7',4],['i',0,'m7',4],['i',0,'m7',4],['iv',5,'m7',4],['iv',5,'m7',4],['i',0,'m7',4],['i',0,'m7',4],[F+'VI',8,'7',4],['V',7,'7',4],['i',0,'m7',4],['V',7,'7',4]]},
  {id:'251', name:'ii–V–I (major)', mode:'major', slots:[['ii',2,'m7',4],['V',7,'7',4],['I',0,'maj7',8]]},
  {id:'m251', name:'ii–V–i (minor)', mode:'minor', slots:[['ii',2,'m7b5',4],['V',7,'7',4],['i',0,'m7',8]]},
  {id:'1645', name:'I–vi–IV–V', mode:'major', slots:[['I',0,'maj7',4],['vi',9,'m7',4],['IV',5,'maj7',4],['V',7,'7',4]]},
  {id:'1564', name:'I–V–vi–IV', mode:'major', slots:[['I',0,'maj7',4],['V',7,'7',4],['vi',9,'m7',4],['IV',5,'maj7',4]]},
  {id:'turn', name:'I–vi–ii–V turnaround (2 beats each)', mode:'major', slots:[['I',0,'maj7',2],['vi',9,'m7',2],['ii',2,'m7',2],['V',7,'7',2]]},
  {id:'andal', name:'i–'+F+'VII–'+F+'VI–V (minor descent)', mode:'minor', slots:[['i',0,'m7',4],[F+'VII',10,'7',4],[F+'VI',8,'maj7',4],['V',7,'7',4]]}
];
var SHARP=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
var FLAT =['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
var KEY_MAJ=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
var KEY_MIN=['C','C♯','D','E♭','E','F','F♯','G','G♯','A','B♭','B'];
var OPEN=[64,59,55,50,45,40]; // high E (top) to low E (bottom)
var NF=15;

// ---------- State ----------
var S = {prog:'blues', key:9, type:'7', win:4, bpm:70, countIn:true, click:true, voice:'epiano', lead:0.5, labels:'int'};
try{var saved=JSON.parse(localStorage.getItem('utg-ctt')||'null'); if(saved) for(var k in S) if(k in saved) S[k]=saved[k];}catch(e){}
function save(){try{localStorage.setItem('utg-ctt',JSON.stringify(S));}catch(e){}}

function prog(){for(var i=0;i<PROGS.length;i++) if(PROGS[i].id===S.prog) return PROGS[i]; return PROGS[0];}
function flats(){var p=prog(); return p.mode==='minor' ? [0,2,3,5,7,10].indexOf(S.key)>=0 : [1,3,5,8,10].indexOf(S.key)>=0;}
function spell(pc){return (flats()?FLAT:SHARP)[((pc%12)+12)%12];}
function slots(){return prog().slots;}
function chordOf(i){
  var s=slots()[i], q=S.type==='7'?s[2]:TRI[s[2]], Q=QUAL[q], root=(S.key+s[1])%12;
  var rn=s[0];
  if(q==='dim') rn+='°'; else if(q==='7') rn+='7'; else if(q==='maj7') rn+='maj7'; else if(q==='m7') rn+='m7'; else if(q==='m7b5') rn+='ø7';
  var pcs=Q.iv.map(function(v){return (root+v)%12;});
  return {root:root, q:q, iv:Q.iv, lb:Q.lb, pcs:pcs, sym:spell(root)+Q.sym, rn:rn, beats:s[3]};
}
function totalBeats(){return slots().reduce(function(a,s){return a+s[3];},0);}
function beatInfo(b){
  var sl=slots(), acc=0;
  for(var i=0;i<sl.length;i++){ if(b<acc+sl[i][3]) return {slot:i, inChord:b-acc, beats:sl[i][3]}; acc+=sl[i][3]; }
  return {slot:0,inChord:0,beats:sl[0][3]};
}

// ---------- Fretboard ----------
var svg=document.getElementById('board'), NS='http://www.w3.org/2000/svg';
var X0=50, XE=988;
function fretX(n){return X0+(XE-X0)*(1-Math.pow(2,-n/12))/(1-Math.pow(2,-NF/12));}
function dotX(f){return f===0?25:(fretX(f-1)+fretX(f))/2;}
function yS(i){return 26+i*32;}
function el(tag,attrs,parent){var e=document.createElementNS(NS,tag); for(var a in attrs) e.setAttribute(a,attrs[a]); if(parent) parent.appendChild(e); return e;}
(function drawBoard(){
  el('rect',{x:X0,y:14,width:XE-X0,height:184,fill:'var(--board)'},svg);
  el('rect',{id:'winRect',x:0,y:8,width:0,height:196,fill:'var(--win)',rx:4},svg);
  [3,5,7,9,15].forEach(function(f){el('circle',{cx:dotX(f),cy:106,r:5,fill:'var(--fret)'},svg);});
  el('circle',{cx:dotX(12),cy:74,r:5,fill:'var(--fret)'},svg); el('circle',{cx:dotX(12),cy:138,r:5,fill:'var(--fret)'},svg);
  for(var f=1;f<=NF;f++) el('line',{x1:fretX(f),x2:fretX(f),y1:14,y2:198,stroke:'var(--fret)','stroke-width':2},svg);
  el('rect',{x:X0-4,y:14,width:5,height:184,fill:'var(--fg)'},svg);
  for(var i=0;i<6;i++) el('line',{x1:X0,x2:XE,y1:yS(i),y2:yS(i),stroke:'var(--muted)','stroke-width':(0.9+i*0.35).toFixed(2),opacity:.75},svg);
  for(var n=0;n<=NF;n++){var t=el('text',{x:dotX(n),y:218,'text-anchor':'middle','font-size':11,fill:[0,3,5,7,9,12,15].indexOf(n)>=0?'var(--fg)':'var(--muted)'},svg); t.textContent=n;}
  el('g',{id:'dots'},svg);
})();
var gDots=document.getElementById('dots'), winRect=document.getElementById('winRect');
var POS=[];
for(var s0=0;s0<6;s0++){ POS[s0]=[]; for(var f0=0;f0<=NF;f0++){
  var g0=el('g',{'class':'pos'},gDots), x0=dotX(f0), y0=yS(s0);
  el('circle',{'class':'b',cx:x0,cy:y0,r:12},g0);
  var t0=el('text',{x:x0,y:y0},g0);
  POS[s0][f0]={g:g0,t:t0,cls:'pos',txt:''};
}}

function inWin(f){return S.win<0 || (f>=S.win && f<=S.win+4);}
function drawWindow(){
  if(S.win<0){winRect.setAttribute('width',0);return;}
  var l=S.win===0?4:fretX(S.win-1)+2, r=fretX(S.win+4)-2;
  winRect.setAttribute('x',l); winRect.setAttribute('width',r-l);
}
function scrollToWindow(){
  var sc=document.getElementById('scroller'); if(sc.scrollWidth<=sc.clientWidth+2) return;
  var c = S.win<0 ? 0 : (dotX(S.win)+dotX(S.win+4))/2/1000*sc.scrollWidth - sc.clientWidth/2;
  sc.scrollTo({left:Math.max(0,c),behavior:'smooth'});
}

function renderBoard(cur){
  for(var s=0;s<6;s++) for(var f=0;f<=NF;f++){
    var p=POS[s][f], pc=(OPEN[s]+f)%12, cls='pos', txt=p.txt;
    var ci=inWin(f)?cur.pcs.indexOf(pc):-1;
    if(ci>=0){ cls+=' cur '+ROLE[ci]; txt=S.labels==='int'?cur.lb[ci]:spell(pc); }
    if(cls!==p.cls){ p.g.setAttribute('class',cls); p.cls=cls; }
    if(txt!==p.txt){ p.t.textContent=txt; p.txt=txt; }
  }
}

// ---------- Readout + chart ----------
var $=function(id){return document.getElementById(id);};
var cells=[];
function buildChart(){
  var ch=$('chart'); ch.textContent=''; cells=[];
  slots().forEach(function(s,i){
    var b=document.createElement('button'); b.type='button'; b.className='cell'; b.style.gridColumn='span '+s[3];
    b.innerHTML='<span class="c"></span><span class="r"></span><span class="p"></span>';
    b.addEventListener('click',function(){ if(!playing){ restSlot=i; showRest(); } });
    ch.appendChild(b); cells.push(b);
  });
  fillChart();
}
function fillChart(){
  var p=prog(), keyName=(p.mode==='minor'?KEY_MIN:KEY_MAJ)[S.key]+(p.mode==='minor'?' minor':'');
  $('chartTitle').textContent=p.name.replace(/ \(2 beats each\)/,'')+' in '+keyName;
  cells.forEach(function(c,i){var k=chordOf(i); c.querySelector('.c').textContent=k.sym; c.querySelector('.r').textContent=k.rn;});
}
var shownSlot=-1, shownSig='';
// slot = the chord on the board (may be one step ahead); actSlot/inChord/barBeat = where the music actually is.
function show(slot, actSlot, inChord, barBeat, bar, counting){
  var n=slots().length, cur=chordOf(slot), nxt=chordOf((slot+1)%n);
  var sig=slot+'|'+S.key+'|'+S.type+'|'+S.win+'|'+S.labels+'|'+S.prog;
  if(sig!==shownSig){
    shownSig=sig;
    $('nowSym').textContent=cur.sym; $('nowRn').textContent=cur.rn;
    $('nextSym').textContent=nxt.sym; $('nextRn').textContent=nxt.rn;
    var tones=$('tones'); tones.textContent='';
    cur.pcs.forEach(function(pc,i){var d=document.createElement('span'); d.className='tone'; d.innerHTML='<b></b><span></span>'; d.firstChild.textContent=spell(pc); d.lastChild.textContent=cur.lb[i]; tones.appendChild(d);});
    renderBoard(cur);
  }
  var bs=$('beats'); bs.classList.toggle('count',!!counting);
  Array.prototype.forEach.call(bs.children,function(e,i){e.classList.toggle('on', barBeat!=null && i===barBeat);});
  $('barPos').textContent = counting ? 'Count-in' : 'Bar '+(bar+1)+' of '+(totalBeats()/4);
  var actBeats=slots()[actSlot][3];
  cells.forEach(function(c,i){
    c.classList.toggle('cur',i===actSlot);
    c.querySelector('.p').style.width = i===actSlot && barBeat!=null && !counting ? ((inChord+1)/actBeats*100)+'%' : '0';
  });
}
var restSlot=0;
function showRest(){
  var sl=slots(); if(restSlot>=sl.length) restSlot=0;
  var b=0; for(var i=0;i<restSlot;i++) b+=sl[i][3];
  show(restSlot, restSlot, 0, null, Math.floor(b/4), false);
  $('barPos').textContent='Bar '+(Math.floor(b/4)+1)+' of '+(totalBeats()/4)+' · stopped';
}
function refresh(){ shownSig=''; if(playing && lastBeat!=null) drawBeat(lastBeat, lastBoard); else showRest(); }

// ---------- Audio ----------
var ctx=null, comp=null, bus=null, cache={};
function ensureCtx(){
  if(!ctx){ var AC=window.AudioContext||window.webkitAudioContext; ctx=new AC();
    comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; comp.connect(ctx.destination); }
  bus=ctx.createGain(); bus.gain.value=0.9; bus.connect(comp);
}
function ks(midi, bright){
  var key=midi+'_'+bright; if(cache[key]) return cache[key];
  var sr=ctx.sampleRate, len=Math.floor(sr*3), freq=440*Math.pow(2,(midi-69)/12), N=Math.max(2,Math.round(sr/freq));
  var buf=ctx.createBuffer(1,len,sr), d=buf.getChannelData(0), prev=0, decay=midi<50?0.998:0.9965;
  for(var i=0;i<N;i++){ prev+=bright*((Math.random()*2-1)-prev); d[i]=prev; }
  d[N]=d[0]*decay;
  for(i=N+1;i<len;i++) d[i]=decay*0.5*(d[i-N]+d[i-N-1]);
  var fade=Math.floor(sr*0.05); for(i=0;i<fade;i++) d[len-1-i]*=i/fade;
  cache[key]=buf; return buf;
}
function note(midi,t,gain,ringFor,bright){
  var src=ctx.createBufferSource(); src.buffer=ks(midi,bright);
  var g=ctx.createGain(); g.gain.setValueAtTime(gain,t); g.gain.setValueAtTime(gain,t+Math.max(0.05,ringFor-0.06)); g.gain.linearRampToValueAtTime(0.0001,t+ringFor);
  src.connect(g); g.connect(bus); src.start(t); src.stop(t+ringFor+0.02);
}
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
function click(t,accent){
  // Soft woodblock-style tick rather than a square-wave beep.
  var o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine';
  o.frequency.setValueAtTime(accent?1250:950,t); o.frequency.exponentialRampToValueAtTime(accent?800:620,t+0.03);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(accent?0.22:0.14,t+0.002); g.gain.exponentialRampToValueAtTime(0.0001,t+0.05);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t+0.06);
}
// Electric piano: two-operator FM, the classic tine sound. Soft attack, bell that fades quickly.
function epNote(midi,t,gain,dur){
  var f=mtof(midi), car=ctx.createOscillator(), mod=ctx.createOscillator(), mg=ctx.createGain(), g=ctx.createGain();
  car.type='sine'; mod.type='sine'; car.frequency.value=f; mod.frequency.value=f;
  mg.gain.setValueAtTime(f*2.2,t); mg.gain.exponentialRampToValueAtTime(f*0.25,t+0.5);
  mod.connect(mg); mg.connect(car.frequency);
  var peak=gain*0.5, end=t+dur;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+0.006);
  g.gain.exponentialRampToValueAtTime(peak*0.35,t+Math.min(1.2,dur*0.8));
  g.gain.setValueAtTime(peak*0.35,end-0.08); g.gain.exponentialRampToValueAtTime(0.0001,end);
  car.connect(g); g.connect(bus); car.start(t); mod.start(t); car.stop(end+0.02); mod.stop(end+0.02);
}
// Warm pad: detuned saws through a low-pass filter, held for the whole chord.
function padNote(midi,t,gain,dur){
  var f=mtof(midi), lp=ctx.createBiquadFilter(), g=ctx.createGain(), end=t+dur, peak=gain*0.16;
  lp.type='lowpass'; lp.frequency.value=900; lp.Q.value=0.4;
  [-7,7].forEach(function(c){ var o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=c; o.connect(lp); o.start(t); o.stop(end+0.35); });
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+0.09);
  g.gain.setValueAtTime(peak,end-0.05); g.gain.exponentialRampToValueAtTime(0.0001,end+0.3);
  lp.connect(g); g.connect(bus);
}
// Clean electric: the plucked-string model with a darker pick and a tone knob rolled back.
function cleanNote(midi,t,gain,dur){
  var src=ctx.createBufferSource(); src.buffer=ks(midi,0.2);
  var lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2200; lp.Q.value=0.3;
  var g=ctx.createGain(); g.gain.setValueAtTime(gain*1.4,t); g.gain.setValueAtTime(gain*1.4,t+Math.max(0.05,dur-0.06)); g.gain.linearRampToValueAtTime(0.0001,t+dur);
  src.connect(lp); lp.connect(g); g.connect(bus); src.start(t); src.stop(t+dur+0.02);
}
// Round electric bass for the non-acoustic sounds.
function synthBass(midi,t,dur){
  var o=ctx.createOscillator(), lp=ctx.createBiquadFilter(), g=ctx.createGain(), end=t+dur;
  o.type='triangle'; o.frequency.value=mtof(midi); lp.type='lowpass'; lp.frequency.value=700;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.5,t+0.008); g.gain.exponentialRampToValueAtTime(0.28,t+0.3);
  g.gain.setValueAtTime(0.28,end-0.05); g.gain.exponentialRampToValueAtTime(0.0001,end);
  o.connect(lp); lp.connect(g); g.connect(bus); o.start(t); o.stop(end+0.02);
}
function voicing(c){
  var base=48+c.root; if(base>57) base-=12;             // chord root between C3 and A3
  var notes=c.iv.map(function(v){return base+v;});
  if(c.iv.length===3) notes.push(base+12);              // triads get the octave on top
  return notes;
}
function playChord(c,t,gain,dur){
  var v=S.voice, notes=voicing(c);
  notes.forEach(function(m,i){
    if(v==='acoustic') note(m,t+i*0.016,gain*(i===0?0.8:1),dur,0.55);
    else if(v==='clean') cleanNote(m,t+i*0.012,gain*(i===0?0.8:1),dur);
    else if(v==='pad') padNote(m,t,1,dur);
    else epNote(m,t+i*0.004,gain*(i===0?0.7:1),dur);
  });
}
function bassNote(c,t,useFifth,dur){
  var r=40+((c.root-4+12)%12);                          // E2 to D#3
  var m=r; if(useFifth){ var f=c.iv[2]; m=r+f; if(m>52) m-=12; }
  if(S.voice==='acoustic') note(m,t,0.75,dur,0.3); else synthBass(m,t,dur);
}
function scheduleBeat(b,t){
  var bd=60/S.bpm;
  if(b<0){ click(t,b===-4); return; }
  var info=beatInfo(b), bb=b%4, c=chordOf(info.slot), change=info.inChord===0;
  if(S.click) click(t,bb===0);
  if(S.voice==='off') return;
  if(S.voice==='pad'){                                  // one held chord per change, bass still walks 1 and 3
    if(change) playChord(c,t,1,info.beats*bd);
  }
  if(change || bb===0 || bb===2){
    var toNext=Math.min(2, info.beats-info.inChord, bb===0||bb===2?2:1);
    if(S.voice!=='pad') playChord(c,t,change?0.32:0.22,toNext*bd+0.05);
    bassNote(c,t,!change && bb===2,toNext*bd+0.02);
  }
}

// ---------- Transport ----------
var playing=false, timer=null, raf=null, nextBeat=0, nextTime=0, queue=[], lastBeat=null;
function start(){
  ensureCtx(); if(ctx.state==='suspended') ctx.resume();
  queue=[]; lastBeat=null; lastBoard=null;
  nextBeat=S.countIn?-4:0; nextTime=ctx.currentTime+0.12;
  playing=true; setPlayBtn();
  cells.forEach(function(c){c.disabled=true;});
  $('chartHint').textContent='Press stop to pick a chord.';
  timer=setInterval(tick,25); tick(); raf=requestAnimationFrame(draw);
}
function stop(){
  playing=false; clearInterval(timer); cancelAnimationFrame(raf);
  if(bus){ var b=bus; b.gain.setTargetAtTime(0.0001,ctx.currentTime,0.03); setTimeout(function(){try{b.disconnect();}catch(e){}},400); }
  cells.forEach(function(c){c.disabled=false;});
  $('chartHint').textContent='Tap a chord to see its tones.';
  if(lastBeat!=null && lastBeat>=0) restSlot=beatInfo(lastBeat).slot;
  lastBeat=null; lastBoard=null; setPlayBtn(); showRest();
}
function leadSec(){ return S.lead*60/S.bpm; }
function tick(){
  var total=totalBeats();
  while(nextTime < ctx.currentTime+0.12+leadSec()){
    scheduleBeat(nextBeat,nextTime); queue.push({b:nextBeat,t:nextTime});
    nextTime+=60/S.bpm; nextBeat++; if(nextBeat>=total) nextBeat=0;
  }
}
var lastBoard=null;
function draw(){
  var now=ctx.currentTime, ahead=now+leadSec(), act=null, board=null;
  while(queue.length>1 && queue[1].t<=now) queue.shift();       // keep the beat that's sounding now at queue[0]
  for(var i=0;i<queue.length;i++){
    if(queue[i].t<=now) act=queue[i];
    if(queue[i].t<=ahead) board=queue[i]; else break;
  }
  if(act && (act.b!==lastBeat || (board && board.b!==lastBoard))){
    lastBeat=act.b; lastBoard=board?board.b:act.b; drawBeat(lastBeat,lastBoard);
  }
  raf=requestAnimationFrame(draw);
}
function drawBeat(a, bb){
  var boardSlot = (bb==null||bb<0) ? 0 : beatInfo(bb).slot;
  if(a<0) show(boardSlot, 0, 0, 4+a, 0, true);
  else { var info=beatInfo(a); show(boardSlot, info.slot, info.inChord, a%4, Math.floor(a/4), false); }
}
function setPlayBtn(){
  var p=$('play');
  p.innerHTML = playing ? '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="2" width="10" height="10"/></svg><span>Stop</span>'
                        : '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 1l11 6-11 6z"/></svg><span>Play</span>';
}

// ---------- Controls ----------
function buildKeys(){
  var names=prog().mode==='minor'?KEY_MIN:KEY_MAJ, sel=$('key'); sel.textContent='';
  names.forEach(function(n,i){var o=document.createElement('option'); o.value=i; o.textContent=n+(prog().mode==='minor'?' minor':''); sel.appendChild(o);});
  sel.value=S.key;
}
PROGS.forEach(function(p){var o=document.createElement('option'); o.value=p.id; o.textContent=p.name; $('prog').appendChild(o);});
(function(){var w=$('win'), o=document.createElement('option'); o.value=-1; o.textContent='Whole neck'; w.appendChild(o);
  for(var s=0;s<=11;s++){o=document.createElement('option'); o.value=s; o.textContent='Frets '+s+'–'+(s+4)+(s===0?' (open)':''); w.appendChild(o);}})();

function syncControls(){
  $('prog').value=S.prog; buildKeys(); $('win').value=S.win;
  $('t7').setAttribute('aria-pressed',S.type==='7'); $('t3').setAttribute('aria-pressed',S.type==='3');
  $('bpm').value=S.bpm; $('bpmOut').textContent=S.bpm+' bpm';
  Array.prototype.forEach.call(document.querySelectorAll('[data-bpm]'),function(b){b.setAttribute('aria-pressed',+b.dataset.bpm===+S.bpm);});
  $('countIn').checked=S.countIn; $('click').checked=S.click; $('voice').value=S.voice;
  $('lead').value=S.lead; $('labels').value=S.labels;
  drawWindow();
}
$('prog').addEventListener('change',function(e){ var was=playing; if(playing) stop(); S.prog=e.target.value; restSlot=0; save(); syncControls(); buildChart(); showRest(); if(was) start(); });
$('key').addEventListener('change',function(e){ S.key=+e.target.value; save(); fillChart(); refresh(); });
['t7','t3'].forEach(function(id){ $(id).addEventListener('click',function(){ S.type=$(id).dataset.type; save(); syncControls(); fillChart(); refresh(); }); });
function setWin(v){ S.win=Math.max(-1,Math.min(11,v)); save(); $('win').value=S.win; drawWindow(); refresh(); scrollToWindow(); }
$('win').addEventListener('change',function(e){ setWin(+e.target.value); });
$('winDown').addEventListener('click',function(){ setWin(S.win<0?0:S.win-1); });
$('winUp').addEventListener('click',function(){ setWin(S.win<0?0:S.win+1); });
function setBpm(v){ S.bpm=Math.max(40,Math.min(200,v|0)); save(); syncControls(); }
$('bpm').addEventListener('input',function(e){ setBpm(e.target.value); });
Array.prototype.forEach.call(document.querySelectorAll('[data-bpm]'),function(b){ b.addEventListener('click',function(){ setBpm(b.dataset.bpm); }); });
['countIn','click'].forEach(function(id){ $(id).addEventListener('change',function(e){ S[id]=e.target.checked; save(); }); });
$('voice').addEventListener('change',function(e){ S.voice=e.target.value; save(); });
$('lead').addEventListener('change',function(e){ S.lead=+e.target.value; save(); });
$('labels').addEventListener('change',function(e){ S.labels=e.target.value; save(); refresh(); });
$('play').addEventListener('click',function(){ playing?stop():start(); });
document.addEventListener('keydown',function(e){
  if(e.code!=='Space') return; var t=e.target.tagName; if(t==='SELECT'||t==='INPUT'||t==='BUTTON') return;
  e.preventDefault(); playing?stop():start();
});

syncControls(); buildChart(); showRest();
setTimeout(scrollToWindow,60);
})();

// Tell the host page how tall the tool is, so the iframe never scrolls or leaves a gap.
(function(){
  if(window.parent===window) return;
  var last=0;
  function post(){
    var h=Math.ceil(document.documentElement.getBoundingClientRect().height);
    if(h!==last){ last=h; window.parent.postMessage({type:'utg-tool-height', id:'chord-tone-trainer', height:h}, '*'); }
  }
  if('ResizeObserver' in window) new ResizeObserver(post).observe(document.body);
  window.addEventListener('load',post); post();
})();
