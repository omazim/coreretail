var HTMLUtil = (function () {
    var me = {
            getTag: function (tag) {
                switch (tag) {
                case "input":
                    return "inp";
                    break;
                case "select":
                    return "sel";
                    break;
                case "span":
                    return "spn";
                    break;
                case "section":
                    return "sect";
                    break;
                case "header":
                    return "hdr";
                    break;
                case "table":
                    return "tbl";
                    break;
                case "tr":
                    return "row";
                    break;
                case "td":
                    return "cell";
                    break;
                case "caption":
                    return "cap";
                    break;
                case "a":
                    return "lnk";
                    break;
                case "p":
                    return "par";
                    break;
                case "form":
                    return "frm";
                    break;
                case "button":
                    return "btn";
                    break;
                case "li":
                    return "lst";
                    break;
                default:
                    return tag;
                }
            },
            getSMListId: function (pageId) {
                return this.getTag("li") + pageId + "SMList";
            },
            getSMListContainerId: function (m) {
                return this.getTag("ul") + m + "SMListContainer";
            },
            getFormId: function (pageId) {
                return "Form_" + pageId;
            },
            getContainerId: function (name, pageId) {
                return name + "_Container_" + pageId;
            },
            getPaneId: function (name, pageId) {
                return name + "_Pane_" + pageId;
            },
            getPaneUlId: function (name, pageId) {
                return name + "_Ul_" + pageId;
            },
            getHandyButtonId: function (name, side) {
                return name + "_" + side + "_PaneLink";
            },
            getHandyButtonNameFrom: function (id) {
                // id format: 'Command_RightPaneLink
                return id.split("_")[0];
            },
            /**
             * 
             * @param {String} name
             * @param {String} pageId
             * @returns {String}
             */
            getTabAnchorId: function (name, pageId) {
                return name + "_TabAnchor_" + pageId;
            },
            /**
             * 
             * @param {String} name
             * @param {String} pageId
             * @returns {String}
             */
            getContentId: function (name, pageId) {
                return name + "_Content_" + pageId;
            },            
            getListId: function (name, pageId) {
                return name + "_List_" + pageId;
            },
            getPageActionBarId: function (pageId) {
                return "ActionBar_" + pageId;
            },
            getListIdFrom: function (id) {
                return id.split("_")[0];
            },            
            /**
             * 
             * @param {type} name
             * @param {type} pageId
             * @returns {String}
             */
            getTabListId: function (name, pageId) {
                return name + "_TabList_" + pageId;
            },
            getSubTabListId: function (name, groupId) {
                return name + "_SubTabList_" + groupId;
            },
            getMenuButtonId: function (name) {
                return name + "_MenuButton";
            },
            /**
             * @param {type} fieldId
             * @param {type} pageId
             * @returns {String}
             */
            getFieldId: function (fieldId, pageId) {
                return fieldId + "_" + pageId;
            },
            /**
             * 
             * @param {String} id
             * @returns {String}
             */
            getFieldIdFrom: function (id) {
                try {
                    return id.split("_")[0];
                } catch (err) {
                    Service.logError(err);
                }
            },
            getPageIdFrom: function (id) {
                // the page id is usually the last component of ids.
                var arr = id.split("_"), l = arr.length;
                return arr[--l];
            },
            getGroupId: function (name, content, pageId) {
                return name + "_" + content + "_" + pageId;
            },
            getGroupIdFrom: function (id) {
                return id.split("_")[0];
            },
            getContentNameFromGroupId: function (id) {
                return id.split("_")[1];
            },
            getNamePartFromId: function (id) {
                return id.split("_")[0];
            },
            getRolePartFromId: function (id) {
                var arr = id.split("_"), l = arr.length;
                return (l >= 1)? arr[1]: undefined;
            },
            getSMIdPartFromId: function (id) {
                var arr = id.split("_"), l = arr.length;
                return (l >= 2)? arr[2]: undefined;
            },
            getTableId: function (tableId, pageId) {
                return tableId + "_" + pageId;
            },
            getTableIdFrom: function (id) {
                return id.split("_")[0];
            },
            /**
             * @function getPopupId
             * @param {String} id
             * @returns {String}
             */
            getPopupId: function (id) {
               return id + "_popup";
            },
            getCommandId: function (id, pageId) {
                return "cmd_" + id + "_" + pageId;
            },
            getCommandIdFrom: function (id) {
                return id.split("_")[1];
            },
            //--grafted from viewutil---//
            /**
             * 
             */
            containerize: function (arr, args) {
                var container = me.getObj("div");
                container.attr.class = args.class;
                container = me.get(container);
                arr.forEach(function (node) {
                    node = container.cloneNode(true).appendChild(node);                    
                });
            },
            /**
             * @param {Object} o
             * @returns {HTML Element Object}
             */
            get: function (o) {
                var e = document.createElement(o.tag);
                this.attr(e, o);
                return e;
            },
            getObj: function (tag) {
                var o = {};
                o.tag = tag;
                o.attr = {};
                o.style = {};
                return o;
            },
            /**
             * @param {HTMLElementObject} e
             * @param {Object} o Attributes to be applied.
             * @returns {undefined}
             */
            attr: function (e, o) {
                var arrAttr = [],
                    arrStyle = [],
                    name, value;
                if (o.attr) {arrAttr = Object.keys(o.attr);}
                if (o.style) {arrStyle = Object.keys(o.style);}        
                /* Atributes*/
                for (var i = (arrAttr.length - 1); i >= 0; i--) {
                    name = arrAttr[i].replace("_", "-");//just in case its a data-* attribute.
                    value = o.attr[arrAttr[i]];            
                    if (value === undefined || value === null) {continue;}
                    if (typeof value === "boolean" && !name.startsWith("data-")) {
                        if (value) {
                            value = "";
                            e.setAttribute(name, value);
                        }
                    } else {
                        e.setAttribute(name, value);
                    }
                }
                /* Styles*/
                for (var i = (arrStyle.length - 1); i >= 0; i--) {            
                    name = arrStyle[i].replace("_", "-");//just in case its a data-* attribute.
                    value = o.style[arrStyle[i]];            
                    if (value === undefined || value === null) {continue;}
                    e.style[name] = value;
                }
                /* InnerHTML */
                if (o.innerHTML) {
                    e.innerHTML = o.innerHTML;
                }
            },
            //---DROP DOWNS---//
            /**
             * 
             * @param {HTMLElementObject} select
             * @param {String} tableId
             * @returns {undefined}
             */
            fillDropDown: function (select, chooseFromTableId) {
                // fill from Model, regular or from simple booleans.
                if (chooseFromTableId) {
                    var pageId = this.getPageIdFrom(select.id),
                        fieldIdB = this.getFieldIdFrom(select.id),                        
                        fieldB = Def.ModelFields[fieldIdB],
                        fieldIdA = fieldIdB.BasedOnFieldId,
                        idA = this.getFieldId(fieldIdA, pageId),
                        elA = document.getElementById(idA),
                        valueA = (elA)? elA.value: null,
                        chooseFromTableName = Def.ModelTables[chooseFromTableId].Name,
                        keysToUse = DefUtil.getDropDownKeys(chooseFromTableId),
                        rows = [];
                    // if field is based on another,
                    // then fill intelligently
                    if (elA) {
                        this.fillDependentDropDown(fieldIdA, valueA, fieldB);
                        return;
                    }
                    if (chooseFromTableName.startsWith("Model_")) {
                        chooseFromTableName = chooseFromTableName.replace("_", "");
                        rows = Def[chooseFromTableName].Rows;
                        this.populate(select, rows, keysToUse);
                    }                    
                } else {
                    // with no format arg, Yes/No will be returned.
                    this.populate(select, TypeUtil.getBln());
                }
            },
            /**
            * @description fill passed select element with options.
            * @param {String} select
            * @param {Array} rarr
            * @param {Array} keys keys of the array elements to use.
            * @returns {undefined}
            */
            populate: function (select, arr, keys) {
                function normalizeKeys () {  
                    if (keys) {
                        // when keys are empty, but record is an object,
                        // use the keys of the object,
                        keys = (isObj && keys.length === 0)? Object.keys(arr[0]):
                            keys;
                    } else {
                        // otherwise use the 
                        keys = (isObj)? Object.keys(arr[0]): [];
                    }
                }       
                if (!Array.isArray(arr)) {arr = [];}
                var option,
                    isObj = !!(typeof arr[0] === "object");
                normalizeKeys();
                //console.log(arr);
                //console.log("usekeys for " + select.id + ": " + keys);
                arr.forEach(function (row) {
                    try {
                        option = document.createElement("OPTION");
                        option.value = (isObj)? row[keys[0]]: row;
                        if (isObj) {
                            keys.forEach(function (key, i) {
                                // use double pipe to separate columns.
                                option.text += (i === 0)? row[key]: " || " + row[key];
                            });
                        } else {
                            option.text = row;
                            if (select.getAttribute("data-dv") === row) {
                                option.setAttribute("selected","");
                            }
                        }                        
                        select.add(option);
                    } catch (err) {
                        Service.logError(err);
                        console.log(err.stack);
                    }
               });
            },
            expand: function (event) {
               var select = event.target;
               select.click();
               //select.size = select.length;
            },
            collapse: function (event) {
                   var select = event.target;
                   select.size = 0;
                },
            clearSelectOptions: function (select) {
                var i = select.options.length;
                while (i > -1) {
                    select.remove(i);
                    i--;
                }
            },
            removeChildren: function (parent, child) {
                try {
                    if (child) {
                        parent.removeChild(child);
                    } else {
                        while (parent.hasChildNodes()) {
                            parent.removeChild(parent.lastChild);
                        }
                    }
                } catch (err) {
                    Service.logError(err);
                }
            },
            /**
             * 
             * @param {type} fieldId
             * @param {type} value
             * @param {type} depField
             * @returns {undefined}
             */
            fillDependentDropDown: function (fieldId, value, depField) {
                function query () {
                    var qm = new QueryMaker(IDXB),
                        to1 = qm.getTO(), to2 = qm.getTO(),
                        jo = qm.getJO(),
                        cfo1 = qm.getCFO(), cfo2 = qm.getCFO();
                    to1.name = tableName;            
                    cfo1.tableName = tableName;
                    cfo1.fieldName = fieldName;
                    cfo1.values = [value];
                    cfo1.andor = 1;
                    cfo1.operators = [0];            
                    // dependent field
                    to2.name = depOriginTableName;
                    // join
                    jo.tableNames.push(tableName, depOriginTableName);
                    jo.fieldNames.push(fieldName);
                    jo.type = 0;
                    qm.qO.type = 2;
                    qm.qO.tables.push(to1, to2);
                    qm.qO.where.and.push(cfo1, cfo2);
                    qm.qO.joins.push(jo);
                    var da = new DataAccess(qm.qO, CRDS, IDXB);
                    da.access(true, false).then(function (recs) {
                        fill(recs);
                    }).catch(function (err) {
                        console.log(err.stack);
                        Service.logError(err);
                    });
                }
                function getKeysToUse () {
                    return DefUtil.getDropDownKeys(depOriginTableName)
                        .concat([depOriginFieldName]);
                }
                function fill (recs) {
                    var usekeys = getKeysToUse(),
                        selId = HTMLUtil.getFieldId(depField.Id, pageId),
                        select = document.getElementById(selId);
                    //console.log("selection Id:" + selId);
                    // clear previous options first.
                    that.clearSelectOptions(select);
                    that.populate(select, recs, usekeys);
                    CtrlUtil.fieldChangeHandler({target: select});
                    //this.writeRecord(tableId, destManifest, null, null, true);
                }

                // get the origin of the base field.
                fieldId = (function () {
                    var fName = Def.ModelFields[fieldId].Name,
                        origin = (Def.ModelFields[fieldId].IsOrigin)? Def.ModelFields[fieldId]:
                            Def.ModelFields.Rows.first(function (f) {
                                return (f.Name === fName && f.IsOrigin);
                            });
                    return (origin)? origin.Id: null;
                })();
                if (!fieldId) return;
                var that = this,
                    pageId = Model.state.currPage.pageId,
                    depOrigin = (depField.IsOrigin)? depField: (function () {
                        // return fieldDef from the original table of that field name.
                        // e.g categoryid is an origin at stockcategories table.
                        var fieldName = depField.Name;
                        return Def.ModelFields.Rows.first(function (f) {                    
                            return (f.Name === fieldName && f.IsOrigin);
                        });
                    })(),
                    depOriginFieldId = depOrigin.Id,
                    depOriginFieldName = Def.ModelFields[depOriginFieldId].Name,
                    depOriginTableId = Def.ModelFields[depOriginFieldId].TableId,
                    depOriginTableName = Def.ModelTables[depOriginTableId].Name,
                    fieldName = Def.ModelFields[fieldId].Name,
                    tableId = Def.ModelFields[fieldId].TableId,
                    tableName = Def.ModelTables[tableId].Name;
                // tablename argument can be deduced by looking at field relationships
                // e.g, stock categories depends on business unit selected.
                // therefore the relationshop between their tables can be used
                // to fill the options for categories.
                // do this by using a generic select query on the tables
                // in which the fields originated from.
                // so, as category id originated from stockcategories, 
                // and bizid originated from bizgroups table, 
                // the query will select from the inner join of the two originating tables.
                query();
            }
        };
    return me;
})();