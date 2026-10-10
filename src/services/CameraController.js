import * as THREE from 'three';
import {shopLayout} from '../models/ShopLayout.js';

export class CameraController {
  constructor(canvas, camera, pad) {
    this.canvas=canvas;this.camera=camera;this.pad=pad;this.enabled=false;
    this.target=new THREE.Vector3(0,0,1);this.offset=new THREE.Vector3(30,30,30);
    this.height=24;this.pointers=new Map();this.abort=new AbortController();
    pad.hidden=true;pad.setAttribute('aria-hidden','true');
    const options={signal:this.abort.signal};
    canvas.addEventListener('contextmenu',event=>event.preventDefault(),options);
    canvas.addEventListener('pointerdown',event=>{
      if(!this.enabled||(event.pointerType==='mouse'&&event.button!==0))return;
      event.preventDefault();canvas.setPointerCapture(event.pointerId);
      this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      canvas.classList.add('is-dragging');
      if(this.pointers.size===2)this.pinch=this.pinchDistance();
    },options);
    canvas.addEventListener('pointermove',event=>{
      const pointer=this.pointers.get(event.pointerId);if(!pointer||!this.enabled)return;
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      pointer.x=event.clientX;pointer.y=event.clientY;
      if(this.pointers.size>1){const distance=this.pinchDistance();this.zoom(this.pinch/Math.max(1,distance));this.pinch=distance;}
      else this.pan(dx*this.height/Math.max(1,canvas.clientHeight),dy*this.height/Math.max(1,canvas.clientHeight));
    },options);
    const release=event=>{this.pointers.delete(event.pointerId);if(this.pointers.size<2)this.pinch=null;if(!this.pointers.size)canvas.classList.remove('is-dragging');};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,release,options);
    canvas.addEventListener('wheel',event=>{if(!this.enabled)return;event.preventDefault();this.zoom(Math.exp(event.deltaY*.001));},{...options,passive:false});
    window.addEventListener('blur',()=>this.clear(),options);
  }
  pinchDistance(){const [a,b]=this.pointers.values();return Math.hypot(a.x-b.x,a.y-b.y);}
  bounds(){
    if(!this.state)return {left:-65,right:65,back:-60,front:55};
    const l=shopLayout(this.state);
    return {left:this.state.garageLevel>=15?-165:this.state.garageLevel>=6?-Math.max(115,this.state.garageLevel*12):(l.plotLeft??l.left)-18,right:(l.plotRight??l.itRight??l.officeRight??l.right)+(this.state.garageLevel>=6?80:18),back:(l.plotBack??l.clBack??l.back)-(this.state.garageLevel>=15?100:80),front:this.state.garageLevel>=16?250:this.state.garageLevel>=15?170:this.state.garageLevel>=6?95:l.front+55};
  }
  pan(dx,dy){
    const b=this.bounds(),d=Math.SQRT1_2;
    this.target.x=THREE.MathUtils.clamp(this.target.x-d*dx-d*dy*1.7,b.left,b.right);
    this.target.z=THREE.MathUtils.clamp(this.target.z+d*dx-d*dy*1.7,b.back,b.front);
  }
  zoom(factor){this.height=THREE.MathUtils.clamp(this.height*factor,10,this.maxHeight());this.resize();}
  maxHeight(){return Math.max(140,this.state?this.frameHeight(this.state)*1.6:140);}
  frameHeight(state){
    const l=shopLayout(state),left=l.plotLeft??l.left,right=l.plotRight??(l.stage>=4?l.officeRight:l.right),back=l.plotBack??(l.stage>=2?l.clBack:l.back),depth=l.front-back,span=right-left+depth,aspect=this.canvas.clientWidth/Math.max(1,this.canvas.clientHeight);
    return Math.max(24,Math.max(span*.408+7,(span*.707+4)/aspect)*1.08);
  }
  center(state={bays:1,garageLevel:1}){
    this.state=state;const l=shopLayout(state),left=l.plotLeft??l.left,right=l.plotRight??(l.stage>=4?l.officeRight:l.right),back=l.plotBack??(l.stage>=2?l.clBack:l.back);
    this.target.set((left+right)/2,0,(l.front+back)/2);this.height=this.frameHeight(state);this.resize();
  }
  setEnabled(enabled){this.enabled=enabled;if(!enabled)this.clear();}
  clear(){
    const ids=[...this.pointers.keys()];this.pointers.clear();this.pinch=null;this.canvas.classList.remove('is-dragging');
    for(const id of ids)if(this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);
  }
  resize(){
    const aspect=this.canvas.clientWidth/Math.max(1,this.canvas.clientHeight);
    if(this.enabled&&this.state&&this.lastAspect!==undefined&&(aspect<1)!==(this.lastAspect<1))this.height=this.frameHeight(this.state);
    this.lastAspect=aspect;this.camera.left=-this.height*aspect/2;this.camera.right=this.height*aspect/2;this.camera.top=this.height/2;this.camera.bottom=-this.height/2;this.camera.updateProjectionMatrix();
  }
  update(){this.offset.setScalar(Math.max(30,this.height*.75));const far=Math.max(420,this.height*4);if(this.camera.far!==far){this.camera.far=far;this.camera.updateProjectionMatrix();}this.camera.position.copy(this.target).add(this.offset);this.camera.lookAt(this.target);}
  dispose(){this.clear();this.abort.abort();}
}
