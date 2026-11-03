/* Modular home workshop: visible building pieces, material costs, real footprints
   and an expanded, editable annex. All original exterior styles remain available. */
const HOME_MODULES_V06={
 porch:{name:'Welcoming Porch',icon:'🪵',wood:3,stone:1,petals:0,description:'A timber deck, steps and a small garden railing.'},
 chimney:{name:'Stone Chimney',icon:'🧱',wood:0,stone:4,petals:0,description:'A capped stone stack with a warm hearth detail.'},
 wing:{name:'Garden Wing',icon:'🏠',wood:5,stone:3,petals:0,description:'An attached room with a real footprint and ten extra indoor floor spaces.'}
};
function homeRectsV06(b,x=b.x,y=b.y,rotation=b.rotation||0){
 const local=[[0,0,1.42,1.27]];
 if(b.addons?.porch)local.push([0,1.66,1.25,.75]);
 if(b.addons?.wing)local.push([1.8,-.12,1.02,1.04]);
 const turn=rotation*Math.PI/2,c=Math.cos(turn),s=Math.sin(turn),odd=rotation%2;
 return local.map(([a,z,hx,hy])=>({x:x+a*c-z*s,y:y+a*s+z*c,hx:odd?hy:hx,hy:odd?hx:hy}));
}
function rectOverlapHomesV06(a,b,pad=.18){return Math.abs(a.x-b.x)<a.hx+b.hx+pad&&Math.abs(a.y-b.y)<a.hy+b.hy+pad;}
function circleHitsHomeV06(r,x,y,radius){const dx=Math.max(0,Math.abs(x-r.x)-r.hx),dy=Math.max(0,Math.abs(y-r.y)-r.hy);return Math.hypot(dx,dy)<radius;}
function homeModulesFitV06(b,x=b.x,y=b.y,rotation=b.rotation||0){
 const rects=homeRectsV06(b,x,y,rotation);
 for(const r of rects){
  for(const dx of [-r.hx,r.hx])for(const dy of [-r.hy,r.hy])if(!inside(r.x+dx,r.y+dy)||!plotOpen(r.x+dx,r.y+dy))return false;
  if(rectOverlapHomesV06(r,{x:28.5,y:28,hx:1.95,hy:1.7})||circleHitsHomeV06(r,10,28,2.1)||circleHitsHomeV06(r,22.7,17.4,1.3)||circleHitsHomeV06(r,20,19,2.1))return false;
  for(const other of state.built){if(other===b)continue;const f=solidFootprint(other.type,other.rotation||0)||[.55,.55];const otherRects=other.type==='cottage'?homeRectsV06(other):[{x:other.x,y:other.y,hx:f[0],hy:f[1]}];if(otherRects.some(a=>rectOverlapHomesV06(r,a)))return false;}
  for(const o of obstacles)if(!state.harvested.includes(o.id)&&circleHitsHomeV06(r,o.x,o.y,.55))return false;
  for(const t of state.terrainEdits||[])if(['pond','hill','tree'].includes(t.type)&&circleHitsHomeV06(r,t.x,t.y,t.type==='tree'?.55:1))return false;
 }
 // The porch is walkable after construction; do not build any module on the player.
 for(const r of rects.slice(1))if(circleHitsHomeV06(r,state.player.x,state.player.y,.28))return false;
 return true;
}
const canSiteBeforeHomeModulesV06=canSite;
canSite=function(x,y,exclude=null,type='path'){
 if(!canSiteBeforeHomeModulesV06(x,y,exclude,type))return false;
 if(type==='cottage'&&exclude&&(exclude.addons?.porch||exclude.addons?.wing)&&!homeModulesFitV06(exclude,x,y))return false;
 const f=solidFootprint(type,exclude?.rotation||0)||[.55,.55],candidate={x,y,hx:f[0],hy:f[1]};
 for(const b of state.built){if(b===exclude||b.type!=='cottage')continue;if(homeRectsV06(b).slice(1).some(r=>rectOverlapHomesV06(candidate,r)))return false;}
 return true;
};
const collidesBeforeHomeModulesV06=collides;
collides=function(x,y){
 if(collidesBeforeHomeModulesV06(x,y))return true;
 for(const b of state.built){if(b.type!=='cottage'||!b.addons?.wing)continue;const r=homeRectsV06(b).at(-1);if(Math.abs(x-r.x)<r.hx+.18&&Math.abs(y-r.y)<r.hy+.18)return true;}
 return false;
};
function homeRoomV06(b){return ensureInterior(b.resident===null?'player':String(b.resident));}
function changeHomeModuleRawV06(index,kind){
 const b=state?.built[index],cfg=HOME_MODULES_V06[kind];if(!b||b.type!=='cottage'||!cfg)return false;
 if(!state.workshopRestored){toast('Restore the workshop to build modular home pieces.');return false;}
 const previousAddons=b.addons;
 b.addons ||= {porch:false,chimney:false,wing:false};
 if(b.addons[kind]){
  if(kind==='wing'&&homeRoomV06(b).items.some(i=>i.x>=6)){toast('Return the furniture in the garden wing to your backpack before removing it.');return false;}
  b.addons[kind]=false;for(const k of ['wood','stone','petals'])state[k]+=Math.floor(cfg[k]/2);toast(cfg.name+' removed. Some materials returned.');
 }else{
  if(!canMake(cfg)){if(!previousAddons)delete b.addons;toast('Gather '+prettyCount(cfg)+' for this home module.');return false;}
  b.addons[kind]=true;
  if(!homeModulesFitV06(b)){b.addons[kind]=false;if(!previousAddons)delete b.addons;toast('This module needs clear land. Move nearby objects, gather resources or move the house first.');return false;}
  for(const k of ['wood','stone','petals'])state[k]-=cfg[k];state.styledHomes++;sound(820);toast(cfg.name+' built. Your home has room to grow.');
 }
 geometryDirty=true;setupNpcs();recoverActors();persist();checkChapter3();updateHUD();showHouseStyle(index);return true;
}
const changeHomeModuleTransactionV06=designTransactionV06(changeHomeModuleRawV06,'homeAddon');
function addHomeModuleV06(index,kind){return changeHomeModuleTransactionV06(index,kind);}
const houseStylesBeforeModulesV06=showHouseStyle;
showHouseStyle=function(index){houseStylesBeforeModulesV06(index);const b=state?.built[index];if(!b||b.type!=='cottage')return;const cards=Object.entries(HOME_MODULES_V06).map(([kind,c])=>`<button class="buildcard" data-home-module="${kind}" data-home-index="${index}" ${!state.workshopRestored?'disabled':''}><span class="symbol">${c.icon}</span><span><b>${b.addons?.[kind]?'Remove ':''}${c.name}</b><small>${b.addons?.[kind]?'Installed · returns half its materials':prettyCount(c)}</small><small>${c.description}</small></span></button>`).join('');$('modalBody').querySelector('.actions')?.insertAdjacentHTML('beforebegin',`<section class="homeModulesV06"><div class="eyebrow">YOUR HOME, ONE PIECE AT A TIME</div><h3>Modular Home Workshop</h3><p class="sub">${state.workshopRestored?'Attach a porch, chimney or room. Keep enough space around the house for each module. Undo and redo include these changes.':'Restore the old workshop in Chapter 2 to unlock home modules.'}</p><div class="cardlist">${cards}</div></section>`);};
document.addEventListener('click',e=>{const b=e.target.closest('[data-home-module]');if(!b)return;e.preventDefault();e.stopPropagation();addHomeModuleV06(Number(b.dataset.homeIndex),b.dataset.homeModule);});
const cottageBeforeHomeModulesV06=cottage;
cottage=function(g,b){cottageBeforeHomeModulesV06(g,b);if(!b.addons)return;const wall=b.style?.wall||'#f8dbaa',roof=b.style?.roof||'#d67b60',windowColor=b.style?.window||'#a3e7e4';g.local(b.x,b.y,(b.rotation||0)*Math.PI/2,()=>{
 if(b.addons.porch){
  g.box(0,1.68,2.5,1.45,.14,'#c5a17b',.01);for(let i=-4;i<=4;i++)g.box(i*.27,1.68,.23,1.4,.025,i%2?'#d8b489':'#ccaa80',.15);
  g.box(0,2.51,1.05,.34,.08,'#b68c64',.015);g.box(0,2.72,1.14,.21,.045,'#d5ad80',.008);
  for(const x of [-1.16,1.16]){g.box(x,1.68,.1,1.48,.1,'#e6c79b',.72);for(const z of [1.05,1.7,2.32])g.box(x,z,.11,.12,.82,'#f1d5a9',.13);}
  for(const x of [-.95,.95]){g.box(x,2.25,.25,.26,.28,'#a67e5c',.16);g.cone(x,2.25,.24,.37,'#7eac68',.4,7);}
 }
 if(b.addons.chimney){
  g.box(-.83,-.55,.49,.52,1.58,'#b9b1a0',1.74);g.box(-.83,-.55,.61,.64,.13,'#d9d1ba',3.22);g.box(-.83,-.55,.39,.4,.03,'#625e56',3.35);
  for(let row=0;row<5;row++){const y=1.88+row*.25;g.box(-.83,-.273,.49,.014,.025,'#8d887b',y);g.box(-.57,-.55,.014,.52,.025,'#8d887b',y);g.box(-.83+(row%2?.12:-.12),-.273,.025,.015,.23,'#8d887b',y);}
 }
 if(b.addons.wing){
  g.box(1.8,-.12,2.02,2.04,1.55,wall);g.box(1.8,-.12,2.15,2.16,.15,'#ae9171',.03);
  g.quad([.65,1.48,-1.3],[2.95,1.48,-1.3],[2.95,2.39,-.12],[.65,2.39,-.12],roof,.82);g.quad([.65,2.39,-.12],[2.95,2.39,-.12],[2.95,1.48,1.07],[.65,1.48,1.07],roof,1.08);
  g.tri([2.81,1.48,-1.16],[2.81,2.37,-.12],[2.81,1.48,.92],wall,.9);
  for(const x of [1.3,2.25]){g.box(x,.928,.52,.1,.57,windowColor,.72);g.box(x,.989,.045,.05,.64,'#fff4d9',.69);g.box(x,.99,.58,.05,.045,'#fff4d9',1.0);}
  g.box(2.84,-.12,.07,.57,.55,windowColor,.75);g.box(2.89,-.12,.05,.045,.61,'#fff4d9',.72);
 }
 });};
