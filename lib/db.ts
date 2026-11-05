import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { FinanceState, stateSchema } from './model';
import { seed } from './seed';
export class ConflictError extends Error {}
export function openDatabase(filename=process.env.FINANCE_DB || path.join(process.cwd(),'data','finance.sqlite')) {
 if(filename!==':memory:') mkdirSync(path.dirname(filename),{recursive:true});
 const db=new DatabaseSync(filename);
 db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS finance (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT NOT NULL)');
 db.prepare('INSERT OR IGNORE INTO finance VALUES (1,0,?)').run(JSON.stringify(seed()));
 return {
  read(){ const row=db.prepare('SELECT revision,payload FROM finance WHERE id=1').get() as {revision:number,payload:string};return {revision:row.revision,state:stateSchema.parse(JSON.parse(row.payload))}; },
  write(state:FinanceState,revision:number){
   const parsed=stateSchema.parse(state);
   const result=db.prepare('UPDATE finance SET payload=?, revision=revision+1 WHERE id=1 AND revision=?').run(JSON.stringify(parsed),revision);
   if(result.changes!==1) throw new ConflictError('Dati aggiornati da un’altra finestra. Ricarica prima di riprovare.');
   return {state:parsed,revision:revision+1};
  }, close(){db.close();}
 };
}
let database:ReturnType<typeof openDatabase>|undefined;
export function getDatabase(){ return database ??=openDatabase(); }
