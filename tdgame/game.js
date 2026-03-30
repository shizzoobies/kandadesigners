// ============= AGES OF DEFENSE — V2 Full Gameplay Depth =============

// ============= GRID & LAYOUT =============
const COLS=18,ROWS=11;

// 6 unique maps — waypoints per age
const AGE_MAPS=[
  // Stone Age: "The Valley" — simple S-path
  [[-1,2],[14,2],[14,5],[3,5],[3,8],[COLS,8]],
  // Bronze Age: "The Labyrinth" — more turns
  [[-1,1],[15,1],[15,3],[5,3],[5,5],[13,5],[13,7],[3,7],[3,9],[COLS,9]],
  // Medieval: "Castle Siege" — wraps around center
  [[-1,1],[16,1],[16,5],[9,5],[9,3],[2,3],[2,7],[9,7],[9,9],[COLS,9]],
  // Industrial: "Factory District" — zig-zag
  [[-1,1],[8,1],[8,3],[2,3],[2,5],[14,5],[14,7],[6,7],[6,9],[COLS,9]],
  // Modern: "Highway" — long winding road
  [[-1,1],[16,1],[16,3],[2,3],[2,5],[16,5],[16,7],[2,7],[2,9],[COLS,9]],
  // Future: "Neon Grid" — spiral inward
  [[-1,0],[16,0],[16,5],[10,5],[10,2],[4,2],[4,7],[12,7],[12,10],[COLS,10]]
];

// ============= AGES =============
const AGES=[
  {name:'Stone Age',color:'#4a7c59',path:'#8B7355',accent:'#CD853F',bg:'#2d4a35'},
  {name:'Bronze Age',color:'#5c7a3e',path:'#B8860B',accent:'#D2691E',bg:'#3a3520'},
  {name:'Medieval',color:'#3d5c3a',path:'#696969',accent:'#B22222',bg:'#2a2a2a'},
  {name:'Industrial',color:'#3a4a3a',path:'#556B2F',accent:'#708090',bg:'#1e2428'},
  {name:'Modern',color:'#2a3a4a',path:'#4a4a5a',accent:'#4169E1',bg:'#141828'},
  {name:'Future',color:'#1a1a3a',path:'#2a1a4a',accent:'#00FFFF',bg:'#0a0a1e'}
];

// ============= ASSET MAPPINGS =============
const AGE_TILES=[
  {grass:1,path:2},{grass:3,path:4},{grass:5,path:6},
  {grass:7,path:8},{grass:9,path:10},{grass:11,path:12}
];
// Tower images: indices 0-11 = original (13-24), indices 12-23 = new (60-71)
const TOWER_IMGS=[13,14,15,16,17,18,19,20,21,22,23,24,60,61,62,63,64,65,66,67,68,69,70,71];
const ECON_IMGS=[25,26,27,28,29,30];
const ENEMY_IMGS=[
  {regular:[31,32],boss:33},
  {regular:[34,35],boss:36},
  {regular:[37,38],boss:39},
  {regular:[40,41],boss:42},
  {regular:[43,44],boss:45},
  {regular:[46,47],boss:48}
];
// Projectile images per tower index (null = no projectile / melee / beam)
const PROJ_IMGS=[49,49,50,50,50,51,52,53,54,55,null,56,
  null,73,74,75,76,77,78,79,80,81,null,83];

// ============= TOWERS (with targeting + armor bonuses) =============
const TOWERS=[
  {name:'Rock Thrower',cost:30,dmg:15,range:2.5,rate:1.2,pSpd:5,splash:0,age:0,clr:'#8B7355',
   targets:'ground',canDetect:false,slow:0,bonusVs:null,
   desc:'Hurls rocks at nearby enemies',strong:'Single targets'},
  {name:'Spike Trap',cost:20,dmg:10,range:1.5,rate:0.5,pSpd:8,splash:0,age:0,clr:'#556B2F',
   targets:'ground',canDetect:true,slow:0.3,bonusVs:'light',
   desc:'Damages and slows nearby enemies. Reveals stealth.',strong:'Fast / Stealth enemies'},
  {name:'Archer',cost:60,dmg:22,range:3.5,rate:0.8,pSpd:8,splash:0,age:1,clr:'#CD853F',
   targets:'both',canDetect:false,slow:0,bonusVs:'light',
   desc:'Rapid arrows, hits air and ground',strong:'Light armor / Air'},
  {name:'Spear Thrower',cost:80,dmg:40,range:2.8,rate:1.4,pSpd:6,splash:0,age:1,clr:'#B8860B',
   targets:'ground',canDetect:false,slow:0,bonusVs:'heavy',
   desc:'Heavy piercing damage to ground targets',strong:'Heavy armor / Bosses'},
  {name:'Crossbow',cost:120,dmg:45,range:3.8,rate:0.65,pSpd:10,splash:0,age:2,clr:'#808080',
   targets:'both',canDetect:true,slow:0,bonusVs:'light',
   desc:'Precise bolts, detects stealth. Hits air.',strong:'Stealth / Air'},
  {name:'Catapult',cost:160,dmg:65,range:3.5,rate:2.0,pSpd:4,splash:1.5,age:2,clr:'#8B4513',
   targets:'ground',canDetect:false,slow:0,bonusVs:null,
   desc:'Launches boulders dealing splash damage',strong:'Groups'},
  {name:'Cannon',cost:250,dmg:100,range:3.2,rate:2.2,pSpd:6,splash:1.8,age:3,clr:'#4A4A4A',
   targets:'ground',canDetect:false,slow:0.2,bonusVs:'heavy',
   desc:'Explosive shells with area damage',strong:'Heavy armor / Groups'},
  {name:'Gatling',cost:300,dmg:18,range:3.0,rate:0.15,pSpd:12,splash:0,age:3,clr:'#556B2F',
   targets:'both',canDetect:false,slow:0,bonusVs:'light',
   desc:'Rapid-fire shreds light enemies and air',strong:'Light armor / Swarms'},
  {name:'Missile',cost:500,dmg:200,range:5.0,rate:2.8,pSpd:7,splash:2.0,age:4,clr:'#2F4F4F',
   targets:'both',canDetect:false,slow:0,bonusVs:'air',
   desc:'Guided rockets, devastating vs air',strong:'Air / Groups'},
  {name:'Sniper',cost:600,dmg:400,range:6.0,rate:3.0,pSpd:25,splash:0,age:4,clr:'#1C1C1C',
   targets:'both',canDetect:true,slow:0,bonusVs:'heavy',
   desc:'Extreme range, detects stealth',strong:'Bosses / Stealth'},
  {name:'Laser',cost:1000,dmg:100,range:4.5,rate:0,pSpd:0,splash:0,age:5,clr:'#00CED1',isLaser:true,
   targets:'both',canDetect:true,slow:0.15,bonusVs:null,
   desc:'Continuous beam, reveals all stealth in range',strong:'Everything'},
  {name:'Plasma',cost:1500,dmg:500,range:4.0,rate:2.0,pSpd:8,splash:2.5,age:5,clr:'#9400D3',
   targets:'both',canDetect:false,slow:0,bonusVs:'heavy',
   desc:'Massive plasma blast, huge splash',strong:'Groups / Bosses'},
  // ---- NEW TOWERS (indices 12-23, images 60-71) ----
  {name:'Bone Snare',cost:40,dmg:5,range:1.8,rate:0.8,pSpd:8,splash:0,age:0,clr:'#D2B48C',
   targets:'ground',canDetect:false,slow:0.5,bonusVs:null,
   desc:'Bone trap that heavily slows enemies',strong:'Fast enemies'},
  {name:'Watchtower',cost:55,dmg:8,range:4.0,rate:1.0,pSpd:6,splash:0,age:0,clr:'#A0522D',
   targets:'both',canDetect:true,slow:0,bonusVs:null,
   desc:'Long range lookout, reveals stealth and hits air',strong:'Stealth / Air scout'},
  {name:'Oil Cauldron',cost:100,dmg:35,range:2.0,rate:1.8,pSpd:4,splash:1.2,age:1,clr:'#B8860B',
   targets:'ground',canDetect:false,slow:0.2,bonusVs:null,
   desc:'Boiling oil deals splash damage and slows',strong:'Groups'},
  {name:'Sling Tower',cost:70,dmg:30,range:4.0,rate:0.9,pSpd:7,splash:0,age:1,clr:'#C4A46C',
   targets:'both',canDetect:false,slow:0,bonusVs:'light',
   desc:'Long range sling hits air and ground',strong:'Light armor / Air'},
  {name:'Boiling Pitch',cost:180,dmg:50,range:2.2,rate:2.5,pSpd:3,splash:1.8,age:2,clr:'#2F2F2F',
   targets:'ground',canDetect:false,slow:0.4,bonusVs:null,
   desc:'Tar trap with massive slow and splash',strong:'Groups / Fast enemies'},
  {name:'Wizard Tower',cost:200,dmg:55,range:3.5,rate:1.2,pSpd:9,splash:0,age:2,clr:'#8A2BE2',
   targets:'both',canDetect:true,slow:0,bonusVs:'heavy',
   desc:'Magic bolts pierce defenses, reveals hidden foes',strong:'Stealth / Heavy'},
  {name:'Tesla Coil',cost:350,dmg:40,range:3.0,rate:0.8,pSpd:15,splash:0,age:3,clr:'#4682B4',
   targets:'both',canDetect:false,slow:0.15,bonusVs:null,isChain:true,chainCount:3,
   desc:'Electric arcs chain between nearby enemies',strong:'Swarms'},
  {name:'Flamethrower',cost:280,dmg:30,range:2.0,rate:0.1,pSpd:10,splash:1.5,age:3,clr:'#FF4500',
   targets:'ground',canDetect:false,slow:0,bonusVs:'light',
   desc:'Short range fire cone shreds groups',strong:'Swarms / Light armor'},
  {name:'SAM Site',cost:450,dmg:350,range:5.5,rate:2.5,pSpd:9,splash:0,age:4,clr:'#556B2F',
   targets:'air',canDetect:false,slow:0,bonusVs:'air',
   desc:'Devastating anti-air missiles, ignores ground',strong:'Air specialist'},
  {name:'Radar Station',cost:400,dmg:15,range:5.0,rate:1.5,pSpd:6,splash:0,age:4,clr:'#228B22',
   targets:'both',canDetect:true,slow:0,bonusVs:null,isRadar:true,radarBuff:0.15,
   desc:'Reveals stealth, boosts nearby tower range +15%',strong:'Stealth / Support'},
  {name:'Gravity Well',cost:1200,dmg:60,range:3.5,rate:0,pSpd:0,splash:0,age:5,clr:'#4B0082',isLaser:true,
   targets:'both',canDetect:false,slow:0.6,bonusVs:null,isGravity:true,
   desc:'Warps spacetime, massively slows all in range',strong:'Everything (crowd control)'},
  {name:'Railgun',cost:2000,dmg:800,range:7.0,rate:4.0,pSpd:30,splash:0,age:5,clr:'#FF6600',
   targets:'both',canDetect:true,slow:0,bonusVs:'heavy',
   desc:'Hypersonic round, extreme damage and range',strong:'Bosses / Heavy'}
];

