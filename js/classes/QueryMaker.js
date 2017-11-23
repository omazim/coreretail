"use strict";
/**
 * 
 * @param {Boolean} idb Is this an IndexedDB query?
 * @returns {QueryMaker}
 */
function QueryMaker (idb) {
    this.idb = idb;
    this.qO = {
        type: 0, // Types {CRUD}: 1=INSERT, 2=SELECT, 3=UPDATE, 4=DELETE,
        txn: true,//use transaction? IDB will always require a transaction.
        select: {
            distinct: false,
            distinctrow: false,
            sum: false
        },
        tables: [],
        joins: [],
        where: {
            and: [],
            or: []
        },
        orders: []
    };
}
QueryMaker.prototype = {
    constructor: QueryMaker,
    getTO: function () {
        return {
            name: undefined,
            action: 0,// 1=create, 2=read, 3=update, 4=delete.
            fields: [],// fields to select, insert or update.
            values: [],// corresponding values for each field,for updates and inserts only.
            sum: [],
            lookup: 1,// 1=All, 2=Wide, 3=Mid, 4=Narrow.
            indexes: [],// applies to update statements, indexes/pk fields cannot be updated.
            where: {
            //applies to action queries. select queries will use the where property defined on qO.
                and: [],
                or: []
            }
        };
    },
    getJO: function () {
        return {
            tableNames: [],// always a pair of tables [customers, salescart],
            fieldNames: [],//customerId,
            type: 0,// 0=inner, -1=left, 1=right.
            prevFieldName: undefined,//barcode
            prevType: 0
        };
    },
    getCFO: function () {
        return {
            tableName: undefined,
            fieldName: undefined,
            values: [],
            andor: [],// andor indicates whether value must pass all or one of tests.
            operators: [0]// -1 = lt, 0 = LIKE, 1 = gt, null = ===, -2 = <=, 2 = >=.
        };
    },
    /**
     * @description SQLUtil definitions are json.stringified expressions within a json object.
     * @description So even after a json parse (done in fetch), the nested json isn't parsed.
     * @description When parsed, this nested json retains number values as string.
     * @description Coerce these values to numbers to make them usable in DataAccess.read().
     * @param {type} arr
     * @param {type} pptys
     * @returns {unresolved}
     */
    getNumericValues: function (arr, pptys) {
        pptys = pptys || [];
        pptys = (Array.isArray(pptys))? pptys: [pptys];
        arr.forEach(function (e, i, t) {            
            pptys.forEach(function (ppty) {
                if (Array.isArray(t[i][ppty])) {            
                    t[i][ppty].forEach(function (b, ib, t2) {
                        t2[ib] = Number(t2[ib]);
                    });
                } else {
                    t[i][ppty] = Number(t[i][ppty]);
                }
            });
        });
        return arr;
    },
    /**
     * 
     * @param {String} name
     * @param {Array} criteria
     * @param {Bolean} isModel
     * @returns {QueryMaker.prototype.qo.QueryMakerAnonym$0}
     */
    defReadQuery: function (name, criteria, isModel) {
        function readModel () {
            this.qO.type = 2;
            this.qO.tables = (function () {
                var tables = [],
                    to = that.getTO();
                to.name = name;
                to.action = 2;
                to.lookup = 1;// all fields
                tables.push(to);
                return tables;
            })();            
        }
        if (isModel) {readModel();return;}
        var qdef = this.getDef(name);
        if (!qdef) {return {};}
        var that = this;
        this.qO.type = 2;
        this.qO.tables = (function () {
            var tables = [];
            qdef.TableNames.split(",").forEach(function (tableName) {
                var to = that.getTO();
                to.name = tableName.trim();
                to.action = 2;
                to.lookup = 1;// all fields
                tables.push(to);
            });
            return tables;
        })();
        this.qO.joins = this.getJoin(qdef);
        if (this.isLookup(criteria)) {
            this.getWildCardCriteria(criteria);
        } else {
            this.qO.where = this.getCriteria(qdef, criteria);
        }
        this.qO.orders = this.getOrder(qdef);
    },
    /**
     * 
     * @param {type} page
     * @param {type} pRecord
     * @param {type} tableId
     * @returns {undefined}
     */
    defRecordQuery: function (page, pRecord, tableId) {
        var that = this;
        this.qO.type = 2;
        this.qO.tables.push({
            name: Def.ModelTables[tableId].Name,
            fields: [],// fields to select, insert or update.
            lookup: 1// applicable if no fields array given.
            //Fields: 1=All, 2=Wide, 3=Mid, 4=Narrow.                    
        });
        this.qO.orders = "EntryDate Desc";
        // filter for fields that are related to the primary table.
        page.data[tableId].fields.filter(function (field) {
            if (tableId === page.primaryTableId) {
                return (field.IsIndexed || field.IsPK);
            }
            return (field.RelatedTableId === page.primaryTableId);
        }).forEach(function (field) {
            that.qO.where.or.push({
                tableName: Def.ModelTables[tableId].Name,
                fieldName: field.Name,
                values: [pRecord[field.Name]],
                andors: 0,
                operators: [0]
            });
        });
    },
    isLookup: function (crit) {
        // a lookup (a select query with wildcards). the wildcards have to be strings.
        return !!(Array.isArray(crit) && crit.length > 0 && typeof crit[0] === "string");
    },
    getDef: function (name) {
        //console.dir(Def.ModelSQLs);
        return Def.ModelSQLs[name];
    },
    getCriteria: function (qdef, criteria) {
        return (this.idb)? this.getIDBCriteria(qdef, criteria):
            this.getSQLCriteria(qdef, criteria);
    },
    getWildCardCriteria: function (criteria) {
        return (this.idb)? this.getIDBWildCardCriteria(criteria):
            this.getSQLWildCardCriteria(criteria);
    },
    /**
     * @description return a fully stringified sql where clause,
     * @description with placeholders substituted with real criteria
     * @param {type} qdef
     * @param {type} criteria
     * @returns {@exp;clause@call;replace|@call;replace|qdef.Criteria|String}
     */
    getSQLCriteria: function (qdef, criteria) {           
        function getReplaced (clause, criteria) {
            function enclose (str) {
                return "(" + str + ")";
            }
            function equate (value, equal) {
                var q = TypeUtil.getQuote(value);
                return (value === null || value === undefined || value === "")? notNull:
                    equal + q + value + q;
            }
            function replace (target, sub) {
                do {
                    clause = clause.replace(target, sub);
                }                        
                while (clause.indexOf(target) >= 0);
                return clause;
            }

            try {
                criteria = criteria || {};
                var keys = Object.keys(criteria), k,
                    operators = ["=", ">", "<", ">=", "<=", "<>"],//" = ",
                    BLANK = "''",
                    notNull = " Is Not Null",
                    target, t,
                    value;
                if (keys.length > 0) {
                    // replace all keys
                    keys.forEach(function (key) {
                        k = enclose(key);
                        operators.forEach(function (operator) {
                            var op = " " + operator + " ";
                            target = k + op + BLANK;
                            value = criteria[key];
                            t = k + equate(value, op);
                            clause = replace(target, t);
                        });                            
                    });
                    // normalize all 
                    operators.forEach(function (operator) {
                        var op = " " + operator + " ";
                        clause = replace(op + BLANK, notNull);
                    });                        
                }
            } catch (e) {
                Service.logError(e);
            } finally {
                return clause;
            }
        }
        var str = qdef.Criteria || "";                
        return (str && criteria)? getReplaced(str, criteria): str;
    },
    getIDBCriteria: function (qdef, criteria) {
        function fillIn () {
            try {
                logics.forEach(function (logic) {
                    if (!Array.isArray(cObject[logic])) {return;}
                    cObject[logic].forEach(function (f) {
                        criteria.forEach(function (c) {
                            var opLen = f.operators.length;
                            if (c.tableName === f.tableName && c.fieldName === f.fieldName) {
                                f.values = Array(opLen).fill(c.value);
                            }
                        });
                    });
                });                 
            } catch (e) {
                Service.logError(e);
            }
        }
        function coerceToNumeric () {
            logics.forEach(function (l) {
                if (!Array.isArray(cObject[l])) {return;}
                cObject[l] = that.getNumericValues(cObject[l], ["andor","operators"]);
            });
        }
        criteria = criteria || [];
        if (!Array.isArray(criteria)) {criteria = [criteria];}
        var that = this,
            logics = ["and","or"],
            jo = qdef.CriteriaObject,
            cObject = (jo)? JSON.parse(jo.toString()): {and:[],or:[]};
        if (criteria.length > 0) {fillIn();}
        coerceToNumeric();
        return cObject;
    },
    /**
     * 
     * @param {Array} criteria
     * @returns {undefined}
     */
    getSQLWildCardCriteria: function (criteria) {
        var that = this,
            dates = (function () {
                var patt = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g;
                return criteria.join(" ").match(patt);
            });
        this.qO.tables.forEach(function (table) {
            var tableName = table.name;
            DefUtil.getTableFields(tableName).forEach(function (field) {
                var fieldName = field.Name,                    
                    c = {// populate where clause for the lookup.
                        fieldName: fieldName,
                        tableName: tableName,
                        values: [],
                        andors: 0,
                        operators: [],
                        types: []
                    };
                // with SQLUtil, partial wildcard will take precedence over full-word wildcard.
                // so, if a field has both flags, partial wildcard flag will take precedence.
                if (field.IsPartialWildCard) {
                    // meaning any part of the field value should be matched.
                    c.values = criteria;
                    c.operators = Array(criteria.length).fill(0);// o means SQLUtil 'Like'
                    that.qO.where.or.push(c);
                } else if (field.IsFullWildCard) {
                    if (field.DataType === "Date") {
                        that.useDateRange(dates, c);
                    } else {
                        criteria.forEach(function (criterion) {           
                            // strict value
                            c.values.push(criterion);
                            c.operators.push(0);// 0 = 'strictly equal to'
                            // space-prepadded 
                            c.values.push(" " + criterion);
                            c.operators.push(null);//null operator means SQLUtil 'Like'
                            // space-postpadded 
                            c.values.push(criterion + " ");              
                            c.operators.push(null);
                            // NOTE: space padding is included so as to find words in the field
                            // content that matches the criteria.
                            // e.g a criteria field in the database has the following content:
                            // 'BOYS SHOES', and one of the criteria is 'shoes', 
                            // we want to search for where the field contains any word 'shoes',
                            // not just like 'shoes'.
                            // Like 'shoes' will match 'bigshoes', but 'shoes' will not because 
                            // 'shoes' is not a complete word in 'bigshoe'.
                            // The match has to be a full word, not part of a word.
                        });
                        that.qO.where.or.push(c);
                    }
                }
            });
        });
    },
    getIDBWildCardCriteria: function (criteria) {        
        var that = this,
            dates = (function () {
                var patt = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g;
                return criteria.join(" ").match(patt);
            });
        this.qO.tables.forEach(function (table) {
            var tableName = table.name;
            DefUtil.getTableFields(tableName).forEach(function (field) {
                var fieldName = field.Name,                    
                    c = {// populate where clause for the lookup.
                        fieldName: fieldName,
                        tableName: tableName,
                        values: [],
                        andors: 0,
                        operators: [],
                        types: []
                    };
                if (field.IsFullWildCard) {
                    if (field.DataType === "Date" && dates.length > 0) {
                        that.useDateRange(dates, c);
                    } else {
                        criteria.forEach(function (criterion) {
                            c.values.push(criterion);
                            c.operators.push(0);// 0 = 'strictly equal to'
                        });
                        that.qO.where.or.push(c);
                    }
                }
            });
        });
    },
    /**
     * @description Returns the Join object if using IndexedDB, or the Join SQLUtil string.
     * @param {type} qdef
     * @returns {String}
     */
    getJoin: function (qdef) {
        console.log(qdef);
        var jo = qdef.JoinObject;
        if (jo) {
            jo = JSON.parse(jo.toString());
            jo = this.getNumericValues(jo, ["type"]);
        } else {
            jo = [];
        }
        return (this.idb)? jo || []: qdef.Join || "";
    },
    getOrder: function (qdef) {
        return qdef.Order || "";
    },
    useDateRange: function (dates, c) {
        var start = (dates[0])? dates[0]: Number(Def.ModelConstants.BaseDate.Value),
            stop = (dates[1])? dates[1]: new Date().getTime(),
            range = [start, stop];
        console.log("use start date: " + start);
        console.log("use stop date: " + stop);
        range.forEach(function (date, index) {
            var operator = (index > 0)? -2: 2;
            // convert to stringy numbers
            date = new Date(date).getTime();
            c.values.push(date);
            c.operators.push(operator);
            c.types.push("string");// guarantees dates'll be treated as string in SQLUtil.
        });
        // there are only 2 dates in the range,
        // we want to achieve where clause...date >= startdate and date <= stopdate.      
        // dates must be entered as yyyy-mm-dd.
        c.andors = 1;
        this.qO.where.and.push(c);
    },
    /**
     * @description
     * @param {String} name
     * @param {Object} criteria  Obj with Table's field names as properties holding query values 
     * @returns {Array}
     */
    discretizeCriteria: function (name, criteria) {
        if (!this.idb) {return criteria;}// for sql, it should remain an object.
        return Object.keys(criteria).map(function (key) {
            if (!criteria[key]) {return {};}
            return {
                tableName: name,
                fieldName: key,
                value: criteria[key]
            };
        });
    }
};