const {test,expect}=require('playwright/test');
const fs=require('node:fs/promises');

// These subsystem fixtures begin after the separately tested Chapters 1–3.
// Building placement, star evidence and route prerequisites are deterministic;
// every material used below is gathered from real production resource nodes.
async function betaGame(page){
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await page.locator('#studioSplash').waitFor({state:'detached'});
 await page.evaluate(()=>{
  selected=0;startGame(false);
  Object.assign(state,{quest:6,chapter2Started:true,chapter2Step:6,chapter2Complete:true,workshopVisited:true,workshopRestored:true,chapter3Started:true,chapter3Step:6,chapter3Complete:true,storyStarted:true,clock:12,weather:'sunny'});
  storySession=false;hideModal();
  state.residents=[1,2,3];state.friendships[1]=5;
  state.built=[
   {type:'cottage',x:12,y:14,resident:1},{type:'cottage',x:16,y:12,resident:2},{type:'cottage',x:12,y:20,resident:3},
   {type:'hotel',x:30,y:12,resident:null},{type:'garden',x:23,y:24,crop:'vegetable',growth:0,watered:false},
   {type:'flower',x:25,y:24},{type:'bench',x:26,y:22},{type:'lamp',x:26,y:20},{type:'flower',x:23,y:22},{type:'bench',x:25,y:18}
  ].map((b,i)=>({...b,uid:'beta-fixture-'+i,rotation:0}));
  state.communityProjects={'welcome:1':{day:state.day}};state.discoveredAreas=['grove'];state.craftedCount=1;
  state.learnedAbilities=['trailcraft','climbing','surveying'];
  setupWorld();setupNpcs();systemsStartReset();hideModal();
  window.betaQA={
   close(){if(!$('interiorOverlay').classList.contains('hidden'))leaveInterior();hideModal();},
   approach(o,radius=1.5){for(let j=0;j<32;j++){const a=j*Math.PI/16,p={x:o.x+Math.cos(a)*radius,y:o.y+Math.sin(a)*radius};if(validMove(p.x,p.y)){state.player=p;walkTarget=null;return;}}throw Error('No clear approach to '+o.id);},
   supplies(k,n){let attempts=0;while(state[k]<n&&attempts++<400){this.close();const kinds=k==='wood'?['tree','log']:k==='stone'?['rock']:['flowers'];const o=obstacles.find(o=>kinds.includes(o.kind)&&!state.harvested.includes(o.id));if(!o){dayAdvance();continue;}this.approach(o);const before=state[k];gather(o);if(state[k]===before)throw Error('Production gather failed for '+k);}if(state[k]<n)throw Error('Missing '+k);this.close();},
   material(id,n){const center={sunstone:{x:112,y:15},frostCrystal:{x:17,y:-68},vineFiber:{x:-65,y:17},coralPearl:{x:10,y:28}}[id];let attempts=0;while(biomeMaterialCountV06(id)<n&&attempts++<50){this.close();const o=getBiomeResourcesV06(center.x,center.y,32).find(o=>o.material===id&&!state.biomeHarvested.includes(o.id));if(!o){dayAdvance();continue;}state.player={x:o.x,y:o.y};walkTarget=null;const before=biomeMaterialCountV06(id);if(gather(o)!==true||biomeMaterialCountV06(id)!==before+1)throw Error('Production biome gather failed for '+id);}if(biomeMaterialCountV06(id)<n)throw Error('Missing '+id);this.close();},
   daylight(){this.close();state.clock=12;state.weather='sunny';geometryDirty=true;updateHUD();}
  };updateHUD();
 });
 await fs.mkdir('docs/screenshots',{recursive:true});
 return errors;
}

async function worldShot(page,name,point){
 await page.evaluate(p=>{betaQA.daylight();state.traversalMode='walk';state.player=nearestWalkable(p,4)||p;scene3d.yaw=.85;scene3d.pitch=.58;setZoom(1.35);geometryDirty=true;toastUntil=0;updateHUD();},point);
 await page.waitForTimeout(500);expect(await page.evaluate(()=>gl.getError())).toBe(0);
 await page.screenshot({path:'docs/screenshots/'+name+'.png'});
}

