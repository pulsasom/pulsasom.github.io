const CACHE_NAME='pulsasom-v14';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192x192.png','./icon-512x512.png','./apple-touch-icon.png','./share-card.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);

  // Nunca cachear chamadas da API do YouTube para permitir vídeos novos.
  if(url.hostname.includes('googleapis.com') || url.hostname.includes('youtube.com') || url.hostname.includes('ytimg.com')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }

  const accept=event.request.headers.get('accept')||'';
  if(event.request.mode==='navigate'||accept.includes('text/html')){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(res=>{
      const copy=res.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{
    const copy=res.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});
    return res;
  })));
});
