import * as THREE from './three.module.js';
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('is-touch');
const params = new URLSearchParams(location.search);
const WX = isTouch ? 80 : 128, WZ = WX, WY = 48, CS = 16, NCX = WX / CS, NCZ = WZ / CS;
const AIR=0,GRASS=1,DIRT=2,STONE=3,WOOD=4,LEAVES=5,SAND=6,WATER=7,PLANK=8,RED=9,ORANGE=10,YELLOW=11,LIME=12,BLUE=13,PURPLE=14,PINK=15,GLASS=16;
const names=['Air','Grass','Dirt','Stone','Wood','Leaves','Sand','Water','Planks','Red','Orange','Yellow','Lime','Blue','Purple','Pink','Glass'];
const top=[], side=[];
const C=(i,t,s=t)=>{top[i]=t;side[i]=s;};
C(GRASS,[90,200,60],[140,100,60]);C(DIRT,[140,100,60]);C(STONE,[140,140,145]);C(WOOD,[180,140,80],[110,75,40]);
C(LEAVES,[50,160,50]);C(SAND,[235,220,150]);C(WATER,[50,120,230]);C(PLANK,[205,160,95]);C(RED,[235,50,50]);
C(ORANGE,[255,150,30]);C(YELLOW,[255,230,40]);C(LIME,[120,240,60]);C(BLUE,[50,110,255]);C(PURPLE,[160,70,230]);C(PINK,[255,120,200]);C(GLASS,[200,240,255]);
const hotbar=[GRASS,DIRT,STONE,PLANK,RED,YELLOW,LIME,BLUE,PINK];
const isTrans=b=>b===WATER||b===GLASS, solid=b=>b!==AIR&&b!==WATER;
const world=new Uint8Array(WX*WY*WZ); const idx=(x,y,z)=>(x*WY+y)*WZ+z;
const getB=(x,y,z)=>(x<0||z<0||x>=WX||z>=WZ||y<0)?STONE:(y>=WY?AIR:world[idx(x,y,z)]);
const dirty=new Set();
function setB(x,y,z,b){if(x<0||z<0||y<0||x>=WX||y>=WY||z>=WZ)return;world[idx(x,y,z)]=b;
  const cx=x/CS|0,cz=z/CS|0;dirty.add(cx+','+cz);
  if(x%CS===0&&cx>0)dirty.add((cx-1)+','+cz);if(x%CS===CS-1&&cx<NCX-1)dirty.add((cx+1)+','+cz);
  if(z%CS===0&&cz>0)dirty.add(cx+','+(cz-1));if(z%CS===CS-1&&cz<NCZ-1)dirty.add(cx+','+(cz+1));}
