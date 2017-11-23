"use strict";
function PageMarkup (pageId) {
    var commonGroups = ModUtil.filterObject(Def.ModelMarkupGroup, {PageId: "M"},"Rank", true);
    this.pageId = pageId;
    this.tabo = {PageId: this.pageId};    
    this.tabs =  ModUtil.filterObject(Def.ModelMarkupContent, this.tabo, "Rank", true);
    this.groups = ModUtil.filterObject(Def.ModelMarkupGroup, this.tabo).concat(commonGroups);
    this.form = HTMLUtil.get({
        tag: "form",
        attr: {
            id: HTMLUtil.getFormId(this.pageId),
            "class": AI.htmlClass.submenuForm,
            "data-sm": pageId,
            method: "post",
            action: "",
            tabIndex: "-1"
        },
        style: {
            height: "100%",
            display: "none"
        }
    });
    this.tables = DefUtil.getDestTableIds(pageId);
    this.fragment = document.createDocumentFragment();
    //console.log(this.tabs);console.log(this.groups);
};
PageMarkup.prototype = {
    constructor: PageMarkup,
    append: function (arr, isContent) {
        var i, l = arr.length, pId, e;
        // sort by rank.
        //console.log("array to append: " + arr);
        if (isContent) {
            arr.sort(function (a, b) {
                return TypeUtil.sortObject(a, b, "rank", true);
            });
        }
        for (i = 0; i < l; i++) {
            pId = arr[i].parentId;
            e = arr[i].element;                
            if (e === null) {continue;}
            try {
                if (isContent) {
                    this.fragment.getElementById(this.form.id).appendChild(e);
                } else {
                    if (this.fragment.getElementById(pId)) {
                        this.fragment.getElementById(pId).appendChild(e);
                    } else {
                        document.getElementById(pId).appendChild(e);
                    }
                }
                //console.log("append " + e.id + " to " + pId);
            } catch (err) {
                Service.logError(err);
            }
        }            
    },
    /**
    * @returns {HTMLDocFragment}
    */
    markup: function () {
        // If fragment is cached, return it.
        //if (ViewUtil.cachedFragments[this.pageId]) {
            //appendFragment(ViewUtil.cachedFragments[this.pageId], AI.htmlId.modelContainer);
        //    return;
        //}
        var tabButtons = this.getTabLinks(this.pageId);
        this.form.appendChild(tabButtons);// tab buttons
        this.fragment.appendChild(this.form); // form
        this.getMarkup();
        // cache for next call
        //cacheFragment(this.pageId, this.fragment.cloneNode(true));            
        View.appendFragment(this.fragment, AI.htmlId.modelContainer);            
    },
    getMarkup: function () {
        /**
         * 
         * @param {String} groupName
         * @param {String} tabName
         * @returns {unresolved}
         */
        function getFieldsInGroup (groupName, tabName) {
            var commonTableId = Def.ModelTables.Model_CommonFields.Id,
                fields = Def.ModelFields.Rows.filter(function (field) {
                // filter for fields in tables listed as destination tables.
                var tableId = field.TableId;
                return(that.tables.indexOf(tableId) >= 0 || commonTableId === tableId);
            });
            // filter for fields to markup under field group
            return ModUtil.filterObject(fields, {
                // must belong to current tab content and group
                Content: tabName,
                Group: groupName
            }).filter(function (field) {
                // must not be shadow or must be salient
                return (!field.IsShadow || field.IsSalient);
            }).filter(function (field) {
                // must not be in destination remove list
                if (Def.ModelRemoveDestFields[field.Name]) {
                    if (!Def.ModelRemoveDestFields[that.pageId]) {                         
                        return field;
                    }
                } else {
                    return field;
                }
            }).sort(function (a, b) {
                return TypeUtil.sortObject(a, b, "Rank", true);
            });
        }
        function getGrouper (manifest, color) {
            //console.log(manifest.Name + " group manifest");console.dir(manifest);
            var hor = manifest.IsHorizontal,
                flex = (!hor)? AI.htmlClass.flexCol: "",
                o = HTMLUtil.get({
                    tag: "div",
                    attr: {
                        id: HTMLUtil.getGroupId(manifest.Name, manifest.ParentName, that.pageId),
                        "class": flex + " " + AI.htmlClass.contentGroup// + " " + color
                    },
                    style: {
                        height: (manifest.Height)? manifest.Height + "%": "auto",
                        width: (manifest.Width)? parseInt(manifest.Width, 10) + "%": "auto"
                    }
                });
                //if (manifest.Name === "Ingress") {alert("width ingress: " + manifest.Width);}
            return o;
        }
        /**
         * 
         * @param {type} manifest
         * @param {type} grouper
         * @param {type} color
         * @param {type} last
         * @param {type} hor
         * @returns {corra_view_L2.Page.prototype.markup.getField.corra_viewAnonym$19}
         */
        function getField (manifest, grouper, color, last, hor) {            
            var args = {
                    label: true,
                    container: {
                        type: "field",
                        wrap: true
                    },
                    color: color,
                    last: last,
                    hor: hor
                },
                input = MarkupUtil.input.get(manifest, that.pageId, args);              
            return {
                // if group is horizontally layout, append directly to content tab,
                // otherwise append to group container.
                parentId: (hor)? HTMLUtil.getContentId(tabName, that.pageId): grouper.id,
                rank: manifest.Rank,
                element: input
            };
        }
        /**
         * 
         * @param {type} fields
         * @param {type} gManifest
         * @param {type} grouper
         * @param {type} color
         * @returns {corra_view_L2.Page.prototype.markup.getTable.corra_viewAnonym$26}
         */
        function getTable (fields, gManifest, grouper, color) {
            function myTableWrapper () {
                return HTMLUtil.get({
                    tag: "div",
                    attr: {
                        "class": "corra-flex-item corra-container w3-padding-large w3-card-4 " + AI.htmlClass.tableWrapper + " w3-center"
                    },
                    style: {
                        // standard height of 80%, this makes room for action links.
                        height: "80%",
                        width: "100%",
                        overflow: "hidden"
                    },
                    innerHTML: gManifest.Alias
                });
            } 
            function myTableActions () {
                var acts = [{
                        "class": AI.htmlClass.focusIngress,
                        title: "Add new item",
                        "data-tableid": tableId,
                        usePrompt: usePrompt,
                        icon: "plus"
                    }, {
                        "class": AI.htmlClass.editRow,
                        title: "Edit selected item",
                        "data-tableid": tableId,
                        icon: "edit"
                    }, {
                        "class": AI.htmlClass.delRow,
                        title: "Delete selected item",
                        "data-tableid": tableId,
                        icon: "trash"
                    }, {
                        "class": AI.htmlClass.focusRow,
                        title: "Focus on table",
                        "data-tableid": tableId,
                        icon: "list"
                    }, {
                        "class": AI.htmlClass.undoRow,
                        title: "Undo delete",
                        "data-tableid": tableId,
                        icon: "undo"
                    }],
                    div = HTMLUtil.get({
                        tag: "div",
                         attr: {"class": "w3-large w3-card-2 " + AI.htmlClass.flexItem},
                         style: {height: "20%"}
                     });
                // markup icons
                acts.forEach(function (act) {
                    var a = HTMLUtil.get({
                            tag: "a",
                            attr: {
                                title: act.title,
                                "class": act.class + " " + AI.htmlClass.tableControl +
                                    " w3-btn-floating-large w3-xlarge w3-hover-white w3-light-grey",
                                href: "javascript:void(0)",
                                "data-tableid": tableId,
                                "data-useprompt": (act.usePrompt)? act.usePrompt: ""
                            }
                        }), icon,
                        wrap = that.anchoredIconsWrap();
                    icon = MarkupUtil.icon.get(act.icon);
                    a.appendChild(icon);
                    //a = myAnchorWrap(a);
                    wrap.appendChild(a);
                    div.appendChild(wrap);
                });
                return div;
            }
            function myAnchorWrap (e) {
                var wrap = HTMLUtil.get({
                        tag: "div",
                        attr: {
                            "class": "w3-padding-tiny w3-show-inline-block"
                        }
                    });
                wrap.appendChild(e);
                return wrap;
            }
            function myTable () {
                var table = HTMLUtil.get({
                        tag: "table",
                        attr: {
                            id: HTMLUtil.getTableId(tableId, that.pageId),
                            "class": "w3-table-all w3-hoverable w3-medium corra-flex-table "                                        + AI.htmlClass.table,
                            "data-tableid": tableId,
                            "data-groupname": gManifest.Name
                        }
                    }),
                    tbody = document.createElement("TBODY"),
                    head = table.createTHead(),
                    hrow, hcell, icon,
                    sumSpan = HTMLUtil.get({
                        tag: "span",
                        attr: {
                            "class": "w3-show-block w3-white w3-padding-tiny w3-right-align"
                        }
                    });
                // caption.
                // caption has been commented out because a table with caption will not
                // scroll well with header row in view.
                //caption = table.createCaption();
                //caption.innerHTML = gManifest.Alias;
                //caption.className = "w3-bold w3-padding-tiny w3-large";

                // header row.
                head.className = "w3-bold w3-text-black";
                hrow = head.insertRow(0);
                hrow.className = "w3-dark-grey";
                
                fields.forEach(function (field, index) {
                    var oIcon = {
                            suppClasses: [AI.htmlClass.sortRow],
                            innerHTML: ""
                        },
                        sortable = (field.IsSortable)?
                            AI.htmlClass.tableControl + " " + AI.htmlClass.sortRow: "",
                        span = sumSpan.cloneNode(true);
                    hcell = hrow.insertCell(index);                        
                    hcell.title = field.Alias || field.Name;
                    // this makes it a sortable column.
                    hcell.className = sortable;
                    hcell.setAttribute("data-fieldid", field.Id);
                    hcell.innerHTML = field.Alias || field.Name;
                    // markup a sort icon beside each heading that is sortable.
                    if (field.IsSortable) {
                        hcell.innerHTML += " ";                            
                        icon = MarkupUtil.icon.get("sort", oIcon);
                        hcell.appendChild(icon);
                    }
                    // initialize footer summaries for summarizable fields
                    if (field.IsSummable) {
                        hcell.appendChild(span);
                    }
                });
                // table body
                tbody.className = "w3-text-black w3-small";
                table.appendChild(tbody);
                return table;
            }
            function ingressField (field) {
                var args = {
                        container: {
                            type: "search"
                        },
                        padding: "large",
                        fontsize: "large",
                        alignment: "center",
                        hor: true
                    }, e;
                try {
                    e = MarkupUtil.input.get(field, that.pageId, args);
                    // add extra flags on this element,
                    // so it can be focused on when adding a new record to table
                    e.querySelectorAll("input")[0].setAttribute("data-ingress", tableId);
                } catch (err) {
                    Service.logError(err);
                }
                return e;  
            }            

            var tableId = (fields.length > 0)? fields[0].TableId: "",
                table = myTable(),
                container = MarkupUtil.container.get({
                    container: {
                        type: "table"
                    }
                    //caption: gManifest.Alias
                }),
                wrap = MarkupUtil.container.get({
                    container: {
                        type: "tableContainer"
                    }
                }),
                usePrompt = gManifest.UseInputPrompt,
                actions = myTableActions(),
                inputFrag = document.createDocumentFragment();

            // empty row
            MarkupUtil.table.emptyRow(table);

            // fields that receive input for adding record to table.                
            if (!usePrompt) {             
                // every table to be populated is sourced from another table
                // markup fields that are related to the source table.
                fields = fields.filter(function (field) {
                    if (field.RelatedTableId === gManifest.RelatedTableId && field.IsIngress) {
                        return field;
                    }
                });
                // limit table ingress field to 1.
                if (fields.length > 0) {
                    inputFrag.appendChild(ingressField(fields[0]));
                }
            }
            // wrap table
            container.appendChild(table);
            // wrap again and add flex
            wrap.appendChild(container);

            // append table actions
            wrap.appendChild(actions);
             // append table ingress field
            wrap.appendChild(inputFrag);
            return {
                parentId: grouper.id,
                rank: gManifest.Rank,
                element: wrap
            };
        }        

        var that = this, i, l = this.tabs.length, tabName,
            arrTabs = [],
            arrGroups = [],
            arrFields = [],
            arrGroupsInTab = [],
            arrFieldsInGroup = [],
            panes = [],
            getGroups = function (tabName) {
                return ModUtil.filterObject(that.groups, {
                    ParentName: tabName
                }).sort(function (a, b) {
                    return TypeUtil.sortObject(a, b, "Rank", true); 
                });
            },
            theme, themeClass;
        // iterate tabs
        for (i = (l - 1); i > -1; i--) {
            // start from highest ranked tab.
            arrTabs.push(this.getSMTab(this.tabs[i])); 
            tabName = this.tabs[i].Name;       
            theme = this.getMarkupTheme(i);                
            themeClass = Def.ModelThemes[theme].ThemeClass;
            //arrGroupsInTab = getGroups(tabName);                                   
            getGroups(tabName).forEach(function (group, iGroup,a) {
                var i = Misc.normalizeIndex(iGroup, 
                        Def.ModelThemeGradients.Rows.length - 1
                    ),
                    gradient = that.getMarkupThemeGradient(i),
                    color = that.getThemeGradientClass(themeClass, gradient),
                    grouper = getGrouper(group, color),
                    f;
                // get fields in the group.
                // markup as table (if applicable).
                // there should be 1 table per content tab.
                arrFieldsInGroup = getFieldsInGroup(group.Name, tabName);                
                if (group.IsTable) {            
                    f = getTable(arrFieldsInGroup, group, grouper, color);
                    arrFields.push(f);                        
                } else {
                    arrFieldsInGroup.forEach(function (field, index) {
                        var last = ((index + 1) === arrFieldsInGroup.length)? true: false,
                            hor = group.IsHorizontal;
                        f = getField(field, grouper, color, last, hor);
                        arrFields.push(f);
                    });
                }
                // append group only if it is vertical
                if (!group.IsHorizontal || group.IsTable) {
                    arrGroups.push({
                        parentId: HTMLUtil.getContentId(group.ParentName, that.pageId),
                        rank: group.Rank,
                        element: grouper
                    });
                }
            });
        }
        // right pane lists
        panes.push(this.rightPane());
        //panes.push(this.bottomPane());        
        panes.push(this.commands());// commands list
        //panes.push(shadows());// shadow list
        //panes.push(help());// help list
        panes.push(this.settings());// settings list
        //panes.push(summary());// summary list
        this.append(arrTabs, true);
        this.append(arrGroups);
        this.append(arrFields);
        this.append(panes);
        // markup and append actions bar to header container
        document.getElementById(AI.htmlId.actionBarContainer).appendChild(this.pageActions());
    },
    getSMTab: function (manifest) {
        function getSubtabs () {
            var subtabs = [],
                groups = that.groups.filter(function (group) {
                    return (group.ParentName === manifest.Name &&
                        TypeUtil.toBln(group.IsTable));
                }).sort(function (a, b) {
                    return TypeUtil.sortObject(a, b, "Rank", true); 
                });
            // subtabs will be appended only if there are more than 1 table.
            if (groups.length > 1) {
                groups.forEach(function (group) {
                    subtabs.push(group);                        
                });
            }
            return subtabs;                
        }
        function appendSubtabs () {
            // use navbar list for tabs that point to different tables in a content tab.
            var div = HTMLUtil.get({
                    tag: "div",
                    attr: {
                        "class": "w3-navbar w3-card-16"
                    }
                }),
                ul = HTMLUtil.get({
                    tag: "ul",
                    attr: {
                        "class": "w3-navbar corra-tab-container"
                    }
                }),
                li = HTMLUtil.get({
                    tag: "li",
                    attr: {                            
                        "class": "w3-navbar "                            
                    }
                }),
                a = HTMLUtil.get({
                    tag: "a",
                    attr: {
                        id: HTMLUtil.getSubTabListId(manifest.Name, groupId),
                        "class": AI.htmlClass.subTab,
                        href: "javascript:void(0)"
                    }
                }),
                subtabLi, subtabA, groupId, i;
            subtabs.forEach(function (group, index) {
                groupId = HTMLUtil.getGroupId(group.Name, group.ParentName, 
                    group.PageId);
                i = MarkupUtil.icon.get(group.IconClass);
                subtabA = a.cloneNode(true);                                        
                subtabA.innerHTML = group.Alias + " ";// always add space at end 'cos of icon.
                subtabA.title = group.Alias + " ";// always add space at end 'cos of icon.
                subtabA.setAttribute("data-group", groupId);
                subtabA.appendChild(i);
                subtabLi = li.cloneNode(true); 
                if (index === 0) {
                    subtabLi.className += " w3-bottombar w3-border-purple " +
                        AI.htmlClass.firstSubTab;
                }
                subtabLi.appendChild(subtabA);
                ul.appendChild(subtabLi);
            });
            if (ul.children.length > 0) {
                //div.appendChild(ul);
                container.appendChild(ul);
            }
        }

        var that = this,                
            container = MarkupUtil.container.get({
                container: {
                    type: "content"
                },
                manifest: manifest,
                dir: "row"
            }),
            subtabs = getSubtabs();
        appendSubtabs();
        container.style.display = "none";
        return {
            parentId: this.form.id,
            rank: manifest.Rank,
            element: container
        };
    },
    shadow: function (manifest, dfManifest) {
        var list = list(),
            /*w = new wrap(),
            c = new container(),*/
            l = new label(),
            f = new field();
        append();

        function list () {
            var o = HTMLUtil.get("li");
            o.attr.class = "w3-bottom-border w3-padding-small";
            o.attr.class += " " + AI.htmlClass.shadowList;
            o.attr["data-sm"] = manifest.PageId;
            return HTMLUtil.get(o);
        }

        function wrap () {
            var o = HTMLUtil.get("span");
            o.attr.class = "w3-padding-small";
            o.attr.title = manifest.FieldDescription;
            return HTMLUtil.get(o);
        }

        function container () {
            var o = HTMLUtil.get("span");
            o.attr.class = "w3-padding-small";
            return HTMLUtil.get(o);
        }

        function label () {
            var o = HTMLUtil.get("span");
            o.attr.class = "w3-padding-tisny corra-label"; 
            o.innerHTML = dfManifest.Alias;
            return HTMLUtil.get(o);
        }

        function field () {
            var tag = dfManifest.HTMLTag,
                type = dfManifest.DataType,
                format = dfManifest.DataFormat,
                inputType,
                o = HTMLUtil.get(tag);
            // attributes            
            o.attr.class = "w3-input " + AI.htmlClass.settingList;
            o.attr.data_table = manifest.TableId;
            o.attr.disabled = true;
            o.attr.id = HTMLUtil.getTag(tag) + manifest.Name + "Field";            
            o.attr.name = manifest.TableId + "." + manifest.Name;
            o.attr.required = TypeUtil.toBln(dfManifest.IsRequired);
            if (tag === "input") {
                 inputType = getInputType(type, format);
                if (inputType !== "") {
                    o.attr.type = inputType;
                }
            }
            return HTMLUtil.get(o);
        }

        function append () {
            list.appendChild(l);
            list.appendChild(f);
        }

        return {
            parentId: AI.htmlId.shadowContainer,
            rank: manifest.Rank,
            element: list
        };
    },
    tabContainer: function () {
        return HTMLUtil.get({
            tag: "ul",
            attr: {
                "class": "w3-navbar w3-white " + AI.htmlClass.maintabContainer
            },
            style: {
                width: "100%",
                height: "10%",
                top: "0%"
            }            
        });
    },
    tabAnchor: function (name, index, pageId) {
        var theme = Def.ModelThemes.Rows[index].ThemeClass;
        return HTMLUtil.get({
            tag: "a",
            attr: {
                id: HTMLUtil.getTabAnchorId(name, pageId),
                "class": "w3-btn w3-padding-large w3-card-16 w3-large " +
                    AI.htmlClass.tabAnchor,//+ " " + theme;
                "data-content": name,
                "data-sm": pageId,
                tabIndex: "-1",
                href: "javascript:void(0)"
            },
            style: {
                height: "100%",
                fontFamily: "Raleway, sans-serif"
            },
            innerHTML: name
        });
    },
    mainTab: function (name, width, pageId) {
        return HTMLUtil.get({
            tag: "li",
            attr: {
                id: HTMLUtil.getTabListId(name, pageId),
                "class": "w3-navbar " + AI.htmlClass.mainTab +
                    ((name === "Main")? " " + AI.htmlClass.firstMainTab: ""),
                "data-contentid": HTMLUtil.getContentId(name, pageId),
                "data-contentclass": AI.htmlClass.formContent
            },
            style: {
                width: width
            }
        });
    },
    tabIcon: function (cls) {
        return HTMLUtil.get({tag: "i", attr: {"class": "fa fa-" + cls}});
    },
    /**
    * @param {type} pageId
    * @returns {undefined}
    */
    getTabLinks: function (pageId) {
        var i,
            container = this.tabContainer(), 
            list, anchor, icon,
            arr = ModUtil.filterObject(Def.ModelMarkupContent, {
               PageId: pageId
            }).sort(function (a, b) {
               return TypeUtil.sortObject(a, b, "Rank", true);
            }),
            contentLen = arr.length,
            name,
            parentWidth = container.style.width.match(/^\d+/)[0],
            width = (parentWidth / contentLen).toFixed(2),
            widthVariance = (width * contentLen) - parentWidth,
            lastWidth = (widthVariance > 0)? width - widthVariance: width,
            fragment = document.createDocumentFragment();            
            width += "%";
            lastWidth += "%";
            //console.log("container width: " + parentWidth + " width: " + width + " and lastWidth: " + lastWidth);
        for (i = 0; i < contentLen; i++) {
            name = arr[i].Name;
            icon = this.tabIcon(arr[i].IconClass);            
            anchor = this.tabAnchor(name, i, pageId);
            anchor.innerHTML += " ";// this creates a space between anchor text & icon.
            anchor.appendChild(icon);
            list = this.mainTab(name, ((i + 1 === contentLen)? lastWidth: width), pageId);
            list.appendChild(anchor);
            fragment.appendChild(list);
        }
        container.appendChild(fragment);
        return container;
   },
    /**
     * @param {Number} index
     * @returns {String}
     */
    getMarkupTheme: function (index) {
        index = Misc.normalizeIndex(index, Def.ModelThemes.Rows.length - 1);
        return Def.ModelThemes.Rows[index].Theme;
    },
    /**
     * @param {Number} index
     * @returns {String}
     */
    getMarkupThemeGradient: function (index) {
        return Def.ModelThemeGradients.Rows[index].Gradient;
    },
    /**
     * @param {String} themeClass
     * @param {String} gradient
     * @returns {String}
     */
    getThemeGradientClass: function (themeClass, gradient) {
        return themeClass + "-" + gradient;
    },
    rightPane: function () {
        var pane = HTMLUtil.get({
                tag: "nav",
                attr: {
                    id: HTMLUtil.getPaneId("Right", this.pageId),
                    "class": "w3-sidenav w3-theme-deep-purple-dark w3-card-16 w3-animate-right w3-padding-large w3-medium w3-right " + AI.htmlClass.rightPane
                },
                style: {
                    position: "absolute",
                    height: "70%",
                    top: "16%",
                    width: "25%",
                    right: "0%",
                    "z-index": "10",
                    display: "none"
                }
            }),
            closeBtn = this.paneCloseButton(),
            container = MarkupUtil.container.get({
                container: {
                    type: "custom",
                    padding: "small",
                    align: "center"
                }
            }),
            icon = MarkupUtil.icon.get("close"); 
        closeBtn.appendChild(icon);
        container.appendChild(closeBtn);
        pane.appendChild(closeBtn);
        return {
            parentId: this.form.id,
            rank: 0,
            element: pane
        };
    },
    getRightPaneUl: function (name, title) {
        var ul = HTMLUtil.get({
                tag:"ul",
                attr: {
                    id: HTMLUtil.getPaneUlId(name, this.pageId),
                    class: "w3-padding-all-16 w3-large w3-left " +
                        AI.htmlClass.rightPaneUl
                },
                style: {                    
                    width: "100%",
                    overflow: "auto",                    
                    "list-style-type": "none",
                    display: "none"
                },
                innerHTML: title
            });
        ul.appendChild(document.createElement("hr"));
        return ul;
    },
    getRightPaneSubList: function (manifest) {
        var id = HTMLUtil.getListId(manifest.Name, this.pageId);
        return HTMLUtil.get({
            tag: "li",
            attr: {
                id: id,
                name: id,
                class: "w3-bottom-border w3-padding-small w3-margin-bottom w3-hover-yellow " + AI.htmlClass.rightPaneList,
                title: manifest.Description,
                "data-action": manifest.Action || "command"
            },
            style: {
                cursor: "pointer"
            },
            innerHTML: (manifest.Alias || manifest.Name) + " "
            // trailing space separates innerHTML from icon.
        });
    },
    bottomPane: function () {
        var pane = HTMLUtil.get({
                tag: "nav",
                attr: {
                    id: HTMLUtil.getPaneId("Bottom", this.pageId),
                    "class": "w3-theme-deep-purple-action w3-card-16 w3-animate-bottom w3-padding-large w3-medium " + AI.htmlClass.bottomPane
                },
                style: {
                    position: "fixed",
                    height: "15%",
                    bottom: "0%",
                    width: "100%",
                    "z-index": "10",
                    display: "none"
                }
            }),
            closeBtn = this.paneCloseButton("w3-xxlarge", {float:"left"}),
            container = MarkupUtil.container.get({
                container: {
                    type: "custom",
                    padding: "small",
                    align: "center"
                }
            }),
            icon = MarkupUtil.icon.get("close"); 
        closeBtn.appendChild(icon);
        container.appendChild(closeBtn);
        pane.appendChild(closeBtn);
        pane.appendChild(this.pageActions());
        return {
            parentId: this.form.id,
            rank: 0,
            element: pane
        };
    },
    anchoredIconsWrap: function (padding) {
        return HTMLUtil.get({
            tag: "div",
            attr: {
                "class": padding + " w3-show-inline-block"
            }
        });
    },
    paneCloseButton: function (c, s, h) {
        var mainc = " w3-closenav " + AI.htmlClass.paneCloser;
        c = (c)? c + mainc: mainc;
        s = s || {};
        h = h || "";
        return HTMLUtil.get({
            tag: "a",
            attr: {
                "class": c,
                href: "javascript:void(0)" 
            },
            style: s,
            innerHTML: h
        });        
    },
    pageActions_hiddenBottomPane: function () {
        var that = this,
            div = HTMLUtil.get({
                tag: "div",
                 attr: {
                     "class": "w3-large w3-card-2 " + AI.htmlClass.flexItem
                 },
                 style: {
                     height: "100%",
                     width: "90%",
                     "margin-left":"10%"
                 }
             }),
            acts = [];
        Def.ModelMarkupCommand.Rows.filter(function (cmd) {
            return(cmd.PageId === that.pageId);
        }).sort(function (a, b) {
            return TypeUtil.sortObject(a, b, "Alias", false);
        }).forEach(function (cmd) {           
            acts.push({
                name: cmd.Name,
                "class": AI.htmlClass.pageCommand + " w3-xxlarge w3-hover-white w3-theme-deep-purple-action",
                title: cmd.Description,
                icon: cmd.IconClass,
                iconInnerHTML: cmd.Name
            });
        });
        // markup icons
        acts.forEach(function (act) {
            var a = HTMLUtil.get({
                    tag: "a",
                    attr: {
                        id: HTMLUtil.getCommandId(act.name, that.pageId),
                        title: act.title,
                        "class": act.class
                        //href: "javascript:void(0)"
                    }
                }),
                icon,
                wrap = that.anchoredIconsWrap("w3-padding-large");
            icon = MarkupUtil.icon.get(act.icon, {innerHTML: act.iconInnerHTML});
            a.appendChild(icon);
            wrap.appendChild(a);
            div.appendChild(wrap);
        });
        return div;
    },
    pageActions: function () {
        var that = this,
            fragment = document.createDocumentFragment(),
            actions = [];
        Def.ModelMarkupCommand.Rows.filter(function (cmd) {
            return(cmd.PageId === that.pageId);
        }).sort(function (a, b) {
            return TypeUtil.sortObject(a, b, "Rank", false);
        }).forEach(function (cmd) {           
            actions.push({
                id: HTMLUtil.getCommandId(cmd.Name, that.pageId),
                name: cmd.Name,
                "class": "w3-btn w3-round w3-sixth w3-large w3-bold w3-theme-deep-purple w3-text-white w3-hover-white w3-float-right w3-animate-right " +
                that.pageId + " " + AI.htmlClass.pageCommand,
                title: cmd.Description,
                icon: cmd.IconClass
            });
        });
        // markup icons
        actions.forEach(function (action) {
            var span = HTMLUtil.get({
                    tag: "span",
                    attr: {
                        id: action.id,
                        title: action.title,
                        "class": action.class
                    },
                    style: {
                        height: "100%",
                        display: "none"
                    }//,
                    //innerHTML: action.name
                }),
                innerSpan =  HTMLUtil.get({
                    tag: "span",
                    attr: {
                        "class": "w3-show-block"
                    },
                    innerHTML: action.name
                }),
                icon = MarkupUtil.icon.get(action.icon,{},true);
            span.appendChild(innerSpan);
            span.appendChild(icon);
            fragment.appendChild(span);
        });
        return fragment;
    },
    commands: function () {
        var that = this,
            ul = this.getRightPaneUl("Command", "Commands"),
            fragment = document.createDocumentFragment();
        Def.ModelMarkupCommand.Rows.filter(function (cmd) {
            return(cmd.PageId === that.pageId);
        }).sort(function (a, b) {
            return TypeUtil.sortObject(a, b, "Alias", false);
        }).forEach(function (cmd, index) {
            var li = that.getRightPaneSubList(cmd),
                icon = MarkupUtil.icon.get(cmd.IconClass, {suppClasses: ["w3-right"]});
            li.setAttribute("tabindex", index + 1);
            li.appendChild(icon);
            li.classList.add(AI.htmlClass.pageCommand);
            fragment.appendChild(li);
        });
        ul.appendChild(fragment);
        return {
            parentId: HTMLUtil.getPaneId("Right", this.pageId),
            rank: 0,
            element: ul
        };
    },
    settings: function () {
        function wrap (manifest) {
            return HTMLUtil.get({
                tag: "div",
                attr: {
                    "class": "w3-padding-tiny",
                    title: manifest.Description
                }
            });
        }
        function container () {
            return HTMLUtil.get({tag: "div", attr: {"class": "w3-container"}});
        }
        function label () {
            return HTMLUtil.get({
                tag:"label",
                attr: {"class": "w3-padding-tiny corra-label"}
            });
        }
        function checkbox () {
            var o = HTMLUtil.get({
                    tag: "input",          
                    attr: {type: "checkbox"}
                });
            o = StyleUtil.makeCheckboxSwitch(o);
            return o;
        }

        var that = this,
            ul = this.getRightPaneUl("Setting", "Settings"),
            fragment = document.createDocumentFragment();
        Def.ModelMarkupSetting.Rows.filter(function (set) {
            if (set.PageId === Def.ModelConstants.PageId.Value ||
            set.PageId === that.pageId) {
                return set;
            }
        }).sort(function (a, b) {
            return TypeUtil.sortObject(a, b, "Alias", false);
        }).forEach(function (setting, index) {
            var li = that.getRightPaneSubList(setting),
                icon = MarkupUtil.icon.get(setting.IconClass),
                w = wrap(setting),
                c = container(),
                l = label(setting),
                check = checkbox();
            li.setAttribute("tabindex", index + 1);
            li.classList.add(AI.htmlClass.settingList);
            c.appendChild(l);
            c.appendChild(check);
            w.appendChild(c);
            li.appendChild(w);
            li.appendChild(icon);                        
            fragment.appendChild(li);
        });
        ul.appendChild(fragment);
        return {
            parentId: HTMLUtil.getPaneId("Right", this.pageId),
            rank: 0,
            element: ul
        };
    }
};