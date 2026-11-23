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

/* ================= studio sound effects (generated live, no audio files) ================= */
const SFX={ctx:null,master:null,noiseBuf:null,muted:false,
  init(){
    if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return;}
    try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();
      this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.32;this.master.connect(this.ctx.destination);
      const n=this.ctx.sampleRate,b=this.ctx.createBuffer(1,n,n),d=b.getChannelData(0);for(let k=0;k<n;k++)d[k]=Math.random()*2-1;this.noiseBuf=b;}catch(e){this.ctx=null;}
  },
  setMuted(m){this.muted=m;if(this.master)this.master.gain.value=m?0:.32;},
  stop(){if(this.master){try{this.master.disconnect();}catch(e){}this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.32;this.master.connect(this.ctx.destination);}},
  ok(){return !!(this.ctx&&this.master);},
  tone(f,t0,dur,{type='sawtooth',vol=.16,att=.02,cut=2400,detune=0}={}){
    const c=this.ctx,o=c.createOscillator(),g=c.createGain(),fl=c.createBiquadFilter();
    o.type=type;o.frequency.value=f;o.detune.value=detune;fl.type='lowpass';fl.frequency.value=cut;
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+att);g.gain.setValueAtTime(vol,t0+Math.max(att,dur*.65));g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    o.connect(fl);fl.connect(g);g.connect(this.master);o.start(t0);o.stop(t0+dur+.05);
  },
  noise(t0,dur,{vol=.2,type='bandpass',freq=1500,q=1,att=.003,from=null}={}){
    const c=this.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    s.buffer=this.noiseBuf;s.loop=true;f.type=type;f.frequency.value=freq;f.Q.value=q;
    if(from!=null){f.frequency.setValueAtTime(from,t0);f.frequency.exponentialRampToValueAtTime(freq,t0+dur);}
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+att);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    s.connect(f);f.connect(g);g.connect(this.master);s.start(t0,Math.random()*.5);s.stop(t0+dur+.05);
  },
  play(name,delay=0){
    if(!this.ok()||this.muted)return;const t=this.ctx.currentTime+.03+delay/1000;
    const brass=(f,t0,d,v=.11)=>{this.tone(f,t0,d,{vol:v,cut:2600});this.tone(f,t0,d,{vol:v*.8,cut:2600,detune:9});};
    switch(name){
      case 'fanfare':{const seq=[392,523.25,659.25,783.99];seq.forEach((f,k)=>brass(f,t+k*.13,.16));
        [523.25,659.25,783.99,1046.5].forEach(f=>brass(f,t+.56,1.5,.085));brass(130.81,t+.56,1.5,.12);
        this.noise(t+.56,1.3,{vol:.05,type:'highpass',freq:6000,att:.01});break;}
      case 'ding':{this.tone(1318.5,t,1.3,{type:'sine',vol:.22,att:.005,cut:8000});this.tone(2637,t,.7,{type:'sine',vol:.08,att:.005,cut:9000});break;}
      case 'dingding':{this.play('ding',delay);this.play('ding',delay+260);break;}
      case 'whoosh':{this.noise(t,.9,{vol:.9,freq:2800,from:300,q:.6,att:.25});break;}
      case 'drumroll':{const dur=2.1;for(let k=0;k<dur/.045;k++){const tk=t+k*.045;this.noise(tk,.05,{vol:.12+.3*(k*.045/dur),freq:900+Math.random()*300,q:.9});}
        this.noise(t+dur,1.4,{vol:.22,type:'highpass',freq:3500,att:.004});this.noise(t+dur,.25,{vol:.3,type:'lowpass',freq:200,att:.002});break;}
      case 'applause':{const dur=3.2;for(let k=0;k<dur*70;k++){const tk=t+Math.random()*dur;const env=Math.min(1,(tk-t)/.5)*Math.min(1,(t+dur-tk)/1.2);
          this.noise(tk,.035,{vol:.55*env*(.5+Math.random()),freq:1000+Math.random()*1800,q:1.1,att:.002});}
        this.noise(t,dur,{vol:.16,type:'bandpass',freq:1400,q:.5,att:.5});break;}
    }
  }
};

