"use strict";
function PageModel (pageId, subModel, noform) {
    this.subModel = subModel;
    //this.submodel = ModUtil.page.getSubModel(pageId);
    this.view = {
        maintabId: undefined,
        fieldId: undefined,
        subtabId: undefined
    };        
    this.data = {};   
    this.pageId = pageId;
    this.pageName = Def.ModelPages[pageId].Name; 
    this.pageAlias = Def.ModelPages[pageId].Alias; 
    this.pageGroupId = Def.ModelPages[pageId].PageGroupId;
    this.pageGroupName = Def.ModelPageGroups[this.pageGroupId].Name;
    this.formId = HTMLUtil.getFormId(pageId);
    this.form = document.getElementById(this.formId);
    this.tableIds = (function () {
        return Def.ModelDestTables.Rows.filter(function (table) {
            return(table.PageId === pageId);
        }).map(function (table) {
            return table.Id;
        });
    })();
    this.destTables = Def.ModelDestTables.Rows.filter(function (table) {
        return (table.PageId === pageId);
    });
    this.primaryTableId = DefUtil.getPrimaryTableId(pageId);
    this.primaryTableName = Def.ModelTables[this.primaryTableId].Name;
    this.commonFields = DefUtil.getTableFields("Model_CommonFields");
    this.invalidFields = [];
    this.invalidTableId;
    this.qO = {};
    this.noform = !!(noform);
    this.init();
    this.initSubModel();
    this.flagView();
    // make active page
    this.flagPage();
}
PageModel.prototype = {
    constructor: PageModel,
    /**
     * 
     * @param {Boolean} newRec Renew the primary record.
     * @returns {undefined}
     */
    init: function (newRec) {
        var that = this;
        try {
            that.tableIds.forEach(function (tableId, index, thatArg) {
                var tableName = Def.ModelTables[tableId].Name,
                    compIndx = tableId + "_" + that.pageId,
                    indexFields = DefUtil.getPKFields(tableId);
                that.data[tableId] = {
                    // check field values for these fields
                    // use it to determine whether a record is duplicated.
                    indexFieldIds: indexFields.map(function (field) {
                        return field.Id;
                    }),
                    indexFieldNames: indexFields.map(function (field) {
                        return field.Name;
                    }),
                    // make sure field is defined on the record. all fields must be defined.
                    fields: Def.ModelFields.Rows.filter(function (field) {
                        return (field.TableId === tableId);
                    }).concat(that.commonFields),
                    primary: Def.ModelDestTables[compIndx].IsPrimary,
                    single: Def.ModelDestTables[compIndx].IsSingle,
                    tabled: Def.ModelDestTables[compIndx].IsTabled, 
                    tallyable: Def.ModelDestTables[compIndx].HasTally, 
                    tallyFieldId: DefUtil.getTallyFieldId(tableId),
                    records: [],// named keys
                    sources: [],
                    changes: [],
                    twinvalues: [],// ided keys
                    backend: [],// data retrieved from backend
                    mirrors: [],// ided keys. holds same value as named keys
                    related: {},//fields in this table related to another table
                    musthave: Def.ModelDestTables[compIndx].MustHaveRecords
                };
                // copy object, so that it can be accessed by name too.
                that.data[tableName] = that.data[tableId];                
                if (newRec) {// start a new record on the primary table.
                    that.newRecord(that.primaryTableId, true);
                }                
            });
            // initialize subModel too
            this.initSubModel();
        } catch (err) {
            Service.logError(err);
        }
    },
    initSubModel: function () {
        var tableId = this.primaryTableId;
        this.subModel.init(this);
        this.writeRecord(tableId, {});
    },
    flagView: function () {
        var id = ViewUtil.flag.pageTabView(this, true);
        this.view.maintabId = id.maintabId;
        this.view.subtabId = id.subtabId;
    },        
    /**
     * @description Flag this Page as the current page in the Model.state object.
     * @description Do not flag if its noform flag is false.
     * @returns {undefined}
     */
    flagPage: function () {        
        if (!this.noform) {
            //alert(Model.state.activePages.length + " active pages on load.");
            Model.state.currPage = this;
            Model.state.activePages.push(this);
            //alert(Model.state.activePages.length + " active pages after load.");
        }
        Model.pageModel[this.pageId] = this;
    },
    read: function (modal) {
        function readTable (tableId) {
            var qm = new QueryMaker(IDXB), da;
            qm.defRecordQuery(that, pRec, tableId);
            da = new DataAccess(qm.qO, CRDS, IDXB);
            return new Promise(function (res, rej) {
                da.access(true, true).then(function (recs) {
                    loadRecords(recs, tableId);
                    enforceModifiables(tableId);
                    res();
                }).catch(function (err) {
                    console.log(err.stack);
                    res();
                });
            });
        }
        function loadRecords (recs, tableId) {
            if (Array.isArray(recs)) {                           
                recs.forEach(function (rec) {
                    // set FromBE field to true, 
                    // as the data is being read from the backend.
                    // this ensures that if any modification is made to the record,
                    // the sql generator will use Update...instead of Insert.
                    rec.FromBE = true;                                       
                });  
                that.data[tableId].records = recs;
            }
        }
        function enforceModifiables (tableId) {
            // todo: 22 Nov 2017.
            // depending on status of record, set up flags to allow or disallow modifications.
            
        }
        function iterate () {
            var promises = [];
            tables.forEach(function (table) {
                promises.push(
                    new Promise(function (res, rej) {
                        res(readTable(table.Id));
                    })
                );
            });
            return Promise.all(promises);
        }

        // this function is called from view,
        // hence the assignment that = Model.state.currPage,
        // using that = this returns undefined.
        var that = Model.state.currPage,
            tables = that.destTables,
            index = modal.rowIndex,
            pRec = modal.rows[index];
        // for each dest table
        // read from database using corresponding index fields
        // args contain criteria values as properties
        // load rows into table.data[tableId].records.
        // update views.
        if (Object.keys(pRec).length === 0) {
            ViewUtil.feedback.push("Please provide search criteria.", "err");
        } else {     
            iterate().then(function () {
                that.updateViews();
            }).catch(function (err) {
                console.log(err.stack);
            });
        }
    },
    /**
     * 
     * @param {String} tableId
     * @param {Boolean} init
     * @returns {undefined}
     */
    newRecord: function (tableId, init) {
        var pTableId = this.primaryTableId,
            tableName = Def.ModelTables[tableId].Name,
            pRecord = this.data[pTableId].records[0] || {},
            named = {}, ided = {},
            that = this;
        tableId = Def.ModelTables[tableName].Id;
        this.data[tableId].fields.forEach(function (field) {
            try {
                var key = field.Name,
                    value = Misc.tendToUndefined(field.DefaultValue, field.DataType),
                    el;
                if (field.IsIngress) {
                    el = document.getElementById(HTMLUtil.getFieldId(field.Id, that.pageId));
                }
                // defaulted values
                if (value !== undefined) {
                    value = TypeUtil.getFormatted(value, field.Id, false);
                }
                // constants?
                if (Def.ModelConstants[key] && !value) {value = Def.ModelConstants[key].Value;}
                // session fields?
                if (key in Model.session && !value) {value = Model.session[key];}
                // stamp field? ignore until checkRecords().
                if (field.IsStamp) {
                    value = TypeUtil.getFormatted(field.DefaultValue, field.Id, false);
                }
                // autovalue field? usualy the ingress field of the primary table
                if (field.IsAutoValue && el) {
                    value = el.value;
                }
                if (field.IsAutoValue && !el) {
                    value = DefUtil.autoValue(field.Id);
                }
                // related to primary table field? infer its value from primary table.
                if (tableId !== pTableId && field.RelatedTableId === pTableId) {
                    value = pRecord[key];
                }
                // common field? infer from currPage if using a wizard
                if (field.IsCommon && that.noform) {
                    var cpPryTableId = Model.state.currPage.primaryTableId;
                    value = Model.state.currPage.data[cpPryTableId].records[0][key];
                }
                // if field is indexed or pk and is still undefined, 
                // it must be that the field will be assigned during record addition.
                // e.g barcode of an item in cart is not known until the item is scanned,
                // however, a record is created before it is scanned.
                /*if ((TypeUtil.toBln(field.IsIndexed) || TypeUtil.toBln(field.IsPK)) &&
                    value === undefined) {                        
                    alert("Indexed Field value is undefined.");
                    throw "Indexed Field value is undefined.";
                }*/
                named[key] = value;
                //console.log("new rec for " + tableId + " @field: " + key + " @value " + named[key]);
                // reflect key id, so that it can be accessed by field id too.
                ided[field.Id] = named[key];
            } catch (err) {
                console.log(err.stack);
                Service.logError(err);
            }       
        });
        // push ided into mirrors.
        // push named into values
        // if either of them is populated, the other reflects the same values.
        this.data[tableId].records.push(named);
        if (init) {this.updateViews();}
    },
    /**
     * @description writes to a record any time a field is changed.
     * @description triggered by the onchange event.
     * @param {JQueryElementObject} e
     * @returns {undefined}
     */
    writeField: function (e) {               
        var el = e.get(0),
            fieldId = HTMLUtil.getFieldIdFrom(el.id),
            fieldName = Def.ModelFields[fieldId].Name,
            tableId = Def.ModelFields[fieldId].TableId,
            // for a select element, always take the first option split as value.
            // e.g if option1 = "001 || ShopName || Location
            // then 001 will be the element's data value.
            value = (el.nodeName === "INPUT")? el.value: el.value.split("||")[0].trim(),
            destManifest = {},
            depField = DefUtil.getDependantField(fieldId);
        // if the field has other select fields based on it, 
        // populate those select options silently.
        // e.g, when bizId selection changes, populate categoryIds belonging to it.
        if (depField) {
            //alert(fieldId + " = " + value + " bias fill " + depField.Id);
            HTMLUtil.fillDependentDropDown(fieldId, value, depField);
        }
        // caveat! if field has a lookup definition,
        // do not write until the lookup is done.
        // caveat! if modal prompt is visible, do not write.
        if (ViewUtil.state.promptView) {return;}
        try {
            if (!Def.ModelFields[fieldId].LookupDef) {
                destManifest[fieldName] = TypeUtil.getFormatted(value, fieldId, false);           
                // write 
                //console.log("write record from writeField");
                this.writeRecord(tableId, destManifest, null, null, true);
            }
        } catch (err) {
            console.log(err.stack);
            Service.logError(err);
        }
    },
    /**
    * @description if table holds a single record,
    * @description then add data to index 0. otherwise, push into sequential index.
    * @param {String} tableId
    * @param {Object} destManifest
    * @param {Object} source Source manifest
    * @param {Number} index index of the table records to write to.
    * @param {Boolean} calculate
    * @returns {undefined}
    */
    writeRecord: function (tableId, destManifest, source, index, calculate) {
        /**
        * @description Indicate whether the field definition is a count of quantity.
        * @description e.g in a record of items in a shopping cart, the Qty field.
        */
        function getRecordIndex () {
            index = (index === null || index === "" || index === undefined)? -1: index;
            // index is always zero for single-record tables (usually the primary table)
            if (that.data[tableId].single) {return 0;}
            // if index was passed in arguments, use it.
            if (index >= 0) {return index;}
            // if table is empty, then this must be first record...hence index zero.
            if (that.data[tableId].records.length === 0) {return 0;}
            // indexers are fields used in identifying a unique record.
            // if there's a record with the same values in those indexer fields,
            // then that record will be incremented using the incrementer (tally) field,
            // if the table's hasTally flag is true,
            // otherwise a new record will be added.
            //console.log(that.data[tableId].indexFieldNames.length + " index fields for " + tableId);
             var indexLen = that.data[tableId].indexFieldNames.length,
                 secIndex = 0,
                 recLen = that.data[tableId].records.length,
                 pTableId = that.primaryTableId,
                 indexMatch = that.data[tableId].records.first(function (record, index) {
                    var blns = [];// empty array for each record.                    
                    that.data[tableId].indexFieldNames.forEach(function (fieldName) {
                        var fieldVal = record[fieldName],
                            // if destVal is undefined for an index field,
                            // grab it from primary table.
                            destVal = SQLUtil.rows.getVal(destManifest, fieldName) ||
                            that.data[pTableId].records[0][fieldName];
                   //console.log(Object.keys(destManifest));
                   //console.log("for "+fieldName+": "+fieldVal + " === " + destVal + "?");
                          if (fieldVal === destVal) {blns.push(true);}
                     });
                     if (blns.length === indexLen) {
                         secIndex = index;
                         return true;
                     }
                 });
            return (indexMatch)? secIndex: recLen;
        }
        //console.log("@writeRecord - pageId: " + this.pageId + " tableId: " + tableId);
        //console.dir(this.data);
        var that = this,
            table = this.data[tableId],
            keys = (destManifest)? Object.keys(destManifest): [],
            key,
            newRec, fVal,
            hasTally = table.tallyable,
            tallyFieldId = table.tallyFieldId,
            tallyFieldName = (tallyFieldId)? Def.ModelFields[tallyFieldId].Name: undefined,
            isPrompt = (source === "prompt")? true: false,
            i, l = keys.length;
        if (tableId === "T111") {console.dir(destManifest);}
        try {
            index = getRecordIndex();
            // table records will be accessed by name, not field id.
            // therefore get the name of each key, if the keys are field ids.
            newRec = (index === table.records.length);                     
            //console.log("newRec for " + tableId + " @ index " + index + "? == " + table.records.length + " "+ newRec); 
            /*Object.keys(destManifest).forEach(function (key){
                console.log("start dest manifest: " + key + " = " + destManifest[key]);
            });*/
            if (newRec) {this.newRecord(tableId, (keys.length === 0));}
            for (i = 0; i < l; i++) {
                key = keys[i];
                fVal = undefined;
                // is key a field id? use its name instead.
                if (DefUtil.isFieldId(key)) {key = Def.ModelFieldDef[key].Name;}
                if (newRec) {
                    //console.log("new rec! " + Def.ModelTables[tableId].Name);
                    table.records[index][key] = destManifest[key];
                } else {
                    if (hasTally) {
                        //console.log("edit rec by tally " + Def.ModelTables[tableId].Name);
                        fVal = Number(destManifest[tallyFieldName]);
                        fVal = (isPrompt)? Number(destManifest[tallyFieldName]):
                            fVal + Number(destManifest[tallyFieldName]);
                        table.records[index][tallyFieldName] = fVal;
                        break;
                    } else {
                        //console.log("edit rec no tally " + Def.ModelTables[tableId].Name);
                        table.records[index][key] = destManifest[key];
                    }
                }
                /*Object.keys(destManifest).forEach(function (key){
                    console.log("end dest manifest: " + key + " = " + destManifest[key]);
                });*/
                // reflect on fieldId
                this.reflect(tableId, key, index);
            }
            /*table.fields.forEach(function (field) {
                console.log("WRITTEN: @index: " + index + " @" + tableId + " @key: " + field.Name + " @value: " + table.records[index][field.Name]);
            });*/
            // populate source. 
            // for tabled records, used for masking records during refreshing table.
            if (typeof source === "object" && source !== null) {
                table.sources[index] = source;
            }
            if (calculate) {this.runCalculations();}
            // flag change occurence
            table.changes[index] = true;          
        } catch (err) {
            console.log(err.stack);
            Service.logError(err);
        }
    },
    /**
     * 
     * @param {String} fieldId
     * @param {String} query
     * @param {Event Target} target
     * @returns {undefined}
     */
    lookupField: function (fieldId, query, target) {
        function lookup () {
            var da = new DataAccess(qm.qO, CRDS, IDXB);
            da.access(true, true).then(function (records) {
                var relTableId = Def.ModelFields[fieldId].RelatedTableId;
                if (records.length === 0) {
                    if (!relTableId) {     
                        ViewUtil.feedback.give({msg: "New " + luDef + "..?",type:"info"});
                        // clear all views
                        that.init(true);
                    } else {
                        ViewUtil.feedback.give({msg: "Sorry, no records found!",type:"info"});
                        //document.getElementById(ViewUtil.state.focusId).focus();
                        document.getElementById(target.id).value = "";
                        if (Def.ModelTables[tableId].CanStandAlone) {
                            ModalUtil.dialog({
                                title: "New " + luDef,
                                msgs: ["The " + luDef + " you searched for was not found."],
                                gist: "Would you like to add it as a new " + luDef + " now?",
                                options: [{
                                    opt: "Yes.",
                                    "default": true,
                                    callback: function () {
                                        var pageId = Def.ModelTables[relTableId].NewRecPageId,
                                        // if the wizard runs successfully to collect new data,
                                        // the new data should find its way back into the page.
                                        // so, rerun the lookupField function.
                                            recall = function (rec) {
                                                //console.log("recall onselect fn: ");
                                                //console.dir(Model.state.currPage);
                                                ModalUtil.next("lookup", subtitle, rec, fieldId, Model.state.currPage.onFieldSelect);
                                            };
                                        ModalUtil.next("wizard", pageId, recall);
                                    }
                                }, {
                                    opt: "No."
                                }]
                            });
                        }
                    }
                } else {
                    ViewUtil.state.focusId = focusId;
                    console.log("lookup records");console.dir(records);
                    ModalUtil.lookup(subtitle, records, fieldId, onselect);
                };
            }).catch(function (err) {
                console.log(err.stack);
            });
        }
        // caveats
        // if no query, quit
        query = query || target.value;
        fieldId = fieldId || HTMLUtil.getFieldIdFrom(target.id);
        console.log("lookupfield: " + target.value + "\n" + query + "\n" + fieldId);
        if (!query) {return;}              
        if (!fieldId) {return;}        
        var luDef = Def.ModelFields[fieldId].LookupDef;
        if (!luDef) {return;}

        var that = this,
            tableId = Def.ModelFields[fieldId].TableId,
            subtitle = Def.ModelFields[fieldId].LookupTitle,
            onselect,
            focusId = HTMLUtil.getFieldId(fieldId, this.pageId),            
            qm = new QueryMaker(IDXB),
            criteria = TypeUtil.uniqueStringy(query.split(" ").map(function (q) {
                // searchTags index has only lower case entries.
                // this makes it possible to search case-insensitive.
                // it is also important to remove duplicates.
                // e.g my name is chijioke okwunakwe,
                // email is chijioke.okwunakwe@gmail.com
                // when the searchTags are compiled from name & email address,
                // it will read 'chijioke,okwunakwe,chijioke,okwunakwe,gmail,com
                // obviously there's a duplication here...which bloats the IDB indexes.
                return q.toLocaleLowerCase().trim();
            }));
        console.log("lookup criteria: " + criteria);
        qm.defReadQuery(luDef, criteria);
        // NOTE: 
        // onselect is the function that will be called when user selects a record from the lookup.
        // if the lookedup field is an ingress field, then a complete transaction is selected and
        // other tables in the markup are populated with its data.
        // if the lookedup field is not an ingress field for the page, then only that field and 
        // perhaps associated fields are populated.
        if (Def.ModelFields[fieldId].IsIngress && tableId === this.primaryTableId) {
            onselect = Model.state.currPage.read;
        } else {
            onselect = this.onFieldSelect;
        }
        // set where to return focus to
        ViewUtil.state.focusId = focusId;
        lookup();
    },
    onPrimaryRecordSelect: function (data) {
        this.read(data[this.primaryTableId].records[0]);
    },
    _onFieldSelect: function (modal, args) {
        // if selected item passes pre-checks,
        // prompt other indexed fields, if primary field is indexed.
        // infer primary data (the field being looked up).
        // infer shadow data (fields in manifest that match other fields in dest table).
        // infer/lookup secondary fields.
        // infer/lookup tertiary fields.
        // after each inference, update data object.
        // if data table is multi-record, update html table view (if any).
        function lookupCheck (args) {
            return new Promise(function (res, rej) {
                var pass = that.subModel.lookupCheck(args);                
                if (pass) {
                    res(pass);
                } else {
                    rej(pass);
                }
            });
        }
        /**
        * @description Sometimes, this may be called with args already defined.
        * in which case no new definition/assignment is necessary.
        * @returns {SalesCheckout_L3.util.lookup.onselect.args}
        */
        function getArgs () {
            if (args) {return args;}

            args = {};
            try {
                args.modal = modal;
                args.rows = modal.rows;
                args.index = modal.rowIndex;
                args.fieldId = modal.fieldId;
                args.manifest = modal.rows[args.index];
                args.destManifest = {};
                args.page = Model.state.currPage;
                args.tableId = Def.ModelFields[args.fieldId].TableId;
                args.tableName = Def.ModelTables[args.tableId].Name;
                args.lookupCalc = that.subModel.lookupCalc;     
                args.promptFields = that.subModel.promptFields(args, that);
            } catch (err) {
                console.log(err.stack);
                Service.logError(err);
            }
            return args;
        }
        var that = Model.state.currPage,
            args = args || getArgs();

        lookupCheck(args).then(function () {
            that.afterSelect(args);
        }).catch (function (err) {
            Service.logError(err);
        });
    },
    onFieldSelect: function (modal, args) {
        // if selected item passes pre-checks,
        // prompt other indexed fields, if primary field is indexed.
        // infer primary data (the field being looked up).
        // infer shadow data (fields in manifest that match other fields in dest table).
        // infer/lookup secondary fields.
        // infer/lookup tertiary fields.
        // after each inference, update data object.
        // if data table is multi-record, update html table view (if any).
        function lookupCheck (args) {
            var check = that.subModel.lookupCheck(args, that); 
            // check is either an object or a boolean.
            return new Promise(function (res, rej) {
                if (!check) {
                    res(true);
                    return;
                }
                if (typeof check === "boolean") {
                    res(check);
                    return;
                }
                // else object with properties representing field functions to run.
                var records = args.manifest,
                    keys = Object.keys(records), obey, i, l,
                    fieldChecks = Object.keys(check),
                    fieldKeys = keys.filter(function (key) {
                        // return keys that appear in the record.
                        // these are the keys that will be checked if they pass the rules set.
                        return (fieldChecks.indexOf(key) >= 0);
                    });
                /*l = fieldKeys.length;
                //console.dir(keys);console.dir(fieldRules);console.dir(fieldKeys);
                for (i = 0; i < l; i++) {            
                    obey = fieldKeys[i];
                    try {
                        if (!check[obey]()) {
                            res(false);
                            return;
                        }
                    } catch (err) {
                        Service.logError(err);
                    }
                }*/
                try {
                    obey = fieldKeys.first(function (fieldKey) {
                        return !(check[fieldKey]());
                    });
                } catch (err) {
                    Service.logError(err);
                }
                res(!obey);
            });
            /*
             * 
             * @returns {PageModel.prototype.onFieldSelect.args|SalesCheckout_L3.util.lookup.onselect.args}if (typeof checks === "object") {
            Object.keys(check[tableName]).forEach(function (key) {
                passes.push(key());
            });
            return(passes.length === Object.keys(checks));
        } else {
            return check[tableName]();                
        }
             */
        }
        /**
        * @description Sometimes, this may be called with args already defined.
        * in which case no new definition/assignment is necessary.
        * @returns {SalesCheckout_L3.util.lookup.onselect.args}
        */
        function getArgs () {
            if (args) {return args;}
            args = {};
            try {
                args.modal = modal;
                args.rows = modal.rows;
                args.index = modal.rowIndex;
                args.fieldId = modal.fieldId;// target field id being looked up.
                args.manifest = modal.rows[args.index];
                args.destManifest = {};
                args.page = Model.state.currPage;
                args.tableId = Def.ModelFields[args.fieldId].TableId;
                args.tableName = Def.ModelTables[args.tableId].Name;
                args.lookupCalc = that.subModel.lookupCalc;     
                args.promptFields = that.subModel.promptFields(args, that);
            } catch (err) {
                console.log(err.stack);
                Service.logError(err);
            }
            return args;
        }
        //console.log("onselect");
        var that = Model.state.currPage,
            args = args || getArgs();
        lookupCheck(args).then(function () {
            that.afterSelect(args);
        }).catch (function (err) {
            Service.logError(err);
        });
    },
    /**
     * @description Shadow data for each shadowable field in a record.
     * @param {type} fieldId
     * @param {type} manifest
     * @param {type} tableId
     * @returns {undefined}
     */
    updateShadowData: function (fieldId, manifest, tableId) {
        var single = this.data[tableId].single,
            index = (single)? 0: this.data[tableId].records.length;                
        this.data[tableId].shadows[index] = manifest;            
    },
    afterSelect: function (args) {
        function promptFields () {
            // set timeout of zero seconds in order to force the prompt to show.
            // as its a modal, sometimes it does not show if another modal was
            // immediately removed.                
            AI.pause(function () {                    
                ModalUtil.prompt(args.promptFields, callback);
            }, 0);
        }
        /**
         * @description Called after prompting for fields, or if there is no field to prompt.
         * @description prompt argument is the value of prompted fields (if any).
         * @param {Object} data
         * @returns {undefined}
         */
        function callback (data) {
            if (data) {args.promptData = data;}                
            var fncCalc = args.lookupCalc(args);
            that.inferLookupValues(args);
            fncCalc().then(function () {
                console.log("write from afterSelect");
                that.writeRecord(args.tableId, destManifest, manifest, null, true);
                CtrlUtil.focus.input(args.focusId);
            }).catch(function (err) {
                console.log(err.stack);
                Service.logError(err);
            });
        }
        console.log("afterSelect");
        var that = this,
            destManifest = args.destManifest,
            manifest = args.manifest;
        // prompt for other index fields to make up the record...if any
        if (args.promptFields.length > 0) {promptFields();} else {callback();}
    },
    /**
    * @description Glean columns in returned rows that match fields in the table.
    * @param {Object} args
    * @returns {undefined}
    */
    inferLookupValues: function (args) {      
        var that = this,
            tableId = args.tableId,
            manifest = args.manifest;
        // loop through all fields in the destination table.
        // update fields that match fields in the manifest.
        // write the manifest into shadow (this will be shown in tooltip when field is hover over.
        console.log("infer lookup values");console.dir(args);
        that.data[tableId].fields.forEach(function (field) {
            var name = field.Name,
                value = (function () {                            
                    if (args.promptData) {
                        return SQLUtil.rows.getVal(manifest, name) ||
                            args.promptData[tableId].records[0][name];
                    } else {
                        return SQLUtil.rows.getVal(manifest, name);
                    }
                })();
            // skip common fields & match fields by name.                    
            if (!field.IsCommon && value !== undefined) {args.destManifest[name] = value;} 
            // define related data
            if (field.RelatedTableId && args.fieldId === field.Id) {
                //console.log(field.Name + " is related");console.dir(manifest);
                that.data[tableId].related[field.Id] = manifest;
            }
        });        
        console.log("after infer");console.dir(args);
    },
    /**
     * @description Inspect data for nullity, then push fields & values for sql statement.
     * @param {String} tableId
     * @param {Array} records
     * @param {String} cmdName the command name.
     * @returns {undefined}
     */
    isTableQueryOk: function (tableId, records, cmdName) {
        function captureRecord (record, fieldNames, values, indexes) {
            var tableO = qm.getTO();
            tableO.name = tableName;
            tableO.fields = fieldNames;
            tableO.values = values;
            tableO.indexes = indexes;
            tableO.action = getCRUDAct(record);
            // if field is indexed or pk...capture it for UPDATE/DELETE SQLUtil criteria clause.
            fieldNames.forEach(function (fieldName) {
                var l;
                if (that.data[tableId].indexFieldNames.indexOf(fieldName) >= 0 &&
                    (tableO.action === 3 || tableO.action === 4)) {
                    l = tableO.where.and.length;
                    tableO.where.and.push({});                        
                    tableO.where.and[l] = {
                        tableName: tableName,
                        fieldName: fieldName,
                        values: [record[fieldName]],
                        // andor will always be 1 less than the number of criteria
                        andors: 1,                            
                        // 0 = Or, 1 = And
                        operators: []
                    };
                }
            });                
            that.qO.tables.push(tableO);
        }
        /**
         * @description Get the action to be performed on the record (Update|Delete|Insert)
         * @param {type} record
         * @returns {Number}
         */
        function getCRUDAct (record) {
            // if the current record was from backend, then its an update,
            // otherwise, its an insert.
            // check the FromBE (From Backend) field to determine this.
            return (record.FromBE)? ((record.BEDelete)? 4: 3): 1;
        }
        function checkRecords () {
            // loop thru each record.
            // ensure common fields are defined and appropriate value automatically entered.
            // value-stamp stampable common fields.
            // if any field is required but null, fail.
            records.first(function (record) {
                var fieldNames = [], values = [], indexes = [], v;     
                nullField = tableFields.first(function (field) {
                    var fieldName = field.Name;                    
                    // stamp the field, if it's a common field & is a stamp.
                    if (field.IsStamp) {
                        record[fieldName] = DefUtil.stamp(fieldName, cmdName, record.Status, that.pageId);
                    }
                    v = record[fieldName];
                    if ((v === undefined || v === null || v === "") && field.IsRequired) {
                        if (fieldName === "HasCharges") {alert("hascharges: " + v);}
                        that.invalidFields.push(field);
                        return true;// this will abort the validation.
                    } else {                        
                        // format before using the value
                        v = TypeUtil.getFormatted(v, field.Id, false);
                        // capture field & valid value
                        fieldNames.push(fieldName);                        
                        values.push(v);
                        indexes.push(field.IsIndexed || field.IsPK);
                        // indexes array will be used to avoid updating indexed/pk fields.
                    }
                });
                if (nullField) {return true;}
                captureRecord(record, fieldNames, values, indexes);                    
            });
        }        
        var that = this,
            qm = new QueryMaker(IDXB),
            tableName = Def.ModelTables[tableId].Name,
            commonFields = DefUtil.getTableFields("Model_CommonFields"),
            tableFields = this.data[tableId].fields.concat(commonFields),
            nullField;        
        checkRecords();
        // no null mandatory fields encountered.
        // make up sql table object.            
        return !!(this.invalidFields.length === 0);
    },
    forceHighlight: function () {
        if (this.invalidFields[0]) {
            var field = this.invalidFields[0],// first invalid field
                alias = field.Alias || field.Name,
                msg = field.ValidationMessage || "Please review <u>" + alias + "</u>. " +
                    "Valid data is required.",
                id = HTMLUtil.getFieldId(field.Id, this.pageId);                   
            ViewUtil.feedback.push(field.TableId + " " + this.pageId + " | " + msg, "err");
            CtrlUtil.focus.input(id, true);
            //alert(field.TableId + "-" + field.Name + " = " + id.value + " | " + this.pageId + " | " + msg);
            console.dir(this.invalidFields);
        } else {// invalid table. force focus on the relevant tab
            CtrlUtil.focus.tab(this.invalidTableId);
        }
    },        
    /**
     * @param {String} cmdName Name of command
     * @param {Boolean} ignoreWarnings         
     * @param {Array} callbacks
     * @returns {undefined}
     */
    commitData: function (cmdName, ignoreWarnings, callbacks) { 
        function commit () {            
            return new Promise(function (res, rej) {
                var da = new DataAccess(that.qO, CRDS, IDXB);
                da.access(false).then(function (good) {
                    var okay = Def.ModelPages[that.pageId].SuccessMessage ||
                            "Operation successful.",
                        notokay = Def.ModelPages[that.pageId].ErrorMessage ||
                            "Sorry, something went wrong while saving your work.",
                        msg = (!good)? notokay: okay,
                        type = (!good)? "err": "okay";
                    ViewUtil.feedback.push(msg, type);
                    if (good) {
                        if (Array.isArray(callbacks)) {
                            callbacks.forEach(function (fn) {
                                if (typeof fn === "function") {
                                    fn();
                                }
                            });
                        }
                        if (!that.noform) {reset();}
                        res(true);
                    } else {
                        res(false);
                    }
                }).catch(function (err) {
                    console.log(err.stack);
                    rej();                    
                });
            });
        }
        function reset () {
            that.form.reset();
            // reset tables
            that.tableIds.forEach(function (tableId) {
                var tbl, tblId;
                if (that.data[tableId].tabled) {
                    tblId = HTMLUtil.getTableId(tableId, that.pageId);
                    tbl = document.getElementById(tblId);
                    console.log("html table Id: " + tblId);
                    that.emptyTable(tbl);
                }
            });
            // revert to main tab.
            ShowUtil.tab({name: "Main", pageId: that.pageId});
            // show summary of committed data 
            // this may show up with a transaction slip
            // transaction slips will be sent by email or in-app notification to a supervisor
            // this allows for paperless callover (useful for banks).                
            that.init();
        }
        console.log("committing..." + this.pageId);
        console.dir(this.data);
        // clear feedback
        ViewUtil.feedback.msgs = [];
        var that = this,            
            it, lt = this.tableIds.length,
            qm = new QueryMaker(IDXB),
            tableId, records, validated;
        this.qO = qm.qO;
        this.qO.tables = [];
        // ensure business rules are met
        // if warnings are to be ignored, then validation might be skipped.
        validated = this.isValidated(ignoreWarnings);
        if (!validated && !ignoreWarnings) {
            this.forceHighlight();
            ViewUtil.feedback.give();
            return false;
        }
        for (it = 0; it < lt; it++) {
            // reset
            this.invalidFields = [];
            // ensure that every record has all compulsory fields entered.                
            tableId = this.tableIds[it];
            records = that.data[tableId].records;
            // capture fields & values for sql statement.
            // if any mandatory field is null, force focus on the null field.
            if (!this.isTableQueryOk(tableId, records, cmdName)) {                
                // focus on invalid field...if any.
                if (this.invalidFields.length > 0) {
                    this.forceHighlight();
                    return false;
                } else {
                    alert("other query problem");
                    return;
                }
            }                             
        }                
        // confirm commit. if there's already a modal context, just commit.
        if (ViewUtil.state.modalView) {
            console.log("modal context commit.");
            return commit();
        } else {
            ModalUtil.dialog({
            title: "Confirmation",
            msgs: [Def.ModelMarkupCommand[cmdName + "_" + this.pageId].ConfirmationMessage] ||
                "Your work will be committed to the database.",
            gist: "Are you sure you want to submit?",
            options: [{
                opt: "Yes, submit.",
                "default": true,
                callback: function () {
                    HideUtil.modal();
                    return commit();
                }
            }, {
                opt: "No, don't submit."
            }]
        });
        }
    },
    /**
     * @description records in a table are captured in arrays, 
     * without respect to table constraints.
     * Normalizing the array will mean enforcing table constraints on the array.
     * e.g if two records/elements in the array have same values in their index fields,
     * they are combined into one element and a qty key is incremented.
     * @param {Object} table
     * @param {String} qtyKey
     * @returns {undefined}
     */
    normalizeTable: function (table, qtyKey) {
        var arr = [],
            indexes = table.indexFieldNames,
            blns = [];
        table.records.forEach(function (value, i) {
            if (i === 0) {
                arr.push(value);
            } else {
                indexes.forEach(function (x) {
                   //if (value[x]){} 
                });
            }
        });
        table.records = arr;
    },
    /**
     * 
     * @param {String} tableId
     * @param {String} key
     * @param {Number} index
     * @returns {undefined}
     */
    reflect: function (tableId, key, index) {
        var table = this.data[tableId],
            field = table.fields.first(function (field) {
                return (field.Name === key);
            }),
            fieldId = field.Id;
        if (!table.twinvalues[index]) {
            table.twinvalues[index] = {};
        }
        table.twinvalues[index][fieldId] = table.records[index][key];
    },
    reflectValues: function (tableId) {
        function getIds (names, table) {
            var ids = [];
            names.forEach(function (name) {
                var field = table.fields.first(function (field) {
                        return (field.Name === name);
                    });
                ids.push(field.Id);
            });
            return ids;
        }
        function reflectTable (tableId) {
            var table = that.data[tableId],
                named = that.data[tableId].records,
                ided = that.data[tableId].twinvalues,
                names = (named[0])? Object.keys(named[0]): [],
                ids = getIds(names, table);
            if (names.length === 0 || ids.length === 0) {return;}
            named.forEach(function (value, index) {
                var id;
                if (!ided[index]) {
                    ided[index] = {};
                }
                names.forEach(function (name, iName) {
                    id = ids[iName];
                    ided[index][id] = value[name];
                });
            });
        }

        var that = this,
            tableIds = [];
        if (tableId) {
            reflectTable(tableId); 
        } else {
            this.tableIds.forEach(function (tableId) {
               reflectTable(tableId); 
            });
        }
    },    
    updateFieldView: function (id, value, fieldId) {
        var el = document.getElementById(id), formatted, ppty;
        formatted = TypeUtil.getFormatted(value, fieldId, true); 
        try {
            if (el) {                
                ppty = (el.nodeName === "INPUT" || el.nodeName === "SELECT")? "value": "innerHTML";
                el[ppty] = formatted;
                //console.log("@updateFieldView: " + el.id + " = " + value + " == " + formatted);
            }
        } catch (err) {
            console.log(err.stack);
            Service.logError(err);
        }
    },
    updateViews: function () {
        var that = this, pageId = this.pageId, id, val, fieldId, fieldName, fields;
        this.tableIds.forEach(function (tableId) {
            if (that.data[tableId].tabled) {
                that.refreshTable(tableId);
            } else {
                fields = that.data[tableId].fields;                
                that.data[tableId].records.forEach(function (value) {
                    fields.forEach(function (field) {
                        fieldId = field.Id;
                        fieldName = field.Name;
                        id = HTMLUtil.getFieldId(fieldId, pageId);
                        val = value[fieldName];
                        // update fields (table rows are not updated here).
                        that.updateFieldView(id, val, fieldId);
                        //console.log(tableId + ": calc to: "+fieldName + " = " + val);
                    });
                });
            }
        });
    },
    rightPaneAction: function (e) {            
        var cmd = e.attr("id"),
            act = e.attr("data-action"),// command, setting, summary, etc
            cmdName = HTMLUtil.getListIdFrom(cmd);
        try {
            this.subModel[act](this, cmdName);
        } catch (err) {
            Service.logError(err);
        }
    },
    action: function (e) {            
        var id = e.attr("id"),
            cmdName = HTMLUtil.getCommandIdFrom(id);
        try {
            this.subModel.command(this, cmdName);
        } catch (err) {
            Service.logError(err);
        }
    },
    changeState: function (state, mode) {
        Model.state[state] = mode;
    },
    // table things //
    /**
     * @description Edit the target row in specified table.
     * @param {String} tableId
     * @param {Array} arr
     * @param {type} rownum
     * @returns {undefined}
     */
    editTableRow: function (tableId, arr, rownum) {
        function cb (data) {
            //console.log("prompt cb: tableId:" + tableId + " arr: " + arr + " rownum: " + rownum + " datakeys: " + Object.keys(data) + " tablekeys: " + Object.keys(data[tableId])); 
            //var destManifest = data[tableId].records[0], 
            var keys = Object.keys(data[tableId].records[0]);
            // there's only 1 item in this array.
            keys.forEach(function (key) {
                that.data[tableId].records[rownum][key] = data[tableId].records[0][key];
                // if record is flagged FromBE, unflag the BEDelete flag
                that.data[tableId].records[rownum].BEDelete = false;
            });
            that.runCalculations();
        }
        // assign already existing values, or use default values.
        var that = this, value;
        try {
            arr.forEach(function (f) {
                value = that.data[tableId].records[rownum][f.Name];
                f.Value = value || f.DefaultValue;
            });
            ModalUtil.prompt(arr, cb);
        } catch (err) {
            console.log(err.stack);
            Service.logError(err);
        }
    },
    /**
     * @description Delete the row from table
     * @param {String} tableId
     * @param {Number} rownum
     * @returns {undefined}
     */
    deleteTableRow: function (tableId, rownum) {
        if (this.data[tableId].records[rownum].FromBE) {
            this.data[tableId].records[rownum].BEDelete = true;
        } else {
            this.data[tableId].records.splice([rownum], 1);                
        }
        this.runCalculations();
    },
    /**
     * 
     * @param {String} tableId
     * @param {JQueryElementObject} e
     * @returns {undefined}
     */
    sortTableRow: function (tableId, e) {            
        var dir = e.attr("data-sortasc"),
            asc = (dir === "asc")? false: (dir === "desc")? true: true,
            fieldId = e.attr("data-fieldid"),
            ppty = Def.ModelFields[fieldId].Name;
        this.data[tableId].records.sort(function (a, b) {
            return TypeUtil.sortObject(a, b, ppty, asc);
        });
        this.updateViews();
        // flag direction
        dir = (asc)? "asc": "desc";
        e.attr("data-sortasc", dir);
    },
    refreshTable: function (tableId) {        
        var dataLen = this.data[tableId].records.length;
        try {    
            var that = this,
                tblId = HTMLUtil.getTableId(tableId, this.pageId),
                tbl = document.getElementById(tblId);
            if (!tbl) {return;}

            var tbody = tbl.tBodies[0],
                emptyClass = AI.htmlClass.emptyRow,
                emptyRow = tbody.querySelector("." + emptyClass),
                tBodyRows = Array.from(tbody.querySelectorAll("tr:not(." + emptyClass + ")")),
                rowNode = tBodyRows.length - 1,
                source;
            // check number of rows in data
            if (dataLen === 0) {
                this.emptyTable(tbl);
                this.sumTableColumns(tbl);
                return;
            }
            // if populated, match & update each cell for each row.
            //alert(this.data[tableId].records.length + " records for " + tableId);
            this.data[tableId].records.forEach(function (value, index) {
                // indicate whether record is to be deleted at the backend after commit.
                var strikeout = value.BEDelete,
                    tr;
                if (rowNode < index) {
                    // if html rows equals/lower than data rows
                    // add new row and populate
                    tr = tbody.insertRow();
                    tr.setAttribute("tabindex", index + 1);
                    tBodyRows.push(tr);
                }                    
                // assign source
                source = that.data[tableId].sources[index];                    
                // apply strikeout (if any)
                tr = tr || tBodyRows[index];                    
                // update current row 
                that.writeTableRow(tr, tbl, value, source, strikeout);
                that.data[tableId].fields.forEach(function (field) {
                    //console.log(tableId + ": calc to: " + field.Name + " = " + value[field.Name] + " @ index " + index);
                });
            });            
            if (emptyRow) {tbody.removeChild(emptyRow);}
            // delete excess rows
            while (rowNode >= dataLen) {
                tbody.removeChild(tbody.childNodes[rowNode]);
                --rowNode;
            }
            this.sumTableColumns(tbl);
        } catch(err) {
            Service.logError(err);
        }
    },
    /**
     * 
     * @param {HTMLTableRowObject} tr
     * @param {HTMLTableObject} tbl
     * @param {Object} value
     * @param {Object} source
     * @param {Boolean} strikeout
     * @returns {undefined}
     */
    writeTableRow: function (tr, tbl, value, source, strikeout) {
        function getSrcObject (mask) {
            if (mask) {
                if (source) {return source;} else {return value;}
            } else {
                if (value) {return value;} else {return source;}
            }
        }
        function getInnerHTML (mask, key) {
            var o = getSrcObject(mask),
                ppty = (mask)? mask: key,
                inner = (o)? SQLUtil.rows.getVal(o, ppty): undefined;
            //console.log("mask: " + mask + ", " + ppty + " = " + inner);
            return (inner !== undefined)? inner: "";
        }
        function getHeadings () {
            var arr = [],
                tr = thead.querySelector("tr"),
                tds = Array.from(tr.querySelectorAll("td"));
            tds.forEach(function (td) {
                var head = {};                                
                head.fieldId = td.getAttribute("data-fieldid");
                head.fieldName = Def.ModelFields[head.fieldId].Name;
                head.alias = Def.ModelFields[head.fieldId].Alias;
                head.useMask = TypeUtil.toBln(Def.ModelFields[head.fieldId].UsePopularMask);
                arr.push(head);
            });
            return arr;
        }
        function cueVisualDeletion (inner, fieldId, td) {
            var del = document.createElement("DEL");
            inner = TypeUtil.getFormatted(inner, fieldId);
            td.innerHTML = "";
            if (td.children.length === 0 && strikeout) {                        
                del.innerHTML = inner;
                td.appendChild(del);
                return;
            }
            if (td.children.length > 0 && !strikeout) {
                while (td.children.length > 0) {
                    td.removeChild(td.childNodes[0]);
                }
                td = inner;
                return;
            }
            td.innerHTML = inner;
        }
        //console.log("row value");console.dir(value);
        var thead = tbl.tHead;
        // grab headings and insert data into each cell in the row. 
        // format according to data type.
        getHeadings().forEach(function (head, index) {
            try {
                var td = tr.childNodes[index] || tr.insertCell(),
                    mask, key = head.fieldName, inner;
                // if field is numeric, align right
                if (Def.ModelFields[head.fieldId].DataType === "Number") {
                    td.classList.add("w3-right-align");
                }                
                // if field uses popular mask, apply it.
                if (head.useMask) {
                    mask = DefUtil.getPopularMask(head.fieldId).Name;
                }
                // get value of matching key in manifest,
                inner = getInnerHTML(mask, key);
                // apply visual deletion for records to be deleted at backend upon commit.
                cueVisualDeletion(inner, head.fieldId, td);
                if (mask) {
                    //console.log("has source? " + Boolean(source) + ", source has mask key? " + Boolean(Object.keys(source).indexOf(mask)) + ", inner: " + inner + ", mask: " + mask + ", key: " + key);
                }                                      
            } catch (err) {
                console.log(err.stack);
                Service.logError(err);
            }
        });            
    },
    emptyTable: function (tbl) {
        try {
            if (tbl) {
                var tbodies = Array.from(tbl.tBodies);
                tbodies.forEach(function (tbody) {
                    while (tbody.hasChildNodes()) {
                        tbody.removeChild(tbody.childNodes[0]);
                    }
                });
                this.writeEmpty(tbl);
            }
        } catch (err) {
            Service.logError(err);
        }
    },
    writeEmpty: function (tbl) {
        MarkupUtil.table.emptyRow(tbl);
    }, 
    /**
     * 
     * @param {HTMLTableElementObject} tbl
     * @returns {undefined}
     */
    sumTableColumns: function (tbl) {
        var tableId = HTMLUtil.getTableIdFrom(tbl.id),
            thead = $(tbl).find("thead"),
            that = this;
        this.data[tableId].fields.forEach(function (field, i) {
            var fieldId = field.Id,
                fieldName = field.Name,
                cell = thead.find("td[data-fieldid='" + fieldId + "']"),
                sumSpan, summand, sum;
            if (field.IsSummable) {
                sumSpan = cell.find("span");
                sum = 0;
                //console.log("fieldId " + fieldId);
                //console.log("index " + i);
                //console.log("rows " + lRows);
                //for (var iRow = 0; iRow < lRows; iRow++) {
                that.data[tableId].records.forEach(function (record) {
                    summand = record[fieldName] || 0;
                    //console.log("add " + summand);
                    sum += Number(summand);
                });
                sum = TypeUtil.getFormatted(sum, fieldId, true);
                //console.log("sum for " + fieldId + " = " + sum);
                sumSpan.text(sum);
            }
        });
    },
    //--page actions--//
    runModuleMethod: function (method) {
        return this.subModel[method](this);
    },
    /**
    * @description text
    * @returns {undefined}
    */
    runCalculations: function () {
        var that = this,
            calculations = this.runModuleMethod("calculable");
        if (!calculations) {
            console.log("update views from runCalculations");
            this.updateViews();            
            return;
        }
        try {
            this.destTables.sort(function (a, b) {
                return TypeUtil.sortObject(a, b, "ValidationRank", true);
            }).forEach(function (table, index, thisArg) {
                var tableId = table.Id,
                    tableName = Def.ModelTables[tableId].Name,
                    update = (index + 1 === thisArg.length)? true: false,
                    fields = that.data[tableId].fields.filter(function (field) {
                        return (field.IsCalculable && !field.IsStamp);
                    }).sort(function (a, b) {
                        return TypeUtil.sortObject(a, b, "ValidationRank", true);
                    });
                // loop through all calculable fields per record.
                that.data[tableId].records.forEach(function (record) {
                    // NOTE: omit any record with its BEDelete field marked as true;
                    if (record.BEDelete) {return;}
                    fields.forEach(function (field) {
                        if (calculations[tableName][field.Name]) {
                            calculations[tableName][field.Name](record);
                        }
                    });
                });
                if (update) {that.updateViews();}
            });
        } catch (err) {
            console.log(err.stack);
        }
    },
    /**
     * 
     * @returns {Boolean}
     */
    isValidated: function () {
        var that = this,
            invalidField, invalidTable,
            validations = this.runModuleMethod("validatable");
        // if no validation object, return.
        //console.log("validation object");console.dir(validations);
        if (!validations) {return true;}
        try {
            // check fields in all tables that did not pass biz rules/common logic.
            invalidTable = this.destTables.sort(function (a, b) {
                return TypeUtil.sortObject(a, b, "ValidationRank", true);
            }).first(function (destTable) {
                var table = Def.ModelTables[destTable.Id],
                    tableId = table.Id,
                    tableName = table.Name,
                    alias = table.Alias || table.Name,
                    musthave = destTable.MustHaveRecords,
                    records = that.data[tableId].records,
                    musthaveMsg = table.ValidationMessage || "No records found for " + alias;
                if (musthave && records.length === 0) {
                    that.invalidTableId = tableId;
                    ViewUtil.feedback.push(musthaveMsg, "err");
                    return true;
                }
                // loop through all validatable fields.
                // but first, find them, sort them, then loop through them.
                invalidField = that.data[tableId].fields.filter(function (field) {
                    return (field.IsValidatable);
                }).sort(function (a, b) {
                    return TypeUtil.sortObject(a, b, "ValidationRank", true);
                }).first(function (field) {
                    // return upon first invalid input.
                    var valid = true;
                    if (validations[tableName]) {
                        if (validations[tableName][field.Name]) {             
                            valid = validations[tableName][field.Name]();
                            // pass field id so that validation msgs may be used.
                            console.log("valid: " + tableName + "-" + field.Name + " = " + valid);
                            if (!valid) {
                                if (field.Name === "HasCharges") {
                                    alert("hascharges is valid? " + valid);
                                }
                                that.invalidFields.push(field);
                            } 
                        }
                    }
                    // invert bln, as we're checking for invalids.                    
                    return !valid;//return (valid)? false: true;
                });
                //alert("is table " + tableName + " validated? " + !invalidField);
                return !!(invalidField);
            });
        } catch (err) {
            console.log(err.stack);
        }        
        return !invalidTable;
    },
    changeables: function (e) {
        var fieldId = HTMLUtil.getFieldIdFrom(e.attr("id")),
            field = Def.ModelFields[fieldId],
            fieldName = field.Name,
            tableName = Def.ModelTables[field.TableId].Name,       
            change = this.subModel.changeable(this) || {};
        if (change[tableName]) {
            if (change[tableName][fieldName]) {
                change[tableName][fieldName]();
            }
        }
    },
    /* -- Unified Method Signatures --*/
    runAction: function (cmdName) {
        
    },
    runEllipsisAction: function () {
        
    },
    validate: function () {
        this.subModel.validate();
    },
    calculate: function () {
        
    },
    crucialChange: function () {
        
    }
    /* -- Unified Method Signatures --*/
};