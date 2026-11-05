import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'My Finance — Le tue finanze, in ordine',description:'Gestione personale di conti, risparmi e investimenti'};
export default function Layout({children}:{children:React.ReactNode}){ return <html lang="it" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('my-finance-theme');document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}catch{document.documentElement.dataset.theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}`}}/></head><body>{children}</body></html>; }
