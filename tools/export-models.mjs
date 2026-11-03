import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const api=runInNewContext((await readFile(resolve(root,'src/characters3d.js'),'utf8'))+';({get:getCharacterModelV06,info:characterModelInfoV06})');
await mkdir(resolve(root,'releases/models'),{recursive:true});
const metadata=[];
for(let i=0;i<10;i++){
 const mesh=api.get(i,false),info=api.info(i,false),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let j=0;j<mesh.length;j+=8)for(let k=0;k<3;k++){min[k]=Math.min(min[k],mesh[j+k]);max[k]=Math.max(max[k],mesh[j+k]);}
 const bytes=Buffer.from(mesh.buffer,mesh.byteOffset,mesh.byteLength);
 const gltf={asset:{version:'2.0',generator:'Fathermon Township v0.6 · SayverOcean Game Studio'},extensionsUsed:['KHR_materials_unlit'],scene:0,scenes:[{nodes:[0]}],nodes:[{name:info.name,mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0,COLOR_0:1},material:0}]}],materials:[{name:'Original design palette',doubleSided:true,extensions:{KHR_materials_unlit:{}}}],buffers:[{byteLength:bytes.length}],bufferViews:[{buffer:0,byteOffset:0,byteLength:bytes.length,byteStride:32,target:34962}],accessors:[{bufferView:0,byteOffset:0,componentType:5126,count:mesh.length/8,type:'VEC3',min,max},{bufferView:0,byteOffset:12,componentType:5126,count:mesh.length/8,type:'VEC3'}]};
 let json=Buffer.from(JSON.stringify(gltf));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat([bytes,Buffer.alloc((4-bytes.length%4)%4)]),out=Buffer.alloc(12+8+json.length+8+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);let offset=20+json.length;out.writeUInt32LE(bin.length,offset);out.writeUInt32LE(0x004e4942,offset+4);bin.copy(out,offset+8);await writeFile(resolve(root,'releases/models',info.name+'.glb'),out);metadata.push(info);
}
await writeFile(resolve(root,'releases/models/README.txt'),'Original Fathermon drawings by SayverOcean Game Studio, adapted into rounded 3D meshes. These GLB files export the high-detail static meshes; the playable HTML adds procedural walk, idle, wing/tail and interaction animation in its shader. The original portraits remain unchanged.\n');
await writeFile(resolve(root,'docs/model-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
console.log('Exported ten high-detail GLB character meshes.');
