// ============= AGES OF DEFENSE — Full Asset Integration =============

// ============= GRID & LAYOUT =============
const COLS=14,ROWS=9;
const WAYPOINTS=[[-1,1],[11,1],[11,3],[2,3],[2,5],[11,5],[11,7],[COLS,7]];

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
// Tile images per age: { grass: N, path: N }
const AGE_TILES=[
  {grass:1,path:2},{grass:3,path:4},{grass:5,path:6},
  {grass:7,path:8},{grass:9,path:10},{grass:11,path:12}
];

// Tower image numbers (index matches TOWERS array)
const TOWER_IMGS=[13,14,15,16,17,18,19,20,21,22,23,24];

// Economy image numbers (index matches ECONS array)
const ECON_IMGS=[25,26,27,28,29,30];

// Enemy images per age: { regular: [img1, img2], boss: img }
const ENEMY_IMGS=[
  {regular:[31,32],boss:33}, // Stone Age: Wolf, Caveman, Mammoth
  {regular:[34,35],boss:36}, // Bronze Age: Warrior, Chariot, War Elephant
  {regular:[37,38],boss:39}, // Medieval: Knight, Siege Ram, Dragon
  {regular:[40,41],boss:42}, // Industrial: Infantry, Armored Car, Tank
  {regular:[43,44],boss:45}, // Modern: Soldier, APC, Helicopter
  {regular:[46,47],boss:48}  // Future: Drone, Android, Mech
];

// Projectile image per tower (index matches TOWERS array, null = beam/no projectile)
const PROJ_IMGS=[49,49,50,50,50,51,52,53,54,55,null,56];

// ============= TOWERS =============
const TOWERS=[
  {name:'Rock Thrower',cost:30,dmg:15,range:2.5,rate:1.2,pSpd:5,splash:0,age:0,clr:'#8B7355'},
  {name:'Spike Trap',cost:20,dmg:10,range:1.5,rate:0.5,pSpd:8,splash:0,age:0,clr:'#556B2F'},
  {name:'Archer',cost:60,dmg:22,range:3.5,rate:0.8,pSpd:8,splash:0,age:1,clr:'#CD853F'},
  {name:'Spear Thrower',cost:80,dmg:40,range:2.8,rate:1.4,pSpd:6,splash:0,age:1,clr:'#B8860B'},
  {name:'Crossbow',cost:120,dmg:45,range:3.8,rate:0.65,pSpd:10,splash:0,age:2,clr:'#808080'},
  {name:'Catapult',cost:160,dmg:65,range:3.5,rate:2.0,pSpd:4,splash:1.5,age:2,clr:'#8B4513'},
  {name:'Cannon',cost:250,dmg:100,range:3.2,rate:2.2,pSpd:6,splash:1.8,age:3,clr:'#4A4A4A'},
  {name:'Gatling',cost:300,dmg:18,range:3.0,rate:0.15,pSpd:12,splash:0,age:3,clr:'#556B2F'},
  {name:'Missile',cost:500,dmg:200,range:5.0,rate:2.8,pSpd:7,splash:2.0,age:4,clr:'#2F4F4F'},
  {name:'Sniper',cost:600,dmg:400,range:6.0,rate:3.0,pSpd:25,splash:0,age:4,clr:'#1C1C1C'},
  {name:'Laser',cost:1000,dmg:100,range:4.5,rate:0,pSpd:0,splash:0,age:5,clr:'#00CED1',isLaser:true},
  {name:'Plasma',cost:1500,dmg:500,range:4.0,rate:2.0,pSpd:8,splash:2.5,age:5,clr:'#9400D3'}
];

const ECONS=[
  {name:'Hut',cost:50,prod:0.5,age:0,clr:'#8B7355'},
  {name:'Farm',cost:120,prod:1.5,age:1,clr:'#DAA520'},
  {name:'Market',cost:300,prod:4,age:2,clr:'#B22222'},
  {name:'Factory',cost:700,prod:10,age:3,clr:'#708090'},
  {name:'Corp',cost:1500,prod:25,age:4,clr:'#4169E1'},
  {name:'Quantum Forge',cost:3500,prod:65,age:5,clr:'#00FFFF'}
];

