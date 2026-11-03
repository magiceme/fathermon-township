/* Rounded, hand-shaped mesh adaptations of the supplied ten original drawings.
 * Portraits retain the untouched drawings. These meshes add volume to those
 * silhouettes, palettes and face markings; they do not define new evolution lore.
 * Vertex format matches Geometry: XYZ, RGB, UV. Model front is +Z, ground is Y=0.
 */
const characterMeshCacheV06=new Map();
const characterMeshMetaV06=new Map();
class CharacterMeshV06 {
 constructor(low=false){this.a=[];this.low=low;this.sides=low?10:20;this.rows=low?7:14;}
 color(c){if(Array.isArray(c))return c;return [1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);}
 vertex(p,n,c){const col=this.color(c),nl=Math.hypot(...n)||1,nx=n[0]/nl,ny=n[1]/nl,nz=n[2]/nl;
  const diffuse=Math.max(0,nx*-.36+ny*.78+nz*.51),shine=Math.pow(Math.max(0,nx*-.23+ny*.47+nz*.85),22)*.075;
  const light=.64+diffuse*.40;this.a.push(...p,...col.map(v=>Math.min(1,v*light+shine*(.25+v*.75))),0,0);}
 tri(a,b,c,n,color){this.vertex(a,n,color);this.vertex(b,n,color);this.vertex(c,n,color);}
 quad(a,b,c,d,n,color){this.tri(a,b,c,n,color);this.tri(a,c,d,n,color);}
 sphere(x,y,z,rx,ry,rz,color){
  const detail=Math.max(rx,ry,rz)<.16?.65:1,ns=Math.max(8,Math.round(this.sides*detail)),nr=Math.max(5,Math.round(this.rows*detail));
  const v=(j,i)=>{const t=Math.PI*j/nr,a=2*Math.PI*i/ns,s=Math.sin(t),p=[x+rx*s*Math.cos(a),y+ry*Math.cos(t),z+rz*s*Math.sin(a)],n=[s*Math.cos(a)/rx,Math.cos(t)/ry,s*Math.sin(a)/rz];return [p,n]};
  for(let j=0;j<nr;j++)for(let i=0;i<ns;i++){const a=v(j,i),b=v(j+1,i),c=v(j+1,i+1),d=v(j,i+1);for(const t of [[a,b,c],[a,c,d]])for(const [p,n]of t)this.vertex(p,n,color);}
 }
 tube(points,radius,color,sides=this.low?7:12){
  if(points.length<2)return;const radii=Array.isArray(radius)?radius:points.map(()=>radius);const ring=[];
  for(let i=0;i<points.length;i++){
   const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],axis=next.map((v,k)=>v-prev[k]),len=Math.hypot(...axis)||1;for(let k=0;k<3;k++)axis[k]/=len;
   const ref=Math.abs(axis[1])>.9?[1,0,0]:[0,1,0],u=[axis[1]*ref[2]-axis[2]*ref[1],axis[2]*ref[0]-axis[0]*ref[2],axis[0]*ref[1]-axis[1]*ref[0]],ul=Math.hypot(...u)||1;for(let k=0;k<3;k++)u[k]/=ul;
   const v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]];
   const r=[];for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,n=u.map((a,k)=>a*Math.cos(j/sides*Math.PI*2)+v[k]*Math.sin(j/sides*Math.PI*2));r.push([points[i].map((a,k)=>a+n[k]*radii[i]),n]);}ring.push(r);
  }
  for(let i=0;i<ring.length-1;i++)for(let j=0;j<sides;j++){const a=ring[i][j],b=ring[i+1][j],c=ring[i+1][j+1],d=ring[i][j+1];for(const t of [[a,b,c],[a,c,d]])for(const [p,n]of t)this.vertex(p,n,color);}
  for(const i of [0,points.length-1]){const n=points[i].map((p,k)=>p-points[i===0?1:points.length-2][k]);for(let j=0;j<sides;j++)this.tri(points[i],ring[i][j][0],ring[i][j+1][0],n,color);}
 }
 stroke(points,radius,color){this.tube(points,radius,color);for(const p of [points[0],points.at(-1)])this.sphere(...p,radius,radius,radius,color);}
 ring(x,y,z,rx,ry,t,color){const points=[];for(let i=0;i<=this.sides*2;i++){const a=i/(this.sides*2)*Math.PI*2;points.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry,z]);}this.tube(points,t,color,this.low?6:10);}
 // Beveled extrusion, including concave webbed hands, fins and flame silhouettes.
 shape(points,z,depth,color,bevel=.06){
  let poly=points.map(p=>[p[0],p[1]]);if(poly.length<3)return;
  let area=0;for(let i=0;i<poly.length;i++){let p=poly[i],q=poly[(i+1)%poly.length];area+=p[0]*q[1]-q[0]*p[1];}if(area<0)poly.reverse();
  const cx=poly.reduce((s,p)=>s+p[0],0)/poly.length,cy=poly.reduce((s,p)=>s+p[1],0)/poly.length;
  const minR=Math.max(.05,Math.min(...poly.map(p=>Math.hypot(p[0]-cx,p[1]-cy)))),inset=Math.min(.25,bevel/minR),front=poly.map(p=>[cx+(p[0]-cx)*(1-inset),cy+(p[1]-cy)*(1-inset),z+depth/2]),back=poly.map(p=>[p[0],p[1],z-depth/2]);
  const edge=poly.map(p=>[p[0],p[1],z+depth/2-Math.min(bevel,depth*.45)]);
  for(let i=0;i<poly.length;i++){
   const j=(i+1)%poly.length,p=poly[i],q=poly[j],dx=q[0]-p[0],dy=q[1]-p[1],n=[dy,-dx,0],length=Math.hypot(dx,dy)||1;
   this.quad(back[i],back[j],edge[j],edge[i],n,color);
   const steps=this.low?1:4,bevelZ=Math.min(bevel,depth*.45);
   const rim=(index,t)=>{const a=t*Math.PI*.5,amount=1-Math.cos(a),p=poly[index];return [p[0]+(front[index][0]-p[0])*amount,p[1]+(front[index][1]-p[1])*amount,z+depth/2-bevelZ+Math.sin(a)*bevelZ]};
   for(let b=0;b<steps;b++){
    const t=b/steps,u=(b+1)/steps,pa=rim(i,t),pb=rim(j,t),pc=rim(j,u),pd=rim(i,u),normal=t=>[dy*Math.cos(t*Math.PI*.5),-dx*Math.cos(t*Math.PI*.5),length*Math.sin(t*Math.PI*.5)],nt=normal(t),nu=normal(u);
    for(const [point,norm]of [[pa,nt],[pb,nt],[pc,nu],[pa,nt],[pc,nu],[pd,nu]])this.vertex(point,norm,color);
   }
  }
  const indices=poly.map((_,i)=>i),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const inTri=(p,a,b,c)=>cross(a,b,p)>=-1e-8&&cross(b,c,p)>=-1e-8&&cross(c,a,p)>=-1e-8;
  for(let guard=0;indices.length>2&&guard<poly.length*poly.length;guard++){
   let clipped=false;for(let k=0;k<indices.length;k++){const ia=indices[(k+indices.length-1)%indices.length],ib=indices[k],ic=indices[(k+1)%indices.length],a=poly[ia],b=poly[ib],c=poly[ic];if(cross(a,b,c)<=1e-8)continue;if(indices.some(i=>i!==ia&&i!==ib&&i!==ic&&inTri(poly[i],a,b,c)))continue;
    this.tri(front[ia],front[ib],front[ic],[0,0,1],color);this.tri(back[ic],back[ib],back[ia],[0,0,-1],color);indices.splice(k,1);clipped=true;break;
   }if(!clipped)break;
  }
 }
 drop(x,y,z,w,h,depth,color,lean=0){
  // A gently swept flame/ear with a round root and sharp high tip.
  const points=[];for(let i=0;i<=12;i++){const t=i/12,a=Math.PI+t*Math.PI;points.push([x+Math.cos(a)*w*.5,y+Math.sin(a)*h*.18]);}
  points.push([x+w*.43+lean*.18,y+h*.32],[x+w*.27+lean*.45,y+h*.66],[x+lean,y+h],[x-w*.19+lean*.2,y+h*.52],[x-w*.43,y+h*.2]);this.shape(points,z,depth,color,Math.min(w*.15,.045));
 }
 finish(targetHeight=1.3){
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(let i=0;i<this.a.length;i+=8){minX=Math.min(minX,this.a[i]);maxX=Math.max(maxX,this.a[i]);minY=Math.min(minY,this.a[i+1]);maxY=Math.max(maxY,this.a[i+1]);minZ=Math.min(minZ,this.a[i+2]);maxZ=Math.max(maxZ,this.a[i+2]);}
  const scale=targetHeight/(maxY-minY),cx=(minX+maxX)*.5,cz=(minZ+maxZ)*.5;
  for(let i=0;i<this.a.length;i+=8){this.a[i]=(this.a[i]-cx)*scale;this.a[i+1]=(this.a[i+1]-minY)*scale;this.a[i+2]=(this.a[i+2]-cz)*scale;}
  return {vertices:new Float32Array(this.a),bounds:{width:(maxX-minX)*scale,height:targetHeight,depth:(maxZ-minZ)*scale},triangles:this.a.length/24};
 }
}

