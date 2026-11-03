const {test,expect}=require('playwright/test');
const fs=require('node:fs/promises');

// These fixtures isolate optional beta systems after the three story chapters.
// Story progression itself is exercised through gameplay in the other suites.
const errorsByPage=new WeakMap();
async function lifeGame(page){
 const errors=[];errorsByPage.set(page,errors);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');await page.locator('#studioSplash').waitFor({state:'detached'});
 await page.evaluate(()=>{
  selected=0;startGame(false);
  Object.assign(state,{quest:6,chapter2Started:true,chapter2Step:6,chapter2Complete:true,workshopVisited:true,workshopRestored:true,chapter3Started:true,chapter3Step:6,chapter3Complete:true,storyStarted:true,clock:12,weather:'sunny',wood:300,stone:300,petals:300,coins:1000});
  storySession=false;hideModal();
  window.lifeQA={
   close(){if(!$('interiorOverlay').classList.contains('hidden'))leaveInterior();hideModal();stopDesigner();},
   stars(){
    state.residents=[1,2,3];state.friendships[1]=8;state.craftedCount=3;
    state.communityProjects={'welcome:1':{day:state.day}};state.discoveredAreas=['grove'];state.learnedAbilities=['trailcraft','climbing','surveying'];
    state.built=[...state.residents.map((r,i)=>({uid:'qa_home_'+r,type:'cottage',resident:r,x:-10+i*7,y:70})),{uid:'qa_hotel',type:'hotel',x:18,y:70},...Array.from({length:6},(_,i)=>({uid:'qa_flower_'+i,type:'flower',x:-10+i*3,y:80}))];
    ensureCommunityV06();ensureTownlifeV06();ensureServicesV06();ensureGuestsV06();geometryDirty=true;
   },
   approach(o,radius=4){for(let j=0;j<32;j++){const a=j*Math.PI/16,p={x:o.x+Math.cos(a)*radius,y:o.y+Math.sin(a)*radius};if(validMove(p.x,p.y)){state.player=p;walkTarget=null;return;}}throw Error('No safe approach');},
   build(type){
    this.close();let site=null;
    // Reserve actual clearance for the largest service expansion.
    if(SERVICE_DEFS_V06[type])serviceLevelProbeV06={type,level:3};
    try{for(let y=40;y<=100&&!site;y+=1)for(let x=-10;x<=38&&!site;x+=1){state.player={x:20.5,y:18.5};if(canSite(x,y,null,type))site={x,y};}}finally{serviceLevelProbeV06=null;}
    if(!site)throw Error('No clear site for '+type);this.approach(site,5);const before=state.built.length;
    if(SERVICE_DEFS_V06[type])buildServiceV06(type);else startPlacing(type);
    buildAt(site.x,site.y);this.close();if(state.built.length!==before+1)throw Error('Construction failed: '+type+' '+$('toast').textContent);
    return state.built.at(-1);
   }
  };
  ensureCollectionsV06();ensureBiomesV06();ensureDailyV06();ensureHomeLifeV06();updateHUD();
 });
 await fs.mkdir('docs/screenshots',{recursive:true});
}
async function capture(page,path){await page.waitForTimeout(250);await page.screenshot({path,animations:'disabled'});}
test.afterEach(async({page})=>{
 expect(errorsByPage.get(page)||[]).toEqual([]);
 if(!page.isClosed())expect(await page.evaluate(()=>typeof gl!=='undefined'&&glReady?gl.getError():0)).toBe(0);
});

