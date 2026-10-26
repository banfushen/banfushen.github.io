// Original, stylized Canton Tower geometry. Run with Node 22; no modeling dependency.
// Reference: https://www.eguangzhou.gov.cn/globalgzpastandpresence/content/post_31123.html
// 24 columns, 46 rings, two ellipses rotated 135 degrees, and a long antenna.
// Local height 3.45 is displayed with the scene's existing 1.6 vertical scale.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const output = path.join(__dirname, '../source/game/models/information/guangzhou-tower.glb');
const TAU = Math.PI * 2;
const materials = [
  ['Structural columns', '#e0e5df'], ['Horizontal rings', '#c4ceca'],
  ['Diagonal bracing', '#bdc9c5'], ['Glazing', '#78969d', 0.32],
  ['Recessed floors', '#6f8487'], ['Ground apron', '#d2d0c5'],
  ['Antenna red', '#bd5047'], ['Antenna white', '#e5e8df']
];
const groups = materials.map(([name]) => ({ name, positions: [], normals: [] }));
const add = (a,b) => a.map((v,i)=>v+b[i]);
const sub = (a,b) => a.map((v,i)=>v-b[i]);
const mul = (v,s) => v.map(x=>x*s);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = v => mul(v,1/Math.hypot(...v));
function triangle(material,a,b,c) {
  const normal = cross(sub(b,a),sub(c,a));
  if (Math.hypot(...normal)<1e-12) return;
  groups[material].positions.push(...a,...b,...c);
  const n=unit(normal);
  groups[material].normals.push(...n,...n,...n);
}
function quad(material,a,b,c,d) { triangle(material,a,b,c); triangle(material,a,c,d); }
function rod(a,b,radius,material=0,sides=5,endRadius=radius,cap=false) {
  const axis=unit(sub(b,a));
  const u=unit(cross(axis,Math.abs(axis[2])<0.9?[0,0,1]:[1,0,0]));
  const v=cross(axis,u);
  const point=(center,r,angle)=>add(center,add(mul(u,Math.cos(angle)*r),mul(v,Math.sin(angle)*r)));
  for(let i=0;i<sides;i++) {
    const p=point(a,radius,i/sides*TAU),q=point(a,radius,(i+1)/sides*TAU);
    const r=point(b,endRadius,(i+1)/sides*TAU),s=point(b,endRadius,i/sides*TAU);
    quad(material,p,q,r,s);
    if(cap) { triangle(material,a,q,p); triangle(material,b,s,r); }
  }
}
function ring(points,radius,material=1) {
  for(let i=0;i<points.length;i++)rod(points[i],points[(i+1)%points.length],radius,material,4);
}
function skin(bottom,top,material,cap=false) {
  const center=points=>points.reduce((sum,p)=>add(sum,mul(p,1/points.length)),[0,0,0]);
  const bottomCenter=cap?center(bottom):null,topCenter=cap?center(top):null;
  for(let i=0;i<bottom.length;i++) {
    const j=(i+1)%bottom.length;
    quad(material,bottom[i],bottom[j],top[j],top[i]);
    if(cap) {
      triangle(material,bottomCenter,bottom[j],bottom[i]);
      triangle(material,topCenter,top[i],top[j]);
    }
  }
}
function ellipse(rx,ry,z,n=48) {
  return Array.from({length:n},(_,i)=>[rx*Math.cos(TAU*i/n),ry*Math.sin(TAU*i/n),z]);
}
function bead(center,radii,material) {
  const point=(i,j)=>add(center,[Math.sin(Math.PI*j/6)*Math.cos(TAU*i/8)*radii[0],Math.sin(Math.PI*j/6)*Math.sin(TAU*i/8)*radii[1],Math.cos(Math.PI*j/6)*radii[2]]);
  for(let j=0;j<6;j++)for(let i=0;i<8;i++)quad(material,point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1));
}
// Ruled hyperboloid: the columns connect corresponding points on rotated ellipses.
function shell(t,angle,inset=1) {
  const twist=3*Math.PI/4;
  const topX=0.231*Math.cos(angle),topY=0.208*Math.sin(angle);
  const x=topX*Math.cos(twist)-topY*Math.sin(twist);
  const y=topX*Math.sin(twist)+topY*Math.cos(twist);
  return [((1-t)*0.37*Math.cos(angle)+t*x)*inset,
    ((1-t)*0.278*Math.sin(angle)+t*y)*inset,
    0.035+t*(2.57+0.043*Math.cos(angle)-0.035)];
}
function shellRing(t,inset=1,n=48) { return Array.from({length:n},(_,i)=>shell(t,i/n*TAU,inset)); }

// A nearly flush apron and open columns meeting the ground, without a pedestal.
skin(ellipse(0.43,0.335,0.006),ellipse(0.43,0.335,0.028),5,true);
for(let i=0;i<24;i++)rod(shell(0,i/24*TAU),shell(1,i/24*TAU),0.0105,0,6,0.008);
for(let j=0;j<46;j++)ring(shellRing(j/45,1,24),j===0||j===45?0.005:0.0034);
for(let j=0;j<45;j++)for(let i=0;i<24;i++) {
  const direction=j%2===0?1:-1;
  rod(shell(j/45,i/24*TAU),shell((j+1)/45,(i+direction)/24*TAU),0.0025,2,4);
}

// Recessed core and observation floors stay inside the lattice silhouette.
skin(ellipse(0.071,0.058,0.04,24),ellipse(0.071,0.058,2.52,24),3);
skin(shellRing(0.015,0.78),shellRing(0.11,0.78),3);
skin(shellRing(0.81,0.83),shellRing(0.965,0.83),3);
for(const t of [0.025,0.07,0.105,0.82,0.86,0.90,0.94,0.97])ring(shellRing(t,0.83),0.0035,4);
skin(shellRing(0.965,0.82),shellRing(0.97,0.82),4,true);

