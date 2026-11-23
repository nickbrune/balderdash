const ART_URL=window.__JOIN_BASE||'https://claude.ai/artifact/8Q7btX14uW78JhEtjJPjRT';
const SPIN_MS=4200;
const CATS={
 word:{label:'Word',icon:'📖',color:'#b8432f',eyebrow:'What does this word mean?',prompt:'Write a definition that sounds real',ph:'A small…',hint:'Write it like a dictionary would.',real:'The real definition',task:'write a fake definition',
   coach:['One plain sentence, like a dictionary. Skip the jokes.','Things often start with “A…” or “The…”; actions with “To…”.']},
 person:{label:'Person',icon:'🧑',color:'#24527a',eyebrow:'Who is this person?',prompt:'Who are they, and what are they known for?',ph:'An 18th-century inventor who…',hint:'Sound like an encyclopedia entry.',real:'The real answer',task:'invent who this person was',
   coach:['Say who they were and why they’re remembered, in one sentence.','A specific detail, like a year, a place or a job, makes it believable.']},
 initials:{label:'Initials',icon:'🔤',color:'#2e7a4d',eyebrow:'What do these initials stand for?',prompt:'What do the letters stand for?',ph:'Spell out each letter…',hint:'Make every letter count.',real:'What it really stands for',task:'spell out the initials',
   coach:['Spell out every letter, in order.','Real ones are usually a company, group or technical term, and a few are in another language.']},
 movie:{label:'Movie',icon:'🎬',color:'#b8892a',eyebrow:'What is this movie about?',prompt:'Write a one-line plot summary',ph:'A retired lighthouse keeper…',hint:'Think TV-guide blurb.',real:'The real plot',task:'invent the plot',
   coach:['One sentence of plot that starts with who the story is about.','Specific and a little odd beats silly. Real ones are often strange.']},
 law:{label:'Law',icon:'⚖️',color:'#6b4a8a',eyebrow:'Finish this real law',prompt:'How does this law end?',ph:'…',hint:'Just write the ending of the sentence.',real:'The real law',task:'finish the law',
   coach:['Write only the ending, usually just a few words.','Pick up exactly where the sentence stops.']}
};
const CAT_KEYS=Object.keys(CATS);
const STAR=c=>`<svg viewBox="0 0 40 40"><path d="M20 1 L24.5 15.5 L39 20 L24.5 24.5 L20 39 L15.5 24.5 L1 20 L15.5 15.5 Z" fill="${c}"/></svg>`;
const SPARKLES=[STAR('var(--gold)'),STAR('#fff'),STAR('var(--bulb)'),STAR('var(--gold)'),STAR('#fff'),STAR('var(--pop2)')];
const CONFETTI=[STAR('var(--gold)'),STAR('#fff'),'<svg viewBox="0 0 20 30"><rect width="20" height="30" rx="3" fill="var(--pop1)"/></svg>','<svg viewBox="0 0 20 30"><rect width="20" height="30" rx="3" fill="var(--pop2)"/></svg>','<svg viewBox="0 0 20 30"><rect width="20" height="30" rx="3" fill="var(--gold)"/></svg>'];
const THEMES={
 classic:{label:"Game Show '85",icon:'🌟',tag:"'85",deco:SPARKLES,burst:CONFETTI},
 thanksgiving:{label:'Thanksgiving',icon:'🦃',tag:'Thanksgiving',deco:['🍂','🍁','🦃','🥧','🌽','🍁'],burst:['🍂','🍁','🦃','🥧','🌽']},
 christmas:{label:'Christmas',icon:'🎄',tag:'Christmas',deco:['❄️','🎄','⭐','🎁','🔔','❄️'],burst:['❄️','🎁','⭐','🎄','🍬'],snow:true},
 halloween:{label:'Halloween',icon:'🎃',tag:'Halloween',deco:['🎃','👻','🦇','🕸️','🍬','🦇'],burst:['🎃','👻','🦇','🍬']},
 newyear:{label:"New Year's",icon:'🎆',tag:"New Year's",deco:['🎉','✨','🥂','🎊','🪩','✨'],burst:['🎉','🎊','✨','🥂']},
 july4:{label:'4th of July',icon:'🎇',tag:'4th of July',deco:['🎆','⭐','🎇','🇺🇸','⭐','🎆'],burst:['⭐','🎆','🇺🇸','🎇']}
};
const THEME_KEYS=Object.keys(THEMES);
const DECKS=window.DECKS||{word:[["Absquatulate","To leave abruptly."]],person:[],initials:[],movie:[],law:[]};

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const _st=ses=>ses?(window.__simSS||sessionStorage):(window.__simLS||localStorage);
const store={get(k,ses){try{return _st(ses).getItem(k)}catch(e){return null}},set(k,v,ses){try{_st(ses).setItem(k,v)}catch(e){}},del(k,ses){try{_st(ses).removeItem(k)}catch(e){}}};
const rid=n=>Array.from({length:n},()=>'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random()*31)]).join('');
let myPid=store.get('bd-pid',1)||rid(6);store.set('bd-pid',myPid,1);
let myName=store.get('bd-name')||'';

const S={theme:'',mode:null,room:null,db:null,roomReady:false,named:null,code:'',myGame:null,G:null,myP:{},drafts:{},draftKey:'',
  editing:false,voteSel:null,marks:{},err:'',busy:false,conn:true,joinedAt:0,unsub:[],confirm:null,lastMain:null,
  used:new Set(),usedLoaded:false,saving:Promise.resolve(),qr:{},lastN:0,bAnimKey:'',hashCode:''};
{const m=/^#join-([a-z]{4})$/i.exec(location.hash||'');if(m){S.hashCode=m[1].toUpperCase();S.drafts.jc=S.hashCode;}}

/* ================= game engine (runs on the main screen) ================= */
function newGame(){return {v:1,theme:THEMES[store.get('bd-theme')]?store.get('bd-theme'):'classic',phase:'lobby',round:0,target:15,tlen:180,order:[],names:{},scores:{},seqs:{},dasher:null,
  cat:'word',word:'',def:'',cardKey:'',spin:null,deadline:0,opts:[],votes:{},closed:[],closedT:{},step:0,scored:false}}
function normG(g){
  const o=Object.assign({},g);
  o.order=Array.isArray(o.order)?o.order.filter(x=>typeof x==='string'):[];
  for(const k of ['names','scores','votes','closedT','seqs'])o[k]=(o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k]))?o[k]:{};
  o.opts=Array.isArray(o.opts)?o.opts.filter(x=>x&&typeof x==='object'):[];
  o.closed=Array.isArray(o.closed)?o.closed:[];
  o.round=+o.round||0;o.target=+o.target||15;o.step=+o.step||0;o.tlen=+o.tlen||180;o.deadline=+o.deadline||0;
  if(!CATS[o.cat])o.cat='word';
  if(!THEMES[o.theme])o.theme='classic';
  return o;
}
const presentOrder=(g,present)=>g.order.filter(p=>present.has(p));
const writersOf=(g,present)=>presentOrder(g,present).filter(p=>p!==g.dasher);
const votersOf=(g,present)=>writersOf(g,present).filter(p=>!g.closed.includes(p));
function enroll(g,inp,present){
  for(const p of present){const n=inp[p]&&inp[p].name;if(!n)continue;
    if(!g.order.includes(p)){if(g.order.length>=10)continue;g.order.push(p);if(g.scores[p]==null)g.scores[p]=0;}
    g.names[p]=String(n).slice(0,18);}
}
function gather(g,presMap){
  const inp={};
  for(const pid in presMap){const pr=presMap[pid]||{};
    inp[pid]={name:pr.name,
      sub:pr.sub&&pr.sub.r===g.round&&typeof pr.sub.t==='string'?pr.sub.t:null,
      vote:pr.vote&&pr.vote.r===g.round&&Number.isInteger(pr.vote.i)?pr.vote.i:null,
      cmd:pr.cmd&&typeof pr.cmd==='object'?pr.cmd:null};}
  return inp;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a}
