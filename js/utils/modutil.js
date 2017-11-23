var ModUtil = (function () {
        var me = {
            /**
             * @function toSomeUpperCase
             * @param {String} str
             * @param {Number} int
             */
            toSomeUpperCase: function (str, int) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            },
            toSomeLowerCase: function (str, int) {
                return str.charAt(0).toLocaleLowerCase() + str.slice(1);
            },
            /**
            * @function filterObject
            * @description Returns only the arrays in a manifest that pass the filter.
            * @description The filter is flexible. 
            * @description Object whose properties correspond to Fields in manifested table.
            * @description As there can be any number of filters passed,
            * @description each property will be tested.
            * @description If true, the numeric flag is incremented by 1. If false, 0.
            * @description After each member test, if numeric flag matches property length,
            * @description then that array member is returned as having passed the filter.
            * @param {Array} manifest
            * @param {Object} filter
            * @param {String} sort
            * @param {Boolean} desc
            * @returns {Array}
            */
            filterObject: function (manifest, filter, sort, desc) {
                manifest = (Array.isArray(manifest))? manifest: manifest.Rows;
                var keys = Object.keys(filter), l = keys.length;
                return manifest.filter(function (row) {
                    var i, ppty, iFlag = 0;
                    for (i = 0; i < l; i++) {
                        ppty = keys[i];
                        if (typeof filter[ppty] === "boolean") {
                            if (TypeUtil.toBln(row[ppty]) === filter[ppty]) {
                                ++iFlag;
                            }
                        } else {
                            if (row[ppty] === filter[ppty]) {
                                ++iFlag;
                            }
                        }
                    }
                    if (iFlag === l) {return row;}
                }).sort(function (a, b) {
                    return TypeUtil.sortObject(a, b, sort, desc);
                });
            },
            /**
            * @function guessId
            * @description When you don't know the Id of an element,
            * @description pass a known part and wait for a reply.
            * @param {String} like Part or all of the Id being sought
            * @param {String} use Class or Tag
            * @param {String} within The tags to seek in.
            * @returns {String} The Id of the element being sought
            * 
           */
            guessId: function (like, use, within) {
                var nodes = (use === "class")? doc.getElementsByClassName(within):
                    doc.getElementsByTagName(within),
                    id, i, l = nodes.length,
                    values, found;
                for (i = 0; i < l; i++) {
                    id = nodes[i].id;
                    values = [];
                    values.push(me.htmlFormat.getNamePartFromId(id));
                    values.push(me.htmlFormat.getRolePartFromId(id));
                    values.push(me.htmlFormat.getSMIdPartFromId(id));
                    found = 0;
                    values.forEach(function (val) {
                        if (val) {
                            if (like.indexOf(val) > -1) {
                                ++found;
                            }
                        }
                    });                
                    if (found > 0) return id; 
                }
            },
            /**
             * 
             * @param {String} singular
             * @param {String} lastChar
             * @returns {String}
             */
            getPlural: function (singular, lastChar) {
                var l = singular.length,
                    trimmed = singular.substring(0, l - 1);
                switch (lastChar) {
                case "y":
                    return trimmed + "ies";
                    break;
                case "s":
                    return singular + "'";
                    break;
                Default:
                    return singular + "s";
                }
            },
            purgeDuplicates: function (arr) {
                /*arr.sort().reduce(function (a, b) {
                    if (b !== a[0]) {
                        a.unshift(b);
                    }
                    return a ;
                }, []);*/
                //return Array.from(new Set(arr));
                return arr.filter(function(elem, index, self) {
                    return (self.indexOf(elem) === index);
                });
            },
            /**
            * 
            * @param {Object} manifest
            * @param {String} tableName
            * @returns {Boolean}
            */
            preChecks: function (manifest, tableName, data) {
                var checks = [], blns = [], msgs = [], i, l,
                    table = data(manifest, msgs);
                checks = table[tableName]();
                l = checks.length;
                for (i = 0; i < l; i++) {
                    if (checks[i]()) {
                        blns.push(true);
                    } else {
                        me.util.feedback(msgs[i], "warn");
                        break;
                    }
                }
                return (blns.length === checks.length)? true: false;
            },     
            _page: {
                /**
                * @function load
                * @description Load menu script(s).
                * @param {String} sm e.g Checkout (as in Sales.Checkout)
                * @returns {unDefined}
                */
                load: function (pageName) {
                    // if already loaded, ignore.
                    if (!App[pageName]) {
                        App[pageName] = {};    
                        Service.loadScript(pageName, Service.appScriptPath);
                    } else {
                        try {
                            App[pageName].util.init();
                        } catch (err) {
                            Service.logError(err);
                        }
                    }
                },
                /**
                * @function unload
                * @description Load menu script(s).
                * @param {String} sm
                * @returns {unDefined}
                */
                unload: function (pageName) {
                    delete App[pageName];
                    //alert(Model.state.activePages.length + " active pages on UNload.");
                }                
            },
            page: {
                /**
                * @description Load menu script(s).
                * @param {String} sm e.g Checkout (as in Sales.Checkout)
                * @param {Boolean} noform 
                * @returns {unDefined}
                */
                load: function (pageName, noform) {
                    return new Promise(function (res, rej) {
                        var pageId = Def.ModelPages[pageName].Id,
                            pgId = Def.ModelPages[pageName].PageGroupId,
                            pgName = Def.ModelPageGroups[pgId].Name,
                            src = Service.submodelScriptPath;
                        Service.loadScriptAsync(pgName, src).then(function (bln) {
                            var fn, submodel, page;
                            if (bln) {
                                fn = window[pgName];
                                submodel = new fn(pageId);
                                //console.log(pgName + " in window? " + window[pgName]);  
                                page = new PageModel(pageId, submodel, noform);                                
                                res(page);
                            } else {
                                console.log(pgName + " error loading!");
                                rej();
                            }                            
                        }).catch (function (err) {
                            Service.logError(err);
                        });
                    });
                },
                /**
                * @description Load menu script(s).
                * @param {String} sm
                * @returns {unDefined}
                */
                unload: function (pageName) {
                    delete App[pageName];
                    //alert(Model.state.activePages.length + " active pages on UNload.");
                },
                getSubModel: function (pageId) {
                    
                }
            }
        };
        return me;
    })();