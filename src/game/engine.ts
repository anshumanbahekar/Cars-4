// @ts-nocheck
// Port of the original Hairpin canvas engine. Gameplay is preserved while typed modules own the app shell.
import { RacingRenderer } from './renderer3d';
import { RaceAudio } from './audio';
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
const raceAudio=new RaceAudio();
let racer3d=RacingRenderer.create(cv);
let use3d=true;try{use3d=localStorage.getItem('cars4-graphics')!=='classic'}catch(e){}
let W,H,D;
let Dm=1.5;const rs=()=>{D=Math.min(devicePixelRatio||1,Dm);W=innerWidth;H=innerHeight;cv.width=W*D;cv.height=H*D};
addEventListener('resize',rs);rs();
if(!ctx.roundRect)ctx.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};
let LAPS=3,camMode=0;const TAU=Math.PI*2,TW=230,F='Barlow Condensed,system-ui,sans-serif';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ad=(a,b)=>{let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d};
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const GRASS=matchMedia('(prefers-color-scheme:dark)').matches?'#2c3b30':'#8fae8b';
let S=[],N=0,kk=[],trees=[],bb,seed=0,cars=[],P,state='menu',cd=0,time=0,finN=0,sk=[],parts=[],stored=0,lastLap=0,weather=0,diff=1,pads=[],rec=[],ghost=null,gbest=1e9,ghT=0,score=0,combo=0,bestScore=0,shake=0,edges=[],cl=[],tplan=[],gmap=[],champ=0,rn=1,cpts=[0,0,0,0,0,0],credits=0,UPG=[0,0,0,0],racePts=[],TH=null,mapSel=0,srow=0,FX={grip:1,acc:1,bounce:1,scale:1,inf:0,inv:0,ram:0,nodmg:0},CH={kind:null,left:0,next:6},camp=0,lvl=0,sel=1,lvlOk=false,drs=null,sbest=[1e9,1e9,1e9],secMsg=null;
const cam={x:0,y:0,a:0,sp:0};
const COL=['#ef5b3f','#f2b632','#3d7ea6','#7a5c9e','#2f9e8f','#e8dfc8'],NAMES=['Cruz','Mater','Jackson','Sally','Lightning','Ramone'];
const AS={"car0":"/cars/car0.webp","car1":"/cars/car1.webp","car2":"/cars/car2.webp","car3":"/cars/car3.webp","car4":"/cars/car4.webp","car5":"/cars/car5.webp"};
const IMG={},pat={};for(const k in AS){const i=new Image();i.src=AS[k];IMG[k]=i}
const rdy=i=>i&&i.complete&&i.naturalWidth>0;

const MAPS=[
 {n:'Radiator Springs',d:'Rolling fast circuit',pts:12,r0:1100,r1:2000,asp:1.3,grip:1,ground:'#86ad7f',str:'rgba(255,255,255,.07)',sand:'#cdbd92',asph:'#393e3c',curb:['#f3ead6','#ef5b3f'],prop:'tree'},
 {n:'Copper Canyon',d:'Long fast sweepers, loose sand',pts:10,r0:1300,r1:2300,asp:1.7,grip:.92,ground:'#d9b27a',str:'rgba(120,70,20,.09)',sand:'#ead3a0',asph:'#4a4440',curb:['#f3ead6','#c2543a'],prop:'cactus'},
 {n:'Alpine Pass',d:'Twisty and slippery',pts:16,r0:950,r1:1600,asp:1.1,grip:.72,ground:'#e3ecf4',str:'rgba(120,150,190,.12)',sand:'#c3d1de',asph:'#454c52',curb:['#f3ead6','#3d7ea6'],prop:'pine'},
 {n:'Metro Speedway',d:'Tight downtown streets, always night',pts:14,r0:850,r1:1500,asp:1,grip:1,ground:'#2a2f3d',str:'rgba(120,140,255,.08)',sand:'#454a5c',asph:'#26282f',curb:['#f3ead6','#7a5c9e'],prop:'building',night:1},
 {n:'Thunder Ridge',d:'Technical lava rim circuit',pts:16,r0:900,r1:1500,asp:1.25,grip:.95,ground:'#3a2623',str:'rgba(255,90,40,.11)',sand:'#6b4a3d',asph:'#2c2625',curb:['#f3ead6','#ef5b3f'],prop:'rock'}];
const MODES=[{n:'Normal',d:'Classic racing'},{n:'Bumper Cars',d:'Huge bounce, no damage, rivals ram you',bounce:2.6,nodmg:1,ram:1},{n:'Ice Rink',d:'Everything is slippery',grip:.3},{n:'Turbo Rocket',d:'Endless nitro and extra power',acc:1.5,inf:1},{n:'Giant Cars',d:'Huge cars, tiny track',scale:1.7},{n:'Tiny Cars',d:'Teeny cars with room to spare',scale:.6},{n:'Reverse Track',d:'Same tracks, backwards',rev:1},{n:'Chaos',d:'A random twist every few seconds',chaos:1}];
const DIFFS=[.85,1,1.1,1.2],DN=['Easy','Normal','Hard','Insane'],LAPOPT=[1,2,3,5,8,10];
const OPTS={mode:MODES.map(m=>m.n),map:[...MAPS.map(m=>m.n),'Random'],laps:LAPOPT.map(String),diff:DN,weather:['Clear','Rain','Night','Random'],dmg:['Off','On'],assist:['Off','Low','High'],ghost:['Off','On'],cam:['Chase','North up'],mph:['km/h','mph'],snd:['Off','On']};
const ROWS=[['Mode','mode'],['Map','map'],['Laps','laps'],['Difficulty','diff'],['Weather','weather'],['Damage','dmg'],['Assists','assist'],['Ghost','ghost'],['Camera','cam'],['Speed units','mph'],['Sound','snd']];
const DESC={laps:'Race length',diff:'Rival speed and how hard they chase you',weather:'Rain lowers grip, night adds headlights, random changes every race',dmg:'Crashes slow your car down',assist:'Extra grip and stability for easier driving',ghost:'Show your best lap as a ghost car',cam:'Rotating chase view or a fixed north up view',mph:'Speed readout units',snd:'Engine sound'};
const rowDesc=i=>{const k=ROWS[i][1];return k==='mode'?MODES[set.mode].d:k==='map'?(set.map<MAPS.length?MAPS[set.map].d:'A random map every race'):DESC[k]};
let set={mode:0,map:0,laps:2,diff:1,weather:0,dmg:1,assist:0,ghost:1,cam:0,mph:0,snd:1};try{Object.assign(set,JSON.parse(localStorage.getItem('hairpin-set')||'{}'))}catch(e){}
const saveSet=()=>{try{localStorage.setItem('hairpin-set',JSON.stringify(set))}catch(e){}};
const CHK=['ice','turbo','drunk','bouncy','giant','tiny'],CHN={ice:'Ice rink!',turbo:'Turbo time!',drunk:'Steering swapped!',bouncy:'Bouncy cars!',giant:'Giant cars!',tiny:'Tiny cars!'};
function calcFX(){const m=camp?MODES[0]:MODES[set.mode];FX={grip:m.grip||1,acc:m.acc||1,bounce:m.bounce||1,scale:m.scale||1,inf:m.inf||0,inv:0,ram:m.ram||0,nodmg:m.nodmg||0};
 if(m.chaos&&CH.kind){const k=CH.kind;if(k==='ice')FX.grip*=.3;if(k==='turbo'){FX.acc*=1.5;FX.inf=1}if(k==='drunk')FX.inv=1;if(k==='bouncy')FX.bounce*=2.5;if(k==='giant')FX.scale=1.7;if(k==='tiny')FX.scale=.6}}