const cardKey=(cat,w)=>cat+':'+String(w).toLowerCase();
function draw(g){
  const deck=DECKS[g.cat]||[];
  let pool=deck.filter(([w])=>!S.used.has(cardKey(g.cat,w))&&cardKey(g.cat,w)!==g.cardKey);
  if(!pool.length){for(const [w] of deck)S.used.delete(cardKey(g.cat,w));saveUsed();pool=deck.filter(([w])=>cardKey(g.cat,w)!==g.cardKey);}
  if(!pool.length)pool=deck;
  const [w,d]=pool[Math.floor(Math.random()*pool.length)]||['?','?'];
  g.word=w;g.def=d;g.cardKey=cardKey(g.cat,w);
}
function startRound(g,inp,present){
  enroll(g,inp,present);
  const idx=g.dasher?g.order.indexOf(g.dasher):-1;
  for(let k=1;k<=g.order.length;k++){const p=g.order[(idx+k+g.order.length)%g.order.length];if(present.has(p)){g.dasher=p;break;}}
  g.round++;g.phase='pick';g.cat='word';g.word='';g.def='';g.cardKey='';g.spin=null;g.deadline=0;
  g.opts=[];g.votes={};g.closed=[];g.closedT={};g.step=0;g.scored=false;
}
/* Tidy every answer the same way, so punctuation and capitals don't give the real one away. */
function tidy(text,cat,word){
  let t=String(text==null?'':text).replace(/\s+/g,' ').trim();
  {const m=/^["“”'‘’](.*)["“”'‘’]$/.exec(t);if(m&&!/["“”]/.test(m[1]))t=m[1].trim();}   // whole answer wrapped in quotes
  if(word&&cat!=='law'){                                                // "Gongoozler: a person who…" -> "a person who…"
    const bare=String(word).replace(/\s*\([^)]*\)\s*$/,'').trim();
    for(const w of [String(word),bare]){const re=new RegExp('^'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*(?:[:=,\\-–—]|\\bis\\b|\\bmeans\\b)\\s*','i');if(re.test(t)){t=t.replace(re,'');break;}}
  }
  if(cat==='law')t=t.replace(/^(?:\.{2,}|…)\s*/,'');                    // typed their own "…"
  t=t.replace(/\s+([.,!?;:])/g,'$1').replace(/([!?])\1+/g,'$1').replace(/\.{2,}$/,'.');
  if(!t)return t;
  if(cat==='initials'){                                                 // "saturday club of bored adults" -> "Saturday Club of Bored Adults"
    const cut=t.search(/[:(]/);const head=cut<0?t:t.slice(0,cut),rest=cut<0?'':t.slice(cut);
    const small=/^(a|an|and|the|of|for|to|in|on|at|by|with|or|de|du|la|le)$/i;
    t=head.split(' ').map((w,i)=>(i>0&&small.test(w))?w.toLowerCase():w.charAt(0).toUpperCase()+w.slice(1)).join(' ')+rest;
  }
  if(cat!=='law')t=t.charAt(0).toUpperCase()+t.slice(1);
  if(!/[.!?]["”')\]]?$/.test(t))t+='.';
  return t;
}
function guideExamples(G,n){
  const deck=DECKS[G.cat]||[];const cur=String(G.word||'').toLowerCase();
  const pool=deck.filter(([w])=>w.toLowerCase()!==cur);if(!pool.length)return [];
  let h=0;for(const ch of G.cat+':'+G.round+':'+cur)h=(h*31+ch.charCodeAt(0))>>>0;
  const out=[];for(let k=0;k<Math.min(n,pool.length);k++){const i=(h+k*7919)%pool.length;if(!out.includes(pool[i]))out.push(pool[i]);}
  return out;
}
function formatGuide(G){
  const cat=catOf(G);const ex=guideExamples(G,2);
  return `<div class="card guide"><span class="eyebrow">💡 What real answers look like</span>
  <ul class="guide-tips">${(cat.coach||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
  ${ex.map(([w,d])=>`<div class="guide-ex">${G.cat==='law'?`<span class="muted">${esc(w)}</span> <b>${esc(d)}</b>`:`<b>${esc(w)}</b><span class="muted"> → </span>${esc(d)}`}</div>`).join('')}
  <p class="muted small" style="margin:8px 0 0">Don't worry about capitals or the final period. The game tidies every answer to match.</p></div>`;
}
function toVote(g,inp,close){
  const subs={};
  for(const p of g.order){if(p!==g.dasher&&inp[p]&&inp[p].sub){const t=tidy(String(inp[p].sub).slice(0,160),g.cat,g.word);if(t)subs[p]=t;}}
  g.closed=(Array.isArray(close)?close:[]).filter(p=>subs[p]!=null);
  g.closedT={};for(const p of g.closed)g.closedT[p]=subs[p];
  const opts=Object.keys(subs).filter(p=>!g.closed.includes(p)).map(p=>({t:subs[p],a:p}));
  opts.push({t:g.def,a:'*'});   // real answers are already in house style; bluffs are tidied to match
  g.opts=shuffle(opts);g.votes={};g.phase='vote';g.def='';g.deadline=0;
}
function toReveal(g,inp){
  const votes={};
  for(const p of g.order){if(p===g.dasher||g.closed.includes(p))continue;
    const i=inp[p]&&inp[p].vote;
    if(Number.isInteger(i)&&g.opts[i]&&g.opts[i].a!==p)votes[p]=i;}
  g.votes=votes;g.phase='reveal';g.step=1;g.scored=false;
}
function applyScores(g){if(g.scored)return;const d=deltas(g);for(const k in d)g.scores[k]=(g.scores[k]||0)+d[k];g.scored=true;}
function deltas(g){
  const d={};const add=(p,n)=>{if(!p)return;d[p]=(d[p]||0)+n};
  const real=g.opts.findIndex(o=>o.a==='*');let found=false;
  for(const p in g.votes){const i=g.votes[p];if(i===real){add(p,2);found=true}else if(g.opts[i]&&g.opts[i].a!==p)add(g.opts[i].a,1);}
  for(const p of g.closed)add(p,3);
  if(!found&&g.closed.length===0)add(g.dasher,3);
  return d;
}
function nextRound(g,inp,present){const mx=Math.max(0,...Object.values(g.scores));if(mx>=g.target)g.phase='final';else startRound(g,inp,present);}
function applyCmd(g,pid,c,a,inp,present){
  const H=pid===g.dasher;const pc=g.phase==='pick'||g.phase==='card';
  switch(c){
    case 'start':if(g.phase==='lobby'&&presentOrder(g,present).length>=3){g.order=presentOrder(g,present);startRound(g,inp,present);}break;
    case 'theme':if(g.phase==='lobby'&&THEMES[a])g.theme=a;break;
    case 'cat':if(H&&pc&&CATS[a]){g.cat=a;g.spin=null;draw(g);g.phase='card';}break;
    case 'spin':if(H&&pc){const k=CAT_KEYS[Math.floor(Math.random()*CAT_KEYS.length)];g.cat=k;g.spin={c:k,id:Date.now()};draw(g);g.phase='card';}break;
    case 'redraw':if(H&&g.phase==='card')draw(g);break;
    case 'show':if(H&&g.phase==='card'&&g.word){g.phase='write';g.deadline=Date.now()+g.tlen*1000;markUsed(g.cardKey);}break;
    case 'time':if(H&&g.phase==='write')g.deadline=Math.max(g.deadline,Date.now())+30000;break;
    case 'display':if(H&&g.phase==='write')toVote(g,inp,a&&a.close);break;
    case 'reveal':if(H&&g.phase==='vote')toReveal(g,inp);break;
    case 'step':if(H&&g.phase==='reveal'&&g.step<3){g.step++;if(g.step>=3)applyScores(g);}break;
    case 'next':if(H&&g.phase==='reveal'&&g.step>=3)nextRound(g,inp,present);break;
  }
}
function auto(G,inp,present){
  const before=JSON.stringify(G);const g=clone(G);
  for(const p of present)if(g.order.includes(p)&&inp[p]&&inp[p].name)g.names[p]=String(inp[p].name).slice(0,18);
  if(g.phase==='lobby'){g.order=g.order.filter(p=>present.has(p));enroll(g,inp,present);}
  for(const p of present){const c=inp[p]&&inp[p].cmd;if(!c||typeof c.n!=='number'||!(c.n>(g.seqs[p]||0)))continue;
    g.seqs[p]=c.n;applyCmd(g,p,String(c.c||''),c.a,inp,present);}
  for(const p in g.seqs)if(!g.order.includes(p)&&!present.has(p))delete g.seqs[p];
  return JSON.stringify(g)===before?null:g;
}

/* ================= used-card memory ================= */
function markUsed(k){if(!k||S.used.has(k))return;S.used.add(k);saveUsed();}
function saveUsed(){
  const keys=[...S.used];store.set('bd-used',JSON.stringify(keys));
  if(S.db){S.saving=S.saving.then(()=>S.db.doc('deck/used').set({keys,updated:Date.now()})).catch(()=>{});}
}
async function loadUsed(){
  try{const l=JSON.parse(store.get('bd-used')||'[]');if(Array.isArray(l))l.forEach(k=>S.used.add(k));}catch(e){}
  if(S.db){try{const snap=await S.db.doc('deck/used').get();const d=snap.exists&&snap.data();if(d&&Array.isArray(d.keys))d.keys.forEach(k=>typeof k==='string'&&S.used.add(k));}catch(e){}}
  S.usedLoaded=true;render();
}
function deckStats(){let total=0,left=0;for(const k of CAT_KEYS){const d=DECKS[k]||[];total+=d.length;left+=d.filter(([w])=>!S.used.has(cardKey(k,w))).length;}return {total,left};}

/* ================= room plumbing ================= */
(async()=>{
  await null;
  try{if(window.claude&&typeof window.claude.use==='function'){
    const [r,d,t]=await Promise.all([window.claude.use('room').catch(()=>null),window.claude.use('db').catch(()=>null),window.__SIM?null:window.claude.use('tts').catch(()=>null)]);S.room=r;S.db=d;S.tts=t;}}catch(e){}
  S.roomReady=true;render();resume();
})();
setTimeout(()=>{if(!S.roomReady){S.roomReady=true;render();}},11000);

function setP(patch){
  for(const k in patch){if(patch[k]===null)delete S.myP[k];else S.myP[k]=patch[k];}
  if(S.named)S.named.presence(patch).catch(e=>{if(e&&e.code==='invalid_argument'){S.err='That was too long to send. Try something shorter.';render();}});
}
function onlineState(){
  const peers=S.named?S.named.peers().filter(p=>p.kind!=='agent'):[];
  const byPid={};let best=null,boards=0;
  for(const p of peers){
    const pr=p.presence||{};
    if(!(p.isMe&&p.sameTab)){
      if(pr.board)boards++;
      const g=pr.game;
      if(g&&typeof g==='object'&&typeof g.v==='number'&&Array.isArray(g.order)&&(!best||g.v>best.g.v))best={g};
      if(typeof pr.pid==='string'&&pr.pid!==myPid&&pr.name&&!pr.board){const cur=byPid[pr.pid];if(!cur||p.updatedAt>cur.t)byPid[pr.pid]={pres:pr,t:p.updatedAt};}
    }
  }
  if(S.mode==='player')byPid[myPid]={pres:S.myP};
  let G=null;
  if(S.mode==='board'&&S.myGame)G=S.myGame;
  else if(best){G=normG(best.g);S.G=G;}
  const presMap={};for(const k in byPid)presMap[k]=byPid[k].pres;
  const present=new Set(Object.keys(presMap));
  return {G,inp:G?gather(G,presMap):{},present,boards,pres:p=>presMap[p]};
}
function commit(g){g.v=(S.myGame?S.myGame.v:0)+1;S.myGame=g;setP({game:g});store.set('bd-session',JSON.stringify({role:'board',code:S.code,g}),1);}
function boardTick(){
  if(S.mode!=='board'||!S.myGame)return;
  for(let i=0;i<8;i++){const st=onlineState();const g2=auto(S.myGame,st.inp,st.present);if(!g2)return;commit(g2);}
}
function boardAct(fn){if(S.mode!=='board'||!S.myGame)return;const st=onlineState();const g=clone(S.myGame);fn(g,st.inp,st.present);commit(g);boardTick();S.confirm=null;render();}
function sendCmd(c,a){const n=Math.max(Date.now(),S.lastN+1);S.lastN=n;setP({cmd:a===undefined?{n,c}:{n,c,a}});render();}

async function enterRoom(code,role,resumeG){
  if(!S.room){S.err=window.__NET?'Couldn\'t load the multiplayer connection. Check the internet connection and reload.':'Online play isn\'t available in this view. Open the game from its claude.ai link while signed in.';render();return;}
  S.err='';S.busy=true;render();
  try{
    const rn='bd-'+code.toLowerCase();
    const r=await (window.__NET?S.room.join(rn,{host:role==='board'}):S.room.join(rn));
    S.named=r;S.code=code;S.mode=role;S.myP={};S.G=null;S.joinedAt=Date.now();S.lastMain=null;
    if(role==='board'){
      setP({pid:myPid,board:true});
      S.myGame=resumeG?Object.assign(normG(resumeG),{v:(resumeG.v||1)+500}):newGame();
      commit(S.myGame);if(!S.usedLoaded)loadUsed();
    }else{
      setP({pid:myPid,name:myName});
      store.set('bd-session',JSON.stringify({role:'player',code}),1);
    }
    S.unsub=[r.onPeers(()=>{boardTick();render();}),r.onConnection(c=>{S.conn=c;render();})];
    boardTick();setTimeout(render,7000);
  }catch(e){const c=e&&e.code;
    if(c==='not_found'){S.err=`No game found for ${code}. Check the code on the main screen.`;store.del('bd-session',1);}
    else if(c==='id_taken')S.err='That room code is in use. Tap Start again for a new one.';
    else S.err=(e&&e.message&&window.__NET)?e.message:'Couldn\'t open the room ('+(c||'error')+'). Please try again.';}
  S.busy=false;render();
}
function resume(){
  if(S.mode||!S.room)return;
  let s=null;try{s=JSON.parse(store.get('bd-session',1)||'null')}catch(e){}
  if(!s||!/^[A-Z]{4}$/.test(s.code||''))return;
  if(s.role==='board')enterRoom(s.code,'board',s.g);
  else if(s.role==='player'&&myName&&(!S.hashCode||S.hashCode===s.code))enterRoom(s.code,'player');
}
function leave(){
  try{S.unsub.forEach(f=>f());}catch(e){}
  if(S.named)S.named.leave().catch(()=>{});
  store.del('bd-session',1);
  Object.assign(S,{mode:null,named:null,myGame:null,G:null,myP:{},confirm:null,lastMain:null});
  render();
}

/* ================= context ================= */
function ctx(){const st=onlineState();return Object.assign(st,{actor:S.mode==='player'?myPid:null,board:S.mode==='board'});}

/* ================= shared view helpers ================= */
const nm=(G,p)=>esc((G.names&&G.names[p])||'Someone');
const catOf=G=>CATS[G.cat]||CATS.word;
const joinUrl=()=>ART_URL+'#join-'+S.code.toLowerCase();
function qrImg(){
  const url=joinUrl();if(S.qr[url])return S.qr[url];
  try{if(typeof window.qrMatrix!=='function')return '';const m=window.qrMatrix(url),n=m.length,q=4;let d='';
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(m[y][x])d+=`M${x+q} ${y+q}h1v1h-1z`;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n+2*q} ${n+2*q}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#1f1b16"/></svg>`;
    return S.qr[url]='data:image/svg+xml;base64,'+btoa(svg);}catch(e){return ''}
}
const remain=G=>Math.max(0,(G.deadline||0)-Date.now());
const fmt=ms=>{const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
let WHEEL_SVG='';
function wheelSVG(){
  if(WHEEL_SVG)return WHEEL_SVG;const n=CAT_KEYS.length,R=100;let s='';
  CAT_KEYS.forEach((k,i)=>{const a0=(i*360/n-90)*Math.PI/180,a1=((i+1)*360/n-90)*Math.PI/180;
    s+=`<path class="s${i}" d="M${R},${R} L${(R+R*Math.cos(a0)).toFixed(2)},${(R+R*Math.sin(a0)).toFixed(2)} A${R},${R} 0 0 1 ${(R+R*Math.cos(a1)).toFixed(2)},${(R+R*Math.sin(a1)).toFixed(2)} Z"/>`;
    s+=`<g transform="rotate(${(i+.5)*360/n} ${R} ${R})"><text x="${R}" y="${R-56}" text-anchor="middle" font-size="24">${CATS[k].icon}</text><text class="l" x="${R}" y="${R-35}" text-anchor="middle" font-size="11">${CATS[k].label.toUpperCase()}</text></g>`;});
  for(let b=0;b<20;b++){const a=b*18*Math.PI/180;s+=`<circle class="bulb b${b%2}" cx="${(100+93*Math.sin(a)).toFixed(2)}" cy="${(100-93*Math.cos(a)).toFixed(2)}" r="3.4"/>`;}
  return WHEEL_SVG=`<svg viewBox="-4 -4 208 208" aria-hidden="true">${s}<circle class="hub" cx="100" cy="100" r="14"/></svg>`;
}
function spinElapsed(G){return G.spin?Math.max(0,Date.now()-G.spin.id):1e9;}
function wheel(G,idle){
  if(idle||!G.spin)return `<div class="wheel"><div class="pointer"></div><div class="wrot idle">${wheelSVG()}</div></div>`;
  const i=Math.max(0,CAT_KEYS.indexOf(G.spin.c));const rot=1800+(360-(i+.5)*360/CAT_KEYS.length);const el=spinElapsed(G);
  return `<div class="wheel" role="img" aria-label="Category wheel landing on ${esc(CATS[G.spin.c].label)}"><div class="pointer"></div><div class="wrot ${el<SPIN_MS?'spinning':''}" style="--rot:${rot}deg;--d:-${Math.min(el,SPIN_MS)}ms;transform:rotate(${rot}deg)">${wheelSVG()}</div></div>`;
}
const afterSpin=G=>`style="animation-delay:${G.spin?Math.max(0,SPIN_MS-spinElapsed(G)):0}ms"`;
function wordCard(G){const c=catOf(G);return `<div class="card center"><span class="eyebrow">Round ${G.round} · ${c.icon} ${c.label}</span><p class="muted small" style="margin:4px 0 0">${c.eyebrow}</p><div class="word ${G.cat==='law'?'long':''}">${esc(G.word)}</div></div>`}
function waitCard(t,sub){return `<div class="card center"><p class="def pulse" style="font-style:normal;font-weight:600">${t}</p>${sub?`<p class="muted small" style="margin:0">${sub}</p>`:''}</div>`}
function scoreList(G,d){
  const ps=G.order.slice().sort((a,b)=>(G.scores[b]||0)-(G.scores[a]||0));
  return `<ul class="plist">${ps.map(p=>`<li><span>${nm(G,p)}${p===myPid?' <span class="muted small">(you)</span>':''}${d&&d[p]?`<span class="plus">+${d[p]}</span>`:''}</span><span class="pts">${G.scores[p]||0}</span></li>`).join('')}</ul>`;
}
function howTo(){return `<details class="card how"><summary>How to play &amp; scoring</summary>
  <p>Open the game on a TV or laptop and tap <b>Start a game on this screen</b>. Everyone else scans the QR code with their phone.</p>
  <p>Pick a theme in the lobby: Classic '85, or a holiday look like Thanksgiving or Christmas.</p>
  <p>Players take turns <b>hosting</b> a round. The host picks a category, or spins the wheel, and secretly sees the real answer:</p>
  <ul><li>📖 <b>Word</b>: what does it mean?</li><li>🧑 <b>Person</b>: who were they?</li><li>🔤 <b>Initials</b>: what do they stand for?</li><li>🎬 <b>Movie</b>: what's the plot?</li><li>⚖️ <b>Law</b>: how does it end?</li></ul>
  <p>Everyone else gets 3 minutes to write a convincing bluff. The host can mark any that are basically right, then puts all the answers on the main screen, and everyone votes for the one they think is real.</p>
  <ul><li><b>+2</b> for voting for the real answer</li><li><b>+1</b> for every player your bluff fools</li><li><b>+3</b> if your answer was basically right</li><li><b>+3</b> to the host if nobody finds the real one</li></ul></details>`}

/* ================= phone views ================= */
function homeView(){
  const dis=(!S.roomReady||!S.room||S.busy)?'disabled':'';
  const note=!S.roomReady?'<p class="muted small center pulse" style="margin:0">Connecting…</p>':(!S.room?(window.__NET?'<p class="err" style="margin:0">Couldn\'t load the multiplayer connection. Check the internet connection and reload the page.</p>':'<p class="err" style="margin:0">Online play needs this page opened from its claude.ai link while signed in to Claude.</p>'):'');
  const joinCard=`<div class="card stack"><span class="eyebrow">📱 Join a game</span>
    <label class="eyebrow" for="nm" style="text-transform:none;letter-spacing:0;font-size:14px;color:var(--ink)">Your name</label><input id="nm" maxlength="18" autocomplete="nickname" placeholder="e.g. Nate">
    <div class="row"><input id="jc" data-draft="jc" class="code-in" maxlength="4" placeholder="CODE" autocapitalize="characters" autocomplete="off"><button class="accent" data-act="join" ${dis}>Join</button></div>${note}</div>`;
  const boardCard=`<div class="card stack"><span class="eyebrow">📺 Main screen</span><p class="muted small" style="margin:0">Open this on the laptop or TV everyone can see. It shows a QR code for players to join, and runs the game.</p><button class="${S.hashCode?'sec':'accent'}" data-act="board" ${dis}>Start a game on this screen</button></div>`;
  return `<div class="card"><span class="eyebrow">The totally radical bluffing game</span><h1>Balderdash</h1>
  <p class="muted" style="margin:0 0 14px">Bizarre words, people, initials, movies and laws. Everyone bluffs an answer, and you all vote on which one is real.</p>
  <div class="row"><button class="accent" data-act="tutorial">▶ 1-min tutorial</button><button class="sec" data-act="sim" ${S.roomReady?'':'disabled'}>🛋️ Test mode</button></div></div>
  ${S.err?`<div class="err">${esc(S.err)}</div>`:''}
  ${S.hashCode?joinCard+boardCard:boardCard+joinCard}${howTo()}
  ${`<div class="card stack"><span class="eyebrow">🛋️ Test it yourself</span><p class="muted small" style="margin:0">Opens a virtual living room with a TV and several phones on this one screen. Click into any device to play its role, or let it play itself.</p><button class="sec" data-act="sim" ${S.roomReady?'':'disabled'}>Open living room test mode</button></div>`}`;
}
function lobbyView(c){
  const G=c.G;const ps=presentOrder(G,c.present);const inG=G.order.includes(myPid);
  return `<div class="card center"><span class="eyebrow">Room ${esc(S.code)}</span><div class="word">${inG?`You're in, ${nm(G,myPid)}!`:'Joining…'}</div><p class="muted small" style="margin:0">Watch the main screen. When everyone's here, anyone can start.</p></div>
  <div class="card"><span class="eyebrow">Players (${ps.length})</span><ul class="plist">${ps.map(p=>`<li><span>${nm(G,p)}${p===myPid?' <span class="muted small">(you)</span>':''}</span></li>`).join('')}</ul></div>
  <div class="card stack"><span class="eyebrow">Theme · everyone sees it</span>${themePicker('ptheme')}</div>
  <button class="accent big" data-act="cmd" data-c="start" ${ps.length<3?'disabled':''}>Everyone's in. Start the game!</button>${ps.length<3?'<p class="muted small center">Need at least 3 players.</p>':''}${howTo()}`;
}
/* ---- round host console ---- */
function hostView(c){
  const G=c.G,cat=catOf(G),noun=cat.label.toLowerCase();
  const w=writersOf(G,c.present),v=votersOf(G,c.present);
  const top=`<div class="card hostcall marquee center"><span class="eyebrow">Round ${G.round} · You're the host</span><div class="word" style="color:#fff">🎤 Your round!</div></div>`;
  if(G.phase==='pick')return top+`<div class="card stack"><p style="margin:0">Spin the wheel or pick a category. You'll see the real answer, so keep it secret!</p>
    ${wheel(G,true)}<button class="accent big" data-act="cmd" data-c="spin">🎡 Spin the wheel</button>
    <span class="eyebrow center">or choose</span><div class="catgrid">${CAT_KEYS.map(k=>`<button data-act="cmd" data-c="cat" data-a="${k}">${CATS[k].icon} ${CATS[k].label}</button>`).join('')}</div></div>`;
  if(G.phase==='card'){
    const spun=!!G.spin;
    return top+(spun?`<div class="card center">${wheel(G)}</div>`:'')+`<div class="card secret stack after" ${afterSpin(G)}><span class="eyebrow">${cat.icon} ${cat.label} · only you can see this</span>
    <div class="word ${G.cat==='law'?'long':''}">${esc(G.word)}</div><p class="def">${esc(G.def)}</p>
    <button class="accent big" data-act="cmd" data-c="show">📺 Show question on screen</button>
    <div class="row"><button class="sec" data-act="cmd" data-c="redraw">Different card</button><button class="sec" data-act="cmd" data-c="spin">🎡 Spin again</button></div>
    <div class="catgrid">${CAT_KEYS.map(k=>`<button class="${k===G.cat?'on':''}" data-act="cmd" data-c="cat" data-a="${k}">${CATS[k].icon} ${CATS[k].label}</button>`).join('')}</div></div>`;}
  if(G.phase==='write'){
    const n=w.filter(p=>c.inp[p]&&c.inp[p].sub).length;
    return wordCard(G)+`<div class="card secret"><span class="eyebrow">${esc(cat.real)} · secret</span><p class="def">${esc(G.def)}</p></div>
    <div class="card"><span class="eyebrow">Locked in: ${n} of ${w.length}</span><p class="muted small" style="margin:4px 0 0">Tap <b>Correct</b> if someone basically nailed it. They get 3 points and sit out the vote.</p>
    ${w.map(p=>{const s=c.inp[p]&&c.inp[p].sub;return `<div class="lockrow"><span class="who">${s?'✅':'✍️'} ${nm(G,p)}</span><span class="ans">${s?esc(s):'<span class="muted" style="font-style:normal">writing…</span>'}</span>${s?`<button class="${S.marks[p]?'on':''}" data-act="mark" data-p="${esc(p)}">${S.marks[p]?'✓ Correct':'Correct?'}</button>`:''}</div>`}).join('')}</div>
    <button class="accent big" data-act="display">📺 Display answers on screen${n<w.length?` (${n}/${w.length})`:''}</button>
    <div class="row" style="margin-top:10px"><button class="sec" data-act="cmd" data-c="time">+30 seconds</button></div>`;}
  if(G.phase==='vote'){
    const n=v.filter(p=>c.inp[p]&&Number.isInteger(c.inp[p].vote)).length;
    return wordCard(G)+`<div class="card"><span class="eyebrow">Votes in: ${n} of ${v.length}</span><div class="chips" style="margin-top:8px">${v.map(p=>{const d=c.inp[p]&&Number.isInteger(c.inp[p].vote);return `<span class="chip ${d?'done':''}">${nm(G,p)}${d?' ✓':''}</span>`}).join('')}</div></div>
    <button class="accent big" data-act="cmd" data-c="reveal">📺 Reveal the votes</button>
    <div class="card stack"><span class="eyebrow">On screen now</span>${G.opts.map((o,i)=>`<div class="opt ${o.a==='*'?'real':''}"><span class="n">${i+1}</span>${esc(o.t)}<span class="tag">${o.a==='*'?'✓ Real answer':'Bluff by '+nm(G,o.a)}</span></div>`).join('')}</div>`;}
  if(G.phase==='reveal'){
    const mx=Math.max(0,...Object.values(G.scores));
    const btn=G.step===1?'<button class="accent big" data-act="cmd" data-c="step">📺 Reveal who wrote each</button>'
      :G.step===2?'<button class="accent big" data-act="cmd" data-c="step">📺 End round &amp; show scores</button>'
      :`<button class="accent big" data-act="cmd" data-c="next">${mx>=G.target?'🏆 Show final results':'➡️ Pass to the next host'}</button>`;
    return btn+revealView(c,true);}
  return '';
}
function voteView(c,canVote){
  const G=c.G,a=c.actor;const mine=c.inp[a]&&c.inp[a].vote;const sel=S.voteSel!=null?S.voteSel:mine;
  let foot='';
  if(canVote){const locked=Number.isInteger(mine)&&mine===sel;
    foot=locked?`<p class="center ok" style="font-weight:700;margin:4px 0">Vote locked in ✓</p><p class="muted small center" style="margin:0">You can switch until the host reveals the votes.</p>`
      :`<button class="accent big" data-act="lockvote" ${sel==null?'disabled':''}>Lock in vote</button>`;}
  else if(G.closed.includes(a))foot='<p class="muted center">You nailed it, so you sit this vote out. +3 coming your way.</p>';
  else foot='<p class="muted center">You\'ll be dealt in next round.</p>';
  return `<div class="card stack"><span class="eyebrow">${canVote?'Which one is real?':'The answers'}</span>
  ${G.opts.map((o,i)=>{const own=o.a===a;return `<button class="opt ${sel===i&&canVote?'sel':''} ${own?'mine':''}" ${(!canVote||own)?'disabled':''} data-act="pickopt" data-i="${i}"><span class="n">${i+1}</span>${esc(o.t)}${own?'<span class="tag">Yours</span>':''}</button>`}).join('')}
  ${foot}</div>`;
}
function revealView(c,isHost){
  const G=c.G;const st=G.step||1;const d=deltas(G);
  const voters=i=>Object.keys(G.votes).filter(p=>G.votes[p]===i);
  let items=G.opts.map((o,i)=>({o,i,vs:voters(i)}));
  if(st>=3)items.sort((x,y)=>(y.o.a==='*')-(x.o.a==='*')||y.vs.length-x.vs.length);
  const found=items.some(x=>x.o.a==='*'&&x.vs.length);
  let html=`<div class="card"><span class="eyebrow">${['','How everyone voted','Who wrote what','Round results'][Math.min(st,3)]}</span>`;
  html+=items.map(({o,i,vs})=>{const real=o.a==='*';const showA=st>=2;const meta=[];
    if(showA)meta.push(real?`<b class="ok">✓ ${esc(catOf(G).real)}</b>`:`Bluff by <b>${nm(G,o.a)}</b>`);
    meta.push(vs.length?`${showA?(real?'Found by':'Fooled'):'Votes:'} ${vs.map(p=>`<b>${nm(G,p)}</b>`).join(', ')}`:'No votes');
    return `<div class="rv ${showA&&real?'real':''}"><p class="def" style="margin:0 0 6px"><span class="muted small" style="font-style:normal;font-weight:700;margin-right:6px">${i+1}</span>${esc(o.t)}</p><div class="meta">${meta.join(' · ')}</div></div>`}).join('');
  if(st>=2){html+=G.closed.map(p=>`<div class="rv real"><p class="def" style="margin:0 0 6px">${esc(G.closedT[p]||'')}</p><div class="meta"><b>${nm(G,p)}</b> basically nailed it · +3</div></div>`).join('');
    if(!found&&!G.closed.length)html+=`<p class="center" style="font-weight:700">Nobody found it! ${nm(G,G.dasher)} (host) scores +3.</p>`;}
  html+='</div>';
  if(st>=3)html+=`<div class="card"><span class="eyebrow">Scores</span>${scoreList(G,d)}</div>`;
  if(!isHost)html+=waitCard(st<3?'👀 Watch the main screen!':`Waiting for ${nm(G,G.dasher)} to pass to the next host…`);
  return html;
}
function finalView(c){
  const G=c.G;const mx=Math.max(0,...G.order.map(p=>G.scores[p]||0));const win=G.order.filter(p=>(G.scores[p]||0)===mx);
  return `<div class="card center"><div style="font-size:54px;line-height:1">🏆</div><span class="eyebrow">${win.length>1?'Tie game':'Winner'}</span><div class="word">${win.map(p=>nm(G,p)).join(' &amp; ')}</div><p class="muted" style="margin:0">${mx} points</p></div>
  <div class="card"><span class="eyebrow">Final scores</span>${scoreList(G)}</div><p class="muted small center">The main screen can start a new game.</p>`;
}
function playerView(c){
  const G=c.G,a=myPid,ph=G.phase;const inGame=G.order.includes(a);const isH=a===G.dasher;const dn=nm(G,G.dasher);const cat=catOf(G);
  if(ph==='lobby')return lobbyView(c);
  if(ph==='final')return finalView(c);
  if(isH)return hostView(c);
  if(ph==='pick')return waitCard(`🎤 ${dn} is hosting round ${G.round}`,'They\'re choosing a category…');
  if(ph==='card')return waitCard(`🎤 ${dn} picked ${cat.icon} ${cat.label}`,'The question is about to appear on the main screen.');
  if(ph==='write'){
    if(!inGame)return wordCard(G)+waitCard('Players are writing…','You\'ll be dealt in next round.');
    const mine=c.inp[a]&&c.inp[a].sub;const up=remain(G)<=0;
    if(mine&&!S.editing)return wordCard(G)+`<div class="card stack"><span class="eyebrow">Your answer · locked in ✓</span><p class="def">${esc(tidy(mine,G.cat,G.word))}</p>${up?'':'<button class="sec" data-act="edit">Edit</button>'}</div>`+waitCard('Waiting for the others…');
    if(up)return wordCard(G)+waitCard('⏰ Time\'s up!','Watch the main screen.');
    return wordCard(G)+`<div class="card stack"><label class="eyebrow" for="sub">${esc(cat.prompt)}</label><textarea id="sub" data-draft="sub" maxlength="160" placeholder="${esc(cat.ph)}"></textarea><div class="muted small"><span id="subn">0</span>/160 · ${esc(cat.hint)}</div><button class="accent big" data-act="submit">Lock in my answer</button></div>`+formatGuide(G);
  }
  if(ph==='vote')return wordCard(G)+voteView(c,inGame&&!G.closed.includes(a));
  if(ph==='reveal')return revealView(c,false);
  return '';
}
function phoneStatus(c){
  const G=c.G;if(!G||G.phase==='lobby')return '';
  let html='';
  if(G.phase==='write'){const r=remain(G);html+=`<div class="tbar marquee ${r<=30000?'low':''}"><span>${r>0?'⏱ Time left':'⏰ Time\'s up!'}</span><span class="t">${fmt(r)}</span></div>`;}
  html+=`<div class="chips">${G.order.map(p=>{
    const here=c.present.has(p);let mark='',done=false;
    if(p===G.dasher&&G.phase!=='final')mark='🎤';
    else if(G.phase==='write')done=!!(c.inp[p]&&c.inp[p].sub);
    else if(G.phase==='vote')done=G.closed.includes(p)||!!(c.inp[p]&&Number.isInteger(c.inp[p].vote));
    return `<span class="chip ${done?'done':''} ${here?'':'away'}">${mark}${nm(G,p)}${p===myPid?' (you)':''} <b>${G.scores[p]||0}</b>${done?' ✓':''}</span>`;}).join('')}</div>`;
  return html;
}
function noGameView(){
  if(S.G)return waitCard('Lost the main screen…','Waiting for it to reconnect.')+'<button class="ghost" data-act="leave">Leave game</button>';
  if(Date.now()-S.joinedAt<6500)return waitCard(`Looking for room ${esc(S.code)}…`);
  return `<div class="card center stack"><p class="def" style="font-style:normal;font-weight:600">No game found for ${esc(S.code)}.</p><p class="muted small">Check the code on the main screen.</p><button class="sec" data-act="leave">Back</button></div>`;
}

/* ================= main screen views ================= */
function bdChip(G,p,cls){return `<span class="bd-chip ${cls||''}">${nm(G,p)}</span>`}
function bdScores(G,d,cls,c){
  const ps=G.order.slice().sort((a,b)=>(G.scores[b]||0)-(G.scores[a]||0));
  return `<ol class="bd-scores ${cls||''}">${ps.map((p,i)=>{let mark='';
    if(c){if(p===G.dasher&&!['final','lobby'].includes(G.phase))mark='🎤';
      else if(G.phase==='write'&&c.inp[p]&&c.inp[p].sub)mark='✓';
      else if(G.phase==='vote'&&c.inp[p]&&Number.isInteger(c.inp[p].vote))mark='✓';}
    return `<li class="${c&&!c.present.has(p)?'away':''}"><span class="r">${i+1}</span><span class="nm">${nm(G,p)} <span class="mk">${mark}</span>${d&&d[p]?`<span class="plus">+${d[p]}</span>`:''}</span><span class="pts">${G.scores[p]||0}</span></li>`}).join('')}</ol>`;
}
function boardView(c){
  const G=c.G;const cat=catOf(G);const dn=nm(G,G.dasher);const st=G.step||0;
  const k=[G.round,G.phase,st,G.cardKey].join('|');const A=k!==S.bAnimKey?'anim':'';
  if(A&&S.bAnimKey&&((G.phase==='reveal'&&st>=3)||G.phase==='final'))setTimeout(burst,60);S.bAnimKey=k;
  const top=`<div class="bd-top"><div class="bd-logo"><span class="logo">${logoHTML(G.theme)}</span></div><div class="bd-meta">${G.round&&!['lobby','final'].includes(G.phase)?`Round ${G.round}${['write','vote','reveal'].includes(G.phase)?` · ${cat.icon} ${cat.label}`:''}`:''}</div><div class="bd-code">Room <b>${esc(S.code)}</b><button class="ghost" data-act="fs" aria-label="Toggle fullscreen">⛶</button><button class="ghost" data-act="bleave" aria-label="Close game">${S.confirm==='bleave'?'Tap again to close':'✕'}</button></div></div>`;
  const wordBlock=size=>`<div class="bd-kicker">${esc(cat.eyebrow)}</div><div class="bd-word ${size||''} ${G.cat==='law'?'long':''}">${esc(G.word)}</div>`;
  const prog=(list,isDone)=>`<div class="bd-prog">${list.map(p=>bdChip(G,p,isDone(p)?'done':'')).join('')}</div>`;
  const ps=presentOrder(G,c.present);
  let stage='',side=true;
  switch(G.phase){
    case 'lobby':{side=false;const q=qrImg();const ds=deckStats();
      stage=`<div class="bd-lobby ${A}"><div class="bd-qr">${q?`<img src="${q}" alt="QR code to join room ${esc(S.code)}">`:`<div class="bd-sub" style="width:calc(var(--u)*30)">${esc(joinUrl())}</div>`}<p class="bd-sub">Scan with your phone camera</p></div>
      <div class="bd-center" style="align-items:flex-start;text-align:left;gap:calc(var(--u)*1.1)"><div class="bd-bigcode marquee" aria-label="Room code">${esc(S.code)}</div>
      <p class="bd-sub">Scan the QR code, or tap <b>Join a game</b> and enter the code</p>
      <div class="bd-prog big" style="justify-content:flex-start">${ps.map(p=>bdChip(G,p,'done')).join('')||'<span class="bd-sub pulse">Waiting for players…</span>'}</div>
      <div class="bd-ctrls"><label>Play to <select data-change="target">${[10,15,20,25,30].map(x=>`<option value="${x}" ${x===G.target?'selected':''}>${x} points</option>`).join('')}</select></label>
      <label>Timer <select data-change="tlen">${[60,90,120,180,240,300].map(x=>`<option value="${x}" ${x===G.tlen?'selected':''}>${fmt(x*1000)}</option>`).join('')}</select></label>
      <button class="accent" data-act="bstart" ${ps.length<3?'disabled':''}>Start game</button><button class="sec" data-act="tutorial">▶ How to play</button><button class="sec" data-act="bsim">${S.confirm==='bsim'?'Tap again: close room &amp; test':'🛋️ Test mode'}</button></div>
      ${themePicker('settheme','bd-themes')}
      <p class="bd-sub small">${ps.length<3?`Need at least 3 players (${ps.length} joined) · `:''}${ds.left} of ${ds.total} cards still unplayed</p></div></div>`;break;}
    case 'pick':stage=`<div class="bd-center ${A}"><div class="bd-kicker">Round ${G.round}</div><div class="bd-head">🎤 ${dn} is hosting</div>${wheel(G,true)}<p class="bd-sub pulse">Choosing a category…</p></div>`;break;
    case 'card':{const spun=!!G.spin;
      stage=`<div class="bd-center ${A}"><div class="bd-kicker">Round ${G.round} · 🎤 ${dn} is hosting</div>${spun?wheel(G):`<div class="bd-icon">${cat.icon}</div>`}<div class="bd-head after" ${afterSpin(G)}>${esc(cat.label)}!</div><p class="bd-sub pulse after" ${afterSpin(G)}>Get your phones ready…</p></div>`;break;}
    case 'write':{const w=writersOf(G,c.present);const r=remain(G);const pct=Math.min(100,r/(G.tlen*10));const low=r<=30000;
      stage=`<div class="bd-center ${A}"><div class="bd-panel marquee">${wordBlock()}</div><p class="bd-sub">${esc(cat.prompt)} on your phone</p>
      <div class="bd-timer marquee ${r<=0?'up':low?'low':''}">${r>0?fmt(r):'TIME\'S UP!'}</div><div class="bd-tbar ${low?'low':''}"><i style="width:${pct}%"></i></div>
      ${prog(w,p=>c.inp[p]&&c.inp[p].sub)}<p class="bd-sub small">${w.filter(p=>c.inp[p]&&c.inp[p].sub).length} of ${w.length} locked in</p></div>`;break;}
    case 'vote':case 'reveal':{
      if(G.phase==='reveal'&&st>=3){side=false;const d=deltas(G);stage=`<div class="bd-center ${A}"><div class="applause">APPLAUSE</div><div class="bd-kicker">Round ${G.round} results</div><div class="bd-head">${Object.keys(d).length?'Points this round':'No points this round'}</div>${bdScores(G,d,'wide')}</div>`;break;}
      const voters=i=>Object.keys(G.votes).filter(p=>G.votes[p]===i);
      const extra=G.phase==='reveal'&&st>=2?G.closed.length:0;const n=G.opts.length+extra;
      const cols=n<=2?1:n<=4?2:3;const fs=n<=2?2.3:n<=4?1.8:n<=6?1.38:n<=9?1.2:1.08;
      let cards=G.opts.map((o,i)=>{const real=o.a==='*';const vs=G.phase==='reveal'?voters(i):[];
        const showV=G.phase==='reveal'&&st>=1,showA=G.phase==='reveal'&&st>=2;
        return `<div class="bd-card ${showA&&real?'real':''} ${A&&G.phase==='reveal'&&st===2?'flip':A}" style="--i:${i}"><div class="bd-num">${i+1}</div><div class="bd-body"><div class="bd-txt">${esc(o.t)}</div>
        ${showV?`<div class="bd-votes">${vs.length?vs.map(p=>bdChip(G,p,'v')).join(''):'<span class="bd-none">No votes</span>'}</div>`:''}
        ${showA?`<div class="bd-who">${real?'✓ The real answer':`Bluff by <b>${nm(G,o.a)}</b>${vs.length?` · fooled ${vs.length}`:''}`}</div>`:''}</div></div>`}).join('');
      if(extra)cards+=G.closed.map((p,j)=>`<div class="bd-card real ${A&&st===2?'flip':A}" style="--i:${G.opts.length+j}"><div class="bd-num">✓</div><div class="bd-body"><div class="bd-txt">${esc(G.closedT[p]||'')}</div><div class="bd-who"><b>${nm(G,p)}</b> basically nailed it · +3</div></div></div>`).join('');
      let foot='';
      if(G.phase==='vote'){const v=votersOf(G,c.present);foot=`<div class="bd-foot"><span>Vote on your phone for the real answer</span>${prog(v,p=>c.inp[p]&&Number.isInteger(c.inp[p].vote))}</div>`;}
      else{const found=G.opts.some((o,i)=>o.a==='*'&&voters(i).length);
        foot=`<div class="bd-foot">${st===1?'Here’s how everyone voted…':(!found&&!G.closed.length?`Nobody found it! ${dn} (host) scores +3`:'Who wrote what')}</div>`;}
      stage=`<div class="bd-q bd-panel sm marquee">${wordBlock('sm')}</div><div class="bd-grid" style="--cols:${cols};--fs:${fs}">${cards}</div>${foot}`;break;}
    case 'final':{side=false;const mx=Math.max(0,...G.order.map(p=>G.scores[p]||0));const win=G.order.filter(p=>(G.scores[p]||0)===mx);
      stage=`<div class="bd-center ${A}"><div class="applause">APPLAUSE</div><div class="bd-icon">🏆</div><div class="bd-kicker">${win.length>1?'It’s a tie!':'The winner is'}</div><div class="bd-word">${win.map(p=>nm(G,p)).join(' &amp; ')}</div><p class="bd-sub">${mx} points</p>${bdScores(G,null,'wide')}
      <div class="bd-ctrls"><button class="accent" data-act="bagain">Play again</button></div></div>`;break;}
  }
  const q=side?qrImg():'';
  const sideHtml=side?`<aside class="bd-side marquee"><div class="bd-kicker">Scores</div>${bdScores(G,null,'',c)}
    <div class="bd-sidefoot">${q?`<img src="${q}" alt="QR code to join">`:''}<span class="lbl">First to ${G.target} · Scan to join</span>
    <select data-change="theme" aria-label="Theme">${THEME_KEYS.map(t=>`<option value="${t}" ${t===G.theme?'selected':''}>${THEMES[t].icon} ${esc(THEMES[t].label)}</option>`).join('')}</select>
    <div><button class="ghost" data-act="bskip">${S.confirm==='bskip'?'Tap again to skip':'Skip host'}</button> <button class="ghost" data-act="bend">${S.confirm==='bend'?'Tap again to end':'End game'}</button></div></div></aside>`:'';
  return `<div class="bd ${side?'':'noside'}"><div class="bd-main">${top}<div class="bd-stage">${stage}</div></div>${sideHtml}</div>`;
}
function boardWait(){
  const t=Date.now()-S.joinedAt<6500?'Setting up…':'Reconnecting…';
  return `<div class="bd noside"><div class="bd-main"><div class="bd-top"><div class="bd-logo"><span class="logo">${logoHTML(S.theme)}</span></div><div></div><div class="bd-code"><button class="ghost" data-act="leave">✕ Close</button></div></div><div class="bd-stage"><div class="bd-center"><div class="bd-head pulse">${t}</div></div></div></div></div>`;
}

/* ================= themes ================= */
const logoHTML=t=>`<span class="sign marquee"><b>BALDERDASH</b></span><i>${esc((THEMES[t]||THEMES.classic).tag)}</i>`;
const DECO_SPOTS=[[2,24,7,0],[94,22,6,1.3],[5,52,5,2.1],[95,54,6,.6],[3,84,6,3.2],[92,86,5,1.8],[24,93,4,2.6],[48,95,5,.9],[72,93,4,1.1]];
function sceneHTML(t){const th=THEMES[t]||THEMES.classic;
  return `<div class="rays"></div><div class="spot l"></div><div class="spot r"></div><div class="floor"></div>${th.snow?'<div class="snow"></div>':''}`+
    DECO_SPOTS.map(([x,y,sz,dl],i)=>`<div class="deco" style="left:${x}%;top:${y}%;--s:${sz}vmin;--dl:-${dl}s">${th.deco[i%th.deco.length]}</div>`).join('');}
function applyTheme(t){
  if(!THEMES[t])t='classic';if(S.theme===t)return;S.theme=t;
  document.body.dataset.theme=t;$('#scene').innerHTML=sceneHTML(t);$('#logo').innerHTML=logoHTML(t);
  if(S.mode==='board')store.set('bd-theme',t);
}
function burst(){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const th=THEMES[S.theme]||THEMES.classic;const fx=$('#fx');let h='';
  for(let i=0;i<36;i++)h+=`<div class="bit" style="left:${Math.random()*100}%;--s:${(2.5+Math.random()*3.5).toFixed(1)}vmin;--t:${(2.6+Math.random()*2).toFixed(2)}s;--dl:${(Math.random()*1.2).toFixed(2)}s;--r:${Math.round(Math.random()*720-360)}deg">${th.burst[i%th.burst.length]}</div>`;
  fx.innerHTML=h;clearTimeout(S.burstT);S.burstT=setTimeout(()=>{fx.innerHTML=''},6000);
}
function themePicker(act,cls){const cur=S.theme;return `<div class="${cls||'themes'}">${THEME_KEYS.map(k=>`<button class="${k===cur?'on':''}" data-act="${act}" data-t="${k}" aria-pressed="${k===cur}">${THEMES[k].icon} ${esc(THEMES[k].label)}</button>`).join('')}</div>`;}

/* ================= render ================= */
function header(){
  if(S.mode==='player')return `<span class="conn ${S.conn?'':'off'}" title="${S.conn?'Connected':'Reconnecting'}"></span><span>Room <b>${esc(S.code)}</b></span><button class="ghost" data-act="pleave">${S.confirm==='pleave'?'Tap again to leave':'Leave'}</button>`;
  return '';
}
function render(){
  if(S.mode==='sim')return;
  document.body.classList.toggle('board',S.mode==='board');
  {const G=S.mode==='board'?S.myGame:S.mode==='player'?S.G:null;applyTheme(G&&G.theme?G.theme:(store.get('bd-theme')||'classic'));}
  let main,status='';
  if(!S.mode)main=homeView();
  else{
    const c=ctx();
    if(S.mode==='board')main=c.G?boardView(c):boardWait();
    else if(!c.G)main=noGameView();
    else{
      const G=c.G;const key=[G.round,G.phase,G.dasher===myPid].join('|');
      if(key!==S.draftKey){S.draftKey=key;S.drafts={};S.editing=false;S.voteSel=null;if(G.phase!=='write')S.marks={};}
      main=playerView(c);status=phoneStatus(c);
    }
  }
  $('#hdr').innerHTML=header();
  if(main!==S.lastMain){
    const ae=document.activeElement;const fid=ae&&ae.id;let ss=null,se=null;try{ss=ae.selectionStart;se=ae.selectionEnd}catch(e){}
    $('#main').innerHTML=main;S.lastMain=main;
    document.querySelectorAll('[data-draft]').forEach(el=>{el.value=S.drafts[el.dataset.draft]||''});
    const nmEl=$('#nm');if(nmEl)nmEl.value=myName;
    const sn=$('#subn');if(sn)sn.textContent=(S.drafts.sub||'').length;
    if(fid){const el=document.getElementById(fid);if(el){el.focus({preventScroll:true});try{if(ss!=null)el.setSelectionRange(ss,se)}catch(e){}}}
  }
  $('#status').innerHTML=status;
}
setInterval(()=>{const G=S.mode==='board'?S.myGame:S.G;if(G&&(G.phase==='write'||(G.phase==='card'&&G.spin&&spinElapsed(G)<SPIN_MS+1000)))render();},500);

/* ================= events ================= */
function needName(){myName=(myName||'').trim();if(!myName){S.err='Enter your name first.';render();const e=$('#nm');if(e)e.focus();return false}store.set('bd-name',myName);return true}
function twoTap(k,fn){if(S.confirm!==k){S.confirm=k;render();return}S.confirm=null;fn();}
const H={
  board(){const code=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random()*24)]).join('');enterRoom(code,'board')},
  join(){if(!needName())return;const code=(S.drafts.jc||'').trim().toUpperCase();if(!/^[A-Z]{4}$/.test(code)){S.err='Enter the 4-letter room code from the main screen.';render();return}enterRoom(code,'player')},
  leave(){leave()},
  pleave(){twoTap('pleave',leave)},
  bleave(){twoTap('bleave',leave)},
  fs(){try{const d=document;if(d.fullscreenElement)d.exitFullscreen().catch(()=>{});else d.documentElement.requestFullscreen().catch(()=>{});}catch(e){}},
  cmd(b){sendCmd(b.dataset.c,b.dataset.a)},
  display(){const c=ctx();const close=Object.keys(S.marks).filter(k=>S.marks[k]&&c.inp[k]&&c.inp[k].sub);sendCmd('display',{close})},
  mark(b){const p=b.dataset.p;S.marks[p]=!S.marks[p];render()},
  submit(){const t=(S.drafts.sub||'').trim();if(!t)return;S.editing=false;const G=S.G;if(!G)return;setP({sub:{r:G.round,t}});render()},
  edit(){const c=ctx();S.editing=true;S.drafts.sub=(c.inp[myPid]&&c.inp[myPid].sub)||'';S.lastMain=null;render()},
  pickopt(b){S.voteSel=+b.dataset.i;render()},
  lockvote(){if(S.voteSel==null||!S.G)return;setP({vote:{r:S.G.round,i:S.voteSel}});render()},
  settheme(b){const t=b.dataset.t;if(!THEMES[t])return;store.set('bd-theme',t);boardAct(g=>{g.theme=t})},
  ptheme(b){if(THEMES[b.dataset.t])sendCmd('theme',b.dataset.t)},
  bsim(){twoTap('bsim',()=>{leave();H.sim();})},
  bstart(){boardAct((g,inp,present)=>{if(presentOrder(g,present).length>=3){g.order=presentOrder(g,present);startRound(g,inp,present);}})},
  bskip(){twoTap('bskip',()=>boardAct((g,inp,present)=>{if(g.phase!=='lobby'&&g.phase!=='final')startRound(g,inp,present);}))},
  bend(){twoTap('bend',()=>boardAct(g=>{g.phase='final'}))},
  bagain(){boardAct(g=>{for(const p of g.order)g.scores[p]=0;g.dasher=null;g.phase='lobby';g.word='';g.def='';g.opts=[];g.votes={};g.closed=[];g.closedT={};g.step=0;g.scored=false;g.spin=null;})},
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const f=H[b.dataset.act];if(f){e.preventDefault();f(b)}});
document.addEventListener('input',e=>{const el=e.target;
  if(el.id==='nm'){myName=el.value;return}
  if(el.dataset.draft){S.drafts[el.dataset.draft]=el.value;if(el.dataset.draft==='sub'){const n=$('#subn');if(n)n.textContent=el.value.length}}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.change==='target')boardAct(g=>{g.target=+el.value});
  if(el.dataset.change==='tlen')boardAct(g=>{g.tlen=+el.value});
  if(el.dataset.change==='theme'&&THEMES[el.value]){store.set('bd-theme',el.value);boardAct(g=>{g.theme=el.value});}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='jc')H.join();});
window.__game={H,S,ctx,get pid(){return myPid},setName(n){myName=n},leave};
render();