// noise
let seed=params.has('seed')?+params.get('seed'):(Math.random()*1e6)|0;
function hash2(x,z){let h=Math.imul(x,374761393)+Math.imul(z,668265263)+Math.imul(seed,2246822519)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
const sm=t=>t*t*(3-2*t), lerp=(a,b,t)=>a+(b-a)*t;
function vn(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=sm(x-ix),fz=sm(z-iz);return lerp(lerp(hash2(ix,iz),hash2(ix+1,iz),fx),lerp(hash2(ix,iz+1),hash2(ix+1,iz+1),fx),fz);}
function fbm(x,z){let s=0,a=1,f=1,n=0;for(let i=0;i<4;i++){s+=vn(x*f,z*f)*a;n+=a;a/=2;f*=2;}return s/n;}
let rs=seed; const rnd=()=>{rs=(Math.imul(rs,1103515245)+12345)>>>0;return rs/4294967296;};
const SEA=16;
for(let x=0;x<WX;x++)for(let z=0;z<WZ;z++){const h=(10+fbm(x/36,z/36)*24)|0;
  for(let y=0;y<=h;y++)world[idx(x,y,z)]=y===h?(h<=SEA+1?SAND:GRASS):(y>h-4?(h<=SEA+1?SAND:DIRT):STONE);
  for(let y=h+1;y<=SEA;y++)world[idx(x,y,z)]=WATER;}
for(let i=0;i<WX*WZ/110;i++){const x=3+(rnd()*(WX-6))|0,z=3+(rnd()*(WZ-6))|0;let y=WY-1;while(y>0&&world[idx(x,y,z)]===AIR)y--;
  if(world[idx(x,y,z)]!==GRASS)continue;const th=4+(rnd()*3|0);
  for(let dy=-2;dy<=1;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const r=dy>=0?1:2;if(Math.abs(dx)>r||Math.abs(dz)>r)continue;
    if(Math.abs(dx)===2&&Math.abs(dz)===2&&rnd()<.5)continue;const yy=y+th+dy;if(yy<WY&&world[idx(x+dx,yy,z+dz)]===AIR)world[idx(x+dx,yy,z+dz)]=LEAVES;}
  for(let t=1;t<=th;t++)if(y+t<WY)world[idx(x,y+t,z)]=WOOD;}
// render
const renderer=new THREE.WebGLRenderer({antialias:!isTouch,powerPreference:'high-performance',preserveDrawingBuffer:params.has('shot')});
renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.5:2));document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x87c8fa);scene.fog=new THREE.Fog(0x87c8fa,isTouch?30:45,isTouch?70:110);
const camera=new THREE.PerspectiveCamera(70,1,0.1,200);camera.rotation.order='YXZ';
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
const opaqueMat=new THREE.MeshBasicMaterial({vertexColors:true});
const transMat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.6,depthWrite:false,side:THREE.DoubleSide});
const FD=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const FV=[[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],[[0,0,1],[0,1,1],[0,1,0],[0,0,0]],[[0,1,0],[0,1,1],[1,1,1],[1,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[1,0,1],[1,1,1],[0,1,1],[0,0,1]],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]];
const SH=[.8,.8,1,.55,.68,.68];
const chunks={};
function buildChunk(cx,cz){const key=cx+','+cz;
  for(const pass of [0,1]){const k=key+':'+pass;if(chunks[k]){scene.remove(chunks[k]);chunks[k].geometry.dispose();delete chunks[k];}
    const P=[],Cl=[],I=[];
    for(let x=cx*CS;x<cx*CS+CS;x++)for(let y=0;y<WY;y++)for(let z=cz*CS;z<cz*CS+CS;z++){const b=world[idx(x,y,z)];
      if(!b||(isTrans(b)?1:0)!==pass)continue;
      for(let f=0;f<6;f++){const n=getB(x+FD[f][0],y+FD[f][1],z+FD[f][2]);if(!(n===AIR||(isTrans(n)&&n!==b)))continue;
        const c=f===2?top[b]:side[b],s=SH[f]*(0.92+0.08*hash2(x*31+y,z*17+y*7))/255,base=P.length/3;
        const drop=(b===WATER&&f===2)?0.1:0;
        for(const v of FV[f]){P.push(x+v[0],y+v[1]-(v[1]?drop:0),z+v[2]);Cl.push(c[0]*s,c[1]*s,c[2]*s);}
        I.push(base,base+1,base+2,base,base+2,base+3);}}
    if(!I.length)continue;
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(Cl,3));g.setIndex(I);
    // three expects CCW front faces; our quads are CW from outside -> flip
    const m=new THREE.Mesh(g,pass?transMat:opaqueMat);m.material.side=pass?THREE.DoubleSide:THREE.FrontSide;
    if(pass)m.renderOrder=1;scene.add(m);chunks[k]=m;}}
for(let cx=0;cx<NCX;cx++)for(let cz=0;cz<NCZ;cz++)buildChunk(cx,cz);
const sel_box=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)),new THREE.LineBasicMaterial({color:0}));scene.add(sel_box);
// player
const PW=.3,PH=1.75;const pos=new THREE.Vector3(),vel=new THREE.Vector3();let yaw=.8,pitch=-.2,onGround=false;
function collides(p){for(let x=Math.floor(p.x-PW);x<=Math.floor(p.x+PW);x++)for(let y=Math.floor(p.y);y<=Math.floor(p.y+PH);y++)for(let z=Math.floor(p.z-PW);z<=Math.floor(p.z+PW);z++)if(solid(getB(x,y,z)))return true;return false;}
function spawn(){const x=WX/2,z=WZ/2;let y=WY-1;while(y>0&&!solid(world[idx(x,y,z)]))y--;pos.set(x+.5,y+1.01,z+.5);vel.set(0,0,0);}
spawn();
function raycast(o,d){let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);const sx=d.x>0?1:-1,sy=d.y>0?1:-1,sz=d.z>0?1:-1;
  const tdx=Math.abs(1/d.x),tdy=Math.abs(1/d.y),tdz=Math.abs(1/d.z);
  let tx=(d.x>0?x+1-o.x:o.x-x)*tdx,ty=(d.y>0?y+1-o.y:o.y-y)*tdy,tz=(d.z>0?z+1-o.z:o.z-z)*tdz,lx=x,ly=y,lz=z,t=0;
  while(t<6){const b=(x>=0&&z>=0&&x<WX&&z<WZ&&y>=0&&y<WY)?world[idx(x,y,z)]:AIR;
    if(b!==AIR&&b!==WATER)return{h:[x,y,z],p:[lx,ly,lz]};lx=x;ly=y;lz=z;
    if(tx<ty&&tx<tz){x+=sx;t=tx;tx+=tdx;}else if(ty<tz){y+=sy;t=ty;ty+=tdy;}else{z+=sz;t=tz;tz+=tdz;}}return null;}
