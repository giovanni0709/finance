import { sameOrigin } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';
import { ConflictError, getDatabase } from '@/lib/db';
import { stateSchema } from '@/lib/model';
import { z } from 'zod';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export function GET(){ return NextResponse.json(getDatabase().read(),{headers:{'Cache-Control':'no-store'}}); }
export async function PUT(req:NextRequest){
 if(!sameOrigin(req)) return NextResponse.json({error:'Origine non consentita'},{status:403});
 if(Number(req.headers.get('content-length')||0)>10_000_000) return NextResponse.json({error:'File troppo grande'},{status:413});
 try {
  const raw=await req.text(); if(raw.length>10_000_000) return NextResponse.json({error:'File troppo grande'},{status:413});
  const body=z.object({state:stateSchema,revision:z.number().int().nonnegative()}).parse(JSON.parse(raw));
  return NextResponse.json(getDatabase().write(body.state,body.revision));
 }catch(e){return NextResponse.json({error:e instanceof ConflictError ? e.message : 'Dati non validi. Controlla importi, date e riferimenti ai conti.'},{status:e instanceof ConflictError ? 409:400});}
}
