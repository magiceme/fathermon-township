/* Original township building loops: inspiration from gathering, creative furniture,
   and resident-designed places. These optional projects never replace story gates. */
const ARTISAN_TYPES_V06={
 artisanBench:{name:'Handmade Garden Seat',icon:'🪑',wood:3,stone:1,petals:1,base:'bench'},
 artisanTable:{name:'Handmade Picnic Table',icon:'🧺',wood:4,stone:1,petals:1,base:'table'},
 artisanPlanter:{name:'Handmade Flower Trough',icon:'🪴',wood:2,stone:1,petals:2,base:'planter'}
};
const ARTISAN_PALETTES_V06={honey:{name:'Honey oak',body:'#bd8c59',accent:'#f0ce80'},sage:{name:'Sage garden',body:'#84a58b',accent:'#d9e2ad'},rose:{name:'Wildflower rose',body:'#bc8b98',accent:'#f1d7c1'},coast:{name:'Coastal blue',body:'#709da8',accent:'#d6e7d9'}};
const ARTISAN_MOTIFS_V06={leaf:{name:'Little leaves',color:'#6baf6b',icon:'🌿'},sun:{name:'Sun circles',color:'#f2ca6a',icon:'☀️'},ripple:{name:'Pond ripples',color:'#81c7cf',icon:'💧'}};
Object.assign(COST,ARTISAN_TYPES_V06);
const communityStatesInitializedV06=new WeakSet();
function ensureCommunityV06(){
 if(!state||communityStatesInitializedV06.has(state))return;
 state.inspirationEarned=Number.isFinite(state.inspirationEarned)?Math.floor(clamp(state.inspirationEarned,0,1000000)):0;
 const d=state.nextArtisanDesign||{};
 state.nextArtisanDesign={type:ARTISAN_TYPES_V06[d.type]?d.type:'artisanBench',palette:ARTISAN_PALETTES_V06[d.palette]?d.palette:'honey',motif:ARTISAN_MOTIFS_V06[d.motif]?d.motif:'leaf'};
 const validId=id=>id==='garden'||id==='pond'||/^welcome:[0-9]$/.test(id);
 for(const key of ['communityProjects','communityPicnics']){
  const old=state[key];state[key]={};
  if(old&&typeof old==='object'&&!Array.isArray(old))for(const [id,value] of Object.entries(old)){
   if(!validId(id))continue;
   if(key==='communityProjects'&&value&&Number.isFinite(value.day))state[key][id]={day:Math.floor(clamp(value.day,1,1000000))};
   if(key==='communityPicnics'&&Number.isFinite(value))state[key][id]=Math.floor(clamp(value,1,1000000));
  }
 }
 communityStatesInitializedV06.add(state);
 const event=state.communityGathering;
 if(!event||!validId(event.id)||!Number.isFinite(event.day)||!Number.isFinite(event.untilClock))state.communityGathering=null;
}
function artisanInspirationV06(){ensureCommunityV06();return Math.max(0,state.inspirationEarned-state.built.filter(b=>ARTISAN_TYPES_V06[b.type]).length*3);}
const gatherBeforeCommunityV06=gather;
gather=function(o){if(!state||!o)return;ensureCommunityV06();const was=state.harvested.includes(o.id);gatherBeforeCommunityV06(o);if(!was&&state.harvested.includes(o.id)){state.inspirationEarned++;persist();toast('✧ A new idea! +1 Inspiration · '+artisanInspirationV06()+' ready to use',2400);}};
function artisanReadyV06(type,explain=false){
 if(!ARTISAN_TYPES_V06[type])return true;
 if(!state.workshopRestored){if(explain)toast('Restore the story workshop before making custom furniture.');return false;}
 if(artisanInspirationV06()<3){if(explain)toast('Gather three new resources to collect 3 Inspiration first.');return false;}
 return true;
}
const canAffordBeforeCommunityV06=canAfford;
canAfford=function(type){return !!COST[type]&&canAffordBeforeCommunityV06(type)&&artisanReadyV06(type);};
const startPlacingBeforeCommunityV06=startPlacing;
startPlacing=function(type){if(!artisanReadyV06(type,true))return;startPlacingBeforeCommunityV06(type);};
const designerBeforeCommunityV06=activateDesigner;
activateDesigner=function(mode,type){if(mode==='place'&&!artisanReadyV06(type,true))return;designerBeforeCommunityV06(mode,type);};
const footprintBeforeCommunityV06=solidFootprint;
solidFootprint=function(type,rotation=0){const size=type==='artisanBench'?[.92,.5]:type==='artisanTable'?[.92,.72]:type==='artisanPlanter'?[.74,.55]:null;if(size)return rotation%2?[size[1],size[0]]:size;return footprintBeforeCommunityV06(type,rotation);};
const buildBeforeCommunityV06=buildAt;
buildAt=function(x,y){const type=placing;if(!artisanReadyV06(type,true))return;const n=state.built.length;buildBeforeCommunityV06(x,y);if(ARTISAN_TYPES_V06[type]&&state.built.length===n+1){
 ensureCommunityV06();const chosen=state.nextArtisanDesign,palette=ARTISAN_PALETTES_V06[chosen.palette],motif=ARTISAN_MOTIFS_V06[chosen.motif],b=state.built.at(-1);
 b.style={...(b.style||{}),wall:palette.body,roof:palette.accent,window:motif.color};
 // The preceding build transaction already owns costs and structural changes.
 // Attach its finish to the saved 'after' image so redo restores the same design.
 const history=state.undoHistory.at(-1),saved=history?.after?.built?.find(item=>item.uid===b.uid);if(saved)saved.style=JSON.parse(JSON.stringify(b.style));
 geometryDirty=true;persist();toast('✧ Your own design, built with care. 3 Inspiration put to use!');
 }};