const ECONS=[
  {name:'Hut',cost:50,prod:0.5,age:0,clr:'#8B7355',desc:'Generates a trickle of gold during waves'},
  {name:'Farm',cost:120,prod:1.5,age:1,clr:'#DAA520',desc:'Cultivated fields produce steady income'},
  {name:'Market',cost:300,prod:4,age:2,clr:'#B22222',desc:'Trade hub generating good gold flow'},
  {name:'Factory',cost:700,prod:10,age:3,clr:'#708090',desc:'Industrial production, high output'},
  {name:'Corp',cost:1500,prod:25,age:4,clr:'#4169E1',desc:'Corporate profits fuel your war machine'},
  {name:'Quantum Forge',cost:3500,prod:65,age:5,clr:'#00FFFF',desc:'Bleeding-edge tech, max gold generation'}
];

// ============= ENEMY DEFINITIONS =============
// moveType: 'ground'|'air'|'stealth', armor: 'light'|'medium'|'heavy'
const ENEMY_DEFS=[
  // Stone Age
  {id:0,imgIdx:0,moveType:'ground',armor:'light',spdMult:1.3,name:'Wolf'},      // 31
  {id:1,imgIdx:1,moveType:'ground',armor:'medium',spdMult:1.0,name:'Caveman'},   // 32
  {id:2,imgIdx:'boss',moveType:'ground',armor:'heavy',spdMult:0.7,name:'Mammoth',boss:true}, // 33
  // Bronze Age
  {id:3,imgIdx:0,moveType:'ground',armor:'heavy',spdMult:1.0,name:'Bronze Warrior'}, // 34
  {id:4,imgIdx:1,moveType:'ground',armor:'light',spdMult:1.4,name:'War Chariot'},    // 35
  {id:5,imgIdx:'boss',moveType:'ground',armor:'heavy',spdMult:0.6,name:'War Elephant',boss:true}, // 36
  // Medieval
  {id:6,imgIdx:0,moveType:'ground',armor:'heavy',spdMult:1.0,name:'Knight'},    // 37
  {id:7,imgIdx:1,moveType:'ground',armor:'heavy',spdMult:0.7,name:'Siege Ram'}, // 38
  {id:8,imgIdx:'boss',moveType:'air',armor:'medium',spdMult:1.0,name:'Dragon',boss:true},  // 39 — FIRST AIR
  // Industrial
  {id:9,imgIdx:0,moveType:'stealth',armor:'light',spdMult:1.0,name:'Scout'},       // 40 — FIRST STEALTH
  {id:10,imgIdx:1,moveType:'ground',armor:'heavy',spdMult:1.3,name:'Armored Car'}, // 41
  {id:11,imgIdx:'boss',moveType:'ground',armor:'heavy',spdMult:0.5,name:'Tank',boss:true}, // 42
  // Modern
  {id:12,imgIdx:0,moveType:'stealth',armor:'light',spdMult:1.4,name:'Spec Ops'},  // 43
  {id:13,imgIdx:1,moveType:'ground',armor:'heavy',spdMult:1.0,name:'APC'},        // 44
  {id:14,imgIdx:'boss',moveType:'air',armor:'medium',spdMult:1.2,name:'Helicopter',boss:true}, // 45
  // Future
  {id:15,imgIdx:0,moveType:'air',armor:'light',spdMult:1.5,name:'Drone'},         // 46
  {id:16,imgIdx:1,moveType:'stealth',armor:'heavy',spdMult:1.0,name:'Android'},   // 47
  {id:17,imgIdx:'boss',moveType:'ground',armor:'heavy',spdMult:0.5,name:'Mech',boss:true}  // 48
];

// ============= ARMOR DAMAGE MODIFIERS =============
function armorMod(towerDef,enemyArmor){
  let bonus=towerDef.bonusVs;
  if(bonus==='light'&&enemyArmor==='light') return 1.5;
  if(bonus==='heavy'&&enemyArmor==='heavy') return 1.5;
  if(bonus==='air') return 1.0; // handled separately
  // Penalty: fast towers vs heavy
  if(towerDef.rate<0.3&&enemyArmor==='heavy') return 0.5; // gatling vs heavy
  if(enemyArmor==='light'&&towerDef.splash>0) return 0.8; // splash vs light
  return 1.0;
}

function canTarget(towerDef,enemy){
  if(towerDef.targets==='ground'&&enemy.moveType==='air') return false;
  if(towerDef.targets==='air'&&enemy.moveType!=='air') return false; // SAM Site
  if(enemy.moveType==='stealth'&&!enemy.detected) return false;
  return true;
}

// ============= IMAGE LOADING (fixed for mobile) =============
const IMAGES={};
let imagesLoaded=false;

function preloadAssets(){
  return new Promise(resolve=>{
    let total=83,loaded=0;
    const fill=document.getElementById('load-fill');
    const loadTxt=document.getElementById('load-text');

    function onDone(){
      loaded++;
      let pct=Math.round(loaded/total*100);
      if(fill) fill.style.width=pct+'%';
      if(loadTxt) loadTxt.textContent='Loading assets... '+pct+'%';
      if(loaded>=total){imagesLoaded=true;resolve();}
    }

    // Load assets 1-71 and 73-83 (72,82 don't exist — trap towers)
    let toLoad=[...Array.from({length:71},(_,i)=>i+1),73,74,75,76,77,78,79,80,81,83];
    total=toLoad.length;
    for(let i of toLoad){
      const img=new Image();
      img.onload=()=>{IMAGES[i]=img;onDone();};
      img.onerror=()=>{onDone();};
      img.src='Assets/'+i+'.png';
    }

    // Fallback timeout — if loading stalls, continue anyway after 8s
    setTimeout(()=>{if(!imagesLoaded){imagesLoaded=true;resolve();}},8000);
  });
}

// ============= AUDIO =============
const AUDIO={};
const MUSIC={};
let audioReady=false;
let musicVolume=0.5,ambientVolume=0.15,sfxVolume=0.25,allMuted=false;
let currentMusic=null,currentMusicAge=-1;
let currentAmbient=null,currentAmbientAge=-1;

const SFX={
  click:1,place:2,sell:3,upgrade:4,noGold:5,gold:6,
  towerShot:[7,8,9,10,11,12,13,14,15,16,17,18],
  hit:19,splash:20,kill:21,bossKill:22,lifeLost:23,
  waveStart:24,waveComplete:25,ageUp:26,gameStart:27,gameOver:28
};
const AMBIENT_START=29;

