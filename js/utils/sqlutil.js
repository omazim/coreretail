var SQLUtil = (function () {
        var me = {
                exec: function (sql, cb) {
                    var da = IDBDataAccess();
                    da.read(sql, cb); 
                },
                use: function (sqlO, cb) {
                    var model = CorraModel, dataaccess = CorraDataAccess, dml = new model.DML();
                    dml.use(sqlO, cb);
                },
                criterionSelect: function (tableName, lookup, where, use) {
                    var model = CorraModel, dataaccess = CorraDataAccess, dml = new model.DML();
                    dml.criterionSelect(tableName, lookup, where, use);
                },        
                rows: {
                    getTableKeys: function (manifest) {
                        var arr = [], keys = Object.keys(manifest);
                        keys.forEach(function (key) {
                            var tfKey = key.split("_");
                            if (tfKey.length === 2) {
                                arr.push(tfKey[0]);
                            }
                        });
                        // remove duplicates
                        return arr.filter(function (a, i) {
                            return (arr.indexOf(a) === i);
                        });
                    },
                    /**
                     * @description FullKeys are in the form tableName_fieldName.
                     * @param {type} manifest
                     * @param {type} fKey
                     * @returns {String}
                     */
                    getFullKey: function (manifest, fKey) {
                        var tKeys = this.getTableKeys(manifest), key;
                        tKeys.first(function (tKey) {
                            key = tKey + "_" + fKey;
                            return (manifest.hasOwnProperty(key));
                        });
                        return key || fKey;
                    },
                    /**
                     * 
                     * @param {Object} manifest
                     * @param {String} f
                     * @param {String} t
                     * @returns {Variant | undefined}
                     */
                    getVal: function (manifest, f, t) {
                        var fullKey = "";
                        if (typeof t === "string") {
                            t = (t)? t + "_": "";
                            fullKey = t + f;
                            // check that key exists, otherwise use f only.                        
                            if (Object.keys(manifest).indexOf(fullKey) === -1) {fullKey = f;}
                        } else {
                            fullKey = this.getFullKey(manifest, f);
                        }
                        return Misc.tendToUndefined(manifest[fullKey]);
                    },
                    /**
                     * @description Return fields that have to do with the tag given.
                     * @param {String} tag
                     * @param {String} tableName
                     * @returns {getCorraModule.this..rows.getFieldsByTag.arr|Array}
                     */
                    getFieldsByTag: function (tag, tableName) {
                        if (!tag || !tableName) {return [];}
                        var arr = [], tableId = Def.ModelTables[tableName].Id;
                        Def.ModelFields.Rows.filter(function (field) {
                            return (field.TableId === tableId);
                        }).forEach(function (field) {
                            var f = field.InferTags;
                            if (f) {
                                if (f.indexOf(tag) >= 0) {
                                    arr.push(field.Name);
                                }
                            }
                        });
                        return arr;
                },
                    /**
                    * @description build simple controls from a sql
                    * to be used in sorting, refreshing queries.
                    * @param {String} sql
                    * @returns {Object}
                    */
                    getQueryController: function (sql) {
                           function getFields () {

                           }
                           function getTables () {

                           }
                           function refresh () {

                           }
                           return {
                               query: sql,
                               tables: getTables(),
                               fields: getFields(),
                               sortBy: getSorting(),
                               refresh: refresh
                           };                
                    }
                }        
            };
        return me;
    })();