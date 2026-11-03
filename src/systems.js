/* v0.6 simulation and placement. Original art, recipes and story milestones stay canonical. */
const V06_PERSONALITIES = [
  {mood:'Welcoming',gift:'petals',home:'rug',line:'A little color makes every arrival feel special.'},
  {mood:'Practical',gift:'stone',home:'chair',line:'I found a smooth stone on my walk. What have you discovered?'},
  {mood:'Curious',gift:'bugs',home:'plant',line:'The garden looks different every morning. Shall we take a look?'},
  {mood:'Reflective',gift:'petals',home:'books',line:'A quiet corner and a familiar face. That is a lovely afternoon.'},
  {mood:'Inventive',gift:'wood',home:'table',line:'I have been thinking about what we could make at the workshop.'},
  {mood:'Cheerful',gift:'petals',home:'lamp',line:'Did you see how the lantern catches the evening light?'},
  {mood:'Gentle',gift:'bugs',home:'plant',line:'I leave a little room for wildflowers around my home.'},
  {mood:'Sociable',gift:'fish',home:'chair',line:'The best paths are the ones that bring us together.'},
  {mood:'Adventurous',gift:'wood',home:'bed',line:'A walk to the edge of the meadow always gives me new ideas.'},
  {mood:'Observant',gift:'stone',home:'books',line:'Have you noticed how our town changes as each neighbor arrives?'}
];
let gamepadWasPressedV06=false;
let v06Navigation = null, v06SaveClock = 0, v06HudClock = 0, v06DesignTransaction = false;
function systemsStartReset(){
  v06Navigation=null;v06SaveClock=0;v06HudClock=0;walkTarget=null;pendingTalk=null;keys.clear();resetJoy();
  if(state){state.dailySocial ||= {};state.redoHistory ||= [];ensureBuildIds();recoverActors();}
}
function ensureBuildIds(){if(!state)return;for(const b of state.built)if(!b.uid)b.uid='b'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
function solidFootprint(type,rotation=0){
  let shape=({cottage:[1.42,1.27],market:[1.22,.96],fountain:[1.08,1.08],bench:[.78,.4],fence:[.86,.23],lamp:[.25,.25],planter:[.55,.55],garden:[.77,.72]})[type];
  if(!shape)return null;return rotation%2?[shape[1],shape[0]]:shape;
}
function collides(x,y){
  if(!state||!Number.isFinite(x)||!Number.isFinite(y))return true;
  const pad=.18;
  for(const b of state.built){let f=solidFootprint(b.type,b.rotation||0);if(f&&Math.abs(x-b.x)<f[0]+pad&&Math.abs(y-b.y)<f[1]+pad)return true;}
  if(Math.abs(x-28.5)<1.95&&Math.abs(y-28)<1.7)return true;
  if(Math.hypot(x-10,y-28)<1.95&&!['swim','dive'].includes(state.traversalMode))return true;
  if(Math.abs(x-22.7)<.85&&Math.abs(y-17.4)<.9)return true;
  if(Math.abs(x-19.3)<.83&&Math.abs(y-17.65)<.3)return true;
  for(const o of obstacles){if(state.harvested.includes(o.id))continue;const r=({tree:.48,rock:.58,log:.51})[o.kind];if(r&&Math.hypot(x-o.x,y-o.y)<r+pad)return true;}
  for(const t of state.terrainEdits||[]){let r=t.type==='pond'?1.05:t.type==='hill'?.8:t.type==='tree'?.48:0;if(r&&Math.hypot(x-t.x,y-t.y)<r+pad)return true;}
  return false;
}
validMove=function(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&inside(x,y)&&!collides(x,y)};
function nearestWalkable(p,max=4){
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;
  if(validMove(p.x,p.y))return {x:p.x,y:p.y};
  for(let r=.35;r<=max;r+=.35)for(let j=0;j<20;j++){let a=j*Math.PI/10,q={x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r};if(validMove(q.x,q.y))return q;}
  return null;
}
function recoverActors(){if(!state)return;let p=nearestWalkable(state.player,5);if(p)Object.assign(state.player,p);for(const n of npcData){if(!state.residents.includes(n.index))continue;let q=nearestWalkable(n,4);if(q)Object.assign(n,q);}}
const v06SetupNpcs=setupNpcs;
setupNpcs=function(){v06SetupNpcs();for(const n of npcData){let b=state.built.find(b=>b.type==='cottage'&&b.resident===n.index);if(b){let a=(b.rotation||0)*Math.PI/2;n.x=b.x-Math.sin(a)*1.9;n.y=b.y+Math.cos(a)*1.9;}n.route=[];n.routeTimer=0;n.scheduleKey=null;n.conversation=null;}recoverActors()};
function lineWalkable(a,b){let d=dist(a,b),steps=Math.ceil(d/.25);for(let j=1;j<=steps;j++){let t=j/steps;if(!validMove(ease(a.x,b.x,t),ease(a.y,b.y,t)))return false;}return true;}
/* Eight-way A*, bounded to the 42 x 38 town. Diagonal moves cannot cut corners. */
function findTownPath(from,to){
  const destination=nearestWalkable(to,3.5);if(!destination)return [];
  if(lineWalkable(from,destination))return [destination];
  const step=.75,nx=Math.ceil(W/step),ny=Math.ceil(H/step),key=(x,y)=>y*nx+x;
  const sx=Math.round(from.x/step),sy=Math.round(from.y/step),gx=Math.round(destination.x/step),gy=Math.round(destination.y/step);
  const start=key(sx,sy),open=[start],came=new Map(),g=new Map([[start,0]]),closed=new Set(),blocked=new Map();
  const free=(x,y)=>{if(x<2||y<2||x>=nx-2||y>=ny-2)return false;let k=key(x,y);if(!blocked.has(k))blocked.set(k,validMove(x*step,y*step));return blocked.get(k)};
  const h=k=>Math.hypot(k%nx-gx,Math.floor(k/nx)-gy);let end=null,best=start;
  for(let count=0;open.length&&count<4200;count++){
    let at=0;for(let j=1;j<open.length;j++)if(g.get(open[j])+h(open[j])<g.get(open[at])+h(open[at]))at=j;
    const current=open.splice(at,1)[0];if(closed.has(current))continue;closed.add(current);
    if(h(current)<h(best))best=current;
    const x=current%nx,y=Math.floor(current/nx),point={x:x*step,y:y*step};
    if(dist(point,destination)<1.1&&lineWalkable(point,destination)){end=current;break;}
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      if(!dx&&!dy||!free(x+dx,y+dy))continue;if(dx&&dy&&(!free(x+dx,y)||!free(x,y+dy)))continue;
      let k=key(x+dx,y+dy);if(closed.has(k))continue;let ng=g.get(current)+Math.hypot(dx,dy);if(ng<(g.get(k)??Infinity)){came.set(k,current);g.set(k,ng);open.push(k);}
    }
  }
  if(end===null)return [];
  let path=[destination],cur=end;while(cur!==start){path.push({x:(cur%nx)*step,y:Math.floor(cur/nx)*step});cur=came.get(cur);if(cur===undefined)return [];}
  path.reverse();const smooth=[];let origin=from;for(let i=0;i<path.length;){let last=i;while(last+1<path.length&&lineWalkable(origin,path[last+1]))last++;smooth.push(path[last]);origin=path[last];i=last+1;}return smooth;
}
function moveActor(actor,goal,speed,dt){let dx=goal.x-actor.x,dy=goal.y-actor.y,len=Math.hypot(dx,dy);if(len<.08)return true;let amount=Math.min(len,speed*dt),mx=dx/len*amount,my=dy/len*amount;if(validMove(actor.x+mx,actor.y))actor.x+=mx;if(validMove(actor.x,actor.y+my))actor.y+=my;return dist(actor,goal)<.12;}
function residentSchedule(n){
  const h=state.clock,p=V06_PERSONALITIES[n.index];let goal,activity;
  if(h<7||h>=21){goal={x:n.home.x,y:n.home.y+2};activity='Resting near home';}
  else if(h<11){goal={x:20+(n.index%3)*.8,y:19.5+Math.floor(n.index/3)*.6};activity='Greeting neighbors at the plaza';}
  else if(h<16){let preferred=state.built.find(b=>b.type===(['garden','bench','market'][n.index%3]));goal=preferred?{x:preferred.x+1.5,y:preferred.y+1.5}:n.index%3===0&&state.workshopRestored?{x:28.5,y:30.3}:n.index%3===1?{x:12.5,y:28}:{x:23,y:23};activity=preferred?'Enjoying the '+COST[preferred.type].name.toLowerCase():n.index%3===0&&state.workshopRestored?'Making plans at the workshop':n.index%3===1?'Watching the little pond':'Looking after wildflowers';}
  else{const other=npcData.find(a=>a.index!==n.index&&state.residents.includes(a.index));goal=other?{x:20+(Math.min(n.index,other.index)%3),y:21.5+(n.index%2)*.7}:{x:21,y:21};activity=other?'Sharing the evening with '+other.name:'Taking an evening walk';}
  n.activity=activity;n.personality=p.mood;return {goal,key:Math.floor(h<7||h>=21?0:h<11?1:h<16?2:3)+'_'+activity};
}
gameUpdate=function(dt){
  if(miniFishing&&$('catchBobber')&&!$('modal').classList.contains('hidden'))$('catchBobber').style.left=((Math.sin((performance.now()-miniFishing.begin)/320)+1)*50)+'%';
  if(paused||activeModal||!state||document.hidden)return;dt=clamp(dt,0,.05);tick+=dt;state.clock+=dt*.045;if(state.clock>=24)dayAdvance();
  let ix=joyX+(keys.has('right')?1:0)-(keys.has('left')?1:0),iy=joyY+(keys.has('down')?1:0)-(keys.has('up')?1:0);
  const pad=navigator.getGamepads?.()[0];if(pad&&state.gamepad!==false){let ax=pad.axes[0]||0,ay=pad.axes[1]||0;if(Math.hypot(ax,ay)>.18){ix+=ax;iy+=ay;}if(pad.buttons[0]?.pressed&&!gamepadWasPressedV06){interact();}gamepadWasPressedV06=!!pad.buttons[0]?.pressed;}
  let dx=0,dy=0;
  if(ix||iy){walkTarget=null;pendingTalk=null;v06Navigation=null;if(typeof usesPolished3D==='function'?usesPolished3D():glReady){dx=ix*scene3d.right[0]+iy*Math.cos(scene3d.yaw);dy=ix*scene3d.right[2]+iy*Math.sin(scene3d.yaw);}else{dx=ix+iy;dy=iy-ix;}let len=Math.hypot(dx,dy);const speed=(typeof travelSpeedV06==='function'?travelSpeedV06():3.25)*Math.min(1,Math.hypot(ix,iy));moveActor(state.player,{x:state.player.x+dx/len,y:state.player.y+dy/len},speed,dt);}
  else if(walkTarget){
    if(!v06Navigation||v06Navigation.goal!==walkTarget){const route=findTownPath(state.player,walkTarget);v06Navigation={goal:walkTarget,route};if(!route.length){walkTarget=null;pendingTalk=null;toast('That spot is blocked. Choose an open patch of ground.');}}
    if(walkTarget&&v06Navigation.route.length){if(moveActor(state.player,v06Navigation.route[0],typeof travelSpeedV06==='function'?travelSpeedV06():3.25,dt))v06Navigation.route.shift();if(!v06Navigation.route.length){walkTarget=null;v06Navigation=null;if(pendingTalk!==null){let i=pendingTalk;pendingTalk=null;if(state.residents.includes(i)&&dist(state.player,npcData[i])<3.3)talkTo(i);}}}
  }else v06Navigation=null;
  for(const n of npcData){if(!state.residents.includes(n.index))continue;const schedule=residentSchedule(n);n.routeTimer-=dt;if(n.scheduleKey!==schedule.key||n.routeTimer<=0){n.scheduleKey=schedule.key;n.routeTimer=7+hash(n.index,Math.floor(tick))*4;let goal={x:schedule.goal.x+hash(n.index,Math.floor(tick/10))*.5,y:schedule.goal.y};n.route=findTownPath(n,goal);}if(n.route?.length&&dist(state.player,n)>1.25){if(moveActor(n,n.route[0],.55+hash(n.index,1)*.2,dt))n.route.shift();}}
  v06SaveClock+=dt;v06HudClock+=dt;if(v06SaveClock>=5){v06SaveClock=0;persist();}if(v06HudClock>=.2){v06HudClock=0;updateHUD();}
};
function canSite(x,y,exclude=null,type='path'){
  if(!Number.isFinite(x)||!Number.isFinite(y)||!inside(x,y)||!plotOpen(x,y))return false;
  const f=solidFootprint(type)||[type==='pond'?1.15:type==='hill'?.9:.48,type==='pond'?1.15:type==='hill'?.9:.48];
  for(const dx of [-f[0],f[0]])for(const dy of [-f[1],f[1]])if(!plotOpen(x+dx,y+dy)||!inside(x+dx,y+dy))return false;
  const p={x,y},large=type==='cottage'||type==='market';
  if(Math.abs(x-28.5)<f[0]+2.05&&Math.abs(y-28)<f[1]+1.9)return false;
  if(dist(p,{x:10,y:28})<Math.max(...f)+2||dist(p,{x:22.7,y:17.4})<Math.max(...f)+1.35||dist(p,{x:20,y:19})<Math.max(...f)+1.9)return false;
  for(const b of state.built){if(b===exclude)continue;const bf=solidFootprint(b.type,b.rotation||0)||[.55,.55];if(Math.abs(x-b.x)<f[0]+bf[0]+.25&&Math.abs(y-b.y)<f[1]+bf[1]+.25)return false;}
  for(const o of obstacles){if(state.harvested.includes(o.id))continue;if(dist(o,p)<Math.max(...f)+(large?.7:.45))return false;}
  for(const t of state.terrainEdits||[]){if(exclude===t||Math.round(x)===t.x&&Math.round(y)===t.y&&!large)continue;let r=t.type==='pond'?1.2:t.type==='hill'?1:t.type==='tree'?.6:0;if(r&&dist(t,p)<Math.max(...f)+r)return false;}
  if(solidFootprint(type)&&dist(state.player,p)<Math.max(...f)+.4)return false;
  return true;
}
const v06ActivateDesigner=activateDesigner;
activateDesigner=function(mode,type){if(mode==='place'&&type==='market'&&!state.workshopRestored){toast('Restore the workshop before building a marketplace.');return}v06ActivateDesigner(mode,type)};
buildAt=function(x,y){
  if(!state||!placing||!COST[placing])return;let type=placing,c=COST[type],p={x:Math.round(x*2)/2,y:Math.round(y*2)/2};
  if(type==='market'&&!state.workshopRestored){toast('Restore the workshop before building a marketplace.');return;}
  if(dist(p,state.player)>6.2){toast('Build within 6 tiles of your Fathermon.');return;}
  if(!canSite(p.x,p.y,null,type)){toast('Choose clear ground away from buildings, resources and landmarks.');return;}
  if(!canAfford(type)){toast('Gather more materials first.');return;}
  snapshot();for(const k of ['wood','stone','petals'])state[k]-=c[k];
  const b={x:p.x,y:p.y,type,resident:null,rotation:0,uid:'b'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9),style:{roof:'#d67b60',wall:'#f8dbaa',door:'#6f563d',window:'#a3e7e4',layout:'Cozy single room'}};
  if(type==='garden'){b.growth=0;b.watered=false;}state.built.push(b);if(type==='market')state.marketOpened=true;state.coins+=3;
  endPlacing();persist();checkQuest();checkChapterTwo(false);checkChapter3();updateHUD();sound(760);toast(c.icon+' '+c.name+' built!');
};
nearPlacement=function(){if(!placing)return;const p=state.player;for(let r of [2,3,4,5,6])for(let j=0;j<24;j++){let a=j*Math.PI/12,x=Math.round((p.x+Math.cos(a)*r)*2)/2,y=Math.round((p.y+Math.sin(a)*r)*2)/2;if(canSite(x,y,null,placing)){buildAt(x,y);return;}}toast('No open plot nearby. Gather nearby resources or walk into a clear meadow.');};
const v06TerrainAt=terrainAt;
terrainAt=function(x,y,type){if(!terrainDefs.some(t=>t[0]===type))return;if((type==='pond'||type==='hill'||type==='tree')&&dist(state.player,{x:Math.round(x),y:Math.round(y)})<1.5){toast('Move away before shaping this ground.');return}v06TerrainAt(x,y,type);recoverActors()};
const v06Invitation=chooseInvitation;
chooseInvitation=function(i){if(!Number.isInteger(i)||i<0||i>9||i===state.avatar||state.residents.includes(i))return;v06Invitation(i);ensureBuildIds();state.undoHistory=[];state.redoHistory=[];recoverActors();persist();};
// Story checks catch completed prerequisites after a dialogue closes, without skipping requirements.
function advanceStoryReadiness(){if(!state||paused||activeModal)return;let before=state.quest;if(state.quest<6)checkQuest();else if(!state.chapter2Complete){if(!state.chapter2Started)beginChapter2();else checkChapterTwo(true);}else if(!state.chapter3Started)startChapter3();else checkChapter3();if(state.quest!==before)updateHUD();}
const v06HideModal=hideModal;
hideModal=function(){v06HideModal();resetJoy();keys.clear();queueMicrotask(()=>{if(!activeModal)advanceStoryReadiness();});};
const v06CheckChapter3=checkChapter3;
checkChapter3=function(){if(!state?.chapter3Started)return;v06CheckChapter3();};
// Chapter 4 is a continuation boundary only: no new story canon is introduced.
const v06Journal=showJournal;
showJournal=function(){v06Journal();if(state?.chapter3Complete)$('modalBody').insertAdjacentHTML('beforeend','<p class="sub">Chapter 4 · Your story continues. Further chapters are reserved for a future update; free play remains open.</p>');};

