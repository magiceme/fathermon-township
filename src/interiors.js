/* Decorate the same saved homes with a larger workshop catalogue, object finishes
 * and rotations, and an interactive 3D room. The original floor editor remains. */
const INTERIOR_RECIPES_V06={
 sofa:{name:'Cozy Sofa',icon:'🛋️',wood:4,stone:0,petals:2},
 wardrobe:{name:'Oak Wardrobe',icon:'🚪',wood:5,stone:1,petals:0},
 stove:{name:'Campside Stove',icon:'♨️',wood:2,stone:5,petals:0},
 aquarium:{name:'Little River Aquarium',icon:'🐠',wood:2,stone:2,petals:1,biomeCosts:{coralPearl:2}},
 tropicalPlant:{name:'Jungle Leaf Planter',icon:'🌴',wood:1,stone:1,petals:2,biomeCosts:{vineFiber:3}},
 snowglobe:{name:'Frostleaf Snow Globe',icon:'🔮',wood:1,stone:1,petals:1,biomeCosts:{frostCrystal:2,sunstone:1}}
};
Object.assign(CRAFT_RECIPES,INTERIOR_RECIPES_V06);
const ROOM_FINISHES_V06=[['Honey oak','#c79868'],['Sage','#8eaf94'],['Rose','#c993a1'],['Coastal blue','#7babb9'],['Lilac','#a99bc4'],['Cream','#eee1be']];
let roomToolV06='place',roomFinishV06='#c79868',roomViewV06='grid',roomMovingV06=null;
function ensureInteriorsV06(){
 if(!state)return;state.furniture ||= {};state.interiors ||= {};
 for(const id of Object.keys(CRAFT_RECIPES))if(!Number.isFinite(state.furniture[id]))state.furniture[id]=0;
 for(const room of Object.values(state.interiors)){if(!room||!Array.isArray(room.items))continue;for(const item of room.items){item.rotation=Number.isInteger(item.rotation)?((item.rotation%4)+4)%4:0;if(typeof item.color!=='string'||!/^#[a-f0-9]{6}$/i.test(item.color))delete item.color;}}
}
function interiorBiomeCountV06(id){return typeof biomeMaterialCountV06==='function'?biomeMaterialCountV06(id):Math.max(0,Number(state?.biomeMaterials?.[id])||0);}
const canMakeBeforeInteriorsV06=canMake;
canMake=function(recipe){return canMakeBeforeInteriorsV06(recipe)&&Object.entries(recipe.biomeCosts||{}).every(([id,count])=>interiorBiomeCountV06(id)>=count)};
const craftBeforeInteriorsV06=craftFurniture;
craftFurniture=function(id){
 ensureInteriorsV06();const recipe=CRAFT_RECIPES[id];if(!recipe||!canMake(recipe)){toast('Gather the workshop materials for this furniture first.');return;}
 const before=state.craftedCount;craftBeforeInteriorsV06(id);
 if(state.craftedCount>before&&recipe.biomeCosts){for(const [material,count]of Object.entries(recipe.biomeCosts))state.biomeMaterials[material]-=count;persist();}
};
const workshopBeforeInteriorsV06=showWorkshop;
showWorkshop=function(){ensureInteriorsV06();workshopBeforeInteriorsV06();if(!state.workshopRestored)return;$('modalBody').querySelectorAll('[data-v04="craft"]').forEach(card=>{const recipe=CRAFT_RECIPES[card.dataset.id];if(recipe?.biomeCosts)card.querySelector('small')?.insertAdjacentHTML('beforeend','<br>＋ '+Object.entries(recipe.biomeCosts).map(([id,count])=>count+' '+({coralPearl:'Coral Pearl',vineFiber:'Vine Fiber',frostCrystal:'Frost Crystal',sunstone:'Sunstone'}[id]||id)).join(' · '));});};
function rotateRoomItemV06(x,y){ensureInteriorsV06();const item=ensureInterior(uiHomeKey).items.find(i=>i.x===x&&i.y===y);if(!item){toast('Choose a placed piece of furniture to rotate.');return false;}item.rotation=((item.rotation||0)+1)%4;persist();renderInterior();return true;}
function recolorRoomItemV06(x,y,color=roomFinishV06){ensureInteriorsV06();if(!ROOM_FINISHES_V06.some(([,c])=>c===color))return false;const item=ensureInterior(uiHomeKey).items.find(i=>i.x===x&&i.y===y);if(!item){toast('Choose a placed piece of furniture to refinish.');return false;}item.color=color;persist();renderInterior();return true;}
function moveRoomItemV06(fromX,fromY,toX,toY){const room=ensureInterior(uiHomeKey),columns=typeof interiorHomeWithWingV06==='function'&&interiorHomeWithWingV06()?8:6;if(!Number.isInteger(toX)||!Number.isInteger(toY)||toX<0||toX>=columns||toY<0||toY>=5||room.items.some(i=>i.x===toX&&i.y===toY))return false;const item=room.items.find(i=>i.x===fromX&&i.y===fromY);if(!item)return false;item.x=toX;item.y=toY;persist();renderInterior();return true;}
function useRoomTileV06(x,y){if(roomToolV06==='move'){const item=ensureInterior(uiHomeKey).items.find(i=>i.x===x&&i.y===y);if(!roomMovingV06){if(!item){toast('Choose a placed item, then an empty floor tile.');return false;}roomMovingV06={x,y};toast('Now choose an empty floor tile for '+CRAFT_RECIPES[item.id].name+'.');renderInterior();return true;}if(item){roomMovingV06=null;toast('Move cancelled. Choose an item to begin again.');renderInterior();return false;}const from=roomMovingV06;roomMovingV06=null;return moveRoomItemV06(from.x,from.y,x,y);}if(roomToolV06==='rotate')return rotateRoomItemV06(x,y);if(roomToolV06==='color')return recolorRoomItemV06(x,y);return placeFurniture(x,y);}
const interiorPlaceBeforeV06=placeFurniture;
placeFurniture=function(x,y){ensureInteriorsV06();const columns=typeof interiorHomeWithWingV06==='function'&&interiorHomeWithWingV06()?8:6;if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>=columns||y<0||y>=5)return;interiorPlaceBeforeV06(x,y);};
const interiorRenderBeforeV06=renderInterior;
renderInterior=function(){ensureInteriorsV06();interiorRenderBeforeV06();const out=$('interiorOverlay'),tools=out.querySelector('.roomTools');if(!tools)return;tools.insertAdjacentHTML('afterbegin',`<div class="interiorModeToolsV06"><h3>Make this space yours</h3><div class="actions"><button class="btn ${roomViewV06==='grid'?'':'secondary'}" data-interior-view="grid">Floor grid</button><button class="btn ${roomViewV06==='3d'?'':'secondary'}" data-interior-view="3d">3D room</button></div><div class="actions">${[['place','Place / pack'],['move','Move'],['rotate','Rotate'],['color','Refinish']].map(([id,label])=>`<button class="btn ${roomToolV06===id?'':'secondary'}" data-room-tool="${id}" aria-pressed="${roomToolV06===id}">${label}</button>`).join('')}</div><p class="sub">${roomToolV06==='move'?(roomMovingV06?'Choose its new empty floor tile.':'Tap a placed item, then an empty tile to move it.'):roomToolV06==='rotate'?'Tap a placed item to turn it a quarter turn.':roomToolV06==='color'?'Choose a finish, then tap a placed item.':'Choose crafted furniture, then tap an empty tile. Tap a furnished tile to pack it.'}</p><div class="swatches">${ROOM_FINISHES_V06.map(([label,color])=>`<button class="swatch ${roomFinishV06===color?'selected':''}" style="background:${color}" data-room-finish="${color}" aria-label="${label} furniture finish" title="${label}"></button>`).join('')}</div></div>`);
 out.querySelectorAll('.floorTile').forEach(tile=>{const item=ensureInterior(uiHomeKey).items.find(i=>i.x===Number(tile.dataset.x)&&i.y===Number(tile.dataset.y));if(item){tile.style.color=item.color||'';tile.style.backgroundImage=item.color?'linear-gradient(135deg,'+item.color+'60,transparent)':'';tile.style.setProperty('--item-turn',((item.rotation||0)*90)+'deg');const content=document.createElement('span');content.textContent=tile.textContent;content.style.display='inline-block';content.style.transform='rotate(var(--item-turn))';tile.replaceChildren(content);}});
 if(roomViewV06==='3d')mountRoomPreviewV06();
};
function showRoomPreviewV06(){roomViewV06='3d';renderInterior();}
document.addEventListener('click',e=>{
 const tool=e.target.closest('[data-room-tool]'),finish=e.target.closest('[data-room-finish]'),view=e.target.closest('[data-interior-view]'),tile=e.target.closest('[data-v04="tile"]'),pick=e.target.closest('[data-v04="pickItem"]');
 if(pick){roomToolV06='place';roomMovingV06=null;return;}
 if(tool||finish||view){e.preventDefault();e.stopImmediatePropagation();if(tool){roomToolV06=tool.dataset.roomTool;roomMovingV06=null;}if(finish)roomFinishV06=finish.dataset.roomFinish;if(view)roomViewV06=view.dataset.interiorView;renderInterior();return;}
 if(tile&&roomToolV06!=='place'){e.preventDefault();e.stopImmediatePropagation();useRoomTileV06(Number(tile.dataset.x),Number(tile.dataset.y));}
},true);
const resetBeforeInteriorsV06=systemsStartReset;
systemsStartReset=function(){resetBeforeInteriorsV06();ensureInteriorsV06();roomToolV06='place';roomMovingV06=null;};

function roomSphereV06(g,x,y,z,rx,ry,rz,color){if(typeof sphereWorldV06==='function')sphereWorldV06(g,x,y,z,rx,ry,rz,color,12,7);else g.box(x,z,rx*2,rz*2,ry*2,color,y-ry);}
function roomFurnitureMeshV06(g,item){
 const id=item.id,finish=item.color||'#c79868',wood=finish,cloth=item.color||'#b7c99f',accent='#f4e7c6';
 g.local(item.x+.5,item.y+.5,(item.rotation||0)*Math.PI/2,()=>{
  const legs=(width=.62,depth=.55,height=.55)=>{for(const x of [-width/2,width/2])for(const z of [-depth/2,depth/2])g.box(x,z,.1,.1,height,wood);};
  if(id==='chair'){legs();g.box(0,0,.78,.74,.13,wood,.5);g.box(0,-.31,.76,.12,.62,wood,.55);g.box(0,-.23,.63,.09,.43,cloth,.68);}
  else if(id==='table'){legs(.72,.65,.78);g.box(0,0,.98,.94,.12,wood,.77);g.box(0,0,1.02,.98,.04,accent,.88);}
  else if(id==='bed'){g.box(0,0,.91,1.12,.3,wood,.06);g.box(0,0,.85,1.05,.12,'#f7efd9',.36);g.box(0,.17,.86,.64,.15,cloth,.47);roomSphereV06(g,0,.54,-.35,.33,.09,.16,'#f9f3df');g.box(0,-.56,.94,.1,.72,wood,.05);}
  else if(id==='rug'){g.flat(0,0,.98,.98,item.color||'#bf9ab4',.018);g.flat(0,0,.8,.8,'#f1dbb7',.02);g.disc(0,0,.26,item.color||'#bf9ab4',.023,20);}
  else if(id==='books'){g.box(0,0,.9,.36,1.2,wood);for(const y of [.1,.58,1.1])g.box(0,.03,.94,.42,.07,accent,y);for(let i=0;i<7;i++)for(const y of [.16,.65])g.box(-.34+i*.11,.06,.08,.25,.35,['#8cafa6','#d1a296','#d8bd7d'][i%3],y);}
  else if(id==='lamp'){g.disc(0,0,.23,wood,.08,16);g.box(0,0,.07,.07,.66,'#b89464',.1);g.cone(0,0,.36,.38,item.color||'#f2d894',.74,16);g.disc(0,0,.35,'#fff0bd',.75,16);}
  else if(id==='sofa'){legs(.7,.6,.18);g.box(0,0,.98,.78,.32,wood,.13);g.box(0,-.28,1,.18,.68,cloth,.23);roomSphereV06(g,0,.55,-.23,.45,.3,.12,cloth);for(const x of [-.24,.24])roomSphereV06(g,x,.47,.08,.23,.12,.29,item.color||'#cad7b3');for(const x of [-.49,.49])roomSphereV06(g,x,.48,0,.1,.22,.38,cloth);}
  else if(id==='wardrobe'){g.box(0,0,.94,.56,1.5,wood);for(const x of [-.24,.24]){g.box(x,.3,.42,.05,1.28,accent,.1);g.box(x<0?-.07:.07,.35,.04,.05,.1,'#9a7d4a',.73);}g.box(0,0,1.01,.62,.09,wood,1.5);}
  else if(id==='stove'){g.box(0,0,.86,.73,.88,item.color||'#7e918e');g.box(0,.38,.63,.04,.47,'#384a4c',.19);g.box(0,.41,.46,.03,.3,'#b78656',.27);g.box(0,.43,.5,.04,.06,'#dfc997',.72);g.box(0,0,.92,.78,.08,'#dedbc6',.88);for(const x of [-.22,.22])g.disc(x,0,.17,'#465352',.969,16);}
  else if(id==='aquarium'){legs(.65,.42,.28);g.box(0,0,.92,.61,.1,wood,.28);g.box(0,0,.83,.53,.7,'#a4d9d2',.38);g.box(0,.285,.76,.03,.55,'#8bcac5',.45);g.box(0,0,.95,.64,.08,wood,1.08);for(const x of [-.2,.18]){roomSphereV06(g,x,.7+x*.25,.31,.11,.06,.025,x<0?'#e8a878':'#d1bc7d');g.cone(x-.12,.32,.07,.14,'#e8b883',.64,5);}for(let i=0;i<4;i++)roomSphereV06(g,.28,.54+i*.12,.31,.025,.025,.01,'#dcf4de');}
  else if(id==='snowglobe'){g.disc(0,0,.4,wood,.12,20);g.box(0,0,.7,.7,.1,wood,.03);roomSphereV06(g,0,.52,0,.37,.37,.37,'#bfdfdc');g.cone(0,.28,.17,.43,'#f4f4df',.22,7);g.disc(0,.1,.31,'#f3f2dc',.2,16);for(let i=0;i<8;i++)roomSphereV06(g,Math.sin(i*2)*.22,.38+(i%3)*.13,.29,.024,.024,.024,'#fff8e3');}
  else {const tropical=id==='tropicalPlant';g.cone(0,0,.3,.4,wood,0,12);g.disc(0,0,.27,'#705c43',.39,14);g.box(0,0,.08,.08,tropical?.9:.55,'#7f995f',.39);for(let i=0;i<5;i++){const a=i/5*Math.PI*2,h=tropical?1.13:.77;roomSphereV06(g,Math.cos(a)*.22,h+i%2*.1,Math.sin(a)*.22,.18,.09,.34,i%2?'#7cad74':'#8fb77d');}}
 });
}
function buildRoomMeshV06(){
 ensureInteriorsV06();const room=ensureInterior(uiHomeKey),columns=typeof interiorHomeWithWingV06==='function'&&interiorHomeWithWingV06()?8:6,g=new Geometry();
 g.box(columns/2,2.5,columns+.1,5.1,.18,'#b08a65',-.18);
 for(let x=0;x<columns;x++)for(let z=0;z<5;z++){g.box(x+.5,z+.5,.98,.98,.06,room.floor,-.04);g.flat(x+.5,z+.5,.025,.94,'#ac8f6b',.023);}
 g.box(columns/2,-.07,columns+.2,.14,2.65,room.wall);g.box(-.07,2.5,.14,5.14,2.65,room.wall);g.box(columns/2,.03,columns,.08,.13,'#b99f7b');g.box(.03,2.5,.08,5,.13,'#b99f7b');g.box(columns/2,-.07,columns+.25,.2,.14,'#c3af8a',2.65);g.box(-.07,2.5,.2,5.2,.14,'#c3af8a',2.65);
 g.box(columns*.6,.035,1.42,.04,1.16,'#b1dbd4',1.08);g.box(columns*.6,.07,.07,.05,1.24,'#fff6db',1.04);g.box(columns*.6,.07,1.5,.05,.07,'#fff6db',1.64);g.box(columns*.6,.09,1.58,.12,.09,'#d4b183',1.02);
 for(const item of room.items)if(CRAFT_RECIPES[item.id])roomFurnitureMeshV06(g,item);
 const avatar=uiHomeKey==='player'?state.avatar:Number(uiHomeKey),mesh=String(uiHomeKey).startsWith('guest:')&&typeof getExtendedGuestModelV06==='function'?getExtendedGuestModelV06(String(uiHomeKey).slice(6),true):typeof getCharacterModelV06==='function'?getCharacterModelV06(avatar,true):null;
 if(mesh)for(let i=0;i<mesh.length;i+=8){const yaw=.45,c=Math.cos(yaw),s=Math.sin(yaw),x=mesh[i],z=mesh[i+2];g.a.push(columns-.9+x*c+z*s,mesh[i+1]+.03,4.13-x*s+z*c,mesh[i+3],mesh[i+4],mesh[i+5],0,0);}
 return {mesh:new Float32Array(g.a),columns};
}
function mountRoomPreviewV06(){
 const out=$('interiorOverlay'),layout=out.querySelector('.room-layout'),grid=out.querySelector('.roomCanvas'),wrap=document.createElement('div');wrap.className='room3DStageV06';wrap.innerHTML='<canvas id="room3DCanvasV06" aria-label="Interactive 3D home room"></canvas><small>Tap floor to decorate · drag to turn the room · wheel to zoom</small>';layout.insertBefore(wrap,grid);const canvas3d=wrap.querySelector('canvas'),gpu=canvas3d.getContext('webgl2',{alpha:false,antialias:!state.lowGraphics});if(!gpu){wrap.remove();roomViewV06='grid';toast('This device uses the floor-grid decorator. All furniture remains editable.');return;}grid.style.display='none';
 const shaders=[`#version 300 es\nin vec3 aPos;in vec3 aCol;uniform vec3 uEye,uRight,uUp,uForward;uniform float uAspect,uTan;out vec3 vColor;void main(){vec3 p=aPos-uEye;float d=dot(p,uForward);gl_Position=vec4(dot(p,uRight)/(uAspect*uTan),dot(p,uUp)/uTan,1.002*d-.2,d);vColor=aCol;}`,`#version 300 es\nprecision mediump float;in vec3 vColor;out vec4 frag;void main(){frag=vec4(vColor,1.);}`],program=gpu.createProgram();let valid=true;
 for(let i=0;i<2;i++){const shader=gpu.createShader(i===0?gpu.VERTEX_SHADER:gpu.FRAGMENT_SHADER);gpu.shaderSource(shader,shaders[i]);gpu.compileShader(shader);valid&&=gpu.getShaderParameter(shader,gpu.COMPILE_STATUS);gpu.attachShader(program,shader);}gpu.linkProgram(program);valid&&=gpu.getProgramParameter(program,gpu.LINK_STATUS);if(!valid){wrap.remove();grid.style.display='';roomViewV06='grid';return;}gpu.useProgram(program);gpu.enable(gpu.DEPTH_TEST);gpu.clearColor(.8,.85,.72,1);
 const {mesh,columns}=buildRoomMeshV06(),buffer=gpu.createBuffer();gpu.bindBuffer(gpu.ARRAY_BUFFER,buffer);gpu.bufferData(gpu.ARRAY_BUFFER,mesh,gpu.STATIC_DRAW);for(const [name,offset]of [['aPos',0],['aCol',12]]){const loc=gpu.getAttribLocation(program,name);gpu.enableVertexAttribArray(loc);gpu.vertexAttribPointer(loc,3,gpu.FLOAT,false,32,offset);}
 let yaw=.83,pitch=.66,radius=columns+2,gesture=null,view=null;
 function updateView(){const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),target=[columns/2,.65,2.5];view={eye:[target[0]+c*cp*radius,target[1]+sp*radius,target[2]+s*cp*radius],right:[s,0,-c],up:[-c*sp,cp,-s*sp],forward:[-c*cp,-sp,-s*cp],aspect:canvas3d.width/canvas3d.height,tan:Math.tan(Math.PI/7)};}
 canvas3d.addEventListener('pointerdown',e=>{e.preventDefault();canvas3d.setPointerCapture(e.pointerId);gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};});
 canvas3d.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.lastX,dy=e.clientY-gesture.lastY;if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture.moved=true;if(gesture.moved){yaw-=dx*.009;pitch=clamp(pitch+dy*.006,.3,1.15);}gesture.lastX=e.clientX;gesture.lastY=e.clientY;});
 canvas3d.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const tap=!gesture.moved;gesture=null;if(!tap||!view)return;const r=canvas3d.getBoundingClientRect(),nx=2*(e.clientX-r.left)/r.width-1,ny=1-2*(e.clientY-r.top)/r.height,c=view,dx=c.forward[0]+c.right[0]*nx*c.aspect*c.tan+c.up[0]*ny*c.tan,dy=c.forward[1]+c.up[1]*ny*c.tan,dz=c.forward[2]+c.right[2]*nx*c.aspect*c.tan+c.up[2]*ny*c.tan;if(dy>=-.01)return;const t=-c.eye[1]/dy,x=Math.floor(c.eye[0]+dx*t),y=Math.floor(c.eye[2]+dz*t);if(x>=0&&x<columns&&y>=0&&y<5)useRoomTileV06(x,y);});
 canvas3d.addEventListener('pointercancel',()=>gesture=null);canvas3d.addEventListener('contextmenu',e=>e.preventDefault());canvas3d.addEventListener('wheel',e=>{e.preventDefault();radius=clamp(radius+e.deltaY*.008,6,20)},{passive:false});
 function paint(){if(!canvas3d.isConnected||out.classList.contains('hidden')){gpu.deleteBuffer(buffer);gpu.deleteProgram(program);gpu.getExtension('WEBGL_lose_context')?.loseContext();return;}const ratio=state.lowGraphics?1:Math.min(1.6,devicePixelRatio||1),w=Math.round(canvas3d.clientWidth*ratio),h=Math.round(canvas3d.clientHeight*ratio);if(canvas3d.width!==w||canvas3d.height!==h){canvas3d.width=w;canvas3d.height=h;}gpu.viewport(0,0,w,h);updateView();gpu.clear(gpu.COLOR_BUFFER_BIT|gpu.DEPTH_BUFFER_BIT);for(const [name,value]of [['uEye',view.eye],['uRight',view.right],['uUp',view.up],['uForward',view.forward]])gpu.uniform3fv(gpu.getUniformLocation(program,name),value);gpu.uniform1f(gpu.getUniformLocation(program,'uAspect'),view.aspect);gpu.uniform1f(gpu.getUniformLocation(program,'uTan'),view.tan);gpu.drawArrays(gpu.TRIANGLES,0,mesh.length/8);requestAnimationFrame(paint);}requestAnimationFrame(paint);
}
const interiorsCssV06=document.createElement('style');interiorsCssV06.textContent='.interiorModeToolsV06{border-bottom:1px solid #d8dfc6;padding-bottom:14px;margin-bottom:16px}.interiorModeToolsV06 .actions{margin-top:9px;gap:5px}.interiorModeToolsV06 .btn{font-size:11px;min-height:38px;padding:8px 11px}.room3DStageV06{align-self:start;border:6px solid #fff8dd;border-radius:22px;overflow:hidden;box-shadow:0 10px 32px #34573b22;background:#d1dfbb;min-width:0}.room3DStageV06 canvas{display:block;width:100%;height:420px;touch-action:none;cursor:grab}.room3DStageV06 small{display:block;padding:10px 12px;color:#4d6e54;font-size:10px;text-align:center;background:#f2f2dc}.furnitureSlots{flex-wrap:wrap}.furniturePick{min-width:44px}.floorTile span{pointer-events:none}@media(max-width:620px){.room3DStageV06 canvas{height:300px}.roomTools{overflow:visible}.interiorModeToolsV06 .btn{font-size:10px;padding:8px}.room3DStageV06{border-width:4px;border-radius:16px}}';document.head.append(interiorsCssV06);

// The opaque room editor covers the town; avoid painting a second world behind it.
const worldRenderBeforeRoomV06=render;
render=function(){if($('interiorOverlay').classList.contains('hidden'))worldRenderBeforeRoomV06();};
const leaveRoomBeforeMoveV06=leaveInterior;
leaveInterior=function(){roomMovingV06=null;leaveRoomBeforeMoveV06();};
