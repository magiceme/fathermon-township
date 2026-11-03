/* v0.6 interface and save adapter. Original creature images remain in original-art.js. */
const SLOT_PREFIX='fathermon_township_v06_slot_';
const PREFS_KEY='fathermon_township_v06_preferences';
let activeSlot=1, pendingSlot=1, slotMode='load', titleView='title', storageWarningShown=false;
let preferences={sound:true,lowGraphics:false,controlSize:156,uiScale:100,reducedMotion:false};
try { const p=JSON.parse(localStorage.getItem(PREFS_KEY)||'null'); if(p&&typeof p==='object')preferences={...preferences,...p}; activeSlot=clamp(Number(localStorage.getItem(SLOT_PREFIX+'active'))||1,1,3); } catch {}
const v06BaseMakeState=makeState;
makeState=function(){return {...v06BaseMakeState(),version:6,cameraElevation:.63,characterMode:'3d',dailySocial:{},redoHistory:[],townTheme:'meadow',uiScale:preferences.uiScale,reducedMotion:preferences.reducedMotion,sound:preferences.sound,lowGraphics:preferences.lowGraphics,controlSize:preferences.controlSize};};
function boundedNumber(v,fallback,min=0,max=1000000){return Number.isFinite(v)?clamp(v,min,max):fallback;}
function normalizeV06(v){
 if(!v||typeof v!=='object'||Array.isArray(v))throw Error('The save does not contain a township.');
 if(![3,4,5,6].includes(v.version))throw Error('Supported save versions are 0.3, 0.4, 0.5 and 0.6.');
 if(!Number.isInteger(v.avatar)||v.avatar<0||v.avatar>=10)throw Error('Invalid Fathermon selection.');
 const d=makeState(),r={...d,...v,version:6};
 for(const k of ['day','coins','wood','stone','petals','fish','bugs','meals','talkCount','craftedCount','interiorPlaced','gardensHarvested','fulfilledRequests','styledHomes','movedBuildings'])r[k]=Math.floor(boundedNumber(v[k],d[k]||0,k==='day'?1:0));
 r.clock=boundedNumber(v.clock,8.6,0,23.999);r.quest=Math.floor(boundedNumber(v.quest,0,0,6));r.chapter2Step=Math.floor(boundedNumber(v.chapter2Step,0,0,6));r.chapter3Step=Math.floor(boundedNumber(v.chapter3Step,0,0,6));
 for(const k of Object.keys(d).filter(k=>typeof d[k]==='boolean'))r[k]=v[k]===undefined?d[k]:v[k]===true;
 r.townName=safeName(v.townName);r.townTheme=['meadow','rose','coast'].includes(v.townTheme)?v.townTheme:'meadow';
 r.weather=['sunny','drizzle'].includes(v.weather)?v.weather:'sunny';
 r.player={x:boundedNumber(v.player?.x,20.5,WORLD_V06.minX+2,WORLD_V06.maxX-2),y:boundedNumber(v.player?.y,18.5,WORLD_V06.minY+2,WORLD_V06.maxY-2)};
 r.friendships=Array.from({length:10},(_,i)=>Math.floor(boundedNumber(v.friendships?.[i],0)));
 for(const k of ['residents','invited','talked'])r[k]=[...new Set((Array.isArray(v[k])?v[k]:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<10&&i!==v.avatar))];
 r.gathered={wood:boundedNumber(v.gathered?.wood,0),stone:boundedNumber(v.gathered?.stone,0),petals:boundedNumber(v.gathered?.petals,0)};
 r.harvested=(Array.isArray(v.harvested)?v.harvested:[]).filter(x=>typeof x==='string').slice(0,3000);
 const colors=val=>typeof val==='string'&&/^#[a-f0-9]{6}$/i.test(val);
 r.built=(Array.isArray(v.built)?v.built:[]).filter(b=>b&&COST[b.type]&&Number.isFinite(b.x)&&Number.isFinite(b.y)).slice(0,1000).map(b=>{
  const style={};for(const k of ['wall','roof','door','window'])if(colors(b.style?.[k]))style[k]=b.style[k];
  for(const k of ['layout','roofShape','doorShape','windowShape'])if(exteriorOptions[k]?.some(a=>a[1]===b.style?.[k]))style[k]=b.style[k];
  return {uid:typeof b.uid==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(b.uid)?b.uid:undefined,guestResident:/^ext[0-2][0-9]$/.test(b.guestResident||'')?b.guestResident:null,guestPlot:typeof b.guestPlot==='string'?b.guestPlot.slice(0,50):null,level:Math.floor(boundedNumber(b.level,1,1,3)),wateredAtV06:boundedNumber(b.wateredAtV06,0,0,1e15),addons:{porch:b.addons?.porch===true,chimney:b.addons?.chimney===true,wing:b.addons?.wing===true},type:b.type,x:clamp(b.x,WORLD_V06.minX+2,WORLD_V06.maxX-2),y:clamp(b.y,WORLD_V06.minY+2,WORLD_V06.maxY-2),resident:b.type==='cottage'&&r.residents.includes(b.resident)?b.resident:null,rotation:Math.floor(boundedNumber(b.rotation,0,0,3)),style,crop:['vegetable','sungrain','frostberry','junglefruit'].includes(b.crop)?b.crop:'vegetable',growth:boundedNumber(b.growth,0,0,3),watered:b.watered===true};
 });
 r.terrainEdits=(Array.isArray(v.terrainEdits)?v.terrainEdits:[]).filter(t=>t&&terrainDefs.some(d=>d[0]===t.type)&&Number.isFinite(t.x)&&Number.isFinite(t.y)).slice(0,2000).map(t=>({type:t.type,x:clamp(t.x,WORLD_V06.minX+2,WORLD_V06.maxX-2),y:clamp(t.y,WORLD_V06.minY+2,WORLD_V06.maxY-2)}));
 r.expansions=[...new Set((Array.isArray(v.expansions)?v.expansions:[]).filter(x=>expansionDefs.some(d=>d.id===x)))];
 r.furniture={};for(const id of Object.keys(CRAFT_RECIPES))r.furniture[id]=Math.floor(boundedNumber(v.furniture?.[id],0));
 r.interiors={};for(const k of ['player',...Array.from({length:10},(_,i)=>String(i)),...Array.from({length:30},(_,i)=>'guest:ext'+String(i).padStart(2,'0'))]){
  const room=v.interiors?.[k];if(!room&&k!=='player')continue;
  r.interiors[k]={wall:colors(room?.wall)?room.wall:'#fff2db',floor:colors(room?.floor)?room.floor:'#d4a87c',items:(Array.isArray(room?.items)?room.items:[]).filter(a=>a&&CRAFT_RECIPES[a.id]&&Number.isInteger(a.x)&&Number.isInteger(a.y)&&a.x>=0&&a.x<8&&a.y>=0&&a.y<5).slice(0,40).map(a=>({id:a.id,x:a.x,y:a.y,...(typeof a.lit==='boolean'?{lit:a.lit}:{}),rotation:Math.floor(boundedNumber(a.rotation,0,0,3)),...(colors(a.color)?{color:a.color}:{})}))};
 }
 r.requests={};for(const i of r.residents){const q=v.requests?.[i];if(q&&['wood','stone','petals','fish','bugs'].includes(q.type))r.requests[i]={type:q.type,count:1,done:q.done===true,day:Math.floor(boundedNumber(q.day,r.day,1))};}
 r.dailySocial={};for(const i of r.residents){const q=v.dailySocial?.[i];if(q&&typeof q==='object')r.dailySocial[i]={...q};}
 // History is transient; never execute imported history objects against game state.
 r.undoHistory=[];r.redoHistory=[];
 r.cameraAngle=boundedNumber(v.cameraAngle,.8,-1000,1000);r.cameraElevation=boundedNumber(v.cameraElevation,.79,.32,1.22);r.zoom=boundedNumber(v.zoom,1,.78,1.5);r.controlSize=boundedNumber(v.controlSize,156,125,200);r.uiScale=boundedNumber(v.uiScale,100,85,115);
 return r;
}
function readSlot(slot){try{const record=JSON.parse(localStorage.getItem(SLOT_PREFIX+slot)||'null');if(!record?.save)return null;return {save:normalizeV06(record.save),savedAt:typeof record.savedAt==='string'?record.savedAt:null};}catch{return null;}}
function migrateLegacySave(){
 if([1,2,3].some(i=>readSlot(i)))return;
 for(const key of [V05_KEY,SAVE_KEY,'fathermon_township_v03_first_resident_save']){
  try{const raw=localStorage.getItem(key);if(!raw)continue;const save=normalizeV06(JSON.parse(raw));localStorage.setItem(SLOT_PREFIX+'1',JSON.stringify({save,savedAt:new Date().toISOString(),migratedFrom:save.version}));activeSlot=1;return;}catch{}
 }
}
loadSave=function(){return readSlot(activeSlot)?.save||null;};
persist=function(){
 if(!state)return false;
 try{state.version=6;state.cameraAngle=scene3d.yaw;state.cameraElevation=scene3d.pitch;localStorage.setItem(SLOT_PREFIX+activeSlot,JSON.stringify({save:state,savedAt:new Date().toISOString()}));localStorage.setItem(SLOT_PREFIX+'active',String(activeSlot));return true;}
 catch{if(!storageWarningShown){toast('Storage is unavailable or full. Export a backup from the menu.',6000);storageWarningShown=true;}return false;}
};
function applyPreferences(){
 audioOn=state&&!paused?state.sound!==false:preferences.sound!==false;
 document.documentElement.classList.toggle('reduce-motion',!!preferences.reducedMotion);
 document.documentElement.style.setProperty('--ui-scale',boundedNumber(preferences.uiScale,100,85,115)/100);
 setControlSize(state&&!paused?state.controlSize:preferences.controlSize);
}
function storePreferences(){try{localStorage.setItem(PREFS_KEY,JSON.stringify(preferences));}catch{}applyPreferences();if(state&&!paused){state.sound=preferences.sound;state.lowGraphics=preferences.lowGraphics;state.uiScale=preferences.uiScale;state.reducedMotion=preferences.reducedMotion;state.controlSize=preferences.controlSize;persist();}}
startGame=function(fromSave=false){
 const loaded=fromSave?loadSave():null;if(fromSave&&!loaded){toast('This slot is empty or cannot be read.');return;}
 state=loaded||makeState();if(!fromSave){state.avatar=selected;state.townName=safeName($('townInput')?.value);state.townTheme=$('townTheme')?.value||'meadow';}
 selected=state.avatar;walkTarget=null;pendingTalk=null;keys.clear();joyX=joyY=0;tick=0;lastFrame=0;miniFishing=null;
 closeOverlays();hideModal();stopDesigner();setupWorld();setupNpcs();resize();currentZoom=state.zoom||1;setZoom(currentZoom);scene3d.yaw=state.cameraAngle??.8;scene3d.pitch=state.cameraElevation??.79;
 preferences={...preferences,sound:state.sound,lowGraphics:state.lowGraphics,controlSize:state.controlSize,uiScale:state.uiScale||100,reducedMotion:state.reducedMotion};
 paused=false;document.body.classList.add('playing');$('intro').classList.add('hidden');applyPreferences();document.title='Fathermon Township · Build Your Dream Town v0.6';
 if(typeof systemsStartReset==='function')systemsStartReset();
 updateHUD();persist();
 if(!fromSave&&!state.storyStarted){state.storyStarted=true;persist();showOpening();}else toast('Welcome back to '+state.townName+' · Slot '+activeSlot,3500);
};
function townPreview(save){
 const buildings=save.built.slice(0,18).map(b=>`<i class="preview-building ${b.type}" style="left:${10+b.x/W*77}%;top:${10+b.y/H*68}%">${COST[b.type]?.icon||'🌿'}</i>`).join('');
 return `<div class="slot-preview ${save.townTheme}" aria-hidden="true"><span class="preview-road"></span><span class="preview-pond"></span><span class="preview-tree">🌲</span><span class="preview-camp">⛺</span>${buildings}<img src="${FILES[save.avatar]}" alt=""></div>`;
}
function slotStamp(record){if(!record.savedAt)return 'Imported township';const d=new Date(record.savedAt);return Number.isNaN(d.getTime())?'Saved township':d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}
function showSlots(mode='load'){
 slotMode=mode;showModal(`<div class="eyebrow">YOUR TOWNSHIPS · THREE SAVE SLOTS</div><h2>${mode==='new'?'A new beginning':mode==='save'?'Save your township':mode==='import'?'Import a backup':'Choose a township'}</h2><p class="sub">${mode==='new'?'Choose a slot for your new town. Existing towns ask before replacement.':mode==='save'?'Your active slot saves automatically. You can also save a copy in another slot.':'Each township has its own residents, home and story progress.'}</p><div class="save-slots">${[1,2,3].map(i=>{const r=readSlot(i),s=r?.save;return `<button class="save-slot ${i===activeSlot?'active':''}" data-ui="slot" data-slot="${i}" ${mode==='load'&&!r?'disabled':''}><span class="slot-number">SLOT ${i}${i===activeSlot?' · ACTIVE':''}</span>${s?townPreview(s):'<div class="slot-preview empty">＋<small>A little space for a big dream</small></div>'}<strong>${s?esc(s.townName):'An empty meadow'}</strong><span>${s?`${NAMES[s.avatar]} · Day ${s.day} · ${s.residents.length+1} resident${s.residents.length?'s':''}`:'Start a new township here'}</span><small>${r?esc(slotStamp(r)):'No save yet'}</small></button>`;}).join('')}</div><div class="actions"><button class="btn secondary" data-ui="backSlots">Back</button>${mode==='load'?'<button class="btn secondary" data-ui="importPicker">Import JSON backup</button>':''}</div><p class="sub">Saves stay in this browser. Export a backup to move between devices.</p>`);
}
function confirmSlot(slot,mode){
 const existing=readSlot(slot);if(existing&&mode!=='load'){
 showModal(`<div class="eyebrow">SLOT ${slot}</div><h2>Replace ${esc(existing.save.townName)}?</h2><p>This replaces the town in this slot. Export a backup first if you want to keep it.</p><div class="actions"><button class="btn warn" data-ui="confirmSlot" data-slot="${slot}" data-mode="${mode}">Replace this slot</button><button class="btn secondary" data-ui="cancelSlot" data-mode="${mode}">Keep it</button></div>`);return;
 }useSlot(slot,mode);
}
function useSlot(slot,mode){
 pendingSlot=slot;
 if(mode==='new'){activeSlot=slot;hideModal();showCharacterSetup();}
 else if(mode==='load'){activeSlot=slot;startGame(true);}
 else if(mode==='save'){activeSlot=slot;const ok=persist();hideModal();toast(ok?'Township saved to slot '+slot:'Could not save. Export a backup.');}
 else if(mode==='import'){importIntoSlot(slot);}
}
const titleScenery=`<div class="title-scenery" aria-hidden="true"><div class="scenery-sun"></div><div class="scenery-cloud c1"></div><div class="scenery-cloud c2"></div><div class="scenery-hill back"></div><div class="scenery-hill front"></div><div class="scenery-river"></div><div class="scenery-tree t1"><i></i></div><div class="scenery-tree t2"><i></i></div><div class="scenery-tree t3"><i></i></div><div class="scenery-tent"></div><div class="scenery-flower f1">✿</div><div class="scenery-flower f2">✿</div><div class="scenery-flower f3">✿</div><div class="scenery-leaf l1">✦</div><div class="scenery-leaf l2">✦</div></div>`;
showIntro=function(){
 migrateLegacySave();paused=true;titleView='title';walkTarget=null;keys.clear();closeOverlays();hideModal();document.body.classList.remove('playing');$('intro').classList.remove('hidden');
 const saved=[1,2,3].map(i=>({slot:i,record:readSlot(i)})).filter(x=>x.record);const newest=saved.sort((a,b)=>(b.record.savedAt||'').localeCompare(a.record.savedAt||''))[0];if(!readSlot(activeSlot)&&newest)activeSlot=newest.slot;
 $('intro').innerHTML=`${titleScenery}<div class="title-layout"><section class="title-story"><div class="studio-wordmark"><span class="studio-orbit">◌</span> SAYVEROCEAN <small>GAME STUDIO</small></div><div class="title-kicker">A LITTLE MEADOW. AN ENTIRE POSSIBILITY.</div><h1 class="logo">Fathermon<span>Township</span></h1><p class="subtitle">Every great town starts with one new friend.<br>This time, that friend is you.</p><div class="title-characters">${[0,5,2].map((i,k)=>`<img class="title-character character-${k}" src="${FILES[i]}" alt="${NAMES[i]}">`).join('')}</div><div class="edition">BUILD YOUR DREAM TOWN <span>v0.6 BETA</span></div></section><section class="title-menu"><div class="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h2>Make yourself at home.</h2><p>Arrive in an empty township. Make it yours, one cozy corner at a time.</p><button class="title-button main" data-ui="new"><span>✧</span><div>New Game<small>A meadow full of possibility</small></div><b>→</b></button><button class="title-button" id="continueBtn" data-ui="continue" ${saved.length?'':'disabled'}><span>▷</span><div>Continue<small>${saved.length?esc(readSlot(activeSlot)?.save.townName||'Your township'):'Your story is waiting to begin'}</small></div></button><button class="title-button" data-ui="load"><span>▤</span><div>Load Game<small>Three little worlds to call home</small></div></button><div class="title-secondary"><button data-ui="settings">⚙ Settings</button><button data-ui="credits">♡ Credits</button></div><p class="title-note">Ten original Fathermon. A town that grows with you.</p></section></div><div class="title-footer">© SayverOcean Game Studio <span>Original Fathermon artwork · Offline play</span></div>`;
 applyPreferences();
};
function showCharacterSetup(){
 titleView='character';$('intro').innerHTML=`${titleScenery}<div class="setup-panel"><div class="setup-heading"><div><div class="eyebrow">NEW GAME · SLOT ${activeSlot}</div><h1>Who will begin the story?</h1><p>Choose your first resident. The other Fathermon will arrive when you invite them.</p></div><button class="btn secondary" data-ui="title">← Title</button></div><div class="setup-body"><div class="selected-resident"><img id="selectedArt" src="${FILES[selected]}" alt="${NAMES[selected]}"><h2 id="selectedName">${NAMES[selected]}</h2><span>YOUR FIRST RESIDENT</span><p>A backpack, a forgotten invitation,<br>and a place to begin again.</p></div><div><div class="cards" id="charPicker">${NAMES.map((n,i)=>`<button class="charcard ${i===selected?'selected':''}" data-ui="character" data-char="${i}" aria-pressed="${i===selected}"><img src="${FILES[i]}" alt="Original ${n} drawing"><span>${n}</span></button>`).join('')}</div><div class="setup-customization"><label for="townInput">What will you call your township?<input id="townInput" maxlength="22" value="Sunmeadow" autocomplete="off" placeholder="Sunmeadow"></label><label for="townTheme">Your town's welcome colors<select id="townTheme"><option value="meadow">Meadow green</option><option value="rose">Wildflower rose</option><option value="coast">Coastal blue</option></select></label></div><div class="actions"><button class="btn begin-button" id="startBtn" data-ui="begin">Begin my township <span>→</span></button></div><p class="sub">Only you live here at first. Every neighbor needs a home and an invitation.</p></div></div></div>`;
}
showControlSettings=function(){
 const p=state&&!paused?{...preferences,...state}:preferences;
 showModal(`<div class="eyebrow">SETTLE IN · SETTINGS</div><h2>A little more comfortable</h2><div class="settings-grid"><label class="setting-card"><span>Sound effects<small>Gentle interaction sounds</small></span><input type="checkbox" data-pref="sound" ${p.sound?'checked':''}></label><label class="setting-card"><span>Low graphics<small>Fewer details, lower resolution</small></span><input type="checkbox" data-pref="lowGraphics" ${p.lowGraphics?'checked':''}></label><label class="setting-card"><span>Reduce motion<small>Quiet title and menu animations</small></span><input type="checkbox" data-pref="reducedMotion" ${p.reducedMotion?'checked':''}></label><label class="setting-card"><span>Joystick size<small>Adjust your touch controls</small></span><input aria-label="Joystick size" type="range" min="125" max="200" value="${p.controlSize||156}" data-pref="controlSize"></label><label class="setting-card"><span>Interface size<small>Menu text and touch targets</small></span><input aria-label="Interface size" type="range" min="85" max="115" value="${p.uiScale||100}" data-pref="uiScale"></label>${state&&!paused?`<label class="setting-card"><span>Camera zoom<small>Pinch or use + / − in town</small></span><input aria-label="Camera zoom" type="range" min="78" max="150" value="${Math.round(currentZoom*100)}" data-pref="zoom"></label>`:''}</div><div class="controlsGuide"><b>Keyboard:</b> WASD / arrows move · E interact · G gather · B build · I bag · J journal · Q / P rotate · Esc menu<br><b>Touch:</b> joystick · tap to walk or interact · two fingers to orbit and pinch to zoom<br><b>Mouse:</b> tap ground · right drag to orbit · wheel to zoom</div><div class="actions"><button class="btn" data-ui="close">Done</button>${!paused?'<button class="btn secondary" data-v04="fullscreen">Fullscreen</button>':''}</div>`);
};
function showCredits(){showModal(`<div class="eyebrow">MADE WITH A LITTLE WONDER</div><h2>Fathermon Township</h2><p class="credit-studio">SayverOcean Game Studio</p><p>Original Fathermon character designs and artwork are preserved from the supplied v0.5 build.</p><div class="credit-art">${NAMES.map((n,i)=>`<img src="${FILES[i]}" alt="${n}">`).join('')}</div><p>Machappy · Rockrool · Protexture · Hearic · Robome · Happier · Capa · Senera · Bara · Mirospo</p><p class="sub">Build Your Dream Town · Version 0.6<br>Continuing the original township, its three chapters, and your own story.</p><div class="actions"><button class="btn" data-ui="close">Back</button></div>`);}
exportSave=function(){
 if(!state)return;persist();const blob=new Blob([JSON.stringify({format:'FathermonTownship',version:6,save:state},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Fathermon_Township_v06_'+safeName(state.townName).replace(/\W/g,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);toast('Township backup exported.');
};
function importIntoSlot(slot){
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.setAttribute('aria-label','Import township backup');
 input.onchange=async()=>{const f=input.files?.[0];if(!f)return;try{if(f.size>5000000)throw Error('Please use a JSON backup smaller than 5 MB.');const payload=JSON.parse(await f.text());if(payload.format!=='FathermonTownship'||![3,4,5,6].includes(payload.version))throw Error('Choose an exported Fathermon Township backup.');const imported=normalizeV06(payload.save);localStorage.setItem(SLOT_PREFIX+slot,JSON.stringify({save:imported,savedAt:new Date().toISOString()}));activeSlot=slot;startGame(true);toast('Backup imported into slot '+slot+'. Earlier saves were kept.');}catch(err){showModal(`<h2>That backup could not be imported</h2><p>${esc(err.message)}</p><div class="actions"><button class="btn" data-ui="load">Back to saves</button></div>`);}};input.click();
}
importSave=function(){showSlots('import');};
const v06OldPanel=showPanel;
showPanel=function(panel){
 if(panel==='menu'){
 showModal(`<div class="eyebrow">${esc(state.townName)} · DAY ${state.day} · SLOT ${activeSlot}</div><h2>A moment in your township</h2><p class="sub">Build Your Dream Town v0.6 · ${NAMES[state.avatar]} · Your township saves automatically.</p><div class="hubgrid"><button data-v04="town">✧ <b>Town activities</b><small>Craft, grow and explore</small></button><button data-v04="journal">▤ <b>Story journal</b><small>Your next little milestone</small></button><button data-ui="settings">⚙ <b>Settings</b><small>Graphics and controls</small></button><button data-ui="saveSlots">▣ <b>Save slots</b><small>Save a copy or load a town</small></button><button data-v04="export">↗ <b>Export backup</b><small>Keep your township safe</small></button><button data-ui="importPicker">↙ <b>Import backup</b><small>Bring another town home</small></button><button data-v04="rest">☾ <b>Rest until tomorrow</b><small>Fresh supplies and new routines</small></button><button data-ui="returnTitle">⌂ <b>Title screen</b><small>Save and take a break</small></button></div><div class="actions"><button class="btn" data-ui="close">Return to town</button><button class="btn secondary" data-ui="save">Save now</button></div>`);return;
 }
 v06OldPanel(panel);
};
function v06UiAction(e){
 const button=e.target.closest('[data-ui]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();const a=button.dataset.ui;
 if(a==='new')showSlots('new');else if(a==='continue')startGame(true);else if(a==='load')showSlots('load');else if(a==='settings')showControlSettings();else if(a==='credits')showCredits();else if(a==='close')hideModal();else if(a==='title')showIntro();
 else if(a==='slot')confirmSlot(Number(button.dataset.slot),slotMode);else if(a==='confirmSlot')useSlot(Number(button.dataset.slot),button.dataset.mode);else if(a==='cancelSlot')showSlots(button.dataset.mode);else if(a==='backSlots'){if(paused)hideModal();else showPanel('menu');}
 else if(a==='character'){selected=Number(button.dataset.char);$('charPicker').querySelectorAll('.charcard').forEach((b,i)=>{b.classList.toggle('selected',i===selected);b.setAttribute('aria-pressed',String(i===selected));});$('selectedArt').src=FILES[selected];$('selectedArt').alt=NAMES[selected];$('selectedName').textContent=NAMES[selected];sound(620);}
 else if(a==='begin')startGame(false);else if(a==='saveSlots'){showSlots('save');$('modalBody').querySelector('.actions').insertAdjacentHTML('beforeend','<button class="btn secondary" data-ui="load">Load another town</button>');}
 else if(a==='importPicker')showSlots('import');else if(a==='returnTitle'){persist();showIntro();}else if(a==='save'){const ok=persist();hideModal();toast(ok?'Township saved to slot '+activeSlot+'.':'Storage is unavailable. Export a backup.');}
}
document.addEventListener('click',v06UiAction,true);
document.addEventListener('input',e=>{const k=e.target.dataset.pref;if(!k)return;if(k==='zoom'){setZoom(Number(e.target.value)/100);return;}preferences[k]=e.target.type==='checkbox'?e.target.checked:Number(e.target.value);storePreferences();});
// A modal never leaves keyboard movement held down or lets focus disappear behind it.
const v06ShowModal=showModal,interfaceHideModalV06=hideModal;let modalReturnFocus=null;
showModal=function(html){if($('modal').classList.contains('hidden'))modalReturnFocus=document.activeElement;v06ShowModal(html);walkTarget=null;joyX=joyY=0;requestAnimationFrame(()=>{if(activeModal&&!$('modal').classList.contains('hidden'))$('modalBody').querySelector('button:not([disabled]),input,select')?.focus({preventScroll:true});});};
hideModal=function(){interfaceHideModalV06();keys.clear();if(modalReturnFocus?.isConnected)modalReturnFocus.focus({preventScroll:true});};
document.addEventListener('keydown',e=>{if(e.key!=='Tab'||$('modal').classList.contains('hidden'))return;const f=[...$('modal').querySelectorAll('button:not([disabled]),input,select,[tabindex="0"]')].filter(x=>x.getClientRects().length);if(!f.length)return;const i=f.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();f.at(-1).focus();}else if(!e.shiftKey&&(i===f.length-1||i<0)){e.preventDefault();f[0].focus();}},true);
// Save at a modest interval and when the browser suspends; local backups remain exportable.
setInterval(()=>{if(state&&!paused)persist();},20000);
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();joyX=joyY=0;if(state&&!paused)persist();}});
$('gameWrap').querySelector('.brand small').textContent='BUILD YOUR DREAM TOWN · 0.6';
const splash=document.createElement('div');splash.id='studioSplash';splash.innerHTML='<div class="splash-emblem">◌</div><strong>SAYVEROCEAN</strong><span>GAME STUDIO</span><small>A little world. A new beginning.</small><button aria-label="Skip studio splash">Continue →</button>';document.body.append(splash);splash.querySelector('button').onclick=()=>splash.remove();setTimeout(()=>splash.remove(),1800);