// ============= IMAGE LOADING =============
const IMAGES={};
let imagesLoaded=false;

function preloadAssets(){
  return new Promise(resolve=>{
    let total=56,loaded=0;
    const fill=document.getElementById('load-fill');
    for(let i=1;i<=56;i++){
      const img=new Image();
      img.onload=img.onerror=()=>{
        if(img.complete&&img.naturalWidth>0) IMAGES[i]=img;
        loaded++;
        if(fill) fill.style.width=Math.round(loaded/total*100)+'%';
        if(loaded>=total){imagesLoaded=true;resolve();}
      };
      img.src='Assets/'+i+'.png';
    }
  });
}

// ============= STATE =============
let canvas,ctx,W,H,cellSize,offX,offY;
let path=[],pathSet=new Set();
let mapCache=null,mapCacheAge=-1,mapCacheCellSize=-1;

let game={
  gold:200,lives:20,wave:0,age:0,phase:'title',speed:1,
  selectedType:null,selectedCat:null,tab:'tower',
  grid:Array.from({length:ROWS},()=>Array(COLS).fill(null)),
  enemies:[],projectiles:[],particles:[],floats:[],
  waveEnemies:0,waveSpawned:0,spawnTimer:0,waveActive:false,
  laserTargets:new Map(),hoverCell:null,selectedBuilding:null
};

// ============= PATH =============
function computePath(){
  path=[];
  for(let i=0;i<WAYPOINTS.length-1;i++){
    let [x1,y1]=WAYPOINTS[i],[x2,y2]=WAYPOINTS[i+1];
    let dx=Math.sign(x2-x1),dy=Math.sign(y2-y1),x=x1,y=y1;
    while(x!==x2||y!==y2){
      if(x>=0&&x<COLS&&y>=0&&y<ROWS) path.push({x,y});
      if(x!==x2)x+=dx; else y+=dy;
    }
  }
  let [lx,ly]=WAYPOINTS[WAYPOINTS.length-1];
  if(lx>=0&&lx<COLS&&ly>=0&&ly<ROWS) path.push({x:lx,y:ly});
  pathSet=new Set(path.map(p=>p.x+','+p.y));
}

function g2p(gx,gy){return{x:offX+gx*cellSize+cellSize/2,y:offY+gy*cellSize+cellSize/2}}
function p2g(px,py){return{x:Math.floor((px-offX)/cellSize),y:Math.floor((py-offY)/cellSize)}}
function dist(x1,y1,x2,y2){return Math.sqrt((x2-x1)**2+(y2-y1)**2)}

// ============= MAP CACHE =============
function buildMapCache(){
  let mc=document.createElement('canvas');
  mc.width=COLS*cellSize;mc.height=ROWS*cellSize;
  let mctx=mc.getContext('2d');
  let tiles=AGE_TILES[game.age];
  let age=AGES[game.age];

  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      let x=c*cellSize,y=r*cellSize;
      let onPath=pathSet.has(c+','+r);
      let imgId=onPath?tiles.path:tiles.grass;
      let img=IMAGES[imgId];
      if(img){
        mctx.drawImage(img,x,y,cellSize,cellSize);
      } else {
        mctx.fillStyle=onPath?age.path:age.color;
        mctx.fillRect(x,y,cellSize,cellSize);
      }
      // Subtle grid lines
      mctx.strokeStyle='rgba(0,0,0,0.1)';
      mctx.strokeRect(x,y,cellSize,cellSize);
    }
  }
  mapCache=mc;
  mapCacheAge=game.age;
  mapCacheCellSize=cellSize;
}

