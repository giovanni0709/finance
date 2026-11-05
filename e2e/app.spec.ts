import { test, expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import { randomUUID } from 'node:crypto';
const origin='http://127.0.0.1:3100';

test('desktop: crea conto, entrata, trasferimento, modifica e persistenza',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Una visione chiara.'})).toBeVisible();
 await expect(page.locator('.recharts-surface').first()).toBeVisible();await page.screenshot({path:testInfo.outputPath('dashboard-desktop.png'),fullPage:true});
 await page.getByRole('navigation').getByRole('button',{name:'Conti',exact:true}).click();await page.getByRole('button',{name:'Nuovo conto',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByLabel('Nome del conto').fill('Conto test');await dialog.getByLabel('Banca o istituto').fill('Banca test');await dialog.getByLabel('Saldo iniziale (€)').fill('1000,00');await dialog.getByRole('button',{name:'Salva conto'}).click();await expect(dialog).not.toBeVisible();
 const card=page.locator('.account-card').filter({hasText:'Conto test'});await expect(card).toContainText('1.000,00');
 await page.getByRole('navigation').getByRole('button',{name:'Movimenti',exact:true}).click();await page.getByRole('button',{name:'Nuovo movimento',exact:true}).click();
 await dialog.getByLabel('Descrizione', {exact:true}).fill('Entrata browser test');await dialog.getByLabel('Importo (€)').fill('250,50');await dialog.getByLabel('Tipo',{exact:true}).selectOption('income');await dialog.getByLabel('Conto di origine / accredito').selectOption({label:'Conto test'});await dialog.getByRole('button',{name:'Salva movimento'}).click();await expect(dialog).not.toBeVisible();
 await expect(page.getByText('Entrata browser test',{exact:true})).toBeVisible();await page.reload();await expect(page.getByText('Entrata browser test',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Nuovo movimento',exact:true}).click();await dialog.getByLabel('Descrizione',{exact:true}).fill('Trasferimento browser test');await dialog.getByLabel('Importo (€)').fill('50');await dialog.getByLabel('Tipo',{exact:true}).selectOption('transfer');await dialog.getByLabel('Conto di origine / accredito').selectOption({label:'Conto test'});await dialog.getByLabel('Conto destinazione (solo trasferimenti)').selectOption({label:'Conto principale'});await dialog.getByRole('button',{name:'Salva movimento'}).click();await expect(dialog).not.toBeVisible();
 await page.getByRole('navigation').getByRole('button',{name:'Conti',exact:true}).click();await expect(card).toContainText('1.200,50');await card.getByRole('button',{name:'Modifica',exact:true}).click();await dialog.getByLabel('Nome del conto').fill('Conto aggiornato');await dialog.getByRole('button',{name:'Salva conto'}).click();await expect(page.getByRole('heading',{name:'Conto aggiornato'})).toBeVisible();
 await page.getByRole('navigation').getByRole('button',{name:'Investimenti',exact:true}).click();await expect(page.getByRole('heading',{name:'Una possibile traiettoria'})).toBeVisible();await page.getByLabel('Rendimento annuo ipotizzato').fill('4');
 await expect(page.locator('.recharts-surface').first()).toBeVisible();expect(errors).toEqual([]);
});

test('API: backup, XLSX/CSV, importazione e conflitto revisioni',async({request})=>{
 const current=await (await request.get('/api/data')).json();
 const backup=await (await request.get('/api/files?format=backup')).json();expect(backup.version).toBe(1);expect(backup.state).toEqual(current.state);
 const csv=await request.get('/api/files?format=csv');expect(await csv.text()).toContain('Importo EUR');
 const xlsx=await request.get('/api/files?format=xlsx');expect(xlsx.status()).toBe(200);const wb=new ExcelJS.Workbook();await wb.xlsx.load(new Uint8Array(await xlsx.body()).buffer);const sheet=wb.getWorksheet('Movimenti')!;expect(sheet.rowCount).toBe(current.state.movements.length+1);
 // Importare un export sullo stesso archivio deve essere rifiutato, senza modifiche.
 const duplicate=await request.post('/api/files',{headers:{origin},multipart:{file:{name:'test.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await xlsx.body()}}});expect(duplicate.status()).toBe(400);
 const incoming=new ExcelJS.Workbook();const importSheet=incoming.addWorksheet('Movimenti');importSheet.addRow(sheet.getRow(1).values);importSheet.addRow([randomUUID(),new Date().toISOString().slice(0,10),'Importazione Excel test','expense',current.state.accounts[0].id,'','Altro','12.34']);
 const imported=await request.post('/api/files',{headers:{origin},multipart:{file:{name:'nuovo.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(await incoming.xlsx.writeBuffer())}}});expect(imported.status()).toBe(200);const preview=await imported.json();expect(preview.movements[0].amount).toBe(1234);
 const changed={...current.state,movements:[...current.state.movements,...preview.movements]};const put=await request.put('/api/data',{headers:{origin},data:{revision:current.revision,state:changed}});expect(put.status()).toBe(200);
 const stale=await request.put('/api/data',{headers:{origin},data:current});expect(stale.status()).toBe(409);
 const restored=await request.put('/api/data',{headers:{origin},data:{revision:current.revision+1,state:backup.state}});expect(restored.status()).toBe(200);expect((await restored.json()).state).toEqual(backup.state);
 const forbidden=await request.put('/api/data',{headers:{origin:'https://example.com'},data:current});expect(forbidden.status()).toBe(403);
});

test('smartphone: menu, sezioni e creazione obiettivo senza overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.getByRole('heading',{name:'Una visione chiara.'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Apri menu'}).click();await page.getByRole('navigation').getByRole('button',{name:'Obiettivi',exact:true}).click();await page.getByRole('button',{name:'Nuovo obiettivo',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByLabel('Nome obiettivo').fill('Viaggio test');await dialog.getByLabel('Importo obiettivo (€)').fill('2000');await dialog.getByLabel('Già accantonato (€)').fill('200');await dialog.getByRole('button',{name:'Salva obiettivo'}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('heading',{name:'Viaggio test'})).toBeVisible();
 await page.getByRole('button',{name:'Apri menu'}).click();await page.getByRole('navigation').getByRole('button',{name:/Dati e backup/}).click();await expect(page.getByRole('heading',{name:'Backup completo'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('tema scuro: preferenza di sistema, selettore persistente e layout mobile',async({page,request},testInfo)=>{
 await page.emulateMedia({colorScheme:'dark'});
 await page.goto('/');await expect(page.getByRole('heading',{name:'Una visione chiara.'})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 const before=await (await request.get('/api/data')).json();
 await expect(page.getByRole('button',{name:'Attiva modalità chiara'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Attiva modalità chiara'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.reload();await expect(page.getByRole('button',{name:'Attiva modalità scura'})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'Attiva modalità scura'}).click();await page.reload();await expect(page.getByRole('button',{name:'Attiva modalità chiara'})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.locator('.panel').first()).toHaveCSS('background-color','rgb(27, 43, 35)');
 await page.screenshot({path:testInfo.outputPath('dark-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await expect(page.getByRole('button',{name:'Attiva modalità chiara'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Nuovo movimento',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCSS('background-color','rgb(27, 43, 35)');await page.getByRole('button',{name:'Chiudi',exact:true}).click();
 await page.screenshot({path:testInfo.outputPath('dark-mobile.png'),fullPage:true});
 expect(await (await request.get('/api/data')).json()).toEqual(before);
});
