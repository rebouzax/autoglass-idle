export const PRODUCTS={
  glass:{name:'Vidros',singular:'Vidro',icon:'stock',color:'#85dbe9',price:45,duration:24},
  carMirror:{name:'Retrovisores',singular:'Retrovisor de carro',icon:'mirror',color:'#569bcc',price:64,duration:18},
  motoMirror:{name:'Retrovisores de moto',singular:'Retrovisor de moto',icon:'motorcycle',color:'#8fc66b',price:42,duration:13},
  wipers:{name:'Palhetas',singular:'Kit de palhetas',icon:'wrench',color:'#68bdaf',price:92,duration:12,minStage:7},
  lights:{name:'Faróis LED',singular:'Farol LED',icon:'shield',color:'#f8d975',price:185,duration:21,minStage:7},
  sensors:{name:'Sensores ADAS',singular:'Sensor ADAS',icon:'scanner',color:'#ac9bdf',price:260,duration:26,minStage:7},
  parts:{name:'Peças',singular:'Peça automotiva',icon:'tools',color:'#e5aa57',price:78,duration:20}
};
export const productKeys=Object.keys(PRODUCTS);
export const availableProducts=state=>productKeys.filter(key=>state.garageLevel>=(PRODUCTS[key].minStage||(key==='glass'?1:2)));