// ============= RESIZE =============
function resize(){
  let dpr=window.devicePixelRatio||1;
  W=window.innerWidth;H=window.innerHeight;
  canvas.width=W*dpr;canvas.height=H*dpr;
  canvas.style.width=W+'px';canvas.style.height=H+'px';
  ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  let hudH=44,barH=game.phase==='title'?0:130;
  let aW=W,aH=H-hudH-barH;
  cellSize=Math.min(aW/COLS,aH/ROWS);
  offX=(aW-cellSize*COLS)/2;
  offY=hudH+(aH-cellSize*ROWS)/2;
  mapCacheCellSize=-1; // invalidate cache
}

// ============= WAVE SYSTEM =============
function getAge(wave){
  if(wave<=5)return 0;if(wave<=10)return 1;if(wave<=15)return 2;
  if(wave<=20)return 3;if(wave<=25)return 4;return 5;
}
function enemyHP(wave){return Math.round(30*Math.pow(1.15,wave))}
function enemySpeed(wave){return 1.2+wave*0.02}
function enemyCount(wave){return Math.min(5+wave*2,50)}
function spawnInterval(wave){return Math.max(0.3,1.5-wave*0.04)}
function isBoss(wave){return wave%5===0}
function killReward(hp){return Math.max(1,Math.ceil(hp*0.08))}
function waveBonus(wave){return 25+wave*15}

function startWave(){
  if(game.waveActive)return;
  game.wave++;
  let newAge=getAge(game.wave);
  if(newAge>game.age){game.age=newAge;announceAge();}
  game.waveActive=true;
  game.waveEnemies=enemyCount(game.wave);
  if(isBoss(game.wave))game.waveEnemies++;
  game.waveSpawned=0;game.spawnTimer=0;
  updateUI();
}

