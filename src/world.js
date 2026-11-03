// The original 42 x 38 township remains at its saved coordinates inside a much
// larger wilderness. Old saves and chapter plots keep their exact positions.
const WORLD_V06={minX:-96,maxX:160,minY:-96,maxY:144};
window.fathermonWorldInfo={...WORLD_V06,townWidth:W,townHeight:H,areaRatio:256*240/(W*H)};
inside=function(x,y){return x>WORLD_V06.minX+2&&y>WORLD_V06.minY+2&&x<WORLD_V06.maxX-2&&y<WORLD_V06.maxY-2};
function inOriginalTownV06(x,y){return x>-1&&x<44&&y>-1&&y<40;}
function riverCenterV06(y){return 52+Math.sin(y*.065)*7;}
function bridgeAtV06(y){return [14,62,107,-36].some(z=>Math.abs(y-z)<1.85);}
function wildernessWaterV06(x,y){return !inOriginalTownV06(x,y)&&Math.abs(x-riverCenterV06(y))<2.3&&!bridgeAtV06(y);}
const townCollisionV06=collides;
collides=function(x,y){return (wildernessWaterV06(x,y)&&!['swim','dive'].includes(state?.traversalMode))||townCollisionV06(x,y)};
const townPlotOpenV06=plotOpen;
plotOpen=function(x,y){return townPlotOpenV06(x,y)||!!state.chapter3Complete&&!inOriginalTownV06(x,y)&&inside(x,y)&&!wildernessWaterV06(x,y);};
function sphereWorldV06(g,x,y,z,rx,ry,rz,color,segments=9,rings=5){
 const point=(u,v)=>{let a=u/segments*Math.PI*2,b=v/rings*Math.PI;return [x+Math.sin(b)*Math.cos(a)*rx,y+Math.cos(b)*ry,z+Math.sin(b)*Math.sin(a)*rz]};
 for(let v=0;v<rings;v++)for(let u=0;u<segments;u++){const p=point(u,v),q=point(u+1,v),r=point(u+1,v+1),s=point(u,v+1),a=(u+.5)/segments*Math.PI*2,b=(v+.5)/rings*Math.PI;let shade=.79+.23*Math.max(0,-Math.cos(a)*Math.sin(b)*.4+Math.cos(b)*.8+Math.sin(a)*Math.sin(b)*.4);g.quad(p,q,r,s,color,shade);}
}
foliage=function(g,x,z,seed=0){const h=4.5+seed*1.8;g.cone(x,z,.22,h*.62,'#977052',0,7);if(seed>.48){g.cone(x,z,1.45,h*.52,'#3f8159',h*.27,9);g.cone(x,z,1.17,h*.49,'#5b9e67',h*.43,9);g.cone(x,z,.8,h*.37,'#82bd7e',h*.65,9)}else{sphereWorldV06(g,x-.55,h*.65,z-.1,1.25,h*.24,1.1,'#63965d');sphereWorldV06(g,x+.6,h*.72,z+.1,1.45,h*.25,1.25,'#79ac68');sphereWorldV06(g,x,h*.87,z,1.3,h*.23,1.24,'#96bd77')}};
const townSceneryV06=addTerrain3d;
addTerrain3d=function(g){
 const b=WORLD_V06;g.box((b.minX+b.maxX)/2,(b.minY+b.maxY)/2,b.maxX-b.minX,b.maxY-b.minY,.3,'#8fbb7b',-.34);
 townSceneryV06(g);
 const px=state.player.x,py=state.player.y,radius=state.lowGraphics?31:49,cx=Math.floor(px/16)*16,cy=Math.floor(py/16)*16;
 for(let x=Math.floor((cx-radius)/3)*3;x<=cx+radius;x+=3)for(let y=Math.floor((cy-radius)/3)*3;y<=cy+radius;y+=3){
  if(!inside(x,y)||inOriginalTownV06(x,y)||Math.abs(x-riverCenterV06(y))<4)continue;
  const q=hash(x,y,43),cluster=(Math.sin(x*.12)+Math.cos(y*.14))*.5;
  if(q<.12+Math.max(0,cluster)*.16){foliage(g,x,y,hash(y,x,5));}
  else if(q<.34&&!state.lowGraphics){g.cone(x,y,.45+q,.44,'#b3bb9d',.01,6);}
  else if(q>.91&&!state.lowGraphics){for(let k=0;k<4;k++){let dx=(k%2-.5)*.45,dz=(Math.floor(k/2)-.5)*.45;g.cone(x+dx,y+dz,.08,.42,'#719c60',0,5);g.disc(x+dx,y+dz,.16,k%2?'#e8bbbc':'#f1dfa2',.44,7)}}
  if(!state.lowGraphics&&q>.65)g.flat(x,y,1.4,1.7,cluster>0?'#9fc783':'#a8c887',-.021);
 }
 // River runs through the wilderness, with real walkable bridges.
 const low=Math.max(b.minY,cy-radius-15),high=Math.min(b.maxY,cy+radius+15);
 for(let z=Math.floor(low);z<high;z++){let x=riverCenterV06(z+.5);g.flat(x,z+.5,5.4,1.1,'#c4cf9f',-.012);g.flat(x,z+.5,4.65,1.1,'#6fb8c0',.004);if(!state.lowGraphics)g.flat(x-.5,z+.5,1.7,.07,'#aadbd2',.01);}
 for(const z of [14,62,107,-36]){if(!bridgeAtV06(z)||Math.abs(z-py)>radius+10)continue;const x=riverCenterV06(z);g.box(x,z,6.9,3.5,.14,'#bc9a72',.025);for(let k=-5;k<=5;k++)g.box(x+k*.6,z,.5,3.45,.04,k%2?'#d2b286':'#c6a278',.17);for(const side of [-1,1]){g.box(x,z+side*1.7,7.1,.12,.14,'#a67f5a',.75);for(let k=-1;k<=1;k++)g.box(x+k*3,z+side*1.7,.15,.16,.9,'#9a7454');}}
 // Distant ridgelines give the landscape a horizon instead of a board edge.
 if(!state.lowGraphics)for(let i=0;i<20;i++){let a=i/20*Math.PI*2,x=32+Math.cos(a)*116,z=24+Math.sin(a)*108;g.cone(x,z,12+hash(i,8)*10,10+hash(i,9)*13,i%2?'#97b496':'#a5bf9c',-.2,9)}
};
const townFingerprintV06=sceneryFingerprint;
sceneryFingerprint=function(){return townFingerprintV06()+':'+Math.floor(state.player.x/16)+':'+Math.floor(state.player.y/16)};
// Scope collision searches to nearby nature without changing original IDs.
const fullTownCollisionV06=collides;
let natureBucketsV06=new Map();
const setupTownBeforeWildernessV06=setupWorld;
setupWorld=function(){setupTownBeforeWildernessV06();natureBucketsV06=new Map();for(const o of obstacles){const k=Math.floor(o.x/4)+','+Math.floor(o.y/4);if(!natureBucketsV06.has(k))natureBucketsV06.set(k,[]);natureBucketsV06.get(k).push(o);}};
collides=function(x,y){const all=obstacles,near=[];const cx=Math.floor(x/4),cy=Math.floor(y/4);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)near.push(...(natureBucketsV06.get((cx+dx)+','+(cy+dy))||[]));obstacles=near;try{return fullTownCollisionV06(x,y)}finally{obstacles=all}};
// Local minimap follows exploration; the full map still opens from this button.
const originalTownMapV06=drawMap;
drawMap=function(){if(inOriginalTownV06(state.player.x,state.player.y)){originalTownMapV06();return;}const w=minimap.width,h=minimap.height,scale=w/44,ox=state.player.x-22,oy=state.player.y-22;mctx.fillStyle='#a1c68b';mctx.fillRect(0,0,w,h);mctx.strokeStyle='#76bdc5';mctx.lineWidth=5*scale;mctx.beginPath();for(let z=oy;z<oy+44;z+=2){let x=(riverCenterV06(z)-ox)*scale,y=(z-oy)*h/44;z===oy?mctx.moveTo(x,y):mctx.lineTo(x,y)}mctx.stroke();mctx.fillStyle='#fff6bd';mctx.strokeStyle='#32684c';mctx.lineWidth=3;mctx.beginPath();mctx.arc(w/2,h/2,6,0,7);mctx.fill();mctx.stroke();mctx.font='bold 16px Trebuchet MS';mctx.fillStyle='#365d47';mctx.fillText('WILDERNESS',8,h-12)};
const worldCollisionBeforeTreesV06=collides;
collides=function(x,y){if(!inOriginalTownV06(x,y)&&Math.abs(x-riverCenterV06(y))>4){const tx=Math.round(x/3)*3,ty=Math.round(y/3)*3,q=hash(tx,ty,43),cluster=(Math.sin(tx*.12)+Math.cos(ty*.14))*.5;if(q<.12+Math.max(0,cluster)*.16&&Math.hypot(x-tx,y-ty)<.43)return true;}return worldCollisionBeforeTreesV06(x,y)};
const townPathBeforeWildernessV06=findTownPath;
findTownPath=function(from,to){
 if(inOriginalTownV06(from.x,from.y)&&inOriginalTownV06(to.x,to.y))return townPathBeforeWildernessV06(from,to);
 const goal=nearestWalkable(to,4);if(!goal)return [];if(lineWalkable(from,goal))return [goal];
 const step=.75,x0=Math.max(WORLD_V06.minX+2,Math.floor(Math.min(from.x,goal.x)-12)),y0=Math.max(WORLD_V06.minY+2,Math.floor(Math.min(from.y,goal.y)-12)),nx=Math.ceil((Math.max(from.x,goal.x)+12-x0)/step),ny=Math.ceil((Math.max(from.y,goal.y)+12-y0)/step);
 const encode=(x,y)=>y*nx+x,point=k=>({x:x0+(k%nx)*step,y:y0+Math.floor(k/nx)*step}),sx=Math.round((from.x-x0)/step),sy=Math.round((from.y-y0)/step),start=encode(sx,sy),cost=new Map([[start,0]]),came=new Map(),closed=new Set(),walkable=new Map(),heap=[];
 function push(k,f){heap.push({k,f});let i=heap.length-1;while(i>0){let p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p;}heap[i]={k,f};}
 function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return first.k;}
 const heuristic=k=>dist(point(k),goal)/step,free=(x,y)=>{if(x<0||y<0||x>=nx||y>=ny)return false;const k=encode(x,y);if(!walkable.has(k)){const p=point(k);walkable.set(k,validMove(p.x,p.y));}return walkable.get(k);};
 push(start,heuristic(start));let end=null;
 for(let count=0;heap.length&&count<18000;count++){const k=pop();if(closed.has(k))continue;closed.add(k);const p=point(k);if(dist(p,goal)<1&&lineWalkable(p,goal)){end=k;break;}const x=k%nx,y=Math.floor(k/nx);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy||!free(x+dx,y+dy)||dx&&dy&&(!free(x+dx,y)||!free(x,y+dy)))continue;const n=encode(x+dx,y+dy),next=cost.get(k)+Math.hypot(dx,dy);if(closed.has(n)||next>=(cost.get(n)??Infinity))continue;came.set(n,k);cost.set(n,next);push(n,next+heuristic(n));}}
 if(end===null)return [];const route=[goal];for(let k=end;k!==start;){route.push(point(k));k=came.get(k);if(k===undefined)return [];}route.reverse();const smooth=[];let origin=from;for(let i=0;i<route.length;){let last=i;while(last+1<route.length&&lineWalkable(origin,route[last+1]))last++;smooth.push(route[last]);origin=route[last];i=last+1;}return smooth;
};
// Keep the expanded landscape usable on devices that use the isometric fallback.
const isoTownTerrainBeforeWorldV06=terrain;
terrain=function(){const corners=[unproj(-100,-100),unproj(cw+100,-100),unproj(-100,ch+150),unproj(cw+100,ch+150)],minX=Math.max(WORLD_V06.minX,Math.floor(Math.min(...corners.map(p=>p.x)))-2),maxX=Math.min(WORLD_V06.maxX,Math.ceil(Math.max(...corners.map(p=>p.x)))+2),minY=Math.max(WORLD_V06.minY,Math.floor(Math.min(...corners.map(p=>p.y)))-2),maxY=Math.min(WORLD_V06.maxY,Math.ceil(Math.max(...corners.map(p=>p.y)))+2),trees=[];
 for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++){if(x>=0&&x<W&&y>=0&&y<H)continue;const p=proj(x+.5,y+.5);if(p.x< -100||p.x>cw+100||p.y< -100||p.y>ch+150)continue;const river=Math.abs(x-riverCenterV06(y))<2.3;diamond(x+.5,y+.5,river?(bridgeAtV06(y)?'#c6a87c':'#7abcc3'):hash(x,y)>.45?'#9bc67f':'#a4ce89');if(x%3===0&&y%3===0&&Math.abs(x-riverCenterV06(y))>4){const q=hash(x,y,43),cluster=(Math.sin(x*.12)+Math.cos(y*.14))*.5;if(q<.12+Math.max(0,cluster)*.16)trees.push({x,y,seed:hash(y,x,5)})}}
 isoTownTerrainBeforeWorldV06();trees.sort((a,b)=>a.x+a.y-b.x-b.y);for(const tree of trees)drawTree(tree,proj(tree.x,tree.y));};