test('biome materials are authentic, local, unique per day, and visible in three distinct climates',async({page})=>{
 const errors=await betaGame(page);
 const result=await page.evaluate(()=>{
  const centers=[{x:112,y:15,id:'hot',material:'sunstone',crop:'sungrain'},{x:17,y:-68,id:'cold',material:'frostCrystal',crop:'frostberry'},{x:-65,y:17,id:'jungle',material:'vineFiber',crop:'junglefruit'}];
  return centers.map(center=>{
   const nodes=getBiomeResourcesV06(center.x,center.y,24).filter(o=>o.material===center.material),o=nodes[0];if(!o)throw Error('No resource in '+center.id);
   state.player={x:o.x+10,y:o.y};const distant=gather(o),before=biomeMaterialCountV06(o.material);state.player={x:o.x,y:o.y};const forged=gather({...o,id:o.id+'_fake'}),collected=gather(o),repeat=gather(o);
   return {biome:biomeAtV06(center.x,center.y).id,nodes:nodes.length,unique:new Set(nodes.map(o=>o.id)).size,stable:JSON.stringify(nodes)===JSON.stringify(getBiomeResourcesV06(center.x,center.y,24).filter(o=>o.material===center.material)),distant,forged,collected,repeat,delta:biomeMaterialCountV06(o.material)-before,seeds:state.seeds[center.crop]};
  });
 });
 for(const [i,r]of result.entries()){expect(r.biome).toBe(['hot','cold','jungle'][i]);expect(r.nodes).toBeGreaterThan(3);expect(r.unique).toBe(r.nodes);expect(r.stable).toBe(true);expect(r).toMatchObject({distant:false,forged:false,collected:true,repeat:false,delta:1,seeds:1});}
 const saved=await page.evaluate(()=>{persist();return loadSave().biomeHarvested;});expect(saved).toHaveLength(3);
 await worldShot(page,'biome-hot',{x:112,y:15});await worldShot(page,'biome-cold',{x:17,y:-68});await worldShot(page,'biome-jungle',{x:-65,y:17});expect(errors).toEqual([]);
});

test('biome seeds need three watered days, preserve ripe growth in saves, and cook real harvests',async({page})=>{
 const errors=await betaGame(page);
 const result=await page.evaluate(()=>{
  for(const id of ['sunstone','frostCrystal','vineFiber'])betaQA.material(id,1);
  const first=state.built.findIndex(b=>b.type==='garden');state.built.push({type:'garden',x:21,y:24,growth:0,watered:false},{type:'garden',x:19,y:24,growth:0,watered:false});
  const plots=[first,state.built.length-2,state.built.length-1],crops=['sungrain','frostberry','junglefruit'];
  const planted=plots.map((index,i)=>{const ok=plantBiomeCropV06(index,crops[i]);betaQA.close();return ok;});
  dayAdvance();const dry=plots.map(i=>state.built[i].growth);const stages=[];
  for(let day=0;day<3;day++){for(const index of plots){tendPlot(index,'water');betaQA.close();}dayAdvance();stages.push(plots.map(i=>state.built[i].growth));}
  persist();const ripe=loadSave().built.filter(b=>b.type==='garden').map(b=>({crop:b.crop,growth:b.growth,watered:b.watered}));
  const before=state.produce.sungrain;tendPlot(plots[0],'harvest');betaQA.close();const harvest={produce:state.produce.sungrain-before,seeds:state.seeds.sungrain,growth:state.built[plots[0]].growth};
  const foodBefore=state.meals;betaQA.supplies('petals',1);const petals=state.petals,cooked=cookBiomeMealV06('sunbread');betaQA.close();const food={cooked,produce:state.produce.sungrain,petalsUsed:petals-state.petals,meals:state.meals-foodBefore,made:state.biomeMeals.sunbread};
  const prevented=cookBiomeMealV06('sunbread');showFarm();return {planted,dry,stages,ripe,harvest,food,prevented};
 });
 expect(result.planted).toEqual([true,true,true]);expect(result.dry).toEqual([0,0,0]);expect(result.stages).toEqual([[1,1,1],[2,2,2],[3,3,3]]);expect(result.ripe).toEqual(['sungrain','frostberry','junglefruit'].map(crop=>({crop,growth:3,watered:false})));expect(result.harvest).toEqual({produce:3,seeds:1,growth:0});expect(result.food).toEqual({cooked:true,produce:1,petalsUsed:1,meals:1,made:1});expect(result.prevented).toBe(false);
 await page.screenshot({path:'docs/screenshots/biome-farming.png'});expect(errors).toEqual([]);
});

