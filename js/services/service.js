"use strict";
var Service = {
        // Application folder.
        appPath: "",//..../coreretail/",
        // fragments
        htmlSnippetPath: "src/html/snippets/",
        // scripts
        appScriptPath: "js/pages/",
        submodelScriptPath: "js/submodels/",
        modelsScriptPath: "src/m/",
        viewsScriptPath: "web/js/",
        controlsScriptPath: "web/js/",
        //Use double back slash to escape back slash;
        //strDbPath = process.env.USERPROFILE + "/Documents/Native-Web/Local",        
        dataPath: "src/data/",
        jsonPath: "src/data/json/",
        sqlPath: "src/data/sql/",
        defModel: {
            fromIDB: false,
            add: false,
            models: []
        },
        /**
         * @function getHTMLSnippetPath Return the path to the HTML fragments.
         * @param {type} strFile Name of fragment file to return its path.
         * @returns {String} Return path to strFile's fragment.
         */
        getHTMLSnippetFullPath: function (strFile) {        
            return htmlSnippetPath + "/" + strFile + ".html";
        },
        /**
         * @param {String} m 
         * @returns {String} Return path to strFile's fragment.
         */
        getModelScriptPath: function (m) {
            return modelsScriptPath + "/" + m + "/";        
        },
        /**
         * @param {String} m
         * @returns {String} Return path to strFile's fragment.
         */
        getViewScriptPath: function (m) {
            return viewsScriptPath + "/" + m + "/";
        },
        /**
         * @description Return the path to the script file.
         * @param {String} m
         * @returns {String} Return path to strFile's fragment.
         */
        getControlScriptPath: function (m) {
            return controlsScriptPath + "/" + m + "/";
        },
        /**
         * @param {String} name Name of file to be loaded.
         * @param {String} path Path to file
         * @returns {undefined}
         */
        loadScript: function (name, path) {        
            var script = document.createElement('script');
            if (document.querySelector("script #" + name)) {
                return;
            }
            script.id = name;
            script.src = path + name + ".js";
            document.head.appendChild(script);
        },    
        loadScriptAsync: function (name, path) {                    
            return new Promise(function (res, rej) {
                var script = document.createElement("script");
                if (document.querySelector("script #" + name)) {
                    res(true);
                }
                script.id = name;
                script.src = path + name + ".js";            
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
                    console.log("script @ source: " + script.src);
                    res(true);
                };
                script.onerror = function () {
                    console.log("failed @ source: " + script.src);
                    res(false);
                };
            });
        },
        /**
         * @param {String} id
         * @returns {undefined} No returns.
         */
        unloadScript: function (id) {
            var script = document.getElementById(id);
            if (script) {script.parentElement.removeChild(script);}
        },
        /**
         * @param {type} strModelId The Id of the Model whose scripts are to be loaded.
         * @returns {undefined} No returns.
         */
        loadViewScript: function (strModelId) {
            var script = document.createElement('script'),
                strSrc = getViewScriptPath(strModelId);
            script.id = strModelId;
            script.src = strSrc;
            document.head.appendChild(script);
        },
        /**
         * @param {type} strModelId The Id of the Model whose scripts are to be loaded.
         * @returns {undefined} No returns.
         */
        loadControllerScript: function (strModelId) {
            var script = document.createElement('script'),
                strSrc = getControllerScriptPath(strModelId);
            script.id = strModelId;
            script.src = strSrc;
            document.head.appendChild(script);
        },
        /**
         * @param {Object} err
         * @returns {undefined}
         */
        logError: function (err) {
            var //name = args.callee.name,
                //argsLen = args.length, i,
                msg = "";    
            //strErr += "\n Origin: " + name;
            //for (i = 0; i < argsLen; i++) {
            //    strErr += "\n Args" + i + ": " + args[i];            
            //}
            if (err instanceof TypeError) {
                // statements to handle TypeError exceptions
                msg += "Sorry, an error occurred (type).";
            } else if (err instanceof RangeError) {
                msg += "Sorry, an error occurred (range).";
            } else if (err instanceof EvalError) {
                msg += "Sorry, an unknown error occurred (eval).";
            } else {
               // statements to handle any unspecified exceptions
               msg += "Sorry, an error occurred.";
            }
            try {
                if (err.stack) {
                console.log(err.stack);
                if (ViewUtil) {
                    ViewUtil.feedback.push(err.stack, "err").give();
                } else {
                    console.log(err);
                }
            }
            } catch (err) {
                alert("service running error: " + err.stack);
            }
        },
        internet: function () {            
            return new Promise(function (res, rej) {
                var fetcher = new Fetcher(),
                    //rnd = Math.random(),
                    //file = "http://www.omazim.com/software/images/omazimstorefronts_logo.png",
                    //url = file + "?rnd=" + rnd,
                    prefix = "php/controls/s/",
                    q = "a=res&b=others&c=checklogo.png",
                    url = prefix + "getfile.php?" + q;
                fetcher.fetch(url, "blob")
                .then(function (resp) {
                    res(!!(resp));
                })
                .catch(function (err) {
                    res(false);
                });
            });
        }
    };