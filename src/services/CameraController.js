import * as THREE from 'three';
import {shopLayout} from '../models/ShopLayout.js';

export class CameraController {
  constructor(canvas, camera, pad) {
    this.canvas = canvas; this.camera = camera; this.pad = pad; this.enabled = false;
    this.target = new THREE.Vector3(0, 0, 1); this.offset = new THREE.Vector3(30, 30, 30);
    this.height = 24; this.pointers = new Map(); this.axis = { x: 0, y: 0 }; this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    canvas.addEventListener('contextmenu', event => event.preventDefault(), options);
    canvas.addEventListener('pointerdown', event => {
      if (!this.enabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); canvas.setPointerCapture(event.pointerId);
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, originX: event.clientX, originY: event.clientY, type: event.pointerType });
      canvas.classList.add('is-dragging');
      if (event.pointerType === 'touch' && this.pointers.size === 1) {
        pad.style.left = `${event.clientX}px`; pad.style.top = `${event.clientY}px`; pad.classList.add('is-active');
      }
      if (this.pointers.size === 2) { this.pinch = this.pinchDistance(); this.axis = { x: 0, y: 0 }; pad.classList.remove('is-active'); }
    }, options);
    canvas.addEventListener('pointermove', event => {
      const pointer = this.pointers.get(event.pointerId); if (!pointer) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      pointer.x = event.clientX; pointer.y = event.clientY;
      if (this.pointers.size > 1) { const distance = this.pinchDistance(); this.zoom(this.pinch / Math.max(1, distance)); this.pinch = distance; }
      else if (pointer.type === 'touch') {
        const x = (pointer.x - pointer.originX) / 46, y = (pointer.y - pointer.originY) / 46;
        const length = Math.max(1, Math.hypot(x, y)); this.axis = { x: x / length, y: y / length };
        pad.firstElementChild.style.transform = `translate(${this.axis.x * 28}px, ${this.axis.y * 28}px)`;
      } else this.pan(dx * this.height / canvas.clientHeight, dy * this.height / canvas.clientHeight);
    }, options);
    const release = event => {
      this.pointers.delete(event.pointerId); this.axis = { x: 0, y: 0 }; pad.classList.remove('is-active');
      pad.firstElementChild.style.transform = ''; canvas.classList.remove('is-dragging');
      // A finger remaining after a pinch starts from its current location.
      for (const pointer of this.pointers.values()) {
        pointer.originX = pointer.x; pointer.originY = pointer.y;
        if(this.pointers.size===1&&pointer.type==='touch') {
          pad.style.left=`${pointer.x}px`;pad.style.top=`${pointer.y}px`;pad.classList.add('is-active');
        }
      }
    };
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(name, release, options);
    canvas.addEventListener('wheel', event => { if (!this.enabled) return; event.preventDefault(); this.zoom(Math.exp(event.deltaY * .001)); }, { ...options, passive: false });
    window.addEventListener('blur', () => this.clear(), options);
  }
  pinchDistance() { const [a, b] = this.pointers.values(); return Math.hypot(a.x - b.x, a.y - b.y); }
  pan(dx, dy) {
    const diagonal = Math.SQRT1_2;
    this.target.x = THREE.MathUtils.clamp(this.target.x - diagonal * dx - diagonal * dy * 1.7, -65, 65);
    this.target.z = THREE.MathUtils.clamp(this.target.z + diagonal * dx - diagonal * dy * 1.7, -60, 55);
  }
  zoom(factor) { this.height = THREE.MathUtils.clamp(this.height * factor, 12, 92); this.resize(); }
  frameHeight(state){const l=shopLayout(state),depth=l.front-(l.stage===3?l.clBack:l.back),span=l.right-l.left+depth,aspect=this.canvas.clientWidth/Math.max(1,this.canvas.clientHeight);return Math.min(92,Math.max(span*.408+7,(span*.707+4)/aspect)*1.15);}
  center(state={bays:1,garageLevel:1}) {this.state=state;const l=shopLayout(state);this.target.set((l.left+l.right)/2,0,(l.front+(l.stage===3?l.clBack:l.back))/2);this.height=this.frameHeight(state);this.resize();}
  setEnabled(enabled) { this.enabled = enabled; if (!enabled) this.clear(); }
  clear() {
    const ids=[...this.pointers.keys()];this.pointers.clear();this.axis={x:0,y:0};this.pad.classList.remove('is-active');this.canvas.classList.remove('is-dragging');
    for(const id of ids)if(this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);
  }
  resize() {
    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    if(this.enabled&&this.state&&this.lastAspect!==undefined&&(aspect<1)!==(this.lastAspect<1))this.height=this.frameHeight(this.state);
    this.lastAspect=aspect;
    this.camera.left = -this.height * aspect / 2; this.camera.right = this.height * aspect / 2;
    this.camera.top = this.height / 2; this.camera.bottom = -this.height / 2; this.camera.updateProjectionMatrix();
  }
  update(dt) {
    if (this.enabled && (this.axis.x || this.axis.y)) this.pan(this.axis.x * dt * 14, this.axis.y * dt * 14);
    this.camera.position.copy(this.target).add(this.offset); this.camera.lookAt(this.target);
  }
  dispose() { this.clear(); this.abort.abort(); }
}