test('all thirteen workshop furniture recipes spend actual materials and save rotated, refinished and moved items',async({page})=>{
 const errors=await betaGame(page);
 const result=await page.evaluate(()=>{
  state.learnedAbilities.push('swimming','diving');state.traversalMode='dive';betaQA.material('coralPearl',2);state.traversalMode='walk';betaQA.material('vineFiber',3);betaQA.material('frostCrystal',2);betaQA.material('sunstone',1);
  const cost={wood:0,stone:0,petals:0};for(const recipe of Object.values(CRAFT_RECIPES))for(const k of Object.keys(cost))cost[k]+=recipe[k];for(const k of Object.keys(cost))betaQA.supplies(k,cost[k]);
  const before={wood:state.wood,stone:state.stone,petals:state.petals,crafted:state.craftedCount};const crafted=[];
  for(const id of Object.keys(CRAFT_RECIPES)){const previous=state.furniture[id];craftFurniture(id);crafted.push({id,delta:state.furniture[id]-previous});betaQA.close();}
  const after={wood:state.wood,stone:state.stone,petals:state.petals,crafted:state.craftedCount},biome={...state.biomeMaterials};
  enterInterior('player');Object.keys(CRAFT_RECIPES).forEach((id,i)=>{uiSelectedFurniture=id;placeFurniture(i%6,Math.floor(i/6));});
  const rotated=rotateRoomItemV06(0,0),recolored=recolorRoomItemV06(0,0,'#7babb9'),invalidColor=recolorRoomItemV06(0,0,'#badbad'),moved=moveRoomItemV06(0,0,5,4),overlap=moveRoomItemV06(5,4,1,0);
  persist();const saved=loadSave().interiors.player.items;return {cost,before,after,crafted,biome,rotated,recolored,invalidColor,moved,overlap,saved};
 });
 expect(result.crafted).toHaveLength(13);for(const item of result.crafted)expect(item.delta).toBe(1);for(const k of ['wood','stone','petals'])expect(result.before[k]-result.after[k]).toBe(result.cost[k]);expect(result.after.crafted-result.before.crafted).toBe(13);expect(result.biome).toEqual({sunstone:0,frostCrystal:0,vineFiber:0,coralPearl:0});expect(result).toMatchObject({rotated:true,recolored:true,invalidColor:false,moved:true,overlap:false});expect(result.saved).toHaveLength(13);expect(result.saved.find(i=>i.id==='chair')).toEqual({id:'chair',x:5,y:4,rotation:1,color:'#7babb9'});await page.evaluate(()=>showRoomPreviewV06());await expect(page.locator('#room3DCanvasV06')).toBeVisible();await page.waitForTimeout(200);expect(await page.evaluate(()=>$('room3DCanvasV06').getContext('webgl2').getError())).toBe(0);await page.screenshot({path:'docs/screenshots/interior-fully-furnished.png'});expect(errors).toEqual([]);
});

test('the 3D home room draws actual finite meshes and a pointer tap places furniture',async({page})=>{
 const errors=await betaGame(page);
 await page.evaluate(()=>{
  betaQA.supplies('wood',4);betaQA.supplies('petals',2);craftFurniture('sofa');betaQA.close();enterInterior('player');uiSelectedFurniture='sofa';roomToolV06='place';showRoomPreviewV06();
 });
 const canvas=page.locator('#room3DCanvasV06');await expect(canvas).toBeVisible();await page.waitForTimeout(250);
 const room=await page.evaluate(()=>{const {mesh,columns}=buildRoomMeshV06(),canvas=$('room3DCanvasV06'),r=canvas.getBoundingClientRect(),yaw=.83,pitch=.66,radius=columns+2,c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),target=[columns/2,.65,2.5],eye=[target[0]+c*cp*radius,target[1]+sp*radius,target[2]+s*cp*radius],right=[s,0,-c],up=[-c*sp,cp,-s*sp],forward=[-c*cp,-sp,-s*cp],p=[2.5-eye[0],-eye[1],3.5-eye[2]],dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),depth=dot(p,forward),tan=Math.tan(Math.PI/7),nx=dot(p,right)/(depth*(canvas.width/canvas.height)*tan),ny=dot(p,up)/(depth*tan);return {finite:[...mesh].every(Number.isFinite),vertices:mesh.length/8,error:canvas.getContext('webgl2').getError(),tap:{x:r.left+(nx+1)*r.width/2,y:r.top+(1-ny)*r.height/2}};});
 expect(room.finite).toBe(true);expect(room.vertices).toBeGreaterThan(3000);expect(room.error).toBe(0);await page.mouse.click(room.tap.x,room.tap.y);
 await expect.poll(()=>page.evaluate(()=>ensureInterior('player').items.some(i=>i.id==='sofa'&&i.x===2&&i.y===3))).toBe(true);
 await page.waitForTimeout(200);expect(await page.evaluate(()=>$('room3DCanvasV06').getContext('webgl2').getError())).toBe(0);
 await page.screenshot({path:'docs/screenshots/interior-3d.png'});expect(errors).toEqual([]);
});

