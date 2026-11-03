const {test,expect}=require('playwright/test');
const fs=require('node:fs/promises');
async function title(page){await page.goto('/');await page.locator('#studioSplash').waitFor({state:'detached'});}
async function newTown(page,slot=1,name='Willow Bay',avatar=1){
 await page.getByRole('button',{name:/New Game/}).click();
 await page.locator(`[data-ui="slot"][data-slot="${slot}"]`).click();
 await page.locator(`[data-ui="character"][data-char="${avatar}"]`).click();
 await page.locator('#townInput').fill(name);await page.locator('#townTheme').selectOption('coast');
 await page.locator('#startBtn').click();await page.locator('[data-action="storyskip"]').click();
}
test('title, character selection, naming, Continue and three isolated save slots',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await title(page);
 await expect(page.locator('#continueBtn')).toBeDisabled();
 await page.getByRole('button',{name:'⚙ Settings',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.locator('[data-ui="close"]').click();
 await page.getByRole('button',{name:'♡ Credits',exact:true}).click();await expect(page.locator('.credit-art img')).toHaveCount(10);await page.locator('[data-ui="close"]').click();
 await fs.mkdir('docs/screenshots',{recursive:true});await page.screenshot({path:'docs/screenshots/title-desktop.png'});
 await newTown(page,1);expect(await page.evaluate(()=>({avatar:state.avatar,town:state.townName,residents:state.residents.length,theme:state.townTheme}))).toEqual({avatar:1,town:'Willow Bay',residents:0,theme:'coast'});
 await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');
 await page.evaluate(()=>{persist();showIntro()});await page.locator('#continueBtn').click();expect(await page.evaluate(()=>state.townName)).toBe('Willow Bay');
 await page.evaluate(()=>showIntro());await newTown(page,2,'Bluebell',9);await page.evaluate(()=>showIntro());await newTown(page,3,'Moss Glen',4);
 await page.evaluate(()=>showIntro());await page.getByRole('button',{name:/Load Game/}).click();await expect(page.locator('.save-slot')).toHaveCount(3);await expect(page.locator('.slot-preview img')).toHaveCount(3);await page.screenshot({path:'docs/screenshots/save-slots.png'});
 await page.locator('[data-ui="slot"][data-slot="1"]').click();expect(await page.evaluate(()=>state.townName)).toBe('Willow Bay');await page.reload();await page.locator('#studioSplash').waitFor({state:'detached'});await page.locator('#continueBtn').click();expect(await page.evaluate(()=>state.avatar)).toBe(1);expect(errors).toEqual([]);
});
for(const version of [3,4,5])test(`migrates v0.${version} without overwriting its original save`,async({page})=>{
 await title(page);const original=await page.evaluate(version=>{const save=makeState();save.version=version;save.avatar=7;save.coins=123;save.townName='Old Orchard';save.friendships[2]=8;save.furniture.bed=2;save.interiors.player.items=[{id:'chair',x:5,y:4}];const raw=JSON.stringify(save);localStorage.clear();const key=version===5?V05_KEY:version===4?SAVE_KEY:'fathermon_township_v03_first_resident_save';localStorage.setItem(key,raw);return {key,raw}},version);
 await page.reload();await page.locator('#studioSplash').waitFor({state:'detached'});await page.locator('#continueBtn').click();
 const saved=await page.evaluate(key=>({version:state.version,avatar:state.avatar,coins:state.coins,friends:state.friendships[2],bed:state.furniture.bed,items:state.interiors.player.items,old:localStorage.getItem(key)}),original.key);
 expect(saved).toEqual({version:6,avatar:7,coins:123,friends:8,bed:2,items:[{id:'chair',x:5,y:4,rotation:0}],old:original.raw});
});
test('JSON export/import roundtrip and malformed backup leave active town intact',async({page})=>{
 await title(page);await newTown(page);const downloadPromise=page.waitForEvent('download');await page.evaluate(()=>exportSave());const download=await downloadPromise;await download.saveAs('/tmp/fathermon-export.json');const payload=JSON.parse(await fs.readFile('/tmp/fathermon-export.json','utf8'));expect(payload).toMatchObject({format:'FathermonTownship',version:6,save:{townName:'Willow Bay',avatar:1}});
 let chooserPromise=page.waitForEvent('filechooser');await page.evaluate(()=>importIntoSlot(2));let chooser=await chooserPromise;await chooser.setFiles({name:'town.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});await expect.poll(()=>page.evaluate(()=>activeSlot)).toBe(2);expect(await page.evaluate(()=>state.townName)).toBe('Willow Bay');
 chooserPromise=page.waitForEvent('filechooser');await page.evaluate(()=>importIntoSlot(3));chooser=await chooserPromise;await chooser.setFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...payload,save:{...payload.save,avatar:99}}))});await expect(page.getByText('That backup could not be imported')).toBeVisible();expect(await page.evaluate(()=>({slot:activeSlot,third:readSlot(3)}))).toEqual({slot:2,third:null});
});
test('low graphics, isometric fallback, map, inventory categories and keyboard focus',async({page})=>{
 await title(page);await newTown(page);await page.evaluate(()=>showControlSettings());await page.locator('[data-pref="lowGraphics"]').check();await page.locator('#renderModeV06').selectOption('2d');await page.locator('[data-ui="close"]').click();
 await expect.poll(()=>page.evaluate(()=>fathermonGraphicsStats.mode)).toBe('2d');expect(await page.evaluate(()=>state.lowGraphics)).toBe(true);
 await page.locator('#minimap').click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.townMapV06')).toBeVisible();await page.screenshot({path:'docs/screenshots/map.png'});await page.locator('[data-map-route="2"]').click();expect(await page.evaluate(()=>!!walkTarget)).toBe(true);
 await page.evaluate(()=>showExpandedBag());await page.locator('[data-bag-category="furniture"]').click();await expect(page.locator('.bag-grid').first().locator('.bag-item')).toHaveCount(await page.evaluate(()=>Object.keys(CRAFT_RECIPES).length));await page.screenshot({path:'docs/screenshots/backpack.png'});await page.keyboard.press('Tab');expect(await page.evaluate(()=>$('modal').contains(document.activeElement))).toBe(true);await page.keyboard.press('Escape');await expect(page.locator('#modal')).toBeHidden();
});
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1366,height:768}])test(`touch and keyboard layout ${viewport.width}x${viewport.height}`,async({browser})=>{
 const context=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<1000});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await title(page);await newTown(page,1,'Pocket Meadow',5);
 await page.evaluate(()=>{hideModal();stopDesigner()});
 const boxes=await page.evaluate(()=>['joystick','gatherBtn','actionBtn','quickBoard'].map(id=>{const r=$(id).getBoundingClientRect();return {id,x:r.x,y:r.y,w:r.width,h:r.height,visible:r.width>0&&r.height>0}}));
 for(const b of boxes.filter(b=>b.visible)){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(viewport.width+1);expect(b.y+b.h).toBeLessThanOrEqual(viewport.height+1);}
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(150);await page.keyboard.up('ArrowRight');
 await page.screenshot({path:`docs/screenshots/gameplay-${viewport.width}x${viewport.height}.png`});await page.locator('[data-panel="bag"]').click();await expect(page.getByRole('dialog')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);await context.close();
});
test('WebGL absence and context loss keep the game playable; cached scene stays stable',async({browser,page})=>{
 await title(page);await newTown(page);await expect.poll(()=>page.evaluate(()=>fathermonGraphicsStats.frames)).toBeGreaterThan(2);const ready=await page.evaluate(()=>glReady);expect(ready).toBe(true);
 const builds=await page.evaluate(()=>fathermonGraphicsStats.geometryBuilds);await page.waitForTimeout(350);expect(await page.evaluate(()=>fathermonGraphicsStats.geometryBuilds)).toBe(builds);expect(await page.evaluate(()=>gl.getError())).toBe(0);
 await page.screenshot({path:'docs/screenshots/town-3d.png'});await page.evaluate(()=>gl.getExtension('WEBGL_lose_context').loseContext());await expect.poll(()=>page.evaluate(()=>fathermonGraphicsStats.mode)).toBe('2d');await page.keyboard.press('d');await page.screenshot({path:'docs/screenshots/town-fallback.png'});
 const context=await browser.newContext();await context.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args)}});const fallback=await context.newPage();await title(fallback);await newTown(fallback);expect(await fallback.evaluate(()=>fathermonGraphicsStats.mode)).toBe('2d');const moved=await fallback.evaluate(()=>{const p={...state.player};keys.add('right');gameUpdate(.05);keys.clear();return dist(p,state.player)>0});expect(moved).toBe(true);await context.close();
});