function modelRockroolV06(m){
 const brown='#79613c',orange='#ff970d',ink='#161512';
 // A rising chain of six pebble segments and swept orange flames.
 for(let i=5;i>=0;i--){const x=-.24+i*.235,y=.40+i*.073,r=.22-i*.014;m.sphere(x,y,0,r,r*.99,.22-i*.013,brown);m.drop(x,y+r*.56,.01,r*1.5,.37+i*.014,.23,orange,.07);m.sphere(x-.06,y-r*.75,-.02,.055,.09,.07,ink);}
 m.sphere(-.62,.49,.01,.48,.34,.30,brown);
 m.shape([[-1.10,.47],[-.85,.61],[-.65,.56],[-.75,.35],[-.92,.35]],.10,.23,brown,.035);
 // Broad orange brow/crest follows the upper head, just as on the drawing.
 m.shape([[-.98,.64],[-.83,.80],[-.59,.84],[-.39,.78],[-.28,.69],[-.47,.70],[-.68,.73],[-.83,.67]],.04,.25,orange,.035);
 m.sphere(-.76,.56,.282,.043,.085,.022,ink);
 m.stroke([[-1.05,.44,.218],[-.94,.41,.254],[-.86,.43,.278]],.014,ink);
}
function modelCapaV06(m){
 const yellow='#ffdf12',pink='#f57cbd',ink='#171419';
 // Four soft feet carry a broad, rounded pink shell and yellow face cap.
 m.sphere(.16,.58,0,.82,.48,.38,pink);
 m.sphere(-.43,.57,.01,.45,.45,.36,yellow);
 for(const [x,z]of [[-.42,.24],[.56,.24],[-.38,-.24],[.55,-.24]]){
  m.sphere(x,.15,z,.26,.13,.20,ink);m.sphere(x,.17,z+.045,.245,.12,.19,yellow);
 }
 m.sphere(-.75,.53,.10,.15,.20,.22,ink);
 m.sphere(-.49,.82,.29,.11,.13,.045,ink);
 m.sphere(-.52,.86,.334,.032,.052,.014,'#ffffff');m.sphere(-.45,.78,.335,.025,.035,.014,'#ffffff');
 // Irregular shell seam and flowing black markings follow the shell surface.
 m.stroke([[-.20,.98,.16],[-.24,.90,.25],[-.17,.80,.32],[-.22,.68,.36],[-.20,.53,.37],[-.16,.42,.35],[-.23,.29,.25]],.022,ink);
 for(let j=0;j<4;j++){const points=[];for(let k=0;k<=14;k++){const t=k/14,x=-.025+j*.18+Math.sin(t*Math.PI*3+j*.4)*.027,y=.86-t*.52;const d=(x-.16)**2/.82**2+(y-.58)**2/.48**2;points.push([x,y,.38*Math.sqrt(Math.max(.05,1-d))+.012]);}m.stroke(points,.016,ink);}
}
function modelSeneraV06(m){
 const brown='#81532d',dark='#21160f',green='#00f557',gold='#f8e94e',pink='#fb92d5';
 // Pointed winged ears, dark inset borders and bright green inner tips.
 for(const s of [-1,1]){
  const ear=[[s*.20,1.32],[s*.27,1.88],[s*.53,2.04],[s*.76,1.83],[s*.67,1.36]];
  m.shape(ear,-.02,.22,dark,.055);
  m.shape([[s*.28,1.39],[s*.34,1.82],[s*.52,1.92],[s*.65,1.77],[s*.58,1.42]],.12,.12,brown,.04);
  m.shape([[s*.40,1.48],[s*.41,1.74],[s*.52,1.81],[s*.56,1.67],[s*.51,1.46]],.198,.045,green,.025);
 }
 m.sphere(0,.90,0,.58,.64,.38,brown);
 // Long swept side wings with angular green tips and original claw-like silhouette.
 for(const s of [-1,1]){
  m.shape([[s*.43,.65],[s*.77,.60],[s*1.03,.85],[s*1.20,1.29],[s*1.12,1.53],[s*.98,1.29],[s*.81,1.13],[s*.49,1.00]],-.015,.19,dark,.06);
  m.shape([[s*.48,.69],[s*.77,.67],[s*.96,.91],[s*1.09,1.28],[s*1.06,1.35],[s*.92,1.15],[s*.78,1.08],[s*.47,.97]],.085,.13,brown,.045);
  m.shape([[s*.93,1.10],[s*1.03,1.36],[s*1.09,1.45],[s*1.11,1.28],[s*1.06,1.06],[s*1.02,1.15],[s*.97,1.10]],.161,.055,green,.025);
  m.sphere(s*.24,.16,.04,.135,.18,.14,dark);m.sphere(s*.24,.18,.085,.108,.16,.12,brown);
  for(const dx of [-.032,.032])m.stroke([[s*.24+dx,.10,.191],[s*.24+dx,.18,.208]],.010,dark);
 }
 // Golden brow bands framing the central green forehead gem.
 for(const s of [-1,1])for(let i=0;i<4;i++){
  const x=s*(.11+i*.056),y=1.38-i*.022;
  m.stroke([[x-s*.015,y-.05,.29],[x+s*.008,y+.04,.275]],.015,gold);
 }
 m.sphere(0,1.34,.301,.115,.16,.06,dark);m.sphere(0,1.35,.355,.086,.133,.025,green);
 for(const s of [-1,1]){
  m.sphere(s*.24,1.08,.331,.105,.155,.055,dark);m.sphere(s*.24,1.08,.379,.077,.125,.024,green);
  m.sphere(s*.244,1.15,.399,.042,.042,.012,gold);m.sphere(s*.244,1.005,.399,.040,.031,.012,gold);
 }
 m.sphere(0,.71,.374,.18,.16,.04,dark);m.sphere(-.055,.71,.407,.062,.102,.018,gold);m.sphere(.064,.71,.410,.064,.103,.018,pink);m.stroke([[.01,.607,.432],[.041,.811,.431]],.018,dark);
}

