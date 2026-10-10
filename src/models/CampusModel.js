import {availableProducts} from './Products.js';
import {activeStaff} from './Workforce.js';
import {academySeat,academyPractice,academyTeacher,factoryStation} from './ShopLayout.js';

const person=(point,id,phase)=>({...point,id,phase,moving:false,walk:0,seated:false,reached:true,working:false});

export class CampusModel {
  constructor(economy){this.economy=economy;this.students=[];this.operators=[];this.teacher=null;this.practiceOwner=null;this.outputOwner=null;this.signature='';}
  people(){return [...this.students,...this.operators,...(this.teacher?[this.teacher]:[])];}
  sync(sim){
    const s=this.economy.state;if(s.garageLevel<8)return;const signature=`${s.bays}:${s.garageLevel}`;
    if(this.signature&&this.signature!==signature){
      this.practiceOwner=null;
      for(const student of this.students){student.phase='returning';student.typing=false;student.working=false;sim.move(student,academySeat(s,student.index),1.3);}
      for(const operator of this.operators){if(operator.offDuty||operator.commuting)continue;operator.phase='toCut';operator.working=false;sim.move(operator,factoryStation(s,operator.index,0),1.3);}
      if(this.teacher)Object.assign(this.teacher,academyTeacher(s));
    }
    this.signature=signature;
    if(!this.teacher)this.teacher={...person(academyTeacher(s),'teacher','teaching'),teaching:true};
    const count=Math.min(6,2+s.trainingLevel);
    while(this.students.length<count){const index=this.students.length,p=academySeat(s,index);if(sim.people().some(a=>Math.hypot(a.x-p.x,a.z-p.z)<.95))break;this.students.push({...person(p,`student-${index}`,'learning'),index,seated:true,typing:true,timer:15+index*8});}
    while(this.operators.length<activeStaff(s,'factoryWorker')){const index=this.operators.length,p=factoryStation(s,index,0);if(sim.people().some(a=>Math.hypot(a.x-p.x,a.z-p.z)<.95))break;this.operators.push({...person(p,`factory-${index}`,'cutting'),index,working:true,timer:9,progress:0});}
  }
  tick(dt,sim){
    const s=this.economy.state;this.sync(sim);
    if(s.garageLevel<8)return;
    const speed=1+s.curriculum*.3;
    if(this.teacher&&!this.teacher.offDuty&&!this.teacher.commuting&&sim.clock.day){const teacher=this.teacher;teacher.working=teacher.reached&&Math.sin(sim.time*.8)>.1;teacher.calling=false;if(teacher.reached&&sim.time>(this.nextLecture||0)){this.nextLecture=sim.time+12;const p=academyTeacher(s);sim.move(teacher,{x:p.x,z:p.z+(Math.floor(sim.time/12)%2?4:0)},1.3);}}
    if(this.practiceOwner&&!['toPractice','practicing'].includes(this.practiceOwner.phase)&&Math.hypot(this.practiceOwner.x-academyPractice(s).x,this.practiceOwner.z-academyPractice(s).z)>1.3)this.practiceOwner=null;
    for(const student of this.students){
      if(student.offDuty||student.commuting||!sim.clock.day)continue;
      if(student.phase==='learning'){student.timer-=dt*speed;const next=this.students.filter(a=>a.phase==='learning'&&a.timer<=0).sort((a,b)=>a.timer-b.timer||a.index-b.index)[0];if(student.timer<=0&&!this.practiceOwner&&next===student){this.practiceOwner=student;student.phase='toPractice';student.product=availableProducts(s)[(student.index+s.certifications)%availableProducts(s).length];student.typing=false;sim.move(student,academyPractice(s),1.25);}}
      else if(student.phase==='toPractice'&&student.reached){student.phase='practicing';student.working=true;student.timer=10;student.facing=Math.PI;}
      else if(student.phase==='practicing'){student.timer-=dt*speed;if(student.timer<=0){student.assessment=true;student.working=false;student.phase='returning';sim.move(student,academySeat(s,student.index),1.3);this.economy.emit();}}
      else if(student.phase==='returning'&&student.reached){student.phase=student.assessment?'assessment':'learning';student.seated=true;student.typing=true;student.facing=Math.PI;student.timer=student.assessment?6:28+student.index*2;}
      else if(student.phase==='assessment'){student.timer-=dt*speed;if(student.timer<=0){student.assessment=false;student.phase='learning';student.timer=28+student.index*2;s.certifications++;sim.events.push({id:`class-${s.certifications}`,kind:'graduation',x:student.x,z:student.z,time:sim.time});this.economy.emit();}}
    }
    const productionSpeed=(1+s.manufacturing*.2+s.automation*.08)*this.economy.trainingBonus()*this.economy.teamEfficiency('factoryWorker');
    for(const operator of this.operators){if(operator.offDuty||operator.commuting)continue;
      const step=operator.phase==='toCut'?0:operator.phase==='toFurnace'?1:2;
      if(['toCut','toFurnace','toQuality'].includes(operator.phase)&&operator.reached){operator.phase=['cutting','tempering','quality'][step];operator.timer=[9,12,7/(1+s.qualityControl*.2)][step];operator.working=true;operator.facing=Math.PI/2;}
      if(['cutting','tempering','quality'].includes(operator.phase)){
        operator.timer-=dt*productionSpeed;
        operator.progress=operator.phase==='cutting'?.12:operator.phase==='tempering'?.5:.85;
        if(operator.timer>0)continue;
        if(operator.phase==='cutting'){operator.phase='toFurnace';operator.working=false;sim.move(operator,factoryStation(s,operator.index,1),1.2);}
        else if(operator.phase==='tempering'){operator.phase='toQuality';operator.working=false;sim.move(operator,factoryStation(s,operator.index,2),1.2);}
        else{
          const units=4+Math.min(4,s.qualityControl);
          if(this.economy.factoryTotal()+units>this.economy.factoryCapacity()){operator.timer=0;operator.working=false;continue;}
          const keys=availableProducts(s),product=operator.index===0?'glass':keys.filter(key=>key!=='glass')[(operator.batchIndex||0)%(keys.length-1)];operator.batchIndex=(operator.batchIndex||0)+1;s.qualityInspections+=units;this.economy.addFactoryStock(product,units);if(product==='glass')s.producedGlass+=units;operator.phase='toCut';operator.working=false;
          this.economy.recordMovement('produce',product,units,'Fabricação','Saída da fábrica','Linha '+(operator.index+1));
          sim.events.push({id:`production-${s.producedGlass}`,kind:'production',x:operator.x,z:operator.z,time:sim.time});sim.move(operator,factoryStation(s,operator.index,0),1.2);this.economy.emit();
        }
      }
    }
  }
}