test('62 collectible species have reachable rarity windows and crafted tools catch physical specimens',async({page})=>{
 await lifeGame(page);
 const result=await page.evaluate(()=>{
  const categories=Object.fromEntries(Object.keys(COLLECTION_CATEGORY_V06).map(k=>[k,CATALOG_V06.filter(c=>c.category===k).length]));
  const originalDay=state.day,unreachable=CATALOG_V06.filter(c=>{state.day=1+28*TOWN_SEASONS_V06.findIndex(s=>collectionSeasonsV06(c).includes(s.id));const h=c.hours[0]+.01,pool=collectionCandidatesV06(c.category,c.biome,h,c.weather[0]),at=pool.indexOf(c),total=pool.reduce((n,v)=>n+COLLECTION_TIERS_V06[v.tier],0),prefix=pool.slice(0,at).reduce((n,v)=>n+COLLECTION_TIERS_V06[v.tier],0);return selectCollectionV06(c.category,c.biome,(prefix+COLLECTION_TIERS_V06[c.tier]/2)/total,h,c.weather[0])?.id!==c.id;}).map(c=>c.id);state.day=originalDay;
  let legendary=0;for(let i=0;i<10000;i++)if(selectCollectionV06('plant','meadow',collectionRollV06('rarity:'+i),22,'sunny').tier==='legendary')legendary++;
  const before={wood:state.wood,stone:state.stone,petals:state.petals};state.workshopRestored=false;const denied=craftToolV06('net');state.workshopRestored=true;
  const net=craftToolV06('net');lifeQA.close();const pole=craftToolV06('pole');lifeQA.close();const after={wood:state.wood,stone:state.stone,petals:state.petals};const duplicate=craftToolV06('net');
  const bug=getCollectionNodesV06(20,20,24,'bug')[0];if(!bug)throw Error('No physical insect');state.player={x:bug.x,y:bug.y};walkTarget=null;
  const caught=catchBugV06(bug.id),repeat=catchBugV06(bug.id),bugOwned=state.collectionInventory[bug.specimenId];
  state.player={x:20.5,y:18.5};showFishing();miniFishing.begin=performance.now()-Math.asin(.02)*320;const fishBefore=state.fish,reeled=reelFish(),fishGain=state.fish-fishBefore;
  const fishIds=CATALOG_V06.filter(c=>c.category==='fish'&&state.collectionInventory[c.id]>0).map(c=>c.id),fish=fishIds[0],fishLedger=fishIds.reduce((n,id)=>n+state.collectionInventory[id],0);
  lifeQA.close();makeMeal();lifeQA.close();const spentFish=state.collectionInventory[fish],doubleUse=removeCollectibleV06(fish);
  showCollectionsV06();return {categories,unreachable,legendary,before,after,denied,net,pole,duplicate,caught,repeat,bugOwned,reeled,fishGain,fishLedger,spentFish,doubleUse,foundAfterUse:state.collectionFound.includes(fish),metrics:{bugs:state.dailyLifeV06.metrics.catchBug,fish:state.dailyLifeV06.metrics.fish}};
 });
 expect(result.categories).toEqual({plant:20,bug:15,fish:15,artifact:12});expect(result.unreachable).toEqual([]);expect(result.legendary).toBeGreaterThan(0);expect(result.legendary).toBeLessThan(200);
 expect(result.after).toEqual({wood:result.before.wood-5,stone:result.before.stone-1,petals:result.before.petals-2});
 for(const k of ['net','pole','caught','reeled','foundAfterUse'])expect(result[k],k).toBe(true);
 for(const k of ['denied','duplicate','repeat','doubleUse'])expect(result[k],k).toBe(false);
 expect(result.bugOwned).toBe(1);expect(result.fishGain).toBe(1);expect(result.fishLedger).toBe(1);expect(result.spentFish).toBe(0);expect(result.metrics).toEqual({bugs:1,fish:1});
 await capture(page,'docs/screenshots/collection-journal.png');
});

