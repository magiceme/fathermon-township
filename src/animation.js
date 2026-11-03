// Procedural mesh animation: feet step, wings/fins flutter, tails undulate,
// floating species drift, and all species breathe without altering the artwork.
const characterDeformGLSLV06=`
uniform bool uCharacter;
uniform vec3 uModelOrigin;
uniform float uModelYaw,uModelKind,uModelMotion,uModelPhase,uModelAction,uModelScale,uModelTravel;
vec3 animateFathermon(vec3 v){
 float p=uModelPhase,m=uModelMotion,kind=uModelKind;
 float step=sin(p*8.),other=sin(p*8.+3.14159);
 float breath=sin(p*2.)*.009;
 v.x*=1.+breath;v.y*=1.-breath*.45;
 if(kind<.5||abs(kind-4.)<.5||abs(kind-8.)<.5){
   if(v.y<.32){float leg=v.x<0.?step:other;v.z+=leg*.105*m;v.y+=max(0.,leg)*.07*m;}
   if(abs(v.x)>.21&&v.y>.35&&v.y<.86)v.z+=(v.x<0.?other:step)*.075*m;
   v.y+=abs(step)*.024*m;
 }else if(abs(kind-1.)<.5){v.y+=sin(p*8.+v.x*6.)*.033*m;v.z+=sin(p*5.+v.x*4.)*.025*m;}
 else if(abs(kind-6.)<.5){if(v.y<.28)v.y+=max(0.,v.x<0.?step:other)*.065*m;v.x+=sin(p*7.)*.018*m;}
 else if(abs(kind-7.)<.5){v.y+=.07+sin(p*3.)*.035;if(abs(v.x)>.34)v.z+=sin(p*6.)*.13*(abs(v.x)-.3);}
 else if(abs(kind-9.)<.5){v.y+=.08+sin(p*2.)*.04;if(v.y<.58)v.x+=sin(p*3.+v.y*5.)*(.58-v.y)*.1;}
 else{v.y+=.07+sin(p*2.7)*.035;if(abs(v.x)>.32)v.z+=sin(p*4.+v.x*4.)*.025;}
 // Actions have a brief anticipation and follow-through, independent of walking.
 v.y*=1.-uModelAction*.07;v.z+=v.y*uModelAction*.10;
 if(abs(v.x)>.24&&v.y>.45&&v.y<.9)v.y+=uModelAction*.09;
 if(uModelTravel>0.5&&uModelTravel<1.5){float y=v.y-.60,z=v.z;v.y=.45+y*.40-z*.75;v.z=y*.75+z*.40;v.x+=sin(p*5.+v.y)*.015;}
 if(uModelTravel>1.5){v.z+=sin(p*2.)*.015;v.y+=sin(p*3.)*.025;}
 v*=uModelScale;
 float c=cos(uModelYaw),s=sin(uModelYaw);
 return vec3(v.x*c+v.z*s,v.y,-v.x*s+v.z*c)+uModelOrigin;
}`;
const characterMotionV06=new Map();
let characterGpuCacheV06=new Map();
function getCharacterMotionV06(ch){const key=ch.player?'player':ch.index,now=performance.now();let motion=characterMotionV06.get(key);if(!motion){motion={x:ch.x,y:ch.y,at:now,phase:ch.index*.37,amount:0,yaw:Math.atan2(scene3d.eye[0]-ch.x,scene3d.eye[2]-ch.y),actionUntil:0};characterMotionV06.set(key,motion)}const dt=clamp((now-motion.at)/1000,.001,.1),dx=ch.x-motion.x,dy=ch.y-motion.y,speed=Math.hypot(dx,dy)/dt;motion.phase+=dt*(paused||activeModal ? .45 : 1);motion.amount=ease(motion.amount,clamp(speed/2.5,0,1),1-Math.exp(-dt*12));if(speed>.04){const target=Math.atan2(dx,dy),delta=Math.atan2(Math.sin(target-motion.yaw),Math.cos(target-motion.yaw));motion.yaw+=delta*(1-Math.exp(-dt*12));}motion.x=ch.x;motion.y=ch.y;motion.at=now;return motion;}
function markCharacterActionV06(){const m=characterMotionV06.get('player');if(m)m.actionUntil=performance.now()+650;}
const gatherWithActionV06=gather;
gather=function(o){const before=state?.harvested.length;gatherWithActionV06(o);if(state?.harvested.length>before)markCharacterActionV06();};
const interactWithActionV06=interact;
interact=function(){markCharacterActionV06();return interactWithActionV06();};
