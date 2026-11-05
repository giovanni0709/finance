import { z } from 'zod';

const id = z.string().uuid();
const text = z.string().trim().min(1).max(120);
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, 'Data non valida');
const money = z.number().int().safe().min(0).max(100_000_000_000);
export const accountSchema = z.object({ id, name:text, bank:text, opening:money });
export const movementSchema = z.object({ id, date, description:text, type:z.enum(['income','expense','transfer']), accountId:id, destinationId:id.nullable(), category:text, amount:money.positive() });
export const investmentSchema = z.object({ id, name:text, kind:z.enum(['ETF','Azione','PAC','TFR']), invested:money, value:money, monthly:money });
export const goalSchema = z.object({ id, name:text, target:money.positive(), saved:money, deadline:date });
export const subscriptionSchema = z.object({ id, name:text, amount:money.positive(), frequency:z.enum(['monthly','yearly']), nextDate:date, accountId:id });
export const stateSchema = z.object({
  accounts:z.array(accountSchema).max(100), movements:z.array(movementSchema).max(50000),
  investments:z.array(investmentSchema).max(1000), goals:z.array(goalSchema).max(100), subscriptions:z.array(subscriptionSchema).max(1000)
}).superRefine((s,ctx) => {
  const accounts = new Set(s.accounts.map(a=>a.id));
  for(const key of ['accounts','movements','investments','goals','subscriptions'] as const) {
    if(new Set(s[key].map(r=>r.id)).size!==s[key].length) ctx.addIssue({code:'custom',message:`Identificativi duplicati: ${key}`});
  }
  for(const m of s.movements) {
    if(!accounts.has(m.accountId)) ctx.addIssue({code:'custom',message:'Conto inesistente'});
    if(m.type==='transfer' && (!m.destinationId || !accounts.has(m.destinationId) || m.destinationId===m.accountId)) ctx.addIssue({code:'custom',message:'Trasferimento non valido'});
    if(m.type!=='transfer' && m.destinationId!==null) ctx.addIssue({code:'custom',message:'Destinazione ammessa solo per trasferimenti'});
  }
  for(const sub of s.subscriptions) if(!accounts.has(sub.accountId)) ctx.addIssue({code:'custom',message:'Conto abbonamento inesistente'});
});
export type FinanceState = z.infer<typeof stateSchema>;
export type Movement = z.infer<typeof movementSchema>;
export const categories = ['Stipendio','Casa','Spesa','Trasporti','Ristoranti','Salute','Tempo libero','Abbonamenti','Altro'];
export const euro = (cents:number) => new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',useGrouping:'always'}).format(cents/100);
export function cents(value: string): number {
  const normalized=value.trim().replace(',','.');
  if(!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error('Inserisci un importo positivo con massimo due decimali');
  const [whole, decimal='']=normalized.split('.');
  const result=Number(whole)*100+Number(decimal.padEnd(2,'0'));
  if(!Number.isSafeInteger(result) || result>100_000_000_000) throw new Error('Importo troppo grande');
  return result;
}
export function balances(s:FinanceState, until='9999-12-31') {
  const values = Object.fromEntries(s.accounts.map(a=>[a.id,a.opening]));
  for(const m of s.movements.filter(m=>m.date<=until)) {
    values[m.accountId] += m.type==='income' ? m.amount : -m.amount;
    if(m.type==='transfer' && m.destinationId) values[m.destinationId]+=m.amount;
  }
  return values;
}
export function monthly(s:FinanceState, month:string) {
  const rows=s.movements.filter(m=>m.date.startsWith(month));
  const income=rows.filter(m=>m.type==='income').reduce((a,m)=>a+m.amount,0);
  const expense=rows.filter(m=>m.type==='expense').reduce((a,m)=>a+m.amount,0);
  return {income,expense,saving:income-expense};
}
export function today() { return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome'}).format(new Date()); }