function spawnEnemy(){
  let hp=enemyHP(game.wave),spd=enemySpeed(game.wave);
  let boss=isBoss(game.wave)&&game.waveSpawned===game.waveEnemies-1;
  if(boss){hp*=5;spd*=0.6;}

  // Pick enemy image based on age
  let ageIdx=Math.min(game.age,5);
  let imgs=ENEMY_IMGS[ageIdx];
  let imgId;
  if(boss){
    imgId=imgs.boss;
  } else {
    imgId=imgs.regular[game.waveSpawned%imgs.regular.length];
  }

  game.enemies.push({
    hp,maxHp:hp,speed:spd,pathIdx:0,
    x:0,y:0,boss,reward:killReward(hp)*(boss?3:1),
    imgId,radius:boss?cellSize*0.4:cellSize*0.3,
    slow:0,slowTimer:0,angle:0
  });
  game.waveSpawned++;
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
      e.hp=0;game.lives--;
      if(game.lives<=0){gameOver();return;}
      continue;
    }
    let idx=Math.floor(e.pathIdx),frac=e.pathIdx-idx;
    let p1=path[idx],p2=path[Math.min(idx+1,path.length-1)];
    let a=g2p(p1.x,p1.y),b=g2p(p2.x,p2.y);
    e.x=a.x+(b.x-a.x)*frac;e.y=a.y+(b.y-a.y)*frac;
    // Track movement angle for rotation
    e.angle=Math.atan2(b.y-a.y,b.x-a.x);
    // Update radius based on cellSize (for boss scaling after resize)
    e.radius=e.boss?cellSize*0.4:cellSize*0.3;
  }

  // Towers
  game.laserTargets.clear();
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    let b=game.grid[r][c];if(!b||b.cat!=='tower')continue;
    let def=TOWERS[b.typeId];
    let pos=g2p(c,r),rng=towerRange(b)*cellSize;
    // Find target (furthest along path in range)
    let best=null,bestProg=-1;
    for(let e of game.enemies){
      if(e.hp<=0)continue;
      if(dist(pos.x,pos.y,e.x,e.y)<=rng&&e.pathIdx>bestProg){best=e;bestProg=e.pathIdx;}
    }
    if(!best)continue;
    b.angle=Math.atan2(best.y-pos.y,best.x-pos.x);
    if(def.isLaser){
      let dmg=towerDmg(b)*dt;
      best.hp-=dmg;
      game.laserTargets.set(b,{tx:best.x,ty:best.y,sx:pos.x,sy:pos.y});
      if(best.hp<=0){best.hp=0;game.gold+=best.reward;spawnKillFx(best);}
    } else {
      b.cooldown=(b.cooldown||0)-dt;
      if(b.cooldown<=0){
        b.cooldown=def.rate/(1+b.level*0.1);
        let angle=Math.atan2(best.y-pos.y,best.x-pos.x);
        game.projectiles.push({
          x:pos.x,y:pos.y,tx:best.x,ty:best.y,target:best,
          speed:def.pSpd*cellSize,damage:towerDmg(b),splash:def.splash*cellSize,
          color:def.clr,age:def.age,angle,
          imgId:PROJ_IMGS[b.typeId]
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
        for(let e of game.enemies){if(e.hp<=0)continue;if(dist(p.tx,p.ty,e.x,e.y)<=p.splash){
          let dmg=p.damage*(1-dist(p.tx,p.ty,e.x,e.y)/p.splash*0.4);
          e.hp-=dmg;if(e.hp<=0){e.hp=0;game.gold+=e.reward;spawnKillFx(e);}
        }}
      } else if(p.target&&p.target.hp>0){
        p.target.hp-=p.damage;
        if(p.target.hp<=0){p.target.hp=0;game.gold+=p.target.reward;spawnKillFx(p.target);}
      }
      for(let k=0;k<5;k++)game.particles.push({x:p.tx,y:p.ty,vx:(Math.random()-0.5)*100,vy:(Math.random()-0.5)*100,life:0.4,color:p.color,size:3});
      game.projectiles.splice(i,1);
    } else {
      p.x+=dx/d*p.speed*dt;p.y+=dy/d*p.speed*dt;
      p.angle=Math.atan2(dy,dx);
    }
  }

  // Economy
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    let b=game.grid[r][c];if(!b||b.cat!=='econ')continue;
    b.timer=(b.timer||0)+dt;
    let prod=econProd(b);
    if(b.timer>=1){b.timer-=1;game.gold+=prod;
      let pos=g2p(c,r);game.floats.push({x:pos.x,y:pos.y-cellSize*0.3,text:'+'+Math.round(prod),life:1,color:'#FFD700'});
    }
  }

  // Particles & floats
  for(let i=game.particles.length-1;i>=0;i--){
    let p=game.particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    if(p.life<=0)game.particles.splice(i,1);
  }
  for(let i=game.floats.length-1;i>=0;i--){
    let f=game.floats[i];f.y-=30*dt;f.life-=dt;
    if(f.life<=0)game.floats.splice(i,1);
  }

  // Clean dead enemies
  game.enemies=game.enemies.filter(e=>e.hp>0);

  // Wave complete?
  if(game.waveActive&&game.waveSpawned>=game.waveEnemies&&game.enemies.length===0){
    game.waveActive=false;game.gold+=waveBonus(game.wave);
    game.floats.push({x:W/2,y:H/2,text:'Wave '+game.wave+' Complete! +'+waveBonus(game.wave),life:2,color:'#4CAF50'});
    updateUI();
  }

  document.getElementById('gold-val').textContent=Math.floor(game.gold);
  document.getElementById('lives-val').textContent=game.lives;
  document.getElementById('wave-val').textContent=game.wave;
}

function towerDmg(b){return TOWERS[b.typeId].dmg*(1+b.level*0.5)}
function towerRange(b){return TOWERS[b.typeId].range*(1+b.level*0.1)}
function econProd(b){return ECONS[b.typeId].prod*(1+b.level*0.6)}
function upgradeCost(b){
  let base=b.cat==='tower'?TOWERS[b.typeId].cost:ECONS[b.typeId].cost;
  return Math.round(base*(0.6+b.level*0.3));
}
function sellValue(b){
  let base=b.cat==='tower'?TOWERS[b.typeId].cost:ECONS[b.typeId].cost;
  let spent=base;for(let i=0;i<b.level;i++)spent+=Math.round(base*(0.6+i*0.3));
  return Math.round(spent*0.6);
}

