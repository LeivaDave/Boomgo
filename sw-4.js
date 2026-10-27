const CACHE='boomgo-v9';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(u=>c.add(new Request(u,{cache:'reload'}))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin)return;
  const isPage=r.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname);
  if(isPage){
    /* páginas: primero la red (siempre la versión nueva); sin internet, la copia guardada */
    e.respondWith(fetch(u.href,{cache:'no-store'}).then(res=>{
      if(res&&res.status===200){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp))}
      return res}).catch(()=>caches.match('./index.html')));
    return}
  /* imágenes y demás: primero la copia guardada */
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{
    if(res&&res.status===200){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}
    return res})))});
