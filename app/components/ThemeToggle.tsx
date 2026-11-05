'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/** The preference belongs to this browser, independently of the finance archive. */
export default function ThemeToggle() {
 const [dark,setDark]=useState(false);
 useEffect(()=>{setDark(document.documentElement.dataset.theme==='dark');},[]);
 function toggle(){
  const next=!dark;
  document.documentElement.dataset.theme=next?'dark':'light';
  setDark(next);
  try{localStorage.setItem('my-finance-theme',next?'dark':'light');}catch{/* Keep the theme usable when storage is disabled. */}
 }
 const label=dark?'Attiva modalità chiara':'Attiva modalità scura';
 return <button className="theme-toggle" type="button" aria-label={label} title={label} aria-pressed={dark} onClick={toggle}>{dark?<Sun size={17}/>:<Moon size={17}/>}<span>{dark?'Tema chiaro':'Tema scuro'}</span></button>;
}
