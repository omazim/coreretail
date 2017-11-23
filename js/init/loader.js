(function () {       
    function getFiles (url) {
        return new Promise(function (res, rej) {
            fetch(url)
            .then(function (response) {
                if (response) {
                    res(response.json());
                }
            })
            .catch(function (err) {
                console.log(err.stack);
            });
        });
    }
    function getVersion (arr, pattern) {
            // we get array of files in a directory.
            // we decide which file to load as a script
            // by choosing the highest version number
            // or the given version number (if any).
            // this makes it easy to load any version of app.
            // e.g file_1.js
            var suffixes = arr.map(function (file) {
                    var lastIndex = file.lastIndexOf("_"),
                        v = new RegExp(/_[0-9]+/g),
                        i = v.exec(file);
                    if (pattern.test(file) && lastIndex >= 0) {
                        //console.log(pattern + " matched");
                        return (i !== null)? i[0].replace("_",""): 0;
                    //} else {
                    //    console.log(pattern + ": no match");
                    }
                }).sort(function (a, b) {
                    // sort descending.
                    return (a < b)? 1: -1;
                });
                //console.log("versions for " + base + " = " + suffixes);
            return (suffixes[0])? suffixes[0]: 0;                  
        }
    function getSources (key, arr) {
            globlist[key].forEach(function (file) {
                var x = file.replace(/[-\/\\^$*+?.()|[\]{}]/g,
                    "\\$&"),
                    p = new RegExp("^" + x + "_*[0-9]*.js$"),
                    v = getVersion(arr, p),
                    s = (v === 0)? "": "_" + v,
                    src = "js/" + key + "/" + file + s + ".js";
                sources.push({
                    id: file + s,
                    src: src,
                    f: key,// folder
                    n: file + s// filename
                });
            });
        }
    function createScripts (sources) {
            var promises = [];
            return new Promise(function (res, rej) {
                if (sources.length === 0) {
                    res([]);
                } else {
                    sources.forEach(function (src) {
                        promises.push(
                            new Promise(function (res, rej) {
                                var script = document.createElement("SCRIPT");
                                script.id = src.id;
                                script.src = src.src;
                                //script.setAttribute("async", "");

                                document.head.appendChild(script);
                                /*script.onreadystatechange= function () {
                                    if (this.readyState === "complete") {
                                        console.log("resolved by complete.");
                                        resolve(src.id);
                                    }
                                };*/
                                script.onload = function () {
                                    //console.log("resolved by onload.");
                                    //console.log("resolved " + id);
                                    console.log("script @ source: " + src.src);
                                    res(sources);
                                };
                                script.onerror = function () {
                                    console.log("failed @ source: " + src.src);
                                    Globlist.filesErr.push(src);
                                    rej(sources);
                                };
                            })
                        );
                    });
                    res(promises);
                }
            });
        }
    function getScripts () {    
        return new Promise(function (res, rej) {
            var glist = Object.keys(globlist);
            console.log(glist);
            if (glist.length === 0) {
                console.log("resolve empty array");
                res([]);
            } else {
                glist.forEach(function (key, index, thatArg) {
                    var qs = "a=web&b=coreretail&c=js&d=" + key;
                    getFiles(url + qs)
                    .then(function (arr) {
                        getSources(key, arr);
                        if (index + 1 === thatArg.length) {
                            res(sources);
                        }
                    })
                    .catch(function (err) {
                        console.log("error getting scripts: " + err.stack);
                    });
                });
            }
        });
    }
    // glob the latest files in the following directories
    var globlist = Globlist.files,
        all = (function () {
            var l = 0;
            Object.keys(globlist).forEach(function (key) {
                l += globlist[key].length;
            });
            return l;
        })(),
        url = "./php/controls/s/globber.php?",
        sources = [];
    //return new Promise(function (res, rej) {
    console.log("loading...");
    AI.progress.init();
    getScripts()
    .then(function (sources) {
        console.log("Creating scripts...");
        if (sources.length === 0) {
            return Promise.resolve(sources);
        }
        return createScripts(sources);
    })
    .then(function (promises) {
        return Promise.all(promises);
    })
    .then(function (sources) {
        //if (sources.length > 0) {
            console.log(sources.length + " scripts loaded of " + all);
            initApp().then(function () {
                // start progress bar                
                initServiceWorker();
            }).then(function () {                
                Control.events.init();
                console.log("events listening");
                ShowUtil.dashboard({
                    Username: "Cj",
                    UserId: "S00",
                    ShopId: "000",
                    BizId: "00"
                });
                console.log("dashboard shown");
                AI.progress.move(100);
                AI.progress.done();
                //res();
            }).catch(function (err) {
                console.log(err);
            });
        //} else {
        //    console.log("no script for " + sources[0].id);
        //    rej();
        //}
    }).catch(function (err) {
        console.log("error loading scripts: " + err.stack);
    });
})();