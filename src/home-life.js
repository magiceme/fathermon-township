// Furniture remains editable, and a separate Use mode gives a furnished home purpose.
let homePoseV06=null;
function ensureHomeLifeV06(){if(!state)return;const old=state.homeLifeV06;state.homeLifeV06=old&&typeof old==='object'&&!Array.isArray(old)?old:{};const h=state.homeLifeV06;h.totalUses=Number.isFinite(h.totalUses)?Math.max(0,Math.floor(h.totalUses)):0;h.energy=clamp(Number.isFinite(h.energy)?h.energy:75,0,100);h.care=!!h.care&&typeof h.care==='object'?h.care:{};h.diary=(Array.isArray(h.diary)?h.diary:[]).filter(d=>d&&Number.isInteger(d.day)&&typeof d.text==='string').slice(-30).map(d=>({day:d.day,text:d.text.slice(0,240)}));}
function homeItemKeyV06(x,y){return uiHomeKey+':'+x+':'+y;}
function logHomeUseV06(kind,x,y){ensureHomeLifeV06();const key=homeItemKeyV06(x,y)+':'+kind;if(state.homeLifeV06.care[key]===state.day)return false;state.homeLifeV06.care[key]=state.day;state.homeLifeV06.totalUses++;persist();return true;}
function useHomeFurnitureV06(x,y){ensureHomeLifeV06();const item=ensureInterior(uiHomeKey).items.find(i=>i.x===x&&i.y===y);if(!item){toast('Tap a piece of furniture to use it. Choose Place to decorate an empty tile.');return false;}const c=CRAFT_RECIPES[item.id],buttons=[];let text='A little part of the home you made.';
 if(item.id==='bed'){text='A comfortable bed for a fresh start. Sleep advances the township to morning; watered gardens grow one stage.';buttons.push(['sleep','Sleep until morning'],['nap','Take a quiet rest']);}
 else if(['chair','sofa'].includes(item.id)){text='Take a seat and enjoy the home you built.';buttons.push(['sit','Sit and relax'],['read','Read for a while']);}
 else if(item.id==='table'){text='Pull up a chair and enjoy something homemade.';buttons.push(['eat','Eat a meal · 1 meal'],['diary','Write in your home diary']);}
 else if(item.id==='stove'){text='Your little kitchen is ready for cooking.';buttons.push(['cook','Cook a meal'],['pizza','Make pizza at the town pizzeria']);}
 else if(['plant','tropicalPlant'].includes(item.id)){text='A little greenery brightens the room. Give it a daily watering and check its leaves.';buttons.push(['water','Water and care for this plant']);}
 else if(item.id==='aquarium'){text='Watch your little river display, or feed it a pinch of flower food.';buttons.push(['watch','Watch the aquarium'],['feed','Feed the aquarium · 1 flower']);}
 else if(item.id==='lamp'){text='Choose a little warm light or a quieter corner.';buttons.push(['light',item.lit===false?'Switch lamp on':'Switch lamp off']);}
 else if(item.id==='books'){text='A shelf of helpful notes and small stories.';buttons.push(['read','Read a township note'],['diary','Open your home diary'],['journal','Read your story journal']);}
 else if(item.id==='wardrobe'){text='Keep the things that make a house a home in order.';buttons.push(['storage','Organize furniture storage'],['settings','Make yourself comfortable']);}
 else if(item.id==='snowglobe'){text='A tiny snowy scene holds a memory of the highlands.';buttons.push(['globe','Shake the snow globe']);}
 else if(item.id==='rug'){text='A soft spot for a stretch or a moment of quiet.';buttons.push(['nap','Sit on the rug']);}
 showModal(`<div class="eyebrow">YOUR HOME · LIVE A LITTLE</div><h2>${c.icon} ${c.name}</h2><p>${text}</p><p class="sub">Comfort ${Math.round(state.homeLifeV06.energy)} / 100 · ${state.homeLifeV06.totalUses} little home moments</p><div class="actions">${buttons.map(([action,label])=>`<button class="btn ${['eat','feed'].includes(action)?'secondary':''}" data-home-life="${action}" data-home-x="${x}" data-home-y="${y}">${label}</button>`).join('')}<button class="btn secondary" data-ui="close">Back to my room</button></div>`);return true;
}
function showHomeDiaryV06(){ensureHomeLifeV06();showModal(`<div class="eyebrow">A HOME FULL OF SMALL MEMORIES</div><h2>Your home diary</h2><p class="sub">A few words about today, saved with this township.</p><textarea id="homeDiaryEntryV06" maxlength="240" rows="4" aria-label="Today's diary entry" placeholder="Today in my township…"></textarea><div class="actions"><button class="btn" data-home-life="saveDiary">Keep this memory</button><button class="btn secondary" data-ui="close">Back to my room</button></div>${state.homeLifeV06.diary.slice(-8).reverse().map(d=>`<section class="biome-farm-card"><b>Town day ${d.day}</b><p>${esc(d.text)}</p></section>`).join('')}`);}
function performHomeActionV06(action,x,y){ensureHomeLifeV06();const item=ensureInterior(uiHomeKey).items.find(i=>i.x===x&&i.y===y);
 if(action==='saveDiary'){const text=$('homeDiaryEntryV06')?.value.trim().slice(0,240);if(!text)return false;state.homeLifeV06.diary.push({day:state.day,text});state.homeLifeV06.diary=state.homeLifeV06.diary.slice(-30);persist();showHomeDiaryV06();return true;}
 if(!item)return false;homePoseV06={type:action,x,y,key:uiHomeKey,until:performance.now()+6000};
 if(action==='sleep'){logHomeUseV06(action,x,y);state.homeLifeV06.energy=100;rest();renderInterior();toast('Good morning. Your home and a new township day are waiting.');return true;}
 if(action==='eat'){if(state.meals<1){toast('Cook a meal at your stove or camp first.');return false;}state.meals--;state.homeLifeV06.energy=Math.min(100,state.homeLifeV06.energy+25);logHomeUseV06(action,x,y);}
 else if(action==='feed'){if(state.petals<1){toast('Gather a flower for the aquarium food first.');return false;}const key=homeItemKeyV06(x,y)+':feed';if(state.homeLifeV06.care[key]===state.day){toast('The aquarium has already been fed today.');return false;}state.petals--;logHomeUseV06(action,x,y);}
 else if(action==='water'){const fresh=logHomeUseV06(action,x,y);if(!fresh){toast('This houseplant has been watered today. Its leaves look happy.');return false;}state.homeLifeV06.energy=Math.min(100,state.homeLifeV06.energy+3);}
 else if(action==='light'){item.lit=item.lit===false;logHomeUseV06(action,x,y);}
 else if(action==='cook'){showCooking();return true;}
 else if(action==='pizza'){const p=state.built.findIndex(b=>b.type==='pizzeria');if(p<0){toast('Build a town pizzeria to unlock its ovens and recipes.');return false;}showServiceV06(p);return true;}
 else if(action==='storage'){showExpandedBag('furniture');return true;}
 else if(action==='settings'){showControlSettings();return true;}
 else if(action==='journal'){showJournal();return true;}
 else if(action==='diary'){showHomeDiaryV06();return true;}
 else if(action==='read'){logHomeUseV06(action,x,y);const notes=['Watered gardens grow one stage before needing another drink.','A furnished corner is more useful when a friend can sit there.','Some river discoveries prefer a rainy evening.','Hotel visitors need a home and a welcome before they become neighbors.','A new bridge can make an old walk feel like an adventure.','The workshop can turn memories of a biome into a piece of furniture.'];showModal(`<div class="eyebrow">A NOTE FROM THE TOWNSHIP SHELF</div><h2>A quiet page</h2><p>${notes[state.day%notes.length]}</p><div class="actions"><button class="btn" data-ui="close">Return to my reading corner</button></div>`);return true;}
 else{logHomeUseV06(action,x,y);state.homeLifeV06.energy=Math.min(100,state.homeLifeV06.energy+8);}
 persist();hideModal();renderInterior();sound(570);toast(({eat:'A homemade meal tastes better at your own table.',feed:'A little food, a little care. The aquarium is looked after.',water:'Houseplant watered for today.',light:item.lit?'A warm little glow.':'The lamp is off. A quiet corner.',sit:'A moment to enjoy the room you made.',nap:'A little rest does a lot.',watch:'Take a moment to watch the little river display.',globe:'A swirl of snow, a memory of the highlands.'})[action]||'A little home moment.');return true;
}
const useTileBeforeHomeLifeV06=useRoomTileV06;
useRoomTileV06=function(x,y){return roomToolV06==='use'?useHomeFurnitureV06(x,y):useTileBeforeHomeLifeV06(x,y)};
const renderBeforeHomeLifeV06=renderInterior;
renderInterior=function(){renderBeforeHomeLifeV06();const tools=$('interiorOverlay').querySelector('.interiorModeToolsV06');if(tools){tools.querySelector('.actions:nth-of-type(2)')?.insertAdjacentHTML('afterbegin',`<button class="btn ${roomToolV06==='use'?'':'secondary'}" data-room-tool="use" aria-pressed="${roomToolV06==='use'}">Use furniture</button>`);if(roomToolV06==='use')tools.querySelector('p.sub').textContent='Tap furniture to sleep, sit, cook, eat, read, care for plants, or use its other actions. Select Place to decorate.';}};
const homeModalBeforeV06=showModal;
showModal=function(html){$('modal').style.zIndex=$('interiorOverlay')&&!$('interiorOverlay').classList.contains('hidden')?'30':'';homeModalBeforeV06(html)};
const hideHomeModalBeforeV06=hideModal;
hideModal=function(){hideHomeModalBeforeV06();if(!$('interiorOverlay').classList.contains('hidden'))activeModal=true;};
const homeMeshBeforeV06=buildRoomMeshV06;
buildRoomMeshV06=function(){const result=homeMeshBeforeV06();if(!homePoseV06||homePoseV06.key!==uiHomeKey||performance.now()>homePoseV06.until)return result;const char=String(uiHomeKey).startsWith('guest:')?getExtendedGuestModelV06(String(uiHomeKey).slice(6),true):getCharacterModelV06(uiHomeKey==='player'?state.avatar:Number(uiHomeKey),true),start=result.mesh.length-char.length,mesh=result.mesh.slice();if(start<0)return result;const lying=['sleep','nap'].includes(homePoseV06.type),sit=['sit','read','eat'].includes(homePoseV06.type);for(let i=0;i<char.length;i+=8){const x=char[i],y=char[i+1],z=char[i+2];mesh[start+i]=homePoseV06.x+.5+x;mesh[start+i+1]=lying?.42+z:sit?.3+y*.72:y+.03;mesh[start+i+2]=homePoseV06.y+.5+(lying?y-.55:z);}return {...result,mesh};};
const furnitureMeshBeforeHomeLifeV06=roomFurnitureMeshV06;
roomFurnitureMeshV06=function(g,item){if(item.id==='lamp'&&item.lit===false){furnitureMeshBeforeHomeLifeV06(g,{...item,color:'#9b9f8c'});return;}furnitureMeshBeforeHomeLifeV06(g,item);};
const resetBeforeHomeLifeV06=systemsStartReset;
systemsStartReset=function(){resetBeforeHomeLifeV06();ensureHomeLifeV06();roomToolV06='use';homePoseV06=null;};
const updateBeforeHomeLifeV06=gameUpdate;
gameUpdate=function(dt){const atHome=state&&!paused&&!$('interiorOverlay').classList.contains('hidden')&&$('modal').classList.contains('hidden');updateBeforeHomeLifeV06(dt);if(atHome){state.clock+=dt*.045;if(state.clock>=24)dayAdvance();if(Math.floor(state.clock*10)%5===0)updateHUD();}};
DAILY_ACHIEVEMENTS_V06.push({id:'homeMoments',name:'A home to live in',detail:'Enjoy ten furniture activities in your home.',value:()=>state.homeLifeV06?.totalUses||0,target:10,icon:'🛋️'});
document.addEventListener('click',e=>{const b=e.target.closest('[data-home-life]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();performHomeActionV06(b.dataset.homeLife,Number(b.dataset.homeX),Number(b.dataset.homeY));},true);
