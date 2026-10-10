import {box,roundedBox,cylinder,tree} from './LowPolyAssets.js';
import {addBrandPanel} from './CompanyDecor.js';
import {corporateTowers} from '../models/Workforce.js';

// Open front façades reveal the working floors without obstructing ground navigation.
export function buildCorporateCampus(parent,s,l){
  const towers=corporateTowers(s,l);if(!towers.length)return;
  const width=l.officeRight-l.officeLeft;
  box(parent,'#c9ded9',[width,.18,26],[(l.officeLeft+l.officeRight)/2,.22,-45]);
  box(parent,'#eff2df',[width-3,.06,3.2],[(l.officeLeft+l.officeRight)/2,.35,-34.5]);
  for(const tower of towers){
    const height=(tower.floors+1)*4;
    box(parent,'#e6ebdf',[13,.2,14],[tower.x,.34,tower.z]);
    for(const side of [-1,1])box(parent,'#327d9c',[.45,height,.45],[tower.x+side*6.2,height/2+.3,tower.z-6.6]);
    for(let floor=0;floor<=tower.floors;floor++){
      const y=.3+floor*4;
      box(parent,'#dce8e6',[13,.2,14],[tower.x,y,tower.z]);
      // Rear and side windows leave the front of each floor open for the camera.
      box(parent,'#246991',[13,.35,.2],[tower.x,y+3.5,tower.z-6.8]);
      for(let j=-2;j<=2;j++)box(parent,'#9bcfd6',[2.05,2.35,.1],[tower.x+j*2.4,y+1.8,tower.z-6.7],true);
      box(parent,'#84b6c8',[.12,1.05,14],[tower.x+6.3,y+.75,tower.z]);for(const [depth,offset] of [[3,-5.5],[9,2.5]])box(parent,'#84b6c8',[.12,1.05,depth],[tower.x-6.3,y+.75,tower.z+offset]);
      box(parent,'#426f85',[13,.14,.16],[tower.x,y+1.05,tower.z+6.8]);
    }
    box(parent,'#2385ba',[13.5,.4,14.4],[tower.x,height+.3,tower.z]);
    roundedBox(parent,'#4d839c',[1.7,height,2.3],[tower.x-7.4,height/2+.3,tower.z-3]);
    for(let k=1;k<=tower.floors;k++)box(parent,'#99d8d9',[.1,2,1.6],[tower.x-8.3,k*4+1.5,tower.z-3],true);
    addBrandPanel(parent,7,tower.x,height-.8,tower.z+6.93);
    for(let k=0;k<3;k++)box(parent,'#547e8e',[2,.12,3],[tower.x-3+k*3,height+.6,tower.z-1.5]);
    for(const side of [-1,1]){cylinder(parent,'#ddd3b3',.55,.45,[tower.x+side*4.7,.65,-37],10);tree(parent,tower.x+side*4.7,-37,.8);}
  }
}
