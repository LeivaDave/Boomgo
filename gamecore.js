
const T=32,W=17,H=15,TA=100,TXA='1:40',cv=document.getElementById('c'),g=cv.getContext('2d');

const RG={1:1,2:2,3:4,4:8},K=(x,y)=>x+','+y,DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
let doors=[],mcClock=0,mcAlarm=false,mcDanger=new Set(),bhC=0,bhA=false,bhPh=0,tentTiles=new Set(),tents=[],tT=12,iceZ=[],izT=8,wallHp={},melts=[],portals=[],meteors=[],pT=20,mT=8,ibur=[],bursts=[],parts=[],msgT=0,msgTxt='',msgUp=1,special={},ice,sp={R:0,Z:0,I:0},items=[],lb=0,mt=0,aud=0,tgx,grid,bombs,fire,ents,state,sel=1,keys={up:0,down:0,left:0,right:0};
const solidT=(x,y)=>x<0||y<0||x>=W||y>=H||grid[y][x]>0;
const bombAt=(x,y)=>bombs.find(b=>b.x==x&&b.y==y);
function init(){
 grid=[];for(let y=0;y<H;y++){grid[y]=[];for(let x=0;x<W;x++){
  let v=0;if(x==0||y==0||x==W-1||y==H-1||(x%2==0&&y%2==0))v=1;else if(Math.random()<.7)v=2;grid[y][x]=v}}
 const S=[[1,1],[W-2,1],[1,H-2],[W-2,H-2]],C=['#f1f3ff','#2f80ed','#e03131','#8d93ad'];
 S.forEach(([sx,sy])=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(Math.abs(x-sx)+Math.abs(y-sy)<=1&&grid[y][x]==2)grid[y][x]=0});
 {const cx=W>>1,cy=H>>1;for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)if(grid[y][x]==2)grid[y][x]=0}
 genArena();
 bombs=[];fire=Array.from({length:H},()=>Array(W).fill(0));
 ents=S.map(([sx,sy],i)=>({x:sx*T+T/2,y:sy*T+T/2,col:C[i],alive:true,cap:1,mx:1,spd:HUMANS[i]?75:62,dir:0,mv:false,ax:0,fz:0,pz:0,pzt:0,cx:0,cxT:0,stun:0,cage:false,through:new Set(),bot:!HUMANS[i],arm:{R:0,I:0},inp:ONLINE&&HUMANS[i]?{x:0,y:0}:null,path:[],think:0}));
 state='play';mt=0;aud=0;items=[];sp={R:0,Z:0,I:0};ents.forEach((e,i)=>e.sp=i?{R:0,Z:0,I:0}:sp);special={};{const cr=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]==2)cr.push([x,y]);cr.sort(()=>Math.random()-.5);if(cr.length>1){special[K(cr[0][0],cr[0][1])]='P';special[K(cr[1][0],cr[1][1])]='T'}}msgT=0;parts=[];bursts=[];ibur=[];portals=[];meteors=[];pT=20;mT=8;iceZ=Array.from({length:H},()=>Array(W).fill(0));izT=8;melts=[];tents=[];tT=12;bhC=0;bhA=false;bhPh=0;tentTiles=new Set();mcClock=0;mcAlarm=false;mcDanger=new Set();arm=ents[ME].arm;ice=Array.from({length:H},()=>Array(W).fill(0));refreshSel();
}
function blast(x,y,r){const res=[[x,y]];
 for(const[dx,dy]of DIRS)for(let i=1;i<=r;i++){const nx=x+dx*i,ny=y+dy*i;
  if(nx<0||ny<0||nx>=W||ny>=H||grid[ny][nx]==1||grid[ny][nx]==4)break;res.push([nx,ny]);if(grid[ny][nx]==2||grid[ny][nx]==3)break}
 return res}
function danger(extra){const d=new Set();
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(fire[y][x]>0)d.add(K(x,y));
 if(arena=='bh')tentTiles.forEach(k=>d.add(k));if(arena=='mc')mcDanger.forEach(k=>d.add(k));
 bombs.forEach(b=>blast(b.x,b.y,b.r).forEach(([x,y])=>d.add(K(x,y))));
 if(extra)blast(extra.x,extra.y,extra.r).forEach(([x,y])=>d.add(K(x,y)));
 return d}
let AC=null,muted=false,mg=null,nxt=0,stp=0,kicks=[],kickN=0,bf=.5,arena='classic',deco={};
const RT=[110,87.3,130.8,98],AR=[[220,261.6,329.6,440],[174.6,220,261.6,349.2],[261.6,329.6,392,523.3],[196,246.9,293.7,392]];let SD=60/126/4;
function tone(f,t,d,ty,v){const o=AC.createOscillator(),gn=AC.createGain();o.type=ty;o.frequency.value=f;gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(gn);gn.connect(mg);o.start(t);o.stop(t+d)}
function noise(t,d,v,hp){const n=Math.floor(AC.sampleRate*d),buf=AC.createBuffer(1,n,AC.sampleRate),a=buf.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;
 const sr=AC.createBufferSource(),gn=AC.createGain(),f=AC.createBiquadFilter();f.type=hp?'highpass':'lowpass';f.frequency.value=hp?7000:600;sr.buffer=buf;gn.gain.setValueAtTime(v,t);gn.gain.exponentialRampToValueAtTime(.001,t+d);sr.connect(f);f.connect(gn);gn.connect(mg);sr.start(t)}
function sfx(k){if(!AC||muted)return;const t=AC.currentTime;
 if(k=='boom'){if(t-lb<.1)return;lb=t;noise(t,.4,.9,false);tone(70,t,.3,'sine',.8)}else if(k=='launch'){tone(300,t,.25,'sawtooth',.2);tone(600,t+.1,.2,'sawtooth',.15)}else if(k=='ice'){tone(1200,t,.3,'triangle',.2);tone(1800,t+.05,.3,'triangle',.15)}else if(k=='warp'){tone(300,t,.2,'sine',.2);tone(900,t+.08,.2,'sine',.15)}else if(k=='win'){[523,659,784,1047,1319].forEach((f,i)=>tone(f,t+i*.13,.35,'triangle',.22));tone(262,t,.9,'sawtooth',.08)}else{tone(660,t,.08,'square',.15);tone(990,t+.07,.1,'square',.15)}}
function mstep(t,i){const c=Math.floor(i/16)%4,k=i%16;
 if(k%4==0){tone(60,t,.15,'sine',.7);kicks.push(t);if(kicks.length>40)kicks.shift()}
 if(k%2==1)noise(t,.04,.12,true);
 if(k%2==0)tone(RT[c],t,SD*1.6,'square',.12);
 if(arena=='rock'&&gbus)riff(t,c,k);else if(arena=='mc'&&gbus)mcRiff(t,c,k);else tone(AR[c][[0,1,2,3,2,1,2,3][k%8]],t,SD*.9,'sawtooth',.04);if(mt>TA&&state=='play'){tone(AR[c][[3,2,1,0][k%4]]*2,t,SD*.7,'square',.035);if(k%2==0)noise(t,.04,.1,true)}if(arena=='mc'&&gbus)mcPerc(t,k,i)}
let rf=null,cr=null,gbus=null,lastRf=-1,lastCr=-1,nextCheer=0,wasDark=false;
function gnote(f,t,d,v){const o=AC.createOscillator(),o2=AC.createOscillator(),gn=AC.createGain();o.type='sawtooth';o2.type='sawtooth';o.frequency.value=f;o2.frequency.value=f;o2.detune.value=9;
 gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(v,t+.008);gn.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(gn);o2.connect(gn);gn.connect(gbus);o.start(t);o2.start(t);o.stop(t+d+.02);o2.stop(t+d+.02)}
function riff(t,c,k){const root=RT[c]*2,pat={0:2,2:1,3:1,4:2,6:1,7:1,8:2,10:1,11:1,12:3,14:1,15:1}[k];
 if(pat){const d=pat==1?SD*.5:pat==2?SD*1.8:SD*3.2,v=pat==1?.4:.55;gnote(root,t,d,v);gnote(root*1.5,t,d,v*.9);if(pat>1)gnote(root*2,t,d,v*.7)}
 if(c==3&&k>=8&&k%2==0)gnote([440,523.25,587.33,659.25,587.33,523.25,440,392][(k-8)/2],t,SD*1.8,.45)}
function roar(t,d,v){const n=Math.floor(AC.sampleRate*d),buf=AC.createBuffer(1,n,AC.sampleRate),a=buf.getChannelData(0);let b=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;b=.96*b+.04*w;a[i]=b*3}
 const s=AC.createBufferSource(),f=AC.createBiquadFilter(),gn=AC.createGain();f.type='bandpass';f.frequency.value=1000;f.Q.value=.7;s.buffer=buf;gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(v,t+d*.25);gn.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(gn);gn.connect(mg);s.start(t)}
function cheer(t,vol,big){const n=big?6:3;
 for(let j=0;j<n;j++){const o=AC.createOscillator(),lf=AC.createOscillator(),lg=AC.createGain(),gn=AC.createGain(),bp=AC.createBiquadFilter(),f0=380+Math.random()*320,dur=(big?1.6:.9)+Math.random()*.4;
  o.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f0*1.55,t+dur*.45);o.frequency.linearRampToValueAtTime(f0*1.3,t+dur);
  lf.frequency.value=5+Math.random()*2;lg.gain.value=f0*.03;lf.connect(lg);lg.connect(o.frequency);
  bp.type='bandpass';bp.frequency.value=1100+Math.random()*500;bp.Q.value=1.2;
  gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(vol/n*.6,t+.08);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(bp);bp.connect(gn);gn.connect(mg);o.start(t);lf.start(t);o.stop(t+dur+.05);lf.stop(t+dur+.05)}
 roar(t,big?1.4:.8,vol*(big?.9:.5))}
function rockInit(){const cv=new Float32Array(1024);for(let i=0;i<1024;i++)cv[i]=Math.tanh((i/512-1)*6);
 const sh=AC.createWaveShaper();sh.curve=cv;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3400;
 gbus=AC.createGain();rf=AC.createGain();rf.gain.value=0;gbus.connect(sh);sh.connect(lp);lp.connect(rf);rf.connect(mg);
 const n=AC.sampleRate*2,buf=AC.createBuffer(1,n,AC.sampleRate),d=buf.getChannelData(0);let b=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;b=.96*b+.04*w;d[i]=b*3}
 const src=AC.createBufferSource(),bp=AC.createBiquadFilter();src.buffer=buf;src.loop=true;bp.type='bandpass';bp.frequency.value=900;bp.Q.value=.6;cr=AC.createGain();cr.gain.value=0;src.connect(bp);bp.connect(cr);cr.connect(mg);src.start();mcInit()}
let mhG=null,lastMh=-1;
function mcInit(){mhG=AC.createGain();mhG.gain.value=0;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=240;
 for(const[f,dt_]of[[55,0],[82.4,6]]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt_;o.connect(lp);o.start()}
 const lf=AC.createOscillator(),lg=AC.createGain();lf.frequency.value=6.5;lg.gain.value=70;lf.connect(lg);lg.connect(lp.frequency);lf.start();lp.connect(mhG);mhG.connect(mg)}
function mcRiff(t,c,k){const root=RT[c]*2,acc=k==0||k==6||k==10,mute=[1,2,4,5,8,9,12,13,14].includes(k);
 if(acc){const d=SD*(k==10?2.4:1.4);gnote(root,t,d,.5);gnote(root*1.5,t,d,.45);gnote(root*2,t,d,.3)}else if(mute)gnote(root,t,SD*.4,.28)}
function mcPerc(t,k,i){const bar=Math.floor(i/16);
 if(k==4||k==12){tone(190,t,.09,'triangle',.22);noise(t,.11,.2,true)}
 if(k==0&&bar%2==0)tone(48,t,.35,'sine',.5);
 if(k==8&&bar%2==1){noise(t,.28,.16,true);tone(95,t,.12,'sine',.3)}
 const cl={3:620,7:410,11:880,14:540}[k];if(cl){tone(cl,t,.11,'square',.05);tone(cl*2.76,t,.07,'triangle',.045)}
 if(k%2==0)noise(t,.012,.05,true)}
function rockAudio(){if(!AC||!rf)return;const rock=arena=='rock'&&state=='play'&&!menuOpen,ph=(mt+10)%28,dark=rock&&ph>=24,warn=rock&&ph>=22&&ph<24;
 const mcOn=arena=='mc'&&state=='play'&&!menuOpen,tr=rock?(dark?.5:warn?.34:.22):(mcOn?.2:0),tc=rock?(dark?.5:warn?.28:.1):0;
 if(mhG&&mcOn!==lastMh){mhG.gain.setTargetAtTime(mcOn?.05:0,AC.currentTime,.4);lastMh=mcOn}
 if(tr!==lastRf){rf.gain.setTargetAtTime(tr,AC.currentTime,.25);lastRf=tr}
 if(tc!==lastCr){cr.gain.setTargetAtTime(tc,AC.currentTime,.4);lastCr=tc}
 if(rock&&!muted){const t=AC.currentTime;if(wasDark&&!dark)cheer(t,.9,true);if(t>nextCheer){cheer(t,dark?.5:.2,false);nextCheer=t+(dark?1+Math.random()*1.4:3+Math.random()*4)}}
 wasDark=dark}
function audioStart(){if(AC){if(AC.state=='suspended')AC.resume();return}
 try{AC=new(window.AudioContext||window.webkitAudioContext)();mg=AC.createGain();mg.gain.value=muted?0:.5;mg.connect(AC.destination);rockInit();nxt=AC.currentTime+.1;
  setInterval(()=>{SD=60/(mt>TA&&state=='play'?152:126)/4;while(nxt<AC.currentTime+.25){if(!muted&&!menuOpen)mstep(nxt,stp);nxt+=SD;stp++}},60)}catch(e){}}
