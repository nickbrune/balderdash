/* Balderdash network layer for running outside Claude (e.g. GitHub Pages).
   - Multiplayer: PeerJS (WebRTC). The main screen hosts the room; each phone connects to it directly.
     The host relays everyone's state ("presence") to all phones, matching the room API the game expects.
   - Narration: the browser's built-in speech synthesis.
   When the page runs inside Claude, window.claude already exists and this file does nothing. */
(function(){
  if(window.claude)return;
  window.__NET=true;
  window.__JOIN_BASE=location.origin+location.pathname;
  const PREFIX='balderdash85-room-';
  const NET_ERRORS=['network','server-error','socket-error','socket-closed'];
  const err=(code,message)=>({code,message:message||code});
  const view=(e,myId)=>Object.freeze({peer:e.peer,by:null,isMe:e.peer===myId,sameTab:e.peer===myId,kind:'viewer',guest:false,presence:e.presence,updatedAt:e.updatedAt});
  const merge=(cur,patch)=>{const o=Object.assign({},cur);for(const k in patch){if(patch[k]===null)delete o[k];else o[k]=patch[k];}return Object.freeze(o);};

  function listeners(){
    const peersFns=[],connFns=[];let connected=false;
    return {
      onPeers(f){peersFns.push(f);return()=>{const i=peersFns.indexOf(f);if(i>=0)peersFns.splice(i,1);};},
      onConnection(f){connFns.push(f);setTimeout(()=>f(connected),0);return()=>{const i=connFns.indexOf(f);if(i>=0)connFns.splice(i,1);};},
      connected:()=>connected,
      firePeers(ps){for(const f of peersFns.slice()){try{f({peers:ps,joined:[],left:[],updated:[]});}catch(e){console.error(e);}}},
      setConn(v){if(connected===v)return;connected=v;for(const f of connFns.slice()){try{f(v);}catch(e){}}}
    };
  }

  /* ---- main screen: owns the room ---- */
  function hostJoin(name){
    return new Promise((resolve,reject)=>{
      const id=PREFIX+name;const L=listeners();const members=new Map();
      const me={peer:'host',presence:Object.freeze({}),updatedAt:Date.now()};
      let peer=null,done=false,tries=0,bTimer=null,left=false;
      const list=()=>[me,...members.values()].map(m=>view(m,'host'));
      const notify=()=>L.firePeers(list());
      const broadcast=()=>{if(bTimer)return;bTimer=setTimeout(()=>{bTimer=null;
        const snap=[me,...members.values()].map(m=>({peer:m.peer,presence:m.presence,updatedAt:m.updatedAt}));
        for(const m of members.values()){try{if(m.conn.open)m.conn.send({t:'s',you:m.peer,peers:snap});}catch(e){}}},60);};
      const api={name,peers:list,onPeers:L.onPeers,onConnection:L.onConnection,connected:L.connected,
        presence(patch){me.presence=merge(me.presence,patch);me.updatedAt=Date.now();notify();broadcast();return Promise.resolve();},
        emit:()=>Promise.resolve(),on:()=>()=>{},
        leave(){left=true;try{peer&&peer.destroy();}catch(e){}members.clear();L.setConn(false);return Promise.resolve();}};
      function start(){
        peer=new Peer(id,{debug:0});
        peer.on('open',()=>{L.setConn(true);if(!done){done=true;resolve(api);}});
        peer.on('connection',conn=>{
          conn.on('open',()=>{members.set(conn.peer,{peer:conn.peer,presence:Object.freeze({}),updatedAt:Date.now(),conn});notify();broadcast();});
          conn.on('data',msg=>{if(!msg||msg.t!=='p'||!msg.p||typeof msg.p!=='object')return;const m=members.get(conn.peer);if(!m)return;
            m.presence=Object.freeze(msg.p);m.updatedAt=Date.now();notify();broadcast();});
          const gone=()=>{const m=members.get(conn.peer);if(m&&m.conn===conn){members.delete(conn.peer);notify();broadcast();}};
          conn.on('close',gone);conn.on('error',gone);
        });
        peer.on('disconnected',()=>{if(left)return;L.setConn(false);setTimeout(()=>{try{if(!peer.destroyed)peer.reconnect();}catch(e){}},1500);});
        peer.on('error',e=>{
          if(e.type==='unavailable-id'){
            // After a reload the old ID can take a moment to free up: retry a few times.
            if(!done&&tries++<5){try{peer.destroy();}catch(_){}setTimeout(start,2500);return;}
            if(!done){done=true;reject(err('id_taken','That room code is already in use. Try again.'));}return;}
          if(NET_ERRORS.includes(e.type)){L.setConn(false);if(!done){done=true;reject(err('unavailable','Could not reach the connection service. Check the internet connection.'));}}
        });
      }
      start();
      setTimeout(()=>{if(!done){done=true;reject(err('unavailable','Timed out reaching the connection service.'));}},20000);
    });
  }

  /* ---- phones: connect to the main screen ---- */
  function guestJoin(name){
    return new Promise((resolve,reject)=>{
      const hostId=PREFIX+name;const L=listeners();
      const me={presence:Object.freeze({}),updatedAt:Date.now()};
      let peer=null,conn=null,myId=null,snap=[],done=false,left=false,retry=null;
      const list=()=>{const out=snap.filter(e=>e.peer!==myId).map(e=>view(e,myId));if(myId)out.push(view({peer:myId,presence:me.presence,updatedAt:me.updatedAt},myId));return out;};
      const notify=()=>L.firePeers(list());
      const send=()=>{try{if(conn&&conn.open)conn.send({t:'p',p:me.presence});}catch(e){}};
      const api={name,peers:list,onPeers:L.onPeers,onConnection:L.onConnection,connected:L.connected,
        presence(patch){me.presence=merge(me.presence,patch);me.updatedAt=Date.now();notify();send();return Promise.resolve();},
        emit:()=>Promise.resolve(),on:()=>()=>{},
        leave(){left=true;clearTimeout(retry);try{peer&&peer.destroy();}catch(e){}L.setConn(false);return Promise.resolve();}};
      const again=ms=>{if(left)return;L.setConn(false);clearTimeout(retry);retry=setTimeout(connect,ms);};
      function connect(){
        if(left||!peer||peer.destroyed)return;
        const c=peer.connect(hostId,{reliable:true,serialization:'json'});conn=c;
        c.on('open',()=>{if(conn!==c)return;L.setConn(true);send();if(!done){done=true;resolve(api);}});
        c.on('data',msg=>{if(conn!==c)return;if(msg&&msg.t==='s'&&Array.isArray(msg.peers)){if(typeof msg.you==='string')myId=msg.you;snap=msg.peers;notify();}});
        c.on('close',()=>{if(conn===c&&done)again(2000);});c.on('error',()=>{if(conn===c&&done)again(2000);});
      }
      peer=new Peer({debug:0});
      peer.on('open',id=>{myId=id;connect();});
      peer.on('disconnected',()=>{if(left)return;setTimeout(()=>{try{if(!peer.destroyed)peer.reconnect();}catch(e){}},1500);});
      peer.on('error',e=>{
        if(e.type==='peer-unavailable'){if(!done){done=true;left=true;try{peer.destroy();}catch(_){}reject(err('not_found','No game found with that code.'));}else again(3000);return;}
        if(NET_ERRORS.includes(e.type)){L.setConn(false);if(!done){done=true;reject(err('unavailable','Could not reach the connection service. Check the internet connection.'));}}
      });
      setTimeout(()=>{if(!done){done=true;left=true;try{peer.destroy();}catch(e){}reject(err('not_found','No game found with that code.'));}},20000);
    });
  }

  /* ---- narration with the browser's own voice ---- */
  function browserTTS(){
    const ss=window.speechSynthesis;if(!ss||!window.SpeechSynthesisUtterance)return null;
    let lineFns=[],gen=0,pending=null;
    const pickVoice=()=>{const vs=ss.getVoices()||[];return vs.find(v=>/^en(-|_)US/i.test(v.lang)&&/Samantha|Google US|Aria|Jenny|Natural/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang))||null;};
    const cancelPending=reason=>{if(pending){const r=pending;pending=null;r(err('stopped'));}};
    return {
      speak(what,opts){
        const lines=typeof what==='string'?[{text:what}]:(Array.isArray(what)?what:[]);
        gen++;const my=gen;cancelPending('replaced');ss.cancel();
        return new Promise((res,rej)=>{
          if(!lines.length)return res({playedMs:0});
          pending=rej;const v=pickVoice();
          lines.forEach((l,i)=>{const u=new SpeechSynthesisUtterance(String(l.text||''));if(v)u.voice=v;u.lang=(v&&v.lang)||'en-US';u.rate=(opts&&opts.rate)||1.03;
            u.onstart=()=>{if(my===gen)lineFns.forEach(f=>{try{f({line:i,id:l.id});}catch(e){}});};
            if(i===lines.length-1)u.onend=()=>{if(my===gen&&pending===rej){pending=null;res({playedMs:0});}};
            u.onerror=e=>{if(my===gen&&pending===rej&&e.error!=='interrupted'&&e.error!=='canceled'){pending=null;rej(err('upstream_error'));}};
            ss.speak(u);});
        });
      },
      add(w,o){return this.speak(w,o);},
      stop(){gen++;cancelPending('stopped');ss.cancel();return Promise.resolve();},
      pause(){ss.pause();return Promise.resolve();},resume(){ss.resume();return Promise.resolve();},
      setRate(){return Promise.resolve();},active:()=>ss.speaking,
      onLine(f){lineFns.push(f);return()=>{lineFns=lineFns.filter(x=>x!==f);};},
      onState(){return()=>{};},onPosition(){return()=>{};}
    };
  }

  const room={join:(name,opts)=>opts&&opts.host?hostJoin(name):guestJoin(name)};
  window.claude={use(n){
    if(n==='room')return Promise.resolve(typeof window.Peer==='function'?room:null);
    if(n==='tts')return Promise.resolve(browserTTS());
    return Promise.resolve(null);
  }};
})();
