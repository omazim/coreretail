function buildDefs () {
    // definitions can be built from the database or from json from server.
    // if app is resuming, build from IDB, else fetch from server.
    // to build from idb:
    // try to open the database and read the modelnames store
    // if found, resume app by reading models.
    // if not found, could mean database does not exist. initialize app again.
    //      
    console.log("building defs...");        
    function fetchModels () {
        return new Promise(function (res, rej) {
            fetcher.fetch(url, "json")
            .then(populatePromises)
            .then(runPromises)
            .then(indexRows)
            .then(function () {
                //console.dir("after running promises: " + Def);
                res(def);
            })
            .catch(function (err) {
                console.log("getting modelnames failed in def build: " + err.stack); 
            });
        });
    }
    function populatePromises (json) {
        //console.dir(json);
        return new Promise(function (res, rej) {                
            // populate promises array.
            var promises = [];
            json.forEach(function (file) {
                promises.push(
                    new Promise(function (res, rej) {                        
                        var url = prefix + file,
                            modelname = file.replace(".json", "");
                        //console.log("populating: " + modelname);
                        fetcher.fetch(url, "json")
                        .then(function (json) {
                            Def[modelname] = json;
                            if (modelname === "ModelSQLs") {
                                console.dir(json);
                            }
                            res(Def[modelname]);
                        })
                        .catch(function (err) {
                            console.log("error in promise: " + err.stack);
                        });
                    })
                );
                files++;
            });                
            res(promises);
        });
    }
    function runPromises (promises) {
        //console.log(promises.length + " promised items");
        return Promise.all(promises);            
    }
    function indexRows () {
        /**
         * 
         * @param {type} rows
         * @param {type} tableName
         * @returns Promise
         */
        function objectify (rows, tableName) {
            if ("Rows" in rows) {return rows;}
            if (rows.length === 0) {return {Rows: rows};}            
            var tableId = (function () {
                var arr = ("Rows" in def[mtd])? def[mtd].Rows: def[mtd],
                    id = arr.first(function (t) {
                        //console.log(tableName + " = " + t.Name);
                        return (t.Name.replace("_", "") === tableName); 
                    });
                return (id)? id.Id: undefined;
                })();
            
            //console.log(tableName + " id: " + tableId);
            if (!tableId) {return {Rows: rows};}
            var fields = (function () {
                    var arr = ("Rows" in def[mfd])? def[mfd].Rows: def[mfd];
                    return arr.filter(function (field) {
                        return (field.TableId === tableId);
                    });                    
                })();
            //console.log(fields.length);
            //if (tableName === "ModelPageGroups" || tableName === "ModelPages") {
            //    console.log(fields);
            //}
            if (fields.length === 0) {return {Rows: rows};}
            //console.log("objectify " + tableName + " with " + rows.length + " rows");
            var isPk = true,        
                obj = {},
                //arrFields = Object.keys(rows[0]),
                getMainPpty = function (isPk) {
                    var ppty = (isPk)? "IsPK": "IsIndexed",
                        arr = [];
                    fields.forEach(function (field) {
                        if (field[ppty]) {arr.push(field.Name);}
                    });
                    // remove duplicates.
                    return arr.filter(function(elem, index, self) {
                        return (self.indexOf(elem) === index);
                    });
                },
                arrMainPpty = getMainPpty(isPk);
            // If table does not have a primary key,
            // switch to indexed fields.
            // On the otherhand,
            // if blnUnique = false, but the table does not have 
            // indexed fields.
            //console.log(tableName);
            if (tableName !== "Model_CommonFields") {
                if (arrMainPpty.length === 0) {
                    isPk = !isPk;
                    arrMainPpty = getMainPpty(isPk);
                }                
                if (arrMainPpty.length > 0) {
                    //sort property names alphabetically,
                    //so its sequence can always be intuitively known.
                    arrMainPpty.sort();
                    // Loop through the fields in the result set. 
                    // Use unique fields as the 1st property of the object.
                    // Other fields will be subproperties.
                    obj = setKey(rows, arrMainPpty, isPk, obj);
                }
            }
            // even if a definition does not have keys, it will still have its .Rows property.
            obj.Rows = rows;
            //if (tableName === "ModelPageGroups" || tableName === "ModelPages") {
            //    console.dir(obj);
            //}
            return obj;
        }        
        /**
        * @description Set chained property accessors for the rows of a database record.
        * @param {type} rows
        * @param {type} keys
        * @param {Boolean} isPk
        * @param {type} fields
        * @param {type} obj
        * @returns {undefined}
        */
        function setKey (rows, keys, isPk, obj) {
            /**
            * @description Set properties using index fields of a table on data rows.
            * @param {string} ppty Property name to be created.
            * @param {number} i The index of the temporary objects to create
            * the property on.
            * @returns {undefined}

            // Push original object as 1st item in array
            // create a property on this 1st item and make it an object also.
            // push it into 2nd place in array
            // create property on the 2nd item as another object
            // push it into 3rd place in array...
            // and so on until the last property in the chain is reached.
            // e.g, [o, o.a, o.a.b, o.a.b.c]
            // e.g, [o, o.a, o.a.b, o.a.b.c]
            // Always check first for the existence of the property before appending,
            // otherwise previous property could be overwritten.*/
            rows.forEach(function (row) {
                // Define them on obj.
                // if there are more than one, each subsequent field value becomes 
                // an object, which in turn is a property of the preceding field value.
                // e.g obj.a.b.c etc until all the fields that uniquely identify a
                // record are used up, then all other fields become sub properties.
                var ppty, key;
                if (isPk) {
                    keys.forEach(function (key) {
                        ppty = underScoredSpaces(row[key]);                        
                        obj[ppty] = row;
                    });
                } else {
                    // merge indexed field names with an underscore
                    key = keys.map(function (key) {
                        return row[key];
                    });
                    ppty = key.join("_");             
                    obj[ppty] = row;
                }
            });
            return obj;
        }
        /**
        * @description Replace any space with an underscore.
        * This is important as Object property names cannot have spaces.
        * @param {String} str
        * @returns {String}
        */
        function underScoredSpaces (str) {
            if (typeof str === "string") {str = str.replace(" ", "_");}
            return str;        
        }
        //console.log("ïndexing rows");
        var keys = Object.keys(def), mfd = "ModelFields", mtd = "ModelTables";
        //console.log("def[mfd] is array? " + Array.isArray(def[mfd]));
        //console.log("def[mtd] is array? " + Array.isArray(def[mtd]));
        def[mfd] = objectify(def[mfd], mfd);
        def[mtd] = objectify(def[mtd], mtd);
        return new Promise(function (res, rej) {
            try {
                keys.forEach(function (key, index) {
                    if (key === mfd || key === mtd) {return;}
                    var rows = def[key];
                    def[key] = objectify(rows, key);
                    //console.log(key);console.dir(def[key]);
                    //console.log(index + " " + keys.length);                    
                });
                res();
            } catch (err) {
                console.log(err.stack);
            }
        });
    }  
    
    var def = Def,
        prefix = "js/models/json/",
        files = 0,
        url = prefix + "modelnames.json",
        fetcher = new Fetcher(); 
    return new Promise(function (res, rej) {
        fetchModels()
        .then(function () {
            //console.log(Object.keys(def));
            //console.log(Object.keys(def).length + " | " + files);
            //console.dir(def.ModelTables);
            if (Object.keys(def).length === files) {
                console.log("resolved def");
                res(Def);
            }
        })
        .catch(function (err) {
            alert("error in def: " + err.stack);            
        }); 
    });
}