const hk=(b,c)=>(b.k||'').includes(c);let arm={R:0,I:0};
function refreshSel(){const rm=bombs.some(b=>b.owner==ents[ME]&&hk(b,'R'));if(!sp.R)arm.R=0;if(!sp.I)arm.I=0;
 for(const[k,id]of[['R','bR'],['Z','bZ'],['I','bI']]){const bt=document.getElementById(id);bt.querySelector('i').textContent=sp[k]||'';bt.classList.toggle('off',!sp[k]);bt.classList.toggle('arm',!!arm[k])}
 document.getElementById('bD').classList.toggle('off',!rm);
 const el=Math.min(TA+50,mt),P=ents[ME];document.getElementById('tv').textContent='R'+mRound+' · '+Math.floor(el/60)+':'+String(Math.floor(el%60)).padStart(2,'0');document.getElementById('tm').classList.toggle('hot',mt>TA);
 document.getElementById('st').textContent='🔥'+P.mx+' 💣'+P.cap+' ⚡'+Math.round((P.spd-75)/14)+' ❄'+(sp.I||0);
 document.querySelectorAll('.pc').forEach((c,i)=>{c.classList.toggle('dead',!ents[i].alive);const em=c.querySelector('em');if(em)em.textContent='C'+(i+1)+(mScores[i]?' ★'+mScores[i]:'')});
 document.getElementById('bn').textContent=Math.max(0,P.cap-bombs.filter(b=>b.owner==P&&!hk(b,'R')&&!hk(b,'I')).length)}
let sir=null;
function sirenOn(){if(sir||!AC||muted)return;const o=AC.createOscillator(),l=AC.createOscillator(),lg=AC.createGain(),g2=AC.createGain();o.type='sawtooth';o.frequency.value=800;l.frequency.value=.9;lg.gain.value=260;l.connect(lg);lg.connect(o.frequency);g2.gain.value=.07;o.connect(g2);g2.connect(mg);o.start();l.start();sir={o,l}}
function sirenOff(){if(!sir)return;try{sir.o.stop();sir.l.stop()}catch(e){}sir=null}
function stunNear(b){if(!b.owner||b.owner.bot)return;ents.forEach(o=>{if(o.bot&&o.alive&&Math.abs(Math.floor(o.x/T)-b.x)+Math.abs(Math.floor(o.y/T)-b.y)<=1)o.stun=1})}
function spawnBomb(b){stunNear(b);bombs.push(b);ents.forEach(e=>{if(Math.abs(e.x-(b.x*T+T/2))<T/2+HS&&Math.abs(e.y-(b.y*T+T/2))<T/2+HS)e.through.add(b)})}
function placeSpecial(k,p=ents[ME]){if(netMode){netAct('p'+k);return}if(state!='play'||!p.alive||p.sp[k]<1)return;if(place(p,null,k))p.sp[k]--}
function bindSpecial(id,k){const bt=document.getElementById(id);let tm=null,lg=false;
 bt.addEventListener('pointerdown',e=>{e.preventDefault();lg=false;tm=setTimeout(()=>{lg=true;tm=null;armToggle(k);refreshSel()},380)});
 bt.addEventListener('pointerup',()=>{if(tm){clearTimeout(tm);tm=null;if(!lg){placeSpecial(k);refreshSel()}}});
 bt.addEventListener('pointercancel',()=>{clearTimeout(tm);tm=null});bt.addEventListener('pointerleave',()=>{if(tm){clearTimeout(tm);tm=null}})}
function armToggle(k,p=ents[ME]){if(netMode){netAct('a'+k);return}if(state!='play'||!p.alive)return;if(p.arm[k]){p.arm[k]=0;return}if(p.sp[k]>0)p.arm[k]=1}
function armedKind(p){return(p.arm.R&&p.sp.R>0?'R':'')+(p.arm.I&&p.sp.I>0?'I':'')}
function spend(p,k){if(k.includes('R')){p.sp.R--;p.arm.R=0}if(k.includes('I')){p.sp.I--;p.arm.I=0}}
function useB(p=ents[ME]){if(netMode){netAct('b');return}if(state!='play'||!p.alive)return;place(p,null,'')}
function detonate(p=ents[ME]){if(netMode){netAct('d');return}bombs.filter(b=>b.owner==p&&hk(b,'R')).forEach(b=>b.t=0)}
function useZ(p=ents[ME]){if(netMode){netAct('z');return}if(menuOpen||state!='play'||!p.alive||p.sp.Z<1||(!armedKind(p)&&bombs.filter(b=>b.owner==p&&!hk(b,'R')&&!hk(b,'I')).length>=p.cap))return;
 const dv=[[0,1],[-1,0],[0,-1],[1,0]][p.dir],tx=Math.floor(p.x/T),ty=Math.floor(p.y/T),k=armedKind(p);
 for(let d=5;d>=2;d--){const x=tx+dv[0]*d,y=ty+dv[1]*d;
  if(!solidT(x,y)&&!bombAt(x,y)){const t=p.mx;spawnBomb({x,y,sx:tx,sy:ty,fl:.35,r:k.includes('I')?5:RG[t],t:k.includes('R')?9999:3,owner:p,type:t,k:'Z'+k,at:mt});p.sp.Z--;spend(p,k);sfx('launch');return}}}
function botZ(e,tx,ty){if(bombs.filter(b=>b.owner==e).length>=e.cap)return false;
 const gx=Math.floor(e.tg.x/T),gy=Math.floor(e.tg.y/T),r=RG[e.mx];
 for(const[dx,dy]of DIRS)for(let d=5;d>=2;d--){const x=tx+dx*d,y=ty+dy*d;
  if(solidT(x,y)||bombAt(x,y))continue;const tl=blast(x,y,r);
  if(tl.some(([a,b])=>a==gx&&b==gy)&&!tl.some(([a,b])=>a==tx&&b==ty)){spawnBomb({x,y,sx:tx,sy:ty,fl:.35,r,t:3,owner:e,type:e.mx,k:'Z'});e.sp.Z--;sfx('launch');return true}}
 return false}
function lineEnemy(e,tx,ty,n){return DIRS.some(([dx,dy])=>{for(let i=1;i<=n;i++){const nx=tx+dx*i,ny=ty+dy*i;if(solidT(nx,ny))return false;
 if(ents.some(o=>o!=e&&o.alive&&Math.floor(o.x/T)==nx&&Math.floor(o.y/T)==ny))return true}return false})}
function place(e,tp,k){if(menuOpen)return;
 if(!e.alive||state!='play')return;
 const tx=Math.floor(e.x/T),ty=Math.floor(e.y/T);
 const nk=((k||'').includes('R')?'R':'')+((k||'').includes('I')?'I':'');if(bombs.filter(b=>b.owner==e&&(hk(b,'R')||hk(b,'I'))==(nk!=='')).length>=(nk!==''?3:e.cap)||bombs.some(o=>o.x==tx&&o.y==ty&&((hk(o,'R')?'R':'')+(hk(o,'I')?'I':''))==nk))return;
 const t=tp||e.mx;
 const b={x:tx,y:ty,r:(k||'').includes('I')?5:RG[t],t:(k||'').includes('R')?9999:3,owner:e,type:t,k,at:mt};bombs.push(b);e.through.add(b);stunNear(b);return b}
function dropAt(x,y){const sk=special[K(x,y)];if(sk){delete special[K(x,y)];items.push({x,y,k:sk,age:0});return}
 if(Math.random()<(arena=='cryo'?.75:.4)){const r=Math.random();items.push({x,y,k:r<.3?'B':r<.5?'S':r<.68?'C':r<.79?'R':r<.9?'Z':'I',age:0})}}
function boom(b){const i=bombs.indexOf(b);if(i<0)return;bombs.splice(i,1);sfx('boom');if(hk(b,'I')){sfx('ice');ibur.push({x:b.x*T+T/2,y:b.y*T+T/2,l:.75});blast(b.x,b.y,b.r).forEach(([x,y])=>{ice[y][x]=.9;if(parts.length<700)for(let j=0;j<9;j++){const L=1.1+Math.random()*.8;parts.push({sn:1,x:x*T+Math.random()*T,y:y*T-14-Math.random()*26,vx:0,vy:22+Math.random()*30,l:L,m:L,ph:Math.random()*6,r:1+Math.random()*1.6})}});return}bursts.push({x:b.x*T+T/2,y:b.y*T+T/2,l:.35});
 blast(b.x,b.y,b.r).forEach(([x,y])=>{fire[y][x]=.45;if(parts.length<500)for(let j=0;j<3;j++)parts.push({x:x*T+T/2,y:y*T+T/2,vx:(Math.random()-.5)*70,vy:-Math.random()*80-20,l:.5+Math.random()*.4,m:.9});if(grid[y][x]==2){grid[y][x]=0;dropAt(x,y);for(let j=0;j<6;j++)parts.push({x:x*T+T/2,y:y*T+T/2,vx:(Math.random()-.5)*120,vy:-Math.random()*110-30,l:.6+Math.random()*.4,m:1,c:'#e0913a'})}if(grid[y][x]==3)wallHit(x,y);bombs.filter(o=>o.x==x&&o.y==y).forEach(o=>boom(o))})}
const HS=11;
function hit(px,py,e){for(const[cx,cy]of[[-HS,-HS],[HS,-HS],[-HS,HS],[HS,HS]]){
 const tx=Math.floor((px+cx)/T),ty=Math.floor((py+cy)/T);
 if(solidT(tx,ty))return true;const b=bombAt(tx,ty);if(b&&!e.through.has(b))return true}return false}
function bfs(sx,sy,goal,avoid){
 const q=[[sx,sy]],prev={[K(sx,sy)]:null};
 while(q.length){const[x,y]=q.shift();
  if(goal(x,y)){const p=[];let c=K(x,y);while(prev[c]){p.unshift(prev[c].t);c=prev[c].f}return p}
  for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy,k=K(nx,ny);
   if(k in prev||solidT(nx,ny)||bombAt(nx,ny)||avoid(nx,ny)||(arena=='bh'&&bhA&&Math.abs(nx-8)<=1&&Math.abs(ny-7)<=1))continue;
   prev[k]={f:K(x,y),t:[nx,ny]};q.push([nx,ny])}}
 return null}
function botAI(e,dt){
 const tx=Math.floor(e.x/T),ty=Math.floor(e.y/T);
 if(e.stun>0){e.stun-=dt;e.path=[];return}
 if(arena=='cryo'&&!e.path.length&&iceZ[ty]&&iceZ[ty][tx]>0)cryoSlide(e,0,0,dt);
 for(const b of bombs.filter(b=>b.owner==e&&hk(b,'R'))){const tl=blast(b.x,b.y,b.r);
  if(!tl.some(([x,y])=>x==tx&&y==ty)&&mt-b.at>1.2&&(mt-b.at>5||ents.some(o=>o!=e&&o.alive&&tl.some(([x,y])=>x==Math.floor(o.x/T)&&y==Math.floor(o.y/T)))))b.t=0}
 if(e.path.length){const[px,py]=e.path[0],cx=px*T+T/2,cy=py*T+T/2,d=danger();
  if(bombAt(px,py)||solidT(px,py)||(d.has(K(px,py))&&!d.has(K(tx,ty)))){e.path=[];return}
  const dx=cx-e.x,dy=cy-e.y,dist=Math.hypot(dx,dy),s=e.spd*dt;e.mv=true;if(dist>1)e.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:3):(dy<0?2:0);
  if(arena=='cryo'&&iceZ[ty]&&iceZ[ty][tx]>0){if(dist>1)cryoSlide(e,dx/dist,dy/dist,dt);if(dist<10)e.path.shift();return}
  if(dist<=s){e.x=cx;e.y=cy;e.path.shift()}else{e.x+=dx/dist*s;e.y+=dy/dist*s}
  return}
 e.think-=dt;if(e.think>0)return;e.think=.2;
 e.tgT=(e.tgT||0)-.2;
 if(e.tgT<=0||!e.tg||!e.tg.alive){const c=ents.filter(o=>o!=e&&o.alive);e.tg=Math.random()<.5&&ents[ME].alive?ents[ME]:c[Math.floor(Math.random()*c.length)];e.tgT=5+Math.random()*4}
 const d=danger();
 if(d.has(K(tx,ty))){e.path=bfs(tx,ty,(x,y)=>!d.has(K(x,y)),()=>false)||[];return}
 if(arena=='bh'&&bhA&&Math.hypot(e.x-HX,e.y-HY)<110){const pp=bfs(tx,ty,(x,y)=>Math.hypot((x+.5)*T-HX,(y+.5)*T-HY)>125,()=>false);if(pp&&pp.length){e.path=pp.slice(0,5);return}}
 const ip=items.length?bfs(tx,ty,(x,y)=>(x!=tx||y!=ty)&&items.some(i=>i.x==x&&i.y==y&&i.k!='P'),(x,y)=>d.has(K(x,y))):null;
 if(ip&&ip.length<=8){e.path=ip;return}
 if(e.sp.Z>0&&e.tg&&e.tg.alive&&Math.random()<.5&&botZ(e,tx,ty))return;
 const own=bombs.filter(b=>b.owner==e).length<e.cap&&!bombAt(tx,ty);
 const near=()=>DIRS.some(([dx,dy])=>{for(let i=1;i<=3;i++){const nx=tx+dx*i,ny=ty+dy*i;
  if(solidT(nx,ny)){return i==1&&grid[ny]&&(grid[ny][nx]==2||grid[ny][nx]==3)}
  if(ents.some(o=>o!=e&&o.alive&&Math.floor(o.x/T)==nx&&Math.floor(o.y/T)==ny))return true}return false});
 const bt=Math.min(e.mx,[1,2,2,3][Math.floor(Math.random()*4)]);
 if(own&&near()){const kd=e.sp.I>0&&lineEnemy(e,tx,ty,2)?'I':(e.sp.R>0&&Math.random()<.6?'R':null);const d2=danger({x:tx,y:ty,r:kd=='I'?5:RG[bt]});
  const esc=bfs(tx,ty,(x,y)=>!d2.has(K(x,y)),(x,y)=>d.has(K(x,y)));
  if(esc){if(place(e,bt,kd)&&kd)e.sp[kd]--;e.path=esc;return}}
 const p=bfs(tx,ty,(x,y)=>(x!=tx||y!=ty)&&(DIRS.some(([dx,dy])=>!(x+dx<0||y+dy<0||x+dx>=W||y+dy>=H)&&(grid[y+dy][x+dx]==2||grid[y+dy][x+dx]==3))||ents.some(o=>o!=e&&o.alive&&Math.floor(o.x/T)==x&&Math.floor(o.y/T)==y)),(x,y)=>d.has(K(x,y)));
 const tg=e.tg;let q=null;
 if(tg&&tg.alive){const gx=Math.floor(tg.x/T),gy=Math.floor(tg.y/T);
  q=bfs(tx,ty,(x,y)=>(x!=tx||y!=ty)&&Math.abs(x-gx)+Math.abs(y-gy)<=2,(x,y)=>d.has(K(x,y)))}
 e.path=(q||p||[]).slice(0,4)}