test('museum requires town stars, consumes exact exhibits and expands with clearance, materials and undo',async({page})=>{
 await lifeGame(page);
 const result=await page.evaluate(()=>{
  const locked=buildServiceV06('museum');lifeQA.stars();const stars=townRatingV06().stars,before={wood:state.wood,stone:state.stone,petals:state.petals},museum=lifeQA.build('museum'),built={wood:state.wood,stone:state.stone,petals:state.petals},index=state.built.indexOf(museum);
  const missing=donateCollectibleV06('dewbell');collectSpecimenV06('dewbell',2);collectSpecimenV06('ribbonclover');const donated=donateCollectibleV06('dewbell');lifeQA.close();const repeat=donateCollectibleV06('dewbell'),exact={dewbell:state.collectionInventory.dewbell,ribbonclover:state.collectionInventory.ribbonclover};
  const ids=['ribbonclover','peachwhisk','claywhistle','oldtownseal'];for(const id of ids){if(!state.collectionInventory[id])collectSpecimenV06(id);donateCollectibleV06(id);lifeQA.close();}state.discoveredBiomes=['hot'];
  const ready=serviceMissionStatusV06(index).ready,resources={wood:state.wood,stone:state.stone,petals:state.petals},cost=serviceUpgradeCostV06(museum),f1=serviceFootprintV06('museum',1),f2=serviceFootprintV06('museum',2),point={x:museum.x+f1[0]+.21,y:museum.y};
  const walkBefore=validMove(point.x,point.y),obstruction={uid:'qa_expansion_obstruction',type:'flower',x:museum.x+3.08,y:museum.y};state.built.push(obstruction);
  const obstructed=upgradeServiceV06(index),noSpend={wood:state.wood,stone:state.stone,petals:state.petals};state.built.splice(state.built.indexOf(obstruction),1);lifeQA.approach(museum,5);
  const upgraded=upgradeServiceV06(index),after={wood:state.wood,stone:state.stone,petals:state.petals},walkAfter=validMove(point.x,point.y);lifeQA.close();undoDesign();const undo={level:state.built[index].level,wood:state.wood,stone:state.stone,petals:state.petals};redoDesign();const redo=state.built[index].level;
  persist();const saved=loadSave();showServiceV06(index);return {locked,stars,before,built,missing,donated,repeat,exact,ready,resources,cost,f1,f2,walkBefore,obstructed,noSpend,upgraded,after,walkAfter,undo,redo,savedLevel:saved.built.find(b=>b.uid===museum.uid)?.level,exhibits:state.donatedCollection.length,rewards:state.museumRewards};
 });
 expect(result.locked).toBe(false);expect(result.stars).toBeGreaterThanOrEqual(3);expect(result.built).toEqual({wood:result.before.wood-12,stone:result.before.stone-10,petals:result.before.petals-3});
 expect(result.missing).toBe(false);expect(result.donated).toBe(true);expect(result.repeat).toBe(false);expect(result.exact).toEqual({dewbell:1,ribbonclover:1});expect(result.exhibits).toBe(5);expect(result.rewards).toContain(5);expect(result.ready).toBe(true);
 expect(result.obstructed).toBe(false);expect(result.noSpend).toEqual(result.resources);expect(result.upgraded).toBe(true);expect(result.f2[0]).toBeGreaterThan(result.f1[0]);expect(result.walkBefore).toBe(true);expect(result.walkAfter).toBe(false);
 expect(result.after).toEqual({wood:result.resources.wood-result.cost.wood,stone:result.resources.stone-result.cost.stone,petals:result.resources.petals-result.cost.petals});expect(result.undo).toEqual({level:1,...result.resources});expect(result.redo).toBe(2);expect(result.savedLevel).toBe(2);
 await capture(page,'docs/screenshots/museum-exhibits.png');
});

test('pizzeria harvests and fish are spent once, park meetings consume meals and daily stock returns',async({page})=>{
 await lifeGame(page);
 const result=await page.evaluate(()=>{
  lifeQA.stars();const pizzeria=lifeQA.build('pizzeria'),park=lifeQA.build('park'),greenhouse=lifeQA.build('greenhouse'),pi=state.built.indexOf(pizzeria),pa=state.built.indexOf(park),gr=state.built.indexOf(greenhouse);
  const dry=cookPizzaV06(pi);state.produce.sungrain=2;collectSpecimenV06('dappleminnow');const wood=state.wood,baked=cookPizzaV06(pi);lifeQA.close();const pizza={crop:state.produce.sungrain,fish:state.fish,specimen:state.collectionInventory.dappleminnow,wood:state.wood,count:state.pizzas};const invalid=sharePizzaV06(pi,'original_9'),friend=state.friendships[1],shared=sharePizzaV06(pi,'original_1');lifeQA.close();const repeat=sharePizzaV06(pi,'original_1');
  state.meals=2;const parkFriend=state.friendships[1],meeting=holdParkMeetingV06(pa);lifeQA.close();const meetingRepeat=holdParkMeetingV06(pa),meals=state.meals,gathering={...state.parkGathering};
  const coins=state.coins,seedBefore=state.seeds.sungrain,bought=[];for(let i=0;i<5;i++){bought.push(buyGreenhouseSeedV06(gr,'sungrain'));lifeQA.close();}const spending=coins-state.coins,seeds=state.seeds.sungrain-seedBefore;
  dayAdvance();lifeQA.close();const tomorrowMeeting=holdParkMeetingV06(pa);lifeQA.close();const tomorrowSeed=buyGreenhouseSeedV06(gr,'sungrain');showServiceV06(pi);
  return {dry,baked,wood,pizza,invalid,shared,repeat,friendGain:state.friendships[1]-friend,parkFriendGain:parkFriend-friend,meeting,meetingRepeat,meals,gathering,bought,spending,seeds,tomorrowMeeting,tomorrowSeed};
 });
 expect(result.dry).toBe(false);expect(result.baked).toBe(true);expect(result.pizza).toEqual({crop:0,fish:0,specimen:0,wood:result.wood-1,count:1});expect(result.invalid).toBe(false);expect(result.shared).toBe(true);expect(result.repeat).toBe(false);expect(result.parkFriendGain).toBe(3);expect(result.friendGain).toBe(5);
 expect(result.meeting).toBe(true);expect(result.meetingRepeat).toBe(false);expect(result.meals).toBe(1);expect(result.gathering.uid).toBeTruthy();expect(result.bought).toEqual([true,true,true,true,false]);expect(result.spending).toBe(48);expect(result.seeds).toBe(4);expect(result.tomorrowMeeting).toBe(true);expect(result.tomorrowSeed).toBe(true);
 await capture(page,'docs/screenshots/pizzeria-and-town-services.png');
});

