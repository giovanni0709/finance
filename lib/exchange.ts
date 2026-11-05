import { randomUUID } from 'node:crypto';
import { FinanceState, Movement, cents, movementSchema } from './model';
export const headers=['ID','Data','Descrizione','Tipo','Conto ID','Destinazione ID','Categoria','Importo EUR'];
export function rows(s:FinanceState):string[][] {return s.movements.map(m=>[m.id,m.date,m.description,m.type,m.accountId,m.destinationId||'',m.category,(m.amount/100).toFixed(2)]);}
export function safeCell(v:string){return /^[=+\-@\t\r]/.test(v) ? "'"+v:v;}
export function csvEncode(data:string[][]){return '\uFEFF'+data.map(row=>row.map(v=>'"'+safeCell(v).replaceAll('"','""')+'"').join(';')).join('\r\n');}
export function csvDecode(input:string):string[][] {
 const s=input.replace(/^\uFEFF/,'');const out:string[][]=[];let row:string[]=[];let cell='';let quoted=false;
 for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted && s[i+1]==='"'){cell+='"';i++;}else if(quoted || cell==='') quoted=!quoted;else throw new Error('CSV non valido');}
 else if(!quoted && (c===';' || c==='\n' || c==='\r')){row.push(cell);cell='';if(c!==';'){if(c==='\r'&&s[i+1]==='\n')i++;out.push(row);row=[];}}else cell+=c;}
 if(quoted) throw new Error('Virgolette CSV non chiuse'); if(cell || row.length){row.push(cell);out.push(row);}return out.filter(r=>r.some(Boolean));
}
export function importRows(data:string[][],s:FinanceState):Movement[]{
 if(!data.length || data[0].join('|')!==headers.join('|'))throw new Error('Intestazioni non valide: usa il modello esportato dall’app.');
 const existing=new Set(s.movements.map(m=>m.id));const accountIds=new Set(s.accounts.map(a=>a.id));
 if(data.length>50001)throw new Error('Massimo 50.000 movimenti');
 return data.slice(1).map((row,i)=>{
  if(row.length!==8)throw new Error(`Riga ${i+2}: servono 8 colonne`);
  const [id,date,description,type,accountId,destinationId,category,amount]=row.map(v=>v.replace(/^'(?=[=+\-@\t\r])/,'').trim());
  const m=movementSchema.parse({id:id||randomUUID(),date,description,type,accountId,destinationId:destinationId||null,category,amount:cents(amount)});
  if(existing.has(m.id))throw new Error(`Riga ${i+2}: ID già presente. Nessun movimento importato.`);existing.add(m.id);
  if(!accountIds.has(m.accountId) || (m.type==='transfer' && (!m.destinationId || !accountIds.has(m.destinationId) || m.destinationId===m.accountId)) || (m.type!=='transfer' && m.destinationId!==null))throw new Error(`Riga ${i+2}: conti non validi`);
  return m;
 });
}