// Inventory categories keep supplies, discoveries and furniture easy to browse.
let bagCategoryV06='all';
showExpandedBag=function(category=bagCategoryV06){bagCategoryV06=category;const items=[
 ['wood','🪵','Wood','materials'],['stone','🪨','Stone','materials'],['petals','🌼','Flowers','materials'],['fish','🐟','Pond fish','discoveries'],['bugs','🦋','Meadow bugs','discoveries'],['meals','🍲','Meadow Soup','discoveries'],['coins','🪙','Coins','materials'],
 ...Object.entries(CRAFT_RECIPES).map(([id,c])=>[id,c.icon,c.name,'furniture'])];
 showModal(`<div class="eyebrow">A PLACE FOR LITTLE TREASURES</div><h2>Your backpack</h2><div class="bag-tabs" role="group" aria-label="Item categories">${[['all','Everything'],['materials','Materials'],['discoveries','Discoveries'],['furniture','Furniture']].map(([id,label])=>`<button class="${category===id?'active':''}" data-bag-category="${id}" aria-pressed="${category===id}">${label}</button>`).join('')}</div><div class="bag-grid">${items.filter(i=>category==='all'||category===i[3]).map(([id,icon,name,group])=>`<div class="bag-item"><span>${icon}</span><div><strong>${group==='furniture'?state.furniture[id]||0:state[id]||0}</strong><small>${name}</small></div></div>`).join('')}</div><p class="sub">Craft furniture at the restored workshop, then place it inside your home. Discoveries make thoughtful gifts.</p><div class="actions"><button class="btn" data-v04="workshop">Visit workshop</button><button class="btn secondary" data-ui="close">Back to town</button></div>`);
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-bag-category]');if(b)showExpandedBag(b.dataset.bagCategory)});
const settingsBeforeRenderModeV06=showControlSettings;
showControlSettings=function(){settingsBeforeRenderModeV06();if(state&&!paused)$('modalBody').querySelector('.settings-grid').insertAdjacentHTML('beforeend',`<label class="setting-card"><span>World renderer<small>Use isometric mode on older devices</small></span><select aria-label="World renderer" id="renderModeV06"><option value="3d" ${state.renderMode!=='2d'?'selected':''}>3D town</option><option value="2d" ${state.renderMode==='2d'?'selected':''}>Isometric town</option></select></label>`);};
document.addEventListener('change',e=>{if(e.target.id==='renderModeV06')setRenderMode(e.target.value)});
const showOpeningPageBeforeV06=showOpeningPage;
let arrivalCameraV06=null;
showOpeningPage=function(){showOpeningPageBeforeV06();if(!state.reducedMotion)arrivalCameraV06={begin:performance.now(),from:scene3d.yaw,to:.8+openingPage*.14};const hero=$('modalBody').querySelector('.storyHero');hero?.insertAdjacentHTML('afterend',`<div class="arrival-portrait">${sceneImage(state.avatar)}<span>${NAMES[state.avatar]}<small>First resident · ${esc(state.townName)}</small></span></div>`);};
const cameraBeforeArrivalV06=updateCamera;
updateCamera=function(){if(arrivalCameraV06){let t=clamp((performance.now()-arrivalCameraV06.begin)/1600,0,1);scene3d.yaw=ease(arrivalCameraV06.from,arrivalCameraV06.to,t*t*(3-2*t));if(t===1)arrivalCameraV06=null;}cameraBeforeArrivalV06();};
const applyPreferencesBeforeThemeV06=applyPreferences;
applyPreferences=function(){applyPreferencesBeforeThemeV06();document.body.dataset.townTheme=state&&!paused?state.townTheme:'meadow';};
const modalWithAriaV06=showModal;
showModal=function(html){modalWithAriaV06(html);const panel=$('modal');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',$('modalBody').querySelector('h2')?.textContent||'Township');};
