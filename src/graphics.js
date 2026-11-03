/* v0.6 renderer: retain the original models and artwork, cache static scenery,
   and keep the isometric engine available after GPU/context failures. */
const graphicsStats = {frames:0, geometryBuilds:0, vertices:0, mode:'2d', frameMs:0};
window.fathermonGraphicsStats = graphicsStats;
const atmosphere = document.createElement('canvas');
atmosphere.id='atmosphere';atmosphere.setAttribute('aria-hidden','true');
atmosphere.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none';
gameContainer.append(atmosphere);
const atmosphereContext=atmosphere.getContext('2d');
let graphicsCacheKey='', graphicsNextCheck=0, graphicsCount=0, graphicsLastFrame=0;
let graphicsMeshBuffer=null, graphicsDynamicBuffer=null, graphicsProgram=null;
let graphicsFollow=null, graphicsFollowTime=0, graphicsContextLost=false;
const graphicsLocations=new WeakMap();
const graphicsVertex=`#version 300 es
precision highp float;
in vec3 aPos;in vec3 aCol;in vec2 aUV;
uniform vec3 uEye,uRight,uUp,uForward;uniform float uAspect,uTan;
${characterDeformGLSLV06}
out vec3 vCol;out vec2 vUV;out float vDepth;
void main(){vec3 worldPos=uCharacter?animateFathermon(aPos):aPos;vec3 p=worldPos-uEye;float d=dot(p,uForward);gl_Position=vec4(dot(p,uRight)/(uAspect*uTan),dot(p,uUp)/uTan,1.002*d-.20,d);vCol=aCol;vUV=aUV;vDepth=d;}`;
const graphicsFragment=`#version 300 es
precision mediump float;
in vec3 vCol;in vec2 vUV;in float vDepth;
uniform bool uSprite;uniform sampler2D uTex;uniform vec3 uLight,uFog;uniform float uHaze;
out vec4 frag;
void main(){vec4 c=uSprite?texture(uTex,vUV)*vec4(vCol,1.):vec4(vCol,1.);if(c.a<.07)discard;
vec3 lit=c.rgb*(uSprite?mix(uLight,vec3(1.),.38):uLight);
float fog=smoothstep(18.,70.,vDepth)*uHaze;frag=vec4(mix(lit,uFog,fog),c.a);}`;
function graphicsLocation(prog,name,attribute=false){let cache=graphicsLocations.get(prog);if(!cache){cache=new Map();graphicsLocations.set(prog,cache)}const key=(attribute?'a:':'u:')+name;if(!cache.has(key))cache.set(key,attribute?gl.getAttribLocation(prog,name):gl.getUniformLocation(prog,name));return cache.get(key)}
function graphicsBind(buffer,arr,upload=true,usage){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);if(upload)gl.bufferData(gl.ARRAY_BUFFER,arr instanceof Float32Array?arr:new Float32Array(arr),usage||gl.DYNAMIC_DRAW);for(const [name,size,offset] of [['aPos',3,0],['aCol',3,12],['aUV',2,24]]){const loc=graphicsLocation(graphicsProgram,name,true);if(loc<0)continue;gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset)}}
function graphicsUploadTexture(index){const im=IMG[NAMES[index]];if(!glReady||!im?.complete||!im.naturalWidth)return;const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);textureArray[index]={tex:t,aspect:im.naturalWidth/im.naturalHeight}}
function initializePolishedGraphics(restore=false){if(!gl||graphicsContextLost)return false;try{graphicsProgram=makeProgram(graphicsVertex,graphicsFragment);characterGpuCacheV06=new Map();graphicsMeshBuffer=gl.createBuffer();graphicsDynamicBuffer=gl.createBuffer();gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);glReady=true;graphicsCacheKey='';geometryDirty=true;if(restore){textureArray=[];NAMES.forEach((_,i)=>graphicsUploadTexture(i))}return true}catch(err){glReady=false;console.warn('Using the isometric renderer:',err.message);return false}}
initializePolishedGraphics();
world3d.addEventListener('webglcontextlost',e=>{e.preventDefault();graphicsContextLost=true;glReady=false;graphicsCacheKey='';syncRenderSurfaces();if(state)toast('Graphics paused by the device. Your town continues in 2D.',3600)});
world3d.addEventListener('webglcontextrestored',()=>{graphicsContextLost=false;initializePolishedGraphics(true);syncRenderSurfaces();if(state)toast('3D graphics restored',2400)});
function usesPolished3D(){return glReady&&!graphicsContextLost&&state?.renderMode!=='2d'}
function syncRenderSurfaces(){const use3d=usesPolished3D();world3d.style.display=use3d?'block':'none';canvas.style.visibility=use3d?'hidden':'visible';canvas.style.pointerEvents=use3d?'none':'auto';graphicsStats.mode=use3d?'webgl2':'2d';orbitDock.style.display=use3d?'flex':'none'}
function setRenderMode(mode){if(!state)return;state.renderMode=mode==='2d'?'2d':'3d';graphicsFollow=null;syncRenderSurfaces();persist();resize()}
// World-relative lighting changes continuously through dawn and sunset.
function townshipLight(){const hour=state.clock,day=clamp(Math.sin((hour-6)/24*Math.PI*2)*1.4,0,1),warm=Math.exp(-Math.pow((hour-18)/1.7,2))*.18;return {light:[.39+day*.61+warm,.49+day*.51,.66+day*.34-warm*.45],sky:[.13+day*.48+warm,.22+day*.59,.35+day*.49],day}}
updateCamera=function(){if(!state)return;const now=performance.now(),dt=Math.min(.1,(now-graphicsFollowTime)/1000||.016);graphicsFollowTime=now;let x=state.player.x,z=state.player.y;if(!graphicsFollow||Math.hypot(x-graphicsFollow.x,z-graphicsFollow.z)>10)graphicsFollow={x,z};let alpha=state.reducedMotion?1:1-Math.exp(-dt*8);graphicsFollow.x=ease(graphicsFollow.x,x,alpha);graphicsFollow.z=ease(graphicsFollow.z,z,alpha);x=graphicsFollow.x;z=graphicsFollow.z;const distv=clamp(27/currentZoom,13,48),yaw=scene3d.yaw,pitch=clamp(scene3d.pitch,.38,1.2),c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);scene3d.dist=distv;scene3d.target=[x,0,z];scene3d.eye=[x+c*cp*distv,sp*distv,z+s*cp*distv];scene3d.forward=[-c*cp,-sp,-s*cp];scene3d.right=[s,0,-c];scene3d.up=[-c*sp,cp,-s*sp];scene3d.aspect=world3d.width/Math.max(1,world3d.height)};
// Preserve sprites exactly; movement uses a tiny grounded bob rather than hovering.
spriteQuad=function(pos,id){const ref=textureArray[id];if(!ref)return null;const scale=pos.player?2.35:1.98,width=scale*Math.min(1.35,ref.aspect),right=scene3d.right;const moving=pos.player?!!walkTarget||!!joyX||!!joyY||keys.size>0:!!npcData[id]?.target;const bob=state.reducedMotion?0:moving?Math.abs(Math.sin(tick*7+(id||0)))*.055:Math.sin(tick*1.5+id)*.012;const y0=.075+bob,y1=y0+scale,x=pos.x,z=pos.y,a=[x-right[0]*width/2,y0,z-right[2]*width/2],b=[x+right[0]*width/2,y0,z+right[2]*width/2],c=[x+right[0]*width/2,y1,z+right[2]*width/2],d=[x-right[0]*width/2,y1,z-right[2]*width/2],t=[],vert=(p,uv)=>t.push(...p,1,1,1,...uv);vert(a,[0,1]);vert(b,[1,1]);vert(c,[1,0]);vert(a,[0,1]);vert(c,[1,0]);vert(d,[0,0]);return t};
const graphicsOriginalTerrain=addTerrain3d;
function groundShadow(g,x,z,r=1){g.disc(x+.12,z+.14,r,'#7fb47e',.032,16);g.disc(x+.10,z+.12,r*.72,'#76a974',.034,16);g.disc(x+.08,z+.1,r*.43,'#6f9f6b',.036,14)}
addTerrain3d=function(g){const ghost=designer.ghost;designer.ghost=null;try{graphicsOriginalTerrain(g)}finally{designer.ghost=ghost}
// Meandering stream stays beyond the starter meadow; no starter homes or residents.
for(let z=3;z<35;z++){let x=3.2+Math.sin(z*.23)*.5;g.flat(x,z,1.9,1.05,'#72bdc7',.044);if(!state.lowGraphics)g.flat(x-.2,z,.65,.08,'#b0e0dc',.046)}
if(!state.lowGraphics){for(let i=0;i<12;i++){const x=5+i*2.7,z=i%2?3.5:35.2;g.cone(x,z,1.7,.9, i%2?'#8cc487':'#9dcc91',-.02,8)}
for(const o of obstacles){if(state.harvested.includes(o.id))continue;if(o.kind==='tree')groundShadow(g,o.x,o.y,.86);if(o.kind==='rock')groundShadow(g,o.x,o.y,.47)}
for(const b of state.built){if(b.type==='cottage'){groundShadow(g,b.x+.6,b.y+.5,1.75);const turn=(b.rotation||0)*Math.PI/2;g.local(b.x,b.y,turn,()=>{g.box(0,1.42,1.12,.56,.12,'#dfc5a0');g.box(-1.17,1.22,.32,.32,.35,'#c3986c');g.cone(-1.17,1.22,.29,.49,'#83b87c',.32,7)})}}
// Riverbank pebbles and low flower clusters add detail without new textures.
for(let i=0;i<30;i++){const z=4+i,x=4.5+Math.sin(z*.23)*.5;g.cone(x,z,.12+hash(i,9)*.16,.16,'#c5cec0',.01,5)}
}
};
function sceneryFingerprint(){return JSON.stringify([state.built,state.terrainEdits,state.harvested,state.workshopRestored,state.lowGraphics,state.townTheme])}
function updateScenery(now){if(now<graphicsNextCheck&&!geometryDirty)return;graphicsNextCheck=now+120;const next=sceneryFingerprint();if(next===graphicsCacheKey&&!geometryDirty)return;graphicsCacheKey=next;geometryDirty=false;const g=new Geometry();addTerrain3d(g);graphicsBind(graphicsMeshBuffer,new Float32Array(g.a),true,gl.STATIC_DRAW);graphicsCount=g.a.length/8;graphicsStats.geometryBuilds++;graphicsStats.vertices=graphicsCount}
function drawDynamicGround(chars){let g=new Geometry();for(const ch of chars){g.disc(ch.x,ch.y,.47,ch.player?'#b3bc75':'#86a779',.052,12);g.disc(ch.x,ch.y,.27,'#769369',.054,12)}if(designer.ghost){const q=designer.ghost;g.flat(q.x,q.z,1.12,1.12,'#ffe89e',.115)}if(walkTarget){g.disc(walkTarget.x,walkTarget.y,.29,'#ffeaa8',.116,12);g.disc(walkTarget.x,walkTarget.y,.19,'#a4c880',.118,12)}if(g.a.length){graphicsBind(graphicsDynamicBuffer,g.a);gl.drawArrays(gl.TRIANGLES,0,g.a.length/8)}}
function drawAtmosphere(light){const c=atmosphereContext,w=cw,h=ch;if(atmosphere.width!==w||atmosphere.height!==h){atmosphere.width=w;atmosphere.height=h}c.clearRect(0,0,w,h);if(!usesPolished3D())return;const t=state.reducedMotion?0:tick;
if(state.weather==='drizzle'){c.fillStyle='#657d9920';c.fillRect(0,0,w,h);c.strokeStyle='#e9f5ff70';c.lineWidth=1;const n=state.lowGraphics?18:55;for(let i=0;i<n;i++){let x=(i*97+t*97)%(w+60)-30,y=(i*71+t*250)%(h+60)-30;c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y+13);c.stroke()}}
if(light.day<.3&&!state.lowGraphics){for(let i=0;i<15;i++){let x=(i*137+Math.sin(t*.3+i)*24)%w,y=h*.3+(i*79)%Math.max(1,h*.65)+Math.sin(t+i)*12;c.fillStyle=`rgba(255,243,158,${(.3+.25*Math.sin(t*2+i))*(1-light.day)})`;c.beginPath();c.arc(x,y,2,0,7);c.fill()}}
// Subtle vignette focuses attention and softens screen edges.
if(!state.lowGraphics){const grad=c.createRadialGradient(w*.5,h*.5,Math.min(w,h)*.25,w*.5,h*.5,Math.max(w,h)*.7);grad.addColorStop(0,'#203b3500');grad.addColorStop(1,'#203b3522');c.fillStyle=grad;c.fillRect(0,0,w,h)}
}
render=function(){if(!state||document.hidden)return;const now=performance.now(),interval=state.lowGraphics?1000/30:1000/60;if(now-graphicsLastFrame<interval)return;graphicsLastFrame=now;const begin=performance.now();syncRenderSurfaces();if(!usesPolished3D()){legacyRenderedV05();drawAtmosphere({day:1});graphicsStats.frames++;return}try{syncGLSize();updateCamera();const light=townshipLight();gl.clearColor(...light.sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(graphicsProgram);for(const [name,value] of [['uEye',scene3d.eye],['uRight',scene3d.right],['uUp',scene3d.up],['uForward',scene3d.forward],['uLight',light.light],['uFog',light.sky]])gl.uniform3fv(graphicsLocation(graphicsProgram,name),value);gl.uniform1f(graphicsLocation(graphicsProgram,'uAspect'),scene3d.aspect);gl.uniform1f(graphicsLocation(graphicsProgram,'uTan'),scene3d.tan);gl.uniform1f(graphicsLocation(graphicsProgram,'uHaze'),typeof currentWeatherV06==='function'?currentWeatherV06().haze:state.weather==='drizzle'?.48:.20);gl.uniform1i(graphicsLocation(graphicsProgram,'uCharacter'),0);gl.uniform1i(graphicsLocation(graphicsProgram,'uSprite'),0);updateScenery(now);graphicsBind(graphicsMeshBuffer,null,false);gl.drawArrays(gl.TRIANGLES,0,graphicsCount);
const guestIndices=typeof visitingGuestIndicesV06==='function'?visitingGuestIndicesV06():[];const chars=[{x:state.player.x,y:state.player.y,index:state.avatar,player:true},...npcData.filter(n=>state.residents.includes(n.index)||guestIndices.includes(n.index)),...(typeof extendedResidentActorsV06==='function'?extendedResidentActorsV06():[])];if(state.traversalMode==='dive')chars.splice(1);drawDynamicGround(chars);chars.sort((a,b)=>{const e=scene3d.eye;return Math.hypot(b.x-e[0],b.y-e[2])-Math.hypot(a.x-e[0],a.y-e[2])});drawModelCharactersV06(chars.filter(ch=>ch.guestId||state.characterMode!=='art'));if(state.characterMode==='art'){const spriteChars=chars.filter(ch=>!ch.guestId);gl.uniform1i(graphicsLocation(graphicsProgram,'uSprite'),1);gl.depthMask(false);for(const ch of spriteChars){if(!textureArray[ch.index])graphicsUploadTexture(ch.index);const q=spriteQuad(ch,ch.index),tex=textureArray[ch.index];if(!q||!tex)continue;graphicsBind(graphicsDynamicBuffer,q);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex.tex);gl.uniform1i(graphicsLocation(graphicsProgram,'uTex'),0);gl.drawArrays(gl.TRIANGLES,0,6)}}
gl.depthMask(true);drawAtmosphere(light);drawMap();frameRendered++;graphicsStats.frames++;graphicsStats.frameMs=performance.now()-begin}catch(err){glReady=false;syncRenderSurfaces();console.warn('Graphics recovered with isometric fallback:',err.message);legacyRenderedV05()}};
// Capture fallback gestures once at window level; earlier v0.4/v0.5 handlers
// otherwise both act on the same tap and use different zoom coordinates.
const fallbackPointers=new Map();let fallbackGesture=null,fallbackTap=null;
function fallbackWorldPoint(x,y){const r=canvas.getBoundingClientRect();return unproj((x-r.left-cw*.5)/currentZoom+cw*.5,(y-r.top-ch*.55)/currentZoom+ch*.55)}
window.addEventListener('pointerdown',e=>{if(e.target!==canvas||usesPolished3D()||paused||activeModal)return;e.preventDefault();e.stopImmediatePropagation();canvas.setPointerCapture?.(e.pointerId);fallbackPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fallbackPointers.size===2){const [a,b]=[...fallbackPointers.values()];fallbackGesture={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:currentZoom};fallbackTap=null}else fallbackTap={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()}},true);
window.addEventListener('pointermove',e=>{if(e.target!==canvas||!fallbackPointers.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();fallbackPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fallbackGesture&&fallbackPointers.size===2){const [a,b]=[...fallbackPointers.values()];setZoom(fallbackGesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/fallbackGesture.distance)}else if(fallbackTap&&Math.hypot(e.clientX-fallbackTap.x,e.clientY-fallbackTap.y)>12)fallbackTap=null},true);
function finishFallbackPointer(e){if(!fallbackPointers.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();fallbackPointers.delete(e.pointerId);if(e.type==='pointerup'&&!fallbackGesture&&fallbackTap?.id===e.pointerId&&performance.now()-fallbackTap.time<850){const p=fallbackWorldPoint(e.clientX,e.clientY);if(designer.mode==='move'&&designer.chosen){const b=designer.chosen;designer.chosen=null;designer.ghost=null;moveStructure(b,p.x,p.y)}else if(placing&&designer.mode==='off')buildAt(p.x,p.y);else modeTap(p)}if(!fallbackPointers.size){fallbackGesture=null;fallbackTap=null}}
window.addEventListener('pointerup',finishFallbackPointer,true);window.addEventListener('pointercancel',finishFallbackPointer,true);
// Prevent a nearly horizontal camera ray from causing a drag-release exception.
const graphicsOriginalRay=rayToGround;
rayToGround=function(x,y){const p=graphicsOriginalRay(x,y);return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?p:{x:state?.player.x||20,y:state?.player.y||19}};
// Display every terrain-edit type in the fallback as well as the WebGL view.
const graphicsOriginalIsoTerrain=terrain;
terrain=function(){graphicsOriginalIsoTerrain();for(const b of state.terrainEdits||[]){const p=proj(b.x,b.y);if(p.x< -100||p.x>cw+100||p.y< -100||p.y>ch+100)continue;if(b.type==='path')diamond(b.x,b.y,'#e0c79d','#cfb58b');else if(b.type==='tree')drawTree({seed:.5},p);else if(b.type==='garden')drawFlowers({seed:.7},p);else if(b.type==='pond'){ellipse(p.x,p.y,28,13,'#8ebba9');ellipse(p.x,p.y-1,23,10,'#76c6d0');ellipse(p.x-7,p.y-4,10,2,'#c1eae5')}else if(b.type==='hill'){drawPoly([[p.x-30,p.y],[p.x,p.y-31],[p.x+30,p.y],[p.x,p.y+15]],'#7db777');drawPoly([[p.x-30,p.y],[p.x,p.y-31],[p.x,p.y+5]],'#a6d68b')}}};
// Reinitialize the smooth follow target between towns; all snapshots remain intact.
const graphicsOriginalStart=startGame;
startGame=function(saved=false){graphicsFollow=null;graphicsCacheKey='';geometryDirty=true;graphicsOriginalStart(saved);syncRenderSurfaces()};

function drawModelCharactersV06(chars){gl.depthMask(true); gl.uniform1i(graphicsLocation(graphicsProgram,'uSprite'),0);gl.uniform1i(graphicsLocation(graphicsProgram,'uCharacter'),1);
 for(const ch of chars){const id=(ch.guestId||ch.index)+':'+!!state.lowGraphics;let mesh=characterGpuCacheV06.get(id);if(!mesh){const data=ch.guestId?getExtendedGuestModelV06(ch.guestId,!!state.lowGraphics):getCharacterModelV06(ch.index,!!state.lowGraphics);mesh={buffer:gl.createBuffer(),count:data.length/8};graphicsBind(mesh.buffer,data,true,gl.STATIC_DRAW);characterGpuCacheV06.set(id,mesh);}else graphicsBind(mesh.buffer,null,false);
 const motion=getCharacterMotionV06(ch),reduced=state.reducedMotion,action=Math.max(0,(motion.actionUntil-performance.now())/650);
 gl.uniform3fv(graphicsLocation(graphicsProgram,'uModelOrigin'),[ch.x,typeof characterAltitudeV06==='function'?characterAltitudeV06(ch):.04,ch.y]);for(const [name,value]of [['uModelYaw',motion.yaw],['uModelKind',ch.modelKind??ch.index],['uModelMotion',reduced?0:motion.amount],['uModelPhase',reduced?0:motion.phase],['uModelAction',reduced?0:Math.sin(action*Math.PI)],['uModelScale',[1,6].includes(ch.index)?.82:1],['uModelTravel',ch.player?({swim:1,dive:1,fly:2}[state.traversalMode]||0):0]])gl.uniform1f(graphicsLocation(graphicsProgram,name),value);
 gl.drawArrays(gl.TRIANGLES,0,mesh.count);
 }gl.uniform1i(graphicsLocation(graphicsProgram,'uCharacter'),0);
}
