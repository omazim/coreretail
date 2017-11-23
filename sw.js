console.log("importing..");
importScripts("js/swscripts/polyfill.js", "js/swscripts/asset.js");
var cacheAsset = {};
self.addEventListener('install', function(event) {
    event.waitUntil(
        getAssets()
            .then(function (asset) {
                //console.log(asset.name);
                cacheAsset = asset;
                caches.open(asset.name)
                .then(function(cache) {
                    console.log("Opened cache " + asset.urls.length + " item(s)");
                    return cache.addAll(asset.urls);
            })
            .then(function () {
                return self.skipWaiting();
            })
            .catch(function (err) {
                console.log("err waiting until: " + err);
            });
        })
    );    
});
/*self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(`static-${version}`)
      .then(cache => cache.addAll([
        new Request('/styles.css', { cache: 'no-cache' }),
        new Request('/script.js', { cache: 'no-cache' })
      ]))
  );
});*/
/*self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(`static-${version}`)
      .then(cache => Promise.all(
        [
          '/styles.css',
          '/script.js'
        ].map(url => {
          // cache-bust using a random query string
          return fetch(`${url}?${Math.random()}`).then(response => {
            // fail on 404, 500 etc
            if (!response.ok) throw Error('Not ok');
            return cache.put(url, response);
          })
        })
      ))
  );
});*/

self.addEventListener('fetch', function(event) {
    //event.request.url += "?" + Math.random();
    var url = event.request.url;
    //console.log("fetch " + event.request.url);
    event.respondWith(
        caches.match(event.request)
        .then(function(resp) {
            if (url === "/") {
                        
            }
            if (resp) {
                //console.log("respond with " + event.request.url);
                return resp;
            }
            // todo: in production, fetch from cache first before going to network.
            // in dev, refresh from network always.
            return fetch(event.request)
                .then(function(response) {
                    /*caches.open(cacheAsset.name)
                    .then(function(cache) {
                        //console.log("cacheAsset name: " + cacheAsset.name);
                        cache.put(event.request, response.clone());
                    });*/
                    return response;
                });
                /*.catch(function(err) {
                    console.log("err fetching in sw: " + err.stack);
                });*/
        })
        .catch(function(err) {
            // not in cache, fetch from server.
            console.log("No match in cache: " + err.stack);
          //return caches.match(asset.fallback);
        })
    );
});

