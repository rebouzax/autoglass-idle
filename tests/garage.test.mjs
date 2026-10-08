import test from 'node:test';
import assert from 'node:assert/strict';
import {GameModel} from '../src/models/GameModel.js';
import {GarageModel} from '../src/models/GarageModel.js';
import {actorRadius,touchesRectangle} from '../src/models/NavigationSystem.js';
import {vehiclesOverlap,vehicleBounds} from '../src/models/CityTrafficModel.js';

function simulate(seconds,configure=()=>{},check=()=>{}){
  const economy=new GameModel();configure(economy);const simulation=new GarageModel(economy);
  for(let i=0;i<seconds/.05;i++){simulation.tick(.05);check(simulation,economy);}
  return {economy,simulation};
}
test('one cashier and one technician; wait, installation, payment and departure in order',()=>{
  const initial=new GameModel();assert.equal(initial.state.workers,1);assert.equal(initial.state.cashiers,1);
  const phases=new Set();let firstPayment=0,sawAngry=false,sawComplaint=false;
  const {economy,simulation}=simulate(200,()=>{},(s,e)=>{
    const first=s.cars.find(car=>car.id===0);if(first){phases.add(first.driver.phase);assert.equal(first.driver.carrying,false);
      sawAngry ||= first.driver.angry;sawComplaint ||= first.driver.complaining;
      if(first.phase==='working')assert.equal(first.paid,false);
      if(first.paid){assert.equal(first.glass,1);assert.ok(phases.has('paying'));}
    }
    if(e.state.customers&&!firstPayment){firstPayment=s.time;assert.ok(s.events.some(event=>event.kind==='payment'));}
  });
  for(const phase of ['toLounge','waiting','toCashier','paying','returning'])assert.ok(phases.has(phase),phase);
  assert.ok(sawAngry&&sawComplaint);assert.ok(firstPayment>0);assert.equal(simulation.payments,economy.state.customers);
  simulation.tick(0);assert.equal(simulation.payments,economy.state.customers);
});
test('four bays and technicians keep solid NPC, furniture, car and street collisions',()=>{
  const {economy}=simulate(300,e=>{e.state.garageLevel=2;e.state.workers=4;e.state.bays=4;e.state.cashiers=2;},(s,e)=>{
    const people=s.people();for(let i=0;i<people.length;i++){
      const actor=people[i];assert.ok(Number.isFinite(actor.x)&&Number.isFinite(actor.z));
      for(let j=i+1;j<people.length;j++)assert.ok(Math.hypot(actor.x-people[j].x,actor.z-people[j].z)>=actorRadius(actor)+actorRadius(people[j])-.001,'NPC penetration');
      assert.ok(!s.navigation.obstacles.some(o=>touchesRectangle(actor.x,actor.z,actorRadius(actor),o)),'Furniture penetration');
    }
    const cars=[...s.cars,...s.city.cars];for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++)assert.equal(vehiclesOverlap(cars[i],cars[j]),false,'Vehicle penetration');
    for(const pedestrian of s.city.pedestrians)assert.ok(!s.city.cars.some(car=>touchesRectangle(pedestrian.x,pedestrian.z,.32,vehicleBounds(car))),'Street pedestrian penetration');
    assert.ok(s.cars.filter(car=>car.driver.phase==='paying').length<=e.state.cashiers,'Cashier concurrency');
  });
  assert.ok(economy.state.customers>=6,'Crowd must keep completing services');
});
test('purchased productivity reduces first service delay and customer anger',()=>{
  function firstSale(rank){let paidAt=0,angry=false;simulate(130,e=>{e.state.productivity=rank;},(s,e)=>{if(!paidAt){angry ||= s.cars.some(car=>car.driver.angry);if(e.state.customers)paidAt=s.time;}});return {paidAt,angry};}
  const basic=firstSale(0),trained=firstSale(4);assert.ok(trained.paidAt<basic.paidAt);assert.equal(basic.angry,true);assert.equal(trained.angry,false);
  const e=new GameModel();e.state.cash=85;assert.equal(e.buy('productivity'),true);assert.equal(e.state.cash,0);assert.equal(e.state.productivity,1);
});
