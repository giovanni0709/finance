import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { balances, cents, monthly, stateSchema, date } from '../lib/model';
import { seed } from './fixtures/demo';
import { ConflictError, openDatabase } from '../lib/db';
import { csvDecode, csvEncode, headers, importRows, rows } from '../lib/exchange';

test('conversione monetaria esatta e rifiuto decimali eccessivi',()=>{
 assert.equal(cents('1234,56'),123456);assert.equal(cents('0.29'),29);assert.equal(cents('1.1'),110);
 for(const value of ['1.999','-1','NaN','1e3','1.000,50'])assert.throws(()=>cents(value));
});
test('date reali, anche negli anni bisestili',()=>{assert.ok(date.safeParse('2024-02-29').success);assert.equal(date.safeParse('2025-02-29').success,false);assert.equal(date.safeParse('2026-02-31').success,false);});
test('trasferimento conserva patrimonio e non altera entrate e uscite',()=>{
 const s=seed();s.movements=[];const before=Object.values(balances(s)).reduce((a,b)=>a+b,0);
 s.movements.push({id:randomUUID(),date:'2026-01-15',description:'Risparmio',type:'transfer',amount:15000,accountId:s.accounts[0].id,destinationId:s.accounts[1].id,category:'Altro'});
 const b=balances(s);assert.equal(b[s.accounts[0].id],s.accounts[0].opening-15000);assert.equal(b[s.accounts[1].id],s.accounts[1].opening+15000);assert.equal(Object.values(b).reduce((a,b)=>a+b,0),before);assert.deepEqual(monthly(s,'2026-01'),{income:0,expense:0,saving:0});
});
test('saldi e statistiche mensili distinguono entrate, uscite e date future',()=>{
 const s=seed();const a=s.accounts[0].id;s.movements=[{id:randomUUID(),date:'2026-01-03',description:'Entrata',type:'income',amount:10000,accountId:a,destinationId:null,category:'Altro'},{id:randomUUID(),date:'2026-01-04',description:'Spesa',type:'expense',amount:2500,accountId:a,destinationId:null,category:'Casa'}];
 assert.deepEqual(monthly(s,'2026-01'),{income:10000,expense:2500,saving:7500});assert.equal(balances(s,'2026-01-03')[a],s.accounts[0].opening+10000);
});
test('riferimenti invalidi, trasferimenti allo stesso conto e ID duplicati sono rifiutati',()=>{
 const s=seed();s.movements[0].accountId=randomUUID();assert.equal(stateSchema.safeParse(s).success,false);
 const t=seed();const m=t.movements.find(m=>m.type==='transfer')!;m.destinationId=m.accountId;assert.equal(stateSchema.safeParse(t).success,false);
 const d=seed();d.accounts.push(d.accounts[0]);assert.equal(stateSchema.safeParse(d).success,false);
});
test('SQLite persiste dopo riapertura e protegge da salvataggi concorrenti',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'finance-'));const file=path.join(dir,'test.sqlite');let db=openDatabase(file);
 try{const first=db.read();first.state=seed();first.state.accounts[0].name='Conto modificato';const updated=db.write(first.state,first.revision);assert.equal(updated.revision,1);assert.throws(()=>db.write(first.state,0),ConflictError);db.close();db=openDatabase(file);assert.equal(db.read().state.accounts[0].name,'Conto modificato');assert.equal(db.read().revision,1);
 const backup=JSON.parse(JSON.stringify({version:1,state:db.read().state}));const restored=stateSchema.parse(backup.state);assert.deepEqual(db.write(restored,1).state,first.state);
 }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
test('CSV roundtrip con separatori, virgolette, righe multiple e neutralizzazione formule',()=>{
 const s=seed();s.movements[0].description='=HYPERLINK("demo");\nprova';const encoded=csvEncode([headers,...rows(s)]);const decoded=csvDecode(encoded);const empty={...s,movements:[]};const imported=importRows(decoded,empty);assert.deepEqual(imported,s.movements);assert.ok(encoded.includes("'=HYPERLINK"));assert.throws(()=>csvDecode('"test'));
});
test('importazione rifiuta duplicati e conti inesistenti senza salvataggio parziale',()=>{
 const s=seed();assert.throws(()=>importRows([headers,...rows(s)],s),/già presente/);
 const input=rows(s);input[0][4]=randomUUID();assert.throws(()=>importRows([headers,...input],{...s,movements:[]}),/conti non validi/);
});

import { sameOrigin } from '../lib/security';
test('origine confrontata con Host: localhost, LAN e rifiuto siti esterni',()=>{
 for(const host of ['127.0.0.1:3000','localhost:3000','192.168.1.4:3000'])assert.equal(sameOrigin(new Request('http://localhost:3000/api/data',{headers:{host,origin:'http://'+host}})),true);
 assert.equal(sameOrigin(new Request('http://localhost:3000/api/data',{headers:{host:'127.0.0.1:3000',origin:'https://example.com'}})),false);
 assert.equal(sameOrigin(new Request('http://localhost:3000/api/data')),false);
});

import { seed as emptyArchive } from '../lib/seed';
test('nuovo archivio a zero e aggiornamento senza sovrascrivere dati esistenti',()=>{
 const db=openDatabase(':memory:');try{assert.deepEqual(db.read().state,emptyArchive());assert.equal(Object.values(balances(db.read().state)).reduce((a,b)=>a+b,0),0);const saved=db.write(seed(),0);assert.ok(saved.state.movements.length>0);const reset=db.write(emptyArchive(),saved.revision);assert.deepEqual(reset.state,emptyArchive());assert.equal(reset.revision,2);}finally{db.close();}
});
