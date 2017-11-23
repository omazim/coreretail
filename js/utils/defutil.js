"use strict";
var DefUtil = (function () {
        var me = {
                tableIdPattern: /^T[0-9]+$/,// e.g T123
                fieldIdPattern: /^F[0-9]+$/,// e.g F123
                pageIdPattern: /^M[0-9]+$/,// e.g M123
                commonFieldIdPattern: /^FC[0-9]+$/,// e.g FC123...optional C for 'Common'
                searchTagPattern: /([0-9]{2,}|[a-z]{3,})/gi,
                /**
                 * @function isFieldId
                 * @param {String} str
                 * @returns {Def.ModelFields.Rows.Id}
                 */
                isFieldId: function (str) {
                    return this.fieldIdPattern.test(str);// e.g "F123" or "FC123"        
                },
                /**
                 * @function isTableId
                 * @param {String} str
                 * @returns {Def.ModelFields.Rows.Id}
                 */
                isTableId: function (str) {
                    return this.tableIdPattern.test(str);// e.g "T123"        
                },                
                sniffTableArg: function (table, getId) {
                    getId = !!(getId);
                    var ppty = (getId)? "Id": "Name";
                    console.log("@sniffTableArg: " + table);
                    return(this.isTableId(table))? table: Def.ModelTables[table][ppty];
                },
                isPageId: function (str) {
                    return this.pageIdPattern.test(str);// e.g "M123"        
                },
                sniffPageArg: function (page, getId) {
                    getId = !!(getId);
                    var ppty = (getId)? "Id": "Name";
                    return(this.isPageId(page))? page: Def.ModelPages[page][ppty]; 
                },
                /** 
                * @description return fields through which a record can be pulled up for editing.
                * @description and are either pk or indexed fields of their table.
                * @param {String} tableId
                * @param {Array} fields - fields to be filtered.
                * @param {Array} exemptions field names to be exempted.
                * */
                getIngressFields: function (tableId, fields, exemptions) {
                    if (fields.length === 0) {
                        fields = Def.ModelFields.Rows;
                    }
                    exemptions = exemptions || [];
                    return fields.filter(function (field) {
                        if (field.TableId === tableId) {
                            if (!field.IsShadow && (field.IsIndexed || field.IsPK)) {
                                if (exemptions.indexOf(field.Name) >= 0) {
                                    return (exemptions.indexOf(field.Name) < 0)? true: false;
                                } else {
                                    return true;
                                }
                            }
                        }
                    });
                },
                /** 
                * @description return indexed or pk fields
                * @param {String} tableId
                * @param {Array} fields - fields to be filtered.
                * */
                getPKFields: function (tableId, fields) {
                    fields = fields || [];
                    if (fields.length === 0) {
                        fields = Def.ModelFields.Rows;
                    }
                    return fields.filter(function (field) {
                        if (field.TableId === tableId && (field.IsPK || field.IsCompPK)) {
                            return field;
                        }
                    });
                },
                getTallyFieldId: function (tableId) {
                    var fieldId;
                    Def.ModelFields.Rows.first(function (f) {
                        if (f.TableId === tableId && f.IsTally) {
                            fieldId = f.Id;
                            return true;
                        };
                    });
                    return fieldId;
                },
                getFieldIdByNameAndTable: function (fieldName, table) {
                    //console.log("getFieldIdByNameAndTable: " + fieldName + " on " + table);
                    var fieldDef,
                        tableId = (this.isTableId(table))? table: Def.ModelTables[table].Id;
                    fieldDef = Def.ModelFields.Rows.first(function (field) {
                        return (field.TableId === tableId && field.Name === fieldName);
                    });            
                    // if null, check in common fields
                    if (!fieldDef) {
                        fieldDef = Def.ModelCommonFields.Rows.first(function (field) {
                            return (field.Name === fieldName);
                        });
                    }
                    if (!fieldDef) {
                        console.log("No " + fieldName + " on " + table + ", nor on Common Table");
                    }
                    return fieldDef.Id;
                },
                getFieldIdByName: function (fieldName) {
                    var fieldDef = Def.ModelFields.Rows.first(function (field) {
                        return (field.Name === fieldName);
                    });            
                    return (fieldDef)? fieldDef.Id: undefined;
                },
                getTableIdByName: function (name) {
                    var id;
                    Def.ModelTables.Rows.first(function (table) {
                        if (table.Name === name) {
                            id = table.Id;
                            return true;
                        }
                    });
                    return id;
                },        
                /**
                 * 
                 * @param {type} fieldId
                 * @returns {unresolved}
                 */
                getDependantField: function (fieldId) {
                    // find the field that depends on the value of fieldId.
                    return Def.ModelFields.Rows.first(function (field) {
                        return (field.BasedOnFieldId === fieldId);
                    });                    
                },
                /**
                 * 
                 * @param {String} table Pass tableName or tableId.
                 * @returns {Array}
                 */
                getTableFields: function (table) {
                    table = this.sniffTableArg(table, true);
                    return Def.ModelFields.Rows.filter(function (field) {
                        return (field.TableId === table);
                    });
                },
                /**
                 * 
                 * @param {String} table
                 * @returns {Array}
                 */
                getTableFieldNames: function (table) {            
                    var fieldNames = this.getTableFields(table).map(function (field) {
                        return field.Name;
                    });
                    // add common fields
                    var commonFields = this.getTableFields("Model_CommonFields").map(function (field) {
                        return field.Name;
                    });
                    return fieldNames.concat(commonFields);
                },
                /**
                 * 
                 * @param {Array} fields
                 * @param {String} fieldName
                 * @returns {fields@call;first.Id}
                 */
                getFieldIdFromTableFields: function (fields, fieldName) {
                    var field = fields.first(function (field) {
                            return (field.Name === fieldName);
                        });
                    if (fields) {return field.Id;}
                },
                /**
                * @description Read the fields in a table.
                * @param {String} table Name of table to be read.
                * @param {Object} options
                * @param {String} sortby
                * @param {Boolean} desc
                * @returns {Array}
                */
                getTableFieldsOpt: function (table, options, sortby, desc) {                
                    // todo: 18 oct 2017.
                    // refine this function to take and & or properties on the options args.
                    // this will make it more flexible to filter fields like a Where clause.
                    var opts = (options)? Object.keys(options): [];
                    table = this.sniffTableArg(table, true);
                    sortby = sortby || "Rank"; desc = !!(desc); 
                    return Def.ModelFields.Rows.filter(function (field) {
                        if (field.TableId === table) {
                            var blns = [], passOpts;
                            if (opts.length > 0) {
                                opts.forEach(function (opt) {
                                    if (field[opt]) {blns.push(true);}
                                });
                            } else {
                                return true;
                            }
                            return (blns.length === opts.length);
                        }
                    }).sort(function (a, b) {
                        return TypeUtil.sortObject(a, b, sortby, desc);
                    });
                },
                /**
                 * 
                 * @param {type} tableId
                 * @returns {Array}
                 */
                getDropDownKeys: function (tableId) {
                    tableId = this.sniffTableArg(tableId, true);
                    var arr = [],
                        pops = this.getTableFieldsOpt(tableId, {IsPopular: true}),
                        vals = this.getTableFieldsOpt(tableId, {IsSelectValue: true}),
                        valspops = vals.concat(pops);
                    //console.log("valspops " + tableId);console.log(valspops);
                    valspops.forEach(function (vp) {
                        if (vp) {arr.push(vp.Name);}
                    });
                    // return the select value key as the first element in array.
                    return arr;
                },
                //--grafted from modules.dataDef--//
                getDestTableIds: function (pageId) {
                    var tableIds = [];
                    Def.ModelDestTables.Rows.filter(function (row) {
                        return (row.PageId === pageId);
                    }).forEach(function (table) {
                        tableIds.push(table.Id);
                    });
                    return tableIds;
                },
                /**
                * @description Get all field objects marked in a submenu.
                * @param {String} pageId
                * @param {String} sortField
                * @param {Boolean} desc
                * @returns {Array}
                */
                getWizardFields: function (pageId, sortField, desc) {                    
                    var pryTable = Def.ModelDestTables.Rows.first(function (table) {
                            return(table.PageId === pageId && table.IsPrimary);
                        });
                    return Def.ModelFields.Rows.filter(function (field) {                
                        return(pryTable.Id === field.TableId && !field.IsShadow);
                    }).sort(function (a, b) { 
                        return TypeUtil.sortObject(a, b, sortField, desc);
                    });
                },
                /**
                 * 
                 * @param {String} fieldName | fieldId
                 * @param {Boolean} what get table or field object
                 * @returns {origin.TableId|Def@arr;ModelTables.Name}
                 */
                getOrigin: function (fieldName, what) {
                    what = what || "table";
                    if (this.isFieldId(fieldName)) {fieldName = Def.ModelFields[fieldName].Name;}
                    var origin = Def.ModelFields.Rows.first(function (field) {
                            return(field.Name === fieldName && field.IsOrigin);
                        });
                    if (!origin) {
                        origin = Def.ModelFields.Rows.first(function (field) {
                            return(field.Name === fieldName);
                        });
                    }
                    return(origin)? ((what === "table")? origin.TableId: origin.Id): null;
                },
                /**
                 * @description As field names correlate,
                 * @description certain details of a field name in one table can be interchanged.
                 * @param {String} fieldName
                 * @returns {unresolved}
                 */
                getFieldAlias: function (tf) {
                    // modify fieldName, as it may sometimes have the format tableName_fieldName   
                    var fieldName;
                    if (tf.indexOf("_") >= 0) {
                        fieldName = tf.split("_")[1];
                    } else {
                        fieldName = tf;
                    }
                    var field = Def.ModelFields.Rows.first(function (row) {                    
                            return (row.Name === fieldName); 
                        });
                    if (field === null) {
                        console.log("no field alias for: " + fieldName + " ~ " + tf);
                        return fieldName;
                    }
                    return field.Alias || fieldName;
                },
                /**
                 * 
                 * @param {String} fieldId
                 * @param {String} pageId
                 * @returns {Boolean}
                 */
                isHField: function (fieldId, pageId) {
                    var groupName = Def.ModelFields[fieldId].Group,
                        gManifest = Def.ModelMarkupGroup.Rows.first(function (group) {
                            return (group.Name === groupName && group.PageId === pageId);
                        });
                    return (gManifest)? gManifest.IsHorizontal: false;
                },
                /**
                * @function getMenus
                * @returns {Array}
                */
                getMenusArray: function () {                
                    return Def.ModelPageGroups.Rows.sort(function (a, b) {
                        return TypeUtil.sortObject(a, b, "Name");
                    });
                },
                /**
                 * @function getSubmenus
                 * @param {String} menuName
                 * @returns {Array}
                 */
                getSubmenusArray: function (menuName) {
                    var menuId = Def.ModelPageGroups[menuName].Id;    
                    return Def.ModelPages.Rows.filter(function (row) {           
                        if (menuId === row.PageGroupId) {return row;}
                    }).sort(function (a, b) {
                        return TypeUtil.sortObject(a, b, "Alias");
                    });
                },
                /**
                 * @description Return the preferred column name for a table column.
                 * @description Certain fields may be unpopular when used as a column heading.
                 * @description e.g using CategoryId in shopping cart. Instead, CategoryName is used.
                 * @description There's only one popular field per table.
                 * @param {String} fieldId
                 * @returns {unresolved}
                 */
                getPopularMask: function (fieldId) {
                        var tableId = Def.ModelFields[fieldId].RelatedTableId;
                        return Def.ModelFields.Rows.first(function (field) {
                            return (field.TableId === tableId && field.IsPopular);
                        });
                    },
                //--end graft--//
                //--grafted from module.pagedef--//
                getSrcTableIds: function (pageId) {
                    var tableIds = [];
                    Def.ModelDestTables.Rows.filter(function (row) {
                        return (row.PageId === pageId);
                    }).forEach(function (table) {
                        tableIds.push(table.Id);
                    });
                    return tableIds;
                },
                /**
                 * @description Get the field definitions for any page.
                 * @description These field are to be displayed on the page markup.
                 * @param {Object} args
                 * @description the args is an object with following properties:
                 * groupName - group field belongs to
                 * tabName - tab heading field belongs to
                 * @returns {unresolved}
                 */
                _getFields: function (args) {
                    var tableIds = this.getDestTableIds(args.pageId),
                        fields = Def.ModelFields.Rows.filter(function (field) {
                            if (tableIds.indexOf(field.TableId) >= 0) {
                                return field;
                            }
                        });
                    // filter for fields to markup under tab content
                    if (args.tabName) {
                        fields = fields.filter(function (f) {
                            return(f.Content === args.tabName);
                        });
                    }
                    // filter for fields to markup under field group
                    if (args.groupName) {
                        fields = fields.filter(function (f) {
                            return(f.Group === args.groupName);
                        });
                    }
                    // must not be shadow or must be salient
                    if (args.hasOwnProperty("isShadow")) {
                        fields = fields.filter(function (f) {
                            return (TypeUtil.toBln(f.IsShadow) === args.isShadow);
                        });
                    }
                    // must not be shadow or must be salient
                    if (args.hasOwnProperty("isSalient")) {
                        fields = fields.filter(function (f) {
                            return (TypeUtil.toBln(f.IsSalient) === args.isSalient);
                        });
                    }
                    // exclude fields in destination 'remove list'
                    fields = fields.filter(function (f) {
                        var oN = Def.ModelRemoveDestFields[f.Name];
                        if (!oN) {return f;}
                        if (!oN[args.pageId]) {return f;}
                    });

                    // finally, sort in order of rank.
                    fields.sort(function (a, b) {
                        return me.util.sortObject(a, b, "Rank", true);
                    });
                    return fields;
                },
                getPrimaryTableId: function (pageId) {
                    var id = "";
                    Def.ModelDestTables.Rows.first(function (table) {
                        if (table.IsPrimary && table.PageId === pageId) {
                            id = table.Id;
                            return true;
                        }
                    });
                    return id;
                },
                /**
                 * @description
                 * @param {Object} page
                 * @param {String} role
                 * @returns {undefined|page.tableIds@call;first.Id}
                 */
                getTableIdByRole: function (page, role) {
                   var pageId = page.pageId,
                       tableId = page.tableIds.first(function (tableId) {
                           var compIdx = tableId + "_" + pageId;
                           return (Def.ModelDestTables[compIdx].Role === role);
                       });
                   return tableId;
                },
                getSecondaryTableIds: function (pageId, pryId, secArr) {
                    return Def.ModelDestTables.Rows.filter(function (dest) {
                        return (dest.PageId === pageId && !dest.IsPrimary);
                    }).map(function (dest) {
                        return dest.Id;
                    });
                },
                getHighestRankCommand: function (pageId) {
                    var cmds = Def.ModelMarkupCommand.Rows.filter(function (cmd) {
                            return(cmd.PageId === pageId);
                        }).sort(function (a, b) {
                            return TypeUtil.sortObject(a, b, "Rank", true);
                        });
                    return cmds[0];
                },
                //--end graft--//
                /**
                * @description These are common fields whose values are calculated and stamped
                * @description onto any record just before the record is committed to database.
                * @description They are to be finalized just before committing to database.
                * * common fields are stamps.
                UserId = user id that worked on a record
                CommitTime = date & time a record was sent to database
                * @param {Object} fieldName
                * @param {String} cmdName
                * @param {String} recStatus
                * @returns {undefined}                        
                 */
                stamp: function (fieldName, cmdName, recStatus, pageId) {
                    console.log("fieldName: " + fieldName + " command: " + cmdName + " status: " + recStatus + " pageId: " + pageId);
                    var stamps = {
                            // unique string that identifies a single action sql
                            AnchorId: function () {
                                // use format AA-19072017-105300-DiskSerial-4-DigitRandom
                                // AA-DDMMYY-HHMMSS-A00-HG
                                // length = 2 + 8 + 6 + 10 + 6 = 32
                                // disk serial number === LocalMachine
                                var alphas = Misc.getAlpha(2),
                                    d = String(new Date().getDate()),
                                    m = new Date().getMonth() + 1,
                                    y = new Date().getFullYear(),
                                    h = new Date().getHours(),
                                    n = new Date().getMinutes() + 1,
                                    s = new Date().getSeconds() + 1,
                                    date = d + m + y + h + n + s,
                                    ds = Model.session.LocalMachine,
                                    rnd = Misc.getRandom(4),
                                    str = [alphas, date, ds, rnd];
                                return str.join("-");  
                            },                    
                            PostDate: function () {
                                return new Date().getTime();
                            }, 
                            // workstation from which record was entered
                            LocalMachine: function () {
                                return me.autoValue("LocalMachine");  
                            },
                            // status of record (pending, closed, voided).
                            Status: function () {                            
                                var ppty = cmdName + "_" + pageId,
                                    nostatus = null,
                                    useStatus,
                                    status = Def.ModelMarkupCommand[ppty].RecordStatus,
                                    oRank = Def.ModelRecordStatuses[recStatus].Rank,
                                    nRank = Def.ModelRecordStatuses[status].Rank;
                                // caveats
                                console.log(nRank + " " + oRank + " ");
                                console.log(fieldName + " REC STATUS " + recStatus + " " + status);
                                if (nRank === oRank) {
                                    if (status === "MODIFIED" && Def.ModelPages[pageId].CanModify) {
                                        useStatus = status;
                                    } else {
                                    //if (status === "PENDING" || status === "ENTERED") {
                                        useStatus = status;
                                    //} else {
                                        //alert("nRank: " + nRank + ", recStatus: " + recStatus);
                                    //    useStatus = nostatus;
                                    }
                                } else { 
                                    useStatus = (nRank > oRank)? status: nostatus;
                                }
                                console.log("Status: " + useStatus);
                                return useStatus;
                            },
                            PostUserId: function () {
                                return Model.session.UserId;
                            }
                        };
                    try {
                        return stamps[fieldName]();
                    } catch (err) {
                        console.log("no stamp for: " + fieldName + " | " + err.stack);
                        Service.logError(err);
                        return undefined;
                    }
                },
                autoValue: function (fieldId) {
                    if (!this.isFieldId(fieldId)) {
                        fieldId = this.getFieldIdByName(fieldId);
                    }
                    if (!fieldId) {return undefined;}
                    var fieldName = Def.ModelFields[fieldId].Name,
                        format = Def.ModelFields[fieldId].DataFormat,
                        size = Def.ModelFields[fieldId].DataSize,
                        auto = {
                            LocalMachine: function () {
                                if (Model.session.LocalMachine) {
                                    return Model.session.LocalMachine;
                                }
                                return new Date().getTime();
                                /*sn(function (err, value) {                                
                                    Model.session.LocalMachine = (err)?
                                        "UNKNOWN_PROXY_SERVER-" + new Date().getTime(): value;
                                });*/
                            },
                            TimeId: function (size) {
                                return (String(new Date().getTime()).substr(-size));
                            }
                        };
                    try {
                        if (format === "TimeId") {
                            return auto.TimeId(size);
                        }
                        return auto[fieldName]();
                    } catch (err) {
                        console.log("no stamp for: " + fieldName + "  " + err.stack);
                        //Service.logError(err);
                        return undefined;
                    }
                }            
            };
        return me;
    })();