// UI
let sel=0;const hb=document.getElementById('hotbar'),nameEl=document.getElementById('name'),help=document.getElementById('help');
const css=c=>`rgb(${c})`;
hotbar.forEach((b,i)=>{const d=document.createElement('div');d.className='slot';d.style.background=`linear-gradient(${css(top[b])} 50%, ${css(side[b])} 50%)`;
  d.innerHTML=`<span>${i+1}</span>`;const pick=e=>{e.preventDefault();e.stopPropagation();setSel(i);};d.addEventListener('touchstart',pick,{passive:false});d.addEventListener('mousedown',pick);hb.appendChild(d);});
function setSel(i){sel=i;[...hb.children].forEach((c,j)=>c.classList.toggle('sel',j===i));nameEl.textContent=names[hotbar[i]];}
setSel(0);
let showHelp=true;const toggleHelp=()=>{showHelp=!showHelp;help.style.opacity=showHelp?1:0.25;};
help.addEventListener('touchstart',e=>{e.preventDefault();toggleHelp();},{passive:false});
const keys={};let locked=false,started=false;const startEl=document.getElementById('start');
let doBreak=false,doPlace=false,jumpHeld=false;
const canvas=renderer.domElement;
function begin(){started=true;startEl.style.display='none';
  if(isTouch){const el=document.documentElement;(el.requestFullscreen||el.webkitRequestFullscreen||(()=>{})).call(el)?.catch?.(()=>{});}
  else canvas.requestPointerLock();}
startEl.addEventListener('click',begin);startEl.addEventListener('touchend',e=>{e.preventDefault();begin();},{passive:false});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;if(!locked&&!isTouch){startEl.style.display='flex';}});
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code.startsWith('Digit')){const n=+e.code.slice(5);if(n>=1&&n<=9)setSel(n-1);}
  if(e.code==='KeyH')toggleHelp();if(e.code==='KeyR')spawn();if(e.code==='Space')e.preventDefault();});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousemove',e=>{if(!locked)return;yaw+=e.movementX*.0025;pitch-=e.movementY*.0025;pitch=Math.max(-1.5,Math.min(1.5,pitch));});
addEventListener('mousedown',e=>{if(!locked)return;if(e.button===0)doBreak=true;if(e.button===2)doPlace=true;});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('wheel',e=>{if(locked)setSel((sel+(e.deltaY>0?1:8))%9);},{passive:true});
// touch
const joy=document.getElementById('joy'),knob=document.getElementById('knob');let joyId=null,joyC=null,jv={x:0,y:0},lookId=null,lookLast=null;
function btn(id,down,up){const el=document.getElementById(id);el.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();el.classList.add('down');down();},{passive:false});
  el.addEventListener('touchend',e=>{e.preventDefault();el.classList.remove('down');up&&up();},{passive:false});el.addEventListener('touchcancel',()=>{el.classList.remove('down');up&&up();});}
btn('bJump',()=>jumpHeld=true,()=>jumpHeld=false);btn('bBreak',()=>doBreak=true);btn('bPlace',()=>doPlace=true);
document.addEventListener('touchstart',e=>{if(!started)return;e.preventDefault();for(const t of e.changedTouches){
  if(t.clientX<innerWidth*0.4&&joyId===null){joyId=t.identifier;const r=joy.getBoundingClientRect();joyC={x:r.left+r.width/2,y:r.top+r.height/2};moveJoy(t);}
  else if(lookId===null){lookId=t.identifier;lookLast={x:t.clientX,y:t.clientY};}}},{passive:false});
