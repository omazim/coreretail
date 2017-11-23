"use strict";
/**
 * 
 * @param {Object} qO
 * @param {String} name name of indexed db
 * @param {Boolean} idb deal with indexed db or with sqlite?
 * @returns {DataAccess}
 */
function DataAccess (qO, name, idb) {
    this.qO = qO;
    this.name = name;
    this.idb = !!(idb);
    this.version = 0;
    this.db;    
}
DataAccess.prototype = {
    constructor: DataAccess,
    connect: function () {
        var req = window.indexedDB.open(this.name), that = this;
        return new Promise(function (res, rej) {
            req.onsuccess = function (event) {        
                that.db = event.target.result;
                //console.log("db connected " + that.name);
                res(that.db);
            };
            req.onerror = function (event) {
                //console.log("error connecting to " + that.name);
                rej();
                ViewUtil.feedback.give({
                    msg: "Sorry, there was an error connecting to the database",
                    type: "err"
                });//String (ok | warn | err | info | norm)});
            };
        });
    },
    /**
     * @param {Boolean} doread    
     * @param {Boolean | Function} arg    
     * @returns {Promise}
     */
    access: function (doread, arg) {
        var that = this;
        return new Promise(function (res, rej) {
            that.connect().then(function () {
                var meth = (doread)? "read": "write"; 
                return Promise.resolve(that[meth](arg));
            }).then(function (recs) {
                if (!recs || !Array.isArray(recs)) {
                    return Promise.resolve([]);
                }
                if (recs.length === 0) {return Promise.resolve([]);}
                var meth = ("then" in recs[0])? "all": "resolve";
                return Promise[meth](recs);
            }).then(function (recs) {
                res(recs);
            }).catch(function (err) {
                res([]);// resolve to empty array so that there's no error propagated.
                Service.logError(err);
            });
        });
    },
    countRecords: function (storeName) {
        var that = this;
        if (this.idb) {
            
        return new Promise(function (res, rej) {
            that.connect().then(function () {
                var meth = (doread)? "read": "write"; 
                return Promise.resolve(that[meth](arg));
            }).then(function (recs) {
                if (!recs || !Array.isArray(recs)) {
                    return Promise.resolve([]);
                }
                if (recs.length === 0) {return Promise.resolve([]);}
                var meth = ("then" in recs[0])? "all": "resolve";
                return Promise[meth](recs);
            }).then(function (recs) {
                res(recs);
            }).catch(function (err) {
                res([]);// resolve to empty array so that there's no error propagated.
                Service.logError(err);
            });
        });
    }
    },
    /**
     * @description Use this to test for initialization or resumption.
     * @returns {undefined}
     */
    exists: function () {
        // if an upgradeneeded event is fired, this means the database does not exist!
        var req, name, that = this;
        if (!this.idb) {return true;}
        return new Promise(function (res, rej) {
            req = window.indexedDB.open(name);
            // if an upgradeneeded event is fired, this means the database does not exist!
            req.onupgradeneeded = function (event) {
                this.version = req.result.version;
            };
            req.onsuccess = function (event) {
                req.result.close();
                // resolve here to true or false, depending on whether v is negative.
                // even though this creates the database if it didn't exist,
                // as there is no onupgradeneeded handler, nothing will happen next.
                // when startIDB is run, the version will be incremented on open.
                // this version will be known from localStorage.
                localStorage.setItem("CRDSv", that.version);
                res(that.version < 1);
            };
        });        
    },
    run: function (cb) {
        if (this.idb) {
            runIDB(cb);
        } else {
            runSQL(cb);
        }
    },    
    runIDB: function (lookup) {
        if (this.qO.type === 2) {
            this.readIDB(lookup);
        } else {
            this.writeIDB(cb);
        }
    },
    runSQL: function (lookup) {
        if (this.qO.type === 2) {
            this.readSQL(lookup);
        } else {
            this.writeSQL(cb);
        }
    },    
    read: function (lookup) {
        if (this.idb) {
            return this.readIDB(lookup);
        } else {
            return this.readSQL();
        }
    },
    write: function () {
        if (this.idb) {
            return this.writeIDB();
        } else {
            return this.writeSQL(cb);
        }
    },
    /**
     * 
     * @param {Boolean} isLookup
     * @returns {Promise}
     */
    readIDB: function (isLookup) {
        function getTableCriteria (storeName, and) {
            var criteria = [], ppty = (and)? "and": "or";
            if (that.qO.where[ppty]) {
                criteria = that.qO.where[ppty].filter(function (o) {                    
                    return (o.tableName === storeName);
                });
            }
            return criteria;
        }
        function passCriteria (record, criteria) {
            function test (value, op, i) {
                var passed = false,
                    // convert to string (conditionally) to aid case-insensitivity.
                    criteria = (typeof value === "string")? 
                        value.toLocaleLowerCase(): value;
                // data that passes the test cases below is added to a temp array.
                switch (op) {                    
                case -1:// less than. applies to: numbers & dates
                    passed = !!(data < criteria);
                    break;
                case -2:// less than or equal to. applies to: numbers & dates
                    passed = !!(data <= criteria);
                    break;
                case 0:// strictly equal to.
                    passed = !!(data === criteria);
                    break;
                case 1:// greater than. applies to: numbers & dates
                    passed = !!(data > criteria);
                    break;
                case 2:// greater than or equal to. applies to: numbers & dates
                    passed = !!(data >= criteria);
                    break;
                case null:
                case undefined:
                default:// like, contains, index of
                    passed = !!(data.indexOf(criteria) >= 0);
                }
                //console.log(i + ": " + data + " " + op + " " + criteria + "? " + passed);
                return passed;
            } 
            function applyLogical (temps) {
                // if andor is 'And'  i.e 1, then the record must pass all tests.
                // i.e the record will have as many trues in temps as values.
                // if andor is or i.e 0, then any true occurrence is enough to pass.
                return (andor === 1)? (temps.length === values.length): (temps.length > 0);
            }
            //console.log("record vs criteria");console.dir(record);console.dir(criteria);
            var fieldName = criteria.fieldName,
                // values must be an array.
                values = (Array.isArray(criteria.values))? criteria.values:
                    [criteria.values],
                andor = (criteria.andor === undefined)? 0: criteria.andor,
                operators = criteria.operators || [],// (<, >, =, like)
                temps = [],
                // for case-insensitivity, convert data to lowercase.
                data = (typeof record[fieldName] === "string")?
                    record[fieldName].toLocaleLowerCase(): record[fieldName];
            values.forEach(function (value, index) {
                // operators should be the same length as values
                // so each value has a corresponding equality logic to apply.
                // null operation means strictly equal.
                var op = (operators.length > 0)? operators[index]: null,
                    pass = test(value, op, index);
                // add to array if it passed the test.
                if (pass) {temps.push(pass);}          
            });
            return applyLogical(temps);
        }
        function inspectCursor (event, storeName, ands, ors) {            
            return new Promise(function (res, rej) {
                var cursor = event.target.result,
                    passedRecs = [], record,
                    passedAnds = !!(ors.length === 0),
                    passedOrs = !!(ands.length === 0),
                    passAll = (passedAnds && passedOrs);
                // apply criteria tests on each record
                if (cursor) {                    
                    record = cursor.value;
                    if (!passAll) {
                        ands.forEach(function (and) {
                            passedAnds = passCriteria(record, and);
                        });
                        ors.forEach(function (or) {
                            passedOrs = passCriteria(record, or);
                        });
                    }
                    if (passedAnds || passedOrs) {
                        //console.log("passed: ");
                        passedRecs.push(record);
                        qCursor[storeName].push(record);
                    } else {
                        //console.log("failed: ");                        
                    }
                    //console.log(record);
                    cursor.continue();
                } else {                    
                    //console.log("resolved " + storeName + " to " + qCursor[storeName].length+ " records.");
                    console.dir(qCursor[storeName]);
                    res(qCursor[storeName]);           
                }
            });
        } 
        function wildcardCursor (event, storeName, ands) {
            // the way lookup works:
            // criteria in ors array is used to pull up records from the searchtags index.
            // the criteria in the ands array are expected to be dates and/or numbers,
            // therefore they will be used during cursor inspection.
            // dates/numbers fields can be flagged as full wildcards,
            // causing them to be included in the searchtags index,
            // sadly, this might increase size of db by creating more indexed records.
            // so, better to use dates/numbers in cursor inspection instead.
            return new Promise(function (res, rej) {
                var cursor = event.target.result,
                    passedRecs = [], record,
                    passedAnds = !!(ands.length === 0),
                    passAll = passedAnds;
                if (cursor) {
                    record = cursor.value;
                    // now apply the ands inspection (if any).
                    if (!passAll) {
                        ands.forEach(function (and) {
                            passedAnds = passCriteria(record, and);
                        });
                    }
                    if (passAll) {
                        passedRecs.push(record);
                        //console.log("passed");                        
                        qCursor[storeName].push(record);
                    } else {
                        //console.log("failed") ;
                    }
                    //console.log(record);
                    cursor.continue();
                } else {                    
                    //console.log("res " + storeName + " to " + passedRecs.length+ " records.");
                    res(qCursor[storeName].concat(passedRecs));
                }
            });            
        }        
        //console.log("qO");
        //console.log(this.qO);
        var that = this,
            storeNames = this.getTxnStoreNames(),
            txn = this.db.transaction(storeNames, 'readonly'), // passive error here...?  
            // there should be as many open cursors as there are stores in the query.
            //cursors = Array(storeNames.length).fill(),
            qCursor = {};
        return new Promise(function (res, rej) {
            // table & store are used interchangeably.
            // reading is simple, if it involves only one store.
            // with joins on multiple stores, its complex, but we can break it down.
            // 1. determine the primary store to read from.
            // this will be the first table in the array.
            // 2. read from the first table first using a cursor.
            // we use a cursor to apply selection logic on each record prior to selecting it.
            // 3. for each qualifying record, drop it into a result array.
            // 4. after cursor is done, move to next table until all tables are iterated.
            // 5. now look in the result array to apply the join logic.
            // apply joins by adding properties of the paired table to the primary result.
            // if there's an existing property with same name,
            // the property with an Origin = true flag overwrites the other.
            // iterate over all other paired tables in the result array. 
            // if any pair is incomplete, use the only table in the pair.
            // all joined records are done on the primary table.
            // finally, do any ordering by property(ies) specified.
            // If it’s successful, update our form fields.
            // 
            // 2. open cursors for as many tables as there are in the query.
            storeNames.forEach(function (name) {
                var store = txn.objectStore(name),
                    ands = getTableCriteria(name, true),
                    ors = getTableCriteria(name, false),
                    index, wildcardTags;
                qCursor[name] = [];
                // NOTE:
                // check if the store has an index named by a union of fields (f1_f2).
                // e.g when pulling up Shops s user is assigned to,
                // the sql definition joins UserShops & Shops.
                // in the UserShops store, there's a ShopId_UserId index.
                // so, if a field in the join is part of the index name, 
                // open cursor on the index instead, 
                // use idbkeyrange.only, because the index will always be an array.
                // i.e multientry = true.
                
                // if there's no criteria specified, add all records.
                if (ands.length === 0 && ors.length === 0) {
                    store.getAll().onsuccess = function (event) {                        
                        qCursor[name] = event.target.result;
                      //console.log(i + ": add all " + qCursor[name].length + ": " + name);
                      //console.log(qCursor[name]);
                    };
                } else {                    
                    if (isLookup) {
                        index = store.index("SearchTags");
                        // lookup tags are derived from ors array.
                        // sometimes, user may enter more than 1 lookup tag.
                        // in which case, the lookup tags have to be iterated
                        // in indexed db, such is the architecture of the idbkeyrange.only.
                        // if not iterated, none of the wildcards will match in the index.
                        wildcardTags = that.getWildCardTags(ors);
                        wildcardTags.split(",").forEach(function (wctag) {
                            var range = IDBKeyRange.only(wctag);
                            //console.log("applying sarchtag: " + wctag + " on " + name);
                            //console.log(wctag);
                            index.openCursor(range).onsuccess = function (event) {
                                wildcardCursor(event, name, ands, ors).catch(function (err) {
                                    //console.log(err.stack);
                                });
                            };
                        });
                    } else {
                        //console.log("applying criteria to: " + name);
                        store.openCursor().onsuccess = function (event) {
                            // define on qCursors all records that met the criteria.
                            inspectCursor(event, name, ands, ors).catch(function (err) {
                                //console.log(err.stack);
                            });
                        };
                    }
                }
            });
            // this will fire when all requests for all transacted stores have cursored. 
            txn.oncomplete = function (event) {
                var records = [];
                //qO.joins is always an array, as long as the qO was derived from a querymaker.
                // use length check alone to determine whether to performa join or not.
                if (that.qO.joins.length > 0) {
                    that.join(qCursor).then(function (recs) {
                        records = recs;
                        //console.log("joins performed: ");
                        //console.log(records);                        
                        res(records);
                    }).catch(function (err) {
                        res([]);
                        //console.log("error occurred while performing joins: " + err.stack);
                    });                    
                } else {
                    //console.log("no joins");
                    Object.keys(qCursor).forEach(function (storeName) {
                        //console.log("storeName");//console.log(qCursor[storeName]);
                        records = records.concat(qCursor[storeName]);                      
                    });
                    res(records);
                    //console.log(records);
                }                
                that.db.close(); 
            };
        });
    },
    readSQL: function (cb) {
        function run () {
            try {
                db.all(sql, cb);
            } catch (err) {
                Service.logError(err);            
            }
        }        
        function selectClause (o) {
            var str = "", table = o.name;
            // if fields are not populated, fetch them using lookup property.
            if (!o.fields) {o.fields = [];}
            if (o.fields.length === 0) {
                if (o.lookup === 1) {
                    return "*";
                } else {
                    o.fields = db.getTableFields(table, o.lookup);
                }
            }
            o.fields.forEach(function (field, i) {
                // format = table.field AS table_field
                // this is useful for queries that select similar fields in different tables
                //str += (i === 0)? table + "." + field: ", " + table + "." + field;
                var comma = (i === 0)? "": ", ";
                str += comma + table + "." + field + " AS " + table + "_" + field;
            });
            return str;
        }
        
        var db = this.db,
            i, l = this.qO.tables.length, tableName,
            sql = "", select = "", from = "", where = "", orderBy = "";
        // loop through the tables.
        for (i = 0; i < l; i++) {
            tableName = qO.tables[i].name;
            // resolve the table name. A table id or name may be supplied.
            // if no table, skip
            if (!tableName) {continue;}

            // SELECT clause.
            if (i > 0) {select += ", ";}
            select += selectClause(qO.tables[i]);                                
        }
        try {
            if (select !== "") {
                select = "SELECT " + select;
            } else {
                throw " No tables were specified!";
            }
            // FROM clause.
            from = this.fromClause(qO);
            if (!from) {
                throw " No tables were specified!";
            }
            // WHERE clause
            where = this.whereClause(qO);                                                
            // ORDER clause.                
            orderBy = this.orderClause(qO);
            // concatenate sql
            sql = select + from + where + orderBy + ";";
        } catch (err) {
            //console.log(err.stack);
            Service.logError(err);
        }
        finally {
            run();
        }
    },
    writeIDB: function () {
        function run (table) {
            var storeName = table.name,                
                obj = make(table),
                meth = !!(table.action === 1 || table.action === 3 || table.action === 4),
                // ud = updateDelete
                ud = !!(table.action === 3 || table.action === 4);
            return new Promise(function (res, rej) {
                if (!meth) {res(); return;}
                if (!obj === 0) {rej(); return;}
                if (Object.keys(obj) === 0) {rej(); return;}
                var store = txn.objectStore(storeName),
                    isauto = store.autoIncrement,
                    kp = store.keyPath,
                    kpv = obj[kp] || null,
                    indexes = store.indexNames,
                    uindex, ukp, ukpv = [], req;                
                // if a store has kp, easy...use it.
                // if auto incremented, then get the store's indexes.
                // look for its first unique index (every unkeyed store must have one).
                // use this unique index in finding the record to update or delete.
                // the target object must have the index properties of this index on it.
                if (isauto) {
                    Array(indexes.length).fill("x").first(function (x, i) {
                        if (indexes[i].unique) {
                            uindex = i;
                            return true;
                        }
                    });
                    if (uindex) {
                        // there's a unique index.
                        uindex = indexes[uindex];                        
                        uindex = store.index(uindex);
                        ukp = uindex.keyPath;
                        if (Array.isArray(ukp)) {
                            ukp.forEach(function (kp) {
                                ukpv.push(obj[kp]);
                            });
                            ukpv = ukpv.split(",");
                        } else {
                            ukpv = obj[ukp];
                        }
                        uindex.onsuccess = function (event) {
                            res();
                        };
                    }
                }                                
                if (ud) {
                    if (table.action === 3) {
                        if (kpv) {
                            req = store.put(obj, ukpv);
                        } else if (ukpv) {
                            req = uindex.put(obj, ukpv);
                        }
                    } else if (table.action === 4) {
                        if (kpv) {
                            req = store.delete(kpv);
                        } else if (ukpv) {
                            req = uindex.delete(ukpv);
                        }
                    } 
                } else {
                    console.log("storename: " + storeName);
                    console.log("obj to add: ");console.dir(obj);
                    req = store.add(obj);
                }
                req.onsuccess = function (event) {
                    res();
                };
            });
        }
        function make (table) {
            var obj = {};
            table.fields.forEach(function (field, i) {
                obj[field] = table.values[i];
            });
            // update its searchTags
            that.updateSearchTags(table.name, obj);
            return obj;
        }
        var that = this, storeNames = this.getTxnStoreNames(),
            txn = this.db.transaction(storeNames, "readwrite"),
            promises = [];
        txn.oncomplete = function () {console.log("txn complete!");};
        this.qO.tables.forEach(function (table) {  
            // if its an update statement, splice out index/pk fields/values.
            // because primary key/composite index fields cannot be changed.
            promises.push(Promise.resolve(run(table)));            
        });
        return Promise.all(promises).then(function () {
            return true;
        }).catch(function (err) {            
            Service.logError(err);
            return false;
        });
    },
    /**
     * @description Insert, Update or Delete statements.
     * @param {Function} cb
     * @returns {Undefined}
     */
    writeSQL: function (cb) {
        function run () {
            // run the sql as a transaction.
            var mysql = "BEGIN TRANSACTION;";
            //console.log("ACTION SQL: " + mysql);
            try {
                /*sql.forEach(function (statement) {
                    var sql = statement.sql, param = statement.param || [];
                    //console.log("action sql: " + sql + param.join(","));
                    that.db.run(sql, param, cb);
                });*/
                sql.forEach(function (statement, index, that) {
                    mysql += statement.sql + ";";
                    //console.log(statement.sql);
                    mysql += (index + 1 === that.length)? " COMMIT TRANSACTION;": "";
                    if (index + 1 === that.length){
                        //console.log(" COMMIT TRANSACTION;");
                    }
                });
                db.exec(mysql, callback);
            } catch (err) {
                Model.state.currPage.gView.util.feedback("Sorry, something went wrong while saving your work. Please try again.", "err");
                Service.logError(err);
            }
        }        
        function getInsert (args) {
            var statement = {};
            if (!args.fields || !args.values || !args.tableName) {return;}

            statement.sql = "INSERT OR ROLLBACK INTO " + args.tableName;
            // fields
            statement.sql += " (" + args.fields.join(", ") + ")";
            // values                
            statement.sql += " VALUES(" + args.values.join(", ");
            statement.sql += ")";
            statement.param = [];
            return statement;
        }
        function getUpdate (args) {
            var statement = {};
            if (!args.fields || !args.values || !args.tableName) {return;}
            statement.sql = "UPDATE OR ROLLBACK " + args.tableName + " SET ";
            // fields
            args.fields.forEach(function (field, index) {
                //statement.sql += field + " = ?";
                var comma = (index > 0)? ", ": "";
                statement.sql += comma + field + " = " + args.values[index];
            });
            // criteria
            statement.sql += that.whereClause(args);
            // values
            statement.param = args.values;
            return statement;
        }
        function getDelete (args) {
            var statement = {};
            if (!args.fields || !args.values || !args.tableName) {return;}
            statement.sql = "DELETE FROM " + args.tableName;
            // criteria
            statement.sql += that.whereClause(args);
            return statement;
        }

        var that = this, db = this.db,
            sql = [], statement = {},
            callback = function (err, rows) {
                if (err) {
                    Service.logError(err);
                    rows = null;// still run the callback, but without args.
                }
                if (typeof cb === "function") {
                    if (err) {
                        alert("err stack: " + err.stack);
                    }

                    //alert(typeof err + " " + typeof rows);
                    //alert(Boolean(err === null) + " " + Boolean(rows === null));
                    if (err !== null) {
                        that.db.close();
                        that.db = Service.getDb();
                    }                    
                    return cb(err);
                } else {
                    return rows;
                }
            };
        this.qO.tables.forEach(function (table) {                
            // if its an update statement, splice out index/pk fields/values.
            // because primary key/composite index fields cannot be changed.
            if (table.action === 3) {
                table.indexes.forEach(function (bln, index) {
                    if (bln) {
                        table.fields.splice(index, 1);
                        table.values.splice(index, 1);
                    }
                 });
            }
            try {
                var args = {
                        tableName: table.name,
                        clause: (table.action === 3)? "UPDATE":
                            (table.action === 1)? "INSERT":
                            (table.action === 4)? "DELETE": "",
                        fields: table.fields,
                        values: (function () {
                            var arr = [], q;
                            table.values.forEach(function (v) {
                                // NOTE: as sqlite3 does not have a primitive boolean type,
                                // we have to convert all booleans to stringy booleans
                                // i.e true becomes "TRUE" & false becomes "FALSE"
                                v = (typeof v === "boolean")? v.toString(): v;
                                q = TypeUtil.quoteString[typeof v];
                                arr.push(q + v + q);
                            });
                            return arr;
                        })(),
                        where: table.where
                    };
                switch (args.clause) {
                    case "INSERT":
                        statement = getInsert(args);
                        break;
                    case "UPDATE":
                        statement = getUpdate(args);
                        break;
                    case "DELETE":
                        statement = getDelete(args);
                        break;
                    default:
                        statement = undefined;
                }
                if (statement) {sql.push(statement);}
            } catch (err) {
                //console.log(err.stack);
            }
        });
        run();
    },
    join: function (qCursor) {        
        function joinRecord (aRec, bRec, aTable, bTable, aField, bField, type) {
            // join bRec to aRec using the join type defined on join.
            // if join has same keys as prev,
            // consult Models to determine which ppty to overwrite.
            if (aRec[aField] === bRec[bField]) {
                switch (type) {// left join
                case -1:
                case 0:// inner join
                    joined.curr.push(mergeProperties(aRec, bRec, aTable, bTable));
                    break;
                case 1:// right join. notice the reversal in args precedence.
                    joined.curr.push(mergeProperties(bRec, aRec, bTable, aTable));
                }
            } else {
                switch (type) {// left join
                case -1:
                    joined.curr.push(aRec);
                    break;
                case 0:// inner join...no action
                    break;
                case 1:// right join. notice the reversal in args precedence.
                    joined.curr.push(bRec);
                }
            }
        }
        function joinEmptyRecord (aRec, aTable, bTable, aField, bField) {
            return new Promise(function (res, rej) {
                var bRec,
                    txn = that.db.transaction([bTable], "readonly"),
                    store = txn.objectStore(bTable),
                    keyPath = store.keyPath;
                if (keyPath.indexOf(bField) >= 0) {
                    store.get(aRec[aField]).onsuccess = function (event) {
                        bRec = event.target.result;
                        //console.log("join empty " + bField + " to " + aField);
                        console.dir(bRec);
                        //res(mergeProperties(aRec, bRec, aTable, bTable));
                    };
                }
                txn.oncomplete = function (event) {
                    res(mergeProperties(aRec, bRec, aTable, bTable));
                };
            });
        }
        function mergeProperties (aRec, bRec, aTable, bTable) {
            var aPptys = Object.keys(aRec),
                bPptys = Object.keys(bRec),
                jRec = {};// joined record.
            // make new joined rec from a.
            aPptys.forEach(function (ppty) {
                jRec[ppty] = aRec[ppty];
            });
            // then define all b's properties on the new joined record (if it doesn't exist).
            // if it already exists, let the property from table of origin override the other.
            //console.log(bPptys.length + " bPptys on " + bTable);
            bPptys.forEach(function (ppty) {
                if (aPptys.indexOf(ppty) < 0) {// not captured
                    //console.log("capture " + ppty + " onto " + aTable);
                    jRec[ppty] = bRec[ppty];
                } else {// captured,
                    //console.log(ppty + " already captured on " +  aTable); 
                    // consult modeldefs to determine which ppty to overwrite.
                    // use the property that is original on the table.
                    var aIsArray = Array.isArray(aTable),
                        jFieldId = (aIsArray)? null:
                            DefUtil.getFieldIdByNameAndTable(ppty, aTable),
                        bFieldId = DefUtil.getFieldIdByNameAndTable(ppty, bTable);
                    if (Def.ModelFields[bFieldId].IsOrigin) {
                        jRec[ppty] = bRec[ppty];
                    } else {
                        if (aIsArray) {
                            aTable.first(function (table) {
                                jFieldId =
                                    Defutil.getFieldIdByNameAndTable(ppty, table);
                                if (Def.ModelFields[jFieldId].IsOrigin) {
                                    jRec[ppty] = bRec[ppty];
                                    return true;
                                }
                            });
                        } else {
                            if ((jRec[ppty] === null || jRec[ppty] === undefined) &&
                            bRec[ppty] !== null && bRec[ppty] !== undefined) {
                                jRec[ppty] = bRec[ppty];
                            }
                        }
                    }
                }
            });
            return jRec;
        }
        /*
        // this holds all records from all stores that passed its store's criteria.
        // perform joins on all records.
        // join object has the following signature
        //{
        //  tableNames: [],// e.g [customers, salescart],
        //  fieldNames: undefined,// e.g customerId,
        //  type: 0,// 0=inner, -1=left, 1=right.
        //  prevFieldName: undefined,// e.g barcode
        //  prevType: 0
        //}*/
        var that = this,
            joined = {
                recs: [],
                curr: [],
                tableNames: [],
                fieldName: undefined
            };      
        return new Promise(function (res, rej) {            
            that.qO.joins.forEach(function (join) {
                var aTable = join.tableNames[0],                    
                    aField = join.fieldNames[0],
                    bTable = join.tableNames[1],
                    bField = join.fieldNames[1] || join.fieldNames[0],
                    type = join.type,
                    aRecs = qCursor[aTable],
                    bRecs = (bTable)? qCursor[bTable]: undefined;
                // include the tables in this pair as previous tables.
                console.dir(aRecs);console.dir(bRecs);
                joined.tableNames.push(aTable);
                joined.fieldName = aField;
                joined.curr = [];
                if (bTable) {joined.tableNames.push(bTable);}
                // join qualified records from the tables in this pair.
                // if there're previous recs, join the result of this pair to it.
                if (bRecs) {                    
                    if (bRecs.length > 0) {
                        //console.log("join: " + aTable + " joined by " + bTable);
                        aRecs.forEach(function (aRec) {
                            bRecs.forEach(function (bRec) {   
                                joinRecord(aRec, bRec, aTable, bTable, aField, bField, type);
                            });
                        });
                    } else {
                        //console.log("empty join: " + aTable + " joined by " + bTable);
                        aRecs.forEach(function (aRec) {
                            joined.curr.push(joinEmptyRecord(aRec, aTable, bTable, aField, bField));
                        });
                    }
                } else {
                    // no bRecs, meaning there's only one table in this join.
                    // therefore include this table's records as the result of current join.
                    joined.curr = aRecs;
                }
                // join to previous records.
                joined.recs.forEach(function (rec) {
                    joined.curr.forEach(function (aRec) {    
                        joinRecord(rec, aRec, joined.tableNames, aTable,
                            joined.fieldName, aField, type);
                    });
                });
                joined.recs = joined.recs.concat(joined.curr);
            });
            res(joined.recs);
        });
    },    
    /**
     * 
     * @param {Object} qO
     * @returns {String}
     */
    whereClause: function (qO) {
        function getCriteria (fieldO) {
            var //fieldName = Object.keys(fieldO)[0],                
                //tableName = (fieldO[fieldName].tableName)?
                //    fieldO[fieldName].tableName + ".": "",
                fieldName = fieldO.fieldName,
                tableName = (fieldO.tableName)? fieldO.tableName + ".": "",
                values = fieldO[fieldName].values,
                equalities = fieldO[fieldName].equalities || [],
                andors = fieldO[fieldName].andors || [],
                types = fieldO[fieldName].types || [],
                str = "";
            values = (Array.isArray(values))? values: [values];
            values.forEach(function (value, index) {
                // equalities should be the same length as values
                // so each value has a corresponding equality logic to apply.
                var equality = (equalities.length > 0)? equalities[index]: null,
                    eq = getEquality(equality),
                    andor = getAndOr(andors, index),
                    // consider the data type.
                    // dates are stored as stringy numbers '1504361940000'
                    // derived from javascript new Date().getTime() function.
                    quote = (function () {
                        var type = (types[index])? types[index]: typeof value;
                        return typeutil.quoteString[type];
                    })(),
                    likeChar = (equality === 0)? that.likeChar: "";
                str += andor + "(" + tableName + fieldName + ") " + eq + " " +
                    quote + likeChar + value + likeChar + quote;                    
            });
            str = "(" + str + ")";
            return str;
        }
        function getEquality (equality) {
            switch (equality) {
            case -1:
                return " < ";
                break;
            case -2:
                return " <= ";
                break;
            case 0:
                return " LIKE ";
                break;
            case 1:
                return " > ";
                break;
            case 2:
                return " >= ";
                break;
            default:
                return " = ";
            }
        }
        function getAndOr (andors, index) {
            var andor = (function () {
                    if (andors.length === 0) {
                        return null;
                    }
                    return (index > 0)? andors[index - 1]: null;
                })();
                //alert(andor + " " + index + " " + andors);
            switch (andor) {
            case 0:
                return " Or ";
                break;
            case 1:
                return " And ";
                break;
            case null:
            case undefined:
            case "":
                return "";
                break;
            default:
                return " Or ";
            }
        }

        // sometimes, the where clause may have been predefined in the SQLs table.
        // in that case, its a string, not an object. return the string.
        if (!qO.where) {return "";}
        if (typeof qO.where === "string") {return " WHERE " + qO.where;}
        var that = this,
            strAnd = "",
            strOr = "",
            where,
            arrAnd = qO.where.and || [],
            arrOr = qO.where.or || [];
        // AND clauses
        arrAnd.forEach(function (fieldO, index) {
            where = getCriteria(fieldO);
            if (index > 0) {
                where = " AND " + where;
            }
            strAnd += where;
            strAnd = (index + 1 === arrAnd.length)? "(" + strAnd + ")": strAnd;
        });
        // OR clauses
        arrOr.forEach(function (fieldO, index) {
            where = getCriteria(fieldO);
            if (index > 0) {
                where = " OR " + where;
            }
            strOr += where;
            strOr = (index + 1 === arrOr.length)? "(" + strOr + ")": strOr;
        });
        if (strAnd && strOr) {return " WHERE " + strAnd + " OR " + strOr;}
        if (strAnd && !strOr) {return " WHERE " + strAnd;}
        if (!strAnd && strOr) {return " WHERE " + strOr;}
        if (!strAnd && !strOr) {return "";}
    },
    fromClause: function (qO) {
        
    },
    orderClause: function (qO) {
        if (!qO.order) {return "";}
        return " ORDER BY " + qO.order;
    },        
    /**
     * @function criterionSelect
     * @param {String} table
     * @param {Number} lookup
     * @param {Object} where
     * @param {Function} cb
     * @returns {Promise}
     */
    criterionSelect: function (table, lookup, where, cb) {
        var sql, qO = {
            type: 2,// select
            tables: [{
                name: table,
                lookup: lookup || 1                    
            }],
            where: where
        };
        sql = this.write(qO);
        return this.query(sql, cb);
    },
    /**
     * @description generic select statement for just 2 tales.
     * @param {Array} tableNames
     * @param {String} basefieldId
     * @param {Mixed} basefieldValue
     * @param {Number} lookup
     * @returns {String}
     */
    innerSelect: function (tableNames, basefieldId, basefieldValue, lookup) {
        var sql = "SELECT ",
            fields = this.getFields(tableNames, lookup),
            from = " FROM " + tableNames[0] + " INNER JOIN " + tableNames[1],
            basefieldName = def.ModelFields[basefieldId].Name,
            quote = typeutil.quoteString[typeof basefieldValue],
            where = " WHERE " + tableNames[0] + "." + basefieldName + " = " +
                quote + basefieldValue + quote;
            return sql + fields + from + where;
    },
    updateSearchTags: function (table, data, searchFields) {
        DataUtil.updateSearchTags(table, data, searchFields);
    },
    getTxnStoreNames: function () {
        var arr = this.qO.tables.map(function (table) {
            return table.name;
        });
        //console.log("storenames for txn");
        //console.log(arr);
        //console.log(this.qO);
        return TypeUtil.uniqueStringy(arr);
    },
    /**
     * 
     * @param {Array} arr
     * @returns {undefined}
     */
    getWildCardTags: function (arr) {
        var tags = [];
        arr[0].values.forEach(function (val) {tags.push(val);});
        return tags.join(",");
    }
};