function audBomb(){const al=ents.filter(e=>e.alive);if(!al.length)return;
 for(let i=0;i<40;i++){let x,y;
  if(Math.random()<.6){const e=al[Math.floor(Math.random()*al.length)];x=Math.floor(e.x/T)+Math.floor(Math.random()*5)-2;y=Math.floor(e.y/T)+Math.floor(Math.random()*5)-2}
  else{x=1+Math.floor(Math.random()*(W-2));y=1+Math.floor(Math.random()*(H-2))}
  if(!solidT(x,y)&&!bombAt(x,y)){const b={x,y,r:99,t:1.6,owner:null,type:'MAX'};bombs.push(b);
   ents.forEach(e=>{if(Math.abs(e.x-(x*T+T/2))<T/2+HS&&Math.abs(e.y-(y*T+T/2))<T/2+HS)e.through.add(b)});return}}}
function update(dt){
 if(state!='play')return;
 items=items.filter(i=>{i.age+=dt;return !(i.age>.6&&fire[i.y][i.x]>0)});
 bursts.forEach(q=>q.l-=dt);bursts=bursts.filter(q=>q.l>0);ibur.forEach(q=>q.l-=dt);ibur=ibur.filter(q=>q.l>0);
 if(arena=='ast')astEvents(dt);if(arena=='cryo')cryoEvents(dt);if(arena=='bh')bhEvents(dt);if(arena=='mc')mcEvents(dt);
 parts.forEach(p=>{p.l-=dt;if(p.sn){p.x+=Math.sin(p.l*4+p.ph)*14*dt;p.y+=p.vy*dt}else{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=90*dt}});parts=parts.filter(p=>p.l>0);
 if(msgT>0)msgT-=dt;mt+=dt;if(mt>TA){aud-=dt;if(aud<=0){aud=mt>TA+50?.7:1.4;audBomb()}}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(fire[y][x]>0)fire[y][x]-=dt;if(ice[y][x]>0)ice[y][x]-=dt}
 bombs.slice().forEach(b=>{if(b.fl>0)b.fl-=dt;if(arena=='cryo'&&!(b.fl>0)&&b.t<100&&iceZ[b.y][b.x]>0)b.fzT=(b.fzT||0)+dt;else{b.fzT=0;b.t-=dt}if(b.t<=0)boom(b)});
 ents.forEach((e,i)=>{if(!e.alive)return;
  e.mv=false;if(e.tr>0)e.tr-=dt;if(e.fz>0)e.fz-=dt;if(ice[Math.floor(e.y/T)][Math.floor(e.x/T)]>0)e.fz=5;if(e.fz>0){}else if(e.bot)botAI(e,dt);else{
   const jx=e.inp?e.inp.x:joy.x+keys.right-keys.left,jy=e.inp?e.inp.y:joy.y+keys.down-keys.up,apx=Math.abs(jx),apy=Math.abs(jy),s=e.spd*dt;
   if(cryoSlide(e,jx,jy,dt)){}else if(Math.max(apx,apy)>.25){
    if(e.ax==0&&apy>apx*1.25)e.ax=1;else if(e.ax==1&&apx>apy*1.25)e.ax=0;
    const sg=e.ax==0?Math.sign(jx):Math.sign(jy),st=s*Math.min(1,Math.max(apx,apy)*1.2+.15);
    if(e.ax==0){if(!hit(e.x+sg*st,e.y,e))e.x+=sg*st;const df=(Math.floor(e.y/T)+.5)*T-e.y,sp=Math.max(-s,Math.min(s,df));if(sp&&!hit(e.x,e.y+sp,e))e.y+=sp}
    else{if(!hit(e.x,e.y+sg*st,e))e.y+=sg*st;const df=(Math.floor(e.x/T)+.5)*T-e.x,sp=Math.max(-s,Math.min(s,df));if(sp&&!hit(e.x+sp,e.y,e))e.x+=sp}
    e.dir=e.ax==0?(sg<0?1:3):(sg<0?2:0);e.mv=true}}
  if(e.bot){const ex=Math.floor(e.x/T),ey=Math.floor(e.y/T);e.cage=DIRS.filter(([dx,dy])=>bombAt(ex+dx,ey+dy)).length>=3;if(e.cage)e.stun=Math.max(e.stun,.4)}
  if(e.cx>0){e.cx-=dt;e.cxT-=dt;if(e.cxT<=0){e.cxT=1;bombs.push({x:Math.floor(e.x/T),y:Math.floor(e.y/T),r:RG[e.mx],t:0,owner:e,type:e.mx})}if(e.cx<=0){e.alive=false;bursts.push({x:e.x,y:e.y,l:.35});sfx('boom')}}
  if(e.pz>0){e.pz-=dt;e.pzt-=dt;if(e.pzt<=0){e.pzt=1;const bx=Math.floor(e.x/T),by=Math.floor(e.y/T);if(!bombAt(bx,by)){spawnBomb({x:bx,y:by,r:RG[e.mx],t:3,owner:e,type:e.mx});sfx('pick')}}}
  const ix=items.findIndex(i=>i.x==Math.floor(e.x/T)&&i.y==Math.floor(e.y/T));
  if(ix>=0){const it=items.splice(ix,1)[0];
   if(it.k=='B')e.cap=Math.min(10,e.cap+1);else if(it.k=='S')e.spd=Math.min(e.bot?117:145,e.spd+(e.bot?11:14));else if(it.k=='C')e.mx=Math.min(4,e.mx+1);else if(it.k=='P'){if(Math.random()<.5){e.pz=5;e.pzt=0;if(!e.bot){msgT=2.4;msgUp=0;msgTxt='☠️ ¡BOMBAS FORZADAS!'}}else{e.cx=5;e.cxT=0;if(!e.bot){msgT=2.4;msgUp=0;msgTxt='💥 ¡MATA A TODOS EN 5s!'}}}else if(it.k=='T'){const up=Math.random()<.5;mt=up?Math.max(0,mt-10):mt+10;msgT=1.8;msgTxt=up?'⏱ +10s':'⏱ -10s';msgUp=up}else e.sp[it.k]=Math.min(3,e.sp[it.k]+1);
   sfx('pick');if(!e.bot)refreshSel()}
  e.through.forEach(b=>{if(!bombs.includes(b)||Math.abs(e.x-(b.x*T+T/2))>=T/2+HS||Math.abs(e.y-(b.y*T+T/2))>=T/2+HS)e.through.delete(b)});
  if(fire[Math.floor(e.y/T)][Math.floor(e.x/T)]>0&&!(e.cx>0))e.alive=false});
 {const al=ents.filter(e=>e.alive);if(al.length<=1)endRound(al.length?ents.indexOf(al[0]):-1)}}
const sheet=new Image();sheet.src='';
document.documentElement.style.setProperty('--sheet','url('+sheet.src+')');
const ice8=new Image();ice8.src='';
const icn=new Image();icn.src='';
const frm=new Image();frm.src='';
const ablk=new Image();ablk.src='';
const aflr=new Image();aflr.src='';
const ASTMAP=["#################", "#S.............S#", "#.#.#########.#.#", "#.#.....#.....#.#", "#.#.###.#.###.#.#", "#.#.#.......#.#.#", "#.#.#.#####.#.#.#", "#...#.......#...#", "#.#.#.#####.#.#.#", "#.#.#.......#.#.#", "#.#.###.#.###.#.#", "#.#.....#.....#.#", "#.#.#########.#.#", "#S.............S#", "#################"];
const cblk=new Image();cblk.src='';
const cflr=new Image();cflr.src='';
const cfrm=new Image();cfrm.src='';
const cbg=new Image();cbg.src='';
const CRYOMAP=["#################", "#S....W...W....S#", "#.#.#W#W#W#W#.#.#", "#...W.......W...#", "#.#W#W#.#.#W#W#.#", "#...............#", "#.#.#W#.#.#W#.#.#", "#...............#", "#.#.#W#.#.#W#.#.#", "#...............#", "#.#W#W#.#.#W#W#.#", "#...W.......W...#", "#.#.#W#W#W#W#.#.#", "#S....W...W....S#", "#################"];
const bblk=new Image();bblk.src='';
const bflr=new Image();bflr.src='';
const bfrm=new Image();bfrm.src='';
const bbg=new Image();bbg.src='';
const bhole=new Image();bhole.src='';
const bring=new Image();bring.src='';
const btrap=new Image();btrap.src='';
const bth=new Image();bth.src='';
const btv=new Image();btv.src='';
const mcblk=new Image();mcblk.src='';
const mcflr=new Image();mcflr.src='';
const mcdoor=new Image();mcdoor.src='';
const mcel=new Image();mcel.src='';
const mcal=new Image();mcal.src='';
const mcbg=new Image();mcbg.src='';
const MCMAP=["#################", "#S.............S#", "#.#.#.#.#.#.#.#.#", "#.......D.......#", "#.#.#.#.#.#.#.#.#", "#..EEE..D..EEE..#", "#.#.#.#.#.#.#.#.#", "#...D..EEE..D...#", "#.#D#.#.#.#.#D#.#", "#..EEE..D..EEE..#", "#.#.#.#.#.#.#.#.#", "#.......D.......#", "#.#.#.#.#.#.#.#.#", "#S.............S#", "#################"];
const blk=new Image();blk.src='';
const flr=new Image();flr.src='';
let CW=0,CH=0,DPR=1,SC=1,AX=0,AY=0,ACX=0,ACY=0;const CC=['#f1f3ff','#2f80ed','#e03131','#8d93ad'];
const crowd=[],CWL=['#4c6ef5','#9c36b5','#3bc9db','#f06595','#5c7cfa'];
function ln(x1,y1,x2,y2,c){g.strokeStyle=c;g.shadowColor=c;g.shadowBlur=10;g.lineWidth=4;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.shadowBlur=0}
function drawBlkM(i,px,py){if(!mcblk.naturalWidth)return false;g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(px+T/2,py+T-2,T*.44,5,0,0,7);g.fill();g.drawImage(mcblk,i*96,0,96,96,px-3,py-6,T+6,T+6);return true}
function drawBlkB(i,px,py){if(!bblk.naturalWidth)return false;g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(px+T/2,py+T-2,T*.44,5,0,0,7);g.fill();g.drawImage(bblk,i*96,0,96,96,px-3,py-6,T+6,T+6);return true}
function drawBlkC(i,px,py){if(!cblk.naturalWidth)return false;g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(px+T/2,py+T-2,T*.44,5,0,0,7);g.fill();g.drawImage(cblk,i*96,0,96,96,px-3,py-6,T+6,T+6);return true}
function drawBlkA(i,px,py){if(!ablk.naturalWidth)return false;g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(px+T/2,py+T-2,T*.44,5,0,0,7);g.fill();g.drawImage(ablk,i*96,0,96,96,px-3,py-6,T+6,T+6);return true}
function drawBlk(i,px,py){if(!blk.naturalWidth)return false;g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px+T/2,py+T-2,T*.46,5,0,0,7);g.fill();g.drawImage(blk,i*96,0,96,96,px-4,py-5,T+8,T+8);return true}
function resize(){fitMenu();if(!document.body.classList.contains('full')){DPR=1;CW=W*T+88;CH=H*T+88;SC=1;AX=44;AY=44;ACX=CW/2;ACY=CH/2;cv.width=CW;cv.height=CH;
 crowd.length=0;for(let i=0;i<800;i++){const x=Math.random()*CW,y=Math.random()*CH;if(x>36&&x<CW-36&&y>36&&y<CH-36)continue;crowd.push([x,y,CWL[i%5],Math.random()*6])}
 g.imageSmoothingQuality='high';return}
DPR=Math.min(window.devicePixelRatio||1,1.75);const w=innerWidth,h=innerHeight;CW=w;CH=h;cv.width=Math.round(w*DPR);cv.height=Math.round(h*DPR);
 const land=w>h,top=land?60:72,bot=land?8:178;
 SC=Math.min((w-16)/(W*T+16),(h-top-bot)/(H*T+16));AX=(w-W*T*SC)/2;AY=top+((h-top-bot)-H*T*SC)/2;ACX=AX+W*T*SC/2;ACY=AY+H*T*SC/2;
 crowd.length=0;const n=Math.floor(w*h/650);for(let i=0;i<n;i++){const x=Math.random()*w,y=Math.random()*h;if(x>AX-8&&x<AX+W*T*SC+8&&y>AY-8&&y<AY+H*T*SC+8)continue;crowd.push([x,y,CWL[i%5],Math.random()*6])}
 g.imageSmoothingQuality='high'}
function freeTile(minD,fx,fy){for(let i=0;i<80;i++){const x=1+Math.floor(Math.random()*(W-2)),y=1+Math.floor(Math.random()*(H-2));
  if(grid[y][x]!=0||bombAt(x,y)||fire[y][x]>0||portals.some(p=>p.x==x&&p.y==y))continue;
  if(minD&&Math.abs(x-fx)+Math.abs(y-fy)<minD)continue;return[x,y]}return null}
function impact(m){const{x,y}=m;grid[y][x]=0;sfx('boom');bursts.push({x:x*T+T/2,y:y*T+T/2,l:.35});
 for(const[dx,dy]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<1||ny<1||nx>=W-1||ny>=H-1||grid[ny][nx]==1)continue;
  if(grid[ny][nx]==2){grid[ny][nx]=0;dropAt(nx,ny)}fire[ny][nx]=.6;
  if(parts.length<500)for(let j=0;j<4;j++)parts.push({x:nx*T+T/2,y:ny*T+T/2,vx:(Math.random()-.5)*80,vy:-Math.random()*90-20,l:.5+Math.random()*.4,m:.9})}
 for(let j=0;j<10;j++)parts.push({x:x*T+T/2,y:y*T+T/2,vx:(Math.random()-.5)*140,vy:-Math.random()*120-30,l:.7+Math.random()*.4,m:1,c:'#6b7280'})}
