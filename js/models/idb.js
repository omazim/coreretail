"use strict";
/**
 * @description The following are properties and methods of idb
 * IDBDatabase
    Properties
        name
        objectStoreNames
        onabort
        onclose
        onerror
        onversionchange
        version
    Methods
        close()
        createObjectStore()
        deleteObjectStore()
        transaction()
    Inheritance:
        EventTarget
    Events
        upgradeneeded
        complete
        abort
        success
        error
        blocked
        versionchange
        close
 * @returns {undefined}
 */
/**
 * IDBObjectStore
    Properties
        autoIncrement
        indexNames
        keyPath
        name
        transaction
    Methods
        add()
        clear()
        count()
        createIndex()
        delete()
        deleteIndex()
        get()
        getAll()
        getAllKeys()
        getKey()
        index()
        openCursor()
        openKeyCursor()
        put()
 *
 */
/**
 * IDBIndex
    Properties
        isAutoLocale
        keyPath
        locale
        multiEntry
        name
        objectStore
        unique
    Methods
        count()
        get()
        getAll()
        getAllKeys()
        getKey()
        openCursor()
        openKeyCursor()
 * @type 
 */
/**
 * 
 * @returns {undefined|event.target.result|Store.db}
 */
function startIDB () {   
    /**
    * @description Return IndexedDb for the application.
    * @param {String} dbName 
    * @returns {IndexedDB}
    */
    function openDb (dbName) {
        /*if ('storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(({usage, quota}) => {
              console.log(`Using ${usage} out of ${quota} bytes.`);
            });
          }*/
        return new Promise(function (res, rej) {
            var request = window.indexedDB.open(dbName, newVersion);        
            request.onerror = function(event) {
                console.log("Why didn't you allow my web app to use IndexedDB?!");
                rej();
            };
            request.onsuccess = function(event) {
                me.db = event.target.result;
                console.log("success fired after opening.");
                //me.db.close();
                //console.log("db closed.");
                console.log("resolve by onsuccess");                
                res(event.target.result);
            };
            request.onupgradeneeded = function (event) {
                console.log("upgrade needed to version: " + newVersion);
                me.db = event.target.result;
                oldVersion = event.oldVersion;
                if (oldVersion < initVersion) {
                    initDb();
                    init = true;
                    Service.defModel.add = init;                    
                    //console.log("resolve by onupgradeneeded");
                    //console.dir(event.target.result);
                    //res(event.target.result);
                } else {
                    upgradeDb();
                    //res();
                }
            };
        });
    }
    function upgradeDb () {
        rebuildStores(getTodoStores());
    }
    function initDb () {
        buildStores();
    }
    function getFields (tableId) {
        return def.ModelFields.Rows.filter(function (field) {
            return (field.TableId === tableId);
        });
    }
    function createStore (profile) {
        var tableName = profile.name,
            storeNames = (profile.loggables.length === 0)?
                [tableName]: [tableName, tableName + "_Log"],
            keypath, autoincr, option;
        // determine keypath/autoincrement
        if (profile.pk) {
            keypath =  {keyPath: profile.pk};
        } else {
            autoincr = {autoIncrement: true};
        }
        // create the store(s)
        option = (keypath)? keypath: autoincr;   
        // typically, only one object store should be created per table name.
        // however, some tables have some of their fields set to "IsLoggable",
        // this means that the application will keep track of changes.
        // in such cases, the table has a "_Log" suffix appended to a second table
        // bearing same table name.
        // such a _Log suffixed table is made up of the same indexes.
        storeNames.forEach(function (storeName) {
            var store = me.db.createObjectStore(storeName, option);                
            createIndexes(store, profile);
        });
    }
    /**
     * 
     * @param {ObjectStore} store
     * @param {Object} profile
     * @returns {undefined}
     */
    function createIndexes (store, profile) {
        function byIndexNumber () {
            function create (arr, options) {
                var fields, name;
                // create indexes, (if any)
                switch (arr.length) {
                    case 0:
                        fields = "";
                        break;
                    case 1:
                        fields = arr[0].name;
                        options.unique = arr[0].IsUnique;
                        break;
                    default:
                        fields = arr.map(function (e) {
                            return e.name;
                        }); 
                        options.unique = true;
                }
                if (fields) {
                    name = (Array.isArray(fields))? fields.join("_"): fields;
                    //console.log("create " + name + " index for " + store.name);   
                    store.createIndex(name, fields, options);
                }
            }
            // it is important to sort the composite field names alphabetically
            // so that i can easily know what the index name is.
            var arr = [], indexGroup = 0, options = {multiEntry: false};
            profile.mpk.sort(function (a, b) {
                return TypeUtil.sortObject(a, b, "IndexNumber", false);
            }).forEach(function (mpk) {
                if (mpk.indexNumber !== indexGroup) {
                    //console.log("index group " + indexGroup + " push " + mpk.name);
                //} else{
                    //console.log("create by number: " + indexGroup);                    
                    if (arr.length > 0) {
                        //console.log(arr);
                        create(arr, options);
                        arr = [];
                    }
                    indexGroup = mpk.indexNumber;
                }
                arr.push(mpk);
            });
        }
        function bySearchTag () {
            var name = "SearchTags";
                /*fields = profile.fwcFields.map(function (field) {
                    return field.Name;
                });*/
            if (profile.fwc) {
                store.createIndex(name, name, {unique: false, multiEntry: true});
                console.log("create searchtag index for: " + store.name);
            }
        }
        try {
            byIndexNumber();
            bySearchTag();
        } catch (err) {
            console.log(err.stack);
        }
    }
    function recreateIndexes (storeObj, profile) {
        var store = me.db.transaction.objectStore(storeObj.name);
        store.createIndexes(store, profile);
    }
    function deleteIndexes (storeObj) {
        var store = me.db.objectStore(storeObj.name),
            indexNames = store.indexNames,
            len = indexNames.length;
        for (var i = 0; i < len; i++) {
            store.deleteIndex(indexNames.items(i));
        }
    }
    function profileField (field, profile) {
        // extract its single/composite primary key(s)
        if (field.IsPK && field.IsPKNominee) {profile.pk = field.Name;}
        if ((field.IsIndexed || field.IsPK) && !field.IsPKNominee) {
            // in my field defs,
            // IsIndexed means:
            // the field is part of a group of fields that uniquely identifies a record.
            // any field with IsIndexed = true should command a unique IDB index. 
            // IsIndexed and IsFullWildCard are mutually exclusive flags.
            profile.mpk.push({
                name: field.Name,
                indexNumber: field.IndexNumber
            });
        }
        if (field.IsFullWildCard) {
            profile.fwc = true;
            profile.fwcFields.push(field);
        }
        // logged fields
        if (field.IsLoggable) {
            profile.loggables.push(field.Name);
        }
    }
    function buildStores () {
        var storeNames = me.db.objectStoreNames;
        def.ModelTables.Rows.forEach(function (row) {
            if (storeNames.contains(row.Name)) {return;}
            if (row.Name.startsWith("Model_")) {
                //console.log("don't create store: " + row.Name);
                return;
            }
            //console.log("create store: " + row.Name);
            var tableId = row.Id,
                tableName = row.Name,
                profile = {
                    name: tableName,                    
                    pk: undefined, //primary key                    
                    mpk: [], //multiple primary key
                    fwc: false,
                    fwcFields: [], //full wildcards
                    loggables: [] // fields to be logged on each modificiation
                },
                fields = getFields(tableId);
            // check
            if (fields.length === 0) {return;}                
            // fields in table.
            fields.forEach(function (field) {profileField(field, profile);});
            createStore(profile);
            // save profile for later use in populating store with cutover data
            fieldProfile[row.Name] = profile;
        });
    }
    function rebuildStores (todoStores) {
        // a store is rebuilt when there's a change in field names
        // or in indexes.
        todoStores.forEach(function (storeObj) {
            var tableName = storeObj.name,
                tableId = tableName.Id,
                profile = {
                    name: tableName,
                    pk: undefined, //primary key                    
                    mpk: [], //multiple primary key
                    fwc: [], //full wildcards
                    loggables: [] // fields to be logged on each modificiation
                },
                fields = getFields(tableId),
                store;
            // check
            if (fields.length === 0) {return;}                
            // fields in table
            fields.forEach(function (field) {
                profileField(field, profile);
            });
            if (storeObj.isNew) {
                createStore(profile);
            } else {
                // for existing stores, if there are new fields
                // use cursor to loop through all records,
                // applying new field names by updating the record.
                // delete indexes,
                store = me.db.objectStore("tableName");
                if (storeObj.newFieldNames.length > 0) {
                    deleteIndexes(storeObj);
                    applyNewFieldNames(storeObj, fields);
                    recreateIndexes(storeObj, profile);
                }
            }
        });
    }
    /**
     * @param {ObjectStore} storeObj
     * @param {Object} fields description
     */
    function applyNewFieldNames (storeObj, fields) {
        function update (obj, cursor) {
            var update = cursor.update(obj);
            update.onsuccess = function() {
                console.log('apply field name changes worked!');
            };            
        }
        // a new field name could be as a result of
        // an addition or a modification of existing field name.    
        var storeName = storeObj.name,
            txn = me.db.transaction(storeObj.name, 'readwrite'),
            store = txn.objectStore(storeName),
            req = store.openCursor();
        req.onsuccess = function(event) {
            var cursor = event.target.result, obj, pptys;
            if (cursor) {
                obj = cursor.value;            
                // get all properties of the stored object.                
                pptys = Object.keys(obj);
                // loop thru array of old names of each field
                // apply field name changes on old field names
                // for every new field,
                // get its field definition
                // check if any of its old names is still in use on the cursor value
                // if found, copy its value onto the new property on the cursor value
                // delete the old property on the cursor by setting it to undefined.
                storeObj.newFieldNames.forEach(function (newFieldName) {
                    var field = fields.find(function (field) {
                            return (field.Name === newFieldName);
                        }),
                        obsPpty,
                        oldPptys = field.OldNames;
                    if (oldPptys) {
                        oldPptys = oldPptys.split(",");
                        pptys.forEach(function (ppty) {
                            // look in array for old field names in the store.
                            // there may have been multiple name changes before this
                            // device upgrades.
                            // so its necessary to iterate through all old names
                            // and only recognize the last old name as the obs ppty.
                            // e.g old names = [userid, userId, Id]
                            // new name = UserId.
                            // if device currently uses userid,
                            // and does not upgrade again until name changed to UserId,
                            // then whichever old name is in use is copied into new name
                            // and then deleted.
                            var indexOf = oldPptys.indexOf(ppty);
                            if (indexOf >= 0) {
                                obsPpty = oldPptys[indexOf].trim();
                                obj[newFieldName] = obj[obsPpty];
                                delete obj[obsPpty];
                                console.log("new name: " + newFieldName + " | obs name:" + obsPpty);
                            }
                        });
                    }
                });
                update(obj, cursor);
                cursor.continue();       
            }
        };
    }
    function getTodoStores () {
        var fields, storeNames = me.db.objectStoreNames,
            todoStores = [], obsStores = storeNames;            
        def.ModelTables.Rows.forEach(function (table) {
            var tableName = table.Name,
                obsFieldNames = getStoreFields(tableName),
                todoStore = {
                    isNew: false,
                    name: undefined,
                    newFieldNames: [],
                    obsFieldNames: []
                },
                store = me.db.objectStore(tableName),
                indexNames;
            // check for new store
            if (!me.db.objectStoreNames.contains(tableName)) {
                todoStore.isNew = true;                
            } else {
                // check for deprecated store by knocking off from array of existing ones.
                // whatever is left in the array is deprecated.
                obsStores.splice(obsStores.indexOf(tableName), 1);                
            }
            todoStore.name = tableName;            
            // loop thru def fields to check for changes.
            fields = def.ModelFields.Rows.filter(function (f) {                
                return (f.TableId === table.Id);
            });
            // assign store & indexes
            store = me.db.objectStore(tableName);
            indexNames = store.indexNames();
            fields.forEach(function (field, index) { 
                var store,
                    fieldName = field.Name,
                    last = (index + 1 === fields.length);
                // for existing stores,
                if (!todoStore.isNew && typeutil.toBln(field.Is)) {                    
                    // check for new fields
                    if (!inStore(store, fieldName)) {
                        todoStore.newFieldNames.push(fieldName);
                    } else {
                        // check for obsolete fields by knocking off from existing array.
                        obsFieldNames.splice(obsFieldNames.indexOf(fieldName), 1);
                    }
                    // capture obsolete fields
                    if (last) {todoStore.obsFieldNames = obsFieldNames;}
                }
            });
            // add to stores to work on.
            todoStores.push(todoStore);
        });
        return todoStores;
    }
    function getStoreFields (storeName) {
        var store = me.db.transaction(storeName).objectStore(storeName),
            field, arr = [];
        store.openCursor().onsuccess(function (event) {
            var cursor = event.target.result;
            if (cursor) {
                for (field in cursor.value) {
                    arr.push(field);
                }
            }
        });
        return arr;
    }
    /**
     * 
     * @param {ObjectStore} store
     * @param {String} fieldName
     * @returns {undefined}
     */
    function inStore (store, fieldName) {
        // if not found in store value's fields,
        // it means the field is new and should be added.
        var req = store.openCursor();
        req.onsuccess = function (event) {
            var cursor = event.request.result,
                field, absent = [];
            for (field in cursor.value) {
                if (field !== fieldName) {
                    // this means the fieldName is new.
                    absent.push(field);
                }
            }
            return (absent.length === 0);
        };
        /*dbPromise.then(function(db) {
            var tx = db.transaction('store', 'readonly');
            var store = tx.objectStore('store');
            return store.openCursor();
        }).then(function logItems(cursor) {
            if (!cursor) {return;}
            console.log('Cursored at:', cursor.key);
            for (var field in cursor.value) {
                console.log(cursor.value[field]);
            }
            return cursor.continue().then(logItems);
        }).then(function() {
            console.log('Done cursoring');
        });*/
    }
    function modifyIndex (store) {
        var storeNames = me.db.objectStoreNames;
        var myStore = null;

        if(storeNames.contains('myStoreName')) {
          myStore = event.target.transaction.objectStore('myStoreName');
        } else {
          //myStore = me.db.createObjectStore('myStoreName', ?);
        }

        var indexNames = myStore.indexNames;
        //var desiredKeyPathForMyIndex = ?;

        if(indexNames.contains('myIndexName')) {
          var myIndex = myStore.index('myIndexName');
          var currentKeyPath = myIndex.keyPath;
          if(currentKeyPath != desiredKeyPathForMyIndex) {
            myStore.deleteIndex('myIndexName');
            myStore.createIndex('myIndexName', desiredKeyPathForMyIndex);
          }
        } else {
          myStore.createIndex('myIndexName', desiredKeyPathForMyIndex);
        }
      }
    function update (list) {
        list.innerHTML = '';
        var transaction = me.db.transaction(['rushAlbumList'], 'readwrite');
        var objectStore = transaction.objectStore('rushAlbumList');

        objectStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                if(cursor.value.albumTitle === 'A farewell to kings') {
                    var updateData = cursor.value;

                    updateData.year = 2050;
                    var request = cursor.update(updateData);
                    request.onsuccess = function() {
                      console.log('A better album year?');
                    };
                }
                var listItem = document.createElement('li');
                    listItem.innerHTML = '<strong>' + cursor.value.albumTitle + '</strong>, ' + cursor.value.year;
                list.appendChild(listItem);   
                cursor.continue();        
            } else {
              console.log('Entries displayed.');         
            }
        };
    }
    function fetchData (cutover) {
        var getData = (cutover)? getCutoverData: getModelData,
            storeNames = me.db.objectStoreNames,
            promises = [];
        //console.log("storenames " + storeNames);
        Array(storeNames.length).fill({}).forEach(function (s, i) {
            var name = storeNames[i];
            if (name.startsWith("Model_")) {return;}
            promises.push(
                new Promise(function (res, rej) {
                    getData(name).then(function (data) {
                        if (data.length > 0) {
                            console.log("data got " + name);
                            storeData[name] = data || [];
                            console.dir(storeData[name]);
                            res(storeData[name]);
                        } else {
                            res();
                        }
                    }).catch(function (err) {
                        console.log("err creating & populating " + name + " \n" + err.stack);
                        return undefined;
                    });
                })
            );
        });
        //Promise.all(promises.map(p => p.catch(() => undefined)));
        return Promise.all(promises);
    }
    /**
     * 
     * @param {Array} storeData
     * @returns {undefined}
     */
    function endata (storeData) {
        //console.log("endataring");
        //console.dir(Object.keys(storeData));
        var storeNames = Object.keys(storeData),
            txn = me.db.transaction(storeNames, "readwrite");
        storeNames.forEach(function (storeName) {
            console.log("populating..." + storeName);
            var store = txn.objectStore([storeName], "readwrite"),            
                req,
                //searchFields = DefUtil.getTableFieldsOpt(storeName, {IsFullWildCard: true}),
                searchFields = fieldProfile[storeName].fwcFields,
                searchTag = !!(searchFields.length > 0);
            storeData[storeName].forEach(function (data) {
                //if (searchTag) {populateSearchTags(data, storeName, searchFields);}
                if (searchTag) {DataUtil.updateSearchTags(storeName, data, searchFields);}
                req = store.add(data).onsuccess = function (event) {
                    console.log("data added for " + storeName);
                };
            });
        });
        txn.oncomplete = function(event) {
            console.log("all stores' data populated successfully");
            console.log("def model add? " + init);
            if (Service.defModel.add) {
                saveDefModelsToIDB();
            }
        };
        txn.onerror = function(event) {
            console.log("txn: " + event.target);
        };
        txn.onabort = function(event) {
            console.log("txn aborted");
        };
    }
    function flagCutover (storeName, success) {
        if (typeof(Storage) !== undefined) {
            localStorage.setItem(storeName, (success)? 1: 0);
        }
    }
    /**
     * 
     * @param {type} tableName
     * @returns {Promise}
     */
    function getCutoverData (tableName) {        
        var fetcher = new Fetcher(),
            url = "./php/controls/s/fetcher.php?t=src&f=data&sf=cutover&b=" +
                tableName + "&ext=json";
        return new Promise(function (res, rej) {
            fetcher.fetch(url, "json").then(function (data) {            
                res(data);
            }).catch(function (err) {
                console.log("couldn't fetch cutover data for " + tableName + " " + err.stack);
                res([]);// resolve to empty array to avoid an error;
            });
        });
    }
    function getModelData (tableName) {
        return new Promise(function (res, rej) {
            res(def[tableName].Rows);
        });
    }
    function saveDefModelsToIDB () {
        var qm = new QueryMaker(IDXB),
            tableO = qm.getTO(),
            da = new DataAccess(qm.qO, CRDS, IDXB),
            fields = DefUtil.getTableFields(DefModels),
            modelNames = Def.ModelTables.Rows.filter(function (table) {
                return(table.Name.startsWith("Model_"));
            }).map(function (table) {
                return table.Name.replace("_","");
            });
        try {
            Service.defModel.models.DefModel = "DefModel";
            qm.qO.type = (Service.defModel.add)? 1: 3;
            tableO.name = DefModels;
            tableO.fields = fields.map(function (field) {
                return field.Name;
            }).concat(modelNames);
            tableO.fields.forEach(function (fieldName) {
                tableO.values.push(Service.defModel.models[fieldName]);
            });
            //console.log("tableO fields");console.dir(tableO.fields);
            tableO.action = (Service.defModel.add)? 1: 3;                    
            fields.forEach(function (field) {
                var l;
                if ((field.IsIndexed || field.IsPK || field.IsCompPK) && tableO.action === 3) {
                    l = tableO.where.and.length;
                    tableO.where.and.push({});                        
                    tableO.where.and[l] = {
                        tableName: DefModels,
                        fieldName: field.Name,
                        values: Service.defModel.models,
                        andors: 1,                            
                        operators: []
                    };
                }
            });
            qm.qO.tables.push(tableO);
            //console.log("@savedefmodelstoidb");console.dir(qm.qO);
            da = new DataAccess(qm.qO, CRDS, IDXB);
            da.access(false);
        } catch (err) {
            console.log(err.stack);
        }
        /*countReq = store.count();
        countReq.onsuccess = function(event) {
            if (event.target.result === 1) {
                tableO.action = 3;
                qm.qO.type = 3;
            } else {
                tableO.action = 1;
                qm.qO.type = 1;
            }        
            qm.qO.tables.push(tableO);
            da = new DataAccess(qm.qO, CRDS, IDXB);
            da.access(false);
        };*/
    }
    // not supported?
    if (!window.indexedDB) {return undefined;}
    //console.dir(Def);
    //console.log(Object.keys(Def.ModelTables));
    var def = Def,
        typeutil = TypeUtil,
        dbName = "CR",
        initVersion = 1,
        init = false,
        newVersion = (function () {
            def.ModelTables.Rows.sort(function (a, b) {
                return typeutil.sortObject(a, b, "Version", true);
            });
            return def.ModelTables.Rows[0].Version || initVersion;
        })(),
        oldVersion = newVersion,
        fieldProfile = {}, storeData = {},
        me = {db: {}};
    console.log("idb new version: " + newVersion);
    me.db.onerror = function(event) {
        // Generic error handler for all errors targeted at this database's
        // requests!
        console.log("Database error: " + event.target.errorCode);
    };
    return new Promise(function (res, rej) {
        openDb(dbName).then(function (db) {
            me.db = db;
            console.log("open db resolved.");
            console.dir(event.target.result);            
            //console.dir(fieldProfile);
            if (init) {
                var bln = !!(newVersion === 1);
                return fetchData(bln);
            } else {
                console.log("normal. no fetch needed.");
                return Promise.resolve(init);
            }
        }).then(function (init) {
            if (init) {
                console.log("all data fetched.");
                endata(storeData);
            } else {
                console.log("normal. no endata needed.");
            }
        }).then(function () {
            if (me.db) {
                IDB = me;
                res(IDB);
            }
        }).catch(function (err) {
            console.log("could not open idb successfully. " + err.stack);
        });
    });
}