test('swimming, diving and gliding lessons require stars and authentic biome supplies',async({page})=>{
 const errors=await betaGame(page);
 const result=await page.evaluate(()=>{
  const stars=townRatingV06().stars,locked={swim:setTravelModeV06('swim'),dive:setTravelModeV06('dive'),fly:setTravelModeV06('fly')};
  const original=state.residents;state.residents=[];const starLocked=learnAbilityV06('swimming');state.residents=original;betaQA.close();
  for(const k of ['wood','stone','petals'])betaQA.supplies(k,TRAVEL_LESSONS_V06.reduce((n,a)=>n+a[k],0));betaQA.material('vineFiber',6);betaQA.material('frostCrystal',2);betaQA.material('sunstone',2);
  const before={wood:state.wood,stone:state.stone,petals:state.petals,materials:{...state.biomeMaterials}},learned=[];
  for(const a of TRAVEL_LESSONS_V06){learned.push(learnAbilityV06(a.id));betaQA.close();}
  const after={wood:state.wood,stone:state.stone,petals:state.petals,materials:{...state.biomeMaterials}},again=learnAbilityV06('flight');betaQA.close();state.player={x:20,y:19};const inland=setTravelModeV06('swim');persist();return {stars,locked,starLocked,learned,before,after,again,inland,saved:loadSave().learnedAbilities};
 });
 expect(result.stars).toBe(3);expect(result.locked).toEqual({swim:false,dive:false,fly:false});expect(result.starLocked).toBe(false);expect(result.learned).toEqual([true,true,true]);expect(result.again).toBe(false);expect(result.inland).toBe(false);expect(result.before.wood-result.after.wood).toBe(9);expect(result.before.stone-result.after.stone).toBe(6);expect(result.before.petals-result.after.petals).toBe(6);expect(result.after.materials).toEqual({sunstone:0,frostCrystal:0,vineFiber:0,coralPearl:0});expect(result.saved).toEqual(['trailcraft','climbing','surveying','swimming','diving','flight']);expect(errors).toEqual([]);
});

