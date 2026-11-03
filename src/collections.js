/* A physical field collection: find plants and curios on the ground, swing a
 * crafted net at living insects, and use a crafted rod in the fishing game.
 * The journal remembers discoveries after their specimens are used or donated. */
const COLLECTION_TIERS_V06={common:60,uncommon:22,rare:5,legendary:.65};
const COLLECTION_CATEGORY_V06={plant:{name:'Plants',icon:'🌿'},bug:{name:'Bugs',icon:'🦋'},fish:{name:'Fish',icon:'🐟'},artifact:{name:'Curios',icon:'💎'}};
const COLLECTION_ROWS_V06=[
 ['dewbell','Dewbell','plant','meadow','common',0,24,'both','#c5d9f2','Little silver bells hold the morning dew.'],
 ['ribbonclover','Ribbon Clover','plant','meadow','common',0,24,'both','#a2cb8a','Its curled leaves make a tiny green bow.'],
 ['peachwhisk','Peachwhisk Grass','plant','meadow','uncommon',5,20,'sunny','#eac9a0','Soft peach seed heads sway beside the paths.'],
 ['raincup','Raincup','plant','meadow','rare',0,24,'drizzle','#a4c9dc','These blue cups open only when rain arrives.'],
 ['moonlace','Moonlace','plant','meadow','legendary',20,5,'both','#eee3ba','A delicate flower that unfolds under the stars.'],
 ['emberreed','Ember Reed','plant','hot','common',0,24,'both','#db9a62','Its warm orange stems never seem to dry out.'],
 ['sunsail','Sunsail Succulent','plant','hot','common',0,24,'both','#96b87d','Wide leaves turn toward the strongest light.'],
 ['saffronpuff','Saffron Puff','plant','hot','uncommon',7,19,'sunny','#eac35f','A golden puffball sheltered between warm stones.'],
 ['glassaloe','Glass Aloe','plant','hot','rare',17,7,'both','#adcdb9','Its translucent tips glow around sunset.'],
 ['crowncactus','Crownfire Cactus','plant','hot','legendary',11,16,'sunny','#de8f91','A rare crown of ruby flowers blooms in midday heat.'],
 ['snowbutton','Snowbutton','plant','cold','common',0,24,'both','#dce7f4','Round pale flowers peek out of the frost.'],
 ['silverfern','Silver Fern','plant','cold','common',0,24,'both','#a5c8bd','A hardy fern with silver leaf edges.'],
 ['bluefluff','Bluefluff Moss','plant','cold','uncommon',5,18,'both','#a6bedb','A soft blue cushion grows around sheltered roots.'],
 ['iceviolet','Ice Violet','plant','cold','rare',18,7,'both','#beaee4','The cold night brings out its violet petals.'],
 ['auroraflax','Aurora Flax','plant','cold','legendary',21,5,'sunny','#a8ddd2','Its fine leaves shimmer in the clear night air.'],
 ['fanleaf','Fanleaf','plant','jungle','common',0,24,'both','#7bb16f','Broad folded leaves collect pools of rainwater.'],
 ['twistvine','Twistvine','plant','jungle','common',0,24,'both','#91b87a','A friendly spiral vine curls around fallen branches.'],
 ['coralorchid','Coral Orchid','plant','jungle','uncommon',6,19,'both','#df9d96','A coral pink bloom above the fern floor.'],
 ['stormginger','Storm Ginger','plant','jungle','rare',0,24,'drizzle','#dfbb77','A spicy scented flower that loves rainy days.'],
 ['starfruitbloom','Starfruit Bloom','plant','jungle','legendary',19,5,'both','#ead79a','Five luminous petals open after sunset.'],
 ['buttonbeetle','Button Beetle','bug','meadow','common',0,24,'both','#d8a269','Its round shell looks like a polished coat button.'],
 ['ribbonflutter','Ribbon Flutter','bug','meadow','common',6,19,'sunny','#dcaaca','Pink wings drift above the meadow flowers.'],
 ['lanternmidge','Lantern Midge','bug','meadow','uncommon',18,6,'both','#e5d98d','A speck of soft light floats beside the paths.'],
 ['opalwing','Opalwing','bug','meadow','legendary',5,8,'sunny','#c5dfdf','A clear dawn reveals its shifting pearl colors.'],
 ['sandskipper','Sand Skipper','bug','hot','common',0,24,'both','#d7b580','A patient hopper who enjoys warm stones.'],
 ['coppercicada','Copper Cicada','bug','hot','uncommon',9,18,'sunny','#ca9670','Its little wing covers gleam like copper.'],
 ['duskjewel','Dusk Jewel Beetle','bug','hot','rare',17,22,'both','#b992c6','A violet beetle walks out when the heat fades.'],
 ['sunhalo','Sunhalo Moth','bug','hot','legendary',11,15,'sunny','#ead888','Golden rings decorate its broad pale wings.'],
 ['frosthopper','Frost Hopper','bug','cold','common',0,24,'both','#b2c7d1','Tiny feet leave a zigzag trail in the frost.'],
 ['woollymoth','Woolly Moth','bug','cold','uncommon',17,7,'both','#d9d2c5','A thick fluffy coat keeps this moth warm.'],
 ['crystalgnat','Crystal Gnat','bug','cold','rare',4,9,'sunny','#b9e0e3','Its wings glitter in the first cold light.'],
 ['aurorabeetle','Aurora Beetle','bug','cold','legendary',21,4,'sunny','#95d0bd','A secret green light shines beneath its shell.'],
 ['leafsailor','Leaf Sailor','bug','jungle','common',0,24,'both','#90bd74','Its leaf shaped wings are excellent camouflage.'],
 ['rainjewel','Rain Jewel','bug','jungle','uncommon',0,24,'drizzle','#afc7dc','Water beads sparkle on its sapphire shell.'],
 ['velvetmantis','Velvet Mantis','bug','jungle','rare',16,23,'both','#cd9eae','A gentle pink hunter hides among the orchids.'],
 ['dappleminnow','Dapple Minnow','fish','meadow','common',0,24,'both','#c2cbb4','A quick silver fish with soft speckled scales.'],
 ['reedperch','Reed Perch','fish','meadow','common',0,24,'both','#b8c492','A green perch that prefers quiet reed beds.'],
 ['rainripple','Rain Ripple','fish','meadow','rare',0,24,'drizzle','#9bbecf','This blue fish follows circles made by raindrops.'],
 ['moonveil','Moonveil Koi','fish','meadow','legendary',20,5,'both','#dbd3b3','A pale ribbon of fins moves through moonlit water.'],
 ['amberdarter','Amber Darter','fish','hot','common',0,24,'both','#d9a774','An amber fish who thrives in warm shallows.'],
 ['sunstripe','Sunstripe Bream','fish','hot','common',0,24,'both','#dec47e','Golden stripes flash just beneath the surface.'],
 ['emberfin','Emberfin','fish','hot','rare',16,22,'sunny','#d59b8d','Its sunset red fins ripple like a tiny flame.'],
 ['mirageeel','Mirage Eel','fish','hot','legendary',22,5,'both','#b3b7d1','A wavering blue silhouette in the warm night.'],
 ['snowgill','Snowgill','fish','cold','common',0,24,'both','#c8d7d7','This round fish wears a coat of silvery scales.'],
 ['froststripe','Froststripe Char','fish','cold','common',0,24,'both','#a8c3d1','Icy blue stripes help it hide in clear water.'],
 ['glacierglass','Glacier Glassfish','fish','cold','rare',5,10,'sunny','#badbdc','Morning light passes through its delicate fins.'],
 ['northerncrown','Northern Crownfish','fish','cold','legendary',21,5,'both','#cbbce0','A violet crown of fins opens under the stars.'],
 ['leafgoby','Leaf Goby','fish','jungle','common',0,24,'both','#9fbc8c','A tiny green fish sheltering in floating leaves.'],
 ['orchidtetra','Orchid Tetra','fish','jungle','uncommon',6,20,'both','#d2a3bb','A pink tail flickers in the forest reflections.'],
 ['thunderray','Thunderpetal Ray','fish','jungle','legendary',17,7,'drizzle','#b6b2d1','Its flower shaped fins glide through rainy water.'],
 ['claywhistle','Clay Bird Whistle','artifact','meadow','common',0,24,'both','#c5a38b','A small whistle left by an earlier town maker.'],
 ['oldtownseal','Old Town Seal','artifact','meadow','rare',0,24,'both','#bfb697','A faded stamp carries the mark of a forgotten town.'],
 ['wishstone','Hollow Wishstone','artifact','meadow','legendary',19,6,'both','#c6c5db','A smooth stone with a perfect star shaped hollow.'],
 ['sunmosaic','Sun Mosaic Tile','artifact','hot','common',0,24,'both','#d8ba8c','A sun pattern survives on a little glazed tile.'],
 ['amberseed','Amber Seed','artifact','hot','rare',8,19,'sunny','#dfba77','An ancient seed is sealed inside warm amber.'],
 ['cindercompass','Cinder Compass','artifact','hot','legendary',17,6,'both','#bd9b86','Its faded needle still turns toward the sunset.'],
 ['frosttoken','Frost Token','artifact','cold','common',0,24,'both','#bacdd8','A carved token shaped like a little snowflake.'],
 ['winterbell','Winter Bell','artifact','cold','rare',0,24,'both','#c8c6db','A tiny silver bell with a surprisingly warm tone.'],
 ['auroraprism','Aurora Prism','artifact','cold','legendary',20,5,'sunny','#b2d5cf','Clear facets scatter green and violet light.'],
 ['vinecarving','Vine Carving','artifact','jungle','common',0,24,'both','#b6a586','A wooden carving follows the shape of a climbing vine.'],
 ['rainmask','Rain Mask Fragment','artifact','jungle','rare',0,24,'drizzle','#c7ac95','The painted eye of a cheerful ceremonial mask.'],
 ['jadeheart','Jade Canopy Heart','artifact','jungle','legendary',18,7,'both','#a1c5ab','An emerald stone shaped like two joined leaves.']
];
const CATALOG_V06=COLLECTION_ROWS_V06.map(([id,name,category,biome,tier,start,end,weather,color,description])=>Object.freeze({id,name,category,biome,tier,hours:[start,end],weather:weather==='both'?['sunny','drizzle']:[weather],color,description,icon:COLLECTION_CATEGORY_V06[category].icon}));
const COLLECTION_BY_ID_V06=Object.fromEntries(CATALOG_V06.map(c=>[c.id,c]));
const COLLECTION_TOOLS_V06={net:{name:'Bug net',icon:'🦋',wood:2,stone:0,petals:2,hint:'Catch a visible insect within 3 steps.'},pole:{name:'Fishing pole',icon:'🎣',wood:3,stone:1,petals:0,hint:'Reel in when the bobber reaches the golden catch zone.'}};
const initializedCollectionsV06=new WeakSet();
function collectionDefinitionV06(id){return COLLECTION_BY_ID_V06[id]||null;}
function ensureCollectionsV06(){
 if(!state||initializedCollectionsV06.has(state))return;
 const count=n=>Number.isFinite(n)?Math.floor(clamp(n,0,1000000)):0;
 state.collectionInventory=Object.fromEntries(CATALOG_V06.map(c=>[c.id,count(state.collectionInventory?.[c.id])]));
 for(const key of ['collectionFound','donatedCollection'])state[key]=[...new Set((Array.isArray(state[key])?state[key]:[]).filter(id=>COLLECTION_BY_ID_V06[id]))];
 state.collectionHarvested=[...new Set((Array.isArray(state.collectionHarvested)?state.collectionHarvested:[]).filter(id=>typeof id==='string'&&/^collect_(plant|bug|artifact)_-?\d+_-?\d+$/.test(id)))].slice(0,12000);
 state.tools={net:state.tools?.net===true,pole:state.tools?.pole===true};state.collectionCastIndex=count(state.collectionCastIndex);
 for(const [id,n]of Object.entries(state.collectionInventory))if(n>0&&!state.collectionFound.includes(id))state.collectionFound.push(id);
 initializedCollectionsV06.add(state);reconcileCollectionPoolsV06();
}
// A caught fish is one physical specimen. Recipes, requests and shop sales use
// the same pool, while discovery records remain in the field journal forever.
function reconcileCollectionPoolsV06(){
 if(!state?.collectionInventory)return;
 for(const [category,key]of [['fish','fish'],['bug','bugs']]){
  let excess=CATALOG_V06.filter(c=>c.category===category).reduce((n,c)=>n+(state.collectionInventory[c.id]||0),0)-Math.max(0,Number(state[key])||0);
  if(excess<=0)continue;
  const entries=CATALOG_V06.filter(c=>c.category===category).sort((a,b)=>COLLECTION_TIERS_V06[b.tier]-COLLECTION_TIERS_V06[a.tier]);
  for(const c of entries){const taken=Math.min(excess,state.collectionInventory[c.id]||0);state.collectionInventory[c.id]-=taken;excess-=taken;if(excess<=0)break;}
 }
}
function collectSpecimenV06(id,count=1,options={}){
 ensureCollectionsV06();const c=COLLECTION_BY_ID_V06[id];if(!c||!Number.isInteger(count)||count<1||count>100)return false;
 state.collectionInventory[id]+=count;if(!state.collectionFound.includes(id))state.collectionFound.push(id);
 if(options.aggregate!==false){if(c.category==='fish')state.fish+=count;if(c.category==='bug')state.bugs+=count;}
 return true;
}
function removeCollectibleV06(id,count=1){
 ensureCollectionsV06();reconcileCollectionPoolsV06();const c=COLLECTION_BY_ID_V06[id];if(!c||!Number.isInteger(count)||count<1||state.collectionInventory[id]<count)return false;
 const aggregate=c.category==='fish'?'fish':c.category==='bug'?'bugs':null;if(aggregate&&state[aggregate]<count)return false;
 state.collectionInventory[id]-=count;if(aggregate)state[aggregate]-=count;return true;
}
// Public deterministic seed helper makes rare encounters reproducible in tests.
// Rarity is a weighted draw among entries available in this habitat and hour.
function collectionRollV06(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h+=0x6d2b79f5;h=Math.imul(h^(h>>>15),h|1);h^=h+Math.imul(h^(h>>>7),h|61);return ((h^(h>>>14))>>>0)/4294967296;}
function collectionAvailableV06(c,hour=state?.clock??12,weather=state?.weather||'sunny'){
 const [a,b]=c.hours,h=((hour%24)+24)%24,withinHours=a<=b?h>=a&&h<b:h>=a||h<b;return c.weather.includes(weather)&&withinHours;
}
function collectionCandidatesV06(category,biome,hour=state?.clock??12,weather=state?.weather||'sunny'){return CATALOG_V06.filter(c=>c.category===category&&c.biome===biome&&collectionAvailableV06(c,hour,weather));}
function selectCollectionV06(category,biome,roll,hour=state?.clock??12,weather=state?.weather||'sunny'){
 const pool=collectionCandidatesV06(category,biome,hour,weather),total=pool.reduce((n,c)=>n+COLLECTION_TIERS_V06[c.tier],0);if(!pool.length)return null;
 let r=clamp(Number(roll)||0,0,.999999999)*total;for(const c of pool){r-=COLLECTION_TIERS_V06[c.tier];if(r<0)return c;}return pool[pool.length-1];
}
function getCollectionNodesV06(x=state?.player.x??20,y=state?.player.y??19,radius=18,category=null){
 if(!state)return [];ensureCollectionsV06();const result=[],day=state.day||1,phase=Math.floor((state.clock||0)/4);
 for(const type of category?[category]:['plant','artifact','bug']){
  if(!['plant','artifact','bug'].includes(type))continue;const step=type==='plant'?5:type==='bug'?8:11;
  for(let gx=Math.floor((x-radius)/step)*step;gx<=x+radius;gx+=step)for(let gy=Math.floor((y-radius)/step)*step;gy<=y+radius;gy+=step){
   const id='collect_'+type+'_'+gx+'_'+gy;if(state.collectionHarvested.includes(id)||collectionRollV06(id+':presence')>(type==='plant'?.78:type==='bug'?.7:.46))continue;
   const bx=gx+1+collectionRollV06(id+':x')*(step-2),by=gy+1+collectionRollV06(id+':y')*(step-2);
   if(!inside(bx,by)||typeof waterAtV06==='function'&&waterAtV06(bx,by)||typeof validMove==='function'&&!validMove(bx,by))continue;
   const biome=biomeAtV06(bx,by).id,entry=selectCollectionV06(type,biome,collectionRollV06(id+':'+day+':'+(type==='bug'?phase:'ground')));
   if(!entry)continue;const t=state.reducedMotion?0:tick,angle=collectionRollV06(id)*7;
   const px=bx+(type==='bug'?Math.sin(t*.8+angle)*.62:0),py=by+(type==='bug'?Math.cos(t*.7+angle)*.55:0);
   if(Math.hypot(px-x,py-y)>radius)continue;result.push({id,x:px,y:py,baseX:bx,baseY:by,collection:true,category:type,specimenId:entry.id,entry,kind:type==='bug'?'collectionBug':'collectionNode',seed:angle});
  }
 }
 return result;
}
function availableCollectionNodesV06(radius=3,category=null){return getCollectionNodesV06(state.player.x,state.player.y,radius,category).sort((a,b)=>dist(a,state.player)-dist(b,state.player));}
function gatherCollectionNodeV06(nodeOrId){
 ensureCollectionsV06();if(paused||state.traversalMode==='fly'||state.traversalMode==='dive')return false;
 const id=typeof nodeOrId==='string'?nodeOrId:nodeOrId?.id,node=availableCollectionNodesV06(3).find(n=>n.id===id);if(!node)return false;
 if(node.category==='bug')return catchBugV06(id);
 if(!collectSpecimenV06(node.specimenId))return false;state.collectionHarvested.push(id);state.coins++;geometryDirty=true;
 if(typeof recordDailyMetricV06==='function')recordDailyMetricV06('collect',1);if(typeof markCharacterActionV06==='function')markCharacterActionV06();
 persist();updateHUD();sound(node.category==='artifact'?920:720);toast(node.entry.icon+' Found '+node.entry.name+' · '+node.entry.tier);return true;
}
function catchBugV06(id=null){
 ensureCollectionsV06();if(paused||state.traversalMode==='fly'||state.traversalMode==='dive')return false;
 if(!state.tools.net){toast('Craft a bug net at the restored workshop first.');return false;}
 const node=availableCollectionNodesV06(3,'bug').find(n=>!id||n.id===id);if(!node){toast('Move within 3 steps of a fluttering insect, then swing your net.');return false;}
 collectSpecimenV06(node.specimenId);state.collectionHarvested.push(node.id);state.coins+=2;if(typeof markCharacterActionV06==='function')markCharacterActionV06();
 if(typeof recordDailyMetricV06==='function')recordDailyMetricV06('catchBug',1);persist();updateHUD();sound(890);toast('🦋 Caught '+node.entry.name+' · '+node.entry.tier);return true;
}
function craftToolV06(id){
 ensureCollectionsV06();const tool=COLLECTION_TOOLS_V06[id];if(!tool||state.tools[id])return false;
 if(!state.workshopRestored){toast('Restore the workshop before crafting field tools.');return false;}
 if(!['wood','stone','petals'].every(k=>state[k]>=tool[k])){toast('Gather the materials for your '+tool.name.toLowerCase()+'.');return false;}
 for(const k of ['wood','stone','petals'])state[k]-=tool[k];state.tools[id]=true;persist();sound(840);showToolsV06();toast(tool.icon+' Crafted '+tool.name+'!');return true;
}
function showToolsV06(){
 ensureCollectionsV06();showModal(`<div class="eyebrow">MADE AT YOUR WORKSHOP</div><h2>Tools for little discoveries</h2><p class="sub">Craft once, use every day. Insects move through each habitat; fish change with the hour and weather.</p><div class="cardlist">${Object.entries(COLLECTION_TOOLS_V06).map(([id,t])=>`<section class="biome-farm-card"><h3>${t.icon} ${t.name}</h3><p>${t.hint}</p><p class="sub">${prettyCount(t)}</p><button class="btn" data-collection="craft" data-id="${id}" ${state.tools[id]||!state.workshopRestored||!['wood','stone','petals'].every(k=>state[k]>=t[k])?'disabled':''}>${state.tools[id]?'Already crafted':!state.workshopRestored?'Restore the workshop':'Craft '+t.name.toLowerCase()}</button></section>`).join('')}</div><div class="actions"><button class="btn secondary" data-collection="journal">Collection journal</button><button class="btn secondary" data-ui="close">Back to town</button></div>`);
}
let collectionCategoryV06='all';
function showCollectionsV06(category='all'){
 ensureCollectionsV06();reconcileCollectionPoolsV06();collectionCategoryV06=COLLECTION_CATEGORY_V06[category]?category:'all';
 const found=state.collectionFound.length,items=CATALOG_V06.filter(c=>collectionCategoryV06==='all'||c.category===collectionCategoryV06),near=availableCollectionNodesV06(3);
 showModal(`<div class="eyebrow">YOUR LIVING FIELD JOURNAL</div><h2>Little wonders, big world</h2><p class="sub">${found} / ${CATALOG_V06.length} discovered · ${state.donatedCollection.length} museum exhibits. Ground plants and curios return each new day. Look at different hours and in the rain for rarer finds.</p><div class="actions">${['all',...Object.keys(COLLECTION_CATEGORY_V06)].map(id=>`<button class="btn ${id===collectionCategoryV06?'':'secondary'}" data-collection="filter" data-id="${id}" aria-pressed="${id===collectionCategoryV06}">${id==='all'?'All finds':COLLECTION_CATEGORY_V06[id].icon+' '+COLLECTION_CATEGORY_V06[id].name}</button>`).join('')}</div>${near.length?`<section class="biome-farm-card"><h3>Within reach</h3><div class="actions">${near.map(n=>`<button class="btn secondary" data-collection="${n.category==='bug'?'catch':'gather'}" data-id="${n.id}">${n.entry.icon} ${n.category==='bug'?'Net ':'Gather '}${n.entry.name}</button>`).join('')}</div></section>`:''}<div class="cardlist">${items.map(c=>{const known=state.collectionFound.includes(c.id),owned=state.collectionInventory[c.id],donated=state.donatedCollection.includes(c.id),hours=c.hours[0]===0&&c.hours[1]===24?'Any hour':c.hours[0]+':00–'+c.hours[1]+':00';return `<section class="biome-farm-card"><h3>${c.icon} ${known?c.name:'Undiscovered '+COLLECTION_CATEGORY_V06[c.category].name.toLowerCase().replace(/s$/,'')}</h3><p class="sub">${BIOME_DEFS_V06[c.biome].name} · ${c.tier} · ${hours} · ${c.weather.length===2?'Any weather':c.weather[0]==='drizzle'?'Rainy weather':'Clear weather'}</p>${known?`<p>${c.description}</p><p class="sub">In backpack: ${owned}${donated?' · ✓ Museum exhibit':''}</p>`:''}${known&&owned&&!donated&&typeof donateCollectibleV06==='function'?`<button class="btn secondary" data-collection="donate" data-id="${c.id}">Donate one to the museum</button>`:''}</section>`;}).join('')}</div><div class="actions"><button class="btn secondary" data-collection="tools">Field tools</button><button class="btn secondary" data-collection="catch">Swing bug net</button><button class="btn secondary" data-v04="fish">Go fishing</button><button class="btn" data-ui="close">Back to town</button></div>`);
}
const fishingBeforeCollectionsV06=showFishing;
showFishing=function(){ensureCollectionsV06();if(!state.tools.pole){showToolsV06();toast('Craft a fishing pole to use the fishing minigame.');return;}fishingBeforeCollectionsV06();const title=$('modalBody').querySelector('h2'),text=$('modalBody').querySelector('p');if(title)title.textContent='Fishing in '+BIOME_DEFS_V06[biomeAtV06(state.player.x,state.player.y).id].name;if(text)text.textContent='Reel when the bobber enters the golden catch zone. Your current habitat, hour and weather determine which fish may bite.';};
const reelBeforeCollectionsV06=reelFish;
reelFish=function(){ensureCollectionsV06();if(!state.tools.pole){miniFishing=null;toast('Craft your fishing pole at the workshop first.');return false;}if(!miniFishing)return false;const before=state.fish;state.collectionCastIndex++;reelBeforeCollectionsV06();if(state.fish<=before)return false;const biome=biomeAtV06(state.player.x,state.player.y).id,entry=selectCollectionV06('fish',biome,collectionRollV06('fish:'+state.day+':'+state.collectionCastIndex+':'+biome));if(entry){collectSpecimenV06(entry.id,1,{aggregate:false});persist();toast('🐟 Caught '+entry.name+' · '+entry.tier+' · +3 coins');}return true;};
const gatherBeforeCollectionsV06=gather;
gather=function(o){if(o?.collection)return gatherCollectionNodeV06(o);if(o?.kind==='bush'){toast('Look for a fluttering insect and use your crafted bug net.');return false;}return gatherBeforeCollectionsV06(o);};
const nearbyBeforeCollectionsV06=findNearby;
findNearby=function(gatherOnly=false){const previous=nearbyBeforeCollectionsV06(gatherOnly);if(!state||previous?.type==='npc')return previous;const nearest=availableCollectionNodesV06(3).find(n=>n.category!=='bug'||state.tools.net);if(!nearest||previous?.o&&dist(previous.o,state.player)<=dist(nearest,state.player))return previous;return {type:'nature',o:nearest};};
// Replace the old bush shortcut so insects can only enter inventory through net use.
harvestAction=function(){if(paused||activeModal)return;const near=findNearby(true);if(near?.o)return gather(near.o);if(availableCollectionNodesV06(3,'bug').length)return catchBugV06();toast('Move close to a plant, curio, tree, rock or flower patch to gather.');};
const dayBeforeCollectionsV06=dayAdvance;
dayAdvance=function(){dayBeforeCollectionsV06();ensureCollectionsV06();state.collectionHarvested=[];geometryDirty=true;persist();};
const resetBeforeCollectionsV06=systemsStartReset;
systemsStartReset=function(){ensureCollectionsV06();resetBeforeCollectionsV06();};
const hubBeforeCollectionsV06=showTownHub;
showTownHub=function(){hubBeforeCollectionsV06();$('modalBody').querySelector('.hubgrid')?.insertAdjacentHTML('beforeend','<button data-collection="journal">🦋 <b>Collection journal</b><small>62 plants, insects, fish and curios</small></button><button data-collection="tools">🎣 <b>Field tools</b><small>Craft a fishing pole and bug net</small></button>');};
const workshopBeforeCollectionsV06=showWorkshop;
showWorkshop=function(){workshopBeforeCollectionsV06();if(state.workshopRestored)$('modalBody').querySelector('.actions')?.insertAdjacentHTML('afterbegin','<button class="btn secondary" data-collection="tools">Craft field tools</button>');};
const bagBeforeCollectionsV06=showExpandedBag;
showExpandedBag=function(category){bagBeforeCollectionsV06(category);ensureCollectionsV06();if((category||bagCategoryV06)==='furniture')return;reconcileCollectionPoolsV06();$('modalBody').insertAdjacentHTML('beforeend',`<section class="biome-inventory"><h3>Field discoveries</h3><p class="sub">${state.collectionFound.length}/${CATALOG_V06.length} discovered · ${state.tools.net?'🦋 Net crafted':'Bug net needed'} · ${state.tools.pole?'🎣 Pole crafted':'Fishing pole needed'}</p><button class="btn secondary" data-collection="journal">Open collection journal</button></section>`);};
// Legacy recipes and social actions consume the exact same physical fish/bug pool.
const mealBeforeCollectionsV06=makeMeal;
makeMeal=function(){const result=mealBeforeCollectionsV06();reconcileCollectionPoolsV06();persist();return result;};
const tradeBeforeCollectionsV06=trade;
trade=function(k,mode){const result=tradeBeforeCollectionsV06(k,mode);reconcileCollectionPoolsV06();persist();return result;};
const requestBeforeCollectionsV06=fulfillRequest;
fulfillRequest=function(i){const result=requestBeforeCollectionsV06(i);reconcileCollectionPoolsV06();persist();return result;};
const giftBeforeCollectionsV06=socialGiftV06;
socialGiftV06=function(i,type){const result=giftBeforeCollectionsV06(i,type);reconcileCollectionPoolsV06();persist();return result;};
const biomeMealBeforeCollectionsV06=cookBiomeMealV06;
cookBiomeMealV06=function(id){const result=biomeMealBeforeCollectionsV06(id);reconcileCollectionPoolsV06();persist();return result;};
function drawCollectionPlantV06(g,n){const c=n.entry,x=n.x,z=n.y;g.disc(x,z,.34,'#759763',.045,8);g.box(x,z,.055,.055,.43,'#648d57',.05);for(let k=0;k<3;k++){const a=k*2.1+n.seed;g.cone(x+Math.cos(a)*.16,z+Math.sin(a)*.16,.12,.24,'#86ad70',.1,5);}sphereWorldV06(g,x,.56,z,.2,.14,.2,c.color,7,4);if(c.tier==='legendary')sphereWorldV06(g,x,.68,z,.065,.07,.065,'#fff2bf',6,4);}
function drawCollectionCurioV06(g,n){g.disc(n.x,n.y,.33,'#a69c7f',.04,8);g.cone(n.x,n.y,.22,.34,n.entry.color,.06,5);g.cone(n.x+.11,n.y+.08,.1,.18,'#ece4c9',.08,5);}
const terrainBeforeCollectionsV06=addTerrain3d;
addTerrain3d=function(g){terrainBeforeCollectionsV06(g);if(!state||state.traversalMode==='dive')return;for(const n of getCollectionNodesV06(state.player.x,state.player.y,state.lowGraphics?24:34)){if(n.category==='plant')drawCollectionPlantV06(g,n);else if(n.category==='artifact')drawCollectionCurioV06(g,n);}};
const fingerprintBeforeCollectionsV06=sceneryFingerprint;
sceneryFingerprint=function(){return fingerprintBeforeCollectionsV06()+':collection'+JSON.stringify([state.collectionHarvested||[],state.day,Math.floor(state.clock/4),state.weather]);};
const dynamicBeforeCollectionsV06=drawDynamicGround;
drawDynamicGround=function(chars){dynamicBeforeCollectionsV06(chars);if(!state||state.traversalMode==='dive')return;const g=new Geometry();for(const n of getCollectionNodesV06(state.player.x,state.player.y,state.lowGraphics?12:19,'bug')){const h=.62+Math.sin((state.reducedMotion?0:tick)*4+n.seed)*.12;g.disc(n.x,n.y,.16,'#78956e',.06,7);sphereWorldV06(g,n.x,h,n.y,.075,.13,.065,'#6c735d',6,4);for(const side of [-1,1]){const flap=state.reducedMotion?.11:.09+Math.abs(Math.sin(tick*13+n.seed))*.16;sphereWorldV06(g,n.x+side*.13,h+flap,n.y,.17,.025,.12,n.entry.color,6,4);}}if(g.a.length){graphicsBind(graphicsDynamicBuffer,g.a);gl.drawArrays(gl.TRIANGLES,0,g.a.length/8);}};
const renderBeforeCollectionsV06=render;
render=function(){renderBeforeCollectionsV06();if(!state||paused||usesPolished3D()||state.traversalMode==='dive')return;ctx.save();ctx.translate(cw*.5,ch*.55);ctx.scale(currentZoom,currentZoom);ctx.translate(-cw*.5,-ch*.55);for(const n of getCollectionNodesV06(state.player.x,state.player.y,20)){const p=proj(n.x,n.y);if(p.x<0||p.x>cw||p.y<0||p.y>ch)continue;if(n.category==='bug'){const f=state.reducedMotion?5:4+Math.abs(Math.sin(tick*13+n.seed))*4;ellipse(p.x-5,p.y-16,f,3,n.entry.color);ellipse(p.x+5,p.y-16,f,3,n.entry.color);ellipse(p.x,p.y-15,2,4,'#6a725a');}else if(n.category==='plant'){ctx.strokeStyle='#638957';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-13);ctx.stroke();ellipse(p.x,p.y-15,6,4,n.entry.color);}else drawPoly([[p.x-7,p.y],[p.x-4,p.y-11],[p.x+3,p.y-15],[p.x+7,p.y-3]],n.entry.color,'#f2e5c1',1);}ctx.restore();};
document.addEventListener('click',e=>{const button=e.target.closest('[data-collection]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();const action=button.dataset.collection,id=button.dataset.id;if(action==='journal')showCollectionsV06();else if(action==='filter')showCollectionsV06(id);else if(action==='tools')showToolsV06();else if(action==='craft')craftToolV06(id);else if(action==='catch'){if(catchBugV06(id))showCollectionsV06(collectionCategoryV06);}else if(action==='gather'){if(gatherCollectionNodeV06(id))showCollectionsV06(collectionCategoryV06);}else if(action==='donate'&&typeof donateCollectibleV06==='function'){donateCollectibleV06(id);showCollectionsV06(collectionCategoryV06);}},true);