function astEvents(dt){
 pT-=dt;if(pT<=0){pT=20;portals=[];for(let i=0;i<2;i++){const t=freeTile(0);if(t)portals.push({x:t[0],y:t[1],l:14,age:0})}msgT=1.8;msgUp=1;msgTxt='🌀 ¡PORTALES!'}
 portals.forEach(p=>{p.l-=dt;p.age+=dt});portals=portals.filter(p=>p.l>0);
 ents.forEach(e=>{if(!e.alive)return;e.pc=(e.pc||0)-dt;if(e.pc>0)return;const tx=Math.floor(e.x/T),ty=Math.floor(e.y/T);
  if(portals.some(p=>p.x==tx&&p.y==ty)){const t=freeTile(5,tx,ty);if(t){e.x=t[0]*T+T/2;e.y=t[1]*T+T/2;e.path=[];e.through.clear();e.pc=2;bursts.push({x:e.x,y:e.y,l:.35});sfx('warp')}}});
 mT-=dt;if(mT<=0){mT=20;const sp=[[1,1],[W-2,1],[1,H-2],[W-2,H-2]],c=[];
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(grid[y][x]!=1||meteors.some(m=>m.x==x&&m.y==y))continue;
   if(sp.some(([a,b])=>Math.abs(x-a)+Math.abs(y-b)<=3))continue;
   let o=0;for(const[dx,dy]of DIRS)if(grid[y+dy][x+dx]!=1)o++;if(o>=2)c.push([x,y])}
  const pick=[];for(let n=0;n<5&&c.length;n++){const i=Math.floor(Math.random()*c.length),[x,y]=c.splice(i,1)[0];pick.push([x,y]);for(let j=c.length-1;j>=0;j--)if(Math.abs(c[j][0]-x)+Math.abs(c[j][1]-y)<4)c.splice(j,1)}
  pick.forEach(([x,y],i)=>meteors.push({x,y,t:1.6+i*.2}));if(pick.length){msgT=2;msgUp=0;msgTxt='☄️ ¡LLUVIA DE METEOROS!'}}
 meteors.forEach(m=>{m.t-=dt;if(m.t<=0)impact(m)});meteors=meteors.filter(m=>m.t>0)}
function wallHit(x,y){const k=K(x,y);wallHp[k]=(wallHp[k]||2)-1;fire[y][x]=0;
 if(wallHp[k]<=0){grid[y][x]=0;delete wallHp[k];melts.push({x,y,l:.7});sfx('ice');dropAt(x,y);if(parts.length<500)for(let j=0;j<8;j++)parts.push({x:x*T+T/2,y:y*T+T/2,vx:(Math.random()-.5)*110,vy:-Math.random()*100-20,l:.6+Math.random()*.4,m:1,c:'#9bd8ff'})}}
function cryoEvents(dt){
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(iceZ[y][x]>0)iceZ[y][x]-=dt;
 melts.forEach(m=>m.l-=dt);melts=melts.filter(m=>m.l>0);
 izT-=dt;if(izT<=0){izT=20;const sp=[[1,1],[W-2,1],[1,H-2],[W-2,H-2]];
  for(let n=0;n<2;n++){let cx,cy,t=0;do{cx=2+Math.floor(Math.random()*(W-4));cy=2+Math.floor(Math.random()*(H-4));t++}while(t<30&&sp.some(([a,b])=>Math.abs(cx-a)+Math.abs(cy-b)<4));
   for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)if(grid[y][x]!=1&&grid[y][x]!=3)iceZ[y][x]=10}
  msgT=1.8;msgUp=1;msgTxt='❄️ ¡HIELO EN EL SUELO!'}}
function cryoSlide(e,jx,jy,dt){if(arena!='cryo')return false;const ti=Math.floor(e.x/T),tj=Math.floor(e.y/T);
 if(!(iceZ[tj]&&iceZ[tj][ti]>0)){e.vx=0;e.vy=0;return false}
 const m=Math.hypot(jx,jy),nx=m>1?jx/m:jx,ny=m>1?jy/m:jy;
 e.vx=(e.vx||0)+nx*260*dt;e.vy=(e.vy||0)+ny*260*dt;
 const sp=Math.hypot(e.vx,e.vy),mx=e.spd*1.25;if(sp>mx){e.vx*=mx/sp;e.vy*=mx/sp}
 const fr=Math.max(0,1-1.5*dt);e.vx*=fr;e.vy*=fr;
 const px=e.x+e.vx*dt;if(!hit(px,e.y,e))e.x=px;else e.vx=0;
 const py=e.y+e.vy*dt;if(!hit(e.x,py,e))e.y=py;else e.vy=0;
 if(Math.hypot(e.vx,e.vy)>8){e.mv=true;e.dir=Math.abs(e.vx)>Math.abs(e.vy)?(e.vx<0?1:3):(e.vy<0?2:0)}
 return true}
const HX=8*T+T/2,HY=7*T+T/2;
function armPts(i,tm){const a0=tm*.9+i*2.0944,L=Math.min(5,(3.6+1.4*Math.sin(tm*1.7+i))*Math.min(1,tm/.6)),pts=[[HX+Math.cos(a0)*26,HY+Math.sin(a0)*26]];
 for(let k=0;k<5;k++){const len=Math.min(1,Math.max(0,L-k))*T;if(len<=0)break;const a=a0-k*.2,p=pts[pts.length-1];pts.push([p[0]+Math.cos(a)*len,p[1]+Math.sin(a)*len])}
 return pts}
function drawArm(i,tm){const pts=armPts(i,tm);for(let k=0;k<pts.length-1;k++){const p=pts[k],q=pts[k+1],len=Math.hypot(q[0]-p[0],q[1]-p[1]),an=Math.atan2(q[1]-p[1],q[0]-p[0]);
 if(!bth.naturalWidth)return;g.save();g.translate(p[0],p[1]);g.rotate(an);g.drawImage(bth,k*64,0,64,64,0,-T*.5,len+1,T);g.restore()}}
function throwNearBomb(e){const bs=bombs.filter(b=>!(b.fl>0));let tx,ty;
 if(bs.length){for(let n=0;n<40;n++){const b=bs[Math.floor(Math.random()*bs.length)],x=b.x+Math.floor(Math.random()*5)-2,y=b.y+Math.floor(Math.random()*5)-2;
  if(x>0&&y>0&&x<W-1&&y<H-1&&grid[y][x]==0&&!bombAt(x,y)&&!(Math.abs(x-8)<=1&&Math.abs(y-7)<=1)&&(x!=b.x||y!=b.y)){tx=x;ty=y;break}}}
 if(tx===undefined){const t=freeTile(5,Math.floor(e.x/T),Math.floor(e.y/T));if(t){tx=t[0];ty=t[1]}}
 if(tx===undefined)return;e.x=tx*T+T/2;e.y=ty*T+T/2;e.path=[];e.through.clear();e.gc=3;bursts.push({x:e.x,y:e.y,l:.35})}
function bhEvents(dt){bhC+=dt;const cyc=(bhC+15)%30;let ph=0;if(cyc>=28)ph=1;else if(cyc<5)ph=2;else if(cyc<13)ph=3;
 if(ph!=bhPh){bhPh=ph;msgT=2;msgUp=0;if(ph==1)msgTxt='🕳️ ¡SE DESPIERTA!';else if(ph==2){msgTxt='🕳️ ¡AGUJERO ACTIVO!';sfx('warp')}else if(ph==3)msgTxt='⚠️ ¡TENTÁCULOS!';else msgT=0}
 bhA=ph==2;tentTiles=new Set();ents.forEach(e=>{if(e.gc>0)e.gc-=dt});
 if(bhA){
  ents.forEach(e=>{if(!e.alive)return;const dx=HX-e.x,dy=HY-e.y,d=Math.hypot(dx,dy);
   if(d<36){e.alive=false;bursts.push({x:e.x,y:e.y,l:.35});sfx('warp');return}
   if(d<128&&!(e.tr>0)){const st=(12+(1-d/128)*38)*dt,nx=e.x+dx/d*st,ny=e.y+dy/d*st;if(!hit(nx,e.y,e))e.x=nx;if(!hit(e.x,ny,e))e.y=ny}});
  bombs=bombs.filter(b=>{if(b.fl>0)return true;const bx=b.x*T+T/2,by=b.y*T+T/2;if(Math.hypot(bx-HX,by-HY)<36){bursts.push({x:bx,y:by,l:.25});return false}return true});
  bombs.forEach(b=>{if(b.fl>0)return;const dx=8-b.x,dy=7-b.y;if(Math.hypot(dx,dy)>4.2)return;b.pu=(b.pu||0)+dt;if(b.pu<1)return;b.pu=0;
   const tryMove=(sx,sy)=>{const nx=b.x+sx,ny=b.y+sy;if((sx||sy)&&!solidT(nx,ny)&&!bombAt(nx,ny)){b.x=nx;b.y=ny;ents.forEach(e=>{if(Math.abs(e.x-(b.x*T+T/2))<T/2+HS&&Math.abs(e.y-(b.y*T+T/2))<T/2+HS)e.through.add(b)});return true}return false};
   if(Math.abs(dx)>=Math.abs(dy)){if(!tryMove(Math.sign(dx),0))tryMove(0,Math.sign(dy))}else{if(!tryMove(0,Math.sign(dy)))tryMove(Math.sign(dx),0)}})}
 if(ph==3){const tm=cyc-5;
  for(let i=0;i<3;i++){const pts=armPts(i,tm);
   for(let k=0;k<pts.length-1;k++){const p=pts[k],q=pts[k+1],len=Math.hypot(q[0]-p[0],q[1]-p[1]);
    for(let s2=0;s2<=len;s2+=14){const x=p[0]+(q[0]-p[0])*s2/Math.max(len,1),y=p[1]+(q[1]-p[1])*s2/Math.max(len,1),tx=Math.floor(x/T),ty=Math.floor(y/T);
     if(tx>0&&ty>0&&tx<W-1&&ty<H-1){tentTiles.add(K(tx,ty));if(grid[ty][tx]==2){grid[ty][tx]=0;dropAt(tx,ty);if(parts.length<500)for(let j=0;j<4;j++)parts.push({x:tx*T+T/2,y:ty*T+T/2,vx:(Math.random()-.5)*100,vy:-Math.random()*90-20,l:.5,m:.9,c:'#a78bfa'})}}}
    ents.forEach(e=>{if(!e.alive||e.gc>0||e.tr>0)return;const vx=q[0]-p[0],vy=q[1]-p[1],wx=e.x-p[0],wy=e.y-p[1],tt=len?Math.max(0,Math.min(1,(vx*wx+vy*wy)/(len*len))):0,cx=p[0]+vx*tt,cy=p[1]+vy*tt;
     if(Math.hypot(e.x-cx,e.y-cy)<16){if(Math.hypot(cx-HX,cy-HY)<=80){throwNearBomb(e);sfx('launch')}else{e.tr=5;e.fz=Math.max(e.fz,5);e.gc=7;sfx('ice')}}})}}}}
const MCA=[[4, 7], [12, 7], [8, 3], [8, 11]],MCZ=[{c:[[3, 5], [4, 5], [5, 5]],o:0},{c:[[11, 5], [12, 5], [13, 5]],o:4},{c:[[3, 9], [4, 9], [5, 9]],o:4},{c:[[11, 9], [12, 9], [13, 9]],o:0},{c:[[7, 7], [8, 7], [9, 7]],o:2}];
function doorNear(x,y){return doors.some(d=>Math.abs(d.x-x)+Math.abs(d.y-y)<=1)}
function mcEvents(dt){mcClock+=dt;const alarm=mt>=90;
 if(alarm&&!mcAlarm){mcAlarm=true;msgT=2.4;msgUp=0;msgTxt='🚨 ¡ALARMA! PUERTAS SELLADAS'}
 const cyc=mcClock%8;
 doors.forEach(d=>{const want=alarm?0:(d.g=='A'?(cyc<4?1:0):(cyc>=4?1:0));
  const busy=ents.some(e=>e.alive&&Math.abs(e.x-(d.x*T+T/2))<T/2+HS&&Math.abs(e.y-(d.y*T+T/2))<T/2+HS)||bombs.some(b=>b.x==d.x&&b.y==d.y);
  if(want&&!d.tg)d.tg=1;else if(!want&&d.tg&&!busy)d.tg=0;if(!d.tg&&d.tr>0&&busy)d.tg=1;
  const sp=dt/.45;d.tr=d.tg?Math.min(1,d.tr+sp):Math.max(0,d.tr-sp);grid[d.y][d.x]=d.tr<.55?4:0});
 const C=alarm?5:8;mcDanger=new Set();
 MCZ.forEach(z=>{const p=((mcClock+z.o)%C+C)%C;z.st=p>=C-1?2:(p>=C-2.5?1:0);
  if(z.st>=1)z.c.forEach(([x,y])=>mcDanger.add(K(x,y)));
  if(z.st==2)ents.forEach(e=>{if(!e.alive)return;const tx=Math.floor(e.x/T),ty=Math.floor(e.y/T);if(z.c.some(([x,y])=>x==tx&&y==ty)){e.alive=false;bursts.push({x:e.x,y:e.y,l:.35});sfx('warp')}})})}