function spawnKillFx(e){
  for(let i=0;i<8;i++)game.particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*150,vy:(Math.random()-0.5)*150,life:0.5,color:'#FFD700',size:4});
  game.floats.push({x:e.x,y:e.y-10,text:'+'+e.reward,life:1,color:'#FFD700'});
}

function gameOver(){
  game.phase='over';
  document.getElementById('overlay').style.display='flex';
  document.getElementById('overlay').innerHTML='<h1>GAME OVER</h1><h2>You reached Wave '+game.wave+' \u2014 '+AGES[game.age].name+'</h2><button onclick="restartGame()">PLAY AGAIN</button>';
}

function announceAge(){
  let el=document.getElementById('age-announce');
  document.getElementById('age-announce-text').textContent=AGES[game.age].name.toUpperCase();
  el.style.display='flex';
  document.getElementById('age-label').textContent=AGES[game.age].name;
  setTimeout(()=>el.style.display='none',2200);
  mapCacheCellSize=-1; // invalidate map cache for new age
  updateBuildCards();
}

// ============= RENDER =============
function drawImageCentered(img,x,y,size,angle){
  ctx.save();
  ctx.translate(x,y);
  if(angle!==undefined&&angle!==0) ctx.rotate(angle);
  ctx.drawImage(img,-size/2,-size/2,size,size);
  ctx.restore();
}

