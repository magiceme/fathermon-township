const {test,expect}=require('playwright/test');
const fs=require('node:fs/promises');

// Isolated expansion fixtures start after the existing story; the separate
// gameplay suite completes Chapters 1–3 through production quest actions.
async function expansionGame(page){
 await page.goto('/');await page.locator('#studioSplash').waitFor({state:'detached'});await page.waitForFunction(()=>typeof startGame==='function');
 await page.evaluate(()=>{
  selected=0;startGame(false);
  Object.assign(state,{quest:6,chapter2Started:true,chapter2Step:6,chapter2Complete:true,workshopVisited:true,workshopRestored:true,chapter3Started:true,chapter3Step:6,chapter3Complete:true,storyStarted:true});
  storySession=false;hideModal();
  window.expansionQA={
   close(){if(!$('interiorOverlay').classList.contains('hidden'))leaveInterior();hideModal();},
   approach(o,radius=3){for(let j=0;j<32;j++){const a=j*Math.PI/16,p={x:o.x+Math.cos(a)*radius,y:o.y+Math.sin(a)*radius};if(validMove(p.x,p.y)){state.player=p;walkTarget=null;return;}}throw Error('No approach');},
   supplies(k,n){let tries=0;while(state[k]<n&&tries++<200){this.close();const kinds=k==='wood'?['tree','log']:k==='stone'?['rock']:['flowers'];let o=obstacles.find(o=>kinds.includes(o.kind)&&!state.harvested.includes(o.id));if(!o){dayAdvance();continue;}this.approach(o,1.5);const before=state[k];gather(o);if(state[k]===before)throw Error('Gather failed');}if(state[k]<n)throw Error('Missing '+k);this.close();},
   site(type,center=null,min=0,max=Infinity){for(let x=10;x<=32;x+=.75)for(let y=10;y<=30;y+=.75){if(center&&(Math.hypot(x-center.x,y-center.y)<min||Math.hypot(x-center.x,y-center.y)>max))continue;if(canSite(x,y,null,type))return {x,y};}throw Error('No site '+type);},
   build(type,center=null,min=0,max=Infinity){for(const k of ['wood','stone','petals'])this.supplies(k,COST[type][k]);this.close();const p=this.site(type,center,min,max);this.approach(p,3);const before=state.built.length;startPlacing(type);buildAt(p.x,p.y);if(state.built.length!==before+1)throw Error('Build '+type+' failed: '+$('toast').textContent);this.close();return state.built.at(-1);},
   resident(i=1){const h=this.build('cottage');chooseInvitation(i);this.close();return h;}
  };
  ensureCommunityV06();if(typeof ensureTownlifeV06==='function')ensureTownlifeV06();updateHUD();
 });
 await fs.mkdir('docs/screenshots',{recursive:true});
}

test('expanded world and ten actual 3D meshes retain distinct shapes and lower-detail variants',async({page})=>{
 await expansionGame(page);
 const models=await page.evaluate(()=>NAMES.map((name,i)=>{const high=getCharacterModelV06(i,false),low=getCharacterModelV06(i,true),meta=characterModelInfoV06(i,false);return {name,...meta,finite:[...high,...low].every(Number.isFinite),high:high.length,low:low.length,cached:high===getCharacterModelV06(i,false)};}));
 expect(models).toHaveLength(10);for(const m of models){expect(m.finite).toBe(true);expect(m.cached).toBe(true);expect(m.height).toBeCloseTo(1.3,2);expect(m.high).toBeGreaterThan(m.low);expect(m.triangles).toBeGreaterThan(1000);}
 const size=await page.evaluate(()=>({ratio:fathermonWorldInfo.areaRatio,width:WORLD_V06.maxX-WORLD_V06.minX,height:WORLD_V06.maxY-WORLD_V06.minY}));expect(size.ratio).toBeGreaterThan(30);expect(size.width).toBe(256);expect(size.height).toBe(240);
 await expect.poll(()=>page.evaluate(()=>fathermonGraphicsStats.frames)).toBeGreaterThan(2);
 await page.keyboard.down('d');await page.waitForTimeout(450);await page.keyboard.up('d');
 expect(await page.evaluate(()=>characterMotionV06.get('player').phase)).toBeGreaterThan(0);expect(await page.evaluate(()=>gl.getError())).toBe(0);
 await page.screenshot({path:'docs/screenshots/expanded-town.png'});
 await page.evaluate(()=>showCharacterPreviewV06(0));await page.waitForTimeout(300);await expect(page.locator('#modelPreviewV06')).toBeVisible();await page.screenshot({path:'docs/screenshots/model-closeup.png'});
});

