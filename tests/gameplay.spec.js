const { test, expect } = require('playwright/test');

// Deterministic travel moves the player between real interactions. Resources,
// crafting costs, chapter requirements, and rewards use the production actions.
async function openGame(page, avatar = 0) {
  await page.goto('/');
  await page.waitForFunction(() => typeof startGame === 'function');
  await page.evaluate(avatar => {
    selected = avatar;
    if ($('townInput')) $('townInput').value = 'Testmeadow';
    startGame(false);
    for (let i=0;i<10 && activeModal;i++) hideModal();
    storySession = false;
    window.qa = {
      close() {
        if (!$('interiorOverlay').classList.contains('hidden')) leaveInterior();
        for (let i=0;i<16 && activeModal;i++) hideModal();
      },
      approach(o, radius=1.6) {
        for(let j=0;j<24;j++) {
          const a=j*Math.PI/12,p={x:o.x+Math.cos(a)*radius,y:o.y+Math.sin(a)*radius};
          if(validMove(p.x,p.y)){state.player=p;walkTarget=null;return;}
        }
        throw Error('No walkable approach to '+JSON.stringify(o));
      },
      supplies(type, count) {
        const kinds=type==='wood'?['tree','log']:type==='stone'?['rock']:['flowers'];
        let limit=0;
        while(state[type]<count && limit++<100) {
          this.close();
          let o=obstacles.find(o=>kinds.includes(o.kind)&&!state.harvested.includes(o.id));
          if(!o){dayAdvance();continue;}
          this.approach(o);
          let before=state[type];gather(o);
          if(state[type]===before) throw Error('Gather made no progress for '+o.id);
        }
        if(state[type]<count)throw Error('Could not gather '+count+' '+type);
        this.close();
      },
      site(type, exclude=null) {
        for(let x=10;x<=32;x+=1.5)for(let y=10;y<=30;y+=1.5){
          if(canSite(x,y,exclude,type))return {x,y};
        }
        throw Error('No available site for '+type);
      },
      build(type) {
        this.close();
        for(const k of ['wood','stone','petals'])this.supplies(k,COST[type][k]);
        const p=this.site(type);this.approach(p,3);
        const n=state.built.length;startPlacing(type);buildAt(p.x,p.y);
        if(state.built.length!==n+1)throw Error('Build failed for '+type+': '+$('toast').textContent);
        const b=state.built.at(-1);this.close();return b;
      },
      talk(i) { this.close();this.approach(npcData[i]);talkTo(i);this.close(); },
      chapter1() {
        showPanel('board');this.close();
        this.supplies('wood',2);this.supplies('stone',2);
        this.build('cottage');chooseInvitation(1);this.close();this.talk(1);
        this.build('flower');this.close();
        if(state.quest!==6)throw Error('Chapter1 stuck at '+state.quest);
      },
      chapter2() {
        this.chapter1();showJournal();this.close();
        this.approach({x:28.5,y:28},2.6);inspectWorkshop();this.close();
        this.supplies('wood',3);this.supplies('stone',2);repairWorkshop();this.close();
        this.supplies('wood',1);this.supplies('petals',1);craftFurniture('chair');this.close();
        enterInterior('player');uiSelectedFurniture='chair';placeFurniture(2,2);this.close();
        this.build('market');this.build('cottage');chooseInvitation(2);this.close();this.talk(2);
        if(!state.chapter2Complete)throw Error('Chapter2 stuck at '+state.chapter2Step);
      }
    };
  }, avatar);
}

test('all ten original Fathermon can begin alone and move', async ({page}) => {
  await openGame(page);
  const avatars=await page.evaluate(()=>{
    return NAMES.map((name,i)=>{
      selected=i;startGame(false);qa.close();
      const before={...state.player};keys.add('right');gameUpdate(.1);keys.clear();
      return {name,avatar:state.avatar,residents:state.residents.length,built:state.built.length,moved:dist(before,state.player)>0,art:IMG[name].naturalWidth>0};
    });
  });
  expect(avatars).toHaveLength(10);
  for(let i=0;i<10;i++)expect(avatars[i]).toMatchObject({avatar:i,residents:0,built:0,moved:true,art:true});
});

test('story Chapters 1–3 complete through gathering, crafting, invitations and editing', async ({page}) => {
  await openGame(page);
  const result=await page.evaluate(()=>{
    qa.chapter2();showJournal();qa.close();showStudio();qa.close();
    let p=qa.site('path');terrainAt(p.x,p.y,'path');qa.close();
    qa.supplies('stone',1);p=qa.site('pond');terrainAt(p.x,p.y,'pond');qa.close();
    const index=state.built.findIndex(b=>b.type==='cottage');
    showHouseStyle(index);chooseStyle('roof','#648fbc');qa.close();
    const home=state.built[index];p=qa.site('cottage',home);moveStructure(home,p.x,p.y);qa.close();
    unlockZone('north');qa.close();persist();
    return {quest:state.quest,c2:state.chapter2Step,c3:state.chapter3Step,chapter2Complete:state.chapter2Complete,chapter3Complete:state.chapter3Complete,residents:state.residents.length,homeItems:ensureInterior('player').items.length,market:state.built.some(b=>b.type==='market'),expansions:state.expansions};
  });
  expect(result).toMatchObject({quest:6,c2:6,c3:6,chapter2Complete:true,chapter3Complete:true,residents:2,homeItems:1,market:true});
  expect(result.expansions).toContain('north');
});