function render(){
  let age=AGES[game.age];
  ctx.fillStyle=age.bg;ctx.fillRect(0,0,W,H);

  // ---- Map tiles (cached) ----
  if(mapCacheAge!==game.age||mapCacheCellSize!==cellSize) buildMapCache();
  if(mapCache) ctx.drawImage(mapCache,offX,offY);

  // ---- Placement preview ----
  if(game.selectedType!==null&&game.hoverCell){
    let hc=game.hoverCell,x=offX+hc.x*cellSize,y=offY+hc.y*cellSize;
    let valid=canPlace(hc.x,hc.y);
    ctx.fillStyle=valid?'rgba(0,255,0,0.2)':'rgba(255,0,0,0.2)';
    ctx.fillRect(x,y,cellSize,cellSize);
    if(valid&&game.selectedCat==='tower'){
      let def=TOWERS[game.selectedType];
      let pos=g2p(hc.x,hc.y);
      ctx.beginPath();ctx.arc(pos.x,pos.y,def.range*cellSize,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.stroke();
    }
  }

  // ---- Buildings on grid ----
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    let b=game.grid[r][c];if(!b)continue;
    let pos=g2p(c,r);
    let sz=cellSize*0.85;

    if(b.cat==='tower'){
      let imgNum=TOWER_IMGS[b.typeId];
      let img=IMAGES[imgNum];
      if(img){
        drawImageCentered(img,pos.x,pos.y,sz,b.angle||0);
      } else {
        // Fallback: colored triangle
        let def=TOWERS[b.typeId],s=cellSize*0.35;
        ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(b.angle||0);
        ctx.fillStyle=def.clr;
        ctx.beginPath();ctx.moveTo(s,0);ctx.lineTo(-s,-s*0.7);ctx.lineTo(-s,s*0.7);ctx.closePath();ctx.fill();
        ctx.restore();
      }
    } else {
      let imgNum=ECON_IMGS[b.typeId];
      let img=IMAGES[imgNum];
      if(img){
        drawImageCentered(img,pos.x,pos.y,sz,0);
      } else {
        // Fallback: colored circle
        let def=ECONS[b.typeId],s=cellSize*0.35;
        ctx.fillStyle=def.clr;
        ctx.beginPath();ctx.arc(pos.x,pos.y,s,0,Math.PI*2);ctx.fill();
      }
    }

    // Level dots
    if(b.level>0){
      let dotSz=cellSize*0.06;
      let startX=pos.x-(b.level-1)*dotSz*1.8/2;
      for(let i=0;i<b.level;i++){
        ctx.fillStyle='#FFD700';
        ctx.shadowColor='#FFD700';ctx.shadowBlur=4;
        ctx.beginPath();
        ctx.arc(startX+i*dotSz*1.8,pos.y-sz/2-dotSz*1.5,dotSz,0,Math.PI*2);
        ctx.fill();
      }
      ctx.shadowBlur=0;
    }
  }

  // ---- Selected building range ----
  if(game.selectedBuilding){
    let sb=game.selectedBuilding;
    if(sb.cat==='tower'){
      let pos=g2p(sb.col,sb.row);
      ctx.beginPath();ctx.arc(pos.x,pos.y,towerRange(sb)*cellSize,0,Math.PI*2);
      ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;ctx.stroke();
    }
  }

  // ---- Enemies ----
  for(let e of game.enemies){
    if(e.hp<=0)continue;
    let img=IMAGES[e.imgId];
    let sz=e.boss?cellSize*0.9:cellSize*0.65;
    if(img){
      drawImageCentered(img,e.x,e.y,sz,e.angle);
    } else {
      // Fallback: colored circle
      ctx.fillStyle='#c4a46c';
      ctx.beginPath();ctx.arc(e.x,e.y,e.radius,0,Math.PI*2);ctx.fill();
      if(e.boss){ctx.strokeStyle='#FFD700';ctx.lineWidth=2;ctx.stroke();}
    }
    // HP bar
    let bw=sz*0.8,bh=3,bx=e.x-bw/2,by=e.y-sz/2-6;
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(bx-1,by-1,bw+2,bh+2);
    ctx.fillStyle=e.hp/e.maxHp>0.5?'#4CAF50':e.hp/e.maxHp>0.25?'#FF9800':'#f44336';
    ctx.fillRect(bx,by,bw*(e.hp/e.maxHp),bh);
    // Boss glow
    if(e.boss){
      ctx.strokeStyle='#FFD700';ctx.lineWidth=2;ctx.globalAlpha=0.4+Math.sin(Date.now()*0.005)*0.2;
      ctx.beginPath();ctx.arc(e.x,e.y,sz/2+4,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=1;
    }
  }

  // ---- Laser beams ----
  for(let [b,t] of game.laserTargets){
    let gradient=ctx.createLinearGradient(t.sx,t.sy,t.tx,t.ty);
    gradient.addColorStop(0,'rgba(0,206,209,0.8)');
    gradient.addColorStop(1,'rgba(0,255,255,0.4)');
    ctx.strokeStyle=gradient;ctx.lineWidth=3+Math.random()*2;
    ctx.globalAlpha=0.7+Math.random()*0.3;
    ctx.beginPath();ctx.moveTo(t.sx,t.sy);ctx.lineTo(t.tx,t.ty);ctx.stroke();
    // Glow effect
    ctx.strokeStyle='rgba(0,255,255,0.15)';ctx.lineWidth=10;
    ctx.beginPath();ctx.moveTo(t.sx,t.sy);ctx.lineTo(t.tx,t.ty);ctx.stroke();
    ctx.globalAlpha=1;
  }

  // ---- Projectiles ----
  for(let p of game.projectiles){
    let img=p.imgId?IMAGES[p.imgId]:null;
    let sz=p.splash>0?cellSize*0.35:cellSize*0.25;
    if(img){
      drawImageCentered(img,p.x,p.y,sz,p.angle||0);
    } else {
      ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.splash>0?4:3,0,Math.PI*2);ctx.fill();
    }
  }

  // ---- Particles ----
  for(let p of game.particles){
    ctx.globalAlpha=Math.max(0,p.life*2);ctx.fillStyle=p.color;
    ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
  }
  ctx.globalAlpha=1;

  // ---- Floating text ----
  ctx.textAlign='center';
  ctx.font='bold '+Math.max(12,cellSize*0.3)+'px sans-serif';
  for(let f of game.floats){
    ctx.globalAlpha=Math.min(1,f.life*2);
    ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=3;
    ctx.strokeText(f.text,f.x,f.y);
    ctx.fillStyle=f.color;
    ctx.fillText(f.text,f.x,f.y);
  }
  ctx.globalAlpha=1;
}