test('three daily tasks follow real actions, claim once, persist and reset on the next town day',async({page})=>{
 await lifeGame(page);
 const first=await page.evaluate(()=>{
  lifeQA.stars();state.built.push({uid:'qa_daily_garden',type:'garden',x:20,y:42,growth:0,watered:false,crop:'vegetable'});ensureDailyV06();state.dailyLifeV06.taskIds=['craft','water','talk'];state.dailyLifeV06.claimed=[];
  const unearned=claimDailyTaskV06('craft'),coins=state.coins,inspiration=state.inspirationEarned;
  craftFurniture('chair');lifeQA.close();tendPlot(state.built.length-1,'water');lifeQA.close();state.player={x:npcData[1].x+.5,y:npcData[1].y};talkTo(1);lifeQA.close();talkTo(1);lifeQA.close();
  const claims=state.dailyLifeV06.taskIds.map(id=>claimDailyTaskV06(id)),again=claimDailyTaskV06('craft'),progress={...state.dailyLifeV06.metrics};persist();const saved=loadSave();showDailyBoardV06();
  return {unearned,claims,again,coinGain:state.coins-coins,inspirationGain:state.inspirationEarned-inspiration,progress,saved:saved.dailyLifeV06.claimed};
 });
 expect(first.unearned).toBe(false);expect(first.claims).toEqual([true,true,true]);expect(first.again).toBe(false);expect(first.coinGain).toBe(36);expect(first.inspirationGain).toBe(3);expect(first.progress).toMatchObject({craft:1,water:1,talk:1,dailyClaims:3});expect(first.saved).toEqual(['craft','water','talk']);
 await capture(page,'docs/screenshots/daily-tasks.png');
 const achievement=await page.evaluate(()=>{const early=claimAchievementV06('maker');for(let i=0;i<4;i++){craftFurniture('chair');lifeQA.close();}const progress=achievementProgressV06('maker'),coins=state.coins,inspiration=state.inspirationEarned,claimed=claimAchievementV06('maker'),repeat=claimAchievementV06('maker');persist();return {early,progress,claimed,repeat,coins:state.coins-coins,inspiration:state.inspirationEarned-inspiration,saved:loadSave().dailyLifeV06.achievementClaims};});
 expect(achievement).toMatchObject({early:false,progress:{value:5,target:5,complete:true,claimed:false},claimed:true,repeat:false,coins:25,inspiration:3});expect(achievement.saved).toContain('maker');
 const reset=await page.evaluate(()=>{const totals={...state.dailyLifeV06.totals},day=state.day;dayAdvance();lifeQA.close();ensureDailyV06();return {day:state.day,previous:day,claims:state.dailyLifeV06.claimed,tasks:state.dailyLifeV06.taskIds,metrics:state.dailyLifeV06.metrics,totals,before:totals.dailyClaims,after:state.dailyLifeV06.totals.dailyClaims};});
 expect(reset.day).toBe(reset.previous+1);expect(reset.claims).toEqual([]);expect(new Set(reset.tasks).size).toBe(3);expect(Object.values(reset.metrics).every(n=>n===0)).toBe(true);expect(reset.after).toBe(reset.before);
});