test('water movement stays in water, pearls require diving, and flight can land safely',async({page})=>{
 const errors=await betaGame(page);
 const before=await page.evaluate(()=>{state.learnedAbilities.push('swimming','diving','flight');state.player={x:10,y:28};const swim=setTravelModeV06('swim'),pearl=getBiomeResourcesV06(10,28,2).find(o=>o.material==='coralPearl');const rejected=gather(pearl);return {swim,rejected,x:state.player.x,y:state.player.y};});
 expect(before.swim).toBe(true);expect(before.rejected).toBe(false);await page.keyboard.down('ArrowRight');await page.waitForTimeout(900);await page.keyboard.up('ArrowRight');
 const swimming=await page.evaluate(()=>({x:state.player.x,y:state.player.y,water:waterAtV06(state.player.x,state.player.y),landBlocked:!validMove(15,28)}));expect(Math.hypot(swimming.x-before.x,swimming.y-before.y)).toBeGreaterThan(.15);expect(swimming.water).toBe(true);expect(swimming.landBlocked).toBe(true);
 const dive=await page.evaluate(()=>{state.player={x:10,y:28};const entered=setTravelModeV06('dive'),pearl=availableBiomeResourcesV06(2).find(o=>o.material==='coralPearl'),gathered=gather(pearl);state.clock=12;scene3d.yaw=.8;scene3d.pitch=.54;setZoom(1.45);return {entered,gathered,count:state.biomeMaterials.coralPearl,altitude:characterAltitudeV06({player:true})};});expect(dive).toMatchObject({entered:true,gathered:true,count:1});await page.waitForTimeout(400);expect(await page.evaluate(()=>gl.getError())).toBe(0);await page.screenshot({path:'docs/screenshots/underwater-diving.png'});
 const flying=await page.evaluate(()=>{const leftWater=setTravelModeV06('walk');state.player=nearestWalkable({x:20,y:23},4);const started=setTravelModeV06('fly'),height=characterAltitudeV06({player:true}),aboveHome=validMove(state.built[0].x,state.built[0].y);return {leftWater,started,height,aboveHome,x:state.player.x,y:state.player.y};});expect(flying.leftWater).toBe(true);expect(flying.started).toBe(true);expect(flying.height).toBeGreaterThan(1.7);expect(flying.aboveHome).toBe(true);await page.keyboard.down('ArrowRight');await page.waitForTimeout(450);await page.keyboard.up('ArrowRight');expect(await page.evaluate(p=>Math.hypot(state.player.x-p.x,state.player.y-p.y),flying)).toBeGreaterThan(.2);await page.waitForTimeout(250);expect(await page.evaluate(()=>gl.getError())).toBe(0);await page.screenshot({path:'docs/screenshots/gliding-flight.png'});
 const landed=await page.evaluate(()=>{state.player={x:state.built[0].x,y:state.built[0].y};const result=setTravelModeV06('walk');persist();return {result,mode:state.traversalMode,valid:validMove(state.player.x,state.player.y),solid:collides(state.player.x,state.player.y),saved:loadSave().traversalMode};});expect(landed).toEqual({result:true,mode:'walk',valid:true,solid:false,saved:'walk'});expect(errors).toEqual([]);
});

test('six hundred authored conversations cover every creature, match weather, avoid immediate repeats, and persist history',async({page})=>{
 const errors=await betaGame(page);
 const result=await page.evaluate(()=>{
  const entries=Object.entries(AUTHORED_DIALOGUE_V06),all=entries.flatMap(([,lines])=>lines.map(l=>l.text)),coverage=entries.map(([name,lines])=>({name,count:lines.length,topics:new Set(lines.map(l=>l.topic)).size}));
  const weather=[];for(const condition of ['drizzle','sunny']){state.weather=condition;state.clock=12;for(let n=0;n<12;n++){const picked=chooseContextDialogueV06(1,'weather'),source=AUTHORED_DIALOGUE_V06[NAMES[1]][picked.id];weather.push({condition,topic:picked.topic,when:source.when||'any',valid:dialogueConditionV06(source)});}}
  const turns=Array.from({length:40},()=>chooseContextDialogueV06(1));const noImmediate=turns.every((line,i)=>i===0||line.text!==turns[i-1].text);persist();const history={...state.dialogueHistory[1],recent:[...state.dialogueHistory[1].recent]},saved=loadSave().dialogueHistory[1];
  betaQA.approach(npcData[1],1);talkTo(1);return {coverage,total:all.length,unique:new Set(all).size,weather,noImmediate,history,saved,info:window.fathermonDialogueInfo};
 });
 expect(result.coverage).toHaveLength(10);for(const character of result.coverage){expect(character.count).toBeGreaterThanOrEqual(60);expect(character.topics).toBe(10);}expect(result.total).toBeGreaterThanOrEqual(600);expect(result.unique).toBeGreaterThanOrEqual(500);expect(result.info).toEqual({characters:10,authoredLines:result.total});for(const line of result.weather){expect(line.topic).toBe('weather');expect(line.valid).toBe(true);expect(line.when).not.toBe(line.condition==='drizzle'?'sun':'rain');}expect(result.noImmediate).toBe(true);expect(result.history.count).toBe(64);expect(result.saved).toEqual(result.history);await expect(page.locator('.conversationTopicsV06')).toBeVisible();const topic=await page.locator('[data-conversation-v06]').first().getAttribute('data-conversation-v06');await page.locator('[data-conversation-v06]').first().click();expect(await page.evaluate(()=>state.dialogueHistory[1].lastTopic)).toBe(topic);await page.screenshot({path:'docs/screenshots/contextual-dialogue.png'});const resumed=await page.evaluate(()=>{persist();startGame(true);storySession=false;hideModal();return state.dialogueHistory[1];});expect(resumed.count).toBe(66);expect(resumed.lastTopic).toBe(topic);expect(errors).toEqual([]);
});
