"use strict";
/**
 * @description Objectify (JSONify) slow-moving or finite-entry database tables.
 * @description i.e tables whose records hardly change, or have a finite choices.
 * @example BizGroups table. There can only be so much business groups for a client.
 * @example Genders table. There can only be male and female.
 * @example QtyType table. There can only be Units and Packs.
 * @description It is therefore a clever move to read these tables once at start up, and then save them as objectified arrays or json files.
 * @description These tables are prefixed by the word 'Model' in their names.
 * @returns {undefined}
 */
function initApp () {
    console.log("init");
    var //service = Service,        
        progress = AI.progress;
    progress.move(50);    
    return new Promise(function (res, rej) {
        buildDefs()
        .then(function () {
            console.log("running app...");
            return runAppGlobals(progress);
        })
        .then(function (app) {
            if (app) {                
                console.log("app ran");
                res();
            } else {
                console.log("app failed to run!");
                rej();
            }
        }).catch(function (err) {
            progress.done();
            console.log("error init " + err.stack);
            Service.logError(err);
        });
    });
}
/*function runAppGlobals (progress) {
    var globals = Globlist.starters,
        l = globals.length, s = 50, r = 100 - s;
    globals();
    progress.move(s);
    return new Promise(function (res, rej) {        
        try {
            var g;
            globals.forEach(function (global) {                
                //if (global in window) {
                    console.log("starting " + global);
                //    window[global]();
                global();
                    s += (r / l);
                    console.log(global + " started");
                //} else {
                //    g = global;
                //    console.log("no " + global);
                //}
                progress.move(s);                
            });
            if (!Def) {
                console.log( "Core Definitions: Object could not be initialized");
                throw "Core Definitions: Object could not be initialized";
            }
            if (!Module) {
                throw "Core Module: Object could not be initialized";
            }
            if (!Model) {
                throw "Core Model: Object could not be initialized";
            }
            if (!IDB) {
                console.log( "IDB: Object could not be initialized");
                throw "Core Data Access: Object could not be initialized";
            }
            if (!View) {
                throw "Core View: Object could not be initialized";
            }       
            if (!Control) {
                throw "Core Control: Object could not be initialized";
            }
            console.log("good run");
            res(true);
        } catch (err) {
            console.log("running error: @ " + g + err.stack);
            res(false);
        }
    });
}*/
function runAppGlobals (progress) {
    var globals = Globlist.starters,
        l = globals.fns.length, o = 50, s = 0, r = 100 - s;
    progress.move(s);
    return new Promise(function (res, rej) {        
        try {
            globals.run();
            globals.fns.forEach(function (fn, index) {            
                if (typeof fn === "object") {
                    s += (r / l);
                    progress.move(s);
                } else {
                    //console.log("object @ index " + index + " could not be initialized");
                }
            });
            if (s >= o) {
                //console.log("good run");
            } else {
                //console.log("bad run");                
            }
            res(true);
        } catch (err) {
            console.log("running error: " + err.stack);
            res(false);
        }
    });
}
function initServiceWorker () {
    console.log("initializing service worker...");
    return new Promise(function (res, rej) {        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
            .then(function(reg) {
                // registration worked
                console.log('Registration succeeded. Scope is ' + reg.scope);
                res();
            })
            .catch(function(err) {
                // registration failed
                console.log('Registration failed with ' + err);
                rej();
            });
        }
        res();
    });    
}