function chaosStep(h){if(CH.left>0){CH.left-=h;if(CH.left<=0)CH.kind=null}else{CH.next-=h;if(CH.next<=0){CH.kind=CHK[Math.floor(Math.random()*CHK.length)];CH.left=6;CH.next=7+Math.random()*5}}}
function applyRace(){if(camp)return;LAPS=champ?3:LAPOPT[set.laps];diff=DIFFS[set.diff];weather=set.weather>=3?Math.floor(Math.random()*3):set.weather;if(TH&&TH.night&&weather===0)weather=2}
function chg(d){const k=ROWS[srow][1],n=OPTS[k].length;set[k]=(set[k]+d+n)%n;saveSet();if(k==='cam')camMode=set.cam;if(k==='snd')raceAudio.setEnabled(!!set.snd)}
function leaveSettings(){camMode=set.cam;raceAudio.setEnabled(!!set.snd);go(true);state='menu'}
function mkG(){return mkTex(TH.ground,g=>{for(let i=0;i<8;i++){g.fillStyle=i%2?TH.str:'rgba(0,0,0,.05)';g.fillRect(i*32,0,32,256)}for(let i=0;i<1400;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.07)';g.fillRect(Math.random()*254,Math.random()*252,2,2+Math.random()*3)}})}
function mkA(){return mkTex(TH.asph,g=>{for(let i=0;i<2600;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.12)';g.fillRect(Math.random()*254,Math.random()*254,1.5,1.5)}})}
function saveGhost(k,arr,t){try{const d=arr.filter((_,i)=>i%6===0).map(r=>[+r[0].toFixed(2),Math.round(r[1]),Math.round(r[2]),+r[3].toFixed(2),r[4]]);localStorage.setItem('hairpin-gh-'+k,JSON.stringify({t,d}))}catch(e){}}
function loadGhost(k){try{const o=JSON.parse(localStorage.getItem('hairpin-gh-'+k)||'null');if(o&&o.d&&o.d.length>10){ghost=o.d;gbest=o.t;gmap=new Array(N).fill(-1);for(const r of ghost)gmap[r[4]]=r[0];let l=-1;for(let q=0;q<N;q++){if(gmap[q]>=0)l=gmap[q];else if(l>=0)gmap[q]=l}}}catch(e){}}
function mkTex(base,fn){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,256);fn(g);return c}
const GG=mkTex('#86ad7f',g=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'rgba(255,255,255,.07)':'rgba(0,0,0,.05)';g.fillRect(i*32,0,32,256)}for(let i=0;i<1400;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,255,.06)':'rgba(30,60,30,.08)';g.fillRect(Math.random()*254,Math.random()*252,2,2+Math.random()*3)}});
const GA=mkTex('#393e3c',g=>{for(let i=0;i<2600;i++){g.fillStyle=Math.random()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.12)';g.fillRect(Math.random()*254,Math.random()*254,1.5,1.5)}});
const LV=[{n:'Rookie Cup',laps:2,diff:.86,w:0,goal:3},{n:'City Sprint',laps:3,diff:.9,w:0,goal:3},{n:'Rainy Day',laps:3,diff:.92,w:1,goal:3},{n:'Night Shift',laps:3,diff:.94,w:2,goal:2},{n:'Club Series',laps:4,diff:.97,w:0,goal:2},{n:'Wet Nationals',laps:4,diff:1,w:1,goal:2},{n:'Midnight Run',laps:4,diff:1.03,w:2,goal:2},{n:'Pro Circuit',laps:5,diff:1.06,w:0,goal:2},{n:'Storm Chaser',laps:5,diff:1.09,w:1,goal:1},{n:'Grand Final',laps:6,diff:1.12,w:2,goal:1}];
LV.forEach((L,i)=>L.m=[0,1,0,2,1,3,4,2,3,4][i]);
function startLevel(i){lvl=i;const L=LV[i-1];LAPS=L.laps;diff=L.diff;weather=L.w;mapSel=L.m;build(3000+i*211);reset();loadGhost('lv'+i);state='count';cd=3.4;raceAudio.effect('start')}
const RACES=3,PTS=[25,18,15,12,10,8],UPN=[['Engine','More acceleration'],['Tyres','More grip'],['Turbo','Longer nitro'],['Armor','Less damage']],UPC=[40,40,30,30];
function buy(i){const l=UPG[i];if(l>=3)return;const c=UPC[i]*(l+1);if(credits>=c){credits-=c;UPG[i]++;if(camp){stats.cr=credits;stats.upg=UPG.slice();saveStats()}}}
let stats={wins:0,races:0,bestScore:0,unlock:1,lv:{},cr:0,upg:[0,0,0,0]};try{Object.assign(stats,JSON.parse(localStorage.getItem('hairpin-stats')||'{}'))}catch(e){}
const saveStats=()=>{try{localStorage.setItem('hairpin-stats',JSON.stringify(stats))}catch(e){}};
const inDRS=i=>drs&&(drs[0]<=drs[1]?(i>=drs[0]&&i<=drs[1]):(i>=drs[0]||i<=drs[1]));
function finishRace(){const o=order();stats.races++;if(o[0]===P)stats.wins++;stats.bestScore=Math.max(stats.bestScore,Math.round(score));saveStats();
 raceAudio.effect('finish');
 if(lvl&&camp){const ps=o.indexOf(P)+1,L=LV[lvl-1],ok=ps<=L.goal;if(ok)stats.unlock=Math.max(stats.unlock||1,Math.min(LV.length,lvl+1));if(!stats.lv[lvl]||ps<stats.lv[lvl])stats.lv[lvl]=ps;credits+=(ok?40:10)+Math.max(0,4-ps)*10+Math.floor(score/25);stats.cr=credits;stats.upg=UPG.slice();saveStats();lvlOk=ok}
 racePts=cars.map(c=>PTS[o.indexOf(c)]);if(champ){cars.forEach((c,i)=>cpts[i]+=racePts[i]);credits+=racePts[4]+Math.floor(score/25)}}
function enter(){
 if(state==='menu'){state='count';cd=3.4;raceAudio.effect('start')}
 else if(state==='levels'){if(sel<=stats.unlock)startLevel(sel)}
 else if(state==='done'){if(camp)state='garage';else if(champ)state=rn<RACES?'garage':'final';else go(false)}
 else if(state==='garage'){if(camp)state='levels';else{rn++;go(true)}}
 else if(state==='final'){champ=0;rn=1;UPG.fill(0);go(true);state='menu'}
}

function build(sd){
 seed=sd;TH=MAPS[mapSel];pat.g=null;pat.a=null;const r=rng(sd),n=TH.pts,Q=[];
 for(let i=0;i<n;i++){const a=i/n*TAU+(r()-.5)*.25,R=TH.r0+r()*(TH.r1-TH.r0);Q.push([Math.cos(a)*R*TH.asp,Math.sin(a)*R])}
 S=[];
 for(let i=0;i<n;i++){const p0=Q[(i+n-1)%n],p1=Q[i],p2=Q[(i+1)%n],p3=Q[(i+2)%n];
  for(let k=0;k<40;k++){const t=k/40,t2=t*t,t3=t2*t,f=j=>.5*(2*p1[j]+(p2[j]-p0[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(3*p1[j]-p0[j]-3*p2[j]+p3[j])*t3);S.push({x:f(0),y:f(1)})}}
 N=S.length;if(!camp&&MODES[set.mode].rev)S.reverse();
 for(let i=0;i<N;i++){const a=S[i],b=S[(i+1)%N];a.a=Math.atan2(b.y-a.y,b.x-a.x);a.l=Math.hypot(b.x-a.x,b.y-a.y)}
 const kc=S.map((s,i)=>Math.abs(ad(S[(i+1)%N].a,s.a))/s.l);
 kk=S.map((_,i)=>{let m=0;for(let j=0;j<26;j++)m=Math.max(m,kc[(i+j)%N]);return m});
 drs=null;{let bl=0,bi=0,run=0;for(let q=0;q<2*N;q++){if(kc[q%N]<3e-4){run++;if(run>bl&&run<=N){bl=run;bi=(q-run+1+N)%N}}else run=0}if(bl>=22)drs=[(bi+3)%N,(bi+bl-3)%N]}
 const off=d=>S.map(s=>({x:s.x-Math.sin(s.a)*d,y:s.y+Math.cos(s.a)*d}));edges=[off(TW/2-12),off(-(TW/2-12)),off(TW/2+72),off(-(TW/2+72))];
 cl=[0];for(let i=1;i<N;i++)cl[i]=cl[i-1]+S[i-1].l;sbest=[1e9,1e9,1e9];secMsg=null;planTiles();
 bb={x0:Math.min(...S.map(s=>s.x)),x1:Math.max(...S.map(s=>s.x)),y0:Math.min(...S.map(s=>s.y)),y1:Math.max(...S.map(s=>s.y))};
 trees=[];
 for(let i=0;i<460;i++){const x=bb.x0-900+r()*(bb.x1-bb.x0+1800),y=bb.y0-900+r()*(bb.y1-bb.y0+1800);let m=1e12;
  for(const s of S){const d=(s.x-x)**2+(s.y-y)**2;if(d<m)m=d}
  if(m>(TW/2+330)**2)trees.push([x,y,40+r()*50])}
  try{stored=+localStorage.getItem('hairpin-'+sd)||0}catch(e){stored=0}pads=[];for(let i=50;i<N-20;i+=Math.floor(N/7))pads.push(i);
  racer3d?.rebuild(S,TW,TH,trees);
}
function reset(){
 cars=[];sk=[];parts=[];finN=0;time=0;lastLap=0;rec=[];ghost=null;gmap=[];gbest=1e9;secMsg=null;ghT=0;score=0;combo=0;CH={kind:null,left:0,next:6};calcFX();
 for(let k=0;k<6;k++){const row=k>>1,side=k%2?1:-1,i=(N-4-row*4+N)%N,s=S[i],nx=-Math.sin(s.a),ny=Math.cos(s.a);
  cars.push({x:s.x+nx*side*42,y:s.y+ny*side*42,a:s.a,vx:0,vy:0,st:0,col:COL[k],name:NAMES[k],ai:k!==4,up:k===4?UPG:[0,0,0,0],hp:100,skill:.9+Math.random()*.1,i,lap:0,ls:0,best:1e9,fin:0,ft:0,nitro:1,lane:(Math.random()-.5)*70,prog:0,sp:0,off:false,dr:false,pw:null})}
 P=cars[4];cam.x=P.x;cam.y=P.y;cam.a=P.a;cam.sp=0;
}
function go(newTrack){if(newTrack){mapSel=champ?(rn-1+(set.map>=MAPS.length?0:set.map))%MAPS.length:(set.map>=MAPS.length?Math.floor(Math.random()*MAPS.length):set.map);build(1000+Math.random()*9000|0)}applyRace();reset();state='count';cd=3.4;raceAudio.effect('start')}

function lapDone(c){
 if(c.lap>=2&&c.lap<=LAPS+1){const lt=time-c.ls;if(lt<c.best)c.best=lt;
  if(c===P){lastLap=lt;if(!stored||lt<stored){stored=lt;try{localStorage.setItem('hairpin-'+seed,lt)}catch(e){}}}}
 if(c===P){if(c.lap>=2&&c.lap<=LAPS+1&&time-c.ls<gbest){gbest=time-c.ls;ghost=rec;if(camp)saveGhost('lv'+lvl,rec,gbest);gmap=new Array(N).fill(-1);for(const r of rec)gmap[r[4]]=r[0];let l=-1;for(let q=0;q<N;q++){if(gmap[q]>=0)l=gmap[q];else if(l>=0)gmap[q]=l}}rec=[];ghT=0;if(c.lap<=LAPS)raceAudio.effect('lap')}
 c.ls=time;
 if(c.lap>LAPS&&!c.fin){c.fin=++finN;c.ft=time;if(c===P){state='done';c.ai=true;c.lane=0;c.skill=.9;finishRace()}}
}
function puff(x,y,vx,vy,l,col,s){if(parts.length<320)parts.push({x,y,vx,vy,l,m:l,col,s})}

function step(c,inp,dt){
 let bi=c.i,bd=1e12;
 for(let j=-14;j<=14;j++){const q=(c.i+j+N)%N,s=S[q],d=(s.x-c.x)**2+(s.y-c.y)**2;if(d<bd){bd=d;bi=q}}
 const pi=c.i;c.i=bi;
 if(pi>N*.8&&bi<N*.2){c.lap++;lapDone(c)}else if(pi<N*.2&&bi>N*.8)c.lap--;
 const s=S[bi],dist=Math.sqrt(bd);c.off=dist>TW/2;
 let fx=Math.cos(c.a),fy=Math.sin(c.a);
 let vf=c.vx*fx+c.vy*fy,vl=-c.vx*fy+c.vy*fx;
 const nit=inp.nit&&c.nitro>0&&vf>50;
 if(c===P&&nit&&!c.nitroOn)raceAudio.effect('boost');
 if(c===P)c.nitroOn=nit;
 c.nitro=nit?Math.max(0,c.nitro-dt*.3/(1+.2*c.up[2])):Math.min(1,c.nitro+dt*.06);if(FX.inf)c.nitro=1;
 let dr=0;for(const o of cars){if(o===c)continue;const dx=o.x-c.x,dy=o.y-c.y,d=Math.hypot(dx,dy);if(d<260&&d>40&&(dx*fx+dy*fy)/d>.93&&o.sp>200)dr=1}
 c.draft=dr;c.brk=!!inp.br;c.dz=inDRS(c.i);c.don=c.dz&&inp.drs&&!inp.br;
 for(const p of pads){const q=S[p],d2=(q.x-c.x)**2+(q.y-c.y)**2;if(d2<110*110&&c.pt!==p){c.pt=p;c.nitro=1;c.bs=1;c.hp=Math.min(100,c.hp+35)}else if(d2>400*400&&c.pt===p)c.pt=-1}
 if(c.bs>0)c.bs=Math.max(0,c.bs-dt*.9);
 let acc=0;if(inp.th)acc=((nit?950:640)+(dr?170:0)+(c.don?200:0)+(c.bs>0?900*c.bs:0))*(1+.06*c.up[0])*(.6+.4*c.hp/100)*FX.acc;
 if(inp.br)acc=vf>5?-1200:-320;
 vf+=(acc-(1.1+(c.off?2.4:0))*vf)*dt;
 let wx=fx*vf-fy*vl,wy=fy*vf+fx*vl;
 c.st+=(inp.st-c.st)*Math.min(1,dt*9);
 c.a+=c.st*2.5*clamp(vf/180,-1,1)/(1+Math.abs(vf)/1000)*(inp.hb?1.35:1)*dt;
 fx=Math.cos(c.a);fy=Math.sin(c.a);
 vf=wx*fx+wy*fy;vl=-wx*fy+wy*fx;
 vl*=Math.exp(-(inp.hb?1.1:c.off?3.5:(weather===1?4.6:7.5)*TH.grip*FX.grip)*(1+.1*c.up[1])*(c===P?1+.18*set.assist:1)*dt);
 c.vx=fx*vf-fy*vl;c.vy=fy*vf+fx*vl;
 c.x+=c.vx*dt;c.y+=c.vy*dt;
 const lim=TW/2+66;
 if(dist>lim){c.x=s.x+(c.x-s.x)*lim/dist;c.y=s.y+(c.y-s.y)*lim/dist;c.vx*=.7;c.vy*=.7;c.hp=Math.max(10,c.hp-c.sp*.004/(1+.3*c.up[3]));if(c.sp>180&&Math.random()<.25)for(let q=0;q<4;q++)puff(c.x,c.y,(Math.random()-.5)*400,(Math.random()-.5)*400,.35,'f1',4);if(c===P&&c.sp>200){shake=Math.min(1,shake+.15);raceAudio.effect('crash',.65)}}
 c.sp=Math.hypot(c.vx,c.vy);
 c.dr=Math.abs(vl)>110&&c.sp>120;
 if(c===P&&state==='race'){if(c.dr&&!c.off){combo=Math.min(combo+dt*.8,8);score+=Math.abs(vl)*dt*(1+combo)*.1}else if(!c.dr)combo=Math.max(0,combo-dt*2)}
 const rx=c.x-fx*18,ry=c.y-fy*18,px=-fy*11,py=fx*11;
 if(c.dr){const cur=[[rx+px,ry+py],[rx-px,ry-py]];
  if(c.pw){sk.push([c.pw[0][0],c.pw[0][1],cur[0][0],cur[0][1]],[c.pw[1][0],c.pw[1][1],cur[1][0],cur[1][1]]);if(sk.length>900)sk.splice(0,2)}
  c.pw=cur;if(Math.random()<.25)puff(rx,ry,(Math.random()-.5)*40,(Math.random()-.5)*40,.7,'smoke',14)
 }else c.pw=null;
 if(c.off&&c.sp>150&&Math.random()<.2)puff(rx,ry,(Math.random()-.5)*60,(Math.random()-.5)*60,.6,'dirt',10);
 if(c.hp<50&&c.sp>80&&Math.random()<(c.hp<25?.3:.12))puff(c.x-fx*20,c.y-fy*20,(Math.random()-.5)*30,(Math.random()-.5)*30,.9,'dirt',c.hp<25?16:11);
 if((nit||c.bs>0)&&(c.tk=!c.tk))puff(rx-fx*8,ry-fy*8,-fx*160+(Math.random()-.5)*60,-fy*160+(Math.random()-.5)*60,.35,'nt',11);
}
function ai(c){
 const la=(c.i+5+(c.sp/55|0))%N,s=S[la],nx=-Math.sin(s.a),ny=Math.cos(s.a);
 let ln=c.lane;for(const o of cars){if(o===c)continue;const dx=o.x-c.x,dy=o.y-c.y,d=Math.hypot(dx,dy);if(d<170&&dx*Math.cos(c.a)+dy*Math.sin(c.a)>0){const side=-Math.sin(c.a)*dx+Math.cos(c.a)*dy;ln+=(side>0?-1:1)*(170-d)*.5}}
 ln=clamp(ln,-TW*.38,TW*.38);
 let err=ad(Math.atan2(s.y+ny*ln-c.y,s.x+nx*ln-c.x),c.a);
 if(FX.ram){let bd=450,tg=null;for(const o of cars){if(o===c)continue;const d=Math.hypot(o.x-c.x,o.y-c.y);if(d<bd){bd=d;tg=o}}if(tg)err=ad(Math.atan2(tg.y-c.y,tg.x-c.x),c.a)}
 const rub=1+clamp((P.prog-c.prog)/(N*.5),-[.12,.07,.04,.02][set.diff],[.12,.07,.04,.02][set.diff]);
 const vt=Math.min(780,Math.sqrt(500/Math.max(kk[c.i],1e-4)))*c.skill*rub*diff*(weather===1?.88:1)*Math.sqrt(TH.grip*FX.grip);
 return{drs:true,th:c.sp<vt,br:c.sp>vt*1.12,st:clamp(err*2.2,-1,1),hb:false,nit:kk[c.i]<4e-4&&c.nitro>.5&&c.skill>.95}
}
function collide(){
 for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const a=cars[i],b=cars[j];let dx=b.x-a.x,dy=b.y-a.y;const d=Math.hypot(dx,dy);
  const cr=56*FX.scale;if(d<cr&&d>0){dx/=d;dy/=d;const o=(cr-d)/2;a.x-=dx*o;a.y-=dy*o;b.x+=dx*o;b.y+=dy*o;
   const rv=(b.vx-a.vx)*dx+(b.vy-a.vy)*dy;if(rv<0){if(a===P||b===P){shake=Math.min(1,shake-rv/500);if(rv<-50)raceAudio.effect('crash',clamp(-rv/250,.4,1))}a.hp=Math.max(10,a.hp+rv*.03/(1+.3*a.up[3]));b.hp=Math.max(10,b.hp+rv*.03/(1+.3*b.up[3]));if(rv<-60)for(let q=0;q<6;q++)puff((a.x+b.x)/2,(a.y+b.y)/2,(Math.random()-.5)*420,(Math.random()-.5)*420,.35,'f1',4);const k=-rv*.7*FX.bounce;a.vx-=dx*k;a.vy-=dy*k;b.vx+=dx*k;b.vy+=dy*k}}}
}
const order=()=>[...cars].sort((a,b)=>a.fin&&b.fin?a.fin-b.fin:a.fin?-1:b.fin?1:b.prog-a.prog);
const K={};let paused=false;
addEventListener('keydown',e=>{
 K[e.code]=1;if(/^(Space|Arrow)/.test(e.code))e.preventDefault();
 raceAudio.unlock();
 if(e.code==='Enter')enter();
 if(e.code==='KeyN'&&!champ&&!camp&&(state==='menu'||state==='done'))go(true);
 if(e.code==='KeyC'&&state==='menu'){camp=0;champ=1;rn=1;cpts=[0,0,0,0,0,0];credits=0;UPG.fill(0);go(true)}
 if(e.code==='KeyR'&&(state==='race'||state==='count'))go(false);
 if(e.code==='KeyM'){set.snd=set.snd?0:1;raceAudio.setEnabled(!!set.snd);saveSet()}
 if(e.code==='KeyV'){camMode^=1;set.cam=camMode;saveSet()}
  if(e.code==='KeyB'){use3d=!use3d;try{localStorage.setItem('cars4-graphics',use3d?'3d':'classic')}catch(e){}}
 if(e.code==='KeyO'&&state==='menu'){state='settings';srow=0}
 if(state==='settings'){if(e.code==='ArrowUp'||e.code==='KeyW')srow=Math.max(0,srow-1);if(e.code==='ArrowDown'||e.code==='KeyS')srow=Math.min(ROWS.length-1,srow+1);if(e.code==='ArrowLeft'||e.code==='KeyA')chg(-1);if(e.code==='ArrowRight'||e.code==='KeyD'||e.code==='Enter')chg(1);if(e.code==='Backspace'||e.code==='Escape')leaveSettings()}
 if(e.code==='KeyG'&&state==='menu'){camp=1;champ=0;UPG.splice(0,4,...stats.upg);credits=stats.cr;sel=Math.min(LV.length,stats.unlock);state='levels'}
 if(state==='levels'){if(e.code==='ArrowUp'||e.code==='KeyW')sel=Math.max(1,sel-1);if(e.code==='ArrowDown'||e.code==='KeyS')sel=Math.min(LV.length,sel+1);if(e.code==='Backspace'){camp=0;lvl=0;UPG.fill(0);credits=0;go(true);state='menu'}}
 if(e.code==='KeyL'&&state==='menu'){set.laps=(set.laps+1)%LAPOPT.length;LAPS=LAPOPT[set.laps];saveSet()}
 if(e.code==='KeyT'){weather=(weather+1)%3;set.weather=weather;saveSet()}
 if((e.code==='KeyP'||e.code==='Escape')&&state!=='settings'&&state!=='levels')paused=!paused;
 if(state==='garage'){if(/^Digit[1-4]$/.test(e.code))buy(+e.code[5]-1)}else{if(/^Digit[1-3]$/.test(e.code)){set.diff=+e.code[5]-1;diff=DIFFS[set.diff];saveSet()}}
});
addEventListener('keyup',e=>K[e.code]=0);
addEventListener('blur',()=>{for(const k in K)K[k]=0;if(state==='race')paused=true});
let tch=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
const TBr=()=>Math.min(44,W/12,H/11);
const BT=()=>{const r=TBr(),m=r+16,y=H*.52;return[['ArrowLeft','Left',m,y],['ArrowRight','Right',m+2*r+14,y],['ArrowUp','Gas',W-m,y-r-10],['ShiftLeft','Nitro',W-m,y+r+10],['ArrowDown','Brake',W-m-2*r-14,y-r-10],['Space','Drift',W-m-2*r-14,y+r+10]]};
const heldPointers=new Map();
addEventListener('blur',()=>heldPointers.clear());
const touchHit=(x,y)=>state==='race'||state==='count'?BT().find(b=>Math.hypot(x-b[2],y-b[3])<TBr()+10)?.[0]:null;
function syncPointers(){for(const b of BT())K[b[0]]=[...heldPointers.values()].includes(b[0])?1:0}
cv.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'&&W>900&&!tch)return;
 e.preventDefault();tch=true;raceAudio.unlock();cv.setPointerCapture(e.pointerId);
 const button=touchHit(e.clientX,e.clientY);
 if(button){heldPointers.set(e.pointerId,button);syncPointers()}
 else if(paused)paused=false;
 else if(state==='done'&&!champ&&!camp)go(e.clientX>W/2);
 else enter();
});
cv.addEventListener('pointermove',e=>{if(!heldPointers.has(e.pointerId))return;e.preventDefault();const button=touchHit(e.clientX,e.clientY);if(button)heldPointers.set(e.pointerId,button);else heldPointers.delete(e.pointerId);syncPointers()});
for(const name of ['pointerup','pointercancel','lostpointercapture'])cv.addEventListener(name,e=>{if(heldPointers.delete(e.pointerId))syncPointers()});

function rr(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
function T(t,x,y,sz,w,col,al){ctx.font=w+' '+sz+'px '+F;ctx.fillStyle=col;ctx.textAlign=al||'left';ctx.fillText(t,x,y)}
const fmt=s=>{const m=Math.floor(s/60);return m+':'+(s%60).toFixed(1).padStart(4,'0')};
const ord=n=>n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:Math.min(n%10,4)%4]||'th');

function epath(a){ctx.beginPath();ctx.moveTo(a[0].x,a[0].y);for(let i=1;i<a.length;i++)ctx.lineTo(a[i].x,a[i].y);ctx.closePath()}
function trackPath(){ctx.beginPath();ctx.moveTo(S[0].x,S[0].y);for(let i=1;i<N;i++)ctx.lineTo(S[i].x,S[i].y);ctx.closePath()}
const shade=(h,a)=>{const n=parseInt(h.slice(1),16),f=v=>clamp(Math.round(v+a),0,255);return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'};
function dcar(c){
 ctx.save();ctx.translate(c.rx??c.x,c.ry??c.y);ctx.rotate(c.ra??c.a);
 const ci=c===P?0:COL.indexOf(c.col),im=IMG['car'+(ci<0?5:ci)];
 if(rdy(im)){ctx.scale(FX.scale,FX.scale);ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(4,7,38,18,0,0,TAU);ctx.fill();ctx.drawImage(im,-40,-17.4,80,34.7);
  if(c.brk){const g=ctx.createRadialGradient(-38,0,2,-38,0,26);g.addColorStop(0,'rgba(255,60,40,.55)');g.addColorStop(1,'rgba(255,60,40,0)');ctx.fillStyle=g;ctx.fillRect(-64,-26,50,52)}
  ctx.restore();return}
 ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(3,6,35,20,0,0,TAU);ctx.fill();
 ctx.fillStyle='#141917';for(const y of[-18,12]){ctx.beginPath();ctx.roundRect(-22,y,13,6,2.5);ctx.fill();ctx.save();ctx.translate(20.5,y+3);ctx.rotate((c.st||0)*.5);ctx.beginPath();ctx.roundRect(-6.5,-3,13,6,2.5);ctx.fill();ctx.restore()}
 ctx.fillStyle=shade(c.col,-55);ctx.beginPath();ctx.roundRect(-34,-14,7,28,2);ctx.fill();ctx.beginPath();ctx.roundRect(26,-13,6,26,2);ctx.fill();
 const g=ctx.createLinearGradient(0,-13,0,13);g.addColorStop(0,shade(c.col,50));g.addColorStop(.5,c.col);g.addColorStop(1,shade(c.col,-50));
 ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-28,-8);ctx.lineTo(-8,-12);ctx.lineTo(6,-8);ctx.lineTo(26,-5);ctx.quadraticCurveTo(31,0,26,5);ctx.lineTo(6,8);ctx.lineTo(-8,12);ctx.lineTo(-28,8);ctx.closePath();ctx.fill();
 ctx.fillStyle='rgba(243,234,214,.85)';ctx.fillRect(-27,-1.8,53,3.6);
 ctx.fillStyle='#111815';ctx.beginPath();ctx.ellipse(-3,0,9,5.5,0,0,TAU);ctx.fill();
 ctx.fillStyle=shade(c.col,80);ctx.beginPath();ctx.arc(-3,0,3.2,0,TAU);ctx.fill();
 ctx.fillStyle='#fff6cf';ctx.fillRect(23,-5,3,3);ctx.fillRect(23,2,3,3);
 ctx.fillStyle=c.brk?'#ff3b30':'#8a2a22';ctx.fillRect(-29,-6,2.5,4);ctx.fillRect(-29,2,2.5,4);




 ctx.restore();
}

const TS=512,TR=1.5,tiles=new Map(),tset=new Set();let fno=0;
function planTiles(){tiles.clear();tset.clear();tplan=[];const m=TW/2+110;
 for(const q of S){for(let i=Math.floor((q.x-m)/TS);i<=Math.floor((q.x+m)/TS);i++)for(let j=Math.floor((q.y-m)/TS);j<=Math.floor((q.y+m)/TS);j++){const k=i+','+j;if(!tset.has(k)){tset.add(k);tplan.push([i,j])}}}}
function runs(cx,cy,r){
 const vis=S.map(q=>Math.abs(q.x-cx)<r&&Math.abs(q.y-cy)<r),st=vis.indexOf(false),out=[];
 if(st<0)return[{d:0,idx:[...S.keys(),0]}];
 let cur=null;
 for(let k=1;k<=N;k++){const i=(st+k)%N;if(vis[i]){if(!cur){cur={d:cl[i],idx:[]};out.push(cur)}cur.idx.push(i)}else cur=null}
 return out}
function strokeRuns(g,R,arr){for(const r of R){g.beginPath();for(let n=0;n<r.idx.length;n++){const p=arr[r.idx[n]];n?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)}g.lineDashOffset=r.d;g.stroke()}g.lineDashOffset=0}
function paintTrack(g,ti,tj){
 const x0=ti*TS,y0=tj*TS,R=runs(x0+TS/2,y0+TS/2,TS*.5+TW+200);
 g.lineJoin='round';g.lineCap='butt';
 const st=(col,w,dash,arr)=>{g.strokeStyle=col;g.lineWidth=w;g.setLineDash(dash||[]);strokeRuns(g,R,arr||S)};
 st(TH.sand,TW+120);st(TH.curb[0],TW+28);st(TH.curb[1],TW+28,[36,36]);
 st(pat.a||(pat.a=g.createPattern(mkA(),'repeat')),TW);
 st('rgba(0,0,0,.14)',90);
 st('rgba(243,234,214,.85)',5,null,edges[0]);st('rgba(243,234,214,.85)',5,null,edges[1]);
 st('rgba(243,234,214,.45)',5,[32,44]);g.setLineDash([]);
 const TC=[['#1d2320','#3a403d'],['#d8472f','#ef6a50'],['#e9e4d6','#fbf8ee']];
 for(const e of[edges[2],edges[3]])for(let i=0;i<N;i+=2){const p=e[i];if(p.x<x0-40||p.x>x0+TS+40||p.y<y0-40||p.y>y0+TS+40)continue;const c=TC[(i>>1)%3];
  g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.arc(p.x+3,p.y+4,19,0,TAU);g.fill();
  g.fillStyle=c[0];g.beginPath();g.arc(p.x,p.y,19,0,TAU);g.fill();
  g.fillStyle=c[1];g.beginPath();g.arc(p.x,p.y,13,0,TAU);g.fill();
  g.fillStyle='#141917';g.beginPath();g.arc(p.x,p.y,6,0,TAU);g.fill()}
 g.save();g.translate(S[0].x,S[0].y);g.rotate(S[0].a);
 for(let c=0;c<10;c++)for(let r=0;r<2;r++){g.fillStyle=(c+r)%2?'#1d2320':'#f3ead6';g.fillRect(-22+r*22,-TW/2+c*TW/10,22,TW/10)}
 g.restore();
 if(drs){for(const ix of drs){const q=S[ix];g.save();g.translate(q.x,q.y);g.rotate(q.a);g.fillStyle='rgba(47,158,111,.85)';g.fillRect(-7,-TW/2,14,TW);g.restore()}const q=S[drs[0]];g.save();g.translate(q.x,q.y);g.rotate(q.a);g.fillStyle='rgba(243,234,214,.85)';g.font='900 46px Archivo,system-ui,sans-serif';g.textAlign='left';g.fillText('DRS',24,16);g.restore()}
 g.fillStyle='rgba(200,214,229,.92)';
 for(const pi of pads){const q=S[pi];g.save();g.translate(q.x,q.y);g.rotate(q.a);for(let j=0;j<3;j++){g.beginPath();g.moveTo(-40+j*34,-TW*.3);g.lineTo(-10+j*34,0);g.lineTo(-40+j*34,TW*.3);g.lineTo(-52+j*34,TW*.3);g.lineTo(-22+j*34,0);g.lineTo(-52+j*34,-TW*.3);g.fill()}g.restore()}
}
function getTile(i,j){
 const k=i+','+j;let t=tiles.get(k);if(t){t.u=fno;return t}
 const c2=document.createElement('canvas');c2.width=c2.height=Math.ceil((TS+8)*TR);
 const g=c2.getContext('2d');g.scale(TR,TR);g.translate(-i*TS+4,-j*TS+4);paintTrack(g,i,j);
 t={c:c2,u:fno};tiles.set(k,t);
 if(tiles.size>40){let o=null;for(const[kk2,v]of tiles)if(!o||v.u<o[1].u)o=[kk2,v];tiles.delete(o[0])}
 return t}
function drawTiles(vr){
 for(let i=Math.floor((cam.x-vr)/TS);i<=Math.floor((cam.x+vr)/TS);i++)for(let j=Math.floor((cam.y-vr)/TS);j<=Math.floor((cam.y+vr)/TS);j++){
  if(!tset.has(i+','+j))continue;const t=getTile(i,j);if(t)ctx.drawImage(t.c,i*TS-4,j*TS-4,TS+8,TS+8)}}
function prefetch(){
 for(const[i,j]of tplan){if(tiles.has(i+','+j))continue;if(Math.hypot((i+.5)*TS-cam.x,(j+.5)*TS-cam.y)<1400){getTile(i,j);return}}}
function drawProp(t){const x=t[0],y=t[1],r=t[2],k=TH.prop;
 if(k==='cactus'){ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(x+8,y+10,r*.35,r*.6,0,0,TAU);ctx.fill();ctx.fillStyle='#4e8a4a';
  for(const[a,b,w,h]of[[-.16,-.55,.32,1.1],[-.5,-.15,.34,.14],[.18,-.3,.34,.14]]){ctx.beginPath();ctx.roundRect(x+a*r,y+b*r,w*r,h*r,r*.07);ctx.fill()}
  ctx.fillStyle='#6fb36a';ctx.beginPath();ctx.roundRect(x-r*.07,y-r*.5,r*.1,r,r*.05);ctx.fill()}
 else if(k==='rock'){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.arc(x+10,y+12,r*.8,0,TAU);ctx.fill();ctx.fillStyle='#6d6561';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x+Math.cos(i*1.3)*r*.4,y+Math.sin(i*1.3)*r*.4,r*.5,0,TAU);ctx.fill()}ctx.fillStyle='#8f8780';ctx.beginPath();ctx.arc(x-r*.15,y-r*.15,r*.35,0,TAU);ctx.fill()}
 else if(k==='pine'){ctx.fillStyle='rgba(60,80,110,.22)';ctx.beginPath();ctx.arc(x+10,y+12,r*.9,0,TAU);ctx.fill();ctx.fillStyle='#2c5a49';ctx.beginPath();ctx.arc(x,y,r*.9,0,TAU);ctx.fill();ctx.fillStyle='#eef5fa';for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(x+Math.cos(i*1.05)*r*.5,y+Math.sin(i*1.05)*r*.5,r*.38,0,TAU);ctx.fill()}ctx.fillStyle='#d5e6f0';ctx.beginPath();ctx.arc(x,y,r*.3,0,TAU);ctx.fill()}
 else if(k==='building'){const w=r*1.1,h=r*.85;ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-w+10,y-h+12,2*w,2*h);ctx.fillStyle='#3a4057';ctx.fillRect(x-w,y-h,2*w,2*h);ctx.fillStyle='#4a5272';ctx.fillRect(x-w+6,y-h+6,2*w-12,2*h-12);
  ctx.strokeStyle=((x*7|0)%2)?'#ff4fd8':'#4fe6ff';ctx.lineWidth=4;ctx.strokeRect(x-w+6,y-h+6,2*w-12,2*h-12);ctx.fillStyle='rgba(255,235,150,.85)';
  for(let i=0;i<6;i++)ctx.fillRect(x-w*.7+((i*41+(y|0))%Math.max(10,Math.floor(w*1.2))),y-h*.6+((i*53+(x|0))%Math.max(10,Math.floor(h*1.1))),9,6)}}
