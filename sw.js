//imports
importScripts('js/sw-utils.js');


const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';
const CACHE_INMUTABLE_NAME = 'inmutable-v1';

const APP_SHELL = [
    '/2---BlazorPokedex/',
    '/2---BlazorPokedex/BlazorPokedex.Client.styles.css',
    '/2---BlazorPokedex/_framework/blazor.boot.json',
    '/2---BlazorPokedex/_framework/blazor.webassembly.js',
    '/2---BlazorPokedex/_framework/dotnet.5.0.13.js',
    '/2---BlazorPokedex/css/app.css',
    '/2---BlazorPokedex/css/bootstrap/bootstrap.min.css',
    '/2---BlazorPokedex/css/open-iconic/font/css/open-iconic-bootstrap.min.css',
    '/2---BlazorPokedex/favicon.ico',
    '/2---BlazorPokedex/offLine.html',
    '/2---BlazorPokedex/js/app.js',
    '/2---BlazorPokedex/js/sw-utils.js'
];

function limpiarCache(cacheName, numeroItems) {
    caches.open(cacheName)
        .then(cache => {
            return cache.keys()
                .then(keys => {
                    if (keys.length > numeroItems) {
                        cache.delete(keys[0])
                            .then(limpiarCache(cacheName, numeroItems));
                    }
                });
        });
}

self.addEventListener('install', e => {

    const cacheProm = caches.open(CACHE_STATIC_NAME).then(cache => {
        return cache.addAll(APP_SHELL);
        });
    e.waitUntil(cacheProm);

    //Varias promesas
    //e.waitUntil(Promise.all([cacheProm, cacheProm2]));
});


self.addEventListener('activate', e => {

    const respuesta = caches.keys().then(keys => {
        keys.forEach(key => {
            //Para eliminar todos menos el estatico
            if (key !== CACHE_STATIC_NAME)
                return caches.delete(key);
            if (key !== CACHE_STATIC_NAME && key.includes('static'))
                return caches.delete(key);
        });
    });
    e.waitUntil(respuesta);
});


//Estrategias del cache y modo offline
self.addEventListener('fetch', e => {

    //1 - Cache only
    //e.respondWith(caches.match(e.request));

    //2 - Cache with network fallback
    const respuesta = caches.match(e.request).then(res => {
        if (res) return res;

        //No existe el archivo tengo que ir a la web
        console.log('No existe', e.request.url);

        return fetch(e.request).then(newResp => {
            return actualizaCacheDinamico(CACHE_DYNAMIC_NAME, e.request, newResp);
        }).catch(err => {
            //if (e.request.headers.get('accept').includes('text/html')) {
            //    return caches.match('/offline.httml');
            //}
            console.log('Error en la petición fetch', e.request.url);
            return caches.match('/offLine.html');
        });
            

    });
    e.respondWith(respuesta);

    //3 - Network with cache fallback
    //const respuesta = fetch(e.request).then(res => {

    //    if (!res) return caches.match(e.request);

    //    caches.open(CACHE_DYNAMIC_NAME)
    //        .then(cache => {
    //            cache.put(e.request, res);
    //            limpiarCache(CACHE_DYNAMIC_NAME, 100);
    //        })
    //    return res.clone();
    //}).catch(err => {
    //    return caches.match(e.request);
    //});
    //e.respondWith(respuesta);

    //4 - Cache with network update. Rendimiento es crítico, siempre estarán un paso atrás.
    //const respuesta = caches.open(CACHE_STATIC_NAME).then(cache => {
    //    console.log(e.request);
    //    fetch(e.request).then(resp => cache.put(e.request, resp));
    //    return cache.match(e.request);
    //    return cache.match(e.request);
    //});

    //e.respondWith(respuesta);


    //5 - Estrategia: Cache y Network Race

    //const respuesta = new Promise((resolve, reject) => {

    //    let rechazada = false;

    //    const falloUnaVez = () => {
    //        if (rechazada) {
    //            if (/\.(png|jpg)$/i.test(e.request.url)) {
    //                resolve(caches.match('/img/no-img.jpg'));
    //            } else {
    //                reject('No se encontro respuesta');
    //            }
    //        } else {
    //            rechazada = true;
    //        }
    //    };

    //    fetch(e.request).then(res => {
    //        res.ok ? resolve(res) : falloUnaVez();
    //    }).catch(falloUnaVez);

    //    caches.match(e.request).then(res => {
    //        res ? resolve(res) : falloUnaVez();
    //    }).catch(falloUnaVez);

    //});

    //e.respondWith(respuesta);
    
});