test('creative workshop makes custom furniture with materials and conserved inspiration',async({page})=>{
 await expansionGame(page);
 const result=await page.evaluate(()=>{
  expansionQA.supplies('wood',3);expansionQA.supplies('stone',1);expansionQA.supplies('petals',1);ensureCommunityV06();
  state.nextArtisanDesign={type:'artisanBench',palette:'coast',motif:'ripple'};
  const before={wood:state.wood,stone:state.stone,petals:state.petals,inspiration:artisanInspirationV06()},b=expansionQA.build('artisanBench');
  const made={wood:state.wood,stone:state.stone,petals:state.petals,inspiration:artisanInspirationV06(),style:{...b.style}};
  undoDesign();const undone={wood:state.wood,inspiration:artisanInspirationV06(),count:state.built.filter(b=>b.type==='artisanBench').length};
  redoDesign();const redone=state.built.find(b=>b.type==='artisanBench');showArtisanWorkshopV06();
  return {before,made,undone,redone:!!redone,redoStyle:redone?.style};
 });
 expect(result.made.wood).toBe(result.before.wood-3);expect(result.made.stone).toBe(result.before.stone-1);expect(result.made.petals).toBe(result.before.petals-1);expect(result.made.inspiration).toBe(result.before.inspiration-3);expect(result.made.style).toMatchObject({wall:'#709da8',roof:'#d6e7d9',window:'#81c7cf'});
 expect(result.undone).toEqual({wood:result.before.wood,inspiration:result.before.inspiration,count:0});expect(result.redone).toBe(true);expect(result.redoStyle).toEqual(result.made.style);
 await page.screenshot({path:'docs/screenshots/workshop-custom-furniture.png'});
});

test('modular home wings add true collision and ten persistent interior spaces',async({page})=>{
 await expansionGame(page);
 const result=await page.evaluate(()=>{
  const home=expansionQA.build('cottage'),index=state.built.indexOf(home);
  expansionQA.supplies('wood',12);expansionQA.supplies('stone',10);
  // The real module fit check decides which clear plot can hold the annex.
  let site=null;for(let x=11;x<31&&!site;x+=1)for(let y=11;y<30&&!site;y+=1){const old=home.addons;home.addons={porch:true,wing:true,chimney:true};if(homeModulesFitV06(home,x,y))site={x,y};home.addons=old;}
  if(!site)throw Error('No room for modular home fixture');expansionQA.approach(site,5);moveStructure(home,site.x,site.y);expansionQA.close();
  const before={wood:state.wood,stone:state.stone};addHomeModuleV06(index,'porch');expansionQA.close();addHomeModuleV06(index,'chimney');expansionQA.close();addHomeModuleV06(index,'wing');expansionQA.close();
  const wing=homeRectsV06(home).at(-1),blocked=!validMove(wing.x,wing.y),after={wood:state.wood,stone:state.stone},modules={...home.addons};
  enterInterior('player');const tiles=$('interiorOverlay').querySelectorAll('.floorTile').length;
  // An authentic workshop item is used in the extra room.
  expansionQA.close();expansionQA.supplies('wood',1);expansionQA.supplies('petals',1);craftFurniture('chair');expansionQA.close();enterInterior('player');uiSelectedFurniture='chair';placeFurniture(7,4);expansionQA.close();
  const denied=addHomeModuleV06(index,'wing')===false;expansionQA.close();persist();const loaded=loadSave();
  showHouseStyle(index);return {before,after,modules,blocked,tiles,denied,savedModules:loaded.built.find(b=>b.type==='cottage').addons,savedItem:loaded.interiors.player.items.find(i=>i.x===7&&i.y===4)};
 });
 expect(result.after).toEqual({wood:result.before.wood-8,stone:result.before.stone-8});expect(result.modules).toEqual({porch:true,chimney:true,wing:true});expect(result.blocked).toBe(true);expect(result.tiles).toBe(40);expect(result.denied).toBe(true);expect(result.savedModules).toEqual(result.modules);expect(result.savedItem).toEqual({id:'chair',x:7,y:4,rotation:0});
 await page.screenshot({path:'docs/screenshots/modular-home-workshop.png'});await page.evaluate(()=>{hideModal();const h=state.built.find(b=>b.type==='cottage');state.player=nearestWalkable({x:h.x+1.7,y:h.y+4},3);scene3d.yaw=.9;scene3d.pitch=.55;setZoom(1.5);});await page.waitForTimeout(450);await page.screenshot({path:'docs/screenshots/modular-home-exterior.png'});
});

test('community welcome project requires a real useful layout and rewards once',async({page})=>{
 await expansionGame(page);
 const result=await page.evaluate(()=>{
  const home=expansionQA.resident(1);state.friendships[1]=2;
  const before=communityProjectStatusV06('welcome:1');completeCommunityProjectV06('welcome:1');expansionQA.close();const premature=!!state.communityProjects['welcome:1'];
  expansionQA.build('bench',home,3,6.5);expansionQA.build('flower',home,3,6.5);expansionQA.build('lamp',home,3,6.5);state.nextArtisanDesign=residentDesignWishV06(1);expansionQA.build(state.nextArtisanDesign.type,home,3,6.5);
  const ready=communityProjectStatusV06('welcome:1').ready,coins=state.coins;completeCommunityProjectV06('welcome:1');expansionQA.close();const earned=state.coins-coins,after=state.coins;completeCommunityProjectV06('welcome:1');expansionQA.close();
  showCommunityProjectsV06();return {initial:before.ready,premature,ready,earned,repeat:state.coins-after,complete:!!state.communityProjects['welcome:1'],friendship:state.friendships[1]};
 });
 expect(result).toEqual({initial:false,premature:false,ready:true,earned:30,repeat:0,complete:true,friendship:6});await page.screenshot({path:'docs/screenshots/community-projects.png'});
});