/* ================= the tutorial: a 1980s game-show opening ================= */
const TUT={lastLineAt:0,on:false,i:0,timers:[],tick:null,offLine:null,mode:'',animKey:'',shown:-1};
const VOICES={announcer:{voice:'rounded',rate:.94},host:{voice:'buttery',rate:1.1}};
function tutData(){
  const names={a:'Nate',b:'Sarah',c:'Mike',d:'Jess'};
  const real='Giant mutant rabbits terrorize a ranching town in Arizona.';
  const opts=[{t:'A small-town sheriff discovers the local bowling league is run by werewolves.',a:'c'},{t:'Two rival lighthouse keepers fall in love during a 40-day storm.',a:'a'},{t:real,a:'*'},{t:'A retired astronaut trains a team of competitive sheepdogs.',a:'d'}];
  const votes={a:0,d:0,c:2};
  const base={v:1,theme:'classic',round:3,target:15,tlen:180,order:['a','b','c','d'],names,scores:{a:6,b:8,c:7,d:5},seqs:{},dasher:'b',cat:'movie',
    word:'Night of the Lepus (1972)',def:real,cardKey:'x',spin:null,deadline:0,opts:[],votes:{},closed:[],closedT:{},step:0,scored:false};
  return {names,real,opts,votes,base};
}
function tutPhone(title,body){return `<div class="tut-ph-top"><span class="logo">${logoHTML('classic')}</span><span class="tut-ph-who">${esc(title)}</span></div>${body}`;}
function tutTitleTV(big,sub,applause){
  return `<div class="bd noside"><div class="bd-main"><div class="bd-stage"><div class="bd-center anim">${applause?'<div class="applause">APPLAUSE</div>':''}
    <div class="tut-title marquee"><b>${big}</b></div><div class="bd-head tut-sub">${sub}</div></div></div></div></div>`;
}
function tutScenes(){
  const D=tutData();const B=D.base;
  const chips=done=>`<div class="chips">${['Nate','Sarah','Mike','Jess'].map(n=>`<span class="chip ${done&&done.includes(n)?'done':''}">${n==='Sarah'?'🎤':''}${n}</span>`).join('')}</div>`;
  const watch=tutPhone("Mike's phone",waitCard('👀 Eyes on the big screen!'));
  return [
    {who:'announcer',tag:'Tonight’s game',sfx:['fanfare','applause'],dur:7000,
     text:"Live from your living room... it's the game where the best liar wins! It's... Balderdash!",
     tv:()=>tutTitleTV('BALDERDASH','The bluffing game show',true),
     phone:()=>tutPhone('Your phone',`<div class="card center stack"><div style="font-size:54px;line-height:1">📱</div><div class="word">Get your phone ready!</div><p class="muted" style="margin:0">It's your game controller tonight.</p></div>`)},
    {who:'host',tag:'Step 1 · Grab your phone',sfx:['ding'],dur:9000,
     text:"Thank you, thank you! Welcome to the show! Getting in is easy: scan the code on the screen, type your name, and boom! You're a contestant!",
     G:()=>Object.assign({},B,{phase:'lobby',round:0,scores:{a:0,b:0,c:0,d:0},dasher:null}),
     phone:()=>tutPhone("Mike's phone",`<div class="card stack"><span class="eyebrow">📱 Join a game</span><input value="Mike" readonly aria-label="Name"><div class="row"><input class="code-in" value="DEMO" readonly aria-label="Room code"><button class="accent">Join</button></div></div>`)},
    {who:'host',tag:'Step 2 · Take your turn as host',sfx:[],dur:7000,
     text:"Every round, one lucky player becomes the host. And hosts... you get to spin... the... wheel!",
     G:()=>Object.assign({},B,{phase:'pick'}),
     phone:()=>tutPhone("Sarah's phone · host",`<div class="card hostcall marquee center"><span class="eyebrow">Round 3 · You're the host</span><div class="word">🎤 Your round!</div></div><button class="accent big">🎡 Spin the wheel</button>`)},
    {who:'host',tag:'Five ways to fool your friends',sfx:['whoosh',['ding',4200]],dur:9000,
     text:"Words! People! Initials! Movies! And laws! Round and round it goes... and it's a Movie! Only the host sees the real answer, so keep that poker face!",
     G:()=>Object.assign({},B,{phase:'card',spin:{c:'movie',id:Date.now()}}),
     phone:()=>tutPhone("Sarah's phone · host",`<div class="card secret stack after" style="animation-delay:4s"><span class="eyebrow">🎬 Movie · only you can see this</span><div class="word">Night of the Lepus (1972)</div><p class="def">${esc(D.real)}</p><button class="accent">📺 Show question on screen</button></div>`)},
    {who:'host',tag:'Step 3 · Bluff!',sfx:['ding'],dur:9500,
     text:"Up goes the question, and the clock is ticking! You've got three minutes to cook up a fake answer so convincing... your own mother would believe it!",
     G:()=>Object.assign({},B,{phase:'write',deadline:Date.now()+172000}),inp:{a:{sub:'x'},c:{sub:'x'}},
     phone:()=>tutPhone("Mike's phone",`${chips(['Nate','Mike'])}<div class="card stack"><label class="eyebrow">Write a one-line plot summary</label><textarea readonly aria-label="Answer">A small-town sheriff discovers the local bowling league is run by werewolves.</textarea><button class="accent big">Lock in my answer</button></div>`)},
    {who:'host',tag:'Step 4 · Spot the truth',sfx:['ding'],dur:9000,
     text:"And now, the moment of truth! Every answer hits the board, with the real one hiding among the fakes. Can you spot it? Lock in your vote!",
     G:()=>Object.assign({},B,{phase:'vote',opts:D.opts,def:''}),inp:{c:{vote:2}},
     phone:()=>tutPhone("Mike's phone",`<div class="card stack"><span class="eyebrow">Which one is real?</span>${D.opts.map((o,i)=>`<div class="opt ${i===2?'sel':''} ${o.a==='c'?'mine':''}"><span class="n">${i+1}</span>${esc(o.t)}${o.a==='c'?'<span class="tag">Yours</span>':''}</div>`).join('')}</div>`)},
    {who:'host',tag:'The big reveal',sfx:['drumroll'],dur:5000,
     text:"Let's see how everybody voted...",
     G:()=>Object.assign({},B,{phase:'reveal',step:1,opts:D.opts,votes:D.votes,def:''}),phone:()=>watch},
    {who:'host',tag:'The big reveal',sfx:['applause'],burst:true,dur:8500,
     text:"And here's who wrote what! Ohhh! Mike's werewolf bowling league fooled two people, and he found the real answer! Give it up for Mike!",
     G:()=>Object.assign({},B,{phase:'reveal',step:2,opts:D.opts,votes:D.votes,def:''}),phone:()=>watch},
    {who:'host',tag:'How to win',sfx:['dingding'],dur:10500,
     text:"Here's how you score! Two points for finding the truth. One point for every friend you fool. And if nobody finds it, the host takes three! First to fifteen wins it all!",
     G:()=>{const g=Object.assign({},B,{phase:'reveal',step:3,opts:D.opts,votes:D.votes,def:'',scores:Object.assign({},B.scores)});const d=deltas(g);for(const k in d)g.scores[k]+=d[k];g.scored=true;return g;},
     phone:()=>{const g=tutScenes._last;return tutPhone("Mike's phone",`<div class="card"><span class="eyebrow">Scores</span>${scoreList(g,deltas(g))}</div>`)}},
    {who:'announcer',tag:'Let’s play!',sfx:['fanfare','applause'],burst:true,dur:7000,
     text:"So grab your phones, sharpen those bluffs, and get ready to play... Balderdash!",
     tv:()=>tutTitleTV('LET’S PLAY!','Scan the code to join the game',true),
     phone:()=>tutPhone('Your phone',`<div class="card center stack"><div style="font-size:54px;line-height:1">🎉</div><div class="word">Come on down!</div><p class="muted" style="margin:0">Close this and tap <b>Join a game</b> to play.</p></div>`)}
  ];
}
function tutTV(sc){
  if(sc.tv)return sc.tv();
  const G=sc._g;const present=new Set(G.order);const inp={};for(const p of G.order)inp[p]=Object.assign({name:G.names[p],sub:null,vote:null,cmd:null},(sc.inp||{})[p]||{});
  const save={code:S.code,key:S.bAnimKey,conf:S.confirm};S.code='DEMO';S.bAnimKey=TUT.animKey;S.confirm=null;
  let html='';try{html=boardView({G,inp,present,boards:0,pres:()=>null});}catch(e){html='';}
  TUT.animKey=S.bAnimKey;S.code=save.code;S.bAnimKey=save.key;S.confirm=save.conf;return html;
}
function tutLayout(){
  const o=$('#tut');if(!o)return;const wide=innerWidth>=820;
  let tvW=wide?Math.min(innerWidth*.6,(innerHeight-250)*16/9):innerWidth-28;tvW=Math.max(240,tvW);
  const tvH=tvW*9/16;const sc=tvW/1920;
  const ph=wide?Math.min(tvH/780,.62):Math.max(.26,Math.min((innerHeight-tvH-430)/780,.45));
  const tv=$('#tut-tv'),p=$('#tut-ph');
  tv.style.width=tvW+'px';tv.style.height=tvH+'px';tv.firstElementChild.style.transform=`scale(${sc})`;
  p.style.width=(390*ph)+'px';p.style.height=(780*ph)+'px';p.firstElementChild.style.transform=`scale(${ph})`;
}
function tutShow(i){
  const scenes=TUT.scenes;if(i<0||i>=scenes.length)return;TUT.i=i;const sc=scenes[i];
  sc._g=sc.G?sc.G():{phase:'title'};tutScenes._last=sc._g;
  $('#tut-tvin').innerHTML=tutTV(sc);$('#tut-phin').innerHTML=sc.phone();
  $('#tut-spk').textContent=sc.who==='announcer'?'🎙️ Announcer':'🎤 Your host';
  $('#tut-tag').textContent=sc.tag;const tg=$('#tut-tag');tg.classList.remove('pop');void tg.offsetWidth;tg.classList.add('pop');
  $('#tut-cap').textContent=sc.text;
  $('#tut-dots').innerHTML=scenes.map((_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('');
  $('#tut-next').textContent=i>=scenes.length-1?'↺ Replay':'⏭ Skip';
  if(TUT.shown!==i){TUT.shown=i;for(const s of sc.sfx||[]){if(Array.isArray(s))SFX.play(s[0],s[1]);else SFX.play(s);}
    if(sc.burst)setTimeout(()=>{if(TUT.on)burst();},250);}
}
function tutTimed(from){
  TUT.mode='timed';TUT.timers.forEach(clearTimeout);TUT.timers=[];let t=0;
  for(let k=from;k<TUT.scenes.length;k++){const kk=k;TUT.timers.push(setTimeout(()=>tutShow(kk),t));t+=TUT.scenes[k].dur;}
}
function tutSpeak(from){
  TUT.timers.forEach(clearTimeout);TUT.timers=[];TUT.shown=-1;tutShow(from);
  if(!S.tts){$('#tut-voice').textContent='Captions only (this browser can’t read aloud)';tutTimed(from);return;}
  TUT.mode='voice';$('#tut-voice').textContent='';
  TUT.lastLineAt=Date.now();
  if(!TUT.offLine)TUT.offLine=S.tts.onLine(e=>{if(!TUT.on||TUT.mode!=='voice')return;TUT.lastLineAt=Date.now();const k=+String(e.id||'').slice(1);if(Number.isInteger(k)&&k!==TUT.i)tutShow(k);});
  const lines=TUT.scenes.slice(from).map((s,k)=>Object.assign({text:s.text,id:'s'+(from+k),language:'en'},VOICES[s.who]||VOICES.host));
  S.tts.speak(lines,{language:'en'}).catch(e=>{
    if(!TUT.on)return;if(e&&e.code==='stopped'&&e.reason==='replaced')return;
    $('#tut-voice').textContent='Captions only';tutTimed(TUT.i);
  });
}
function openTutorial(){
  closeTutorial(true);TUT.on=true;TUT.scenes=tutScenes();TUT.animKey='';TUT.shown=-1;
  SFX.init();
  const o=document.createElement('div');o.id='tut';o.setAttribute('role','dialog');o.setAttribute('aria-label','How to play Balderdash');
  o.innerHTML=`<div class="tut-in"><div class="tut-head"><span class="eyebrow">▶ How to play · about a minute</span><span class="tut-voice" id="tut-voice"></span></div>
    <div class="tut-stage"><div class="tut-tv" id="tut-tv" inert><div class="tut-tvin" id="tut-tvin"></div></div><div class="tut-ph" id="tut-ph" inert><div class="tut-phin" id="tut-phin"></div></div></div>
    <div class="tut-capbox"><div class="tut-caphead"><span class="tut-tag" id="tut-tag"></span><span class="tut-spk" id="tut-spk"></span></div><p class="tut-cap" id="tut-cap" aria-live="polite"></p><div class="tut-dots" id="tut-dots"></div>
    <div class="tut-ctrls"><button class="sec" data-act="tutsound" id="tut-sound" aria-pressed="${!SFX.muted}">${SFX.muted?'🔇 Sound off':'🔊 Sound on'}</button><button class="sec" id="tut-next" data-act="tutnext">⏭ Skip</button><button class="accent" data-act="tutclose">✕ Close</button></div></div></div>`;
  document.body.appendChild(o);document.body.classList.add('tut-open');
  tutLayout();window.addEventListener('resize',tutLayout);
  TUT.tick=setInterval(()=>{if(!TUT.on)return;
    if(TUT.mode==='voice'){const sc=TUT.scenes[TUT.i];if(sc&&Date.now()-TUT.lastLineAt>sc.dur+5000&&TUT.i<TUT.scenes.length-1){TUT.mode='timed';try{S.tts.stop().catch(()=>{});}catch(e){}$('#tut-voice').textContent='Captions only';tutTimed(TUT.i+1);}}
    const sc=TUT.scenes[TUT.i];if(sc&&sc._g&&(sc._g.phase==='write'||sc._g.phase==='card'))$('#tut-tvin').innerHTML=tutTV(sc);},500);
  tutSpeak(0);
}
function closeTutorial(silent){
  TUT.on=false;TUT.timers.forEach(clearTimeout);TUT.timers=[];clearInterval(TUT.tick);
  if(TUT.offLine){try{TUT.offLine()}catch(e){}TUT.offLine=null;}
  if(S.tts&&!silent)S.tts.stop().catch(()=>{});
  SFX.stop();
  const o=$('#tut');if(o)o.remove();document.body.classList.remove('tut-open');window.removeEventListener('resize',tutLayout);
}
Object.assign(H,{
  tutorial(){openTutorial()},
  tutclose(){closeTutorial()},
  tutsound(b){SFX.init();SFX.setMuted(!SFX.muted);if(SFX.muted)SFX.stop();b.textContent=SFX.muted?'🔇 Sound off':'🔊 Sound on';b.setAttribute('aria-pressed',String(!SFX.muted));},
  tutnext(){if(!TUT.on)return;SFX.init();const n=TUT.i>=TUT.scenes.length-1?0:TUT.i+1;if(TUT.mode==='voice'&&S.tts)tutSpeak(n);else{TUT.shown=-1;tutShow(n);tutTimed(n);}}
});