function loadAudio(){
  for(let i=1;i<=34;i++){let a=new Audio('Audio/'+i+'.mp3');a.preload='auto';AUDIO[i]=a;}
  for(let i=1;i<=6;i++){let a=new Audio('Audio/Music/'+i+'.mp3');a.preload='auto';MUSIC[i]=a;}
  audioReady=true;
}

function playSFX(id,vol){
  if(!audioReady||allMuted||!AUDIO[id])return;
  let a=AUDIO[id].cloneNode();a.volume=Math.min(1,(vol||1)*sfxVolume);a.play().catch(()=>{});
}
function playEraMusic(ageIdx){
  if(ageIdx===currentMusicAge)return;
  if(currentMusic){currentMusic.pause();currentMusic.currentTime=0;}
  currentMusicAge=ageIdx;let m=MUSIC[ageIdx+1];
  if(allMuted||!m)return;currentMusic=m;currentMusic.loop=true;currentMusic.volume=musicVolume;currentMusic.play().catch(()=>{});
}
function stopEraMusic(){if(currentMusic){currentMusic.pause();currentMusic.currentTime=0;currentMusic=null;}currentMusicAge=-1;}
function playAmbient(ageIdx){
  if(ageIdx===currentAmbientAge&&currentAmbient&&!currentAmbient.paused)return;
  if(currentAmbient){currentAmbient.pause();currentAmbient.currentTime=0;}
  currentAmbientAge=ageIdx;let id=AMBIENT_START+ageIdx;
  if(allMuted||!AUDIO[id])return;currentAmbient=AUDIO[id];currentAmbient.loop=true;currentAmbient.volume=ambientVolume;currentAmbient.play().catch(()=>{});
}
function stopAmbient(){if(currentAmbient){currentAmbient.pause();currentAmbient.currentTime=0;currentAmbient=null;}currentAmbientAge=-1;}
function updateAllVolumes(){if(currentMusic)currentMusic.volume=allMuted?0:musicVolume;if(currentAmbient)currentAmbient.volume=allMuted?0:ambientVolume;}

// ============= STATE =============
let canvas,ctx,W,H,cellSize,offX,offY;
let path=[],pathSet=new Set();
let mapCache=null,mapCacheAge=-1,mapCacheCellSize=-1;
let smoothPath=[];

let game={
  gold:200,lives:20,wave:0,age:0,phase:'title',speed:1,
  selectedType:null,selectedCat:null,tab:'tower',selectedBuilding:null,
  grid:Array.from({length:ROWS},()=>Array(COLS).fill(null)),
  enemies:[],projectiles:[],particles:[],floats:[],
  waveEnemies:0,waveSpawned:0,spawnTimer:0,waveActive:false,
  laserTargets:new Map(),hoverCell:null,
  waveComposition:[] // preview of next wave
};

// ============= PATH =============
function computePath(){
  let wp=AGE_MAPS[Math.min(game.age,5)];
  path=[];
  for(let i=0;i<wp.length-1;i++){
    let [x1,y1]=wp[i],[x2,y2]=wp[i+1];
    let dx=Math.sign(x2-x1),dy=Math.sign(y2-y1),x=x1,y=y1;
    while(x!==x2||y!==y2){
      if(x>=0&&x<COLS&&y>=0&&y<ROWS) path.push({x,y});
      if(x!==x2)x+=dx; else y+=dy;
    }
  }
  let [lx,ly]=wp[wp.length-1];
  if(lx>=0&&lx<COLS&&ly>=0&&ly<ROWS) path.push({x:lx,y:ly});
  pathSet=new Set(path.map(p=>p.x+','+p.y));
}

function g2p(gx,gy){return{x:offX+gx*cellSize+cellSize/2,y:offY+gy*cellSize+cellSize/2}}
function p2g(px,py){return{x:Math.floor((px-offX)/cellSize),y:Math.floor((py-offY)/cellSize)}}
function dist(x1,y1,x2,y2){return Math.sqrt((x2-x1)**2+(y2-y1)**2)}

// Smooth path spline
function computeSmoothPath(){
  let wp=AGE_MAPS[Math.min(game.age,5)];
  let pts=path.map(p=>g2p(p.x,p.y));
  let entry=g2p(wp[0][0],wp[0][1]);
  let exit=g2p(wp[wp.length-1][0],wp[wp.length-1][1]);
  pts.unshift(entry);pts.push(exit);
  smoothPath=[];
  let sps=8;
  for(let i=0;i<pts.length-1;i++){
    let p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[Math.min(pts.length-1,i+1)],p3=pts[Math.min(pts.length-1,i+2)];
    for(let s=0;s<sps;s++){
      let t=s/sps,t2=t*t,t3=t2*t;
      smoothPath.push({
        x:0.5*(2*p1.x+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y:0.5*(2*p1.y+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      });
    }
  }
  smoothPath.push(pts[pts.length-1]);
}

function getSmoothPos(pathIdx){
  let sps=8,si=(pathIdx+1)*sps;
  let idx=Math.floor(si),frac=si-idx;
  if(idx>=smoothPath.length-1)return smoothPath[smoothPath.length-1];
  if(idx<0)return smoothPath[0];
  let a=smoothPath[idx],b=smoothPath[Math.min(idx+1,smoothPath.length-1)];
  return{x:a.x+(b.x-a.x)*frac,y:a.y+(b.y-a.y)*frac};
}
function getSmoothAngle(pathIdx){
  let sps=8,si=(pathIdx+1)*sps,idx=Math.floor(si);
  if(idx>=smoothPath.length-2)idx=smoothPath.length-2;
  if(idx<0)idx=0;
  let a=smoothPath[idx],b=smoothPath[Math.min(idx+1,smoothPath.length-1)];
  return Math.atan2(b.y-a.y,b.x-a.x);
}

// ============= MAP CACHE =============
function buildMapCache(){
  let mc=document.createElement('canvas');
  mc.width=COLS*cellSize;mc.height=ROWS*cellSize;
  let mctx=mc.getContext('2d');
  let tiles=AGE_TILES[game.age],age=AGES[game.age];
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      let x=c*cellSize,y=r*cellSize,onPath=pathSet.has(c+','+r);
      let imgId=onPath?tiles.path:tiles.grass,img=IMAGES[imgId];
      if(img){mctx.drawImage(img,x,y,cellSize,cellSize);}
      else{mctx.fillStyle=onPath?age.path:age.color;mctx.fillRect(x,y,cellSize,cellSize);}
      mctx.strokeStyle='rgba(0,0,0,0.08)';mctx.strokeRect(x,y,cellSize,cellSize);
    }
  }
  mapCache=mc;mapCacheAge=game.age;mapCacheCellSize=cellSize;
}

// ============= RESIZE =============
function resize(){
  let dpr=window.devicePixelRatio||1;
  W=window.innerWidth;H=window.innerHeight;
  canvas.width=W*dpr;canvas.height=H*dpr;
  canvas.style.width=W+'px';canvas.style.height=H+'px';
  ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  let hudH=38,barH=game.phase==='title'?0:(W<768?105:100);
  let aW=W,aH=H-hudH-barH;
  cellSize=Math.min(aW/COLS,aH/ROWS);
  // On mobile portrait, prioritize fitting width and let grid sit at top
  if(W<H){cellSize=aW/COLS;}
  offX=(aW-cellSize*COLS)/2;
  offY=hudH+Math.max(0,(aH-cellSize*ROWS)/2);
  document.getElementById('hud').style.height=hudH+'px';
  mapCacheCellSize=-1;
  computeSmoothPath();
}

// ============= WAVE SYSTEM =============
function getAge(wave){
  if(wave<=8)return 0;if(wave<=16)return 1;if(wave<=24)return 2;
  if(wave<=32)return 3;if(wave<=40)return 4;return 5;
}
function enemyHP(wave){return Math.round(40*Math.pow(1.18,wave))}
function enemySpeed(wave){return 1.2+wave*0.02}
function enemyCount(wave){return Math.min(6+wave*2,60)}
function spawnInterval(wave){return Math.max(0.3,1.5-wave*0.04)}
function isBoss(wave){return wave%8===0}
function killReward(hp){return Math.max(1,Math.ceil(hp*0.08))}
function waveBonus(wave){return 25+wave*15}

// Build wave composition (what enemies will spawn)
function buildWaveComposition(wave){
  let ageIdx=getAge(wave);
  let defs=ENEMY_DEFS.filter(d=>Math.floor(d.id/3)===ageIdx);
  let regular=defs.filter(d=>!d.boss);
  let boss=defs.find(d=>d.boss);
  let count=enemyCount(wave);
  let comp=[];
  if(isBoss(wave)&&boss){
    // Mix regulars + boss at end
    for(let i=0;i<count;i++) comp.push(regular[i%regular.length]);
    comp.push(boss);
  } else {
    for(let i=0;i<count;i++) comp.push(regular[i%regular.length]);
  }
  return comp;
}