// ============= INPUT =============
function canPlace(gx,gy){
  return gx>=0&&gx<COLS&&gy>=0&&gy<ROWS&&!pathSet.has(gx+','+gy)&&!game.grid[gy][gx];
}

function handleClick(px,py){
  if(game.phase!=='play')return;
  let g=p2g(px,py);
  let popup=document.getElementById('info-popup');

  // Check if clicking on existing building
  if(g.x>=0&&g.x<COLS&&g.y>=0&&g.y<ROWS&&game.grid[g.y][g.x]){
    let b=game.grid[g.y][g.x];
    b.row=g.y;b.col=g.x;
    game.selectedBuilding=b;game.selectedType=null;
    showInfoPopup(b,px,py);
    updateBuildCards();
    return;
  }

  // Place building
  if(game.selectedType!==null&&canPlace(g.x,g.y)){
    let cat=game.selectedCat,def=cat==='tower'?TOWERS[game.selectedType]:ECONS[game.selectedType];
    if(game.gold>=def.cost){
      game.gold-=def.cost;
      game.grid[g.y][g.x]={cat,typeId:game.selectedType,level:0,cooldown:0,timer:0,angle:0};
      updateUI();
    }
    return;
  }

  // Deselect
  game.selectedType=null;game.selectedBuilding=null;
  popup.style.display='none';
  updateBuildCards();
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
  } else {
    stats='<div class="stat"><span>Production</span><span>'+econProd(b).toFixed(1)+'/s</span></div>';
  }
  document.getElementById('info-stats').innerHTML=stats;
  let ubtn=document.getElementById('upgrade-btn');
  let sbtn=document.getElementById('sell-btn');
  if(b.level>=3){ubtn.textContent='MAX';ubtn.disabled=true;}
  else{let uc=upgradeCost(b);ubtn.textContent='Upgrade ('+uc+')';ubtn.disabled=game.gold<uc;}
  sbtn.textContent='Sell ('+sellValue(b)+')';
  ubtn.onclick=()=>{
    if(b.level<3&&game.gold>=upgradeCost(b)){game.gold-=upgradeCost(b);b.level++;showInfoPopup(b,px,py);updateUI();}
  };
  sbtn.onclick=()=>{
    game.gold+=sellValue(b);game.grid[b.row][b.col]=null;popup.style.display='none';
    game.selectedBuilding=null;updateUI();
  };
  popup.style.display='block';
  let popW=190,popH=180;
  popup.style.left=Math.min(px,W-popW-10)+'px';
  popup.style.top=Math.max(50,Math.min(py-popH,H-popH-140))+'px';
}

// ============= UI =============
function updateBuildCards(){
  let container=document.getElementById('build-cards');
  container.innerHTML='';
  let items=game.tab==='tower'?TOWERS:ECONS;
  let imgMap=game.tab==='tower'?TOWER_IMGS:ECON_IMGS;
  items.forEach((def,i)=>{
    let card=document.createElement('div');
    card.className='card';
    if(def.age>game.age)card.className+=' locked';
    if(game.selectedCat===game.tab&&game.selectedType===i)card.className+=' selected';
    let imgNum=imgMap[i];
    let iconHTML=IMAGES[imgNum]
      ?'<img src="Assets/'+imgNum+'.png">'
      :'<span style="font-size:22px">\u2699</span>';
    card.innerHTML='<div class="card-icon">'+iconHTML+'</div><div class="card-name">'+def.name+'</div><div class="card-cost">\uD83D\uDCB0 '+def.cost+'</div>';
    if(def.age<=game.age){
      card.onclick=(e)=>{
        e.stopPropagation();
        if(game.selectedCat===game.tab&&game.selectedType===i){game.selectedType=null;game.selectedCat=null;}
        else{game.selectedType=i;game.selectedCat=game.tab;}
        game.selectedBuilding=null;
        document.getElementById('info-popup').style.display='none';
        updateBuildCards();
      };
    }
    container.appendChild(card);
  });
}