function draw(){
  if(use3d&&racer3d?.available){
   try{
    racer3d.render({cars,player:P,mode:camMode,weather,state,nitro:!!(K.ShiftLeft||K.ShiftRight),scale:FX.scale,dt:Math.min(.05,ema)});
    ctx.setTransform(D,0,0,D,0,0);ctx.clearRect(0,0,W,H);
    if(weather===1){ctx.strokeStyle='rgba(213,231,250,.35)';ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<90;i++){const x=Math.random()*W,y=Math.random()*H;ctx.moveTo(x,y);ctx.lineTo(x-5,y+19)}ctx.stroke()}
    const sW=W,sH=H,hs=Math.min(1,W/720);if(hs<1){ctx.setTransform(D*hs,0,0,D*hs,0,0);W=sW/hs;H=sH/hs}
    hud();W=sW;H=sH;ctx.setTransform(D,0,0,D,0,0);tbtn();return;
   }catch(error){console.warn('3D rendering failed; returning to classic view.',error);racer3d.dispose();racer3d=null}
  }
 ctx.setTransform(D,0,0,D,0,0);
 ctx.fillStyle=TH.ground;ctx.fillRect(0,0,W,H);
 const sc=Math.min(W,H)/(720+cam.sp*.55)*(camMode?.75:1),vr=Math.hypot(W,H)/sc*.6,cy0=camMode?H*.5:H*.62;
 ctx.save();ctx.translate(W/2+(Math.random()-.5)*shake*14,cy0+(Math.random()-.5)*shake*14);ctx.rotate(-cam.a-Math.PI/2);ctx.scale(sc,sc);ctx.translate(-cam.x,-cam.y);
 {if(!pat.g){pat.g=ctx.createPattern(mkG(),'repeat');pat.g.setTransform(new DOMMatrix().scale(2.2))}const R=Math.hypot(W,H)/sc;ctx.fillStyle=pat.g;ctx.fillRect(cam.x-R,cam.y-R,2*R,2*R)}
 for(const t of trees){if(Math.abs(t[0]-cam.x)>vr||Math.abs(t[1]-cam.y)>vr)continue;
  if(TH.prop!=='tree'){drawProp(t);continue}
  ctx.fillStyle='rgba(0,0,0,.14)';ctx.beginPath();ctx.arc(t[0]+10,t[1]+10,t[2],0,TAU);ctx.fill();
  const hh=(t[2]*7|0)%3;ctx.fillStyle=['#4f7a56','#476f4f','#5a8660'][hh];for(let k=0;k<6;k++){ctx.beginPath();ctx.arc(t[0]+Math.cos(k*1.05)*t[2]*.55,t[1]+Math.sin(k*1.05)*t[2]*.55,t[2]*.55,0,TAU);ctx.fill()}
  ctx.fillStyle=['#7aa77c','#6f9972','#86b186'][hh];ctx.beginPath();ctx.arc(t[0]-t[2]*.18,t[1]-t[2]*.18,t[2]*.38,0,TAU);ctx.fill()}
 drawTiles(vr);
 ctx.strokeStyle='rgba(15,15,15,.3)';ctx.lineWidth=5;ctx.beginPath();for(const s of sk){ctx.moveTo(s[0],s[1]);ctx.lineTo(s[2],s[3])}ctx.stroke();
 if(set.ghost&&ghost&&P.lap>=1&&state==='race'){const g=ghost[ghT];if(g){const g2=ghost[ghT+1],f=g2?clamp((time-P.ls-g[0])/((g2[0]-g[0])||1),0,1):0;ctx.globalAlpha=.4;dcar({x:g[1]+(g2?(g2[1]-g[1])*f:0),y:g[2]+(g2?(g2[2]-g[2])*f:0),a:g[3]+(g2?ad(g2[3],g[3])*f:0),col:'#f3ead6'});ctx.globalAlpha=1}}
 for(const c of cars)if(c!==P)dcar(c);dcar(P);
 for(const p of parts){const a=p.l/p.m;
  ctx.globalAlpha=Math.max(0,a*(p.col==='smoke'?.5:.8));
  ctx.fillStyle=p.col==='smoke'?'#f3ead6':p.col==='dirt'?'#7b6a4a':p.col==='f1'?'#f2b632':p.col==='nt'?'#dfe9f5':'#ef5b3f';
  ctx.beginPath();ctx.arc(p.x,p.y,p.s*(p.col==='smoke'?2-a:a+.3),0,TAU);ctx.fill()}
 ctx.globalAlpha=1;
 if(weather===2){ctx.restore();ctx.fillStyle='rgba(8,12,30,.62)';ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(W/2,cy0);ctx.rotate(-cam.a-Math.PI/2);ctx.scale(sc,sc);ctx.translate(-cam.x,-cam.y);ctx.globalCompositeOperation='lighter';
  for(const c of cars){ctx.save();ctx.translate(c.rx??c.x,c.ry??c.y);ctx.rotate(c.ra??c.a);const g=ctx.createRadialGradient(30,0,10,260,0,330);g.addColorStop(0,'rgba(255,236,170,.4)');g.addColorStop(1,'rgba(255,236,170,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(24,-8);ctx.lineTo(380,-150);ctx.lineTo(380,150);ctx.lineTo(24,8);ctx.fill();ctx.restore()}
  ctx.globalCompositeOperation='source-over'}
 ctx.restore();
 if(weather===1){ctx.fillStyle='rgba(30,45,70,.2)';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(220,230,240,.5)';ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<160;i++){const x=Math.random()*W,y=Math.random()*H;ctx.moveTo(x,y);ctx.lineTo(x-4,y+22)}ctx.stroke()}
 const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.hypot(W,H)*.6);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,'+(.22+Math.min(.25,cam.sp/2400))+')');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
 if(P.sp>680&&state==='race'){ctx.strokeStyle='rgba(255,240,200,.35)';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<22;i++){const a=Math.random()*TAU,r1=Math.min(W,H)*(.3+Math.random()*.2),r2=r1+60+Math.random()*80;ctx.moveTo(W/2+Math.cos(a)*r1,H*.62+Math.sin(a)*r1);ctx.lineTo(W/2+Math.cos(a)*r2,H*.62+Math.sin(a)*r2)}ctx.stroke()}
 const sW=W,sH=H,hs=Math.min(1,W/720);if(hs<1){ctx.setTransform(D*hs,0,0,D*hs,0,0);W=sW/hs;H=sH/hs}
 hud();W=sW;H=sH;ctx.setTransform(D,0,0,D,0,0);tbtn();
}
function tbtn(){if(!(tch||W<=900)||state!=='race'&&state!=='count')return;const r=TBr();for(const b of BT()){const on=K[b[0]],gas=b[0]==='ArrowUp',nitro=b[0]==='ShiftLeft';ctx.save();ctx.shadowColor=on?'#ffd24d':gas?'#e82d2f':'rgba(0,0,0,.5)';ctx.shadowBlur=on?18:gas?14:9;ctx.beginPath();ctx.arc(b[2],b[3],r,0,TAU);ctx.fillStyle=on?'#ffd24d':gas?'rgba(205,32,37,.94)':nitro?'rgba(31,90,146,.9)':'rgba(10,20,25,.82)';ctx.fill();ctx.shadowBlur=0;ctx.lineWidth=2;ctx.strokeStyle=on?'#fff5c5':gas?'#ffd668':'rgba(255,255,255,.65)';ctx.stroke();T(b[1].toUpperCase(),b[2],b[3]+5,Math.max(11,Math.round(r*.32)),900,on?'#18202a':'#fff9e6','center');ctx.restore()}}
function pill(x,y,w,h){rr(x,y+5,w,h,16,'rgba(0,0,0,.28)');rr(x,y,w,h,16,'rgba(12,23,29,.88)');ctx.lineWidth=1.5;ctx.strokeStyle='rgba(255,255,255,.28)';ctx.stroke()}
function hud(){
  const M=22,o=order(),pos=o.indexOf(P)+1,ink='#f9f4e9';
 if(state!=='menu'){
  pill(M,M,150,64);T(pos+'',M+18,M+50,50,900,ink);T('of 6',M+66,M+47,20,500,ink);
  const lp=clamp(P.lap,1,LAPS);
  pill(W/2-150,M,300,66);T('Lap '+lp+' of '+LAPS,W/2,M+28,22,800,ink,'center');
  T(fmt(P.lap>=1?Math.max(0,time-P.ls):0)+(lastLap?'   last '+fmt(lastLap):'')+(stored?'   best '+fmt(stored):''),W/2,M+54,15,500,ink,'center');
  pill(M,H-M-128,200,128);T('G'+(P.gear||1),M+182,H-M-84,22,900,ink,'right');for(let i=0;i<14;i++)rr(M+18+i*11.5,H-M-116,8,9,2,P.rpm>i/14?(i<8?'#6f9972':i<11?'#f2b632':'#ef5b3f'):'rgba(29,35,32,.15)');
  T(Math.round(P.sp*.5*(set.mph?.621:1))+'',M+18,H-M-52,56,900,ink);T(set.mph?'mph':'km/h',M+18+ctx.measureText(Math.round(P.sp*.5*(set.mph?.621:1))+'').width+8,H-M-54,18,500,ink);
  rr(M+18,H-M-34,164,14,7,'rgba(29,35,32,.18)');rr(M+18,H-M-34,Math.max(14,164*P.nitro),14,7,'#3a403d');
  const ms=150/Math.max(bb.x1-bb.x0,bb.y1-bb.y0),mx=W-M-180,my=M;
   if(!((tch||W<=900)&&H<600)){pill(mx,my,180,150+30);
  ctx.save();ctx.translate(mx+90,my+90);ctx.scale(ms,ms);ctx.translate(-(bb.x0+bb.x1)/2,-(bb.y0+bb.y1)/2);
  trackPath();ctx.strokeStyle=ink;ctx.lineWidth=5/ms;ctx.lineJoin='round';ctx.stroke();
  for(const c of cars){ctx.fillStyle=c===P?'#ef5b3f':c.col;ctx.strokeStyle='#1d2320';ctx.lineWidth=2/ms;ctx.beginPath();ctx.arc(c.x,c.y,(c===P?9:6)/ms,0,TAU);ctx.fill();ctx.stroke()}
   ctx.restore()}
 }
 if(CH.kind&&state==='race')T(CHN[CH.kind],W/2,H*.24,46,900,'#ef5b3f','center');
 if(state==='race'&&P.sp>120&&Math.abs(ad(P.a,S[P.i].a))>2.2)T('Wrong way',W/2,H*.3,44,900,'#ef5b3f','center');
 if(state!=='menu'&&H>520){pill(W-M-180,M+184,180,160);o.forEach((c,i)=>{const y=M+212+i*24;T((i+1)+'',W-M-166,y,16,800,ink);rr(W-M-142,y-12,12,12,6,c.col);T(c.name,W-M-122,y,16,c===P?900:500,ink)})}
   if(state!=='menu'){bestScore=Math.max(bestScore,score);if(!((tch||W<=900)&&H<600)){pill(W-M-200,H-M-130,200,130);rr(W-M-182,H-M-118,164,10,5,'rgba(29,35,32,.18)');rr(W-M-182,H-M-118,Math.max(8,164*P.hp/100),10,5,P.hp>50?'#6f9972':P.hp>25?'#f2b632':'#ef5b3f');T(Math.round(score)+'',W-M-182,H-M-52,48,900,ink);T('drift x'+(1+combo).toFixed(1),W-M-182,H-M-22,18,500,ink)}T(['Clear','Rain','Night'][weather]+'   '+TH.n+(!camp&&set.mode?'   '+MODES[set.mode].n:'')+(camp?'   Level '+lvl:champ?'   Race '+rn+' of '+RACES:''),W/2,M+92,18,800,ink,'center');if(ghost&&P.lap>=1&&state==='race'&&gmap[P.i]>=0){const d=(time-P.ls)-gmap[P.i];T((d>0?'+':'')+d.toFixed(2),W/2,M+122,26,900,d>0?'#ef5b3f':'#2f7d57','center')};if(P.dz&&state==='race')T(P.don?'DRS open':'DRS ready, hold E',W/2,H-M-52,22,900,P.don?'#2f7d57':ink,'center');
 if(secMsg&&time-secMsg.t<2.5&&state==='race')T(secMsg.txt,W/2,M+152,24,900,secMsg.col,'center');
 if(P.draft)T('Slipstream',W/2,H-M-20,24,900,ink,'center')}
 if(state==='count'){const lit=clamp(Math.floor((3.4-cd)/.6)+1,0,5);rr(W/2-162,H*.15,324,106,22,'rgba(13,22,25,.94)');T('START YOUR ENGINES',W/2,H*.15+19,15,900,'#f7c746','center');for(let k=0;k<5;k++){ctx.beginPath();ctx.arc(W/2-112+k*56,H*.15+61,19,0,TAU);ctx.fillStyle=k<lit?'#ff3b30':'#442721';ctx.fill();if(k<lit){ctx.shadowColor='#ff3b30';ctx.shadowBlur=20;ctx.fill();ctx.shadowBlur=0}}}
 if(state==='race'&&time<.9){T('Go',W/2+6,H*.42+6,160,900,'#1d2320','center');T('Go',W/2,H*.42,160,900,'#f2b632','center')}
 if(paused){ctx.fillStyle='rgba(29,35,32,.62)';ctx.fillRect(0,0,W,H);T('Paused',W/2,H*.45,90,900,'#f3ead6','center');T('Press P or tap to resume',W/2,H*.45+40,22,500,'#f3ead6','center')}
 if(state==='settings'){
  ctx.fillStyle='rgba(29,35,32,.95)';ctx.fillRect(0,0,W,H);const cx=W/2,u=Math.min(1,W/700);
  T('Settings',cx,H*.1,64*u,900,'#f3ead6','center');
  ROWS.forEach((r,i)=>{const y=H*.2+i*40*u,on=i===srow;rr(cx-300*u,y-24*u,600*u,34*u,12*u,on?'rgba(242,182,50,.28)':'rgba(243,234,214,.1)');T(r[0],cx-280*u,y,19*u,800,'#f3ead6');T((on?'<  ':'')+OPTS[r[1]][set[r[1]]]+(on?'  >':''),cx+280*u,y,19*u,800,on?'#f2b632':'#f3ead6','right')});
  T(rowDesc(srow),cx,H*.2+ROWS.length*40*u+16*u,16*u,500,'rgba(243,234,214,.8)','center');
  T('Up and down to choose, left and right to change. Backspace to go back.',cx,H*.2+ROWS.length*40*u+46*u,17*u,800,'#f2b632','center');
 }
 if(state==='levels'){
  ctx.fillStyle='rgba(29,35,32,.95)';ctx.fillRect(0,0,W,H);const cx=W/2,u=Math.min(1,W/700);
  T('Career',cx,H*.1,64*u,900,'#f3ead6','center');
  T('Credits '+credits+'   Level '+sel+' of '+LV.length,cx,H*.1+30*u,18*u,500,'#f3ead6','center');
  LV.forEach((L,i)=>{const n=i+1,y=H*.2+i*44*u,lock=n>stats.unlock,on=n===sel,best=stats.lv[n],dim=lock?'rgba(243,234,214,.4)':'#f3ead6';
   rr(cx-310*u,y-26*u,620*u,38*u,12*u,on?'rgba(242,182,50,.28)':'rgba(243,234,214,.1)');
   T(n+'',cx-290*u,y,20*u,900,dim);T(L.n,cx-250*u,y,20*u,800,dim);
   T(MAPS[L.m].n+'   '+L.laps+' laps   '+['Clear','Rain','Night'][L.w],cx-100*u,y,15*u,500,lock?'rgba(243,234,214,.4)':'rgba(243,234,214,.75)');
   T(lock?'Locked':(best?'Best '+ord(best)+'   ':'')+'Top '+L.goal,cx+290*u,y,16*u,800,lock?'rgba(243,234,214,.4)':best&&best<=L.goal?'#7ccf9a':'#f2b632','right')});
  T('Up and down to choose. Enter to race. Backspace for the menu.',cx,H*.2+10*44*u+16*u,18*u,800,'#f2b632','center');
 }
 if(state==='garage'||state==='final'){
  ctx.fillStyle='rgba(29,35,32,.95)';ctx.fillRect(0,0,W,H);const cx=W/2,u=Math.min(1,W/700);
  if(state==='garage'){
   T('Garage',cx,H*.17,72*u,900,'#f3ead6','center');
   T('Credits '+credits+(camp?'   Level '+lvl+(lvlOk?' passed':' failed'):'   Race '+rn+' of '+RACES+' done'),cx,H*.17+36*u,22*u,500,'#f3ead6','center');
   UPN.forEach((n,i)=>{const y=H*.3+i*66*u,l=UPG[i],cost=UPC[i]*(l+1);
    rr(cx-300*u,y-30*u,600*u,56*u,14*u,'rgba(243,234,214,.12)');
    T((i+1)+'  '+n[0],cx-282*u,y-2*u,22*u,800,'#f3ead6');T(n[1],cx-282*u,y+16*u,14*u,500,'rgba(243,234,214,.75)');
    for(let k=0;k<3;k++)rr(cx+30*u+k*28*u,y-14*u,22*u,14*u,4,k<l?'#f2b632':'rgba(243,234,214,.25)');
    T(l<3?cost+' cr':'Maxed',cx+284*u,y+2*u,20*u,800,l<3&&credits>=cost?'#f2b632':'rgba(243,234,214,.5)','right')});
   T(camp?'Press 1 to 4 to buy. Enter for the level list.':'Press 1 to 4 to buy. Enter for the next race.',cx,H*.3+4*66*u+24*u,24*u,800,'#f2b632','center');
  }else{
   const o=[0,1,2,3,4,5].sort((a,b)=>cpts[b]-cpts[a]);
   T(o[0]===4?'Champion':'Championship over',cx,H*.2,80*u,900,'#f3ead6','center');
   o.forEach((k,i)=>{const y=H*.2+70*u+i*34*u,c=cars[k];T(ord(i+1),cx-170*u,y,22*u,800,k===4?'#f2b632':'#f3ead6');rr(cx-120*u,y-14*u,14*u,14*u,7*u,c.col);T(c.name,cx-96*u,y,22*u,k===4?900:500,k===4?'#f2b632':'#f3ead6');T(cpts[k]+' pts',cx+170*u,y,22*u,800,'#f3ead6','right')});
   T('Enter for the main menu',cx,H*.2+70*u+7*34*u,24*u,800,'#f2b632','center');
  }
 }
 if(state==='done'){
   ctx.fillStyle='rgba(8,17,22,.84)';ctx.fillRect(0,0,W,H);
  const cx=W/2,u=Math.min(1,W/700);
   for(let r=0;r<2;r++)for(let i=0;i<28;i++){ctx.fillStyle=(i+r)%2?'#fff3d5':'#18242a';ctx.fillRect(cx-196*u+i*14*u,H*.105+r*14*u,14*u,14*u)}
   T('FINISH LINE',cx,H*.105+59*u,20*u,900,'#f5c842','center');
  if(state==='menu'){
   for(let r=0;r<2;r++)for(let i=0;i<30;i++){ctx.fillStyle=(i+r)%2?'#f3ead6':'#1d2320';ctx.fillRect(cx-210*u+i*14*u,H*.3-125*u+r*14*u,14*u,14*u)}
   T('Hairpin',cx+5*u,H*.3+5*u,110*u,900,'#ef5b3f','center');T('Hairpin',cx,H*.3,110*u,900,'#f3ead6','center');
   T(TH.n+'   '+LAPS+' laps   '+MODES[set.mode].n+'   '+DN[set.diff],cx,H*.3+44,22*u,500,'#f3ead6','center');
   const L=['Arrows or WASD to drive, Space handbrake, Shift nitro','E opens DRS, T changes weather, V camera, P pause, R restart','O opens settings: maps, modes, difficulty and more','C starts a 3 race championship','G opens the 10 level career'];
   L.forEach((t,i)=>T(t,cx,H*.5+i*27*u,20*u,500,'#f3ead6','center'));
   T('Enter to race. O settings. C championship. G career.',cx,H*.5+150*u,26*u,800,'#f2b632','center');
   T('Races '+stats.races+'   Wins '+stats.wins+'   Best drift score '+stats.bestScore,cx,H*.5+188*u,18*u,500,'#f3ead6','center');
  }else{
    T(pos===1?'VICTORY!':ord(pos).toUpperCase()+' PLACE',cx,H*.25,84*u,900,pos===1?'#f7ca4b':'#f3ead6','center');
   T('Your best lap '+(P.best<1e9?fmt(P.best):'none')+(stored&&stored<=P.best?'   Track record':'')+'   Drift score '+Math.round(score),cx,H*.25+40,20*u,500,'#f3ead6','center');
   o.forEach((c,i)=>{const y=H*.25+90*u+i*32*u;
    T(ord(i+1),cx-170*u,y,20*u,800,c===P?'#f2b632':'#f3ead6');T(c.name,cx-100*u,y,20*u,c===P?900:500,c===P?'#f2b632':'#f3ead6');
    T(c.fin?fmt(c.ft):'Still racing',cx+170*u,y,20*u,500,'#f3ead6','right');if(champ)T('+'+racePts[cars.indexOf(c)],cx+250*u,y,20*u,800,'#f2b632','right')});
   if(camp)T(lvlOk?'Level passed':'Level failed, finish top '+LV[lvl-1].goal,cx,H*.25+66*u,22*u,800,lvlOk?'#7ccf9a':'#ef5b3f','center');
   T(camp?'Enter for the garage':champ?(rn<RACES?'Enter for the garage':'Enter for the final standings'):'Enter to race again. N for a new track.',cx,H*.25+90*u+7*32*u,24*u,800,'#f2b632','center');
  }
 }
}
let lastUi='';
function publishUi(){
  const detail={state,paused,track:TH.n,laps:LAPS,mode:MODES[set.mode].n,difficulty:DN[set.diff],races:stats.races,wins:stats.wins,bestScore:stats.bestScore,graphics:use3d&&racer3d?.available?'3D':'CLASSIC',sound:!!set.snd,
   settings:state==='settings'?ROWS.map(([label,key],index)=>({label,value:OPTS[key][set[key]],description:rowDesc(index)})):undefined,
   levels:state==='levels'?LV.map((level,index)=>({name:level.n,laps:level.laps,goal:level.goal,locked:index+1>stats.unlock,best:stats.lv[index+1]||0})):undefined,
   upgrades:state==='garage'?UPN.map((upgrade,index)=>({name:upgrade[0],description:upgrade[1],level:UPG[index],cost:UPC[index]*(UPG[index]+1),affordable:credits>=UPC[index]*(UPG[index]+1)})):undefined,
   credits:state==='garage'?credits:undefined,
   place:state==='done'?order().indexOf(P)+1:undefined};
 const next=JSON.stringify(detail);
 if(next!==lastUi){lastUi=next;window.dispatchEvent(new CustomEvent('cars4:state',{detail}))}
}
window.addEventListener('cars4:action',e=>{
 const {type,index,direction}=e.detail||{};
 if(type==='setting'&&state==='settings'&&Number.isInteger(index)&&index>=0&&index<ROWS.length){srow=index;chg(direction===-1?-1:1)}
 else if(type==='level'&&state==='levels'&&Number.isInteger(index)&&index>=0&&index<LV.length){sel=index+1;if(sel<=stats.unlock)startLevel(sel)}
 else if(type==='upgrade'&&state==='garage'&&Number.isInteger(index)&&index>=0&&index<UPN.length)buy(index);
 else if(type==='continue')enter();
 else if(type==='resume')paused=false;
 else if(type==='restart'&&(state==='race'||state==='count')){paused=false;go(false)}
 else if(type==='back'&&state==='settings')leaveSettings();
 else if(type==='back'&&state==='levels'){camp=0;lvl=0;UPG.fill(0);credits=0;go(true);state='menu'}
 else if(type==='quit'){paused=false;camp=0;champ=0;lvl=0;reset();state='menu'}
});
window.addEventListener('cars4:daily',e=>{
 if(state!=='menu')return;
 const v=e.detail;if(!v||!Number.isInteger(v.seed)||!Number.isInteger(v.map)||v.map<0||v.map>=MAPS.length)return;
 camp=0;champ=0;set.map=v.map;set.weather=clamp(v.weather|0,0,2);set.diff=clamp(v.difficulty|0,0,3);set.laps=2;
  raceAudio.unlock();mapSel=v.map;build(v.seed);applyRace();reset();state='count';cd=3.4;raceAudio.effect('start');
});
let last=0;
const HH=1/120;let acc=0,ema=.016;
function sim(h){
 time+=h;
 const inp={th:!!(K.ArrowUp||K.KeyW),br:!!(K.ArrowDown||K.KeyS),st:((K.ArrowRight||K.KeyD)?1:0)-((K.ArrowLeft||K.KeyA)?1:0),hb:!!K.Space,nit:!!(K.ShiftLeft||K.ShiftRight),drs:!!K.KeyE};
 if(!camp&&MODES[set.mode].chaos)chaosStep(h);else CH.kind=null;
 calcFX();if(FX.inv)inp.st=-inp.st;
 for(const c of cars){c.px=c.x;c.py=c.y;c.pa=c.a;c.prog=c.lap*N+c.i}
 for(const c of cars)step(c,c.ai?ai(c):inp,h);
 collide();
 if(!set.dmg||FX.nodmg)for(const c of cars)c.hp=100;
 {const s3=Math.min(2,Math.floor(P.i*3/N));if(P.sec===undefined){P.sec=s3;P.ss=time}else if(s3!==P.sec){if(s3===(P.sec+1)%3&&P.lap>=1&&!P.ai&&!(P.lap===1&&P.sec===2)){const sp=time-P.ss,b=sbest[P.sec],d=sp-b;secMsg={t:time,txt:'S'+(P.sec+1)+'  '+sp.toFixed(2)+(b<1e8?'  '+(d>=0?'+':'')+d.toFixed(2):''),col:sp<b?'#c58cf0':'#f2b632'};if(sp<b)sbest[P.sec]=sp}P.sec=s3;P.ss=time}}
 if(state==='race'&&P.lap>=1&&!P.ai)rec.push([time-P.ls,P.x,P.y,P.a,P.i]);
 if(ghost&&state==='race'){const rt=time-P.ls;while(ghost[ghT+1]&&ghost[ghT+1][0]<rt)ghT++}
 shake*=Math.exp(-h*6);
}
function frame(t){
 const raw=Math.min(.1,(t-last)/1000||0);last=t;fno++;
 const dt=paused?0:raw;
 ema+=(raw-ema)*.05;if(fno%90===0&&ema>.024&&Dm>1){Dm=Math.max(1,Dm-.25);rs()}
 if(state==='count'){const before=Math.ceil(cd);cd-=dt;if(cd>0&&Math.ceil(cd)!==before)raceAudio.effect('count');if(cd<=0){state='race';time=0;acc=0;raceAudio.effect('go')}}
 if(state==='race'||state==='done'){acc+=dt;let n=0;while(acc>=HH&&n<8){sim(HH);acc-=HH;n++}if(n>=8)acc=0}
 const al=acc/HH;
 for(const c of cars){if(c.px===undefined){c.px=c.x;c.py=c.y;c.pa=c.a}c.rx=c.px+(c.x-c.px)*al;c.ry=c.py+(c.y-c.py)*al;c.ra=c.pa+ad(c.a,c.pa)*al}
 for(const p of parts){p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
 parts=parts.filter(p=>p.l>0);
 const k=1-Math.exp(-dt*7);
 cam.x+=(P.rx+P.vx*.3-cam.x)*k;cam.y+=(P.ry+P.vy*.3-cam.y)*k;
 if(state==='menu')cam.a+=dt*.12;else cam.a+=ad(camMode?-Math.PI/2:P.ra,cam.a)*(1-Math.exp(-dt*4));
 cam.sp+=((state==='menu'?200:P.sp)-cam.sp)*(1-Math.exp(-dt*3));
 {const g=clamp(1+Math.floor(P.sp/105),1,6);P.gear=g;P.rpm=g<6?(P.sp-(g-1)*105)/105:clamp((P.sp-525)/350,0,1)}
 raceAudio.update({active:(state==='race'||state==='done')&&!paused,speed:P.sp||0,rpm:P.rpm||0,throttle:!!(K.ArrowUp||K.KeyW),braking:!!(K.ArrowDown||K.KeyS),drifting:!!P.dr,offRoad:!!P.off,nitro:!!P.nitroOn,rain:weather===1});
  if(!use3d||!racer3d?.available)prefetch();draw();publishUi();requestAnimationFrame(frame);
}
camMode=set.cam;raceAudio.setEnabled(!!set.snd);mapSel=set.map>=MAPS.length?0:set.map;build(1000+Math.random()*9000|0);applyRace();reset();
(document.fonts&&document.fonts.ready||Promise.resolve()).then(()=>requestAnimationFrame(frame));
