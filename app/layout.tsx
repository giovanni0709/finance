import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'My Finance — Le tue finanze, in ordine',description:'Gestione personale di conti, risparmi e investimenti'};
export default function Layout({children}:{children:React.ReactNode}){ return <html lang="it"><body>{children}</body></html>; }