// Repair and crafting remain behind the established Chapter 2 discovery gate.
const repairWorkshopBeforeV06=repairWorkshop;
repairWorkshop=function(){if(!chapter2Eligible()||!state.chapter2Started||!state.workshopVisited){toast('Follow Chapter 1, then inspect the forgotten workshop first.');return;}repairWorkshopBeforeV06();};
const craftFurnitureBeforeV06=craftFurniture;
craftFurniture=function(id){if(!chapter2Eligible()||!state.workshopRestored)return;craftFurnitureBeforeV06(id);};

// Store edits as transactions. Reversing an edit changes only its own resource
// delta and changed object fields; later gathering and crop growth are retained.
const cloneDesignV06=value=>JSON.parse(JSON.stringify(value));
function designImageV06(){ensureBuildIds();return cloneDesignV06({built:state.built,terrainEdits:state.terrainEdits,expansions:state.expansions,wood:state.wood,stone:state.stone,petals:state.petals,coins:state.coins});}
snapshot=function(){};
function designTransactionV06(action,kind){return function(...args){if(!state)return;const outer=v06DesignTransaction;if(outer)return action(...args);v06DesignTransaction=true;const before=designImageV06();const zoneFee=kind==='unlockZone'?(expansionDefs.find(d=>d.id===args[0])?.cost||0):0;try{return action(...args);}finally{v06DesignTransaction=false;const after=designImageV06();if(JSON.stringify(before)!==JSON.stringify(after)){const editCoins=kind==='buildAt'?3:kind==='unlockZone'?-zoneFee:0;before.coins=after.coins-editCoins;state.undoHistory.push({before,after});state.undoHistory=state.undoHistory.slice(-20);state.redoHistory=[];persist();}}};}
for(const action of ['buildAt','terrainAt','moveStructure','removeAt','chooseStyle','unlockZone','rotateSelected']){
  // Explicit assignments avoid eval and keep the existing named APIs available.
  if(action==='buildAt')buildAt=designTransactionV06(buildAt,'buildAt');
  if(action==='terrainAt')terrainAt=designTransactionV06(terrainAt,'terrainAt');
  if(action==='moveStructure')moveStructure=designTransactionV06(moveStructure,'moveStructure');
  if(action==='removeAt')removeAt=designTransactionV06(removeAt,'removeAt');
  if(action==='chooseStyle')chooseStyle=designTransactionV06(chooseStyle,'chooseStyle');
  if(action==='unlockZone')unlockZone=designTransactionV06(unlockZone,'unlockZone');
  if(action==='rotateSelected')rotateSelected=designTransactionV06(rotateSelected,'rotateSelected');
}
function applyDesignHistoryV06(redo){
 const source=redo?state.redoHistory:state.undoHistory,target=redo?state.undoHistory:state.redoHistory,entry=source.at(-1);
 if(!entry?.before||!entry?.after){toast(redo?'Nothing to redo yet.':'Nothing to undo yet.');return;}
 const from=redo?entry.before:entry.after,to=redo?entry.after:entry.before;
 const changes={};for(const k of ['wood','stone','petals','coins']){changes[k]=to[k]-from[k];if(state[k]+changes[k]<0){toast('Gather the materials needed to reverse this edit first.');return;}}
 const beforeMap=new Map(from.built.map(b=>[b.uid,b])),afterMap=new Map(to.built.map(b=>[b.uid,b]));
 for(const [id,b] of beforeMap)if(!afterMap.has(id)&&state.built.some(b=>b.uid===id&&b.resident!==null&&b.resident!==undefined)){toast('A neighbor lives here. Move their home instead.');return;}
 for(const [id,b] of beforeMap){const newB=afterMap.get(id),current=state.built.find(a=>a.uid===id);if(!newB){state.built=state.built.filter(a=>a.uid!==id);continue;}if(!current)continue;for(const k of new Set([...Object.keys(b),...Object.keys(newB)])){if(JSON.stringify(b[k])!==JSON.stringify(newB[k])){if(newB[k]===undefined)delete current[k];else current[k]=cloneDesignV06(newB[k]);}}}
 for(const [id,b] of afterMap)if(!beforeMap.has(id))state.built.push(cloneDesignV06(b));
 const terrainKey=t=>t.x+','+t.y,fromT=new Map(from.terrainEdits.map(t=>[terrainKey(t),t])),toT=new Map(to.terrainEdits.map(t=>[terrainKey(t),t]));
 for(const key of new Set([...fromT.keys(),...toT.keys()]))if(JSON.stringify(fromT.get(key))!==JSON.stringify(toT.get(key))){state.terrainEdits=state.terrainEdits.filter(t=>terrainKey(t)!==key);if(toT.has(key))state.terrainEdits.push(cloneDesignV06(toT.get(key)));}
 for(const id of from.expansions)if(!to.expansions.includes(id))state.expansions=state.expansions.filter(a=>a!==id);
 for(const id of to.expansions)if(!state.expansions.includes(id))state.expansions.push(id);
 for(const k of Object.keys(changes))state[k]+=changes[k];
 source.pop();target.push(entry);state.marketOpened=state.built.some(b=>b.type==='market');setupNpcs();recoverActors();geometryDirty=true;persist();updateHUD();toast(redo?'Design change redone.':'Design change undone.');
}
undoDesign=function(){applyDesignHistoryV06(false);};
function redoDesign(){applyDesignHistoryV06(true);}
const historyButton=document.createElement('button');historyButton.textContent='↷ Redo';historyButton.dataset.v06History='redo';designerDock.querySelector('.dockRow').insertBefore(historyButton,designerDock.querySelector('.main'));
document.addEventListener('click',e=>{if(!e.target.closest('[data-v06-history]'))return;e.preventDefault();redoDesign();});
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select')||paused||activeModal)return;if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||e.shiftKey&&e.key.toLowerCase()==='z')){e.preventDefault();e.stopImmediatePropagation();redoDesign();}},true);

