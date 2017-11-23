/**
 * @description Handles all fetch requests.
 * @param {String} url description
 * @param {Boolean} usefetch description
 * @returns {Object}
 */
function Fetcher () {
    //this.url = url;
    //this.use = usefetch;//('fetch' in window)? "fetch": "xhr";    
}    
Fetcher.prototype = {
    constructor: Fetcher,
    readAs: undefined,
    /**
     * 
     * @param {String} url
     * @param {String} as json | text | blob
     * @param {Object} options optional
     * @returns {unresolved}
    */
    fetch: function (url, as, options) {
        switch (as) {
            case "json":
                this.readAs = this.readJSON;
                break;
            case "text":
                this.readAs = this.readText;
                break;
            case "blob":
                this.readAs = this.readBlob;
                break;
            default:
                this.readAs = this.readJSON;
        }
        /*
         * var myImage = document.querySelector('.my-image');
            fetch('https://upload.wikimedia.org/wikipedia/commons/7/77/Delete_key1.jpg')
                    .then(res => res.blob())
                    .then(res => {
                            var objectURL = URL.createObjectURL(res);
                            myImage.src = objectURL;
            });
         * fetch("/echo/json/",
            {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify({a: 1, b: 2})
            })
            .then(function(res){ console.log(res) })
            .catch(function(res){ console.log(res) })
         */
        return fetch(url, options)
            .then(this.validate)
            .then(this.readAs)
            .catch(function (err) {
                console.log("fetch error: " + err);
                return undefined;
            });
    },
    validate: function (response) {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response;
      },
    readJSON: function (response) {
        if (response) {return response.json();} else {return undefined;}
        
    },
    readText: function (response) {
        return response.text();
    },
    readBlob: function (response) {
        return response.blob;           
        /*fetch('flowers.jpg').then(function(response) {
          return response.blob();
        }).then(function(blob) {
            // use this wherever the image is required.
            var myImage = document.querySelector('.my-image');
            var objectURL = URL.createObjectURL(blob);
            myImage.src = objectURL;
        });*/
    }
};
/* Response Properties
    bodyUsed
    headers
    ok
    redirected
    status
    statusText
    type
    url
    useFinalURL
   Response Methods
    arrayBuffer()
    blob()
    clone()
    error()
    formData()
    json()
    redirect()
    text()
*/
/*
 * The formData() method of the Body mixin takes a Response stream and reads it to completion. It returns a promise that resolves with a FormData object.

Note: This is mainly relevant to service workers. If a user submits a form and a service worker intercepts the request, you could for example call formData() on it to obtain a key-value map, modify some fields, then send the form onwards to the server (or use it locally).
Syntax

response.formData()
.then(function(formdata) {
  // do something with your formdata
});
 */
/*
 * Body
    Properties
    bodyUsed
    Methods
    arrayBuffer()
    blob()
    formData()
    json()
    text()
Implemented by:
    Request
    Response
 */
/*
 * Request
    Constructor
    Request()
    Properties
    bodyUsed
    cache
    context
    credentials:
        omit: Never send cookies.
        same-origin: Send user credentials (cookies, basic http auth, etc..) if the URL is on the same origin as the calling script.
        include: Always send user credentials (cookies, basic http auth, etc..), even for cross-origin calls.
    headers
    integrity
    method
    mode
    redirect
    referrer
    referrerPolicy
    url
Methods
    arrayBuffer()
    blob()
    clone()
    formData()
    json()
    text()
 */
/*
 * Headers
    Constructor
    Headers()
    Methods
    append()
    delete()
    entries()
    get()
    getAll()
    has()
    keys()
    set()
    values()
 */
/*
 * HTTP headers
    Accept
    Accept-Charset
    Accept-Encoding
    Accept-Language
    Accept-Ranges
    Access-Control-Allow-Credentials
    Access-Control-Allow-Headers
    Access-Control-Allow-Methods
    Access-Control-Allow-Origin
    Access-Control-Expose-Headers
    Access-Control-Max-Age
    Access-Control-Request-Headers
    Access-Control-Request-Method
    Age
    Allow
    Authorization
    Cache-Control
    Connection
    Content-Disposition
    Content-Encoding
    Content-Language
    Content-Length
    Content-Location
    Content-Range
    Content-Security-Policy
    Content-Security-Policy-Report-Only
    Content-Type
    Cookie
    Cookie2
    DNT
    Date
    ETag
    Expect
    Expires
    Forwarded
    From
    Host
    If-Match
    If-Modified-Since
    If-None-Match
    If-Range
    If-Unmodified-Since
    Keep-Alive
    Large-Allocation
    Last-Modified
    Location
    Origin
    Pragma
    Proxy-Authenticate
    Proxy-Authorization
    Public-Key-Pins
    Public-Key-Pins-Report-Only
    Range
    Referer
    Referrer-Policy
    Retry-After
    Server
    Set-Cookie
    Set-Cookie2
    SourceMap
    Strict-Transport-Security
    TE
    Timing-Allow-Origin
    Tk
    Trailer
    Transfer-Encoding
    Upgrade-Insecure-Requests
    User-Agent
    Vary
    Via
    WWW-Authenticate
    Warning
    X-Content-Type-Options
    X-DNS-Prefetch-Control
    X-Forwarded-For
    X-Forwarded-Host
    X-Forwarded-Proto
    X-Frame-Options
    X-XSS-Protection
 */