test('progression gates cannot be bypassed from direct or Designer actions', async ({page}) => {
  await openGame(page);
  const result=await page.evaluate(()=>{
    qa.supplies('wood',10);qa.supplies('stone',10);qa.supplies('petals',3);
    const before={wood:state.wood,stone:state.stone,petals:state.petals};
    repairWorkshop();craftFurniture('chair');unlockZone('north');
    activateDesigner('place','market');let p=qa.site('market');qa.approach(p,3);modeTap(p);qa.close();
    return {restored:state.workshopRestored,crafted:state.craftedCount,market:state.built.some(b=>b.type==='market'),expansions:state.expansions.length,before,after:{wood:state.wood,stone:state.stone,petals:state.petals}};
  });
  expect(result).toMatchObject({restored:false,crafted:0,market:false,expansions:0});
  expect(result.after).toEqual(result.before);
});

test('farm growth, fishing, cooking, shopping and furniture conservation', async ({page}) => {
  await openGame(page);
  const result=await page.evaluate(()=>{
    qa.chapter2();
    const g=qa.build('garden'),idx=state.built.indexOf(g),day=state.day;
    tendPlot(idx,'water');qa.close();dayAdvance();
    tendPlot(idx,'water');qa.close();dayAdvance();
    const petals=state.petals;tendPlot(idx,'harvest');qa.close();
    const harvestGain=state.petals-petals;
    qa.supplies('wood',3);qa.supplies('stone',1);craftToolV06('pole');qa.close();
    showFishing();miniFishing.begin=performance.now()-Math.asin(.02)*320;reelFish();qa.close();
    const fish=state.fish;makeMeal();qa.close();
    const meal=state.meals,coins=state.coins,wood=state.wood;
    trade('wood','buy');qa.close();
    const bought=state.wood===wood+1&&state.coins===coins-6;
    trade('wood','sell');qa.close();
    const sold=state.wood===wood&&state.coins===coins-3;
    enterInterior('player');placeFurniture(2,2);qa.close();
    const returned=state.furniture.chair;
    enterInterior('player');uiSelectedFurniture='chair';placeFurniture(2,2);qa.close();
    return {harvestGain,gardensHarvested:state.gardensHarvested,days:state.day-day,fish,meal,bought,sold,returned,chair:state.furniture.chair,items:ensureInterior('player').items.filter(i=>i.id==='chair').length,counts:['wood','stone','petals','fish','bugs','meals'].map(k=>state[k])};
  });
  expect(result).toMatchObject({harvestGain:3,gardensHarvested:1,days:2,fish:1,meal:1,bought:true,sold:true,returned:1,chair:0,items:1});
  expect(result.counts.every(n=>Number.isInteger(n)&&n>=0)).toBe(true);
});

test('undo and redo preserve unrelated resources and occupied homes', async ({page}) => {
  await openGame(page);
  const result=await page.evaluate(()=>{
    qa.chapter1();qa.supplies('wood',4);qa.supplies('stone',2);
    const b=qa.build('bench'),afterBuild=state.wood;
    // Collect real resources after editing; undo must retain these later gains.
    const tree=obstacles.find(o=>o.kind==='tree'&&!state.harvested.includes(o.id));
    qa.approach(tree);gather(tree);qa.close();const laterWood=state.wood;
    undoDesign();const undone={wood:state.wood,bench:state.built.includes(b)};
    redoDesign();const redone={wood:state.wood,benches:state.built.filter(b=>b.type==='bench').length};
    // Clearing a home from an earlier history entry must not evict its resident.
    const home=state.built.find(b=>b.resident===1);
    removeAt(home.x,home.y);
    return {afterBuild,laterWood,undone,redone,resident:state.residents.includes(1),home:state.built.some(b=>b.resident===1)};
  });
  expect(result.undone.wood).toBe(result.laterWood+3);
  expect(result.redone).toMatchObject({wood:result.laterWood,benches:1});
  expect(result).toMatchObject({resident:true,home:true});
});

test('buildings and pond block movement, and tap paths route around cottages', async ({page}) => {
  await openGame(page);
  const result=await page.evaluate(()=>{
    qa.supplies('wood',2);qa.supplies('stone',2);const h=qa.build('cottage');
    const houseBlocked=!validMove(h.x,h.y),pondBlocked=!validMove(10,28),workshopBlocked=!validMove(28.5,28);
    state.player={x:h.x-3,y:h.y};walkTarget={x:h.x+3,y:h.y};
    const crossed=[];for(let i=0;i<400;i++){gameUpdate(.04);crossed.push(validMove(state.player.x,state.player.y));}
    return {houseBlocked,pondBlocked,workshopBlocked,walkable:crossed.every(Boolean),arrival:dist(state.player,{x:h.x+3,y:h.y})};
  });
  expect(result).toMatchObject({houseBlocked:true,pondBlocked:true,workshopBlocked:true,walkable:true});
  expect(result.arrival).toBeLessThan(.5);
});

test('daily gifts and favors spend their inventory and increase friendship', async ({page}) => {
  await openGame(page);
  const result=await page.evaluate(()=>{
    qa.chapter1();qa.supplies('petals',3);
    let petals=state.petals,friend=state.friendships[1];giveGift(1);qa.close();
    const giftSpent=state.petals===petals-1,giftFriend=state.friendships[1]>friend;
    let r=requestFor(1);if(['wood','stone','petals'].includes(r.type))qa.supplies(r.type,1);
    else { // Advance naturally to a day whose request uses gatherable supplies.
      for(let i=0;i<5&&!['wood','stone','petals'].includes(r.type);i++){dayAdvance();r=requestFor(1);}
      qa.supplies(r.type,1);
    }
    const k=r.type,before=state[k],f=state.friendships[1];fulfillRequest(1);qa.close();
    return {giftSpent,giftFriend,requestSpent:state[k]===before-1,requestFriend:state.friendships[1]>=f+3,done:requestFor(1).done};
  });
  expect(result).toEqual({giftSpent:true,giftFriend:true,requestSpent:true,requestFriend:true,done:true});
});