function showArtisanWorkshopV06(){
 ensureCommunityV06();const d=state.nextArtisanDesign,c=ARTISAN_TYPES_V06[d.type],palette=ARTISAN_PALETTES_V06[d.palette],motif=ARTISAN_MOTIFS_V06[d.motif];
 showModal(`<div class="eyebrow">✧ CREATIVE WORKSHOP</div><h2>Make something that feels like you</h2><p class="sub">Gathering gives you ideas. Choose a piece, a finish and a carved motif; then build it in the town. Every custom piece uses 3 Inspiration plus its materials.</p><div class="artisan-balance"><b>✧ ${artisanInspirationV06()} Inspiration available</b><span>${state.workshopRestored?'The restored workbench is ready.':'Restore the workshop in Chapter 2 to begin.'}</span></div><div class="artisan-preview" style="--artisan-main:${palette.body};--artisan-accent:${palette.accent}"><div class="artisan-sample ${c.base}"><span>${c.icon}</span><i>${motif.icon}</i></div><div><h3>${c.name}</h3><p>${palette.name} · ${motif.name}</p><small>${costText(c)} · ✧ 3 Inspiration</small></div></div><h3>1. Choose your piece</h3><div class="actions">${Object.entries(ARTISAN_TYPES_V06).map(([id,c])=>`<button class="btn ${d.type===id?'':'secondary'}" data-community="designType" data-value="${id}" aria-pressed="${d.type===id}">${c.icon} ${c.name.replace('Handmade ','')}</button>`).join('')}</div><h3>2. Choose a finish</h3><div class="actions">${Object.entries(ARTISAN_PALETTES_V06).map(([id,p])=>`<button class="styleChip ${d.palette===id?'chosen':''}" style="--chip:${p.body}" data-community="designPalette" data-value="${id}">${p.name}</button>`).join('')}</div><h3>3. Add a little personality</h3><div class="actions">${Object.entries(ARTISAN_MOTIFS_V06).map(([id,m])=>`<button class="btn ${d.motif===id?'':'secondary'}" data-community="designMotif" data-value="${id}">${m.icon} ${m.name}</button>`).join('')}</div><div class="actions"><button class="btn" data-community="buildDesign" ${canAfford(d.type)?'':'disabled'}>Make & place furniture →</button><button class="btn secondary" data-community="previewDesign">Preview in 3D</button><button class="btn secondary" data-community="projects">Community projects</button><button class="btn secondary" data-ui="close">Back to town</button></div><p class="sub">Materials are charged only after you choose a valid place. Custom pieces can be moved, rotated and undone in the Town Designer. Removing or undoing a piece frees its Inspiration for another idea.</p>`);
}
const drawObjectBeforeCommunityV06=drawObject3d;
drawObject3d=function(g,b){if(!ARTISAN_TYPES_V06[b.type]){drawObjectBeforeCommunityV06(g,b);return;}
 const main=b.style?.wall||'#bd8c59',accent=b.style?.roof||'#f0ce80',motif=b.style?.window||'#6baf6b';
 g.local(b.x,b.y,(b.rotation||0)*Math.PI/2,()=>{
  if(b.type==='artisanBench'){
   g.box(0,0,1.7,.62,.18,main,.58);g.box(0,-.3,1.74,.14,.67,accent,.58);
   for(const side of [-1,1]){g.box(side*.66,0,.15,.36,.58,main);g.box(side*.84,0,.12,.76,.1,accent,.88);g.box(side*.84,-.25,.12,.12,.52,main,.48);}
   for(let i=-1;i<=1;i++)g.box(i*.48,-.395,.16,.03,.18,motif,.88);
  }else if(b.type==='artisanTable'){
   g.box(0,0,1.8,1.32,.17,accent,.91);g.box(0,0,1.63,1.16,.12,main,.81);
   for(const x of [-.63,.63])for(const z of [-.4,.4])g.box(x,z,.15,.15,.82,main,.02);
   g.box(0,0,1.33,.11,.11,accent,.33);
  }else{
   g.box(0,0,1.42,1.03,.43,main,.05);g.box(0,0,1.52,1.12,.11,accent,.47);g.box(0,0,1.25,.87,.05,'#7d6149',.55);
   for(let i=0;i<5;i++){let x=(i%3-1)*.39,z=(Math.floor(i/3)-.5)*.36;g.cone(x,z,.09,.47,'#5b9365',.55,5);g.disc(x,z,.2,i%2?accent:motif,1.01,7);g.disc(x,z,.07,'#f6dc86',1.018,7);}
  }
  const top=b.type==='artisanTable'?1.004:b.type==='artisanBench'?.772:.595;
  if(b.type!=='artisanPlanter'){
   if(motif==='#f2ca6a'){g.disc(0,0,.2,motif,top,12);for(let i=0;i<8;i++){let a=i*Math.PI/4;g.flat(Math.cos(a)*.28,Math.sin(a)*.28,.1,.1,motif,top);}}
   else if(motif==='#81c7cf'){g.disc(0,0,.27,motif,top,16);g.disc(0,0,.18,accent,top+.003,16);g.disc(0,0,.09,motif,top+.006,12);}
   else {g.flat(0,0,.07,.48,motif,top);for(const side of [-1,1])g.disc(side*.14,side*.08,.15,motif,top+.002,9);}
  }
 });
};
const drawBuildBeforeCommunityV06=drawBuild;
drawBuild=function(b,p){if(!ARTISAN_TYPES_V06[b.type]){drawBuildBeforeCommunityV06(b,p);return;}drawBuildLegacy({...b,type:ARTISAN_TYPES_V06[b.type].base==='table'?'bench':ARTISAN_TYPES_V06[b.type].base},p);ctx.fillStyle=b.style?.roof||'#f0ce80';ctx.beginPath();ctx.arc(p.x,p.y-20,5,0,7);ctx.fill();};

