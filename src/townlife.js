/* Connected town growth: a hotel for future neighbors, evidence-based stars,
 * and learned exploration tools. These are optional township activities, not
 * additions to the creatures' evolution lore or replacements for Chapters 1–3. */
const TOWNLIFE_ABILITIES_V06=[
 {id:'trailcraft',name:'Trailcraft',icon:'🌿',stars:1,wood:3,stone:1,petals:1,area:'Mossy Grove',hint:'Follow the western trail beyond x −18. Learn to recognize safe routes through dense woodland.'},
 {id:'climbing',name:'Ridge stepping',icon:'⛰️',stars:2,wood:2,stone:4,petals:1,area:'Willow Hills',hint:'Explore north beyond y −18. Practice finding gentle footholds on the ridge trails.'},
 {id:'surveying',name:'River surveying',icon:'🧭',stars:2,wood:3,stone:2,petals:3,area:'Sunrise Meadow',hint:'Cross a wooden river bridge and head east beyond x 65. Learn the shoreline routes.'}
];
const TOWNLIFE_AREAS_V06=[
 {id:'grove',name:'Mossy Grove',ability:'trailcraft',x:-32,y:21,check:p=>p.x< -18,icon:'🌿',finish:'A woodland resting place'},
 {id:'hills',name:'Willow Hills',ability:'climbing',x:17,y:-30,check:p=>p.y< -18,icon:'⛰️',finish:'A ridge lookout'},
 {id:'meadow',name:'Sunrise Meadow',ability:'surveying',x:84,y:17,check:p=>p.x>65,icon:'🌅',finish:'A riverside picnic stop'}
];
Object.assign(COST,{hotel:{name:'Meadow Guesthouse',icon:'🏨',wood:8,stone:6,petals:3}});
function ensureTownlifeV06(){
 if(!state)return;
 state.learnedAbilities=[...new Set((Array.isArray(state.learnedAbilities)?state.learnedAbilities:[]).filter(id=>TOWNLIFE_ABILITIES_V06.some(a=>a.id===id)))];
 state.discoveredAreas=[...new Set((Array.isArray(state.discoveredAreas)?state.discoveredAreas:[]).filter(id=>TOWNLIFE_AREAS_V06.some(a=>a.id===id)))];
 state.restoredSites=[...new Set((Array.isArray(state.restoredSites)?state.restoredSites:[]).filter(id=>TOWNLIFE_AREAS_V06.some(a=>a.id===id)))];
 if(!Number.isInteger(state.lastHotelGuestDay))state.lastHotelGuestDay=0;
 const guest=state.hotelGuest;
 if(guest&&(!Number.isInteger(guest.index)||guest.index<0||guest.index>=10||guest.index===state.avatar||state.residents.includes(guest.index)||!state.built.some(b=>b.type==='hotel')))state.hotelGuest=null;
 if(state.hotelGuest){state.hotelGuest.arrivedDay=Number.isFinite(state.hotelGuest.arrivedDay)?Math.max(1,Math.floor(state.hotelGuest.arrivedDay)):state.day;state.hotelGuest.chatted=!!state.hotelGuest.chatted;if(state.hotelGuest.arrivedDay<state.day)state.hotelGuest=null;}
}
function completedCommunityCountV06(){
 if(typeof communityProjectCountV06==='function')return communityProjectCountV06();
 const v=state.communityProjects||state.completedProjects||state.communityCompleted||state.completedCommunityProjects;
 if(Array.isArray(v))return v.length;if(v&&typeof v==='object')return Object.values(v).filter(Boolean).length;
 return 0;
}
function townRatingV06(){
 if(!state)return {stars:0,goals:[],next:1};ensureTownlifeV06();
 const residents=state.residents.length,occupied=state.built.filter(b=>b.type==='cottage'&&state.residents.includes(b.resident)).length,decorations=state.built.filter(b=>!['cottage','hotel','market'].includes(b.type)).length,projects=completedCommunityCountV06(),areas=state.discoveredAreas.length,hotel=state.built.some(b=>b.type==='hotel');
 const tiers=[
  {title:'A welcoming beginning',tests:[['Restore the forgotten workshop',!!state.workshopRestored],['Welcome a permanent neighbor',residents>=1&&occupied>=1],['Place a flower patch or garden',state.built.some(b=>['flower','garden','planter'].includes(b.type))]]},
  {title:'Somewhere worth visiting',tests:[['Welcome two permanent neighbors',residents>=2&&occupied>=2],['Build the Meadow Guesthouse',hotel],['Place three outdoor decorations',decorations>=3],['Craft furniture at the workshop',state.craftedCount>=1]]},
  {title:'A growing community',tests:[['Welcome three permanent neighbors',residents>=3&&occupied>=3],['Complete a resident community project',projects>=1],['Explore one new area',areas>=1],['Place six outdoor decorations',decorations>=6]]},
  {title:'A beloved little township',tests:[['Welcome five permanent neighbors',residents>=5&&occupied>=5],['Complete two community projects',projects>=2],['Explore two new areas',areas>=2],['Place ten outdoor decorations',decorations>=10]]},
  {title:'A place everyone calls home',tests:[['Welcome seven permanent neighbors',residents>=7&&occupied>=7],['Complete three community projects',projects>=3],['Restore all three exploration stops',state.restoredSites.length>=3],['Craft seven pieces of furniture',state.craftedCount>=7]]}
 ];
 let stars=0;for(const tier of tiers){if(!tier.tests.every(([,done])=>done))break;stars++;}
 return {stars,next:Math.min(5,stars+1),title:stars===5?'A five-star township':tiers[stars].title,goals:stars===5?[]:tiers[stars].tests,residents,occupied,decorations,projects,areas};
}
function townStarsTextV06(stars){return '★'.repeat(stars)+'☆'.repeat(5-stars);}
function showTownlifeV06(){
 ensureTownlifeV06();const rating=townRatingV06();
 showModal(`<div class="eyebrow">GROW A PLACE PEOPLE LOVE</div><h2>${esc(state.townName)} town stars</h2><div class="townlife-stars" style="font-size:36px;color:#c39135;letter-spacing:5px;margin:15px 0" aria-label="${rating.stars} out of five town stars">${townStarsTextV06(rating.stars)}</div><p><b>${rating.title}</b></p><p class="sub">Your rating comes from real homes, residents, useful spaces and discoveries. Temporary hotel guests do not count as permanent neighbors.</p>${rating.goals.length?`<h3>Your next star</h3><div class="cardlist">${rating.goals.map(([label,done])=>`<div class="friend"><span>${done?'✅':'○'}</span><span>${label}</span></div>`).join('')}</div>`:'<p>Your township has reached five stars. Keep making it your own.</p>'}<div class="hubgrid"><button data-townlife="hotel">🏨 <b>Meadow Guesthouse</b><small>Invite visitors, then welcome neighbors</small></button><button data-townlife="abilities">🧰 <b>Learn exploration tools</b><small>Open new woodland, ridge and river routes</small></button><button data-townlife="areas">🗺️ <b>Exploration journal</b><small>${state.discoveredAreas.length}/3 areas discovered</small></button></div><div class="actions"><button class="btn" data-townlife="close">Back to town</button></div>`);
}
function showAbilitiesV06(){
 ensureTownlifeV06();const stars=townRatingV06().stars;
 showModal(`<div class="eyebrow">LEARN BY MAKING · EXPLORE BY DOING</div><h2>Workshop field lessons</h2><p class="sub">Restore the workshop, gather supplies and grow your town to learn new tools. The original story chapters keep their own requirements.</p><div class="cardlist">${TOWNLIFE_ABILITIES_V06.map(a=>{const known=state.learnedAbilities.includes(a.id),ready=state.workshopRestored&&stars>=a.stars&&['wood','stone','petals'].every(k=>state[k]>=a[k]);return `<div class="friend" style="display:block;padding:15px"><h3 style="margin:0 0 8px">${a.icon} ${a.name}</h3><p class="sub">${a.hint}</p><p class="sub">${a.stars} town star${a.stars>1?'s':''} · ${prettyCount(a)}</p><button class="btn ${known?'secondary':''}" data-townlife="learn" data-id="${a.id}" ${known||!ready?'disabled':''}>${known?'Lesson learned':!state.workshopRestored?'Restore the workshop':stars<a.stars?'Grow your town rating':'Learn at the workshop'}</button></div>`}).join('')}</div><div class="actions"><button class="btn secondary" data-townlife="stars">Town stars</button><button class="btn" data-townlife="areas">Exploration journal</button></div>`);
}
function learnAbilityV06(id){
 ensureTownlifeV06();const a=TOWNLIFE_ABILITIES_V06.find(a=>a.id===id);if(!a||state.learnedAbilities.includes(id))return false;
 if(!state.workshopRestored){toast('Restore the workshop before taking field lessons.');return false;}if(townRatingV06().stars<a.stars){toast('Grow your township to '+a.stars+' stars for this lesson.');return false;}if(!['wood','stone','petals'].every(k=>state[k]>=a[k])){toast('Gather the lesson supplies first.');return false;}
 for(const k of ['wood','stone','petals'])state[k]-=a[k];state.learnedAbilities.push(id);state.undoHistory=[];state.redoHistory=[];persist();sound(820);showAbilitiesV06();toast(a.name+' learned. The route to '+a.area+' is open!',4500);return true;
}
function missingAreaAbilityV06(x,y){
 if(!state)return null;const learned=Array.isArray(state.learnedAbilities)?state.learnedAbilities:[];
 if(x< -18&&!learned.includes('trailcraft'))return TOWNLIFE_ABILITIES_V06[0];
 if(y< -18&&!learned.includes('climbing'))return TOWNLIFE_ABILITIES_V06[1];
 if(x>65&&!learned.includes('surveying'))return TOWNLIFE_ABILITIES_V06[2];
 return null;
}
const townlifeValidMoveBeforeV06=validMove;
validMove=function(x,y){return !missingAreaAbilityV06(x,y)&&townlifeValidMoveBeforeV06(x,y)};
function discoverAreasV06(){
 ensureTownlifeV06();let changed=false;for(const a of TOWNLIFE_AREAS_V06){if(a.check(state.player)&&state.learnedAbilities.includes(a.ability)&&!state.discoveredAreas.includes(a.id)){state.discoveredAreas.push(a.id);state.coins+=15;changed=true;toast(a.icon+' Discovered '+a.name+' · +15 coins',4000);}}
 if(changed)persist();return changed;
}
function showExplorationJournalV06(){
 ensureTownlifeV06();showModal(`<div class="eyebrow">THERE IS MORE BEYOND THE MEADOW</div><h2>Your exploration journal</h2><p class="sub">New areas have quiet restoration stops. Learn a field lesson, travel there, then bring supplies to make the stop useful for everyone.</p><div class="cardlist">${TOWNLIFE_AREAS_V06.map(a=>{const known=state.learnedAbilities.includes(a.ability),found=state.discoveredAreas.includes(a.id),restored=state.restoredSites.includes(a.id);return `<div class="friend" style="display:block;padding:15px"><h3 style="margin:0">${a.icon} ${a.name}</h3><p class="sub">${restored?'✓ '+a.finish+' restored':found?'Discovered · restoration stop waiting':known?'Route open · ready to explore':'Learn '+TOWNLIFE_ABILITIES_V06.find(v=>v.id===a.ability).name+' first'}</p><button class="btn secondary" data-townlife="travel" data-id="${a.id}" ${known?'':'disabled'}>Walk to the ${a.id==='hills'?'ridge':a.id==='grove'?'grove':'riverbank'}</button></div>`}).join('')}</div><div class="actions"><button class="btn" data-townlife="abilities">Field lessons</button><button class="btn secondary" data-townlife="close">Back to town</button></div>`);
}
function showRestorationStopV06(id){
 ensureTownlifeV06();const a=TOWNLIFE_AREAS_V06.find(a=>a.id===id);if(!a)return;
 const restored=state.restoredSites.includes(id),near=dist(state.player,a)<3.1,ready=near&&state.wood>=3&&state.stone>=2&&state.petals>=2&&state.learnedAbilities.includes(a.ability);
 showModal(`<div class="eyebrow">${a.icon} ${a.name.toUpperCase()}</div><h2>${a.finish}</h2><p>${restored?'The resting place is ready. Flowers, a bench and a little light make the long walk feel welcoming.':'An overgrown marker shows where travelers once stopped. Bring wood, stone and flowers to turn it into a welcoming place again.'}</p>${!restored?'<p class="sub">Restore with 🪵 3 wood · 🪨 2 stone · 🌼 2 flowers. Reward: 25 coins and a new place to rest.</p>':''}<div class="actions">${!restored?`<button class="btn" data-townlife="restore" data-id="${id}" ${ready?'':'disabled'}>${near?'Restore this stop':'Walk closer to restore'}</button>`:''}<button class="btn secondary" data-townlife="close">Keep exploring</button></div>`);
}
function restoreExplorationSiteV06(id){
 ensureTownlifeV06();const a=TOWNLIFE_AREAS_V06.find(a=>a.id===id);if(!a||state.restoredSites.includes(id)||!state.learnedAbilities.includes(a.ability)||dist(state.player,a)>=3.1)return false;
 if(state.wood<3||state.stone<2||state.petals<2){toast('Bring 3 wood, 2 stone and 2 flowers.');return false;}
 state.wood-=3;state.stone-=2;state.petals-=2;state.restoredSites.push(id);if(!state.discoveredAreas.includes(id))state.discoveredAreas.push(id);state.coins+=25;state.undoHistory=[];state.redoHistory=[];geometryDirty=true;persist();showRestorationStopV06(id);sound(850);return true;
}
function visitingGuestIndicesV06(){ensureTownlifeV06();return state?.hotelGuest?[state.hotelGuest.index]:[];}
function hotelBuildingV06(){return state?.built.find(b=>b.type==='hotel')||null;}
function hotelUnlockedV06(){return !!state?.workshopRestored&&townRatingV06().stars>=1;}
function positionHotelGuestV06(){
 const hotel=hotelBuildingV06(),guest=state.hotelGuest;if(!hotel||!guest||!npcData[guest.index])return;
 const yaw=(hotel.rotation||0)*Math.PI/2,p={x:hotel.x-Math.sin(yaw)*2.8,y:hotel.y+Math.cos(yaw)*2.8},safe=nearestWalkable(p,4),n=npcData[guest.index];
 if(safe){n.x=safe.x;n.y=safe.y;}n.home={x:hotel.x,y:hotel.y};n.activity='Visiting the Meadow Guesthouse';n.route=[];n.routeTimer=0;
}
function showHotelV06(){
 ensureTownlifeV06();const hotel=hotelBuildingV06();if(!hotel){showModal(`<div class="eyebrow">A ROOM FOR A NEW FRIEND</div><h2>Meadow Guesthouse</h2><p>Build a little hotel after restoring the workshop and earning your first town star. Invite one Fathermon for a day visit. Visitors only become permanent neighbors when you offer a vacant cottage.</p><p class="sub">🪵 8 wood · 🪨 6 stone · 🌼 3 flowers. The town still begins with you alone.</p><div class="actions"><button class="btn" data-townlife="buildHotel" ${hotelUnlockedV06()?'':'disabled'}>${hotelUnlockedV06()?'Build a guesthouse':'Needs workshop and one town star'}</button><button class="btn secondary" data-townlife="stars">Town stars</button><button class="btn secondary" data-townlife="close">Later</button></div>`);return;}
 const guest=state.hotelGuest,candidates=NAMES.map((name,index)=>({name,index})).filter(a=>a.index!==state.avatar&&!state.residents.includes(a.index));
 if(guest){const i=guest.index,p=V06_PERSONALITIES[i],vacant=state.built.some(b=>b.type==='cottage'&&b.resident===null);showModal(`<div class="eyebrow">🏨 YOUR GUEST FOR DAY ${state.day}</div><h2>${NAMES[i]} is visiting!</h2><div class="storyPartner"><img src="${FILES[i]}" alt="Original ${NAMES[i]} drawing"><p>“${guest.chatted?'I can imagine making a home here. A cozy cottage would be a lovely beginning.':p.line}”<small>${p.mood} · Home wish: ${CRAFT_RECIPES[p.home].name}</small></p></div><p class="sub">${guest.chatted?'You have met your visitor.':''} ${vacant?'A vacant cottage is ready.':'Build a vacant Cozy Cottage to offer a permanent home.'} Guests leave when the next day begins.</p><div class="actions"><button class="btn" data-townlife="talkGuest">${guest.chatted?'Chat again':'Meet your guest'}</button><button class="btn secondary" data-townlife="welcomeGuest" ${vacant&&guest.chatted?'':'disabled'}>Offer a permanent home</button><button class="btn secondary" data-townlife="findGuest">Find guest</button><button class="btn secondary" data-townlife="close">Back to town</button></div>`);return;}
 const used=state.lastHotelGuestDay===state.day;showModal(`<div class="eyebrow">🏨 A LITTLE HOTEL · A BIG WELCOME</div><h2>Invite a guest</h2><p class="sub">One invitation per day. A visitor stays for the current day, explores near the guesthouse, and can move into a vacant cottage after you meet.</p>${used?'<p>You already welcomed a visitor today. Come back tomorrow for another invitation.</p>':''}<div class="cardlist">${candidates.map(({name,index})=>`<button class="buildcard" data-townlife="inviteGuest" data-index="${index}" ${used?'disabled':''}><img src="${FILES[index]}" alt="${name}" style="width:58px;height:65px;object-fit:contain"><span><b>${name}</b><small>Invite to the guesthouse</small></span></button>`).join('')||'<p>All your Fathermon friends already live in town.</p>'}</div><div class="actions"><button class="btn secondary" data-townlife="close">Back to town</button></div>`);
}
function inviteHotelGuestV06(index){
 ensureTownlifeV06();if(!hotelBuildingV06()||!Number.isInteger(index)||index<0||index>=10||index===state.avatar||state.residents.includes(index)||state.hotelGuest||state.lastHotelGuestDay===state.day)return false;
 state.hotelGuest={index,arrivedDay:state.day,chatted:false};state.lastHotelGuestDay=state.day;state.undoHistory=[];state.redoHistory=[];positionHotelGuestV06();persist();sound(800);showHotelV06();return true;
}
function talkHotelGuestV06(){
 ensureTownlifeV06();const guest=state.hotelGuest;if(!guest)return false;
 if(!guest.chatted){guest.chatted=true;state.friendships[guest.index]++;persist();}showHotelV06();return true;
}
function welcomeHotelGuestV06(){
 ensureTownlifeV06();const guest=state.hotelGuest;if(!guest||!guest.chatted){toast('Meet your guest before offering a permanent home.');return false;}
 if(!state.built.some(b=>b.type==='cottage'&&b.resident===null)){toast('Build a vacant cottage for your new neighbor.');return false;}
 const index=guest.index;chooseInvitation(index);if(!state.residents.includes(index))return false;state.hotelGuest=null;persist();toast(NAMES[index]+' is now a permanent neighbor!',4000);return true;
}
const townlifeFootprintBeforeV06=solidFootprint;
solidFootprint=function(type,rotation=0){if(type==='hotel')return rotation%2?[1.85,2.25]:[2.25,1.85];return townlifeFootprintBeforeV06(type,rotation)};
const townlifeSiteBeforeV06=canSite;
canSite=function(x,y,exclude=null,type='path'){return !missingAreaAbilityV06(x,y)&&townlifeSiteBeforeV06(x,y,exclude,type)};
const townlifeStartPlacingBeforeV06=startPlacing;
startPlacing=function(type){if(type==='hotel'&&!hotelUnlockedV06()){toast('Restore the workshop and earn one town star first.');return;}townlifeStartPlacingBeforeV06(type)};
const townlifeActivateDesignerBeforeV06=activateDesigner;
activateDesigner=function(mode,type){if(mode==='place'&&type==='hotel'&&!hotelUnlockedV06()){toast('Restore the workshop and earn one town star first.');return;}townlifeActivateDesignerBeforeV06(mode,type)};
const townlifeBuildBeforeV06=buildAt;
buildAt=function(x,y){if(placing==='hotel'&&(!hotelUnlockedV06()||hotelBuildingV06())){toast(hotelBuildingV06()?'Your township already has a guesthouse.':'Restore the workshop and earn one town star first.');return;}townlifeBuildBeforeV06(x,y)};
const townlifeRemoveBeforeV06=removeAt;
removeAt=function(x,y){const hotel=hotelBuildingV06();if(hotel&&state.hotelGuest&&dist({x,y},hotel)<3){toast('A guest is staying here. Move the guesthouse, or wait until tomorrow.');return;}townlifeRemoveBeforeV06(x,y)};
const townlifeSetupBeforeV06=setupNpcs;
setupNpcs=function(){townlifeSetupBeforeV06();if(state){ensureTownlifeV06();positionHotelGuestV06();}};
const townlifeStartResetBeforeV06=systemsStartReset;
systemsStartReset=function(){pendingGuestWalkV06=null;townlifeCheckClockV06=0;townlifeGateNoticeV06=0;ensureTownlifeV06();if(state&&missingAreaAbilityV06(state.player.x,state.player.y)){state.player.x=clamp(state.player.x,-17,64);state.player.y=Math.max(-17,state.player.y);}townlifeStartResetBeforeV06();positionHotelGuestV06();};
const townlifeInvitationBeforeV06=chooseInvitation;
chooseInvitation=function(index){townlifeInvitationBeforeV06(index);if(state?.hotelGuest?.index===index&&state.residents.includes(index)){state.hotelGuest=null;persist();}};
const townlifeTalkBeforeV06=talkTo;
talkTo=function(index){if(state?.hotelGuest?.index===index){if(dist(state.player,npcData[index])<3.3)talkHotelGuestV06();return;}townlifeTalkBeforeV06(index)};
const townlifeInteractBeforeV06=interact;
interact=function(){if(paused||activeModal)return;ensureTownlifeV06();const guest=state.hotelGuest;if(guest&&dist(state.player,npcData[guest.index])<3.2){talkHotelGuestV06();return;}const hotel=hotelBuildingV06();if(hotel&&dist(state.player,hotel)<4){showHotelV06();return;}const site=TOWNLIFE_AREAS_V06.find(a=>dist(state.player,a)<3.1&&state.learnedAbilities.includes(a.ability));if(site){showRestorationStopV06(site.id);return;}townlifeInteractBeforeV06();};
let pendingGuestWalkV06=null;
const townlifeTapBeforeV06=modeTap;
modeTap=function(pos){if(!paused&&!activeModal&&designer.mode==='off'&&pos){const guest=state.hotelGuest;if(guest&&dist(pos,npcData[guest.index])<1.5){if(dist(state.player,npcData[guest.index])<3.3)talkHotelGuestV06();else{pendingGuestWalkV06=guest.index;goTo(npcData[guest.index].x,npcData[guest.index].y,NAMES[guest.index]);}return;}const hotel=hotelBuildingV06();if(hotel&&dist(pos,hotel)<2.8){if(dist(state.player,hotel)<4)showHotelV06();else goTo(hotel.x,hotel.y,'the guesthouse');return;}const site=TOWNLIFE_AREAS_V06.find(a=>dist(pos,a)<2&&state.learnedAbilities.includes(a.ability));if(site){if(dist(state.player,site)<3.1)showRestorationStopV06(site.id);else goTo(site.x,site.y,site.name);return;}}townlifeTapBeforeV06(pos);};
const townlifeDayBeforeV06=dayAdvance;
dayAdvance=function(){const leaving=state.hotelGuest?.index;state.hotelGuest=null;pendingGuestWalkV06=null;townlifeDayBeforeV06();if(leaving!==undefined){toast(NAMES[leaving]+' enjoyed the visit and headed home. Invite a new guest today.',4500);persist();}};
let townlifeCheckClockV06=0,townlifeGateNoticeV06=0;
const townlifeUpdateBeforeV06=gameUpdate;
gameUpdate=function(dt){townlifeUpdateBeforeV06(dt);if(!state||paused||activeModal)return;const visitor=state.hotelGuest,n=visitor?npcData[visitor.index]:null,hotel=hotelBuildingV06();if(n&&hotel){n.routeTimer=(n.routeTimer||0)-dt;if(n.routeTimer<=0){n.routeTimer=8;const a=hash(state.day,Math.floor(tick/8),n.index)*Math.PI*2,goal=nearestWalkable({x:hotel.x+Math.cos(a)*3.8,y:hotel.y+Math.sin(a)*3.8},2);n.route=goal?findTownPath(n,goal):[];}if(n.route?.length&&dist(state.player,n)>1.3&&moveActor(n,n.route[0],.42,dt))n.route.shift();}townlifeCheckClockV06+=dt;if(pendingGuestWalkV06!==null&&state.hotelGuest?.index===pendingGuestWalkV06&&dist(state.player,npcData[pendingGuestWalkV06])<2.8){pendingGuestWalkV06=null;walkTarget=null;talkHotelGuestV06();return;}if(townlifeCheckClockV06<.7)return;townlifeCheckClockV06=0;discoverAreasV06();if((keys.size||joyX||joyY)&&performance.now()>townlifeGateNoticeV06){const p=state.player,near=p.x< -17.2&&!state.learnedAbilities.includes('trailcraft')?TOWNLIFE_ABILITIES_V06[0]:p.y< -17.2&&!state.learnedAbilities.includes('climbing')?TOWNLIFE_ABILITIES_V06[1]:p.x>64.2&&!state.learnedAbilities.includes('surveying')?TOWNLIFE_ABILITIES_V06[2]:null;if(near){toast('Learn '+near.name+' at the workshop to explore '+near.area+'.',4000);townlifeGateNoticeV06=performance.now()+8000;}}};
const townlifeHubBeforeV06=showTownHub;
showTownHub=function(){townlifeHubBeforeV06();const rating=townRatingV06();$('modalBody').querySelector('.hubgrid')?.insertAdjacentHTML('afterbegin',`<button data-townlife="stars">⭐ <b>Town stars</b><small>${rating.stars}/5 · ${rating.title}</small></button><button data-townlife="hotel">🏨 <b>Meadow Guesthouse</b><small>${state.hotelGuest?NAMES[state.hotelGuest.index]+' is visiting':'Welcome a future neighbor'}</small></button><button data-townlife="abilities">🧭 <b>Field lessons</b><small>Learn tools and explore new areas</small></button>`);};
const townlifeWorkshopBeforeV06=showWorkshop;
showWorkshop=function(){townlifeWorkshopBeforeV06();if(state.workshopRestored)$('modalBody').querySelector('.actions')?.insertAdjacentHTML('afterbegin','<button class="btn secondary" data-townlife="abilities">Learn field tools</button>');};
function hotelMeshV06(g,b){g.local(b.x,b.y,(b.rotation||0)*Math.PI/2,()=>{g.box(0,0,4.2,3.4,3.05,'#f2ddae');g.box(0,0,4.4,3.55,.18,'#a38565',-.03);g.box(0,1.73,4.36,.1,.17,'#b18e65',1.55);g.box(0,1.76,.9,.13,1.6,'#766052',.03);g.box(0,1.85,.05,.05,1.52,'#ead09e',.04);for(const x of [-1.4,-.65,.65,1.4])for(const y of [1.0,2.12]){if(Math.abs(x)<1&&y===1)continue;g.box(x,1.75,.5,.12,.65,'#9dd9d0',y);g.box(x,1.83,.035,.03,.65,'#fef4d8',y);g.box(x,1.83,.5,.03,.035,'#fef4d8',y+.32);}g.quad([-2.35,3,-1.95],[2.35,3,-1.95],[2.35,4.18,0],[-2.35,4.18,0],'#839e84',.83);g.quad([-2.35,4.18,0],[2.35,4.18,0],[2.35,3,1.95],[-2.35,3,1.95],'#92b394',1.05);g.tri([-2.35,3,-1.95],[-2.35,3,1.95],[-2.35,4.18,0],'#f2ddae',.85);g.tri([2.35,3,-1.95],[2.35,4.18,0],[2.35,3,1.95],'#f2ddae');g.box(0,2.03,1.6,.72,.16,'#d9bb87',1.85);g.box(-.72,2.18,.1,.12,1.85,'#b79367');g.box(.72,2.18,.1,.12,1.85,'#b79367');g.box(0,1.88,1.7,.15,.42,'#637e68',2.44);for(const x of [-1.45,1.45]){g.box(x,1.92,.56,.5,.3,'#b48963');g.cone(x,1.92,.4,.7,'#7aab71',.25,7);g.disc(x,1.92,.22,'#f2c1ba',.91,8);}});}
const townlifeObjectBeforeV06=drawObject3d;
drawObject3d=function(g,b){if(b.type==='hotel'){hotelMeshV06(g,b);return;}townlifeObjectBeforeV06(g,b)};
const townlifeIsoBuildBeforeV06=drawBuild;
drawBuild=function(b,p){if(b.type!=='hotel'){townlifeIsoBuildBeforeV06(b,p);return;}drawHouse({index:5,label:'MEADOW GUESTHOUSE'},p);drawHouse({index:7,label:' '},{x:p.x+42,y:p.y-16});ctx.fillStyle='#4b7561';ctx.fillRect(p.x-37,p.y-45,74,20);ctx.fillStyle='#fff6dc';ctx.font='bold 9px Trebuchet MS';ctx.textAlign='center';ctx.fillText('GUESTHOUSE',p.x,p.y-31);};
const townlifeSceneryBeforeV06=addTerrain3d;
addTerrain3d=function(g){townlifeSceneryBeforeV06(g);for(const a of TOWNLIFE_AREAS_V06){if(Math.hypot(state.player.x-a.x,state.player.y-a.y)>65)continue;const ready=state.restoredSites?.includes(a.id);g.disc(a.x,a.y,1.9,ready?'#d8cd9c':'#a1ac81',.025,16);g.box(a.x,a.y-.85,.13,.13,1.2,'#9e7a59');g.box(a.x,a.y-.85,1.2,.12,.6,ready?'#719975':'#b8ad8e',.8);if(ready){drawObject3d(g,{type:'bench',x:a.x,y:a.y+.5});drawObject3d(g,{type:'flower',x:a.x+1.25,y:a.y+.2});drawObject3d(g,{type:'lamp',x:a.x-1.2,y:a.y});}}};
const townlifeFingerprintBeforeV06=sceneryFingerprint;
sceneryFingerprint=function(){return townlifeFingerprintBeforeV06()+':sites'+JSON.stringify(state.restoredSites||[])};
document.addEventListener('click',e=>{const b=e.target.closest('[data-townlife]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();ensureTownlifeV06();const action=b.dataset.townlife,id=b.dataset.id;
 if(action==='stars')showTownlifeV06();if(action==='hotel')showHotelV06();if(action==='abilities')showAbilitiesV06();if(action==='areas')showExplorationJournalV06();if(action==='close')hideModal();if(action==='learn')learnAbilityV06(id);if(action==='inviteGuest')inviteHotelGuestV06(Number(b.dataset.index));if(action==='talkGuest')talkHotelGuestV06();if(action==='welcomeGuest')welcomeHotelGuestV06();if(action==='buildHotel'){if(!canAfford('hotel')){toast('Gather 8 wood, 6 stone and 3 flowers for the guesthouse.');return;}startPlacing('hotel');}if(action==='findGuest'&&state.hotelGuest){const n=npcData[state.hotelGuest.index];pendingGuestWalkV06=n.index;goTo(n.x,n.y,n.name);}if(action==='travel'){const a=TOWNLIFE_AREAS_V06.find(a=>a.id===id);if(a&&state.learnedAbilities.includes(a.ability))goTo(a.x,a.y,a.name);}if(action==='restore')restoreExplorationSiteV06(id);
},true);