function genArena(){deco={};wallHp={};doors=[];
 if(arena==='mc'){const sp=[[1,1],[W-2,1],[1,H-2],[W-2,H-2]];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const ch=MCMAP[y][x];let v=0;if(ch=='#')v=1;else if(ch=='D'){v=4;const g=MCA.some(([a,b])=>a==x&&b==y)?'A':'B';doors.push({x,y,g,tr:g=='A'?1:0,tg:g=='A'?1:0});if(g=='A')v=0}else if(ch=='E'||sp.some(([a,b])=>Math.abs(x-a)+Math.abs(y-b)<=1))v=0;else v=Math.random()<.6?2:0;grid[y][x]=v}return}
 if(arena==='bh'){for(let y=6;y<=8;y++)for(let x=7;x<=9;x++)grid[y][x]=0;return}
 if(arena==='cryo'){const sp=[[1,1],[W-2,1],[1,H-2],[W-2,H-2]];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const ch=CRYOMAP[y][x];let v=0;if(ch=='#')v=1;else if(ch=='W'){v=3;wallHp[K(x,y)]=2}else if(!sp.some(([a,b])=>Math.abs(x-a)+Math.abs(y-b)<=1))v=Math.random()<.45?2:0;grid[y][x]=v}return}
 if(arena==='ast'){const sp=[[1,1],[W-2,1],[1,H-2],[W-2,H-2]];for(let y=0;y<H;y++)for(let x=0;x<W;x++)grid[y][x]=ASTMAP[y][x]=='#'?1:(sp.some(([a,b])=>Math.abs(x-a)+Math.abs(y-b)<=1)?0:(Math.random()<.5?2:0));return}
 if(arena!=='rock')return;
 [[4,4],[12,4],[4,10],[12,10],[8,6],[8,8]].forEach(([x,y])=>{if(grid[y][x]==1)deco[K(x,y)]='spk'});
 const crd=[[1,6],[1,7],[1,8],[15,6],[15,7],[15,8],[7,1],[8,1],[9,1]],saved=crd.map(([x,y])=>[x,y,grid[y][x]]);
 crd.forEach(([x,y])=>{grid[y][x]=1;deco[K(x,y)]='crd'});
 const S=[[1,1],[W-2,1],[1,H-2],[W-2,H-2]],seen=new Set([K(1,1)]),q=[[1,1]];
 while(q.length){const[x,y]=q.shift();for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H||grid[ny][nx]==1||seen.has(K(nx,ny)))continue;seen.add(K(nx,ny));q.push([nx,ny])}}
 if(!S.every(([x,y])=>seen.has(K(x,y)))){saved.forEach(([x,y,v])=>{grid[y][x]=v});crd.forEach(([x,y])=>delete deco[K(x,y)])}}
function drawSpike(px,py){const cx=px+T/2,cy=py+T/2,s=9,pul=.6+.4*(1-bf);
 g.fillStyle='rgba(0,0,0,.55)';g.beginPath();g.ellipse(cx,py+T-2,T*.42,5,0,0,7);g.fill();
 g.fillStyle='#17181f';g.beginPath();g.moveTo(cx-s+3,cy-s);g.lineTo(cx+s-3,cy-s);g.lineTo(cx+s,cy-s+3);g.lineTo(cx+s,cy+s-3);g.lineTo(cx+s-3,cy+s);g.lineTo(cx-s+3,cy+s);g.lineTo(cx-s,cy+s-3);g.lineTo(cx-s,cy-s+3);g.closePath();g.fill();
 g.strokeStyle='#454957';g.lineWidth=1.5;g.stroke();
 g.fillStyle='#2b2d39';g.beginPath();g.moveTo(cx,cy-s+2);g.lineTo(cx+s-2,cy);g.lineTo(cx,cy+s-2);g.lineTo(cx-s+2,cy);g.closePath();g.fill();
 g.strokeStyle='#3b3e4c';g.lineWidth=1;g.beginPath();g.moveTo(cx-s,cy-s);g.lineTo(cx+s,cy+s);g.moveTo(cx+s,cy-s);g.lineTo(cx-s,cy+s);g.stroke();
 g.fillStyle='#8a8fa3';for(const[bx,by]of[[-1,-1],[1,-1],[1,1],[-1,1]]){g.beginPath();g.arc(cx+bx*(s-2.5),cy+by*(s-2.5),1.4,0,7);g.fill()}
 g.shadowColor='#2f9bff';g.shadowBlur=9*pul;g.fillStyle='rgba(130,205,255,'+(.78+.22*pul)+')';
 for(const[ax,ay]of[[0,-1],[1,0],[0,1],[-1,0]]){const bx=cx+ax*s,by=cy+ay*s,tx=cx+ax*(s+8),ty=cy+ay*(s+8),qx=-ay*3.6,qy=ax*3.6;g.beginPath();g.moveTo(bx+qx,by+qy);g.lineTo(tx,ty);g.lineTo(bx-qx,by-qy);g.closePath();g.fill()}
 g.shadowBlur=0;g.fillStyle='#9aa0b4';for(const[ax,ay]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const bx=cx+ax*(s-1),by=cy+ay*(s-1);g.beginPath();g.moveTo(bx-ay*2,by+ax*2);g.lineTo(bx+ax*5,by+ay*5);g.lineTo(bx+ay*2,by-ax*2);g.closePath();g.fill()}
 return true}
function drawDeco(x,y,px,py){const t=deco[K(x,y)];if(!t)return false;const nw=performance.now()/1000,hc='hsl('+((kickN*53)%360)+',90%,60%)';
 g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px+T/2,py+T-2,T*.46,5,0,0,7);g.fill();
 if(t=='spk'){g.fillStyle='#14141f';rr(px+2,py-4,T-4,T+1,5);g.fill();g.strokeStyle=hc;g.shadowColor=hc;g.shadowBlur=6+6*(1-bf);g.lineWidth=2;rr(px+2,py-4,T-4,T+1,5);g.stroke();g.shadowBlur=0;
  const r1=8+2*(1-bf),r2=3.5+(1-bf);g.fillStyle='#2b2b3d';g.beginPath();g.arc(px+T/2,py+T/2+4,r1,0,7);g.fill();g.fillStyle='#0b0b12';g.beginPath();g.arc(px+T/2,py+T/2+4,r1-3,0,7);g.fill();g.fillStyle=hc;g.beginPath();g.arc(px+T/2,py+T/2+4,2.2,0,7);g.fill();
  g.fillStyle='#2b2b3d';g.beginPath();g.arc(px+T/2,py+4,r2,0,7);g.fill()}
 else{g.fillStyle='#1b1030';rr(px+1,py+1,T-2,T-2,5);g.fill();const cl=['#f06595','#ffd43b','#4dabf7','#69db7c','#ff922b','#da77f2'];
  for(let i=0;i<7;i++){const cx=px+5+(i%3)*11+(Math.floor(i/3)%2)*4,cy=py+9+Math.floor(i/3)*10+Math.sin(nw*6+x*3+y*5+i*1.7)*2;g.fillStyle=cl[(i+x*3+y)%6];g.beginPath();g.arc(cx,cy,3.2,0,7);g.fill();g.fillRect(cx-2.5,cy+3,5,4);g.fillRect(cx-4.5,cy-4+Math.sin(nw*8+i)*2,1.6,5)}
  g.strokeStyle='#e599f7';g.lineWidth=1.5;rr(px+1,py+1,T-2,T-2,5);g.stroke()}
 return true}
