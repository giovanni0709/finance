import { sameOrigin } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getDatabase } from '@/lib/db';
import { csvDecode, csvEncode, headers, importRows, rows } from '@/lib/exchange';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
 const s=getDatabase().read().state;const format=req.nextUrl.searchParams.get('format');
 if(format==='backup') return new Response(JSON.stringify({version:1,exportedAt:new Date().toISOString(),state:s},null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="my-finance-backup.json"','Cache-Control':'no-store'}});
 if(format==='xlsx'){
  const wb=new ExcelJS.Workbook();const sheet=wb.addWorksheet('Movimenti');sheet.addRow(headers);rows(s).forEach(r=>sheet.addRow(r));sheet.columns.forEach(c=>c.width=24);sheet.getRow(1).font={bold:true};
  const accounts=wb.addWorksheet('Conti di riferimento');accounts.addRow(['ID','Nome','Banca']);s.accounts.forEach(a=>accounts.addRow([a.id,a.name,a.bank]));accounts.columns.forEach(c=>c.width=38);
  return new Response(new Uint8Array(await wb.xlsx.writeBuffer()),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="my-finance-movimenti.xlsx"','Cache-Control':'no-store'}});
 }
 return new Response(csvEncode([headers,...rows(s)]),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="my-finance-movimenti.csv"','Cache-Control':'no-store'}});
}
export async function POST(req:NextRequest){
 if(!sameOrigin(req)) return NextResponse.json({error:'Origine non consentita'},{status:403});
 try{
  const body=await req.formData();const file=body.get('file');if(!(file instanceof File) || file.size>5_000_000) throw new Error('Scegli un file CSV o XLSX di massimo 5 MB');
  let data:string[][];
  if(file.name.toLowerCase().endsWith('.xlsx')){
   const wb=new ExcelJS.Workbook();await wb.xlsx.load(await file.arrayBuffer());const sheet=wb.getWorksheet('Movimenti');if(!sheet)throw new Error('Foglio Movimenti non trovato');
   if(sheet.rowCount>50001)throw new Error('Troppe righe');data=[];sheet.eachRow(row=>{const cells:string[]=[];for(let i=1;i<=8;i++){const c=row.getCell(i);if(c.type===ExcelJS.ValueType.Formula)throw new Error('Le formule non sono consentite');cells.push(c.text);}data.push(cells);});
  }else if(file.name.toLowerCase().endsWith('.csv'))data=csvDecode(await file.text());else throw new Error('Formato non supportato');
  const current=getDatabase().read();return NextResponse.json({movements:importRows(data,current.state),revision:current.revision});
 }catch(e){return NextResponse.json({error:e instanceof Error && !('issues' in e) ? e.message:'Importazione non valida: verifica date, importi e colonne.'},{status:400});}
}