test('watered gardens need four minutes per stage and calendar keepsakes require dated participation once yearly',async({page})=>{
 await lifeGame(page);
 const result=await page.evaluate(()=>{
  const plot={uid:'qa_timed_garden',type:'garden',x:20,y:42,crop:'sungrain',growth:0,watered:false};state.built.push(plot);const idx=state.built.length-1;
  tendPlot(idx,'water');lifeQA.close();const wateredAt=plot.wateredAtV06,before=advanceGardenTimeV06(wateredAt+239999),stageBefore=plot.growth,one=advanceGardenTimeV06(wateredAt+240000),stageOne=plot.growth,dry=advanceGardenTimeV06(wateredAt+86400000),stageDry=plot.growth;
  tendPlot(idx,'harvest');lifeQA.close();const premature=state.produce.sungrain;
  tendPlot(idx,'water');lifeQA.close();const secondAt=plot.wateredAtV06;advanceGardenTimeV06(secondAt+240000);tendPlot(idx,'water');lifeQA.close();advanceGardenTimeV06(plot.wateredAtV06+240000);tendPlot(idx,'harvest');lifeQA.close();const harvested=state.produce.sungrain;
  saveCalendarProfileV06(2,29,'America/New_York');const birthdayDate=new Date('2027-02-28T17:00:00Z'),birthdayBefore=claimCalendarEventV06('birthday',birthdayDate);recordDailyMetricV06('talk',1,'birthday-neighbor',birthdayDate);const birthday=claimCalendarEventV06('birthday',birthdayDate),birthdayRepeat=claimCalendarEventV06('birthday',birthdayDate);
  const january=new Date('2027-01-01T17:00:00Z'),holidayBefore=claimCalendarEventV06('newyear',january);recordDailyMetricV06('gather',5,null,january);const holiday=claimCalendarEventV06('newyear',january),holidayRepeat=claimCalendarEventV06('newyear',january),boundary=calendarPartsV06(new Date('2027-01-01T04:30:00Z')).key;
  persist();const saved=loadSave();showCalendarV06();return {before,stageBefore,one,stageOne,dry,stageDry,premature,harvested,birthdayBefore,birthday,birthdayRepeat,holidayBefore,holiday,holidayRepeat,boundary,savedBirthday:saved.birthdayProfileV06,claims:saved.dailyLifeV06.festivalClaims};
 });
 expect(result).toMatchObject({before:0,stageBefore:0,one:1,stageOne:1,dry:0,stageDry:1,premature:0,harvested:3,birthdayBefore:false,birthday:true,birthdayRepeat:false,holidayBefore:false,holiday:true,holidayRepeat:false,boundary:'2026-12-31',savedBirthday:{month:2,day:29}});expect(result.claims).toEqual(expect.arrayContaining(['2027-birthday','2027-newyear']));
 await capture(page,'docs/screenshots/calendar-birthday-holidays.png');
});