function rr(x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function flame(x,y,h,w,c,st){g.fillStyle=c;g.globalAlpha=.55+.45*st;g.beginPath();g.moveTo(x-w,y);g.quadraticCurveTo(x-w*1.1,y-h*.55,x+Math.sin(x*3)*1.5,y-h);g.quadraticCurveTo(x+w*1.1,y-h*.55,x+w,y);g.quadraticCurveTo(x,y+w*.6,x-w,y);g.fill();g.globalAlpha=1}
function draw(){
 const now=performance.now()/1000;g.setTransform(DPR,0,0,DPR,0,0);
 if(AC&&!muted&&kicks.length&&AC.currentTime-kicks[kicks.length-1]<1){while(kicks.length>1&&kicks[1]<=AC.currentTime){kicks.shift();kickN++}bf=Math.max(0,Math.min(1,(AC.currentTime-kicks[0])/.45))}else{const qq=now*2.1;kickN=Math.floor(qq);bf=qq-kickN}
 g.fillStyle='#0a0c22';g.fillRect(0,0,CW,CH);
 if(arena=='mc'){}else if((arena=='cryo'||arena=='bh')&&(arena=='cryo'?cbg:bbg).naturalWidth){const IM=arena=='cryo'?cbg:bbg,k=Math.max(CW/IM.naturalWidth,CH/IM.naturalHeight),dw=IM.naturalWidth*k,dh=IM.naturalHeight*k;g.drawImage(IM,(CW-dw)/2,(CH-dh)/2,dw,dh);g.fillStyle='rgba(2,8,24,.35)';g.fillRect(0,0,CW,CH)}else crowd.forEach(d=>{const bb=Math.sin(now*3+d[3])*1.5;g.globalAlpha=.55+.4*Math.sin(now*2+d[3]);g.fillStyle=d[2];g.fillRect(d[0],d[1]+bb,3,3);g.fillRect(d[0]-.5,d[1]+3+bb,4,2)});g.globalAlpha=1;
 const x0=AX-4*SC,y0=AY-4*SC,x1=AX+(W*T+4)*SC,y1=AY+(H*T+4)*SC,mx=(x0+x1)/2,my=(y0+y1)/2;
 ln(x0,y0,mx,y0,CC[0]);ln(mx,y0,x1,y0,CC[1]);ln(x1,y0,x1,my,CC[1]);ln(x1,my,x1,y1,CC[3]);ln(x1,y1,mx,y1,CC[3]);ln(mx,y1,x0,y1,CC[2]);ln(x0,y1,x0,my,CC[2]);ln(x0,my,x0,y0,CC[0]);
 g.fillStyle='#8ab4ff';g.font='bold 20px sans-serif';g.textAlign='center';g.shadowColor='#4c6ef5';g.shadowBlur=10;g.fillText('BOOMGO',ACX,Math.min(CH-6,y1+24));g.shadowBlur=0;
 g.save();g.translate(AX,AY);g.scale(SC,SC);
 if(arena=='mc'&&mcbg.naturalWidth)g.drawImage(mcbg,-240.6,-175.3,1026.5,823.4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(arena=='mc'&&mcflr.naturalWidth){g.drawImage(mcflr,(doorNear(x,y)?64:0),0,64,64,x*T,y*T,T,T)}else if(arena=='bh'&&bflr.naturalWidth){g.drawImage(bflr,0,0,64,64,x*T,y*T,T,T)}else if(arena=='cryo'&&cflr.naturalWidth){g.drawImage(cflr,0,0,64,64,x*T,y*T,T,T)}else if(arena=='ast'&&aflr.naturalWidth){g.drawImage(aflr,0,0,64,64,x*T,y*T,T,T)}else if(arena=='rock'){g.fillStyle=(x+y)%2?'#08080c':'#0c0c12';g.fillRect(x*T,y*T,T,T);g.strokeStyle='rgba(255,45,45,.38)';g.lineWidth=1;g.strokeRect(x*T+.5,y*T+.5,T-1,T-1);g.fillStyle='rgba(255,70,70,.85)';g.fillRect(x*T-1,y*T-1,3,3)}else if(flr.naturalWidth){g.drawImage(flr,((x*3+y*5)%7==0?64:0),0,64,64,x*T,y*T,T,T)}else{g.fillStyle=(x+y)%2?'#2a3050':'#252a48';g.fillRect(x*T,y*T,T,T);g.strokeStyle='rgba(120,140,255,.13)';g.strokeRect(x*T+.5,y*T+.5,T-1,T-1);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x*T+1,y*T+1,T-2,2);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(x*T+1,y*T+T-3,T-2,2)}}
 if(arena=='rock'){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.08+.12*(1-bf);g.fillStyle='hsl('+((kickN*53)%360)+',100%,50%)';g.fillRect(0,0,W*T,H*T);g.globalCompositeOperation='lighter';g.globalAlpha=.07*(1-bf);g.fillRect(0,0,W*T,H*T);g.restore()}
 if(arena=='bh'&&bhole.naturalWidth){const act=bhA,wn=bhPh==1;g.save();g.translate(HX,HY);
  if(act||wn){g.globalAlpha=Math.min(1,(act?.55:.3+.35*Math.abs(Math.sin(now*9)))+.12*Math.sin(now*2));g.rotate(now*.25);g.drawImage(bring,-135,-135,270,270)}g.restore();
  g.save();g.translate(HX,HY);g.globalAlpha=act?1:.55;g.rotate(-now*(act?.8:.25));const hs=act?116:96;g.drawImage(bhole,-hs/2,-hs/2,hs,hs);g.restore();g.globalAlpha=1}
 if(arena=='cryo'&&cblk.naturalWidth){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(iceZ[y][x]>0){const v=iceZ[y][x];g.globalAlpha=Math.max(0,Math.min(1,(10-v)*2,v))*.85;g.drawImage(cblk,5*96,0,96,96,x*T,y*T,T,T)}g.globalAlpha=1}
 [[1,1],[W-4,1],[1,H-4],[W-4,H-4]].forEach(([zx,zy],i)=>{g.globalAlpha=.22;g.fillStyle=CC[i];g.fillRect(zx*T,zy*T,3*T,3*T);g.globalAlpha=1;
  g.strokeStyle=CC[i];g.shadowColor=CC[i];g.shadowBlur=10;g.lineWidth=2;g.strokeRect(zx*T+1,zy*T+1,3*T-2,3*T-2);g.shadowBlur=0});
 if(arena!='ast'&&arena!='cryo'&&arena!='bh'&&arena!='mc'){const cx=(W>>1)-1,cy=(H>>1)-1;g.strokeStyle='#ff922b';g.shadowColor='#ff922b';g.shadowBlur=8;g.lineWidth=2;g.setLineDash([8,6]);g.strokeRect(cx*T+2,cy*T+2,3*T-4,3*T-4);g.setLineDash([]);
  g.fillStyle='#22d3ee';g.shadowColor='#22d3ee';g.shadowBlur=14;g.fillRect((W>>1)*T+9,(H>>1)*T+9,T-18,T-18);g.shadowBlur=0}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=grid[y][x],px=x*T,py=y*T,edge=x==0||y==0||x==W-1||y==H-1;
  if(v==1){
   if(edge){if(!(arena=='ast'&&drawBlkA(0,px,py))&&!(arena=='cryo'&&drawBlkC(0,px,py))&&!(arena=='bh'&&drawBlkB(0,px,py))&&!(arena=='mc'&&drawBlkM(0,px,py))){g.fillStyle='#10132b';g.fillRect(px,py,T,T);g.fillStyle='#2d3a85';g.fillRect(px+2,py+2,T-4,3);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(px,py+T-4,T,4)}}
   else if(!drawDeco(x,y,px,py)&&!(arena=='rock'&&drawSpike(px,py))&&!(arena=='ast'&&drawBlkA(0,px,py))&&!(arena=='cryo'&&drawBlkC(0,px,py))&&!(arena=='bh'&&drawBlkB(0,px,py))&&!(arena=='mc'&&drawBlkM(0,px,py))&&!drawBlk(0,px,py)){g.fillStyle='rgba(0,0,0,.35)';rr(px+3,py+T-6,T-4,8,4);g.fill();
    g.fillStyle='#2f3560';rr(px+1,py+8,T-2,T-9,5);g.fill();
    g.fillStyle='#8a97e0';rr(px+1,py+1,T-2,15,6);g.fill();
    g.fillStyle='#aab6ff';rr(px+4,py+3,T-8,5,2.5);g.fill();
    g.strokeStyle='#0b0d1f';g.lineWidth=2;rr(px+1,py+1,T-2,T-2,6);g.stroke();
    g.fillStyle='#22d3ee';g.beginPath();g.arc(px+T/2,py+T/2+5,2.5,0,7);g.fill()}}
  else if(v==3){drawBlkC((wallHp[K(x,y)]||2)>1?2:3,px,py)}
  else if(v==2&&!(arena=='ast'&&drawBlkA(1,px,py))&&!(arena=='cryo'&&drawBlkC(1,px,py))&&!(arena=='bh'&&drawBlkB(1,px,py))&&!(arena=='mc'&&drawBlkM(1,px,py))&&!drawBlk(1,px,py)){
   g.fillStyle='rgba(0,0,0,.35)';rr(px+3,py+T-6,T-4,8,4);g.fill();
   g.fillStyle='#9a5416';rr(px+1,py+7,T-2,T-8,5);g.fill();
   g.fillStyle='#f0a24a';rr(px+1,py+1,T-2,16,6);g.fill();
   g.strokeStyle='#b8651b';g.lineWidth=1.5;g.beginPath();for(const q of[9,17,25]){g.moveTo(px+3,py+q);g.lineTo(px+T-3,py+q)}g.stroke();
   g.fillStyle='#ffd08a';rr(px+4,py+3,T-8,4,2);g.fill();
   g.strokeStyle='#4a2508';g.lineWidth=2;rr(px+1,py+1,T-2,T-2,6);g.stroke();
   g.fillStyle='#5b5b66';[[4,4],[T-7,4],[4,T-7],[T-7,T-7]].forEach(([a,b])=>g.fillRect(px+a,py+b,3,3))}}
 if(arena=='rock'&&frm.naturalWidth)g.drawImage(frm,-42.3,-23.6,629.6,536.7);
 if(arena=='bh'&&bfrm.naturalWidth)g.drawImage(bfrm,-57.7,-54.8,659.9,592.6);
 if(arena=='cryo'&&cfrm.naturalWidth)g.drawImage(cfrm,-52.04,-74.62,644.85,606.52);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(ice[y][x]>0){const a=Math.min(1,ice[y][x]/.5),cx=x*T+T/2,cy=y*T+T/2,gr=g.createRadialGradient(cx,cy,2,cx,cy,T*.85);gr.addColorStop(0,'rgba(220,243,255,'+(.55*a)+')');gr.addColorStop(1,'rgba(120,190,255,0)');g.fillStyle=gr;g.fillRect(cx-T,cy-T,T*2,T*2)}
 melts.forEach(m=>{g.globalAlpha=Math.max(0,m.l/.7);drawBlkC(4,m.x*T,m.y*T);g.globalAlpha=1});
 if(arena=='mc'){if(mcel.naturalWidth)MCZ.forEach(z=>z.c.forEach(([x,y])=>{const st=z.st||0;let f=0;if(st==1)f=Math.floor(now*6)%2?1:0;else if(st==2)f=2;g.drawImage(mcel,f*64,0,64,64,x*T,y*T,T,T);if(st==2)g.drawImage(mcel,(3+Math.floor(now*14)%4)*64,0,64,64,x*T,y*T,T,T)}));
  if(mcdoor.naturalWidth)doors.forEach(d=>{const f=d.tr>=1?5:d.tr<=0?0:1+Math.min(3,Math.floor(d.tr*4));g.drawImage(mcdoor,f*64,0,64,64,d.x*T,d.y*T,T,T)});
  if(mcAlarm&&mcal.naturalWidth)for(const[ax,ay]of[[-22,-22],[566,-22],[-22,502],[566,502]]){g.save();g.globalAlpha=.65+.35*Math.sin(now*9);g.drawImage(mcal,ax-6,ay-6,44,44);g.restore()}}
 if(arena=='bh'&&bhPh==3){const tm=(bhC+15)%30-5;for(let i=0;i<3;i++)drawArm(i,tm)}
 if(arena=='bh'&&bhPh==2&&((bhC+15)%30)>=4){g.strokeStyle='rgba(255,60,60,'+(.5+.4*Math.sin(now*16))+')';g.lineWidth=3;g.setLineDash([8,6]);g.beginPath();g.arc(HX,HY,5*T+16,0,7);g.stroke();g.setLineDash([])}
 portals.forEach(p=>{const cx=p.x*T+T/2,cy=p.y*T+T/2,sc=Math.min(1,p.age*3)*(p.l<2?.5+.5*Math.abs(Math.sin(now*10)):1);
 g.save();g.translate(cx,cy);g.scale(sc,sc);g.shadowColor='#8b5cf6';g.shadowBlur=14;
 for(let i=0;i<3;i++){g.save();g.rotate(now*(2+i)*(i%2?-1:1));g.strokeStyle=['#c4b5fd','#818cf8','#22d3ee'][i];g.lineWidth=2.5-i*.5;g.beginPath();g.arc(0,0,13-i*3.5,0,4.2);g.stroke();g.restore()}
 g.fillStyle='rgba(30,10,70,.7)';g.beginPath();g.arc(0,0,5,0,7);g.fill();g.restore()});
 meteors.forEach(m=>{const cx=m.x*T+T/2,cy=m.y*T+T/2,u=Math.max(0,1-m.t/1.6);
  g.fillStyle='rgba(255,60,40,'+(.18+.18*Math.sin(now*14))+')';g.beginPath();g.arc(cx,cy,T*.9,0,7);g.fill();g.strokeStyle='#ff4d4d';g.lineWidth=2;g.beginPath();g.arc(cx,cy,T*.9*(1-u*.3),0,7);g.stroke();
  if(m.t<.6){const k=m.t/.6,mx=cx-120*k,my=cy-220*k;g.save();g.shadowColor='#ff922b';g.shadowBlur=16;g.fillStyle='#ffb347';g.beginPath();g.moveTo(mx-7,my+4);g.lineTo(mx-22,my-40);g.lineTo(mx+7,my-4);g.fill();g.fillStyle='#6b7280';g.beginPath();g.arc(mx,my,11,0,7);g.fill();g.fillStyle='#374151';g.beginPath();g.arc(mx-3,my-3,4,0,7);g.fill();g.restore()}});
 items.forEach(i=>{const px=i.x*T,py=i.y*T,c={B:'#22d3ee',S:'#51cf66',C:'#ff922b',R:'#e599f7',Z:'#ffd43b',I:'#74c0fc',P:'#be4bdb',T:'#fcc419'}[i.k],bob=Math.sin(now*4+i.x)*1.5;
  if(icn.naturalWidth){g.shadowColor=c;g.shadowBlur=10;g.drawImage(icn,({B:0,C:1,S:2,R:3,Z:4,I:5,P:6,T:7})[i.k]*64,0,64,64,px+1,py+1+bob,T-2,T-2);g.shadowBlur=0;return}
  g.shadowColor=c;g.shadowBlur=10;g.fillStyle='#0d1030';g.fillRect(px+4,py+4+bob,T-8,T-8);g.strokeStyle=c;g.lineWidth=2;g.strokeRect(px+4,py+4+bob,T-8,T-8);g.shadowBlur=0;
  g.font='16px sans-serif';g.textAlign='center';g.fillStyle='#fff';g.fillText({B:'💣',S:'👟',C:'🔥',R:'📡',Z:'🚀',I:'❄️',P:'☠️',T:'⏱️'}[i.k],px+T/2,py+T/2+6+bob)});
 if(arena=='rock'&&state=='play'){const ph=(mt+10)%28;let a=0;if(ph>=24)a=.9;else if(ph>=22&&Math.floor(now*7)%2==0)a=.45;if(a>0){g.fillStyle='rgba(6,0,18,'+a+')';g.fillRect(0,0,W*T,H*T)}}
 bombs.forEach(b=>{const mxb=b.type=='MAX',c=mxb?'#ff4d4d':hk(b,'R')&&hk(b,'I')?'#b197fc':hk(b,'R')?'#e599f7':hk(b,'I')?'#74c0fc':'#22d3ee',p=1+Math.sin(hk(b,'R')?now*8:b.t*12)*.08;let bx=b.x*T+T/2,by=b.y*T+T/2;if(b.fl>0){const u=1-b.fl/.35;bx=(b.sx*T+T/2)*(1-u)+bx*u;by=(b.sy*T+T/2)*(1-u)+by*u-Math.sin(u*Math.PI)*26}
  if(!(b.fl>0)&&bombs.some(o=>o!==b&&o.x==b.x&&o.y==b.y&&bombs.indexOf(o)<bombs.indexOf(b))){bx+=8;by-=4}
  if(arena=='bh'&&bblk.naturalWidth&&!(b.fl>0)&&Math.hypot(b.x-8,b.y-7)<=4.2){g.globalAlpha=.55;g.drawImage(bblk,3*96,0,96,96,bx-17,by-17,34,34);g.globalAlpha=1}
  if(arena=='cryo'&&cblk.naturalWidth&&!(b.fl>0)&&b.t<100&&iceZ[b.y][b.x]>0){const f=6+Math.min(5,Math.floor((b.fzT||0)*4));g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(bx,by+12,10,4,0,0,7);g.fill();g.shadowColor='#7dd3fc';g.shadowBlur=8;g.drawImage(cblk,f*96,0,96,96,bx-17,by-22,34,34);g.shadowBlur=0;return}
  if(hk(b,'I')&&ice8.naturalWidth){const rm=b.t>100?99:b.t,f=rm>1.2?1+(Math.floor(now*4)%2):3+(Math.floor(now*8)%2);g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(bx,by+12,10,4,0,0,7);g.fill();g.shadowColor='#4cc9ff';g.shadowBlur=10;g.drawImage(ice8,f*112,0,112,112,bx-28,by-33,56,56);g.shadowBlur=0;return}
  g.shadowColor=c;g.shadowBlur=12;g.fillStyle=mxb?'#5c0f0f':'#0d1030';g.beginPath();g.arc(bx,by,12*p,0,7);g.fill();g.strokeStyle=c;g.lineWidth=2.5;g.stroke();g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(bx-4,by-5,4,2.5,-.5,0,7);g.fill();g.strokeStyle='#b8a07a';g.lineWidth=2;g.beginPath();g.moveTo(bx+5,by-10);g.quadraticCurveTo(bx+10,by-15,bx+12,by-12);g.stroke();g.fillStyle=Math.floor(now*14)%2?'#ffd43b':'#ff6b00';g.beginPath();g.arc(bx+12,by-12,2.4,0,7);g.fill();
  g.fillStyle='#fff';g.font='bold 10px sans-serif';g.textAlign='center';g.fillText(mxb?'MAX':hk(b,'R')&&hk(b,'I')?'R❄':hk(b,'R')?'R'+b.type:hk(b,'I')?'❄':'C'+b.type,bx,by+4)});
 ents.forEach((e,pi)=>{if(!e.alive)return;
  g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(e.x,e.y+13,11,4,0,0,7);g.fill();
  const bob=e.mv?Math.abs(Math.sin(now*12))*1.5:Math.sin(now*3)*.6,fr=e.mv?Math.floor(now*11+pi*2)%6:0;
  if(sheet.naturalWidth){g.save();g.translate(e.x,e.y+14-bob);g.shadowColor=e.col;g.shadowBlur=8;g.drawImage(sheet,fr*64,(pi*4+e.dir)*64,64,64,-21,-42,42,42);g.restore()}
  else{g.fillStyle=e.col;g.beginPath();g.arc(e.x,e.y,12,0,7);g.fill()}
  if(e.cx>0){g.save();g.shadowColor='#ff3b30';g.shadowBlur=16;g.strokeStyle='#ff6b4a';g.lineWidth=3;g.beginPath();g.arc(e.x,e.y,17+Math.sin(now*14)*2,0,7);g.stroke();g.restore();g.font='bold 22px sans-serif';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#000';g.strokeText(Math.ceil(e.cx),e.x,e.y-52);g.fillStyle='#ff4d3a';g.fillText(Math.ceil(e.cx),e.x,e.y-52)}
  if(e.pz>0){g.font='15px sans-serif';g.textAlign='center';g.fillText('☠️',e.x,e.y-48);g.strokeStyle='#be4bdb';g.shadowColor='#be4bdb';g.shadowBlur=10;g.lineWidth=2;g.beginPath();g.arc(e.x,e.y,15,0,7);g.stroke();g.shadowBlur=0}
  if(e.bot&&e.stun>0){g.font='16px sans-serif';g.textAlign='center';g.fillStyle='#fff';g.fillText(e.cage?'🔒':'❗',e.x,e.y-44+Math.sin(now*12)*2)}
  if(e.bot){g.font='11px sans-serif';g.textAlign='center';g.fillStyle='#fff';g.fillText((e.sp.R?'📡':'')+(e.sp.Z?'🚀':'')+(e.sp.I?'❄️':''),e.x,e.y+26)}
  if(e.tr>0&&btrap.naturalWidth){g.save();g.globalAlpha=.9;g.drawImage(btrap,e.x-22,e.y-36,44,56);g.restore()}
  if(e.fz>0&&!(e.tr>0)){g.fillStyle='rgba(116,192,252,.45)';g.fillRect(e.x-13,e.y-24,26,40);g.strokeStyle='#cdeeff';g.lineWidth=2;g.strokeRect(e.x-13,e.y-24,26,40)}
  g.font='bold 12px sans-serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#000';g.strokeText('C'+(pi+1),e.x,e.y-32);g.fillStyle=e.col;g.fillText('C'+(pi+1),e.x,e.y-32)});
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const f=fire[y][x];if(f<=0)continue;const st=Math.min(1,f/.3),cx=x*T+T/2,cy=y*T+T/2+8;
  g.globalCompositeOperation='lighter';const gr=g.createRadialGradient(cx,cy-6,2,cx,cy-6,T*.95);gr.addColorStop(0,'rgba(255,170,40,'+(.75*st)+')');gr.addColorStop(1,'rgba(255,60,0,0)');g.fillStyle=gr;g.fillRect(x*T-8,y*T-8,T+16,T+16);g.globalCompositeOperation='source-over';
  for(let i=0;i<3;i++){const ph=now*11+x*2.3+y*3.1+i*2,ox=(i-1)*8+Math.sin(ph)*2,h=(i==1?24:18)*(.45+.55*st)+Math.sin(ph*1.3)*3;
   flame(cx+ox,cy,h,10,'#ff3d00',st);flame(cx+ox,cy,h*.72,7,'#ff9d1c',st);flame(cx+ox,cy+1,h*.45,4.5,'#fff3a8',st)}}
 ibur.forEach(q=>{if(!ice8.naturalWidth)return;const u=1-q.l/.75,fr=u<.3?5:u<.62?6:7;g.globalAlpha=Math.min(1,q.l*3);g.drawImage(ice8,fr*112,0,112,112,q.x-75,q.y-75,150,150);g.globalAlpha=1});
 g.globalCompositeOperation='lighter';bursts.forEach(q=>{const u=1-q.l/.35,rad=16+u*52,gr=g.createRadialGradient(q.x,q.y,2,q.x,q.y,rad);gr.addColorStop(0,'rgba(255,255,230,'+(.9*(1-u))+')');gr.addColorStop(.5,'rgba(255,170,40,'+(.6*(1-u))+')');gr.addColorStop(1,'rgba(255,60,0,0)');g.fillStyle=gr;g.fillRect(q.x-rad,q.y-rad,rad*2,rad*2)});
 parts.forEach(q=>{g.globalAlpha=Math.max(0,q.l/q.m);if(q.sn){g.fillStyle='#eaf8ff';g.beginPath();g.arc(q.x,q.y,q.r,0,7);g.fill()}else if(q.c){g.fillStyle=q.c;g.fillRect(q.x-2,q.y-2,4,4)}else{g.fillStyle='#ffb347';g.beginPath();g.arc(q.x,q.y,2.2,0,7);g.fill()}});g.globalAlpha=1;g.globalCompositeOperation='source-over';
 g.restore();
 if(arena=='rock'){const bw=W*T*SC,sx=AX,sy=AY-44*SC,sh=19*SC,hue=(kickN*53)%360,hcl='hsl('+hue+',90%,60%)';
  g.fillStyle='#120a28';g.fillRect(ACX-130*SC,sy,260*SC,sh);g.strokeStyle=hcl;g.shadowColor=hcl;g.shadowBlur=10;g.lineWidth=2;g.strokeRect(ACX-130*SC,sy,260*SC,sh);
  g.textAlign='center';g.font='bold '+Math.max(10,15*SC)+'px sans-serif';g.fillStyle='#fff';g.fillText('BOOMGO ROCK FEST',ACX,sy+sh*.68);g.shadowBlur=0;
  g.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){const lx=sx+bw*(i+.5)/5,ang=Math.sin(now*1.4+i*1.3)*.5,len=H*T*SC*.7,hh=(hue+i*60)%360,ex=lx+Math.sin(ang)*len,ey=sy+sh+Math.cos(ang)*len;
   const gr=g.createLinearGradient(lx,sy+sh,ex,ey);gr.addColorStop(0,'hsla('+hh+',100%,60%,'+(.28+.2*(1-bf))+')');gr.addColorStop(1,'hsla('+hh+',100%,60%,0)');
   g.fillStyle=gr;g.beginPath();g.moveTo(lx-4*SC,sy+sh);g.lineTo(lx+4*SC,sy+sh);g.lineTo(ex+30*SC,ey);g.lineTo(ex-30*SC,ey);g.closePath();g.fill()}
  g.globalCompositeOperation='source-over';
  if(state=='play'){const ph=(mt+10)%28;if(ph>=22&&Math.floor(now*3)%2==0){g.textAlign='center';g.font='bold 20px sans-serif';g.fillStyle=ph>=24?'#ff6bd6':'#ffd43b';g.fillText(ph>=24?'🌑 ¡APAGÓN!':'⚠ apagón en '+Math.ceil(24-ph)+'s',ACX,AY+22*SC)}}}
 const el=Math.min(TA+50,mt),ms=Math.floor(el/60)+':'+String(Math.floor(el%60)).padStart(2,'0');
 if(mt>=(arena=='mc'?90:TA+10)&&state=='play'){const a=.1+.08*Math.sin(now*7);g.fillStyle='rgba(255,20,20,'+a+')';g.fillRect(0,0,CW,CH);
  g.save();g.translate(ACX,ACY);g.rotate(now*2.6);g.globalCompositeOperation='lighter';
  for(const sg of[1,-1]){const gr=g.createLinearGradient(0,0,sg*CW*.7,0);gr.addColorStop(0,'rgba(255,40,40,.35)');gr.addColorStop(1,'rgba(255,40,40,0)');g.fillStyle=gr;g.beginPath();g.moveTo(0,0);g.lineTo(sg*CW*.7,-60);g.lineTo(sg*CW*.7,60);g.closePath();g.fill()}
  g.restore();g.globalCompositeOperation='source-over';
  g.shadowColor='#ff0000';g.shadowBlur=18;g.fillStyle='rgba(255,40,40,'+(.55+.45*Math.sin(now*7))+')';for(const[cx,cy]of[[14,14],[CW-14,14],[14,CH-14],[CW-14,CH-14]]){g.beginPath();g.arc(cx,cy,8,0,7);g.fill()}g.shadowBlur=0;
  if(mt<(arena=='mc'?96:TA+16)&&Math.floor(now*4)%2==0){g.textAlign='center';g.font='bold 26px sans-serif';g.fillStyle='#ff3b3b';g.fillText('🚨 ¡ALERTA! 🚨',ACX,ACY+60)}}
 {const vg=g.createRadialGradient(ACX,ACY,CH*.35,ACX,ACY,CH*.85);vg.addColorStop(0,'rgba(0,0,30,0)');vg.addColorStop(1,'rgba(0,0,20,.45)');g.fillStyle=vg;g.fillRect(0,0,CW,CH)}
 
 
 if(msgT>0){g.globalAlpha=Math.min(1,msgT);g.textAlign='center';g.font='bold 30px sans-serif';g.fillStyle='#000';g.fillText(msgTxt,ACX+2,ACY-58);g.fillStyle=msgUp?'#69db7c':'#ff6b6b';g.fillText(msgTxt,ACX,ACY-60);g.globalAlpha=1}
 if(mt>=TA-10&&mt<TA&&state=='play'&&Math.floor(now*3)%2==0){g.textAlign='center';g.font='bold 54px sans-serif';g.fillStyle='#000';g.fillText(TXA,ACX+2,ACY-6);g.fillStyle='#ff1a1a';g.shadowColor='#ff1a1a';g.shadowBlur=16;g.fillText(TXA,ACX,ACY-8);g.shadowBlur=0;g.font='bold 16px sans-serif';g.fillText('¡El público se enoja en '+Math.ceil(TA-mt)+'s!',ACX,ACY+16)}
 if(mt>TA&&mt<TA+6&&state=='play'){g.font='bold 22px sans-serif';g.fillStyle='#000';g.fillText('¡El público se enojó!',ACX+1,ACY+1);g.fillStyle='#ff6b6b';g.fillText('¡El público se enojó!',ACX,ACY)}
 if(state=='play'&&!ents[ME].alive){g.textAlign='center';g.font='bold 18px sans-serif';g.fillStyle='#fff';g.shadowColor='#000';g.shadowBlur=6;g.fillText('👀 Observando (x3) · toca para saltar',ACX,AY+20);g.shadowBlur=0}
 if(state=='round'){g.fillStyle='rgba(0,0,0,.62)';g.fillRect(0,0,CW,CH);g.textAlign='center';g.fillStyle='#fff';g.font='bold 30px sans-serif';g.fillText('RONDA '+mRound,ACX,ACY-40);
  g.font='bold 22px sans-serif';g.fillStyle=rWin>=0?CC[rWin]:'#ffd43b';g.fillText(rWin>=0?'Gana '+CN[rWin]:'Empate: se repite la ronda',ACX,ACY);
  g.font='16px sans-serif';g.fillStyle='#fff';g.fillText(mScores.map((v,i)=>'C'+(i+1)+' '+(v?'★'.repeat(v):'–')).join('    '),ACX,ACY+34)}}