test('town stars unlock a hotel; guests require chat and a vacant home to move in',async({page})=>{
 await expansionGame(page);
 const result=await page.evaluate(()=>{
  const startStars=townRatingV06().stars,noHotel=inviteHotelGuestV06(2);expansionQA.resident(1);expansionQA.build('flower');const oneStar=townRatingV06().stars;
  const hotel=expansionQA.build('hotel'),invited=inviteHotelGuestV06(2);expansionQA.close();const temporary={guests:visitingGuestIndicesV06(),residents:[...state.residents]};
  const beforeChat=welcomeHotelGuestV06();talkHotelGuestV06();expansionQA.close();const noVacancy=welcomeHotelGuestV06();expansionQA.close();
  expansionQA.build('cottage');const welcomed=welcomeHotelGuestV06();expansionQA.close();const residents=[...state.residents],guestGone=state.hotelGuest===null;
  dayAdvance();inviteHotelGuestV06(3);expansionQA.close();dayAdvance();const departed=state.hotelGuest===null&&!state.residents.includes(3);
  showHotelV06();return {startStars,noHotel,oneStar,invited,temporary,beforeChat,noVacancy,welcomed,residents,guestGone,departed,hotel:hotel.type};
 });
 expect(result).toEqual({startStars:0,noHotel:false,oneStar:1,invited:true,temporary:{guests:[2],residents:[1]},beforeChat:false,noVacancy:false,welcomed:true,residents:[1,2],guestGone:true,departed:true,hotel:'hotel'});await page.screenshot({path:'docs/screenshots/hotel-guests.png'});await page.evaluate(()=>{hideModal();const h=hotelBuildingV06();state.player=nearestWalkable({x:h.x,y:h.y+4},3);scene3d.yaw=.85;scene3d.pitch=.6;setZoom(1.5);});await page.waitForTimeout(450);await page.screenshot({path:'docs/screenshots/hotel-exterior.png'});
});

test('learned workshop abilities consume supplies and physically open new areas',async({page})=>{
 await expansionGame(page);
 const result=await page.evaluate(()=>{
  const tooEarly=learnAbilityV06('trailcraft');expansionQA.close();expansionQA.resident(1);expansionQA.build('flower');
  const blockedBefore=[validMove(-23,10),validMove(17,-25),validMove(70,15)];
  expansionQA.supplies('wood',3);expansionQA.supplies('stone',1);expansionQA.supplies('petals',1);const before={wood:state.wood,stone:state.stone,petals:state.petals},learned=learnAbilityV06('trailcraft');expansionQA.close();const after={wood:state.wood,stone:state.stone,petals:state.petals};const repeat=learnAbilityV06('trailcraft');expansionQA.close();
  const groveOpened=validMove(-23,10),otherStillLocked=!validMove(17,-25)&&!validMove(70,15);
  expansionQA.resident(2);expansionQA.build('hotel');expansionQA.build('bench');expansionQA.build('lamp');expansionQA.supplies('wood',1);expansionQA.supplies('petals',1);craftFurniture('chair');expansionQA.close();const stars=townRatingV06().stars;
  expansionQA.supplies('wood',8);expansionQA.supplies('stone',9);expansionQA.supplies('petals',8);const climbed=learnAbilityV06('climbing');expansionQA.close();const surveyed=learnAbilityV06('surveying');expansionQA.close();
  const otherOpened=validMove(17,-25)&&validMove(70,15);state.player=nearestWalkable({x:-32,y:21},4);const coins=state.coins,discovered=discoverAreasV06(),firstReward=state.coins-coins;discoverAreasV06();const noRepeatReward=state.coins===coins+firstReward;
  expansionQA.supplies('wood',3);expansionQA.supplies('stone',2);expansionQA.supplies('petals',2);state.player=nearestWalkable({x:-32,y:21},2);const restored=restoreExplorationSiteV06('grove');expansionQA.close();persist();const save=loadSave();showAbilitiesV06();
  return {tooEarly,blockedBefore,before,after,learned,repeat,groveOpened,otherStillLocked,stars,climbed,surveyed,otherOpened,discovered,firstReward,noRepeatReward,restored,savedAbilities:save.learnedAbilities,savedSites:save.restoredSites};
 });
 expect(result.tooEarly).toBe(false);expect(result.blockedBefore).toEqual([false,false,false]);expect(result.after).toEqual({wood:result.before.wood-3,stone:result.before.stone-1,petals:result.before.petals-1});
 expect(result).toMatchObject({learned:true,repeat:false,groveOpened:true,otherStillLocked:true,stars:2,climbed:true,surveyed:true,otherOpened:true,discovered:true,firstReward:15,noRepeatReward:true,restored:true});expect(result.savedAbilities).toEqual(['trailcraft','climbing','surveying']);expect(result.savedSites).toEqual(['grove']);await page.screenshot({path:'docs/screenshots/workshop-abilities.png'});
});