function socialTodayV06(i){state.dailySocial ||= {};if(state.dailySocial[i]?.day!==state.day)state.dailySocial[i]={day:state.day,chatted:false,gifted:false};return state.dailySocial[i];}
const dialogueBeforeV06=showDialog;
showDialog=function(i,message){dialogueBeforeV06(i,message);const p=V06_PERSONALITIES[i];if(!p)return;$('modalBody').querySelector('.dialogArt')?.insertAdjacentHTML('afterend',`<p class="sub">${p.mood} · Favorite gift: ${requestText(p.gift)} · Home wish: ${CRAFT_RECIPES[p.home].name}</p>`);const actions=$('modalBody').querySelector('.actions');if(actions&&!socialTodayV06(i).gifted)actions.insertAdjacentHTML('beforeend',`<button class="btn secondary" data-favorite-gift="${i}">Gift favorite (${state[p.gift]||0})</button>`);};
talkTo=function(i){if(!state.residents.includes(i)||dist(state.player,npcData[i])>3.3)return;const record=socialTodayV06(i),first=!record.chatted;record.chatted=true;if(first)state.friendships[i]++;state.talkCount++;if(!state.talked.includes(i))state.talked.push(i);const text=first?V06_PERSONALITIES[i].line:DIALOGS[i][(state.day+i)%DIALOGS[i].length];persist();const previous=state.quest;checkQuest();if(state.quest===previous)showDialog(i,text);checkChapterTwo(false);};
function socialGiftV06(i,type){if(!state.residents.includes(i))return;const record=socialTodayV06(i);if(record.gifted){toast('Your neighbor has already received a gift today.');return;}if(!(state[type]>0)){toast('Collect that gift first.');return;}state[type]--;record.gifted=true;state.friendships[i]+=type===V06_PERSONALITIES[i].gift?4:type==='meals'?4:2;persist();showDialog(i,'Thank you for thinking of me! '+V06_PERSONALITIES[i].line);toast('A gift shared. Your friendship grew.');}
giveGift=function(i){socialGiftV06(i,'petals');};giftMeal=function(i){socialGiftV06(i,'meals');};
document.addEventListener('click',e=>{const b=e.target.closest('[data-favorite-gift]');if(b){const i=Number(b.dataset.favoriteGift);socialGiftV06(i,V06_PERSONALITIES[i].gift);}});
const detailBeforeV06=showNeighborDetail;
showNeighborDetail=function(i){detailBeforeV06(i);if(state.residents.includes(i)){$('modalBody').insertAdjacentHTML('beforeend',`<p class="sub">${V06_PERSONALITIES[i].mood} · Loves ${requestText(V06_PERSONALITIES[i].gift)} · Would enjoy a ${CRAFT_RECIPES[V06_PERSONALITIES[i].home].name.toLowerCase()} at home. These routines and preferences are township concepts.</p>`);}};