let rt=0,last=performance.now();
function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;if(netMode){netFrame(dt);draw()}else{if(!menuOpen){update(dt);if(state=='play'&&!ents[ME].alive){update(dt);update(dt)}draw()}if(!menuOpen&&state=='round'){rT-=dt;if(rT<=0)nextRound()}}if(!menuOpen&&mt>=(arena=='mc'?90:TA+10)&&state=='play')sirenOn();else sirenOff();rockAudio();rt-=dt;if(rt<0){rt=.15;refreshSel()}requestAnimationFrame(loop)}
const joy={x:0,y:0},jel=document.getElementById('joy'),knob=document.getElementById('knob');let jact=false;
function jmove(e){const r=jel.getBoundingClientRect(),R=r.width/2,vx=e.clientX-(r.left+R),vy=e.clientY-(r.top+R),len=Math.hypot(vx,vy)||1,k=Math.min(1,len/R);
 joy.x=vx/len*k;joy.y=vy/len*k;if(k<.15){joy.x=0;joy.y=0}
 knob.style.transform='translate('+(vx/len*k*R*.55)+'px,'+(vy/len*k*R*.55)+'px)'}
function jend(){jact=false;joy.x=0;joy.y=0;knob.style.transform=''}
jel.addEventListener('pointerdown',e=>{e.preventDefault();jact=true;jel.setPointerCapture(e.pointerId);jmove(e)});
jel.addEventListener('pointermove',e=>{if(jact)jmove(e)});
['pointerup','pointercancel'].forEach(v=>jel.addEventListener(v,jend));
document.getElementById('bomb').addEventListener('pointerdown',e=>{e.preventDefault();useB()});
document.querySelectorAll('#sel button').forEach(b=>b.addEventListener('click',()=>{if(+b.dataset.t>ents[ME].mx)return;sel=+b.dataset.t;
 document.querySelectorAll('#sel button').forEach(x=>x.classList.toggle('on',x==b))}));
function skipSpectate(){let n=0;while(state=='play'&&!ents[ME].alive&&n<30000){update(.016);n++}}
cv.addEventListener('pointerdown',()=>{if(netMode)return;if(state=='round')nextRound();else if(state=='play'&&!ents[ME].alive)skipSpectate()});
const KM={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
addEventListener('keydown',e=>{if(KM[e.key])keys[KM[e.key]]=1;if(e.key==' ')useB();
 if(e.key=='r')placeSpecial('R');if(e.key=='x')placeSpecial('I');if(e.key=='t')armToggle('R');if(e.key=='y')armToggle('I');if(e.key=='z')useZ();if(e.key=='e')detonate()});
addEventListener('keyup',e=>{if(KM[e.key])keys[KM[e.key]]=0});
document.getElementById('mute').addEventListener('click',e=>{muted=!muted;e.target.textContent=muted?'🔇':'🔊';if(mg)mg.gain.value=muted?0:.5});
bindSpecial('bR','R');bindSpecial('bI','I');
[['bZ',()=>useZ()],['bD',()=>detonate()]].forEach(([id,f])=>document.getElementById(id).addEventListener('pointerdown',e=>{e.preventDefault();f();refreshSel()}));
['pointerup','touchend','click','keydown'].forEach(v=>addEventListener(v,audioStart));
document.getElementById('ar').addEventListener('click',()=>{arena=arena=='classic'?'rock':arena=='rock'?'ast':arena=='ast'?'cryo':arena=='cryo'?'bh':arena=='bh'?'mc':'classic';document.getElementById('ar').textContent={classic:'🏟️',rock:'🎸',ast:'🪨',cryo:'❄️',bh:'🕳️',mc:'🏭'}[arena];newMatch();init();msgT=2;msgUp=1;msgTxt={classic:'🏟️ ARENA CLÁSICA',rock:'🎸 ROCK FEST',ast:'🪨 ASTEROID FIELD',cryo:'❄️ CRYO CORE',bh:'🕳️ BLACK HOLE',mc:'🏭 MACHINE CITY'}[arena]});
document.getElementById('fs').addEventListener('click',()=>{document.body.classList.toggle('full');try{if(document.body.classList.contains('full')){if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{})}else if(document.fullscreenElement)document.exitFullscreen()}catch(e){}setTimeout(resize,60)});
let menuOpen=true;const MI=document.getElementById('mi'),MN=document.getElementById('mn');
function fitMenu(){const w=innerWidth,h=innerHeight,c=w>=h?[0,0,1536,1024]:[300,0,1190,1024],k=Math.min(w/c[2],h/c[3]);MI.style.transform='translate('+((w-c[2]*k)/2-c[0]*k)+'px,'+((h-c[3]*k)/2-c[1]*k)+'px) scale('+k+')'}
function toast(t){const e=document.getElementById('ts');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',1800)}
function openPanel(id){document.getElementById(id).classList.add('on')}
function closePanels(){document.querySelectorAll('.pn').forEach(q=>q.classList.remove('on'))}
let ME=0,HUMANS=[true,false,false,false],ONLINE=false,netMode=false,mScores=[0,0,0,0],mRound=1,mDraws=0,rT=0,rWin=-1,mWin=-1;
const CN=['C1 (blanco)','C2 (azul)','C3 (rojo)','C4 (negro)'],VICB=["", "", "", ""];
function newMatch(){mScores=[0,0,0,0];mRound=1;mDraws=0;mWin=-1;vicHide()}
function endRound(w){if(state!='play')return;
 if(w>=0){mScores[w]++;mDraws=0}else mDraws++;
 rWin=w;state='round';rT=3.4;sfx('pick');
 const mx=Math.max(...mScores),ld=[];mScores.forEach((v,i)=>{if(v==mx)ld.push(i)});
 mWin=-1;if(mx>=2)mWin=ld[0];else if(mRound>=3&&ld.length==1&&mx>0)mWin=ld[0];else if(mRound>=6&&mx>0)mWin=ld[0]}
function nextRound(){if(state!='round')return;
 if(mWin>=0){state='victory';showVictory(mWin);return}
 if(rWin>=0||mDraws>=3){mRound++;mDraws=0}init()}
function showVictory(w){document.getElementById('vbg').style.backgroundImage='url('+VICB[w]+')';
 document.getElementById('vt1').textContent=w==0?'¡GANASTE LA PARTIDA!':'GANA '+CN[w].toUpperCase();
 document.getElementById('vt2').textContent='Rondas ganadas: '+mScores.map((x,i)=>'C'+(i+1)+' '+x).join(' · ');
 const cf=document.getElementById('vcf');cf.innerHTML='';for(let i=0;i<26;i++){const sp=document.createElement('span');sp.style.left=(Math.random()*100)+'%';sp.style.animationDelay=(Math.random()*3)+'s';sp.style.background=['#ffd43b','#4dabf7','#ff6b6b','#69db7c','#f1f3ff'][i%5];cf.appendChild(sp)}
 document.getElementById('vic').style.display='block';sfx('win')}
function vicHide(){document.getElementById('vic').style.display='none'}
function startGame(a){arena=a;document.getElementById('ar').textContent={classic:'🏟️',rock:'🎸',ast:'🪨',cryo:'❄️',bh:'🕳️',mc:'🏭'}[a];closePanels();newMatch();init();MN.style.display='none';menuOpen=false;audioStart()}
function showMenu(){menuOpen=true;closePanels();vicHide();MN.style.display='block';fitMenu();sirenOff()}
MI.addEventListener('click',e=>{const a=e.target.dataset&&e.target.dataset.a;if(!a)return;
 if(a=='off')openPanel('arp');else if(a=='conf'||a=='gear'){document.getElementById('sSnd').textContent=muted?'🔇 Sonido: desactivado':'🔊 Sonido: activado';openPanel('setp')}
 else if(a=='power')toast('Gracias por jugar. Puedes cerrar la pestaña.');else if(a=='online')openOnline();else toast('Próximamente')});
document.getElementById('arp').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.s)startGame(b.dataset.s);else if(b.dataset.c)closePanels();else if(b.classList.contains('lk'))toast('Próximamente')});
document.getElementById('setp').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.id=='sSnd'){document.getElementById('mute').click();b.textContent=muted?'🔇 Sonido: desactivado':'🔊 Sonido: activado'}else if(b.id=='sFs')document.getElementById('fs').click();else closePanels()});
document.getElementById('hm').addEventListener('click',()=>{if(netMode)netLeave();showMenu()});
document.getElementById('vre').addEventListener('click',()=>{if(netMode){netSend({t:'rematch'});vicHide()}else{newMatch();init()}});document.getElementById('vmn').addEventListener('click',()=>{if(netMode)netLeave();showMenu()});
resize();addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,250));