self.addEventListener('message', function(event){
    console.log("SW Received Message: " + event.data);
});
/*
 * How to Send Messages Between Service Workers and Clients
Service Workers are background processes for web pages. Most of the current excitement around Service Workers is about providing offline web apps, as the Service Worker can manage a local cache of resources syncing back to the server when a connection is available. This is cool, but I want to talk about another use-case for Service Workers, using them to manage communications between multiple web pages.

For example, you may have an application open in multiple browser tabs. A Service Worker can be used to update content in one tab in response to an event triggerred in another, or to update content in all tabs in response to a message pushed from the server.

One Service Worker can control multiple client pages. In fact a Service Worker will automatically take control of any client webpages within its scope. Scope is a url path within your site, by default this is the base path of the service worker script.

In this demo, we'll use three files client1.html, client2.html and service-worker.js.

First we register the service worker in client1.html:

<!doctype html>
<html>
<head>
    <title>Service Worker - Client 1</title>
</head>
<body>
    <script>
        if('serviceWorker' in navigator){
            // Register service worker
            navigator.serviceWorker.register('/service-worker.js').then(function(reg){
                console.log("SW registration succeeded. Scope is "+reg.scope);
            }).catch(function(err){
                console.error("SW registration failed with error "+err);
            });
        }
    </script>
</body>
</html>
Next we create a basic Service Worker Script in service-worker.js:

console.log("SW Startup!");

// Install Service Worker
self.addEventListener('install', function(event){
    console.log('installed!');
});

// Service Worker Active
self.addEventListener('activate', function(event){
    console.log('activated!');
});
I won't bother explaining how this works as it's well documented elsewhere.

We also create a basic client2.html. We'll only use client1.html to register our Servcie Worker, so there's no need to duplicate code here. When it's running the Service Worker will automatically take control of this page as it is within it's scope.

<!doctype html>
<html>
<head>
    <title>Service Worker - Client 2</title>
</head>
<body>
    <script>
    </script>
</body>
</html>
If you visit client1.html in your browser you should see the registration messages in the console log. In Chrome (48+) you can open an inspector for the Service Worker by clicking "inspect" in "Service Workers" under the "Resources" tab in Dev Tools. When you open client2.html in a new tab, you should see it listed under "Controlled Clients" in Dev Tools.

Now we can get on with the interesting stuff...

First we're going to make the clients send messages to the Service Worker. So we need to add a message handler in service-worker.js:

self.addEventListener('message', function(event){
    console.log("SW Received Message: " + event.data);
});
Now we can add a send message function to both of the clients.

function send_message_to_sw(msg){
    navigator.serviceWorker.controller.postMessage("Client 1 says '"+msg+"'");
}
If you call send_message_to_sw("Hello") from the console on the client pages, you should see the message displayed on Service Worker console.

We can take this a little further allowing the Service Worker to reply to the message sent by a client. To do this we need to enhance our send_message_to_sw function. We use a Message Channel, which provides us with a pair of ports to communicate over. We send a reference to one of these ports along with the message, so the Service Worker can use it to send back a reply. We also add a handler to catch the response message. For convenience we also use a Promise to handle waiting for the response.

function send_message_to_sw(msg){#
    return new Promise(function(resolve, reject){
        // Create a Message Channel
        var msg_chan = new MessageChannel();

        // Handler for recieving message reply from service worker
        msg_chan.port1.onmessage = function(event){
            if(event.data.error){
                reject(event.data.error);
            }else{
                resolve(event.data);
            }
        };

        // Send message to service worker along with port for reply
        navigator.serviceWorker.controller.postMessage("Client 1 says '"+msg+"'", [msg_chan.port2]);
    });
}
In service-worker.js we modify our listener to send back a reply on the port sent with the message.

self.addEventListener('message', function(event){
    console.log("SW Received Message: " + event.data);
    event.ports[0].postMessage("SW Says 'Hello back!'");
});
Now if you run send_message_to_sw("Hello").then(m => console.log(m)) in your client console, you should see the message displayed in the Service Worker console and the reply in the client console. Note We're using the Promise then function to wait for the response and an Arrow Function because it's easier to type.

Now we have a mechanism for a client to send a message to the Service Worker and for the Service Worker to send back a reply. You could use this for having a client check on the status of a long-running process, have the Service worker forward a message on to all clients or something else cool.

Magic!

Now we're going to allow the Service Worker broadcast a message to all clients and have the clients respond. This uses a similar mechanism as before except the roles are reversed.

First we add a message listener to our clients. This is almost identical to before except we first test for Service Worker support.

if('serviceWorker' in navigator){
    // Handler for messages coming from the service worker
    navigator.serviceWorker.addEventListener('message', function(event){
        console.log("Client 1 Received Message: " + event.data);
        event.ports[0].postMessage("Client 1 Says 'Hello back!'");
    });
}
Next we add a function on our service worker to send a message to a client. This too is similar, except we need to provide a client object (reference to an open page) so we know where to send the message.

function send_message_to_client(client, msg){
    return new Promise(function(resolve, reject){
        var msg_chan = new MessageChannel();

        msg_chan.port1.onmessage = function(event){
            if(event.data.error){
                reject(event.data.error);
            }else{
                resolve(event.data);
            }
        };

        client.postMessage("SW Says: '"+msg+"'", [msg_chan.port2]);
    });
}
The Service Worker API provides an interface for getting references to all connected clients. We can wrap this up in a convenience function to broadcast a message to all clients (Note we're using Arrow Functions again).

function send_message_to_all_clients(msg){
    clients.matchAll().then(clients => {
        clients.forEach(client => {
            send_message_to_client(client, msg).then(m => console.log("SW Received Message: "+m));
        })
    })
}
Now if you run send_message_to_all_clients('Hello') in the Service Worker console, you should see the message recieved in all the client consoles and the client replies in the Service Worker console.

More Magic!
 */

/*
 * Events
    statechange
    updatefound
    controllerchange
    error
    message
    install
    activate
fetch*/
/* Properties
 * Properties
onerror
onstatechange
scriptURL
state
 * 
 */
/*
 *if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js', {
        scope: './'
    }).then(function (registration) {
        var serviceWorker;
        if (registration.installing) {
            serviceWorker = registration.installing;
            document.querySelector('#kind').textContent = 'installing';
        } else if (registration.waiting) {
            serviceWorker = registration.waiting;
            document.querySelector('#kind').textContent = 'waiting';
        } else if (registration.active) {
            serviceWorker = registration.active;
            document.querySelector('#kind').textContent = 'active';
        }
        if (serviceWorker) {
            // logState(serviceWorker.state);
            serviceWorker.addEventListener('statechange', function (e) {
                // logState(e.target.state);
            });
        }
    }).catch (function (error) {
        // Something went wrong during registration. The service-worker.js file
        // might be unavailable or contain a syntax error.
    });
} else {
    // The current browser doesn't support service workers.
}
 */