// ============= AGE TRANSITION CUTSCENE =============
let transition={active:false,startTime:0,fromAge:0,toAge:0,refund:0,particles:[]};
const TRANSITION_DURATION=3500; // ms
const TRANSITION_TEXTS=[
  '','The Bronze Age Dawns','The Medieval Era Begins',
  'The Industrial Revolution','The Modern Age','The Future Is Now'
];

function runTransition(fromAge,toAge,refund){
  transition={active:true,startTime:Date.now(),fromAge,toAge,refund,particles:[]};
  // Generate transition particles from old tile colors
  let oldAge=AGES[fromAge],newAge=AGES[toAge];
  for(let i=0;i<60;i++){
    transition.particles.push({
      x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-0.5)*200,vy:(Math.random()-0.5)*200+100,
      size:Math.random()*8+4,life:1,
      color:oldAge.path
    });
  }
  game.phase='transition';
}

function renderTransition(){
  let elapsed=Date.now()-transition.startTime;
  let progress=Math.min(1,elapsed/TRANSITION_DURATION);

  // Background: crossfade between age colors
  let oldBg=AGES[transition.fromAge].bg,newBg=AGES[transition.toAge].bg;
  ctx.fillStyle=oldBg;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=progress;
  ctx.fillStyle=newBg;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1;

  // Old tiles shatter and fall away (first half)
  if(progress<0.5){
    let oldTiles=AGE_TILES[transition.fromAge];
    let shatter=progress*2; // 0->1 during first half
    let oldImg=IMAGES[oldTiles.grass];
    if(oldImg){
      for(let i=0;i<12;i++){
        let x=W*0.1+i*(W*0.07);
        let y=H*0.3+Math.sin(i*1.5)*40;
        let sz=cellSize*(1-shatter*0.5);
        ctx.globalAlpha=1-shatter;
        ctx.save();ctx.translate(x,y);
        ctx.rotate(shatter*i*0.3);
        ctx.drawImage(oldImg,-sz/2,-sz/2+shatter*200,sz,sz);
        ctx.restore();
      }
      ctx.globalAlpha=1;
    }
  }

  // New tiles build up (second half)
  if(progress>0.4){
    let newTiles=AGE_TILES[transition.toAge];
    let build=Math.min(1,(progress-0.4)/0.6);
    let newImg=IMAGES[newTiles.grass];
    let newPathImg=IMAGES[newTiles.path];
    if(newImg){
      for(let i=0;i<14;i++){
        if(build<i/14)break;
        let x=W*0.08+i*(W*0.065);
        let y=H*0.35+Math.sin(i*1.2)*30;
        let sz=cellSize*Math.min(1,(build-i/14)*5);
        ctx.globalAlpha=Math.min(1,(build-i/14)*4);
        ctx.drawImage(Math.random()>0.7&&newPathImg?newPathImg:newImg,x-sz/2,y-sz/2,sz,sz);
      }
      ctx.globalAlpha=1;
    }
  }

  // Falling particles (old age debris)
  for(let p of transition.particles){
    p.x+=p.vx*0.016;p.y+=p.vy*0.016;p.vy+=300*0.016;p.life-=0.012;
    if(p.life>0){
      ctx.globalAlpha=p.life*0.6;ctx.fillStyle=p.color;
      ctx.fillRect(p.x,p.y,p.size,p.size);
    }
  }
  ctx.globalAlpha=1;

  // Center text
  let textProgress=Math.min(1,Math.max(0,(progress-0.2)/0.6));
  if(textProgress>0){
    ctx.globalAlpha=textProgress<0.8?textProgress:Math.max(0,1-(textProgress-0.8)*5);
    ctx.textAlign='center';
    ctx.font='bold '+Math.max(24,W*0.04)+'px sans-serif';
    ctx.fillStyle='#FFD700';
    ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.lineWidth=4;
    let txt=TRANSITION_TEXTS[transition.toAge]||AGES[transition.toAge].name;
    ctx.strokeText(txt,W/2,H*0.45);
    ctx.fillText(txt,W/2,H*0.45);

    // Refund text
    if(transition.refund>0&&progress>0.5){
      ctx.font='bold '+Math.max(16,W*0.025)+'px sans-serif';
      ctx.fillStyle='#fff';
      ctx.globalAlpha*=0.8;
      ctx.fillText('Buildings refunded: +'+transition.refund+' gold',W/2,H*0.55);
    }
    ctx.globalAlpha=1;
  }

  // Scanline effect
  ctx.globalAlpha=0.03;
  for(let y=0;y<H;y+=4){ctx.fillStyle=y%8<4?'#fff':'#000';ctx.fillRect(0,y,W,2);}
  ctx.globalAlpha=1;

  // Complete transition
  if(progress>=1){
    transition.active=false;
    game.phase='play';
    game.age=transition.toAge;
    computePath();computeSmoothPath();
    mapCacheCellSize=-1;
    announceAge();
    playEraMusic(game.age);
    game.waveComposition=buildWaveComposition(game.wave+1);
    updateUI();
  }
}

function transitionAge(newAge){
  // Sell all buildings and refund full cost
  let refund=0;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    let b=game.grid[r][c];if(!b)continue;
    let base=b.cat==='tower'?TOWERS[b.typeId].cost:ECONS[b.typeId].cost;
    let val=base;
    for(let i=0;i<b.level;i++)val+=Math.round(base*(0.6+i*0.3));
    refund+=val;
    game.grid[r][c]=null;
  }
  game.gold+=refund;
  game.projectiles=[];game.particles=[];
  game.selectedType=null;game.selectedCat=null;game.selectedBuilding=null;
  document.getElementById('info-popup').style.display='none';

  // Start animated transition instead of instant switch
  playSFX(SFX.ageUp,0.7);
  runTransition(game.age,newAge,refund);
}

function startWave(){
  if(game.waveActive)return;
  game.wave++;
  // Age transition now happens on boss kill (see wave complete), not here
  game.waveActive=true;
  game.waveComposition=buildWaveComposition(game.wave);
  game.waveEnemies=game.waveComposition.length;
  game.waveSpawned=0;game.spawnTimer=0;
  playSFX(SFX.waveStart,0.6);
  playAmbient(game.age);
  playEraMusic(game.age);
  updateUI();
}

function spawnEnemy(){
  let def=game.waveComposition[game.waveSpawned];
  if(!def)return;
  let hp=enemyHP(game.wave),spd=enemySpeed(game.wave);
  let isBossEnemy=!!def.boss;
  if(isBossEnemy){hp*=5;}
  spd*=def.spdMult;

  // Elite chance (10% for regular enemies)
  let isElite=!isBossEnemy&&Math.random()<0.1;
  if(isElite){hp*=2;}

  let ageIdx=Math.min(game.age,5);
  let imgs=ENEMY_IMGS[ageIdx];
  let imgId;
  if(def.imgIdx==='boss') imgId=imgs.boss;
  else imgId=imgs.regular[def.imgIdx];

  game.enemies.push({
    hp,maxHp:hp,speed:spd,pathIdx:0,
    x:0,y:0,boss:isBossEnemy,elite:isElite,
    reward:killReward(hp)*(isBossEnemy?3:isElite?2:1),
    imgId,radius:(isBossEnemy?cellSize*0.4:cellSize*0.3),
    moveType:def.moveType,armor:def.armor,name:def.name,
    slow:0,slowTimer:0,angle:0,walkCycle:Math.random()*6,sway:0,
    detected:false,detectTimer:0
  });
  game.waveSpawned++;
}

// ============= STEALTH DETECTION =============
function updateDetection(){
  // Reset detection
  for(let e of game.enemies){
    if(e.moveType!=='stealth')continue;
    if(e.detectTimer>0){e.detectTimer-=0.016;continue;} // still detected
    e.detected=false;
  }
  // Check detection towers
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    let b=game.grid[r][c];if(!b||b.cat!=='tower')continue;
    let def=TOWERS[b.typeId];
    if(!def.canDetect)continue;
    let pos=g2p(c,r),rng=towerRange(b)*cellSize;
    for(let e of game.enemies){
      if(e.moveType!=='stealth'||e.hp<=0)continue;
      if(dist(pos.x,pos.y,e.x,e.y)<=rng){
        e.detected=true;e.detectTimer=3; // visible for 3 seconds
      }
    }
  }
}