// Sculpted adaptations of the supplied drawings. Front faces point along +Z.
function modelProtextureV06(m){
 const ink='#171410',orange='#ff8622',brown='#8c6242';
 // Swept, thick fins grow out behind the segmented eyelid rim.
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6+.06,at=(r,t)=>[Math.cos(t)*r,1.04+Math.sin(t)*r];
  const pts=[at(.67,a-.17),at(.89,a-.12),at(1.06,a+.18),at(.90,a+.10),at(.71,a+.20)];
  m.shape(pts,-.055,.18,ink,.025);
  const center=pts.reduce((p,v)=>[p[0]+v[0]/pts.length,p[1]+v[1]/pts.length],[0,0]);
  m.shape(pts.map(p=>[center[0]+(p[0]-center[0])*.82,center[1]+(p[1]-center[1])*.84]),.012,.16,orange,.025);
 }
 m.sphere(0,1.04,0,.72,.77,.34,brown);
 m.sphere(0,1.04,.14,.635,.68,.34,orange);
 // Each pebble-shaped segment has depth, rather than a painted border.
 for(let i=0;i<22;i++){
  const a=i/22*Math.PI*2,x=Math.cos(a)*.684,y=1.04+Math.sin(a)*.744;
  m.sphere(x,y,.145,.110,.119,.135,ink);
  m.sphere(x,y,.197,.085,.095,.115,brown);
 }
 // The heavy brown upper lid covers almost half of the orange eye.
 m.shape([[-.56,1.40],[-.45,1.58],[-.23,1.66],[.05,1.67],[.31,1.57],[.51,1.40],[.58,1.18],[.44,1.06],[.18,1.04],[-.10,1.10],[-.36,1.23]],.402,.085,ink,.035);
 m.shape([[-.52,1.41],[-.42,1.55],[-.22,1.62],[.05,1.63],[.28,1.54],[.47,1.39],[.53,1.20],[.42,1.10],[.18,1.08],[-.08,1.14],[-.33,1.26]],.449,.07,brown,.035);
 m.sphere(-.22,.756,.407,.205,.235,.072,'#090807');
}
function modelHappierV06(m){
 const ink='#151711',yellow='#fff000',red='#ff120a';
 // Six asymmetric sun rays retain their distinctive hand-drawn arrangement.
 const rays=[
  [[-.39,1.53],[-.91,1.78],[-.66,1.30]],
  [[-.57,1.24],[-1.01,1.22],[-.63,1.08]],
  [[-.61,.94],[-1.03,.73],[-.61,.77]],
  [[.57,1.15],[.98,.96],[.63,.99]],
  [[.59,.80],[1.01,.61],[.56,.65]],
  [[.26,.49],[.74,.02],[.49,.55]]
 ];
 for(const pts of rays){m.shape(pts,-.035,.20,ink,.035);const c=pts.reduce((p,v)=>[p[0]+v[0]/3,p[1]+v[1]/3],[0,0]);m.shape(pts.map(p=>[c[0]+(p[0]-c[0])*.84,c[1]+(p[1]-c[1])*.83]),.025,.18,yellow,.03);}
 // Smaller second face sits behind the main face, as in the original drawing.
 m.sphere(.27,1.52,-.125,.50,.50,.30,yellow);
 m.ring(.27,1.52,.025,.495,.495,.024,ink);
 m.sphere(.085,1.755,.144,.068,.068,.035,ink);
 m.sphere(.55,1.58,.155,.068,.078,.035,ink);
 m.shape([[-.06,1.975],[.12,2.025],[.35,1.991],[.56,1.887],[.685,1.758],[.58,1.68],[.48,1.775],[.41,1.756],[.33,1.827],[.26,1.808],[.17,1.873],[.08,1.846],[.018,1.91]],.153,.067,ink,.025);
 m.shape([[-.015,1.964],[.125,1.985],[.337,1.952],[.53,1.86],[.625,1.766],[.58,1.725],[.478,1.815],[.414,1.799],[.326,1.869],[.26,1.850],[.169,1.915],[.083,1.886],[.04,1.947]],.19,.057,red,.023);
 // A softly rounded sun face, with raised face details and a thick smile rim.
 m.sphere(0,1.0,.11,.64,.64,.34,yellow);
 m.ring(0,1.0,.22,.637,.637,.027,ink);
 m.sphere(-.215,1.26,.422,.145,.190,.064,ink);
 m.sphere(-.215,1.26,.467,.108,.150,.037,red);
 m.sphere(.193,1.23,.431,.120,.164,.058,ink);
 m.sphere(.193,1.23,.472,.085,.127,.035,red);
 m.shape([[-.345,1.015],[-.27,.875],[-.12,.823],[.08,.823],[.255,.883],[.337,1.014],[.34,.821],[.235,.687],[.06,.632],[-.115,.654],[-.267,.754]],.437,.07,ink,.026);
 m.shape([[-.287,.926],[-.235,.855],[-.11,.792],[.087,.792],[.25,.862],[.292,.937],[.287,.827],[.208,.728],[.057,.681],[-.094,.697],[-.224,.778]],.480,.06,red,.023);
}
function modelMirospoV06(m){
 const ink='#141316',purple='#a000b9',gold='#ffd000';
 // The trailing purple body is a beveled, solid cloth-like form with five tips.
 const body=[[-.31,1.12],[.31,1.12],[.32,.75],[.39,.36],[.49,.075],[.29,.235],[.20,.015],[.06,.205],[-.055,.015],[-.19,.244],[-.43,.08],[-.35,.49]];
 m.shape(body,-.045,.40,ink,.055);
 const center=[0,.62];m.shape(body.map(p=>[center[0]+(p[0]-center[0])*.92,center[1]+(p[1]-center[1])*.94]),.015,.40,purple,.055);
 m.sphere(0,.75,-.025,.29,.42,.23,purple);
 // A full curved eyeball is inset into a broad gold rim, not a flat eye card.
 m.sphere(0,1.47,.005,.625,.625,.32,gold);
 m.ring(0,1.47,.105,.623,.623,.022,ink);
 m.sphere(0,1.47,.235,.547,.547,.205,ink);
 m.sphere(0,1.47,.274,.519,.519,.185,'#fffefb');
 m.sphere(0,1.47,.459,.182,.182,.046,ink);
 m.sphere(0,1.47,.491,.159,.159,.028,purple);
 m.sphere(0,1.47,.519,.077,.077,.023,'#08070a');
 m.sphere(.007,1.493,.542,.023,.031,.012,'#ffffff');
}