function communityProjectCountV06(){ensureCommunityV06();return Object.keys(state.communityProjects).length;}
function residentDesignWishV06(i){const types=Object.keys(ARTISAN_TYPES_V06),palettes=Object.keys(ARTISAN_PALETTES_V06),motifs=Object.keys(ARTISAN_MOTIFS_V06);return {type:types[i%types.length],palette:palettes[i%palettes.length],motif:motifs[i%motifs.length]};}
function communityProjectDefinitionsV06(){
 const homeProjects=state.residents.map(i=>({id:'welcome:'+i,name:NAMES[i]+'’s welcome corner',icon:'🏡',owner:i,description:'A cozy place beside their cottage to sit, admire flowers and watch the lanterns.',kind:'welcome',reward:30,friendship:4}));
 return [...homeProjects,{id:'garden',name:'The shared garden',icon:'🥕',description:'Turn a watered garden into a little meeting place with handmade furniture and flowers.',kind:'garden',reward:55,friendship:3},{id:'pond',name:'The pondside retreat',icon:'🎣',description:'Create somewhere to linger after fishing, with a handmade table, a seat and a lantern.',kind:'pond',reward:45,friendship:3}];
}
function communityProjectStatusV06(id){
 ensureCommunityV06();const project=communityProjectDefinitionsV06().find(p=>p.id===id);if(!project)return null;
 let center,requirements,unlocked=true;
 const near=(types,r=7)=>state.built.some(b=>types.includes(b.type)&&dist(b,center)<=r);
 if(project.kind==='welcome'){
  const home=state.built.find(b=>b.type==='cottage'&&b.resident===project.owner);center=home?{x:home.x,y:home.y}:null;unlocked=!!home;const wish=residentDesignWishV06(project.owner),palette=ARTISAN_PALETTES_V06[wish.palette],motif=ARTISAN_MOTIFS_V06[wish.motif];
  requirements=[['Chat and reach 2 friendship',(state.friendships[project.owner]||0)>=2],['A seat near their cottage',!!center&&near(['bench','artisanBench'])],['Flowers or a planter nearby',!!center&&near(['flower','planter','artisanPlanter'])],['A welcoming lantern nearby',!!center&&near(['lamp'])],[palette.name+' '+ARTISAN_TYPES_V06[wish.type].name.replace('Handmade ','').toLowerCase()+' with '+motif.name.toLowerCase(),!!center&&state.built.some(b=>b.type===wish.type&&b.style?.wall===palette.body&&b.style?.window===motif.color&&dist(b,center)<=7)]];
 }else if(project.kind==='garden'){
  const plots=state.built.filter(b=>b.type==='garden');const candidates=plots.map(b=>{center=b;return {center:b,count:Number(near(['artisanBench','artisanTable','artisanPlanter'],6))+Number(near(['flower','planter','artisanPlanter'],6))+Number(b.watered||b.growth>=1)}}).sort((a,b)=>b.count-a.count);center=candidates[0]?.center||null;
  unlocked=state.residents.length>=2;
  requirements=[['Welcome two invited neighbors',unlocked],['A watered or growing vegetable plot',!!center&&(center.watered||center.growth>=1)],['A handmade piece within 6 tiles',!!center&&near(['artisanBench','artisanTable','artisanPlanter'],6)],['A flower patch or planter within 6 tiles',!!center&&near(['flower','planter','artisanPlanter'],6)]];
 }else{
  center={x:10,y:28};unlocked=state.residents.length>=1;
  requirements=[['Welcome your first neighbor',unlocked],['A seat within 8 tiles of the pond',near(['bench','artisanBench'],8)],['A handmade picnic table nearby',near(['artisanTable'],8)],['A lantern for evening visits',near(['lamp'],8)]];
 }
 return {project,center,requirements,unlocked,ready:unlocked&&requirements.every(r=>r[1]),completed:!!state.communityProjects[id]};
}
function showCommunityProjectsV06(){
 ensureCommunityV06();const projects=communityProjectDefinitionsV06();
 showModal(`<div class="eyebrow">🏘️ PLACES THAT BRING US TOGETHER</div><h2>A township shaped by its neighbors</h2><p class="sub">Build useful little habitats with real furniture. Resident corners follow their cottages; shared spaces give everyone somewhere to spend the afternoon.</p>${state.residents.length?'':'<div class="artisan-balance"><b>Your first project is a friendship.</b><span>Build a cottage and invite a resident through the town board. Nobody lives here before you invite them.</span></div>'}<div class="community-projects">${projects.map(p=>{
 const s=communityProjectStatusV06(p.id);return `<section class="community-project"><div class="community-project-heading"><span>${p.icon}</span><div><h3>${esc(p.name)}</h3><p>${p.description}</p></div>${s.completed?'<b class="community-complete">✓ Celebrated</b>':''}</div><ul>${s.requirements.map(([text,yes])=>`<li class="${yes?'met':''}">${yes?'✓':'○'} ${text}</li>`).join('')}</ul><div class="actions">${s.completed?`<button class="btn" data-community="picnic" data-id="${p.id}" ${!s.ready||state.meals<1||state.communityPicnics[p.id]===state.day?'disabled':''}>Share a meal · 🍲 1</button>`:`<button class="btn" data-community="completeProject" data-id="${p.id}" ${s.ready?'':'disabled'}>Celebrate · 🪙 ${p.reward} + friendship</button>`}${s.center?`<button class="btn secondary" data-community="locateProject" data-id="${p.id}">Walk there</button>`:''}</div>${s.completed?'<p class="sub">Once per day, share a homemade meal to invite neighbors here and gain friendship. Keep the space furnished so it stays useful.</p>':''}</section>`;
 }).join('')}</div><div class="actions"><button class="btn" data-community="workshop">Creative workshop</button><button class="btn secondary" data-v05="studio">Town Designer</button><button class="btn secondary" data-ui="close">Back to town</button></div>`);
}
function completeCommunityProjectV06(id){
 const s=communityProjectStatusV06(id);if(!s||s.completed)return;if(!s.ready){toast('Finish the actual layout and friendship requirements first.');return;}
 communityScheduleCacheV06.until=0;state.communityProjects[id]={day:state.day};state.coins+=s.project.reward;
 for(const i of s.project.owner!==undefined?[s.project.owner]:state.residents)state.friendships[i]+=s.project.friendship;
 persist();sound(880);showCommunityProjectsV06();toast('A new place to belong! Your neighbors will start visiting.');
}
function hostCommunityPicnicV06(id){
 const s=communityProjectStatusV06(id);if(!s?.completed||!s.ready)return;if(state.communityPicnics[id]===state.day){toast('This spot has already hosted a meal today.');return;}if(state.meals<1){toast('Cook a homemade meal to share first.');return;}
 communityScheduleCacheV06.until=0;state.meals--;state.communityPicnics[id]=state.day;state.communityGathering={id,day:state.day,untilClock:Math.min(23.99,state.clock+1.5)};
 for(const i of state.residents){state.friendships[i]+=2;npcData[i].scheduleKey=null;npcData[i].routeTimer=0;}
 persist();hideModal();if(s.center)goTo(s.center.x,s.center.y,'your neighborhood gathering');toast('The invitation is out! Neighbors are walking over. +2 friendship',4000);
}
let communityScheduleCacheV06={state:null,until:0,values:new Map()};
function communityScheduleStatusV06(id){const now=performance.now();if(communityScheduleCacheV06.state!==state||now>communityScheduleCacheV06.until)communityScheduleCacheV06={state,until:now+500,values:new Map()};if(!communityScheduleCacheV06.values.has(id))communityScheduleCacheV06.values.set(id,communityProjectStatusV06(id));return communityScheduleCacheV06.values.get(id);}
const scheduleBeforeCommunityV06=residentSchedule;
residentSchedule=function(n){
 const current=scheduleBeforeCommunityV06(n);ensureCommunityV06();const gathering=state.communityGathering;
 let project=null;
 if(gathering&&gathering.day===state.day&&state.clock<gathering.untilClock)project=communityScheduleStatusV06(gathering.id);
 if(!project?.ready&&state.clock>=12&&state.clock<18){const ids=['welcome:'+n.index,...Object.keys(state.communityProjects).filter(id=>!id.startsWith('welcome:'))];for(const id of ids){const p=communityScheduleStatusV06(id);if(p?.completed&&p.ready){project=p;break;}}}
 if(project?.ready&&project.center){const angle=n.index*Math.PI*.65,goal=nearestWalkable({x:project.center.x+Math.cos(angle)*2.8,y:project.center.y+Math.sin(angle)*2.8},3);if(goal){n.activity=gathering&&project.project.id===gathering.id?'Sharing a meal with the neighborhood':'Enjoying '+project.project.name.toLowerCase();return {goal,key:'community_'+project.project.id+'_'+(gathering?.day||Math.floor(state.clock/3))};}}
 return current;
};
const neighborDetailBeforeCommunityV06=showNeighborDetail;
showNeighborDetail=function(i){neighborDetailBeforeCommunityV06(i);if(!state.residents.includes(i))return;const wish=residentDesignWishV06(i),palette=ARTISAN_PALETTES_V06[wish.palette],motif=ARTISAN_MOTIFS_V06[wish.motif];$('modalBody').insertAdjacentHTML('beforeend',`<div class="artisan-balance"><b>A little home wish</b><span>${NAMES[i]} would enjoy a ${palette.name.toLowerCase()} ${ARTISAN_TYPES_V06[wish.type].name.replace('Handmade ','').toLowerCase()} with ${motif.name.toLowerCase()} near their cottage.</span><button class="btn secondary" data-community="residentDesign" data-id="${i}">Design their furniture</button></div>`);};
const townHubBeforeCommunityV06=showTownHub;
showTownHub=function(){townHubBeforeCommunityV06();$('modalBody').querySelector('.hubgrid')?.insertAdjacentHTML('afterbegin','<button data-community="workshop">✧ <b>Creative workshop</b><small>Design your own furniture</small></button><button data-community="projects">🏘️ <b>Community projects</b><small>Places for friends to gather</small></button>');};
const workshopBeforeCommunityV06=showWorkshop;
showWorkshop=function(){workshopBeforeCommunityV06();if(state.workshopRestored)$('modalBody').querySelector('.actions')?.insertAdjacentHTML('afterbegin','<button class="btn secondary" data-community="workshop">✧ Design outdoor furniture</button>');};
const journalBeforeCommunityV06=showJournal;
showJournal=function(){journalBeforeCommunityV06();$('modalBody').insertAdjacentHTML('beforeend',`<div class="actions"><button class="btn secondary" data-community="projects">Optional community projects</button></div>`);};
document.addEventListener('click',e=>{const b=e.target.closest('[data-community]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();ensureCommunityV06();const action=b.dataset.community,value=b.dataset.value,id=b.dataset.id;
 if(action==='workshop')showArtisanWorkshopV06();else if(action==='projects')showCommunityProjectsV06();
 else if(action==='residentDesign'&&state.residents.includes(Number(id))){state.nextArtisanDesign=residentDesignWishV06(Number(id));persist();showArtisanWorkshopV06();}
 else if(action==='designType'&&ARTISAN_TYPES_V06[value]){state.nextArtisanDesign.type=value;persist();showArtisanWorkshopV06();}
 else if(action==='designPalette'&&ARTISAN_PALETTES_V06[value]){state.nextArtisanDesign.palette=value;persist();showArtisanWorkshopV06();}
 else if(action==='designMotif'&&ARTISAN_MOTIFS_V06[value]){state.nextArtisanDesign.motif=value;persist();showArtisanWorkshopV06();}
 else if(action==='previewDesign'){const d=state.nextArtisanDesign,p=ARTISAN_PALETTES_V06[d.palette],m=ARTISAN_MOTIFS_V06[d.motif];if(typeof showFurniturePreviewV06==='function')showFurniturePreviewV06(d.type,{wall:p.body,roof:p.accent,window:m.color});}
 else if(action==='buildDesign'){const type=state.nextArtisanDesign.type;if(canAfford(type))activateDesigner('place',type);}
 else if(action==='completeProject')completeCommunityProjectV06(id);else if(action==='picnic')hostCommunityPicnicV06(id);
 else if(action==='locateProject'){const p=communityProjectStatusV06(id);if(p?.center)goTo(p.center.x,p.center.y,p.project.name);}
},true);
const communityCssV06=document.createElement('style');communityCssV06.textContent=`.artisan-balance{padding:14px 16px;border-radius:15px;background:#e9efdb;border:1px solid #d5dfc0;margin:15px 0;display:grid;gap:5px}.artisan-balance b{color:#49694f}.artisan-balance span{font-size:12px;color:#768164}.artisan-preview{display:flex;align-items:center;gap:20px;background:#f2efda;border-radius:20px;padding:19px;margin-top:18px;border:1px solid #e5dfc5}.artisan-preview h3{margin:0 0 5px!important;font-size:20px}.artisan-preview p{margin:0 0 7px;font-size:12px;color:#6d785b}.artisan-preview small{font-size:11px;color:#6d785b}.artisan-sample{min-width:110px;height:100px;background:linear-gradient(145deg,var(--artisan-accent),var(--artisan-main));border-radius:22px;display:grid;place-items:center;position:relative;box-shadow:0 5px 0 #50624922}.artisan-sample>span{font-size:58px;filter:drop-shadow(2px 5px 2px #30452a25)}.artisan-sample>i{position:absolute;right:5px;bottom:5px;background:#fff8df;border-radius:50%;padding:5px;font-size:20px;font-style:normal}.community-project{border:1px solid #dbe3ca;background:#fffff5;border-radius:19px;padding:17px;margin:13px 0}.community-project-heading{display:flex;align-items:flex-start;gap:12px}.community-project-heading>span{font-size:30px}.community-project-heading h3{margin:0 0 6px!important;font-size:17px}.community-project-heading p{margin:0;font-size:12px;color:#738263;line-height:1.5}.community-complete{font-size:10px;color:#527655;margin-left:auto;white-space:nowrap}.community-project ul{list-style:none;padding:0;margin:13px 0 0;display:grid;gap:7px;font-size:12px;color:#879078}.community-project li.met{color:#3e7855;font-weight:bold}.community-project .actions{margin-top:13px}.community-project .sub{font-size:11px;margin-bottom:0}@media(max-width:620px){.artisan-preview{gap:12px;padding:13px}.artisan-preview h3{font-size:16px}.artisan-sample{min-width:78px;height:84px}.artisan-sample>span{font-size:43px}.community-project{padding:14px}.community-project-heading{gap:9px}.community-project-heading h3{font-size:15px}.community-complete{font-size:8px}}`;document.head.append(communityCssV06);