// ============= UPDATE =============
function update(dt){
  if(game.phase!=='play')return;
  dt=Math.min(dt,0.1)*game.speed;

  // Spawn
  if(game.waveActive&&game.waveSpawned<game.waveEnemies){
    game.spawnTimer-=dt;
    if(game.spawnTimer<=0){spawnEnemy();game.spawnTimer=spawnInterval(game.wave);}
  }

  // Enemies
  for(let e of game.enemies){
    if(e.hp<=0)continue;
    let spd=e.speed*(e.slow>0?0.5:1);
    e.pathIdx+=spd*dt;
    if(e.slow>0)e.slow-=dt;
    if(e.pathIdx>=path.length-1){
      e.hp=0;game.lives--;playSFX(SFX.lifeLost,0.4);
      if(game.lives<=0){gameOver();return;}
      continue;
    }
    let pos=getSmoothPos(e.pathIdx);
    e.angle=getSmoothAngle(e.pathIdx);
    e.walkCycle=(e.walkCycle||0)+spd*dt*8;
    let bob=Math.sin(e.walkCycle)*cellSize*0.04;
    let sway=Math.sin(e.walkCycle*0.5)*0.06;
    e.x=pos.x;
    e.y=pos.y+bob+(e.moveType==='air'?-cellSize*0.3:0); // air floats higher
    e.sway=sway;
    e.radius=e.boss?cellSize*0.4:cellSize*0.3;
  }

  // Detection + Radar buffs
  updateDetection();
  updateRadarBuffs();

  // Towers
  game.laserTargets.clear();
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    let b=game.grid[r][c];if(!b||b.cat!=='tower')continue;
    let def=TOWERS[b.typeId];
    let pos=g2p(c,r),rng=towerRange(b)*cellSize;
    let best=null,bestProg=-1;
    for(let e of game.enemies){
      if(e.hp<=0)continue;
      if(!canTarget(def,e))continue;
      if(dist(pos.x,pos.y,e.x,e.y)<=rng&&e.pathIdx>bestProg){best=e;bestProg=e.pathIdx;}
    }
    if(!best)continue;
    // Smooth tower rotation
    let targetAngle=Math.atan2(best.y-pos.y,best.x-pos.x);
    let da=targetAngle-(b.angle||0);
    while(da>Math.PI)da-=2*Math.PI;
    while(da<-Math.PI)da+=2*Math.PI;
    b.angle=(b.angle||0)+da*Math.min(1,dt*10);

    let dmgMult=armorMod(def,best.armor);
    // Air bonus
    if(def.bonusVs==='air'&&best.moveType==='air')dmgMult*=2.0;

    if(def.isGravity){
      // Gravity Well: continuous area slow + DPS to ALL in range
      b.laserSndTimer=(b.laserSndTimer||0)-dt;
      if(b.laserSndTimer<=0){playSFX(SFX.towerShot[b.typeId%12]||SFX.towerShot[10],0.1);b.laserSndTimer=2;}
      for(let e of game.enemies){
        if(e.hp<=0||!canTarget(def,e))continue;
        if(dist(pos.x,pos.y,e.x,e.y)<=rng){
          e.hp-=towerDmg(b)*dt;e.slow=Math.max(e.slow,def.slow);
          if(e.hp<=0){e.hp=0;game.gold+=e.reward;spawnKillFx(e);}
        }
      }
      game.laserTargets.set(b,{tx:pos.x,ty:pos.y-rng*0.3,sx:pos.x,sy:pos.y,isGravity:true,range:rng});
    } else if(def.isLaser){
      let dmg=towerDmg(b)*dt*dmgMult;
      best.hp-=dmg;
      if(def.slow>0)best.slow=Math.max(best.slow,def.slow);
      game.laserTargets.set(b,{tx:best.x,ty:best.y,sx:pos.x,sy:pos.y});
      b.laserSndTimer=(b.laserSndTimer||0)-dt;
      if(b.laserSndTimer<=0){playSFX(SFX.towerShot[b.typeId%12]||SFX.towerShot[10],0.1);b.laserSndTimer=2;}
      if(best.hp<=0){best.hp=0;game.gold+=best.reward;spawnKillFx(best);}
    } else {
      b.cooldown=(b.cooldown||0)-dt;
      if(b.cooldown<=0){
        b.cooldown=def.rate/(1+b.level*0.1);
        playSFX(SFX.towerShot[b.typeId%12]||SFX.towerShot[0],0.15);
        let angle=Math.atan2(best.y-pos.y,best.x-pos.x);
        game.projectiles.push({
          x:pos.x,y:pos.y,tx:best.x,ty:best.y,target:best,
          speed:def.pSpd*cellSize,damage:towerDmg(b)*dmgMult,splash:def.splash*cellSize,
          slow:def.slow,color:def.clr,age:def.age,angle,
          imgId:PROJ_IMGS[b.typeId],towerDef:def,
          isChain:def.isChain,chainCount:def.chainCount||0
        });
      }
    }
  }

  // Projectiles
  for(let i=game.projectiles.length-1;i>=0;i--){
    let p=game.projectiles[i];
    if(p.target&&p.target.hp>0){p.tx=p.target.x;p.ty=p.target.y;}
    let dx=p.tx-p.x,dy=p.ty-p.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d<p.speed*dt+5){
      if(p.splash>0){
        for(let e of game.enemies){if(e.hp<=0)continue;
          if(!canTarget(p.towerDef||{targets:'both'},e))continue;
          if(dist(p.tx,p.ty,e.x,e.y)<=p.splash){
            let dmg=p.damage*(1-dist(p.tx,p.ty,e.x,e.y)/p.splash*0.4);
            e.hp-=dmg;if(p.slow>0)e.slow=Math.max(e.slow,p.slow);
            if(e.hp<=0){e.hp=0;game.gold+=e.reward;spawnKillFx(e);}
          }
        }
        playSFX(SFX.splash,0.15);
      } else if(p.target&&p.target.hp>0){
        p.target.hp-=p.damage;
        if(p.slow>0)p.target.slow=Math.max(p.target.slow,p.slow);
        if(p.target.hp<=0){p.target.hp=0;game.gold+=p.target.reward;spawnKillFx(p.target);}
        // Chain lightning: jump to nearby enemies
        if(p.isChain&&p.chainCount>0){
          let chainRange=cellSize*2.5,hit=p.target;
          for(let c=0;c<p.chainCount;c++){
            let closest=null,closestD=chainRange;
            for(let e of game.enemies){
              if(e.hp<=0||e===hit)continue;
              let d=dist(hit.x,hit.y,e.x,e.y);
              if(d<closestD){closest=e;closestD=d;}
            }
            if(!closest)break;
            closest.hp-=p.damage*0.6;
            if(p.slow>0)closest.slow=Math.max(closest.slow,p.slow);
            // Chain visual
            game.particles.push({x:hit.x,y:hit.y,vx:(closest.x-hit.x)*2,vy:(closest.y-hit.y)*2,life:0.2,color:'#64B5F6',size:2});
            if(closest.hp<=0){closest.hp=0;game.gold+=closest.reward;spawnKillFx(closest);}
            hit=closest;
          }
        }
      }
      for(let k=0;k<5;k++)game.particles.push({x:p.tx,y:p.ty,vx:(Math.random()-0.5)*100,vy:(Math.random()-0.5)*100,life:0.4,color:p.color,size:3});
      game.projectiles.splice(i,1);
    } else {p.x+=dx/d*p.speed*dt;p.y+=dy/d*p.speed*dt;p.angle=Math.atan2(dy,dx);}
  }

  // Economy — only during waves
  if(game.waveActive){
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      let b=game.grid[r][c];if(!b||b.cat!=='econ')continue;
      b.timer=(b.timer||0)+dt;let prod=econProd(b);
      if(b.timer>=1){b.timer-=1;game.gold+=prod;
        let pos=g2p(c,r);game.floats.push({x:pos.x,y:pos.y-cellSize*0.3,text:'+'+Math.round(prod),life:1,color:'#FFD700'});
      }
    }
  }

  // Particles & floats
  for(let i=game.particles.length-1;i>=0;i--){let p=game.particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)game.particles.splice(i,1);}
  for(let i=game.floats.length-1;i>=0;i--){let f=game.floats[i];f.y-=30*dt;f.life-=dt;if(f.life<=0)game.floats.splice(i,1);}

  game.enemies=game.enemies.filter(e=>e.hp>0);

  // Wave complete?
  if(game.waveActive&&game.waveSpawned>=game.waveEnemies&&game.enemies.length===0){
    game.waveActive=false;game.gold+=waveBonus(game.wave);
    game.floats.push({x:W/2,y:H/2,text:'Wave '+game.wave+' Complete! +'+waveBonus(game.wave),life:2,color:'#4CAF50'});
    playSFX(SFX.waveComplete,0.6);stopAmbient();

    // Check for age transition (boss wave = age boundary)
    let nextAge=getAge(game.wave+1);
    if(nextAge>game.age){
      setTimeout(()=>{transitionAge(nextAge);},1500);
    } else {
      game.waveComposition=buildWaveComposition(game.wave+1);
      updateUI();
    }
  }

  document.getElementById('gold-val').textContent=Math.floor(game.gold);
  document.getElementById('lives-val').textContent=game.lives;
  document.getElementById('wave-val').textContent=game.wave;
}