// Four rounded sculptures adapted from the supplied original character sheets.
function modelMachappyV06(m){
 const green='#08cd35',purple='#4316ef',edge='#13241d';
 // Torso, separate boots, hanging hands and purple shoulder plates.
 m.sphere(0,.82,0,.32,.50,.22,green);
 for(const s of [-1,1]){
  m.tube([[s*.16,.48,0],[s*.16,.12,.015]],[.115,.10],green,12);
  m.sphere(s*.17,.075,.07,.17,.075,.19,green);
  m.sphere(s*.37,1.03,-.045,.15,.20,.13,purple);
  m.tube([[s*.29,1.08,.025],[s*.37,.82,.04],[s*.43,.54,.08]],[.105,.083,.09],green,12);
  for(let f=0;f<3;f++)m.sphere(s*(.37+f*.055),.49-(f===1?.025:0),.105,.033,.075,.043,green);
  // The original repeated U marks are raised dark seams on chest and boots.
  const mark=(x,y,z,w)=>m.stroke([[x-w,y+.022,z],[x-w*.8,y-.018,z+.008],[x,y-.04,z+.013],[x+w*.8,y-.018,z+.008],[x+w,y+.022,z]],.012,edge);
  mark(s*.14,.88,.226,.055);mark(s*.14,.68,.228,.064);mark(s*.16,.25,.125,.046);
 }
 m.sphere(0,1.90,-.025,.25,.24,.22,purple);
 // The side horns sweep up and out rather than becoming generic ears.
 for(const s of [-1,1]){
  const p=[[s*.30,1.83],[s*.48,1.94],[s*.70,2.17],[s*.65,1.91],[s*.51,1.68],[s*.34,1.66]];
  m.shape(p,-.005,.23,edge,.028);
  m.shape([[s*.34,1.83],[s*.49,1.94],[s*.66,2.12],[s*.60,1.90],[s*.48,1.73],[s*.36,1.71]],.035,.22,purple,.028);
 }
 m.sphere(0,1.54,.015,.46,.47,.31,green);
 // Squinting chevrons, each following the head's curved face.
 for(const s of [-1,1]){
  m.stroke([[s*.35,1.75,.207],[s*.13,1.57,.321],[s*.36,1.38,.216]],.051,edge);
  m.stroke([[s*.35,1.75,.227],[s*.14,1.57,.344],[s*.36,1.38,.238]],.031,purple);
  m.stroke([[s*.40,1.65,.170],[s*.29,1.57,.269],[s*.42,1.50,.168]],.026,edge);
 }
 m.shape([[-.265,1.20],[-.22,1.31],[-.14,1.40],[0,1.435],[.14,1.40],[.22,1.31],[.265,1.20],[.15,1.145],[0,1.125],[-.15,1.145]],.265,.055,edge,.014);
 m.shape([[-.22,1.205],[-.17,1.31],[-.10,1.365],[0,1.39],[.10,1.365],[.17,1.31],[.22,1.205],[.13,1.17],[0,1.155],[-.13,1.17]],.299,.04,purple,.012);
}

