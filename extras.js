/* Balderdash extras: living-room test mode + narrated tutorial. Loaded only by the real page. */

/* ================= shared page shell (used for simulated devices) ================= */
function shellHTML(prelude){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><base href="${esc(document.baseURI)}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Mr+Dafoe&family=VT323&family=Rubik:ital,wght@0,400;0,500;0,700;0,800;1,400;1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="game.css">${prelude}</head>
<body data-theme="classic"><div id="scene" aria-hidden="true"></div><div id="fx" aria-hidden="true"></div>
<div class="wrap"><header><div class="logo" id="logo"></div><div class="hdr-r" id="hdr"></div></header><div id="status"></div><main id="main"></main></div>
<script src="qr.js"><\/script><script src="cards.js"><\/script><script src="game.js"><\/script></body></html>`;
}

/* ================= fake multiplayer hub (all devices live in this page) ================= */
const HUB={members:[],seq:0,pending:false};
function hubNotify(){
  if(HUB.pending)return;HUB.pending=true;
  setTimeout(()=>{HUB.pending=false;for(const m of HUB.members.slice())for(const f of m.fns.slice())try{f({})}catch(e){console.error(e)}},40);
}
function hubClient(label){
  const me={label,peer:'sim-'+label+'-'+(++HUB.seq),presence:Object.freeze({}),updatedAt:0,fns:[]};
  const named={
    name:'sim',
    presence(p){const o=Object.assign({},me.presence);for(const k in p){if(p[k]===null)delete o[k];else o[k]=p[k];}
      const txt=JSON.stringify(o);if(txt.length>4096)return Promise.reject({code:'invalid_argument',message:'presence over 4 KiB'});
      me.presence=Object.freeze(JSON.parse(txt));me.updatedAt=Date.now()+(++HUB.seq)/1000;hubNotify();return Promise.resolve();},
    peers(){return HUB.members.map(m=>Object.freeze({peer:m.peer,by:null,isMe:m===me,sameTab:m===me,kind:'viewer',guest:false,presence:m.presence,updatedAt:m.updatedAt}));},
    onPeers(f){me.fns.push(f);return()=>{me.fns=me.fns.filter(x=>x!==f)}},
    onConnection(f){setTimeout(()=>f(true),0);return()=>{}},
    connected(){return true},
    emit(){return Promise.resolve()},on(){return()=>{}},
    leave(){HUB.members=HUB.members.filter(m=>m!==me);me.fns=[];hubNotify();return Promise.resolve();}
  };
  return {join(){if(!HUB.members.includes(me))HUB.members.push(me);hubNotify();return Promise.resolve(named);},peers(){return []},onPeers(){return()=>{}}};
}
window.__simHub={client:hubClient};

/* ================= living room test mode ================= */
const SIM_NAMES=['Nate','Sarah','Mike','Jess','Tom','Amy','Ben','Kim'];
const SIM={tv:null,phones:[],focus:null,auto:null,code:'',timer:null};
const BLUFFS={
  word:['A small brass tool used to trim candle wicks.','An old Scottish word for a muddy footpath.','The fear of running out of snacks.','A medieval tax on chimneys.','To hum loudly while pretending to work.','A type of Dutch pancake folded into quarters.'],
  person:['A Victorian inventor who patented the first toaster.','A Danish sailor who crossed the Atlantic in a bathtub.','The first woman to win a pie-eating contest in Ohio.','A Hollywood stuntman who jumped over 17 school buses.','A 1920s chef who invented the club sandwich.'],
  initials:['Saturday Club of Ultra Bored Adults.','National Association of Sandwich Critics.','Really Expensive Indoor Furniture.','Totally Awesome Snack Emporium.','Global Organization for Better Biscuits.'],
  movie:['A small-town sheriff discovers the local bowling league is run by werewolves.','Two rival lighthouse keepers fall in love during a 40-day storm.','A retired astronaut trains a team of competitive sheepdogs.','A haunted vending machine terrorizes a high school.','A mime is framed for a crime he could not describe.'],
  law:['juggle in a public library.','own more than three garden gnomes.','whistle on Sundays after noon.','paint your house purple without a permit.','sing in the shower after 10 p.m.']
};
const rnd=a=>a[Math.floor(Math.random()*a.length)];

function simDevice(kind,label){
  const W=kind==='tv'?1920:390,Hh=kind==='tv'?1080:800;
  const el=document.createElement('div');el.className='dev '+kind;
  el.innerHTML=`<div class="dev-label"><span class="nm">${esc(label)}</span><span class="role"></span></div>
    <div class="screen"><iframe title="${esc(label)}" width="${W}" height="${Hh}"></iframe></div>
    <button class="dev-ctl" type="button">🔍 Control</button>`;
  const fr=el.querySelector('iframe');
  const prelude=`<script>window.__SIM=true;window.__JOIN_BASE=window.parent.__JOIN_BASE;(function(){var P=window.parent,c=P.__simHub.client(${JSON.stringify(label)});
    window.claude={use:function(n){return Promise.resolve(n==='room'?c:null)}};
    function mk(){var d={};return {getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]}}}
    window.__simLS=mk();window.__simSS=mk();})();<\/script>`;
  fr.srcdoc=shellHTML(prelude);
  const dev={kind,label,el,fr,W,H:Hh,get g(){try{return fr.contentWindow&&fr.contentWindow.__game}catch(e){return null}}};
  el.querySelector('.dev-ctl').addEventListener('click',e=>{e.stopPropagation();simFocus(SIM.focus===dev?null:dev);});
  el.querySelector('.dev-label').addEventListener('click',()=>simFocus(SIM.focus===dev?null:dev));
  return dev;
}
const waitFor=(fn,ms=8000)=>new Promise((res,rej)=>{const t0=Date.now();(function chk(){let v;try{v=fn()}catch(e){}if(v)return res(v);if(Date.now()-t0>ms)return rej(new Error('timeout'));setTimeout(chk,80)})();});

function openSim(){
  S.mode='sim';S.lastMain=null;document.body.classList.add('sim');document.body.classList.remove('board');
  $('#hdr').innerHTML='';$('#status').innerHTML='';
  $('#main').innerHTML=`<div class="sim-top"><div><span class="eyebrow">🛋️ Living room test mode</span><div class="sim-title">Every device below is a live copy of the game</div>
    <p class="sim-help">Tap <b>🔍 Control</b> on any device to bring it up close and play that role. Or tap <b>Next step</b> to have the right person act, or <b>Auto-play</b> to watch a whole game.</p></div>
    <div class="sim-btns"><button class="accent" data-act="simstep">⏭ Next step</button><button class="sec" data-act="simauto" id="simauto">▶ Auto-play</button>
    <button class="sec" data-act="simadd">＋ Phone</button><button class="sec" data-act="simrm">－ Phone</button><button class="sec" data-act="simexit">✕ Exit</button></div></div>
    <div class="sim-status" id="simstatus" aria-live="polite">Setting up the living room…</div>
    <div class="room" id="room"><div class="tvwrap" id="tvwrap"></div><div class="couch" id="couch"></div></div>
    <div class="sim-backdrop" id="simbd"></div>`;
  $('#simbd').addEventListener('click',()=>simFocus(null));
  SIM.phones=[];SIM.focus=null;
  SIM.tv=simDevice('tv','📺 TV · main screen');$('#tvwrap').appendChild(SIM.tv.el);
  simLayout();
  SIM.tv.fr.addEventListener('load',async()=>{
    try{const g=await waitFor(()=>SIM.tv.g&&SIM.tv.g.S.roomReady&&SIM.tv.g);g.H.board();
      SIM.code=await waitFor(()=>g.S.code);for(let i=0;i<4;i++)simAddPhone();}
    catch(e){$('#simstatus').textContent='Could not start the simulated TV. Try reopening test mode.';}
  },{once:true});
  clearInterval(SIM.timer);SIM.timer=setInterval(simLabels,400);
  window.addEventListener('resize',simLayout);
}
function simAddPhone(){
  if(SIM.phones.length>=8||!SIM.code)return;
  const name=SIM_NAMES.find(n=>!SIM.phones.some(p=>p.label===n))||('P'+(SIM.phones.length+1));
  const dev=simDevice('phone',name);SIM.phones.push(dev);$('#couch').appendChild(dev.el);simLayout();
  dev.fr.addEventListener('load',async()=>{try{const g=await waitFor(()=>dev.g&&dev.g.S.roomReady&&dev.g);g.setName(name);g.S.drafts.jc=SIM.code;g.H.join();}catch(e){}},{once:true});
}
function simRemovePhone(){
  const dev=SIM.phones.pop();if(!dev)return;if(SIM.focus===dev)simFocus(null);
  try{dev.g&&dev.g.leave();}catch(e){}dev.el.remove();simLayout();
}
function exitSim(){
  clearInterval(SIM.timer);clearInterval(SIM.auto);SIM.auto=null;window.removeEventListener('resize',simLayout);
  for(const d of [SIM.tv,...SIM.phones]){try{d&&d.g&&d.g.leave();}catch(e){}}
  HUB.members=[];SIM.phones=[];SIM.tv=null;SIM.focus=null;
  S.mode=null;document.body.classList.remove('sim');$('#main').innerHTML='';S.lastMain=null;render();
}
function sizeDev(d,sc){
  const scr=d.el.querySelector('.screen');scr.style.width=Math.round(d.W*sc)+'px';scr.style.height=Math.round(d.H*sc)+'px';
  d.fr.style.transform=`scale(${sc})`;
}
function simLayout(){
  const room=$('#room');if(!room)return;const avail=Math.max(280,room.clientWidth-36);
  const n=Math.max(1,SIM.phones.length);
  const tvS=Math.min(avail*.62/1920,(innerHeight*.46)/1080,.44);
  const phS=Math.min((avail-(n-1)*18)/(n*390),.44,Math.max(.2,(window.innerHeight*.42)/800));
  const devs=[SIM.tv,...SIM.phones].filter(Boolean);
  for(const d of devs){
    d.el.classList.toggle('focused',SIM.focus===d);
    let sc=d.kind==='tv'?tvS:phS;
    if(SIM.focus===d)sc=d.kind==='tv'?Math.min((innerWidth-40)/1920,(innerHeight-110)/1080):Math.min((innerHeight-110)/800,(innerWidth-40)/390,1);
    sizeDev(d,sc);
    d.el.querySelector('.dev-ctl').textContent=SIM.focus===d?'✓ Done':'🔍 Control';
  }
  $('#simbd').classList.toggle('show',!!SIM.focus);
}
function simFocus(d){SIM.focus=d;simLayout();}
function simGame(){return SIM.tv&&SIM.tv.g&&SIM.tv.g.S.myGame;}
function phoneByPid(pid){return SIM.phones.find(p=>{try{return p.g&&p.g.pid===pid}catch(e){return false}});}
function simLabels(){
  const G=simGame();const st=$('#simstatus');if(!st)return;
  const nmOf=p=>(G&&G.names[p])||'?';
  for(const d of SIM.phones){
    const g=d.g;const role=d.el.querySelector('.role');if(!g||!role)continue;const pid=g.pid;let txt='',cls='';
    if(!G||!G.order.includes(pid))txt=G&&G.phase!=='lobby'?'joins next round':'joining…';
    else if(G.phase==='lobby')txt='in the lobby';
    else if(G.dasher===pid&&!['final'].includes(G.phase)){txt='🎤 Round host';cls='host';}
    else{const c=g.ctx();txt='Player';
      if(G.phase==='write')txt=(c.inp[pid]&&c.inp[pid].sub)?'✓ locked in':'✍️ writing';
      if(G.phase==='vote')txt=G.closed.includes(pid)?'nailed it':(c.inp[pid]&&Number.isInteger(c.inp[pid].vote))?'✓ voted':'🗳️ voting';}
    role.textContent=txt?' · '+txt:'';d.el.classList.toggle('is-host',cls==='host');
  }
  if(!G){st.textContent='Setting up the living room…';return;}
  const hn=G.dasher?nmOf(G.dasher):'';
  const msg={lobby:`Lobby: ${G.order.length} players joined. Next step starts the game.`,
    pick:`Round ${G.round}: ${hn} is the host and picks a category.`,card:`${hn} sees the secret answer and puts the question on the TV.`,
    write:'Everyone except the host writes a bluff.',vote:'Everyone except the host votes for the real answer.',
    reveal:['','The TV shows who voted for what.','The TV shows who wrote each answer.','Scores are in. The host passes to the next host.'][G.step||1],
    final:'Game over. Next step starts a new game.'}[G.phase]||'';
  st.textContent=msg;
}
function simStep(){
  const tvg=SIM.tv&&SIM.tv.g;const G=simGame();if(!tvg||!G)return;
  const host=phoneByPid(G.dasher);const hg=host&&host.g;const cmd=c=>hg&&hg.H.cmd({dataset:{c}});
  const live=SIM.phones.filter(p=>p.g&&G.order.includes(p.g.pid));
  switch(G.phase){
    case 'lobby':tvg.H.bstart();break;
    case 'pick':cmd('spin');break;
    case 'card':if(G.spin&&Date.now()-G.spin.id<SPIN_MS+300)return;cmd('show');break;
    case 'write':{const todo=live.filter(p=>{const c=p.g.ctx();return p.g.pid!==G.dasher&&!(c.inp[p.g.pid]&&c.inp[p.g.pid].sub)});
      if(todo.length)todo.forEach(p=>{p.g.S.drafts.sub=rnd(BLUFFS[G.cat]||BLUFFS.word);p.g.H.submit();});else hg&&hg.H.display();break;}
    case 'vote':{const todo=live.filter(p=>{const c=p.g.ctx();return p.g.pid!==G.dasher&&!G.closed.includes(p.g.pid)&&!(c.inp[p.g.pid]&&Number.isInteger(c.inp[p.g.pid].vote))});
      if(todo.length)todo.forEach(p=>{const opts=G.opts.map((o,i)=>({o,i})).filter(x=>x.o.a!==p.g.pid);const pick=rnd(opts);if(pick){p.g.S.voteSel=pick.i;p.g.H.lockvote();}});else cmd('reveal');break;}
    case 'reveal':cmd((G.step||1)<3?'step':'next');break;
    case 'final':tvg.H.bagain();break;
  }
}
function simToggleAuto(){
  const b=$('#simauto');
  if(SIM.auto){clearInterval(SIM.auto);SIM.auto=null;if(b)b.textContent='▶ Auto-play';return;}
  SIM.auto=setInterval(simStep,2600);simStep();if(b)b.textContent='⏸ Pause';
}
Object.assign(H,{sim(){openSim()},simexit(){exitSim()},simadd(){simAddPhone()},simrm(){simRemovePhone()},simstep(){simStep()},simauto(){simToggleAuto()}});

/* ================= narrated tutorial ================= */
const TUT={lastLineAt:0,on:false,i:0,timers:[],tick:null,offLine:null,mode:'',animKey:'',startAt:0};
function tutData(){
  const names={a:'Nate',b:'Sarah',c:'Mike',d:'Jess'};const now=Date.now();
  const real='Giant mutant rabbits terrorize a ranching town in Arizona.';
  const opts=[{t:'A small-town sheriff discovers the local bowling league is run by werewolves.',a:'c'},{t:'Two rival lighthouse keepers fall in love during a 40-day storm.',a:'a'},{t:real,a:'*'},{t:'A retired astronaut trains a team of competitive sheepdogs.',a:'d'}];
  const votes={a:0,d:0,c:2};
  const base={v:1,theme:S.theme||'classic',round:3,target:15,tlen:180,order:['a','b','c','d'],names,scores:{a:6,b:8,c:7,d:5},seqs:{},dasher:'b',cat:'movie',
    word:'Night of the Lepus (1972)',def:real,cardKey:'x',spin:null,deadline:0,opts:[],votes:{},closed:[],closedT:{},step:0,scored:false};
  return {names,real,opts,votes,base,now};
}
function tutPhone(title,body){
  return `<div class="tut-ph-top"><span class="logo">${logoHTML(S.theme)}</span><span class="tut-ph-who">${esc(title)}</span></div>${body}`;
}
function tutScenes(){
  const D=tutData();const B=D.base;const chips=(done)=>`<div class="chips">${['Nate','Sarah','Mike','Jess'].map(n=>`<span class="chip ${done&&done.includes(n)?'done':''}">${n==='Sarah'?'🎤':''}${n}</span>`).join('')}</div>`;
  return [
    {text:"This is Balderdash, the bluffing game. One screen runs the game, and everyone plays on their own phone. Scan the QR code, type your name, and you're in.",dur:9000,
     G:()=>Object.assign({},B,{phase:'lobby',round:0,scores:{a:0,b:0,c:0,d:0},dasher:null}),
     phone:()=>tutPhone("Mike's phone",`<div class="card stack"><span class="eyebrow">📱 Join a game</span><input value="Mike" readonly aria-label="Name"><div class="row"><input class="code-in" value="DEMO" readonly aria-label="Room code"><button class="accent">Join</button></div></div>`)},
    {text:"Every round, a different player hosts. The host spins the wheel to pick a category: a word, a person, initials, a movie, or a law.",dur:8000,
     G:()=>Object.assign({},B,{phase:'pick'}),
     phone:()=>tutPhone("Sarah's phone · host",`<div class="card hostcall marquee center"><span class="eyebrow">Round 3 · You're the host</span><div class="word">🎤 Your round!</div></div><button class="accent big">🎡 Spin the wheel</button>`)},
    {text:"The wheel lands on Movie. Only the host sees the real answer, so keep a straight face.",dur:7500,
     G:()=>Object.assign({},B,{phase:'card',spin:{c:'movie',id:Date.now()}}),
     phone:()=>tutPhone("Sarah's phone · host",`<div class="card secret stack after" style="animation-delay:3.6s"><span class="eyebrow">🎬 Movie · only you can see this</span><div class="word">Night of the Lepus (1972)</div><p class="def">${esc(D.real)}</p><button class="accent">📺 Show question on screen</button></div>`)},
    {text:"The question goes up on the big screen and the clock starts. Everyone else gets three minutes to write a fake answer that sounds totally real.",dur:9000,
     G:()=>Object.assign({},B,{phase:'write',deadline:Date.now()+172000}),inp:{a:{sub:'x'},c:{sub:'x'}},
     phone:()=>tutPhone("Mike's phone",`${chips(['Nate','Mike'])}<div class="card stack"><label class="eyebrow">Write a one-line plot summary</label><textarea readonly aria-label="Answer">A small-town sheriff discovers the local bowling league is run by werewolves.</textarea><button class="accent big">Lock in my answer</button></div>`)},
    {text:"The host puts every answer on the screen, with the real one hidden among the bluffs. Now everyone votes for the one they think is true.",dur:9000,
     G:()=>Object.assign({},B,{phase:'vote',opts:D.opts,def:''}),inp:{c:{vote:2}},
     phone:()=>tutPhone("Mike's phone",`<div class="card stack"><span class="eyebrow">Which one is real?</span>${D.opts.map((o,i)=>`<div class="opt ${i===2?'sel':''} ${o.a==='c'?'mine':''}"><span class="n">${i+1}</span>${esc(o.t)}${o.a==='c'?'<span class="tag">Yours</span>':''}</div>`).join('')}</div>`)},
    {text:"Then the reveal. First, who voted for what.",dur:5000,
     G:()=>Object.assign({},B,{phase:'reveal',step:1,opts:D.opts,votes:D.votes,def:''}),
     phone:()=>tutPhone("Mike's phone",waitCard('👀 Watch the main screen!'))},
    {text:"Then who wrote each answer. Mike's werewolf bowling league fooled two people, and he found the real answer too.",dur:8000,
     G:()=>Object.assign({},B,{phase:'reveal',step:2,opts:D.opts,votes:D.votes,def:''}),
     phone:()=>tutPhone("Mike's phone",waitCard('👀 Watch the main screen!'))},
    {text:"Find the real answer for two points. Score a point for every player your bluff fools. If nobody finds it, the host gets three. First to fifteen wins. Happy bluffing!",dur:11000,
     G:()=>{const g=Object.assign({},B,{phase:'reveal',step:3,opts:D.opts,votes:D.votes,def:'',scores:Object.assign({},B.scores)});const d=deltas(g);for(const k in d)g.scores[k]+=d[k];g.scored=true;return g;},
     phone:()=>{const g=tutScenes._last;return tutPhone("Mike's phone",`<div class="card"><span class="eyebrow">Scores</span>${scoreList(g,deltas(g))}</div>`)}}
  ];
}
function tutTV(sc){
  const G=sc._g;const present=new Set(G.order);const inp={};for(const p of G.order)inp[p]=Object.assign({name:G.names[p],sub:null,vote:null,cmd:null},(sc.inp||{})[p]||{});
  const save={code:S.code,key:S.bAnimKey,conf:S.confirm};S.code='DEMO';S.bAnimKey=TUT.animKey;S.confirm=null;
  let html='';try{html=boardView({G,inp,present,boards:0,pres:()=>null});}catch(e){html='';}
  TUT.animKey=S.bAnimKey;S.code=save.code;S.bAnimKey=save.key;S.confirm=save.conf;return html;
}
function tutLayout(){
  const o=$('#tut');if(!o)return;const wide=innerWidth>=820;
  let tvW=wide?Math.min(innerWidth*.6,(innerHeight-230)*16/9):innerWidth-28;tvW=Math.max(240,tvW);
  const tvH=tvW*9/16;const sc=tvW/1920;
  const ph=wide?Math.min(tvH/780,.62):Math.max(.3,Math.min((innerHeight-tvH-330)/780,.5));
  const tv=$('#tut-tv'),p=$('#tut-ph');
  tv.style.width=tvW+'px';tv.style.height=tvH+'px';tv.firstElementChild.style.transform=`scale(${sc})`;
  p.style.width=(390*ph)+'px';p.style.height=(780*ph)+'px';p.firstElementChild.style.transform=`scale(${ph})`;
}
function tutShow(i){
  const scenes=TUT.scenes;if(i<0||i>=scenes.length)return;TUT.i=i;const sc=scenes[i];
  sc._g=sc.G();tutScenes._last=sc._g;
  $('#tut-tvin').innerHTML=tutTV(sc);$('#tut-phin').innerHTML=sc.phone();
  $('#tut-cap').textContent=sc.text;
  $('#tut-dots').innerHTML=scenes.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('');
  $('#tut-next').textContent=i>=scenes.length-1?'↺ Replay':'⏭ Skip';
}
function tutTimed(from){
  TUT.mode='timed';TUT.timers.forEach(clearTimeout);TUT.timers=[];let t=0;
  for(let k=from;k<TUT.scenes.length;k++){const kk=k;TUT.timers.push(setTimeout(()=>tutShow(kk),t));t+=TUT.scenes[k].dur;}
}
function tutSpeak(from){
  TUT.timers.forEach(clearTimeout);TUT.timers=[];tutShow(from);
  if(!S.tts){$('#tut-voice').textContent=window.__NET?'Captions only (this browser can\'t read aloud)':'Captions only (narration plays in desktop Chrome or Edge)';tutTimed(from);return;}
  TUT.mode='voice';$('#tut-voice').textContent='🔊 Narration on';
  TUT.lastLineAt=Date.now();
  if(!TUT.offLine)TUT.offLine=S.tts.onLine(e=>{if(!TUT.on||TUT.mode!=='voice')return;TUT.lastLineAt=Date.now();const k=+String(e.id||'').slice(1);if(Number.isInteger(k)&&k!==TUT.i)tutShow(k);});
  const lines=TUT.scenes.slice(from).map((s,k)=>({text:s.text,id:'s'+(from+k)}));
  S.tts.speak(lines,{voice:'buttery',language:'en'}).catch(e=>{
    if(!TUT.on)return;if(e&&e.code==='stopped'&&e.reason==='replaced')return;
    $('#tut-voice').textContent='Captions only';tutTimed(TUT.i+ (e&&e.code==='stopped'?0:0));
  });
}
function openTutorial(){
  closeTutorial(true);TUT.on=true;TUT.scenes=tutScenes();TUT.animKey='';
  const o=document.createElement('div');o.id='tut';o.setAttribute('role','dialog');o.setAttribute('aria-label','How to play Balderdash');
  o.innerHTML=`<div class="tut-in"><div class="tut-head"><span class="eyebrow">▶ How to play · 1 minute</span><span class="tut-voice" id="tut-voice"></span></div>
    <div class="tut-stage"><div class="tut-tv" id="tut-tv" inert><div class="tut-tvin" id="tut-tvin"></div></div><div class="tut-ph" id="tut-ph" inert><div class="tut-phin" id="tut-phin"></div></div></div>
    <div class="tut-capbox"><p class="tut-cap" id="tut-cap" aria-live="polite"></p><div class="tut-dots" id="tut-dots"></div>
    <div class="tut-ctrls"><button class="sec" id="tut-next" data-act="tutnext">⏭ Skip</button><button class="accent" data-act="tutclose">✕ Close</button></div></div></div>`;
  document.body.appendChild(o);document.body.classList.add('tut-open');
  tutLayout();window.addEventListener('resize',tutLayout);
  TUT.tick=setInterval(()=>{if(!TUT.on)return;
    if(TUT.mode==='voice'){const sc=TUT.scenes[TUT.i];if(sc&&Date.now()-TUT.lastLineAt>sc.dur+5000&&TUT.i<TUT.scenes.length-1){TUT.mode='timed';try{S.tts.stop().catch(()=>{});}catch(e){}$('#tut-voice').textContent='Captions only';tutTimed(TUT.i+1);}}const sc=TUT.scenes[TUT.i];if(sc&&sc._g&&(sc._g.phase==='write'||sc._g.phase==='card'))$('#tut-tvin').innerHTML=tutTV(sc);},500);
  tutSpeak(0);
}
function closeTutorial(silent){
  TUT.on=false;TUT.timers.forEach(clearTimeout);TUT.timers=[];clearInterval(TUT.tick);
  if(TUT.offLine){try{TUT.offLine()}catch(e){}TUT.offLine=null;}
  if(S.tts&&!silent)S.tts.stop().catch(()=>{});
  const o=$('#tut');if(o)o.remove();document.body.classList.remove('tut-open');window.removeEventListener('resize',tutLayout);
}
Object.assign(H,{
  tutorial(){openTutorial()},
  tutclose(){closeTutorial()},
  tutnext(){if(!TUT.on)return;const n=TUT.i>=TUT.scenes.length-1?0:TUT.i+1;if(TUT.mode==='voice'&&S.tts)tutSpeak(n);else{tutShow(n);tutTimed(n);}}
});
