'use client';
import { useState } from 'react';
import { categories } from '@/lib/model';
export default function CategoryField({value='Altro',used=[]}:{value?:string;used?:string[]}){
 const [selection,setSelection]=useState(value);
 const options=Array.from(new Set([...categories,...used,value]));
 return <><div className="field"><label htmlFor="category-select">Categoria</label><select id="category-select" name={selection==='__new__'?undefined:'category'} value={selection} onChange={e=>setSelection(e.target.value)}>{options.map(c=><option value={c} key={c}>{c}</option>)}<option value="__new__">+ Nuova categoria…</option></select></div>{selection==='__new__'&&<label className="field">Nome nuova categoria<input name="category" required maxLength={120} placeholder="Es. Animali domestici" autoFocus/></label>}</>;
}