function hearicBodyV06(m,robot){
 const purple='#c500f0',edge='#211b28',white='#fffef8',grey='#969894';
 // Organic rounded torso and broad swooping arms retain the drawing's asymmetry.
 m.sphere(.005,.85,0,.27,.36,.20,purple);
 m.tube([[0,1.18,0],[.015,1.02,.015],[.015,.91,0]],[.18,.13,.21],purple,14);
 m.tube([[-.15,.95,0],[-.43,.98,0],[-.63,.85,.015],[-.72,.60,.025],[-.70,.40,.025]],[.14,.16,.15,.14,.12],purple,14);
 m.tube([[.16,.97,-.01],[.43,1.06,0],[.66,1.03,.025],[.87,.94,.035],[.99,.80,.035]],[.16,.15,.16,.17,.12],purple,14);
 // Thick mitten insets have three original soft finger contours.
 m.shape([[-.75,.40],[-.82,.54],[-.80,.75],[-.73,.90],[-.61,.98],[-.52,.95],[-.52,.89],[-.60,.85],[-.50,.86],[-.48,.80],[-.60,.74],[-.61,.61],[-.60,.46],[-.65,.42],[-.69,.53],[-.70,.41]],.14,.07,edge,.025);
 m.shape([[-.73,.44],[-.78,.55],[-.76,.75],[-.70,.88],[-.60,.94],[-.56,.93],[-.57,.89],[-.65,.85],[-.55,.82],[-.63,.75],[-.65,.60],[-.63,.47],[-.66,.46],[-.71,.58],[-.71,.45]],.188,.048,white,.018);
 m.shape([[.53,1.085],[.69,1.10],[.87,1.04],[.98,.94],[.98,.87],[.90,.87],[.97,.81],[.93,.76],[.81,.78],[.71,.83],[.60,.86],[.54,.91],[.60,.95],[.70,.95],[.58,1.00]],.14,.07,edge,.025);
 m.shape([[.57,1.055],[.70,1.065],[.86,1.005],[.94,.93],[.88,.91],[.91,.87],[.86,.84],[.72,.88],[.62,.90],[.60,.92],[.70,.935],[.74,.96],[.62,1.01]],.188,.048,white,.018);
 // Grey heart, its dark rim and asymmetric rounded lobes are actual relief.
 m.shape([[-.20,.91],[-.21,1.01],[-.16,1.07],[-.09,1.075],[-.015,1.015],[.05,1.11],[.13,1.12],[.20,1.07],[.205,.98],[.15,.84],[.035,.67],[-.11,.80]],.205,.065,edge,.025);
 m.shape([[-.16,.93],[-.17,1.00],[-.13,1.035],[-.08,1.035],[0,.975],[.08,1.075],[.13,1.075],[.16,1.04],[.165,.98],[.115,.86],[.03,.725],[-.08,.825]],.25,.05,grey,.025);
 // Soft scalloped head volume. The skull is inset into a purple halo.
 m.sphere(0,1.64,-.035,.62,.49,.26,purple);
 for(let j=0;j<13;j++){const a=j/13*Math.PI*2;const r=.09+(j%3)*.012;m.sphere(Math.cos(a)*.53,1.64+Math.sin(a)*.39,-.035,r,r*.92,.21,purple);}
 m.sphere(-.015,1.635,.195,.455,.368,.14,edge);
 m.sphere(-.015,1.65,.245,.409,.324,.12,white);
 for(const s of [-1,1]){
  m.sphere(s*.185-.012,1.735,.350,.139,.149,.048,edge);
  m.sphere(s*.185-.012,1.735,.387,.094,.105,.018,white);
 }
 // Slanted silver pupils echo the vertical/diagonal eye marks of the drawings.
 m.stroke([[-.212,1.83,.410],[-.226,1.65,.410]],.034,edge);
 m.stroke([[-.192,1.825,.426],[-.207,1.66,.426]],.020,grey);
 m.stroke([[.135,1.82,.412],[.220,1.675,.413]],.034,edge);
 m.stroke([[.156,1.824,.430],[.238,1.69,.430]],.020,grey);
 // The skull grin is a bold zig-zag smile, not a generic face.
 m.stroke([[-.35,1.48,.327],[-.26,1.46,.363],[-.17,1.525,.379],[-.075,1.47,.387],[.025,1.455,.385],[.12,1.525,.378],[.205,1.465,.362],[.325,1.48,.329]],.028,edge);
 if(robot){
  // Separate hips, the white crenellated waist band, triangle ankle details.
  m.sphere(.02,.44,0,.32,.15,.19,purple);
  m.tube([[-.14,.43,0],[-.16,.17,.015]],[.13,.10],purple,12);
  m.tube([[.17,.43,0],[.24,.16,.015]],[.13,.10],purple,12);
  m.sphere(-.18,.085,.06,.18,.09,.18,purple);m.sphere(.26,.085,.06,.17,.09,.18,purple);
  m.shape([[-.31,.58],[-.19,.54],[.03,.55],[.23,.61],[.34,.49],[.30,.42],[.20,.42],[.18,.48],[.12,.46],[.13,.38],[-.02,.365],[-.03,.45],[-.12,.45],[-.12,.37],[-.29,.385]],.17,.06,edge,.014);
  m.shape([[-.27,.545],[-.18,.505],[.04,.51],[.22,.57],[.29,.485],[.265,.46],[.21,.46],[.19,.52],[.08,.495],[.09,.42],[.01,.41],[0,.49],[-.16,.485],[-.16,.41],[-.25,.42]],.211,.045,white,.012);
  for(const tri of [ [[-.27,.08],[-.12,.29],[-.045,.075]], [[.18,.085],[.25,.30],[.35,.13]], [[-.76,.23],[-.83,.36],[-.68,.35]], [[.96,.72],[1.0,.91],[1.12,.75]] ]){m.shape(tri,.15,.065,edge,.015);const cx=tri.reduce((a,p)=>a+p[0],0)/3,cy=tri.reduce((a,p)=>a+p[1],0)/3;m.shape(tri.map(([x,y])=>[cx+(x-cx)*.58,cy+(y-cy)*.58]),.19,.045,grey,.008);}
 }else{
  // The ghost floats as one pointed lower wisp: Hearic has no invented legs.
  m.shape([[-.22,.77],[-.17,.54],[-.06,.48],[.05,.52],[.10,.45],[.20,.58],[.23,.80]],-.015,.27,purple,.035);
 }
}
function modelHearicV06(m){hearicBodyV06(m,false);}
function modelRobomeV06(m){hearicBodyV06(m,true);}