// Sloping open crown and small observation pods, rather than a conical cap.
ring(shellRing(1,0.90),0.005,0);
for(let i=0;i<16;i++) {
  const angle=i/16*TAU, p=shell(1,angle,0.90);
  const cabin=add(p,[0,0,0.026]);
  rod(p,cabin,0.0025,0,4);
  bead(cabin,[0.018,0.018,0.023],0);
  bead(add(cabin,[0,0,0.001]),[0.0185,0.0185,0.014],3);
}

// The antenna occupies roughly one quarter of the total height.
const mastBottom=2.52,mastShoulder=3.06,mastTop=3.45;
function mastPoint(t,angle) {
  const radius=0.049*(1-t)+0.014*t;
  return [Math.cos(angle)*radius,Math.sin(angle)*radius,mastBottom+(mastShoulder-mastBottom)*t];
}
rod([0,0,mastBottom],[0,0,mastShoulder],0.018,7,8,0.012,true);
for(let i=0;i<8;i++)rod(mastPoint(0,i/8*TAU),mastPoint(1,i/8*TAU),0.0045,7,4,0.0025);
for(let j=0;j<=9;j++) {
  ring(Array.from({length:8},(_,i)=>mastPoint(j/9,i/8*TAU)),0.002,7);
  if(j<9)for(let i=0;i<8;i++)rod(mastPoint(j/9,i/8*TAU),mastPoint((j+1)/9,(i+1)/8*TAU),0.0016,7,4);
}
for(let i=0;i<8;i++) {
  const a=mastShoulder+(mastTop-mastShoulder)*i/8,b=mastShoulder+(mastTop-mastShoulder)*(i+1)/8;
  rod([0,0,a],[0,0,b],0.018*(1-i/11),i%2===0?6:7,8,0.018*(1-(i+1)/11),true);
}

// Encode grouped meshes directly as GLB; geometry is generated in Z-up coordinates.
const chunks=[],bufferViews=[],accessors=[],meshes=[],nodes=[];
let byteOffset=0;
function attribute(values,includeBounds) {
  assert.ok(values.every(Number.isFinite));
  const array=new Float32Array(values),bytes=Buffer.from(array.buffer);
  const bufferView=bufferViews.length;
  bufferViews.push({buffer:0,byteOffset,byteLength:bytes.length,target:34962});
  chunks.push(bytes); byteOffset+=bytes.length;
  const accessor={bufferView,componentType:5126,count:values.length/3,type:'VEC3'};
  if(includeBounds) {
    accessor.min=[Infinity,Infinity,Infinity]; accessor.max=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<array.length;i++) {
      const axis=i%3;
      accessor.min[axis]=Math.min(accessor.min[axis],array[i]);
      accessor.max[axis]=Math.max(accessor.max[axis],array[i]);
    }
  }
  accessors.push(accessor); return accessors.length-1;
}
for(let material=0;material<groups.length;material++) {
  const g=groups[material];
  assert.equal(g.positions.length,g.normals.length);
  const position=attribute(g.positions,true),normal=attribute(g.normals,false);
  meshes.push({name:g.name,primitives:[{attributes:{POSITION:position,NORMAL:normal},material}]});
  nodes.push({name:g.name.replaceAll(' ','_'),mesh:meshes.length-1});
}
const linear=value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4;
const json={asset:{version:'2.0',generator:'Canton Tower procedural model'},scene:0,
  scenes:[{name:'GuangzhouTower',nodes:nodes.map((_,i)=>i)}],nodes,meshes,
  materials:materials.map(([name,color,alpha=1])=>({name,doubleSided:true,
    pbrMetallicRoughness:{baseColorFactor:[...color.slice(1).match(/../g).map(c=>linear(parseInt(c,16)/255)),alpha],metallicFactor:0,roughnessFactor:0.75},
    ...(alpha<1?{alphaMode:'BLEND'}:{}),extensions:{KHR_materials_unlit:{}}})),
  extensionsUsed:['KHR_materials_unlit'],buffers:[{byteLength:byteOffset}],bufferViews,accessors,
  extras:{reference:'https://www.eguangzhou.gov.cn/globalgzpastandpresence/content/post_31123.html',columns:24,rings:46,totalHeight:3.45,bodyHeight:2.57,style:'Simplified daytime landmark; not a structural CAD model'}};
const encoded=Buffer.from(JSON.stringify(json)),jsonBytes=Buffer.alloc(Math.ceil(encoded.length/4)*4,0x20);
encoded.copy(jsonBytes);
const binary=Buffer.concat(chunks),header=Buffer.alloc(12),jsonHeader=Buffer.alloc(8),binHeader=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67,0); header.writeUInt32LE(2,4); header.writeUInt32LE(28+jsonBytes.length+binary.length,8);
jsonHeader.writeUInt32LE(jsonBytes.length,0); jsonHeader.writeUInt32LE(0x4e4f534a,4);
binHeader.writeUInt32LE(binary.length,0); binHeader.writeUInt32LE(0x004e4942,4);
fs.writeFileSync(output,Buffer.concat([header,jsonHeader,jsonBytes,binHeader,binary]));
console.log(`Built Guangzhou Tower: ${nodes.length} material groups, ${groups.reduce((n,g)=>n+g.positions.length/9,0)} triangles, ${fs.statSync(output).size} bytes.`);