function updateUI(){
  document.getElementById('gold-val').textContent=Math.floor(game.gold);
  document.getElementById('lives-val').textContent=game.lives;
  document.getElementById('wave-val').textContent=game.wave;
  let wb=document.getElementById('wave-btn');
  wb.disabled=game.waveActive;
  wb.textContent=game.waveActive?'Wave in progress...':'Start Wave '+(game.wave+1);
  updateBuildCards();
}

// ============= INIT =============
function startGame(){
  game={gold:200,lives:20,wave:0,age:0,phase:'play',speed:1,
    selectedType:null,selectedCat:null,selectedBuilding:null,tab:'tower',
    grid:Array.from({length:ROWS},()=>Array(COLS).fill(null)),
    enemies:[],projectiles:[],particles:[],floats:[],
    waveEnemies:0,waveSpawned:0,spawnTimer:0,waveActive:false,
    laserTargets:new Map(),hoverCell:null};
  document.getElementById('overlay').style.display='none';
  document.getElementById('hud').style.display='flex';
  document.getElementById('age-label').style.display='block';
  document.getElementById('age-label').textContent=AGES[0].name;
  document.getElementById('build-bar').style.display='block';
  mapCacheCellSize=-1;
  resize();updateUI();
}

function restartGame(){startGame();}

let lastTime=0;
function loop(ts){
  let dt=(ts-lastTime)/1000;lastTime=ts;
  update(dt);render();
  requestAnimationFrame(loop);
}

window.onload=async function(){
  canvas=document.getElementById('c');
  ctx=canvas.getContext('2d');
  computePath();resize();

  // Load all assets
  await preloadAssets();
  document.getElementById('loading').style.display='none';
  document.getElementById('overlay').style.display='flex';

  // Events
  window.addEventListener('resize',()=>{resize();mapCacheCellSize=-1;});
  document.getElementById('start-btn').onclick=startGame;

  // Tabs
  document.querySelectorAll('#build-tabs button').forEach(btn=>{
    btn.onclick=()=>{
      document.querySelectorAll('#build-tabs button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');game.tab=btn.dataset.tab;
      game.selectedType=null;game.selectedCat=null;
      updateBuildCards();
    };
  });

  document.getElementById('wave-btn').onclick=startWave;
  document.getElementById('speed-btn').onclick=()=>{
    game.speed=game.speed>=3?1:game.speed+1;
    document.getElementById('speed-btn').textContent=game.speed+'x';
  };

  // Mouse
  canvas.addEventListener('click',(e)=>handleClick(e.clientX,e.clientY));
  canvas.addEventListener('mousemove',(e)=>{game.hoverCell=p2g(e.clientX,e.clientY);});
  canvas.addEventListener('mouseleave',()=>{game.hoverCell=null;});

  // Touch
  canvas.addEventListener('touchstart',(e)=>{
    e.preventDefault();let t=e.touches[0];
    game.hoverCell=p2g(t.clientX,t.clientY);
    handleClick(t.clientX,t.clientY);
  },{passive:false});

  // Close popup on outside click
  document.addEventListener('click',(e)=>{
    if(!e.target.closest('#info-popup')&&!e.target.closest('canvas')){
      document.getElementById('info-popup').style.display='none';
      game.selectedBuilding=null;
    }
  });

  requestAnimationFrame(loop);
};