function modelBaraV06(m){
 const yellow='#ffe86a',pink='#f88acb',purple='#bf09e8',edge='#2e291f',white='#fffef7';
 // The two long pigtails sit behind the head and have different tip silhouettes.
 m.sphere(-.34,1.94,-.09,.23,.21,.22,yellow);m.sphere(.36,1.96,-.10,.23,.21,.22,yellow);
 m.tube([[-.29,1.93,-.09],[-.51,1.90,-.10],[-.62,1.62,-.09],[-.64,1.28,-.06],[-.65,1.05,-.035]],[.22,.24,.22,.17,.075],yellow,16);
 m.tube([[.29,1.96,-.10],[.50,1.98,-.10],[.64,1.72,-.08],[.68,1.45,-.055],[.70,1.24,-.035]],[.21,.23,.22,.18,.12],yellow,16);
 for(let i=0;i<3;i++)m.sphere(.55+i*.125,1.24+(i===2?.065:0),.015,.072,.12,.09,yellow);
 m.sphere(0,.76,0,.285,.36,.21,yellow);
 for(const s of [-1,1]){
  m.tube([[s*.14,.52,0],[s*.16,.17,.015],[s*.17,.075,.055]],[.087,.075,.078],yellow,12);
  m.sphere(s*.18,.063,.08,.14,.065,.16,yellow);
  m.tube([[s*.22,.90,0],[s*.35,1.06,.02],[s*.43,1.20,.055]],[.068,.066,.06],yellow,12);
  // Pink cuffs and mitten palms raised in the same cheerful drawing pose.
  m.sphere(s*.405,1.13,.055,.10,.075,.09,edge);
  m.sphere(s*.405,1.142,.073,.081,.054,.080,pink);
  m.sphere(s*.465,1.235,.08,.112,.115,.09,pink);
  m.sphere(s*.52,1.21,.085,.057,.072,.073,pink);
 }
 // A pink wrap on one boot is a small but distinct original design detail.
 m.stroke([[.096,.275,.08],[.155,.245,.092],[.225,.23,.07]],.026,edge);
 m.stroke([[.097,.276,.095],[.155,.247,.11],[.224,.232,.09]],.017,pink);
 m.sphere(0,1.57,.035,.43,.475,.28,yellow);
 for(const s of [-1,1]){m.sphere(s*.175,1.61,.286,.099,.198,.036,edge);m.sphere(s*.175,1.61,.317,.077,.169,.020,white);}
 // Left eye: the original pink spiral with its pale yellow upper lid.
 m.sphere(-.175,1.615,.34,.061,.103,.015,pink);
 const spiral=[];for(let i=0;i<=32;i++){let a=i/32*Math.PI*4.6,r=.004+.042*i/32;spiral.push([-.175+Math.cos(a)*r,1.615+Math.sin(a)*r*1.55,.362]);}m.stroke(spiral,.0065,edge);
 m.sphere(-.175,1.758,.334,.075,.035,.018,yellow);
 m.stroke([[-.244,1.737,.341],[-.205,1.725,.352],[-.161,1.723,.356],[-.11,1.736,.341]],.009,edge);
 // Right eye: purple lids framing a dark vertical pupil and white gleam.
 m.sphere(.175,1.61,.341,.048,.106,.015,edge);
 m.sphere(.175,1.752,.342,.073,.047,.019,purple);
 m.sphere(.175,1.474,.342,.073,.050,.019,purple);
 m.sphere(.154,1.631,.36,.017,.043,.008,white);
 const smile=[];for(let i=0;i<=16;i++){const a=Math.PI+.12+i/16*(Math.PI-.24);smile.push([Math.cos(a)*.105,1.322+Math.sin(a)*.061,.295]);}m.stroke(smile,.012,edge);
}