function towerDmg(b){return TOWERS[b.typeId].dmg*(1+b.level*0.5)}
function towerRange(b){
  let base=TOWERS[b.typeId].range*(1+b.level*0.1);
  // Radar Station buff: check if a radar tower is adjacent
  if(b._radarBuff) base*=(1+b._radarBuff);
  return base;
}
// Update radar buffs periodically
function updateRadarBuffs(){
  // Clear all buffs first
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){let b=game.grid[r][c];if(b)b._radarBuff=0;}
  // Apply radar buffs
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    let b=game.grid[r][c];if(!b||b.cat!=='tower')continue;
    let def=TOWERS[b.typeId];if(!def.isRadar)continue;
    let buff=def.radarBuff*(1+b.level*0.05);
    // Buff all towers within 3 cells
    for(let dr=-3;dr<=3;dr++)for(let dc=-3;dc<=3;dc++){
      let nr=r+dr,nc=c+dc;
      if(nr<0||nr>=ROWS||nc<0||nc>=COLS)continue;
      let nb=game.grid[nr][nc];if(!nb||nb===b||nb.cat!=='tower')continue;
      nb._radarBuff=Math.max(nb._radarBuff||0,buff);
    }
  }
}
function econProd(b){return ECONS[b.typeId].prod*(1+b.level*0.6)}
function upgradeCost(b){let base=b.cat==='tower'?TOWERS[b.typeId].cost:ECONS[b.typeId].cost;return Math.round(base*(0.6+b.level*0.3));}
function sellValue(b){let base=b.cat==='tower'?TOWERS[b.typeId].cost:ECONS[b.typeId].cost;let spent=base;for(let i=0;i<b.level;i++)spent+=Math.round(base*(0.6+i*0.3));return Math.round(spent*0.6);}

function spawnKillFx(e){
  for(let i=0;i<8;i++)game.particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*150,vy:(Math.random()-0.5)*150,life:0.5,color:'#FFD700',size:4});
  game.floats.push({x:e.x,y:e.y-10,text:'+'+e.reward,life:1,color:'#FFD700'});
  playSFX(e.boss?SFX.bossKill:SFX.kill,0.3);
}

function gameOver(){
  game.phase='over';stopAmbient();stopEraMusic();playSFX(SFX.gameOver,0.7);
  document.getElementById('overlay').style.display='flex';
  document.getElementById('overlay').innerHTML='<h1>GAME OVER</h1><h2>You reached Wave '+game.wave+' \u2014 '+AGES[game.age].name+'</h2><button onclick="restartGame()">PLAY AGAIN</button>';
}

function announceAge(){
  let el=document.getElementById('age-announce');
  document.getElementById('age-announce-text').textContent=AGES[game.age].name.toUpperCase();
  el.style.display='flex';
  document.getElementById('age-label').textContent=AGES[game.age].name;
  setTimeout(()=>el.style.display='none',2200);
  mapCacheCellSize=-1;
  updateBuildCards();
}

// ============= RENDER =============
function drawImageCentered(img,x,y,size,angle){
  ctx.save();ctx.translate(x,y);
  if(angle!==undefined&&angle!==0)ctx.rotate(angle);
  ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();
}

