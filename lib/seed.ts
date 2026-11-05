import { randomUUID } from 'node:crypto';
import { FinanceState, today } from './model';
export function seed():FinanceState {
 const a=randomUUID(), b=randomUUID(); const current=today().slice(0,7);
 const movements:FinanceState['movements']=[];
 for(let offset=5;offset>=0;offset--){
  const d=new Date(current+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()-offset);const month=d.toISOString().slice(0,7);
  for(const [description,type,category,amount,day] of [ ['Stipendio','income','Stipendio',245000,'01'],['Affitto','expense','Casa',72000,'02'],['Supermercato','expense','Spesa',28500+offset*600,'03'],['Mobilità','expense','Trasporti',9500,'04'],['Tempo libero','expense','Tempo libero',18000-offset*400,'05']] as const)
   movements.push({id:randomUUID(),date:month+'-'+day,description,type,category,amount,accountId:a,destinationId:null});
 }
 movements.push({id:randomUUID(),date:current+'-05',description:'Accantonamento risparmi',type:'transfer',category:'Altro',amount:50000,accountId:a,destinationId:b});
 return {accounts:[{id:a,name:'Conto principale',bank:'Banca Demo',opening:425000},{id:b,name:'Conto risparmio',bank:'Risparmio Demo',opening:850000}],movements,
 investments:[{id:randomUUID(),name:'ETF globale • demo',kind:'ETF',invested:1000000,value:1125000,monthly:0},{id:randomUUID(),name:'PAC lungo termine • demo',kind:'PAC',invested:240000,value:254000,monthly:20000},{id:randomUUID(),name:'TFR maturato • demo',kind:'TFR',invested:680000,value:680000,monthly:15000}],
 goals:[{id:randomUUID(),name:'Matrimonio',target:2000000,saved:600000,deadline:'2028-06-01'},{id:randomUUID(),name:'Anticipo casa',target:5000000,saved:250000,deadline:'2030-12-01'}],
 subscriptions:[{id:randomUUID(),name:'Streaming • demo',amount:1299,frequency:'monthly',nextDate:current+'-28',accountId:a},{id:randomUUID(),name:'Cloud • demo',amount:2999,frequency:'yearly',nextDate:'2027-06-01',accountId:a}]};
}
