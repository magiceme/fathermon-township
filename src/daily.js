/* Daily life follows completed actions. The calendar uses the player's chosen
 * real-world timezone; town days keep the original .045-hour clock. */
const DAILY_METRICS_V06=['gather','flowers','water','harvest','craft','talk','fish','catchBug','collect','cook','donate','shop','explore','walk','favor','gift','build','upgrade','mission','moveIn','dailyClaims','festivalClaims'];
const DAILY_TASKS_V06={
 gather:{title:'A basket of possibilities',detail:'Gather 8 materials from the world.',metric:'gather',target:8,icon:'🧺'},
 flowers:{title:'Follow the wildflowers',detail:'Gather 3 meadow flowers.',metric:'flowers',target:3,icon:'🌼'},
 stroll:{title:'A little fresh air',detail:'Walk 36 tiles around your township.',metric:'walk',target:36,icon:'👣'},
 water:{title:'A drink for the garden',detail:'Water a growing garden plot.',metric:'water',target:1,icon:'💧'},
 craft:{title:'Made with your own paws',detail:'Complete one piece of workshop furniture.',metric:'craft',target:1,icon:'🪚'},
 talk:{title:'Make time for a neighbor',detail:'Have a first conversation with a neighbor or guest today.',metric:'talk',target:1,icon:'💬'},
 fish:{title:'A moment by the water',detail:'Catch 2 fish with your fishing pole.',metric:'fish',target:2,icon:'🎣'},
 bugs:{title:'Small wonders',detail:'Catch 2 bugs with your bug net.',metric:'catchBug',target:2,icon:'🦋'},
 cook:{title:'Something warm to share',detail:'Cook a meal from your ingredients.',metric:'cook',target:1,icon:'🍲'},
 donate:{title:'A story for the museum',detail:'Donate one new specimen at the museum.',metric:'donate',target:1,icon:'🏛️'},
 shop:{title:'Support a local shop',detail:'Buy one item from a town shop.',metric:'shop',target:1,icon:'🛍️'},
 explore:{title:'Beyond familiar paths',detail:'Discover one new area or biome.',metric:'explore',target:1,icon:'🧭'}
};
const CALENDAR_FESTIVALS_V06=[
 {id:'newyear',month:1,day:1,name:'First Light Festival',icon:'🌅',metric:'gather',target:5,activity:'Gather 5 materials for a fresh beginning.',keepsake:'First-light lantern'},
 {id:'spring',month:3,day:20,name:'Sprout Day',icon:'🌱',metric:'water',target:2,activity:'Water 2 garden plots to welcome spring.',keepsake:'Little sprout medal'},
 {id:'blossom',month:4,day:22,name:'Wildflower Celebration',icon:'🌸',metric:'flowers',target:5,activity:'Gather 5 meadow flowers for the celebration.',keepsake:'Pressed blossom album'},
 {id:'summer',month:6,day:21,name:'Sunlit Waters Day',icon:'☀️',metric:'fish',target:2,activity:'Catch 2 fish during the longest-day celebration.',keepsake:'Golden river shell'},
 {id:'friendship',month:8,day:1,name:'Neighbor Appreciation Day',icon:'💛',metric:'talk',target:2,activity:'Share a first daily conversation with 2 neighbors or guests.',keepsake:'Friendship ribbon'},
 {id:'harvest',month:9,day:22,name:'Harvest Hearth Festival',icon:'🍂',metric:'harvest',target:2,activity:'Harvest 2 ready garden plots.',keepsake:'Amber harvest basket'},
 {id:'lantern',month:10,day:31,name:'Little Lantern Night',icon:'🏮',metric:'catchBug',target:2,activity:'Catch 2 tiny visitors with your bug net.',keepsake:'Moon-moth lantern'},
 {id:'winter',month:12,day:21,name:'Winter Workshop Festival',icon:'❄️',metric:'craft',target:2,activity:'Make 2 pieces of furniture to brighten a cozy home.',keepsake:'Snowflake workshop star'}
];
const GARDEN_STAGE_MS_V06=4*60*1000;
const DAILY_COUNTER_CAP_V06=10000000;
const initializedDailyStatesV06=new WeakSet();
const dailyCountV06=value=>Number.isFinite(value)?Math.floor(Math.max(0,Math.min(DAILY_COUNTER_CAP_V06,value))):0;
function dailyCountersV06(value){return Object.fromEntries(DAILY_METRICS_V06.map(key=>[key,dailyCountV06(value?.[key])]));}
function dailyValidTimezoneV06(value){try{if(typeof value!=='string'||value.length>80)return false;new Intl.DateTimeFormat('en-US',{timeZone:value}).format();return true;}catch{return false;}}
function calendarPartsV06(date=new Date()){
 const actual=date instanceof Date?date:new Date(date);const valid=Number.isFinite(actual.getTime())?actual:new Date();
 const zone=dailyValidTimezoneV06(state?.calendarTimezone)?state.calendarTimezone:'America/New_York';
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',weekday:'long'}).formatToParts(valid).map(part=>[part.type,part.value]));
 return {year:Number(parts.year),month:Number(parts.month),day:Number(parts.day),weekday:parts.weekday,key:parts.year+'-'+parts.month+'-'+parts.day,zone};
}
function dailyTaskPoolV06(){
 const pool=['gather','flowers','stroll'];
 if(state.built?.some(b=>b.type==='garden'))pool.push('water');
 if(state.workshopRestored)pool.push('craft');
 if(state.residents?.length||state.hotelGuest||state.extendedHotelGuest||state.extendedResidents?.length)pool.push('talk');
 if(state.tools?.pole)pool.push('fish');
 if(state.tools?.net)pool.push('bugs');
 if((state.fish>0&&state.petals>0)||Object.values(state.produce||{}).some(n=>n>=2))pool.push('cook');
 if(state.built?.some(b=>b.type==='museum'))pool.push('donate');
 if(state.coins>=7&&state.built?.some(b=>b.type==='market'||b.type==='shop'))pool.push('shop');
 if(typeof TOWNLIFE_AREAS_V06!=='undefined'&&TOWNLIFE_AREAS_V06.some(area=>state.learnedAbilities?.includes(area.ability)&&!state.discoveredAreas?.includes(area.id)))pool.push('explore');
 return pool;
}
function makeDailyTaskIdsV06(){
 const pool=dailyTaskPoolV06();let seed=state.day*7919;for(const c of state.townName||'Town')seed=(seed*31+c.charCodeAt(0))>>>0;
 for(let i=pool.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,3);
}
function resetDailyBoardV06(){const life=state.dailyLifeV06;life.day=state.day;life.metrics=dailyCountersV06();life.claimed=[];life.talkSources=[];life.taskIds=makeDailyTaskIdsV06();}
function ensureDailyV06(){
 if(!state)return;
 if(!initializedDailyStatesV06.has(state)){
  const raw=state.dailyLifeV06&&typeof state.dailyLifeV06==='object'?state.dailyLifeV06:{};
  const totals=dailyCountersV06(raw.totals);
  if(!raw.totals){totals.gather=dailyCountV06(Object.values(state.gathered||{}).reduce((a,b)=>a+(Number(b)||0),0));totals.craft=dailyCountV06(state.craftedCount);totals.talk=dailyCountV06(state.talked?.length);totals.harvest=dailyCountV06(state.gardensHarvested);totals.favor=dailyCountV06(state.fulfilledRequests);totals.fish=dailyCountV06(state.fish);totals.cook=dailyCountV06(state.meals);}
  state.calendarTimezone=dailyValidTimezoneV06(state.calendarTimezone)?state.calendarTimezone:'America/New_York';
  const month=dailyCountV06(state.birthdayProfileV06?.month),day=dailyCountV06(state.birthdayProfileV06?.day);
  const validBirthday=month>=1&&month<=12&&day>=1&&day<=new Date(2000,month,0).getDate();
  state.birthdayProfileV06=validBirthday?{month,day}:null;
  const safeIds=(list,allowed,limit=100)=>[...new Set((Array.isArray(list)?list:[]).filter(id=>typeof id==='string'&&allowed(id)))].slice(-limit);
  state.dailyLifeV06={day:dailyCountV06(raw.day),metrics:dailyCountersV06(raw.metrics),totals,taskIds:safeIds(raw.taskIds,id=>Object.hasOwn(DAILY_TASKS_V06,id),3),claimed:safeIds(raw.claimed,id=>Object.hasOwn(DAILY_TASKS_V06,id),3),talkSources:safeIds(raw.talkSources,id=>/^[\w:-]{1,60}$/.test(id),100),achievementClaims:safeIds(raw.achievementClaims,id=>DAILY_ACHIEVEMENTS_V06.some(a=>a.id===id)),festivalDate:typeof raw.festivalDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw.festivalDate)?raw.festivalDate:'',festivalMetrics:dailyCountersV06(raw.festivalMetrics),festivalClaims:safeIds(raw.festivalClaims,id=>/^\d{4}-(?:birthday|newyear|spring|blossom|summer|friendship|harvest|lantern|winter)$/.test(id),1000)};
  initializedDailyStatesV06.add(state);
 }
 const life=state.dailyLifeV06;
 if(life.day!==state.day||life.taskIds.length!==3)resetDailyBoardV06();
 life.claimed=life.claimed.filter(id=>life.taskIds.includes(id));
}
function recordDailyMetricV06(type,count=1,source=null,date=new Date()){
 if(!state||!DAILY_METRICS_V06.includes(type)||!Number.isFinite(count)||count<=0)return false;
 ensureDailyV06();const life=state.dailyLifeV06;
 if(type==='talk'&&source){const key=String(source).replace(/[^\w:-]/g,'').slice(0,60);if(life.talkSources.includes(key))return false;life.talkSources.push(key);}
 const n=Math.min(10000,Math.floor(count));if(!n)return false;
 life.metrics[type]=Math.min(DAILY_COUNTER_CAP_V06,life.metrics[type]+n);life.totals[type]=Math.min(DAILY_COUNTER_CAP_V06,life.totals[type]+n);
 const today=calendarPartsV06(date).key;if(life.festivalDate!==today){life.festivalDate=today;life.festivalMetrics=dailyCountersV06();}life.festivalMetrics[type]=Math.min(DAILY_COUNTER_CAP_V06,life.festivalMetrics[type]+n);
 if(type!=='walk')persist();return true;
}
function claimDailyTaskV06(id){
 ensureDailyV06();const life=state.dailyLifeV06,task=DAILY_TASKS_V06[id];
 if(!task||!life.taskIds.includes(id)||life.claimed.includes(id))return false;
 if(life.metrics[task.metric]<task.target){toast('Keep going — your task progress is saved.');return false;}
 life.claimed.push(id);state.coins+=12;state.inspirationEarned=(state.inspirationEarned||0)+1;recordDailyMetricV06('dailyClaims',1);persist();updateHUD();sound(820);toast('Daily task complete · +12 coins · +1 Inspiration');return true;
}
const DAILY_ACHIEVEMENTS_V06=[
 {id:'firstBasket',name:'A little of everything',detail:'Gather 10 materials.',metric:'gather',target:10,icon:'🧺'},
 {id:'forager',name:'The familiar trails',detail:'Gather 100 materials.',metric:'gather',target:100,icon:'🌿'},
 {id:'watering',name:'A garden routine',detail:'Water growing plots 10 times.',metric:'water',target:10,icon:'💧'},
 {id:'harvest',name:'From seed to supper',detail:'Harvest 5 ready plots.',metric:'harvest',target:5,icon:'🥕'},
 {id:'maker',name:'The first workshop shelf',detail:'Craft 5 furniture pieces.',metric:'craft',target:5,icon:'🪚'},
 {id:'artisan',name:'Made in our township',detail:'Craft 25 furniture pieces.',metric:'craft',target:25,icon:'🛠️'},
 {id:'conversations',name:'There is always time to chat',detail:'Share 10 first daily conversations.',metric:'talk',target:10,icon:'💬'},
 {id:'helpful',name:'A neighbor to count on',detail:'Fulfill 5 neighbor requests.',metric:'favor',target:5,icon:'💛'},
 {id:'angler',name:'Stories from the riverbank',detail:'Catch 10 fish.',metric:'fish',target:10,icon:'🎣'},
 {id:'bugwatcher',name:'The very small neighbors',detail:'Catch 10 bugs with your net.',metric:'catchBug',target:10,icon:'🦋'},
 {id:'fieldCollector',name:'Look a little closer',detail:'Collect 10 wild plants or artifacts.',metric:'collect',target:10,icon:'🔎'},
 {id:'chef',name:'A table for everyone',detail:'Cook 10 meals.',metric:'cook',target:10,icon:'🍲'},
 {id:'curator',name:'A collection with a story',detail:'Donate 10 museum specimens.',metric:'donate',target:10,icon:'🏛️'},
 {id:'shopper',name:'Keep it local',detail:'Make 10 shop purchases.',metric:'shop',target:10,icon:'🛍️'},
 {id:'walker',name:'One small step, again',detail:'Walk 500 tiles.',metric:'walk',target:500,icon:'👣'},
 {id:'biomes',name:'A world beyond the meadow',detail:'Discover the jungle, cold and hot biomes.',value:()=>state.discoveredBiomes?.length||0,target:3,icon:'🌎'},
 {id:'decorator',name:'Make room for cozy',detail:'Place 12 pieces of indoor furniture.',value:()=>state.interiorPlaced||0,target:12,icon:'🛋️'},
 {id:'neighbors',name:'Room for new friends',detail:'Welcome 3 permanent neighbors.',value:()=>(state.residents?.length||0)+(state.extendedResidents?.length||0),target:3,icon:'🏡'},
 {id:'lessons',name:'A new way to wander',detail:'Learn 3 field abilities.',value:()=>state.learnedAbilities?.length||0,target:3,icon:'🧭'},
 {id:'townStars',name:'Somewhere to belong',detail:'Reach a 3-star township.',value:()=>typeof townRatingV06==='function'?townRatingV06().stars:0,target:3,icon:'⭐'},
 {id:'community',name:'Built together',detail:'Complete 2 community projects.',value:()=>typeof communityProjectCountV06==='function'?communityProjectCountV06():0,target:2,icon:'🌳'},
 {id:'daily',name:'The little things add up',detail:'Claim 12 daily tasks.',metric:'dailyClaims',target:12,icon:'📌'},
 {id:'festivals',name:'A year of little celebrations',detail:'Take part in 3 calendar festivals.',metric:'festivalClaims',target:3,icon:'🏮'},
 {id:'upgrades',name:'Room to grow',detail:'Complete 3 service building upgrades.',metric:'upgrade',target:3,icon:'🏗️'},
 {id:'missions',name:'A town full of purpose',detail:'Complete 5 service missions.',metric:'mission',target:5,icon:'📋'}
];
function achievementProgressV06(id){ensureDailyV06();const a=DAILY_ACHIEVEMENTS_V06.find(item=>item.id===id);if(!a)return null;const value=dailyCountV06(a.value?a.value():state.dailyLifeV06.totals[a.metric]);return {id:a.id,value,target:a.target,complete:value>=a.target,claimed:state.dailyLifeV06.achievementClaims.includes(id)};}
function claimAchievementV06(id){const progress=achievementProgressV06(id);if(!progress?.complete||progress.claimed)return false;state.dailyLifeV06.achievementClaims.push(id);state.coins+=25;state.inspirationEarned=(state.inspirationEarned||0)+3;persist();updateHUD();sound(940);toast('Achievement celebrated · +25 coins · +3 Inspiration');return true;}
function currentCalendarEventsV06(date=new Date()){
 ensureDailyV06();const today=calendarPartsV06(date),events=CALENDAR_FESTIVALS_V06.filter(event=>event.month===today.month&&event.day===today.day).map(event=>({...event}));
 const birthday=state.birthdayProfileV06,leap=new Date(today.year,1,29).getMonth()===1;
 if(birthday&&birthday.month===today.month&&(birthday.day===today.day||birthday.month===2&&birthday.day===29&&!leap&&today.day===28))events.push({id:'birthday',month:today.month,day:today.day,name:'Happy birthday, '+NAMES[state.avatar]+'!',icon:'🎂',metric:'talk',target:1,activity:'Share a birthday conversation with a neighbor or guest.',keepsake:'Birthday wishing star'});
 return events.map(event=>({...event,dateKey:today.key,claimKey:today.year+'-'+event.id,progress:state.dailyLifeV06.festivalDate===today.key?Math.min(event.target,state.dailyLifeV06.festivalMetrics[event.metric]):0,claimed:state.dailyLifeV06.festivalClaims.includes(today.year+'-'+event.id)}));
}
function claimCalendarEventV06(id,date=new Date()){
 const event=currentCalendarEventsV06(date).find(item=>item.id===id);if(!event||event.claimed)return false;
 if(event.progress<event.target){toast('Join the celebration first: '+event.activity);return false;}
 state.dailyLifeV06.festivalClaims.push(event.claimKey);state.coins+=35;state.inspirationEarned=(state.inspirationEarned||0)+5;recordDailyMetricV06('festivalClaims',1,null,date);persist();updateHUD();sound(1040);toast(event.icon+' '+event.keepsake+' collected · +35 coins · +5 Inspiration',4800);return true;
}
function saveCalendarProfileV06(month,day,timezone){
 if(!dailyValidTimezoneV06(timezone)){toast('Choose a valid calendar timezone.');return false;}
 month=Number(month);day=Number(day);if(month===0&&day===0){state.birthdayProfileV06=null;}else if(Number.isInteger(month)&&month>=1&&month<=12&&Number.isInteger(day)&&day>=1&&day<=new Date(2000,month,0).getDate()){state.birthdayProfileV06={month,day};}else{toast('Choose a valid birthday month and day. No year is needed.');return false;}
 state.calendarTimezone=timezone;persist();toast('Calendar preferences saved.');return true;
}
function townDayScheduleV06(){const hour=state.clock;return hour>=6&&hour<11?{name:'Morning',text:'Neighbors greet one another around the plaza. A good time to water your garden.'}:hour>=11&&hour<17?{name:'Afternoon',text:'The workshop, little pond and gardens are lively. Gather, make something and explore.'}:hour>=17&&hour<21?{name:'Evening',text:'Neighbors gather for an evening walk. Finish a favor or share a meal.'}:{name:'Night',text:'The township settles near home. Watch the quiet water, decorate indoors or rest until morning.'};}
function dailyFooterV06(){return '<div class="actions"><button class="btn secondary" data-daily="board">Daily tasks</button><button class="btn secondary" data-daily="calendar">Calendar</button><button class="btn secondary" data-daily="achievements">Achievements</button><button class="btn secondary" data-ui="close">Back to town</button></div>';}
function showDailyBoardV06(){
 ensureDailyV06();const life=state.dailyLifeV06,schedule=townDayScheduleV06();
 showModal(`<div class="eyebrow">TOWN DAY ${state.day} · ${schedule.name.toUpperCase()}</div><h2>A little purpose for today</h2><p class="sub">${schedule.text} Three tasks refresh each new town day. Completed tasks award 12 coins and 1 Inspiration; claim them before the next day.</p><div class="cardlist">${life.taskIds.map(id=>{const t=DAILY_TASKS_V06[id],done=life.claimed.includes(id),progress=Math.min(t.target,life.metrics[t.metric]);return `<section class="biome-farm-card"><h3>${t.icon} ${t.title}</h3><p>${t.detail}</p><p class="sub">${progress}/${t.target}${done?' · Reward claimed':''}</p><progress max="${t.target}" value="${progress}" aria-label="${esc(t.title)} progress" style="width:100%"></progress><div class="actions"><button class="btn" data-daily="claimTask" data-daily-id="${id}" ${done||progress<t.target?'disabled':''}>${done?'Claimed':'Claim reward'}</button></div></section>`;}).join('')}</div><p class="sub">Watered crops also grow while you are away. Each watering supports one stage after 4 real minutes or the next town day.</p>${dailyFooterV06()}`);
}
function showAchievementsV06(){
 ensureDailyV06();showModal(`<div class="eyebrow">THE STORY IN SMALL ACCOMPLISHMENTS</div><h2>Township achievements</h2><p class="sub">${state.dailyLifeV06.achievementClaims.length}/${DAILY_ACHIEVEMENTS_V06.length} celebrated. Each achievement awards 25 coins and 3 Inspiration once per township.</p><div class="cardlist">${DAILY_ACHIEVEMENTS_V06.map(a=>{const p=achievementProgressV06(a.id);return `<section class="biome-farm-card"><h3>${a.icon} ${a.name}</h3><p class="sub">${a.detail} · ${Math.min(p.value,p.target)}/${p.target}</p><button class="btn secondary" data-daily="claimAchievement" data-daily-id="${a.id}" ${p.claimed||!p.complete?'disabled':''}>${p.claimed?'Celebrated':p.complete?'Celebrate · +25 coins':'In progress'}</button></section>`;}).join('')}</div>${dailyFooterV06()}`);
}
function showCalendarV06(){
 ensureDailyV06();const today=calendarPartsV06(),events=currentCalendarEventsV06(),birthday=state.birthdayProfileV06||{month:0,day:0},schedule=townDayScheduleV06();
 const zones=[...new Set(['America/New_York','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Australia/Sydney','Etc/UTC',state.calendarTimezone])];
 const keepsakes=state.dailyLifeV06.festivalClaims.map(key=>{const id=key.replace(/^\d{4}-/,'');return {year:key.slice(0,4),name:id==='birthday'?'Birthday wishing star':CALENDAR_FESTIVALS_V06.find(e=>e.id===id)?.keepsake};}).filter(item=>item.name);
 showModal(`<div class="eyebrow">REAL-WORLD CALENDAR · ${esc(today.zone)}</div><h2>${today.weekday}, ${today.month}/${today.day}/${today.year}</h2><p class="sub">Town day ${state.day} · ${schedule.name} · ${schedule.text} The town clock pauses in menus. Festivals follow real dates in your chosen timezone.</p><div class="cardlist">${events.length?events.map(event=>`<section class="biome-farm-card"><h3>${event.icon} ${esc(event.name)}</h3><p>${event.activity}</p><p class="sub">${event.progress}/${event.target} today · Keepsake: ${event.keepsake}</p><button class="btn" data-daily="claimFestival" data-daily-id="${event.id}" ${event.claimed||event.progress<event.target?'disabled':''}>${event.claimed?'Celebrated this year':'Collect keepsake · +35 coins'}</button></section>`).join(''):'<section class="biome-farm-card"><h3>🌿 An ordinary, lovely day</h3><p class="sub">Look after your garden, check the guesthouse and make time for a neighbor. The next special day is waiting on the calendar.</p></section>'}</div><h3>Your birthday</h3><p class="sub">Choose a month and day for a personal celebration. A February 29 birthday is celebrated February 28 in other years.</p><div class="actions"><label>Month <select id="dailyBirthdayMonthV06"><option value="0">Not set</option>${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${birthday.month===i+1?'selected':''}>${new Date(2000,i,1).toLocaleString('en-US',{month:'long'})}</option>`).join('')}</select></label><label>Day <input id="dailyBirthdayDayV06" type="number" min="0" max="31" value="${birthday.day}" style="width:5em"></label><label>Calendar timezone <select id="dailyTimezoneV06">${zones.map(zone=>`<option value="${esc(zone)}" ${zone===state.calendarTimezone?'selected':''}>${esc(zone)}</option>`).join('')}</select></label><button class="btn secondary" data-daily="saveProfile">Save calendar preferences</button></div><h3>Days to look forward to</h3><div class="cardlist">${CALENDAR_FESTIVALS_V06.map(event=>`<section class="farmrow"><b>${event.icon} ${event.month}/${event.day} · ${event.name}</b><small>${event.activity}</small></section>`).join('')}</div><h3>Festival keepsakes · ${keepsakes.length}</h3><p class="sub">${keepsakes.length?keepsakes.map(item=>esc(item.name)+' ('+item.year+')').join(' · '):'Earn rare keepsakes by participating on a festival date or your birthday. Each celebration rewards you once per year.'}</p>${dailyFooterV06()}`);
}
function advanceGardenTimeV06(now=Date.now()){
 if(!state||!Number.isFinite(now))return 0;ensureDailyV06();let stages=0,changed=false;
 for(const plot of state.built||[]){if(plot.type!=='garden')continue;const max=typeof BIOME_CROPS_V06!=='undefined'?(BIOME_CROPS_V06[plot.crop]||BIOME_CROPS_V06.vegetable).days:2;
  if(!plot.watered||plot.growth>=max){if(plot.wateredAtV06!==undefined){delete plot.wateredAtV06;changed=true;}continue;}
  if(!Number.isFinite(plot.wateredAtV06)||plot.wateredAtV06<=0||plot.wateredAtV06>now){plot.wateredAtV06=now;changed=true;continue;}
  // A long absence supports at most the one stage that was actually watered.
  const elapsed=Math.min(3*24*60*60*1000,Math.max(0,now-plot.wateredAtV06));
  if(elapsed>=GARDEN_STAGE_MS_V06){plot.growth=Math.min(max,(plot.growth||0)+1);plot.watered=false;delete plot.wateredAtV06;stages++;changed=true;}
 }
 if(changed){geometryDirty=true;persist();}return stages;
}
function gardenCountdownV06(plot,now=Date.now()){const max=typeof BIOME_CROPS_V06!=='undefined'?(BIOME_CROPS_V06[plot.crop]||BIOME_CROPS_V06.vegetable).days:2;if(plot.growth>=max)return 'Ready to harvest';if(!plot.watered)return `Stage ${plot.growth||0}/${max} · needs water`;const remaining=Math.max(0,Math.ceil((GARDEN_STAGE_MS_V06-(now-(plot.wateredAtV06||now)))/1000));return `Stage ${plot.growth||0}/${max} · next growth in ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} or tomorrow`;}
const farmBeforeDailyV06=showFarm;
showFarm=function(){advanceGardenTimeV06();farmBeforeDailyV06();const cards=$('modalBody').querySelectorAll('.biome-farm-card');state.built.filter(b=>b.type==='garden').forEach((plot,i)=>{cards[i]?.insertAdjacentHTML('beforeend',`<p class="sub" data-daily-garden="${state.built.indexOf(plot)}">⏳ ${gardenCountdownV06(plot)}</p>`);});$('modalBody').querySelector('.sub')?.insertAdjacentHTML('beforeend',' Each watering also grows one stage after 4 real minutes, including time away. Water again for the next stage.');};
const tendBeforeDailyV06=tendPlot;
tendPlot=function(index,mode){ensureDailyV06();const plot=state.built[index],beforeWater=!!plot?.watered,beforeHarvest=state.gardensHarvested||0;const result=tendBeforeDailyV06(index,mode);if(plot&&!beforeWater&&plot.watered){plot.wateredAtV06=Date.now();recordDailyMetricV06('water');persist();}if((state.gardensHarvested||0)>beforeHarvest)recordDailyMetricV06('harvest',state.gardensHarvested-beforeHarvest);return result;};
const gatherBeforeDailyV06=gather;
gather=function(resource){if(!state)return gatherBeforeDailyV06(resource);ensureDailyV06();const total=()=>Object.values(state.gathered||{}).reduce((sum,n)=>sum+(Number(n)||0),0)+Object.values(state.biomeMaterials||{}).reduce((sum,n)=>sum+(Number(n)||0),0);const before=total();const result=gatherBeforeDailyV06(resource),delta=total()-before;if(delta>0){recordDailyMetricV06('gather',delta);if(resource?.kind==='flowers')recordDailyMetricV06('flowers',delta);}return result;};
const craftBeforeDailyV06=craftFurniture;
craftFurniture=function(id){ensureDailyV06();const before=state.craftedCount||0,result=craftBeforeDailyV06(id);if(state.craftedCount>before)recordDailyMetricV06('craft',state.craftedCount-before);return result;};
const talkBeforeDailyV06=talkTo;
talkTo=function(index){ensureDailyV06();const before=state.talkCount||0,guestBefore=state.hotelGuest?.chatted,result=talkBeforeDailyV06(index);if((state.talkCount||0)>before||!guestBefore&&state.hotelGuest?.index===index&&state.hotelGuest.chatted)recordDailyMetricV06('talk',1,'original:'+index);return result;};
if(typeof talkHotelGuestV06==='function'){const hotelTalkBeforeDailyV06=talkHotelGuestV06;talkHotelGuestV06=function(){ensureDailyV06();const guest=state.hotelGuest,before=guest?.chatted,result=hotelTalkBeforeDailyV06();if(guest&&!before&&guest.chatted)recordDailyMetricV06('talk',1,'original:'+guest.index);return result;};}
const fishBeforeDailyV06=reelFish;
reelFish=function(){ensureDailyV06();const before=state.fish||0,result=fishBeforeDailyV06();if(state.fish>before)recordDailyMetricV06('fish',state.fish-before);return result;};
const mealBeforeDailyV06=makeMeal;
makeMeal=function(){ensureDailyV06();const before=state.meals||0,result=mealBeforeDailyV06();if(state.meals>before)recordDailyMetricV06('cook',state.meals-before);return result;};
if(typeof cookBiomeMealV06==='function'){const cookBeforeDailyV06=cookBiomeMealV06;cookBiomeMealV06=function(id){ensureDailyV06();const before=state.meals||0,result=cookBeforeDailyV06(id);if(state.meals>before)recordDailyMetricV06('cook',state.meals-before);return result;};}
const tradeBeforeDailyV06=trade;
trade=function(id,mode){const before=state.coins,result=tradeBeforeDailyV06(id,mode);if(mode==='buy'&&state.coins<before)recordDailyMetricV06('shop');return result;};
const favorBeforeDailyV06=fulfillRequest;
fulfillRequest=function(index){const before=state.fulfilledRequests||0,result=favorBeforeDailyV06(index);if(state.fulfilledRequests>before)recordDailyMetricV06('favor',state.fulfilledRequests-before);return result;};
const dayBeforeDailyV06=dayAdvance;
dayAdvance=function(){const previousDay=state.day;dayBeforeDailyV06();ensureDailyV06();if(state.day!==previousDay){for(const plot of state.built||[])if(plot.type==='garden')delete plot.wateredAtV06;persist();}};
const hubBeforeDailyV06=showTownHub;
showTownHub=function(){hubBeforeDailyV06();ensureDailyV06();$('modalBody').querySelector('.hubgrid')?.insertAdjacentHTML('afterbegin',`<button data-daily="board">📌 <b>Daily tasks</b><small>Day ${state.day} · ${state.dailyLifeV06.claimed.length}/3 claimed</small></button><button data-daily="calendar">🗓️ <b>Calendar</b><small>Festivals, birthdays and keepsakes</small></button><button data-daily="achievements">🏅 <b>Achievements</b><small>${state.dailyLifeV06.achievementClaims.length}/${DAILY_ACHIEVEMENTS_V06.length} celebrated</small></button>`);};
const settingsBeforeDailyV06=showControlSettings;
showControlSettings=function(){settingsBeforeDailyV06();if(state&&!paused)$('modalBody').insertAdjacentHTML('beforeend','<div class="actions"><button class="btn secondary" data-daily="calendar">Birthday and calendar preferences</button></div>');};
let dailyUpdateClockV06=0,dailyWalkRemainderV06=0;
const updateBeforeDailyV06=gameUpdate;
gameUpdate=function(dt){
 const before=state&&!paused&&!activeModal?{x:state.player.x,y:state.player.y,areas:(state.discoveredAreas?.length||0)+(state.discoveredBiomes?.length||0)}:null;
 updateBeforeDailyV06(dt);if(!state||paused)return;ensureDailyV06();
 if(before&&!activeModal){const moved=Math.hypot(state.player.x-before.x,state.player.y-before.y);if(moved<3){dailyWalkRemainderV06+=moved;if(dailyWalkRemainderV06>=1){const steps=Math.floor(dailyWalkRemainderV06);dailyWalkRemainderV06-=steps;recordDailyMetricV06('walk',steps);}}const discovered=(state.discoveredAreas?.length||0)+(state.discoveredBiomes?.length||0)-before.areas;if(discovered>0)recordDailyMetricV06('explore',discovered);}
 dailyUpdateClockV06+=Math.min(.1,Math.max(0,Number(dt)||0));if(dailyUpdateClockV06<1)return;dailyUpdateClockV06=0;
 const stages=advanceGardenTimeV06();if(stages){toast('🌱 '+stages+' watered garden'+(stages===1?' has':'s have')+' grown a stage.');if($('modalBody').querySelector('[data-daily-garden]'))showFarm();}
 else for(const label of $('modalBody').querySelectorAll('[data-daily-garden]')){const plot=state.built[Number(label.dataset.dailyGarden)];if(plot)label.textContent='⏳ '+gardenCountdownV06(plot);}
};
const startupBeforeDailyV06=systemsStartReset;
systemsStartReset=function(){startupBeforeDailyV06();ensureDailyV06();dailyUpdateClockV06=0;dailyWalkRemainderV06=0;const grown=advanceGardenTimeV06();if(grown)toast('Welcome back — '+grown+' watered garden'+(grown===1?' grew':'s grew')+' while you were away.');};
document.addEventListener('click',event=>{const button=event.target.closest('[data-daily]');if(!button||!state||paused)return;event.preventDefault();event.stopImmediatePropagation();const action=button.dataset.daily,id=button.dataset.dailyId;if(action==='board')showDailyBoardV06();else if(action==='calendar')showCalendarV06();else if(action==='achievements')showAchievementsV06();else if(action==='claimTask'){claimDailyTaskV06(id);showDailyBoardV06();}else if(action==='claimAchievement'){claimAchievementV06(id);showAchievementsV06();}else if(action==='claimFestival'){claimCalendarEventV06(id);showCalendarV06();}else if(action==='saveProfile'){if(saveCalendarProfileV06($('dailyBirthdayMonthV06').value,$('dailyBirthdayDayV06').value,$('dailyTimezoneV06').value))showCalendarV06();}},true);
