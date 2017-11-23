function getAssets () { 
    return new Promise(function (res, rej) {
        var asset = {
                name: "coreretail-main-v5",
                urls: [
                    "/",
                    // HTML
                    "index.html",
                    // Styles
                    "css/w3/w3_2.8.css",
                    "css/w3/colors.css", 
                    "css/w3/colors-ana.css", 
                    "css/w3/colors-camo.css", 
                    "css/w3/colors-highway.css", 
                    "css/w3/colors-safety.css", 
                    "css/w3/colors-signal.css", 
                    "css/w3/colors-vivid.css", 
                    "css/w3/colors-theme.css", 
                    "css/corra/popup.css", 
                    "css/corra/flexbox.css", 
                    "css/corra/scroller.css", 
                    "css/corra/toggle-switch.css", 
                    "css/corra/w3-supplementary.css", 
                    "css/corra/corra.css", 
                    "css/hover/hover.css",
                    // Fonts
                    "fonts/font-awesome/font-awesome_4.7.0.min.css",
                    "fonts/google/fonts.css?family=Raleway",                
                    // JS
                    // Libraries
                    "js/jquery/jquery-3.1.1.min.js",
                    "js/jquery/jquery-color-2.1.2.js",
                    "js/jquery/jquery-ui-1.12.1.min.js",
                    // W3Data
                    "js/w3data/w3data_1.2.js",
                    /*// Polyfills
                    "js/polyfills/polyfill.js",
                    // Services
                    "js/services/Service.js",
                    // Data
                    "js/models/idb.js",
                    // Definition
                    "js/models/def.js", 
                    // Models
                    "js/models/model.js",            
                    // Modules
                    "js/models/module.js",        
                    // Views
                    "js/views/view.js",      
                    // Controllers
                    "js/controllers/controller.js",
                    // Init
                    "js/models/init.js"
                    // JSON */                           
                ]
            },
            modelnames = "./php/controls/s/fetcher.php?b=modelnames&f=models&sf=json&ext=json&t=src",
            jsonpath = "js/models/json/";//unreal
        fetch(modelnames)
        .then(function (response) {
            if (response) {
                return response.json();                    
            }                
        })
        .then(function (json) {
            json.forEach(function (list) {
                var relpath = jsonpath + list; 
                asset.urls.push(relpath);
                console.log("globbed: " + relpath);
            });
            console.dir(asset);
            res(asset);
        })
        .catch(function (err) {
            console.log("get json model list failed: " + err);
            res(asset);
        });        
    });
}