test('30 original guest meshes are finite and cached; hotel exclusivity and paid neighborhood homes persist',async({page})=>{
 await lifeGame(page);
 const models=await page.evaluate(()=>EXTENDED_GUESTS_V06.map(g=>{const a=getExtendedGuestModelV06(g.id),low=getExtendedGuestModelV06(g.id,true);let hash=0;for(let i=0;i<a.length;i+=8)hash=(Math.imul(hash,31)+Math.round(a[i]*10000)+Math.round(a[i+1]*10000)*7+Math.round(a[i+2]*10000)*13)|0;return {id:g.id,name:g.name,finite:[...a,...low].every(Number.isFinite),cached:a===getExtendedGuestModelV06(g.id),high:a.length,low:low.length,shape:hash,height:extendedGuestModelInfoV06(g.id).height,lines:g.lines.length};}));
 expect(models).toHaveLength(30);expect(new Set(models.map(m=>m.name)).size).toBe(30);expect(new Set(models.map(m=>m.shape)).size).toBe(30);for(const m of models){expect(m.finite).toBe(true);expect(m.cached).toBe(true);expect(m.high).toBeGreaterThan(m.low);expect(m.height).toBeCloseTo(1.3,2);expect(m.lines).toBeGreaterThanOrEqual(8);}
 const result=await page.evaluate(()=>{
  lifeQA.stars();const invited=inviteExtendedGuestV06('ext00');lifeQA.close();const originalBlocked=inviteHotelGuestV06(4),extraBlocked=inviteExtendedGuestV06('ext01'),beforeChat=welcomeExtendedGuestV06();talkExtendedGuestV06('ext00');lifeQA.close();const noHome=welcomeExtendedGuestV06(),plot=guestHousePlotsV06().find(p=>p.id==='orchard-0'),coins=state.coins,reserved=reserveGuestHousePlotV06(plot.id);lifeQA.close();const reservation=coins-state.coins;
  state.player={x:plot.x,y:plot.y+4};walkTarget=null;const before={wood:state.wood,stone:state.stone,petals:state.petals},built=buildGuestHousePlotV06(plot.id);lifeQA.close();const after={wood:state.wood,stone:state.stone,petals:state.petals},cost={...COST.guestCottage},welcomed=welcomeExtendedGuestV06();lifeQA.close();const home=guestCottageForV06('ext00'),key=guestInteriorKeyV06('ext00');ensureInterior(key).items=[{id:'chair',x:1,y:1,rotation:1}];
  const sameDayBlocked=inviteExtendedGuestV06('ext01');persist();const saved=loadSave(),savedHome=saved.built.find(b=>b.guestResident==='ext00');dayAdvance();lifeQA.close();const originalInvited=inviteHotelGuestV06(4);lifeQA.close();const reverseBlocked=inviteExtendedGuestV06('ext02');showGuestDirectoryV06();
  return {invited,originalBlocked,extraBlocked,beforeChat,noHome,reserved,reservation,plotPrice:plot.coins,built,before,after,cost,welcomed,sameDayBlocked,originalInvited,reverseBlocked,home:{guest:home.guestResident,resident:home.resident,plot:home.guestPlot},savedHome,savedResidents:saved.extendedResidents,savedInterior:saved.interiors[key],guestGone:saved.extendedHotelGuest===null};
 });
 expect(result).toMatchObject({invited:true,originalBlocked:false,extraBlocked:false,beforeChat:false,noHome:false,reserved:true,built:true,welcomed:true,sameDayBlocked:false,originalInvited:true,reverseBlocked:false,guestGone:true});expect(result.reservation).toBe(result.plotPrice);expect(result.after).toEqual({wood:result.before.wood-result.cost.wood,stone:result.before.stone-result.cost.stone,petals:result.before.petals-result.cost.petals});expect(result.home).toEqual({guest:'ext00',resident:null,plot:'orchard-0'});expect(result.savedHome).toMatchObject({guestResident:'ext00',guestPlot:'orchard-0'});expect(result.savedResidents).toContain('ext00');expect(result.savedInterior.items).toContainEqual({id:'chair',x:1,y:1,rotation:1});
 await expect(page.locator('[data-guest-v06="profile"]')).toHaveCount(30);await capture(page,'docs/screenshots/30-original-guests.png');
});

test('river walking is blocked until a nearby bridge spends materials and creates a connected crossing',async({page})=>{
 await lifeGame(page);
 const result=await page.evaluate(()=>{
  state.learnedAbilities=['surveying'];state.traversalMode='walk';const x=riverCenterV06(14);state.player={x:x-4,y:14};walkTarget=null;
  const beforeWalk=validMove(x,14),before={wood:state.wood,stone:state.stone},built=buildRiverBridgeV06('meadow');lifeQA.close();const after={wood:state.wood,stone:state.stone},crossing=Array.from({length:17},(_,i)=>validMove(x-4+i*.5,14)),repeat=buildRiverBridgeV06('meadow');persist();const saved=loadSave();showBridgesV06();return {beforeWalk,before,built,after,crossing,repeat,saved:saved.bridges};
 });
 expect(result.beforeWalk).toBe(false);expect(result.built).toBe(true);expect(result.after).toEqual({wood:result.before.wood-7,stone:result.before.stone-3});expect(result.crossing.every(Boolean)).toBe(true);expect(result.repeat).toBe(false);expect(result.saved).toContain('meadow');await capture(page,'docs/screenshots/buildable-river-bridges.png');
});

