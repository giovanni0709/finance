/** Compare the browser origin with the actual HTTP Host. Next may normalize
 * request.url to localhost internally, even for valid LAN/127.0.0.1 requests. */
export function sameOrigin(req:Request):boolean {
 const origin=req.headers.get('origin');const host=req.headers.get('host');
 if(!origin||!host)return false;
 try{const parsed=new URL(origin);return parsed.origin===origin && parsed.host===host && ['http:','https:'].includes(parsed.protocol);}catch{return false;}
}