const characterBuildersV06=[modelMachappyV06,modelRockroolV06,modelProtextureV06,modelHearicV06,modelRobomeV06,modelHappierV06,modelCapaV06,modelSeneraV06,modelBaraV06,modelMirospoV06];
const characterNamesV06=['Machappy','Rockrool','Protexture','Hearic','Robome','Happier','Capa','Senera','Bara','Mirospo'];
function getCharacterModelV06(index,lowGraphics=false){
 if(!Number.isInteger(index)||index<0||index>=characterBuildersV06.length)throw new RangeError('Unknown Fathermon model');
 const key=index+':'+(lowGraphics?'low':'high');
 if(!characterMeshCacheV06.has(key)){const m=new CharacterMeshV06(!!lowGraphics);characterBuildersV06[index](m);const finished=m.finish(1.3);characterMeshCacheV06.set(key,finished.vertices);characterMeshMetaV06.set(key,{name:characterNamesV06[index],...finished.bounds,triangles:finished.triangles,lod:lowGraphics?'low':'high'});}
 return characterMeshCacheV06.get(key);
}
function characterModelInfoV06(index,lowGraphics=false){getCharacterModelV06(index,lowGraphics);return {...characterMeshMetaV06.get(index+':'+(lowGraphics?'low':'high'))};}