/*
 * ¶
Working example.

 
var CACHE_NAME = 'dependencies-cache';

self.addEventListener('install', function(event) {
¶
Perform the install step:

Load a JSON file from server
Parse as JSON
Add files to the cache list
¶
Message to simply show the lifecycle flow

 
  console.log('[install] Kicking off service worker registration!');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
¶
With the cache opened, load a JSON file containing an array of files to be cached

 
        return fetch('files-to-cache.json').then(function(response) {
¶
Once the contents are loaded, convert the raw text to a JavaScript object

 
          return response.json();
        }).then(function(files) {
¶
Use cache.addAll just as you would a hardcoded array of items

 
          console.log('[install] Adding files from JSON file: ', files);
          return cache.addAll(files);
        });
      })
      .then(function() {
¶
Message to simply show the lifecycle flow

 
        console.log(
          '[install] All required resources have been cached;',
          'the Service Worker was successfully installed!'
        );
¶
Force activation

 
        return self.skipWaiting();
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
¶
Cache hit - return the response from the cached version

 
        if (response) {
          console.log(
            '[fetch] Returning from Service Worker cache: ',
            event.request.url
          );
          return response;
        }
¶
Not in cache - return the result from the live server fetch is essentially a “fallback”

 
        console.log('[fetch] Returning from server: ', event.request.url);
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
¶
Message to simply show the lifecycle flow

 
  console.log('[activate] Activating service worker!');
¶
Claim the service work for this client, forcing controllerchange event

 
  console.log('[activate] Claiming this service worker!');
  event.waitUntil(self.clients.claim());
});
 */


/*
 Copyright 2014 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.


// While overkill for this specific sample in which there is only one cache,
// this is one best practice that can be followed in general to keep track of
// multiple caches used by a given service worker, and keep them all versioned.
// It maps a shorthand identifier for a cache to a specific, versioned cache name.

// Note that since global state is discarded in between service worker restarts, these
// variables will be reinitialized each time the service worker handles an event, and you
// should not attempt to change their values inside an event handler. (Treat them as constants.)

// If at any point you want to force pages that use this service worker to start using a fresh
// cache, then increment the CACHE_VERSION value. It will kick off the service worker update
// flow and the old cache(s) will be purged as part of the activate event handler when the
// updated service worker is activated.
var CACHE_VERSION = 1;
var CURRENT_CACHES = {
  font: 'font-cache-v' + CACHE_VERSION
};

self.addEventListener('activate', function(event) {
  // Delete all caches that aren't named in CURRENT_CACHES.
  // While there is only one cache in this example, the same logic will handle the case where
  // there are multiple versioned caches.
  var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
    return CURRENT_CACHES[key];
  });

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (expectedCacheNames.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            console.log('Deleting out of date cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  console.log('Handling fetch event for', event.request.url);

  event.respondWith(
    caches.open(CURRENT_CACHES.font).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        if (response) {
          // If there is an entry in the cache for event.request, then response will be defined
          // and we can just return it. Note that in this example, only font resources are cached.
          console.log(' Found response in cache:', response);

          return response;
        }

        // Otherwise, if there is no entry in the cache for event.request, response will be
        // undefined, and we need to fetch() the resource.
        console.log(' No response for %s found in cache. About to fetch ' +
          'from network...', event.request.url);

        // We call .clone() on the request since we might use it in a call to cache.put() later on.
        // Both fetch() and cache.put() "consume" the request, so we need to make a copy.
        // (see https://fetch.spec.whatwg.org/#dom-request-clone)
        return fetch(event.request.clone()).then(function(response) {
          console.log('  Response for %s from network is: %O',
            event.request.url, response);

          if (response.status < 400 &&
              response.headers.has('content-type') &&
              response.headers.get('content-type').match(/^font\//i)) {
            // This avoids caching responses that we know are errors (i.e. HTTP status code of 4xx or 5xx).
            // We also only want to cache responses that correspond to fonts,
            // i.e. have a Content-Type response header that starts with "font/".
            // Note that for opaque filtered responses (https://fetch.spec.whatwg.org/#concept-filtered-response-opaque)
            // we can't access to the response headers, so this check will always fail and the font won't be cached.
            // All of the Google Web Fonts are served off of a domain that supports CORS, so that isn't an issue here.
            // It is something to keep in mind if you're attempting to cache other resources from a cross-origin
            // domain that doesn't support CORS, though!
            // We call .clone() on the response to save a copy of it to the cache. By doing so, we get to keep
            // the original response object which we will return back to the controlled page.
            // (see https://fetch.spec.whatwg.org/#dom-response-clone)
            console.log('  Caching the response to', event.request.url);
            cache.put(event.request, response.clone());
          } else {
            console.log('  Not caching the response to', event.request.url);
          }

          // Return the original response object, which will be used to fulfill the resource request.
          return response;
        });
      }).catch(function(error) {
        // This catch() will handle exceptions that arise from the match() or fetch() operations.
        // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
        // It will return a normal response object that has the appropriate error code set.
        console.error('  Error in fetch handler:', error);

        throw error;
      });
    })
  );
});
© 2017 GitHub, Inc.
Terms
Privacy
Security
Status
Help
Contact GitHub
API
Training
Shop
Blog
About
*/