// Fallback keeps every addition visible and uses the same collision footprints.
const drawBuildBeforeHomeModulesV06=drawBuild;
drawBuild=function(b,p){drawBuildBeforeHomeModulesV06(b,p);if(b.type!=='cottage'||!b.addons)return;if(b.addons.porch){drawPoly([[p.x-32,p.y+15],[p.x+20,p.y+38],[p.x+42,p.y+24],[p.x-9,p.y+1]],'#d6b489','#a47d58',1);}if(b.addons.wing){const q=proj(b.x+Math.cos((b.rotation||0)*Math.PI/2)*1.8,b.y+Math.sin((b.rotation||0)*Math.PI/2)*1.8);drawPoly([[q.x-25,q.y-20],[q.x,q.y-37],[q.x+27,q.y-18],[q.x,q.y-1]],b.style?.roof||'#d67b60');drawPoly([[q.x-25,q.y-20],[q.x,q.y-1],[q.x,q.y+20],[q.x-25,q.y+4]],b.style?.wall||'#f8dbaa');drawPoly([[q.x,q.y-1],[q.x+27,q.y-18],[q.x+27,q.y+4],[q.x,q.y+20]],'#dec99e');}if(b.addons.chimney){ctx.fillStyle='#aaa292';ctx.fillRect(p.x-26,p.y-94,12,34);ctx.fillStyle='#d9d1bb';ctx.fillRect(p.x-29,p.y-96,18,6);}};
const rotateBeforeHomeModulesV06=rotateSelected;
rotateSelected=function(){const b=designer.chosen||state?.built.find(a=>dist(state.player,a)<2.7);if(b?.type==='cottage'&&(b.addons?.wing||b.addons?.porch)){const next=((b.rotation||0)+1)%4;if(!homeModulesFitV06(b,b.x,b.y,next)){toast('The attached rooms need more space to rotate this house.');return;}}rotateBeforeHomeModulesV06();};
function interiorHomeWithWingV06(){return state.built.find(b=>b.type==='cottage'&&b.addons?.wing&&(uiHomeKey==='player'?b.resident===null:b.resident===Number(uiHomeKey)));}
const interiorBeforeHomeModulesV06=renderInterior;
renderInterior=function(){interiorBeforeHomeModulesV06();if(!interiorHomeWithWingV06())return;const floor=$('interiorOverlay').querySelector('.roomFloor'),tools=$('interiorOverlay').querySelector('.roomTools'),room=ensureInterior(uiHomeKey);if(!floor)return;floor.style.gridTemplateColumns='repeat(8,minmax(0,1fr))';floor.replaceChildren(...Array.from({length:40},(_,i)=>{const x=i%8,y=Math.floor(i/8),item=room.items.find(a=>a.x===x&&a.y===y),tile=document.createElement('button');tile.className='floorTile'+(item?' filled':'');tile.dataset.v04='tile';tile.dataset.x=x;tile.dataset.y=y;tile.setAttribute('aria-label',item?CRAFT_RECIPES[item.id].name:'Empty garden-wing floor space');tile.textContent=item?CRAFT_RECIPES[item.id].icon:'';if(x>=6)tile.style.backgroundColor='#e4e6bd';return tile;}));tools?.insertAdjacentHTML('afterbegin','<p class="sub"><b>Garden wing:</b> two extra columns give this home ten more places for furniture.</p>');};