// ===== servidor de juego (modo en línea): API usada por server.js =====
globalThis.NET={_lg:'',_n:0,
 start(a,n){arena=a;ONLINE=true;HUMANS=[0,1,2,3].map(i=>i<n);newMatch();init();menuOpen=false;this._lg=''},
 inp(i,x,y){const e=ents[i];if(e&&e.inp){e.inp.x=Math.max(-1,Math.min(1,+x||0));e.inp.y=Math.max(-1,Math.min(1,+y||0))}},
 act(i,a){const e=ents[i];if(!e||!e.alive||state!='play')return;
  if(a=='b')useB(e);else if(a=='z')useZ(e);else if(a=='d')detonate(e);
  else if(a=='pR'||a=='pI'){const k=a[1];if(e.sp[k]>0&&place(e,null,k))e.sp[k]--}
  else if(a=='aR'||a=='aI'){const k=a[1];if(e.arm[k])e.arm[k]=0;else if(e.sp[k]>0)e.arm[k]=1}},
 tick(dt){update(dt);if(state=='round'){rT-=dt;if(rT<=0)nextRound()}},
 leave(i){const e=ents[i];HUMANS[i]=false;if(e){e.bot=true;e.inp=null}},
 rematch(a){arena=a;newMatch();init();this._lg=''},
 snap(){this._n++;const r={t:'snap',a:arena,st:state,mt:+mt.toFixed(2),r:mRound,sc:mScores,mw:mWin,rw:rWin};
  const gs=JSON.stringify(grid);if(gs!==this._lg||this._n%40==0){r.g=grid;this._lg=gs}
  r.f=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(fire[y][x]>0)r.f.push([x,y,+fire[y][x].toFixed(2)]);
  r.iz=[];if(arena=='cryo')for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(iceZ[y][x]>0)r.iz.push([x,y,+iceZ[y][x].toFixed(1)]);
  r.e=ents.map(e=>({x:Math.round(e.x*10)/10,y:Math.round(e.y*10)/10,d:e.dir,m:e.mv?1:0,al:e.alive?1:0,b:e.bot?1:0,cap:e.cap,mx:e.mx,spd:Math.round(e.spd),fz:e.fz>0?1:0,tr:e.tr>0?1:0,cx:e.cx>0?+e.cx.toFixed(1):0,pz:e.pz>0?1:0,st:e.stun>0?1:0,cg:e.cage?1:0,sp:e.sp,ar:e.arm}));
  r.b=bombs.map(b=>({x:b.x,y:b.y,t:b.t>100?9999:+b.t.toFixed(2),r:b.r,ty:b.type,k:b.k||'',fl:b.fl>0?+b.fl.toFixed(2):0,sx:b.sx,sy:b.sy,fz:b.fzT?+b.fzT.toFixed(1):0,o:ents.indexOf(b.owner)}));
  r.i=items.map(i=>({x:i.x,y:i.y,k:i.k,ag:+i.age.toFixed(1)}));
  if(arena=='mc'){r.d=doors.map(d=>({x:d.x,y:d.y,tr:+d.tr.toFixed(2)}));r.mz=MCZ.map(z=>z.st||0);r.mA=mcAlarm?1:0}
  if(arena=='ast'){r.p=portals.map(p=>({x:p.x,y:p.y,l:+p.l.toFixed(1),ag:+p.age.toFixed(1)}));r.me=meteors.map(m=>({x:m.x,y:m.y,t:+m.t.toFixed(2)}))}
  if(arena=='bh')r.bh={c:+bhC.toFixed(2),a:bhA?1:0,p:bhPh};
  if(arena=='rock')r.dc=deco;if(arena=='cryo')r.wh=wallHp;
  r.mg={t:msgT>0?+msgT.toFixed(1):0,x:msgTxt,u:msgUp?1:0};return r}};

// ===== cliente del modo en línea =====
let NETURL=(new URLSearchParams(location.search).get('s'))||'';try{NETURL=NETURL||localStorage.getItem('bgsrv')||''}catch(e){}
const ARN={classic:'Arena clásica',rock:'Rock Fest',ast:'Asteroid Field',cryo:'Cryo Core',bh:'Black Hole',mc:'Machine City'};
let ws=null,wsOpen=false,netRoom=null,netT=0,netLast={x:9,y:9},nPrevFire=0,nPrevPow=0;
function onst(t){document.getElementById('onst').textContent=t}
function netSend(o){if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))}
function netAct(a){netSend({t:'act',a})}
function netLeave(){netSend({t:'leave'});netRoom=null;netMode=false;ONLINE=false;document.getElementById('ar').style.display='';document.getElementById('onbtn').style.display='block';document.getElementById('onroom').style.display='none'}
function netConnect(cb){if(ws&&ws.readyState==1){cb&&cb();return}
 onst('Conectando…');let w;try{w=new WebSocket(NETURL)}catch(e){onst('No se pudo conectar');return}ws=w;
 w.onopen=()=>{wsOpen=true;onst('Conectado');cb&&cb()};
 w.onclose=()=>{wsOpen=false;if(ws===w){if(netMode){netMode=false;ONLINE=false;document.getElementById('ar').style.display='';toast('Se perdió la conexión');showMenu()}onst('Sin conexión')}};
 w.onerror=()=>onst('No se pudo conectar al servidor');
 w.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}netMsg(m)}}
function netMsg(m){if(m.t=='room'){netRoom=m;showRoom(m)}else if(m.t=='start')startOnline(m);else if(m.t=='snap')applySnap(m);else if(m.t=='err')onst(m.m);else if(m.t=='info')toast(m.m)}
function showRoom(m){document.getElementById('onbtn').style.display='none';document.getElementById('onroom').style.display='block';
 document.getElementById('onrc').textContent=m.code;const nm=['C1 ⚪','C2 🔵','C3 🔴','C4 ⚫'];
 document.getElementById('onpl').textContent=m.p.map(q=>nm[q.s]+(q.s==m.me?' (tú)':'')+(q.s==m.host?' 👑':'')).join('\n')+(m.cd>0?'\n\nEmpieza en '+m.cd+' s (los bots completan)':'')+(m.pub?'':'\n\nComparte el código con tus amigos');
 document.getElementById('ons').style.display=m.me==m.host?'block':'none';onst(m.pub?'Buscando partida…':'Sala privada')}
function startOnline(m){ME=m.slot;ONLINE=true;netMode=true;arena=m.arena;init();closePanels();MN.style.display='none';menuOpen=false;vicHide();audioStart();
 document.getElementById('ar').style.display='none';toast('🎲 Arena al azar: '+(ARN[m.arena]||m.arena))}
function applySnap(s){const prevSt=state;
 if(s.g)grid=s.g;arena=s.a;state=s.st;mt=s.mt;mRound=s.r;mScores=s.sc;mWin=s.mw;rWin=s.rw;
 fire=Array.from({length:H},()=>Array(W).fill(0));s.f.forEach(([x,y,v])=>{fire[y][x]=v});
 iceZ=Array.from({length:H},()=>Array(W).fill(0));s.iz.forEach(([x,y,v])=>{iceZ[y][x]=v});
 const old=ents;ents=s.e.map((q,i)=>{const o=old[i];return{x:o&&o.x!==undefined?o.x:q.x,y:o&&o.y!==undefined?o.y:q.y,tx:q.x,ty:q.y,dir:q.d,mv:!!q.m,alive:!!q.al,bot:!!q.b,col:CC[i],cap:q.cap,mx:q.mx,spd:q.spd,fz:q.fz?1:0,tr:q.tr?1:0,cx:q.cx,pz:q.pz,stun:q.st,cage:!!q.cg,sp:q.sp,arm:q.ar,through:new Set(),path:[]}});
 bombs=s.b.map(b=>({x:b.x,y:b.y,t:b.t,r:b.r,type:b.ty,k:b.k,fl:b.fl,sx:b.sx,sy:b.sy,fzT:b.fz,owner:ents[b.o]}));
 items=s.i.map(i=>({x:i.x,y:i.y,k:i.k,age:i.ag}));
 if(s.d){doors=s.d.map(d=>({x:d.x,y:d.y,tr:d.tr}));MCZ.forEach((z,i)=>z.st=s.mz[i]||0);mcAlarm=!!s.mA}else{doors=[];mcAlarm=false}
 portals=s.p?s.p.map(p=>({x:p.x,y:p.y,l:p.l,age:p.ag})):[];meteors=s.me?s.me.map(m=>({x:m.x,y:m.y,t:m.t})):[];
 if(s.bh){bhC=s.bh.c;bhA=!!s.bh.a;bhPh=s.bh.p}else{bhA=false;bhPh=0}
 deco=s.dc||{};wallHp=s.wh||{};msgT=s.mg.t;msgTxt=s.mg.x;msgUp=s.mg.u;
 sp=ents[ME].sp;arm=ents[ME].arm;
 if(s.st=='victory'&&prevSt!='victory')showVictory(mWin);else if(s.st!='victory'&&prevSt=='victory')vicHide();
 if(s.st=='round'&&prevSt=='play')sfx('pick');
 const fc=s.f.length;if(fc>nPrevFire+2)sfx('boom');nPrevFire=fc;
 const me=ents[ME],pw=me.cap+me.mx+me.spd+(me.sp.R||0)+(me.sp.Z||0)+(me.sp.I||0);if(pw>nPrevPow)sfx('pick');nPrevPow=pw}
function netFrame(dt){
 ents.forEach(e=>{if(e.tx!==undefined){const dx=e.tx-e.x,dy=e.ty-e.y;if(Math.abs(dx)+Math.abs(dy)>90){e.x=e.tx;e.y=e.ty}else{const k=Math.min(1,dt*22);e.x+=dx*k;e.y+=dy*k}}});
 netT-=dt;let jx=joy.x+keys.right-keys.left,jy=joy.y+keys.down-keys.up;const m=Math.hypot(jx,jy);if(m>1){jx/=m;jy/=m}
 if(netT<=0||Math.abs(jx-netLast.x)>.08||Math.abs(jy-netLast.y)>.08){netSend({t:'in',x:+jx.toFixed(2),y:+jy.toFixed(2)});netLast={x:jx,y:jy};netT=.1}}
function openOnline(){openPanel('onp');if(!NETURL){onst('Falta la dirección del servidor');document.getElementById('onsrvrow').style.display='block';return}document.getElementById('onsrvrow').style.display='none';onst(wsOpen?'Conectado':'Toca una opción para conectar')}
function netEnsure(cb){if(!NETURL){openOnline();return}netConnect(cb)}
document.getElementById('onsrvb').addEventListener('click',()=>{let v=document.getElementById('onsrv').value.trim();if(!v){onst('Escribe la dirección');return}v=v.replace(/^https:\/\//,'wss://').replace(/^http:\/\//,'ws://');if(!/^wss?:\/\//.test(v))v='wss://'+v;v=v.replace(/\/+$/,'');NETURL=v;try{localStorage.setItem('bgsrv',v)}catch(e){}openOnline()});
document.getElementById('onq').addEventListener('click',()=>netEnsure(()=>netSend({t:'quick'})));
document.getElementById('onc').addEventListener('click',()=>netEnsure(()=>netSend({t:'create'})));
document.getElementById('onj').addEventListener('click',()=>{const c=document.getElementById('oncode').value.trim().toUpperCase();if(c.length<4){onst('Escribe el código de 4 letras');return}netEnsure(()=>netSend({t:'join',code:c}))});
document.getElementById('ons').addEventListener('click',()=>netSend({t:'start'}));
document.getElementById('onx').addEventListener('click',()=>{if(netRoom)netLeave();closePanels()});

init();requestAnimationFrame(loop);