function moveJoy(t){let dx=t.clientX-joyC.x,dy=t.clientY-joyC.y;const l=Math.hypot(dx,dy),m=55;if(l>m){dx*=m/l;dy*=m/l;}jv={x:dx/m,y:dy/m};knob.style.transform=`translate(${dx}px,${dy}px)`;}
document.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches){if(t.identifier===joyId)moveJoy(t);
  else if(t.identifier===lookId){yaw+=(t.clientX-lookLast.x)*.006;pitch-=(t.clientY-lookLast.y)*.006;pitch=Math.max(-1.5,Math.min(1.5,pitch));lookLast={x:t.clientX,y:t.clientY};}}},{passive:false});
function endT(e){for(const t of e.changedTouches){if(t.identifier===joyId){joyId=null;jv={x:0,y:0};knob.style.transform='';}if(t.identifier===lookId)lookId=null;}}
document.addEventListener('touchend',endT);document.addEventListener('touchcancel',endT);
document.addEventListener('gesturestart',e=>e.preventDefault());
// loop
const water=document.createElement('div');water.style.cssText='position:fixed;inset:0;background:rgba(30,80,200,.35);pointer-events:none;display:none';document.body.appendChild(water);
let last=performance.now(),frames=0;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;frames++;
  const fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);let mx=0,mz=0;
  if(keys.KeyW||keys.ArrowUp){mx+=fx;mz+=fz;}if(keys.KeyS||keys.ArrowDown){mx-=fx;mz-=fz;}
  if(keys.KeyD||keys.ArrowRight){mx+=rx;mz+=rz;}if(keys.KeyA||keys.ArrowLeft){mx-=rx;mz-=rz;}
  mx+=fx*-jv.y+rx*jv.x;mz+=fz*-jv.y+rz*jv.x;
  const inWater=getB(Math.floor(pos.x),Math.floor(pos.y+.5),Math.floor(pos.z))===WATER;
  const spd=(keys.ShiftLeft?7:4.5)*(inWater?.6:1);const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}
  vel.x=mx*spd;vel.z=mz*spd;const jump=keys.Space||jumpHeld;
  if(inWater){vel.y=Math.max(-2,vel.y-8*dt);if(jump)vel.y=3;}else{vel.y=Math.max(-30,vel.y-25*dt);if(jump&&onGround)vel.y=8.2;}
  let np=pos.clone();np.x+=vel.x*dt;if(!collides(np))pos.copy(np);np=pos.clone();np.z+=vel.z*dt;if(!collides(np))pos.copy(np);
  np=pos.clone();np.y+=vel.y*dt;onGround=false;
  if(collides(np)){if(vel.y<0){onGround=true;const oy=pos.y;pos.y=Math.floor(pos.y)+.001;if(collides(pos))pos.y=oy;}vel.y=0;}else pos.copy(np);
  if(pos.y<-10)spawn();
  camera.position.set(pos.x,pos.y+1.6,pos.z);camera.rotation.set(pitch,-yaw,0);
  const look=new THREE.Vector3(Math.cos(pitch)*Math.sin(yaw),Math.sin(pitch),-Math.cos(pitch)*Math.cos(yaw));
  const hit=raycast(camera.position,look);
  if(hit){sel_box.visible=true;sel_box.position.set(hit.h[0]+.5,hit.h[1]+.5,hit.h[2]+.5);
    if(doBreak)setB(...hit.h,AIR);
    if(doPlace){const [x,y,z]=hit.p,nb=hotbar[sel];if(x>=0&&y>=0&&z>=0&&x<WX&&y<WY&&z<WZ){const old=world[idx(x,y,z)];world[idx(x,y,z)]=nb;const bad=collides(pos);world[idx(x,y,z)]=old;if(!bad)setB(x,y,z,nb);}}}
  else sel_box.visible=false;
  doBreak=doPlace=false;
  for(const k of dirty){const [a,b]=k.split(',').map(Number);buildChunk(a,b);}dirty.clear();
  water.style.display=getB(Math.floor(camera.position.x),Math.floor(camera.position.y),Math.floor(camera.position.z))===WATER?'block':'none';
  renderer.render(scene,camera);if(frames===20)window.__ready=true;requestAnimationFrame(frame);}
requestAnimationFrame(frame);
