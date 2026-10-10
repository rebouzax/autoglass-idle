export const PRODUCTS={
  glass:{name:'Vidros',singular:'Vidro',icon:'stock',color:'#85dbe9',price:45,duration:24},
  carMirror:{name:'Retrovisores',singular:'Retrovisor de carro',icon:'mirror',color:'#569bcc',price:64,duration:18},
  motoMirror:{name:'Retrovisores de moto',singular:'Retrovisor de moto',icon:'motorcycle',color:'#8fc66b',price:42,duration:13},
  parts:{name:'Peças',singular:'Peça automotiva',icon:'tools',color:'#e5aa57',price:78,duration:20}
};
export const productKeys=Object.keys(PRODUCTS);
export const availableProducts=state=>state.garageLevel>=2?[...productKeys]:['glass'];