test('28-day seasons gate rare visitors, give seasonal harvests and rain waters exactly one growth stage',async({page})=>{
 await lifeGame(page);
 const result=await page.evaluate(()=>{
  const seasons=[1,28,29,57,85,113].map(day=>{const s=seasonInfoV06(day);return {day,season:s.id,inSeason:s.day,year:s.year};});
  const cactus=collectionDefinitionV06('crowncactus');state.day=1;const spring=collectionAvailableV06(cactus,12,'sunny');state.day=29;const summer=collectionAvailableV06(cactus,12,'sunny');
  state.built.push({uid:'qa_season_crop',type:'garden',x:20,y:42,crop:'sungrain',growth:3,watered:false});const index=state.built.length-1;tendPlot(index,'harvest');lifeQA.close();const seasonalHarvest=state.produce.sungrain;
  state.day=28;ensureDailyV06();const noParticipation=claimSeasonFestivalV06();for(const o of obstacles.filter(o=>['tree','log','rock','flowers'].includes(o.kind)).slice(0,3)){lifeQA.approach(o,1.4);gather(o);lifeQA.close();}const coins=state.coins,celebrated=claimSeasonFestivalV06(),festivalReward=state.coins-coins,repeat=claimSeasonFestivalV06();lifeQA.close();dayAdvance();lifeQA.close();const rolled=seasonInfoV06().id;
  const rainy=Array.from({length:110},(_,i)=>i+2).find(day=>['rain','storm'].includes(forecastWeatherV06(day,20,42,12).id));const plot=state.built[index];plot.growth=0;plot.watered=false;delete plot.wateredAtV06;state.day=rainy-1;dayAdvance();lifeQA.close();const watered=plot.watered,stage=plot.growth,at=plot.wateredAtV06;const grown=advanceGardenTimeV06(at+240000),longAbsence=advanceGardenTimeV06(at+86400000),finalStage=plot.growth;
  const deterministic=JSON.stringify(forecastWeatherV06(42,-55,10,12))===JSON.stringify(forecastWeatherV06(42,-55,10,12)),cold=Array.from({length:28},(_,i)=>forecastWeatherV06(i+1,10,-60,12).id);showWeatherForecastV06();
  return {seasons,spring,summer,seasonalHarvest,noParticipation,celebrated,festivalReward,repeat,rolled,rainy,watered,stage,grown,longAbsence,finalStage,deterministic,cold};
 });
 expect(result.seasons).toEqual([{day:1,season:'spring',inSeason:1,year:1},{day:28,season:'spring',inSeason:28,year:1},{day:29,season:'summer',inSeason:1,year:1},{day:57,season:'autumn',inSeason:1,year:1},{day:85,season:'winter',inSeason:1,year:1},{day:113,season:'spring',inSeason:1,year:2}]);
 expect(result).toMatchObject({spring:false,summer:true,seasonalHarvest:4,noParticipation:false,celebrated:true,festivalReward:30,repeat:false,rolled:'summer',watered:true,stage:0,grown:1,longAbsence:0,finalStage:1,deterministic:true});expect(result.rainy).toBeGreaterThan(1);expect(result.cold).toContain('snow');expect(result.cold.every(id=>['snow','cloudy'].includes(id))).toBe(true);await capture(page,'docs/screenshots/seasons-and-regional-weather.png');
});

test('built home furniture supports real meal costs, daily care, persistent lighting and sleeping to morning',async({page})=>{
 await lifeGame(page);
 await page.evaluate(()=>{
  lifeQA.stars();state.built.push({uid:'qa_player_home',type:'cottage',resident:0,x:30,y:60});state.biomeMaterials.coralPearl=2;
  for(const id of ['bed','table','lamp','plant','aquarium']){craftFurniture(id);lifeQA.close();}
  enterInterior('player');roomToolV06='place';for(const [id,x,y]of [['bed',1,1],['table',3,1],['lamp',4,1],['plant',1,3],['aquarium',3,3]]){uiSelectedFurniture=id;placeFurniture(x,y);}roomToolV06='use';renderInterior();state.meals=1;state.homeLifeV06.energy=40;
 });
 await page.evaluate(()=>useHomeFurnitureV06(3,1));await page.locator('[data-home-life="eat"]').click();expect(await page.evaluate(()=>state.meals)).toBe(0);expect(await page.evaluate(()=>state.homeLifeV06.energy)).toBe(65);
 const care=await page.evaluate(()=>{const flowers=state.petals,water=performHomeActionV06('water',1,3),waterRepeat=performHomeActionV06('water',1,3),feed=performHomeActionV06('feed',3,3),feedRepeat=performHomeActionV06('feed',3,3);performHomeActionV06('light',4,1);persist();return {water,waterRepeat,feed,feedRepeat,flowerCost:flowers-state.petals,savedLamp:loadSave().interiors.player.items.find(i=>i.id==='lamp').lit};});
 expect(care).toEqual({water:true,waterRepeat:false,feed:true,feedRepeat:false,flowerCost:1,savedLamp:false});
 await page.locator('[data-interior-view="3d"]').click();await expect(page.locator('#room3DCanvasV06')).toBeVisible();await capture(page,'docs/screenshots/house-lived-in-3d.png');expect(await page.evaluate(()=>$('room3DCanvasV06').getContext('webgl2').getError())).toBe(0);await page.evaluate(()=>useHomeFurnitureV06(1,1));await capture(page,'docs/screenshots/house-furniture-interactions.png');const day=await page.evaluate(()=>state.day);await page.locator('[data-home-life="sleep"]').click();expect(await page.evaluate(()=>state.day)).toBe(day+1);expect(await page.evaluate(()=>state.clock)).toBeLessThan(9);expect(await page.evaluate(()=>state.homeLifeV06.energy)).toBe(100);await expect(page.locator('#interiorOverlay')).toBeVisible();
});

