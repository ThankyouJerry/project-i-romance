/* Original circle solver for this fan game; fixed 120 Hz simulation. */
(function(root){
'use strict';
const RADII=[18,23,29,36,44,53,63,74,86,100];
class World {
 constructor(random=Math.random){this.random=random;this.reset()}
 reset(){this.balls=[];this.score=0;this.time=0;this.cooldown=0;this.over=false;this.id=0;this.current=this.pick();this.next=this.pick();this.merges=[]}
 pick(){return Math.min(3,Math.floor(this.random()*4))}
 add(level,x,y){const b={id:++this.id,level,r:RADII[level],x,y,vx:0,vy:0,age:0,danger:0};this.balls.push(b);return b}
 drop(x){if(this.over||this.cooldown>0)return false;const r=RADII[this.current];this.add(this.current,Math.max(r+8,Math.min(392-r,x)),r+9);this.current=this.next;this.next=this.pick();this.cooldown=.5;return true}
 step(dt=1/120){
 if(this.over)return;dt=Math.min(dt,1/60);this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.merges=[];
 for(const b of this.balls){b.age+=dt;b.vy=Math.min(650,b.vy+900*dt);b.vx*=Math.exp(-.55*dt);b.x+=b.vx*dt;b.y+=b.vy*dt}
 // Remove both operands immediately. A body can never take part in two merges.
 for(let pass=0;pass<8;pass++){
  let changed=false;
  for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){
   const a=this.balls[i],b=this.balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),sum=a.r+b.r;
   if(d>sum)continue;
   if(a.level===b.level&&a.level<RADII.length-1){
    this.balls.splice(j,1);this.balls.splice(i,1);const c=this.add(a.level+1,(a.x+b.x)/2,(a.y+b.y)/2);c.vx=(a.vx+b.vx)/2;c.vy=(a.vy+b.vy)/2;c.age=Math.min(a.age,b.age);this.score+=2**c.level;this.merges.push({x:c.x,y:c.y,r:c.r});changed=true;i--;break;
   }
   const nx=d?dx/d:1,ny=d?dy/d:0,ia=1/(a.r*a.r),ib=1/(b.r*b.r),total=ia+ib,pen=sum-d;
   a.x-=nx*pen*ia/total;b.x+=nx*pen*ib/total;a.y-=ny*pen*ia/total;b.y+=ny*pen*ib/total;
   const vel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(vel<0){const impulse=-(1.08)*vel/total;a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib}
  }
  for(const b of this.balls){if(b.x<b.r+8){b.x=b.r+8;b.vx=Math.abs(b.vx)*.2}if(b.x>392-b.r){b.x=392-b.r;b.vx=-Math.abs(b.vx)*.2}if(b.y>592-b.r){b.y=592-b.r;b.vy=-Math.abs(b.vy)*.08;b.vx*=.98}}
  if(!changed&&pass>=5)break;
 }
 for(const b of this.balls){b.danger=b.age>1.5&&b.y-b.r<84?b.danger+dt:0;if(b.danger>=2)this.over=true}
 }
}
const api={World,RADII};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MergePhysics=api;
})(typeof window!=='undefined'?window:globalThis);