function render(){
  let age=AGES[game.age];
  ctx.fillStyle=age.bg;ctx.fillRect(0,0,W,H);

  // Map tiles
  if(mapCacheAge!==game.age||mapCacheCellSize!==cellSize)buildMapCache();
  if(mapCache)ctx.drawImage(mapCache,offX,offY);

  // Path arrows (before wave)
  if(!game.waveActive&&smoothPath.length>1){
    let t=Date.now()*0.001,spacing=cellSize*1.2,totalLen=0;
    for(let i=1;i<smoothPath.length;i++){let dx=smoothPath[i].x-smoothPath[i-1].x,dy=smoothPath[i].y-smoothPath[i-1].y;totalLen+=Math.sqrt(dx*dx+dy*dy);}
    let arrowCount=Math.floor(totalLen/spacing),animOffset=(t%1)*spacing;
    ctx.globalAlpha=0.4;
    for(let a=0;a<arrowCount;a++){
      let targetDist=a*spacing+animOffset,cumDist=0,px=smoothPath[0].x,py=smoothPath[0].y,ang=0;
      for(let i=1;i<smoothPath.length;i++){
        let dx=smoothPath[i].x-smoothPath[i-1].x,dy=smoothPath[i].y-smoothPath[i-1].y,segLen=Math.sqrt(dx*dx+dy*dy);
        if(cumDist+segLen>=targetDist){let frac=(targetDist-cumDist)/segLen;px=smoothPath[i-1].x+dx*frac;py=smoothPath[i-1].y+dy*frac;ang=Math.atan2(dy,dx);break;}
        cumDist+=segLen;
      }
      let sz=cellSize*0.15;
      ctx.save();ctx.translate(px,py);ctx.rotate(ang);ctx.fillStyle='#fff';
      ctx.beginPath();ctx.moveTo(sz,0);ctx.lineTo(-sz*0.6,-sz*0.5);ctx.lineTo(-sz*0.3,0);ctx.lineTo(-sz*0.6,sz*0.5);ctx.closePath();ctx.fill();ctx.restore();
    }
    ctx.globalAlpha=1;
  }

  // Placement preview
  if(game.selectedType!==null&&game.hoverCell){
    let hc=game.hoverCell,x=offX+hc.x*cellSize,y=offY+hc.y*cellSize,valid=canPlace(hc.x,hc.y);
    ctx.fillStyle=valid?'rgba(0,255,0,0.2)':'rgba(255,0,0,0.2)';ctx.fillRect(x,y,cellSize,cellSize);
    if(valid&&game.selectedCat==='tower'){
      let def=TOWERS[game.selectedType],pos=g2p(hc.x,hc.y);
      ctx.beginPath();ctx.arc(pos.x,pos.y,def.range*cellSize,0,Math.PI*2);
      ctx.strokeStyle=def.targets==='ground'?'rgba(0,255,0,0.2)':def.targets==='both'?'rgba(255,255,255,0.2)':'rgba(100,150,255,0.2)';
      ctx.lineWidth=1;ctx.stroke();
      // Detection range
      if(def.canDetect){
        ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(100,150,255,0.3)';
        ctx.beginPath();ctx.arc(pos.x,pos.y,def.range*cellSize*0.8,0,Math.PI*2);ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  // Buildings
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    let b=game.grid[r][c];if(!b)continue;
    let pos=g2p(c,r),sz=cellSize*0.85;
    if(b.cat==='tower'){
      let img=IMAGES[TOWER_IMGS[b.typeId]];
      if(img)drawImageCentered(img,pos.x,pos.y,sz,b.angle||0);
      else{let s=cellSize*0.35;ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(b.angle||0);ctx.fillStyle=TOWERS[b.typeId].clr;ctx.beginPath();ctx.moveTo(s,0);ctx.lineTo(-s,-s*0.7);ctx.lineTo(-s,s*0.7);ctx.closePath();ctx.fill();ctx.restore();}
    } else {
      let img=IMAGES[ECON_IMGS[b.typeId]];
      if(img)drawImageCentered(img,pos.x,pos.y,sz,0);
      else{ctx.fillStyle=ECONS[b.typeId].clr;ctx.beginPath();ctx.arc(pos.x,pos.y,cellSize*0.35,0,Math.PI*2);ctx.fill();}
    }
    if(b.level>0){let ds=cellSize*0.06,sx=pos.x-(b.level-1)*ds*1.8/2;for(let i=0;i<b.level;i++){ctx.fillStyle='#FFD700';ctx.shadowColor='#FFD700';ctx.shadowBlur=4;ctx.beginPath();ctx.arc(sx+i*ds*1.8,pos.y-sz/2-ds*1.5,ds,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;}
  }

  // Selected building range
  if(game.selectedBuilding&&game.selectedBuilding.cat==='tower'){
    let sb=game.selectedBuilding,pos=g2p(sb.col,sb.row);
    ctx.beginPath();ctx.arc(pos.x,pos.y,towerRange(sb)*cellSize,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;ctx.stroke();
  }

  // Air enemy shadows
  for(let e of game.enemies){
    if(e.hp<=0||e.moveType!=='air')continue;
    let shadowPos=getSmoothPos(e.pathIdx);
    ctx.globalAlpha=0.2;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(shadowPos.x,shadowPos.y+cellSize*0.1,cellSize*0.25,cellSize*0.12,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }

  // Enemies
  for(let e of game.enemies){
    if(e.hp<=0)continue;
    let img=IMAGES[e.imgId];
    let sz=e.boss?cellSize*0.9:cellSize*0.65;

    // Stealth rendering
    if(e.moveType==='stealth'&&!e.detected){
      ctx.globalAlpha=0.2+Math.sin(Date.now()*0.008)*0.1; // shimmer
    }

    if(img)drawImageCentered(img,e.x,e.y,sz,e.angle+(e.sway||0));
    else{ctx.fillStyle='#c4a46c';ctx.beginPath();ctx.arc(e.x,e.y,e.radius,0,Math.PI*2);ctx.fill();}

    ctx.globalAlpha=1;

    // HP bar
    let bw=sz*0.8,bh=3,bx=e.x-bw/2,by=e.y-sz/2-6;
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(bx-1,by-1,bw+2,bh+2);
    let hpPct=e.hp/e.maxHp;
    ctx.fillStyle=hpPct>0.5?'#4CAF50':hpPct>0.25?'#FF9800':'#f44336';
    ctx.fillRect(bx,by,bw*hpPct,bh);

    // Armor indicator (heavy = gold border on HP bar)
    if(e.armor==='heavy'){ctx.strokeStyle='#FFD700';ctx.lineWidth=1;ctx.strokeRect(bx-1,by-1,bw+2,bh+2);}

    // Type badge
    let badgeY=by-8;
    ctx.font='bold '+Math.max(8,cellSize*0.16)+'px sans-serif';ctx.textAlign='center';
    if(e.moveType==='air'){ctx.fillStyle='#64B5F6';ctx.fillText('\u2708',e.x,badgeY);} // plane icon
    else if(e.moveType==='stealth'&&e.detected){ctx.fillStyle='#FF9800';ctx.fillText('!',e.x,badgeY);}

    // Elite glow
    if(e.elite){
      ctx.strokeStyle='#FFD700';ctx.lineWidth=2;ctx.globalAlpha=0.5+Math.sin(Date.now()*0.006)*0.3;
      ctx.beginPath();ctx.arc(e.x,e.y,sz/2+3,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }
    // Boss glow
    if(e.boss){
      ctx.strokeStyle='#FF4444';ctx.lineWidth=2;ctx.globalAlpha=0.4+Math.sin(Date.now()*0.005)*0.2;
      ctx.beginPath();ctx.arc(e.x,e.y,sz/2+4,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }
  }

  // Laser beams + Gravity wells
  for(let [b,t] of game.laserTargets){
    if(t.isGravity){
      // Gravity well: swirling purple vortex
      let time=Date.now()*0.003;
      ctx.globalAlpha=0.2;
      ctx.fillStyle='#4B0082';
      ctx.beginPath();ctx.arc(t.sx,t.sy,t.range,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.4;
      for(let i=0;i<3;i++){
        let r=t.range*(0.3+i*0.25);
        ctx.strokeStyle=i%2?'rgba(138,43,226,0.4)':'rgba(75,0,130,0.5)';
        ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(t.sx,t.sy,r,time+i*2,time+i*2+Math.PI*1.2);ctx.stroke();
      }
      ctx.globalAlpha=1;
    } else {
      let gr=ctx.createLinearGradient(t.sx,t.sy,t.tx,t.ty);
      gr.addColorStop(0,'rgba(0,206,209,0.8)');gr.addColorStop(1,'rgba(0,255,255,0.4)');
      ctx.strokeStyle=gr;ctx.lineWidth=3+Math.random()*2;ctx.globalAlpha=0.7+Math.random()*0.3;
      ctx.beginPath();ctx.moveTo(t.sx,t.sy);ctx.lineTo(t.tx,t.ty);ctx.stroke();
      ctx.strokeStyle='rgba(0,255,255,0.15)';ctx.lineWidth=10;
      ctx.beginPath();ctx.moveTo(t.sx,t.sy);ctx.lineTo(t.tx,t.ty);ctx.stroke();ctx.globalAlpha=1;
    }
  }

  // Projectiles
  for(let p of game.projectiles){
    let img=p.imgId?IMAGES[p.imgId]:null;
    let sz=p.splash>0?cellSize*0.35:cellSize*0.25;
    if(img)drawImageCentered(img,p.x,p.y,sz,p.angle||0);
    else{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.splash>0?4:3,0,Math.PI*2);ctx.fill();}
  }

  // Particles
  for(let p of game.particles){ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);}
  ctx.globalAlpha=1;

  // Floating text
  ctx.textAlign='center';ctx.font='bold '+Math.max(12,cellSize*0.3)+'px sans-serif';
  for(let f of game.floats){ctx.globalAlpha=Math.min(1,f.life*2);ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=3;ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);}
  ctx.globalAlpha=1;
}

// ============= INPUT =============
function canPlace(gx,gy){return gx>=0&&gx<COLS&&gy>=0&&gy<ROWS&&!pathSet.has(gx+','+gy)&&!game.grid[gy][gx];}

function handleClick(px,py){
  if(game.phase!=='play')return;
  let g=p2g(px,py),popup=document.getElementById('info-popup');
  if(g.x>=0&&g.x<COLS&&g.y>=0&&g.y<ROWS&&game.grid[g.y][g.x]){
    let b=game.grid[g.y][g.x];b.row=g.y;b.col=g.x;
    game.selectedBuilding=b;game.selectedType=null;
    showInfoPopup(b,px,py);updateBuildCards();return;
  }
  if(game.selectedType!==null&&canPlace(g.x,g.y)){
    let cat=game.selectedCat,def=cat==='tower'?TOWERS[game.selectedType]:ECONS[game.selectedType];
    if(game.gold>=def.cost){game.gold-=def.cost;game.grid[g.y][g.x]={cat,typeId:game.selectedType,level:0,cooldown:0,timer:0,angle:0};playSFX(SFX.place);updateUI();}
    return;
  }
  game.selectedType=null;game.selectedBuilding=null;popup.style.display='none';updateBuildCards();
}

function showInfoPopup(b,px,py){
  let popup=document.getElementById('info-popup');
  let def=b.cat==='tower'?TOWERS[b.typeId]:ECONS[b.typeId];
  let imgNum=b.cat==='tower'?TOWER_IMGS[b.typeId]:ECON_IMGS[b.typeId];
  let imgTag=IMAGES[imgNum]?'<img src="Assets/'+imgNum+'.png">':'';
  document.getElementById('info-name').innerHTML=imgTag+def.name+' Lv'+(b.level+1);
  let stats='';
  if(b.cat==='tower'){
    stats='<div class="stat"><span>Damage</span><span>'+Math.round(towerDmg(b))+'</span></div>';
    stats+='<div class="stat"><span>Range</span><span>'+towerRange(b).toFixed(1)+'</span></div>';
    if(def.isLaser)stats+='<div class="stat"><span>Type</span><span>Beam (DPS)</span></div>';
    if(def.splash>0)stats+='<div class="stat"><span>Splash</span><span>'+def.splash.toFixed(1)+'</span></div>';
    let targetLabel=def.targets==='both'?'Air + Ground':def.targets==='ground'?'Ground only':'Air only';
    stats+='<div class="stat"><span>Targets</span><span>'+targetLabel+'</span></div>';
    if(def.canDetect)stats+='<div class="stat" style="color:#64B5F6"><span>Detects stealth</span><span>\u2713</span></div>';
    if(def.slow>0)stats+='<div class="stat" style="color:#81D4FA"><span>Slows</span><span>'+Math.round(def.slow*100)+'%</span></div>';
    stats+='<div style="margin-top:4px;font-size:11px;opacity:0.7;font-style:italic">'+def.desc+'</div>';
    stats+='<div style="margin-top:2px;font-size:11px;color:#4CAF50">Strong vs: '+def.strong+'</div>';
  } else {
    stats='<div class="stat"><span>Production</span><span>'+econProd(b).toFixed(1)+'/s</span></div>';
    stats+='<div style="margin-top:2px;font-size:10px;color:#FF9800;font-style:italic">Only active during waves</div>';
    stats+='<div style="margin-top:4px;font-size:11px;opacity:0.7;font-style:italic">'+def.desc+'</div>';
  }
  document.getElementById('info-stats').innerHTML=stats;
  let ubtn=document.getElementById('upgrade-btn'),sbtn=document.getElementById('sell-btn');
  if(b.level>=3){ubtn.textContent='MAX';ubtn.disabled=true;}
  else{let uc=upgradeCost(b);ubtn.textContent='Upgrade ('+uc+')';ubtn.disabled=game.gold<uc;}
  sbtn.textContent='Sell ('+sellValue(b)+')';
  ubtn.onclick=()=>{if(b.level<3&&game.gold>=upgradeCost(b)){game.gold-=upgradeCost(b);b.level++;playSFX(SFX.upgrade);showInfoPopup(b,px,py);updateUI();}};
  sbtn.onclick=()=>{game.gold+=sellValue(b);game.grid[b.row][b.col]=null;popup.style.display='none';game.selectedBuilding=null;playSFX(SFX.sell);updateUI();};
  popup.style.display='block';
  popup.style.left=Math.min(px,W-200)+'px';
  popup.style.top=Math.max(50,Math.min(py-180,H-320))+'px';
}

// ============= TOOLTIPS =============
function buildTooltipData(tab,idx){
  if(tab==='tower'){
    let d=TOWERS[idx];
    let dps=d.isLaser?d.dmg.toFixed(0):(d.dmg/(d.rate||1)).toFixed(1);
    let targetLabel=d.targets==='both'?'\u2708 Air + Ground':d.targets==='ground'?'Ground only':'Air only';
    return{name:d.name,cost:d.cost,lines:[
      'Damage: '+d.dmg+(d.isLaser?' /sec':''),
      'Range: '+d.range.toFixed(1),
      d.isLaser?'Type: Continuous beam':'Fire rate: '+(1/(d.rate||1)).toFixed(1)+'/sec',
      d.splash>0?'Splash: '+d.splash.toFixed(1)+' radius':null,
      'DPS: ~'+dps,
      'Targets: '+targetLabel,
      d.canDetect?'Detects stealth \u2713':null,
      d.slow>0?'Slows: '+Math.round(d.slow*100)+'%':null,
      '',d.desc,'Strong vs: '+d.strong
    ].filter(Boolean)};
  } else {
    let d=ECONS[idx];
    return{name:d.name,cost:d.cost,lines:['Production: '+d.prod.toFixed(1)+' gold/sec','Only active during waves','',d.desc]};
  }
}
function showTooltip(ev,data){
  let tip=document.getElementById('tooltip');if(!tip)return;
  let html='<b>'+data.name+'</b> <span style="color:#FFD700">\uD83D\uDCB0'+data.cost+'</span><br>';
  html+=data.lines.map(l=>{
    if(l==='')return'<div style="height:4px"></div>';
    if(l.startsWith('Strong vs:'))return'<div style="color:#4CAF50;margin-top:2px">'+l+'</div>';
    if(l.startsWith('Only active'))return'<div style="color:#FF9800;font-style:italic">'+l+'</div>';
    if(l.includes('stealth'))return'<div style="color:#64B5F6">'+l+'</div>';
    if(l.startsWith('Targets:'))return'<div style="color:#90CAF9">'+l+'</div>';
    return'<div style="opacity:0.8">'+l+'</div>';
  }).join('');
  tip.innerHTML=html;tip.style.display='block';
  let rect=ev.target.closest('.card').getBoundingClientRect(),tipW=200;
  tip.style.left=Math.max(4,Math.min(rect.left+rect.width/2-tipW/2,W-tipW-4))+'px';
  tip.style.bottom=(H-rect.top+6)+'px';tip.style.top='auto';
}
function hideTooltip(){let tip=document.getElementById('tooltip');if(tip)tip.style.display='none';}

// ============= UI =============
function updateBuildCards(){
  let container=document.getElementById('build-cards');container.innerHTML='';
  let items=game.tab==='tower'?TOWERS:ECONS;
  let imgMap=game.tab==='tower'?TOWER_IMGS:ECON_IMGS;
  items.forEach((def,i)=>{
    if(def.age>game.age)return;
    let card=document.createElement('div');card.className='card';
    if(game.selectedCat===game.tab&&game.selectedType===i)card.className+=' selected';
    let imgNum=imgMap[i];
    let iconHTML=IMAGES[imgNum]?'<img src="Assets/'+imgNum+'.png">':'<span style="font-size:22px">\u2699</span>';
    // Add targeting badge
    let badge='';
    if(game.tab==='tower'){
      if(def.targets==='both')badge='<div style="font-size:8px;color:#90CAF9">Air+Gnd</div>';
      else if(def.canDetect)badge='<div style="font-size:8px;color:#64B5F6">Detect</div>';
    }
    card.innerHTML='<div class="card-icon">'+iconHTML+'</div><div class="card-name">'+def.name+'</div>'+badge+'<div class="card-cost">\uD83D\uDCB0 '+def.cost+'</div>';
    let tipData=buildTooltipData(game.tab,i);
    card.onmouseenter=(ev)=>showTooltip(ev,tipData);card.onmouseleave=hideTooltip;
    card.onclick=(e)=>{e.stopPropagation();
      if(game.selectedCat===game.tab&&game.selectedType===i){game.selectedType=null;game.selectedCat=null;}
      else{game.selectedType=i;game.selectedCat=game.tab;}
      game.selectedBuilding=null;document.getElementById('info-popup').style.display='none';updateBuildCards();
    };
    container.appendChild(card);
  });
}

function updateWavePreview(){
  let wp=document.getElementById('wave-preview');
  if(!wp)return;
  if(game.waveActive){wp.style.display='none';return;}
  let nextWave=game.wave+1;
  let comp=buildWaveComposition(nextWave);
  // Count by name
  let counts={};
  for(let d of comp){
    let key=d.name+(d.moveType!=='ground'?' ('+d.moveType.charAt(0).toUpperCase()+d.moveType.slice(1)+')':'');
    counts[key]=(counts[key]||0)+1;
  }
  let html='<span style="color:#aaa;font-size:10px">Next:</span> ';
  for(let [name,count] of Object.entries(counts)){
    let color='#fff';
    if(name.includes('Air'))color='#64B5F6';
    if(name.includes('Stealth'))color='#FF9800';
    html+='<span style="color:'+color+';margin-right:6px">'+name+' x'+count+'</span>';
  }
  wp.innerHTML=html;wp.style.display='block';
}

function updateUI(){
  document.getElementById('gold-val').textContent=Math.floor(game.gold);
  document.getElementById('lives-val').textContent=game.lives;
  document.getElementById('wave-val').textContent=game.wave;
  let wb=document.getElementById('wave-btn');
  wb.disabled=game.waveActive;
  wb.textContent=game.waveActive?'Wave in progress...':'Start Wave '+(game.wave+1);
  updateBuildCards();
  updateWavePreview();
}

// ============= INIT =============
function startGame(){
  game={gold:200,lives:20,wave:0,age:0,phase:'play',speed:1,
    selectedType:null,selectedCat:null,selectedBuilding:null,tab:'tower',
    grid:Array.from({length:ROWS},()=>Array(COLS).fill(null)),
    enemies:[],projectiles:[],particles:[],floats:[],
    waveEnemies:0,waveSpawned:0,spawnTimer:0,waveActive:false,
    laserTargets:new Map(),hoverCell:null,waveComposition:[]};
  computePath();computeSmoothPath();
  document.getElementById('overlay').style.display='none';
  document.getElementById('hud').style.display='flex';
  document.getElementById('age-label').style.display='block';
  document.getElementById('age-label').textContent=AGES[0].name;
  document.getElementById('build-bar').style.display='block';
  mapCacheCellSize=-1;
  game.waveComposition=buildWaveComposition(1);
  resize();updateUI();
}

function restartGame(){startGame();playEraMusic(0);}

let lastTime=0;
function loop(ts){
  if(!lastTime)lastTime=ts; // prevent huge dt on first frame
  let dt=Math.min((ts-lastTime)/1000,0.1);lastTime=ts;
  try{
    if(transition.active){renderTransition();}
    else{update(dt);render();}
  }catch(e){console.error('Loop error:',e);}
  requestAnimationFrame(loop);
}

window.onload=async function(){
  canvas=document.getElementById('c');ctx=canvas.getContext('2d');
  computePath();resize();computeSmoothPath();

  await preloadAssets();
  loadAudio();
  document.getElementById('loading').style.display='none';
  document.getElementById('overlay').style.display='flex';

  window.addEventListener('resize',()=>{resize();mapCacheCellSize=-1;});
  document.getElementById('start-btn').onclick=()=>{startGame();playEraMusic(0);};

  document.querySelectorAll('#build-tabs button').forEach(btn=>{
    btn.onclick=()=>{document.querySelectorAll('#build-tabs button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');game.tab=btn.dataset.tab;game.selectedType=null;game.selectedCat=null;updateBuildCards();};
  });

  document.getElementById('wave-btn').onclick=startWave;
  document.getElementById('speed-btn').onclick=()=>{game.speed=game.speed>=3?1:game.speed+1;document.getElementById('speed-btn').textContent=game.speed+'x';};
  document.getElementById('mute-btn').onclick=()=>{allMuted=!allMuted;updateAllVolumes();document.getElementById('mute-btn').textContent=allMuted?'Sound OFF':'Sound ON';};

  canvas.addEventListener('click',(e)=>handleClick(e.clientX,e.clientY));
  canvas.addEventListener('mousemove',(e)=>{game.hoverCell=p2g(e.clientX,e.clientY);});
  canvas.addEventListener('mouseleave',()=>{game.hoverCell=null;});
  canvas.addEventListener('touchstart',(e)=>{e.preventDefault();let t=e.touches[0];game.hoverCell=p2g(t.clientX,t.clientY);handleClick(t.clientX,t.clientY);},{passive:false});

  document.addEventListener('click',(e)=>{if(!e.target.closest('#info-popup')&&!e.target.closest('canvas')){document.getElementById('info-popup').style.display='none';game.selectedBuilding=null;}});

  requestAnimationFrame(loop);
};