test('Chromebook keyboard and Shift-trackpad camera coexist with editable diary text',async({page})=>{
 await lifeGame(page);await page.evaluate(()=>{state.player={x:20.5,y:18.5};walkTarget=null;scene3d.yaw=.8;});
 const pos=await page.evaluate(()=>({...state.player}));await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');expect(await page.evaluate(p=>dist(state.player,p),pos)).toBeGreaterThan(.1);
 const yaw=await page.evaluate(()=>scene3d.yaw),canvas=await page.locator('#world3d').boundingBox();await page.keyboard.down('Shift');await page.mouse.move(canvas.x+canvas.width*.5,canvas.y+canvas.height*.45);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width*.5+90,canvas.y+canvas.height*.45+20,{steps:8});await page.mouse.up();await page.keyboard.up('Shift');expect(Math.abs(await page.evaluate(()=>scene3d.yaw)-yaw)).toBeGreaterThan(.1);
 await page.evaluate(()=>showHomeDiaryV06());await page.locator('#homeDiaryEntryV06').pressSequentially('We walked, built a bridge, and shared pizza.');await page.locator('[data-home-life="saveDiary"]').click();expect(await page.evaluate(()=>state.homeLifeV06.diary.at(-1).text)).toBe('We walked, built a bridge, and shared pizza.');await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();
});

test('touch movement and camera joysticks respond to real pointer drags and release cleanly',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();await lifeGame(page);
 await page.evaluate(()=>{state.player={x:20.5,y:18.5};walkTarget=null;scene3d.yaw=.8;});
 const move=await page.locator('#joystick').boundingBox(),camera=await page.locator('#cameraStickV06').boundingBox();expect(move.width).toBeGreaterThan(60);expect(camera.width).toBeGreaterThan(40);
 for(const r of [move,camera]){expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(391);expect(r.y+r.height).toBeLessThanOrEqual(845);}
 const before=await page.evaluate(()=>({...state.player}));await page.mouse.move(move.x+move.width/2,move.y+move.height/2);await page.mouse.down();await page.mouse.move(move.x+move.width*.86,move.y+move.height/2,{steps:5});await page.waitForTimeout(400);await page.mouse.up();expect(await page.evaluate(p=>dist(state.player,p),before)).toBeGreaterThan(.1);expect(await page.evaluate(()=>Math.hypot(joyX,joyY))).toBe(0);
 const yaw=await page.evaluate(()=>scene3d.yaw);await page.mouse.move(camera.x+camera.width/2,camera.y+camera.height/2);await page.mouse.down();await page.mouse.move(camera.x+camera.width*.9,camera.y+camera.height/2,{steps:5});await page.waitForTimeout(400);await page.mouse.up();expect(Math.abs(await page.evaluate(()=>scene3d.yaw)-yaw)).toBeGreaterThan(.1);expect(await page.evaluate(()=>Math.hypot(cameraAxesV06.x,cameraAxesV06.y))).toBe(0);
 await capture(page,'docs/screenshots/dual-touch-joysticks.png');expect(errorsByPage.get(page)).toEqual([]);expect(await page.evaluate(()=>gl.getError())).toBe(0);await context.close();
});
