var CtrlUtil = (function () {
        var me = {
                tables: {
                    /**
                     * @description Scroll rows in a table while keeping header row in view always.
                     * To this by hiding any row past row 
                     * @param {type} e
                     * @returns {undefined}
                     */
                    scroll: function (e) {            
                        var el = e.get(0),
                            table = el.querySelector("table"),
                            tbody = table.querySelector("tbody"),
                            hideRow,
                            focusIndex = tbody.querySelector("tr:focus"),
                            noviewIndex = this.check(el);            
                        if (noviewIndex < focusIndex) {
                            hideRow = tbody.querySelector("[tabindex='" + noviewIndex + "']");
                            $(hideRow).hide("slow");
                        }
                    },
                    stripPx: function (str) {
                        return Number(Misc.strip(str, "px"));
                    },
                    /**
                     * 
                     * @param {HTMLTableObject} tbl
                     * @returns {getView.me.tables.getScroller.o}
                     */
                    getScroller: function (tbl) {
                        tbl = (tbl instanceof $)? tbl: $(tbl);
                        var o = {},
                            stripPx = this.stripPx,
                            row = tbl.find("tbody tr:last-child");
                        try {
                            o.contH = stripPx(tbl.parent().css("height")),
                            //o.captionH = stripPx(tbl.find("caption").css("height")),
                            o.headH = stripPx(tbl.find("thead").css("height")),
                            o.rowH = stripPx(row.css("height")),
                            o.rowLen = row.siblings().length + 1,
                            o.room = (o.contH - o.headH);// - o.captionH);
                        } catch (err) {
                            console.log(err.stack);
                            Service.logError(err.stack);
                        }
                        return o;
                    },            
                    arrowScroll: function (e, down) {
                        // Determine if an element is in the visible viewport
                        function isInViewport(element) {
                          var rect = element.getBoundingClientRect();
                          var html = document.documentElement;
                          return (
                            rect.top >= 0 &&
                            rect.left >= 0 &&
                            rect.bottom <= (window.innerHeight || html.clientHeight) &&
                            rect.right <= (window.innerWidth || html.clientWidth)
                          );
                        }
                        // Above function could be used by adding a “scroll” listener to window.
                        /**
                         * 
                         * @returns {undefined}
                         */
                        function scrollWithHeaderInView () {
                            /**
                             * @description Show or hide rows during arrow scroll of table.
                             * @param {type} increment
                             * @returns {undefined}
                             */
                            function showRows (increment)   {
                                var rows = tbody.children.length,
                                    condition = function (i) {
                                        return (increment)? i <= rows: i >= 0;
                                    };
                                while (room >= height && condition(i)) {
                                    tbody.children(":nth-child(" + i + ")").show("fast");
                                    //tbody.children(":nth-child(" + i + ")").css("height", height + "px");
                                    tbody.children(":nth-child(" + i + ")").animate({height: height + "px"});
                                    i = (increment)? ++i: --i;
                                    room -= height;
                                }
                            }
                            // all heights in pixels (px)
                            // strip the 'px' suffix before calculating. 
                            // check index of current row
                            // determine how many more rows can fit into the rowRoom,
                            // the minimum room is 1
                            // if scrolling down, hide previous rows until
                            // the last that cannot fit in, 
                            // which is then shrunk vertically to take up any remaining height.
                            // if no height remains, or is negative, then it is hidden. 
                            var tbl = $(e).parents("table"),
                                o = that.getScroller(tbl),
                                tbody = $(e).parent(),
                                i = $(e).index(),
                                height = o.rowH,
                                room = o.room - height,
                                thead = tbl.find("thead").get(0); 
                            if (ppty === "prev") {
                                // scrolling up
                                $(e)[ppty]().show(0, function () {                            
                                    scrollNormal();  
                                    thead.scrollIntoView(false);
                                });
                                showRows(true);
                            } else {
                                // scrolling down.
                                $(e)[ppty]().show(50, function () {                            
                                    $(e)[ppty]().css("height", height + "px");
                                });
                                showRows(false);
                                // hide remaining rows above the target row, counting from the 1st.
                                tbody.find("tr").slice(0, i + 1).hide(0);
                                scrollNormal();
                            }
                        }
                        function scrollNormal () {
                            $(e)[ppty]().focus();// current row will be flagged by onfocus event.
                            e.get(0).scrollIntoView(false); 
                        }

                        var that = this,
                            ppty = (down)? "next": "prev";
                        // scroll into view
                        if (ppty && $(e)[ppty]().length > 0) {
                            if ($(e).prop("nodeName") === "TR") {
                                scrollWithHeaderInView();                            
                            } else {
                                scrollNormal();                        
                            }
                        }
                        // indicate begin/end of items.
                        if (ppty && $(e)[ppty]().length === 0) {                        
                            StyleUtil.toggleBackground(e, {
                                c: "white",
                                bg: "red"
                            });
                        }
                    },                
                    action: function (e) {                
                        function focusIngress () {
                            function cb (data) {
                                // data signature = o.tableId.records = [{key: value}];
                                data[tableId].records.forEach(function (destManifest) {
                                    Object.keys(destManifest).forEach(function (key) {
                                        console.log("Prompt: " + key + " = " + destManifest[key]);
                                    });
                                    console.log("write from prompt callback");
                                    Model.state.currPage.writeRecord(tableId, destManifest); 
                                    Model.state.currPage.runCalculations(); 
                                });             
                            }

                            var eIngress = $("[data-ingress='" + tableId + "']"),
                                eAdd = $("a[data-tableid='" + tableId + "']");
                            if (e.attr("data-useprompt")) {
                                // popup modal prompt to collect input.
                                // set the field to return focus to after modal is dismissed.
                                ViewUtil.state.focusId = eAdd;
                                ModalUtil.prompt(Def.ModelFields.Rows.filter(function (f) {
                                    return (f.TableId === tableId && !f.IsShadow &&
                                        f.Group === groupName);
                                }), cb);
                            } else {
                                // focus on ingress field
                                eIngress.selectRange(0, 100);                        
                                eIngress.text();
                            }
                            ViewUtil.feedback.give({
                                msg: eIngress.attr("placeholder")
                            });
                        }
                        function editRow () {
                            // use prompts to collect editable fields.
                            // editable fields will be:
                            // IsShadow = false
                            // IsIndexed = false
                            // IsPK = false.
                            var arr = Def.ModelFields.Rows.filter(function (f) {
                                    return (f.TableId === tableId && !toBln(f.IsShadow) &&
                                        !toBln(f.IsIndexed) && !toBln(f.IsPK));
                                });
                            page.editTableRow(tableId, arr, rownum);
                        }
                        function focusRow () {
                            var row1 = $("#" + tblId + " tbody tr:first"),
                                table = $("#" + tblId);
                            // todo: 12 oct 2017.
                            // if at bottom of long table, row1 is hidden.
                            // unhide it.
                            //me.tables.arrowScroll(row1, false);
                            row1.get(0).scrollIntoView(false);
                            row1.focus();
                            table.attr("data-rownum", "0");
                        }

                        var page = Model.state.currPage,
                            pageId = page.pageId,
                            tableId = e.attr("data-tableid") ||
                                e.parents("table").attr("data-tableid"),
                            tblId = HTMLUtil.getTableId(tableId, pageId),
                            groupName = $("#" + tblId).attr("data-groupname"),
                            rownum = $("#" + tblId).attr("data-rownum"),
                            toBln = TypeUtil.toBln;
                        if (e.hasClass(AI.htmlClass.focusIngress)) {
                            focusIngress();
                        } else if (e.hasClass(AI.htmlClass.editRow)) {                    
                            editRow();
                        } else if (e.hasClass(AI.htmlClass.delRow)) {
                            page.deleteTableRow(tableId, rownum);
                        } else if (e.hasClass(AI.htmlClass.focusRow)) {
                            focusRow();
                        } else if (e.hasClass(AI.htmlClass.sortRow)) {
                            // sort table rows on the field clicked.
                            page.sortTableRow(tableId, e);                        
                        }
                    }                
                },
                tabs: {
                    open: function (e) {
                        var groupId = e.attr("data-group"),
                            pageId = HTMLUtil.getPageIdFrom(groupId),
                            contentName = HTMLUtil.getContentNameFromGroupId(groupId),
                            contentId = HTMLUtil.getContentId(contentName, pageId);
                        this.show(contentId, groupId);                    
                        this.showCue(e);
                        // flag on page Model view
                        ViewUtil.flag.pageTabView(Model.state.currPage);
                    },
                    show: function (contentId, groupId) {
                        var selector = "." + AI.htmlClass.contentGroup + ":not(#" + groupId + ")";
                        $("#" + contentId).find("#" + groupId).show("fast", function () {
                            // hide all groups in the content, show the target group only.
                            $("#" + contentId).find(selector).hide("slow");
                        });                        
                    },
                    showCue: function (e) {
                        e.parent().addClass("w3-bottombar w3-border-purple");
                        e.parent().siblings().removeClass("w3-bottombar w3-border-purple");
                    }
                },
                /* UI that can receive focus */
                focus: {
                    /**
                     * 
                     * @param {type} id
                     * @param {type} useEffects
                     * @returns {undefined}
                     */
                    any: function (id, useEffects) {
                        if (typeof id === "string") {
                            this.input(id, useEffects);
                        } else {
                            id.focus();
                        }
                    },
                    /**
                     * @description this is only used for group fields,
                     * because they are contained within a group under a content.
                     * @param {String} id
                     * @param {Boolean} useEffects
                     * @returns {undefined}
                     */
                    input: function (id, useEffects) {                    
                        function f () {
                            // show the element
                            function a () {
                                if (ViewUtil.state.modalView) {
                                    var index = $(el).parent("div").index();
                                    //console.log("force focus index: " + index);
                                    //console.log("i.e " + $(el).attr("id"));
                                    ShowUtil.wizardField(null, index);
                                }
                                if (Model.state.currPage) {
                                    ShowUtil.tab({id: tabId});
                                }
                            }
                            // focus on the element.
                            function b () {
                                if (el.type !== "text") {                                    
                                    el.focus();                            
                                } else {
                                    //el.setSelectionRange(0, 100);
                                    $(el).selectRange(0, 100);         
                                }
                            }                            
                            var pageId = Model.state.currPage.pageId,
                                fieldId = HTMLUtil.getFieldIdFrom(id),
                                field = Def.ModelFields[fieldId],
                                content = field.Content,
                                tabId = HTMLUtil.getTabListId(content, pageId),
                                snackbar = $("#" + AI.htmlId.snackbar);
                            a();
                            if (useEffects) {
                                StyleUtil.transfer(snackbar, el, b);
                            } else {
                                b();
                            }
                        }
                        var el = document.getElementById(id);
                        if (!id || !el) {return;}                
                        f();                        
                    },
                    tab: function (tableId) {
                        var pageId = Model.state.currPage.pageId,
                            compIdx = tableId + "_" + pageId,
                            destTable = Def.ModelDestTables[compIdx],
                            tabId, content, group, field, id, targetId;
                        // if table is marked up as HTML table,
                        // focus the tab that contains the table.
                        //console.log(compIdx);console.dir(Def.ModelDestTables);
                        //console.log("is table? " + table.IsTabled);
                        try {
                            if (destTable.IsTabled) {
                                // if table's IsTabled flag is set, then it'll have its own tab.
                                // however, if the field belongs to a group that is marked up as a
                                // table, then it will share the tab with other groups.
                                field = Def.ModelFields.Rows.first(function (field) {
                                    return(field.TableId === tableId && !field.IsShadow);
                                });                                
                                if (Model.state.currPage) {
                                    content = field.Content;
                                    tabId = HTMLUtil.getTabListId(content, pageId);
                                    group = field.Group;
                                    compIdx = group + "_" + pageId;
                                    targetId = HTMLUtil.getTableId(destTable.Id, pageId);
                                    ShowUtil.tab({id: tabId});
                                    console.log("shake table id: " + targetId);
                                    StyleUtil.effect($("#" + targetId), "shake", true);
                                }
                            }
                            // otherwise focus on the ingress field of that table.
                            if (destTable.IsPrimary) {
                                field = Def.ModelFields.Rows.first(function (field) {
                                    return(field.IsIngress && field.TableId === tableId);
                                });
                                id = HTMLUtil.getFieldId(field.Id, pageId);
                                this.input(id, true);
                            }                                                       
                        } catch (err) {
                            console.log(err.stack);
                        }
                        
                    },
                    menuButton: function () {
                        // set focus to either 1st menu item or last focused menu item
                        var id;
                        if (Model) {
                            id = HTMLUtil.getMenuButtonId(Model.state.activePageGroup);
                            $("#" + id).focus(); 
                        } else {
                            $("#" + AI.htmlId.menuPageContainer + " [tabindex='1']").focus();
                        }
                    },
                    submenu: function () {
                        var m = Model.state.activePageGroup;                        
                        $("#" + AI.htmlId.submenuContainer).find("[data-m=" + m + "]")[0].focus();
                    }
                },
                fieldChangeHandler: function (event) {
                    StyleUtil.capitalize(event);
                    var pageId, pageModel, el = event.target;
                    if ($(el).hasClass(AI.htmlClass.groupField)) {
                        pageId = HTMLUtil.getPageIdFrom($(el).attr("id"));
                        pageModel = Model.pageModel[pageId];
                        pageModel.lookupField(undefined, undefined, event.target);
                        pageModel.writeField($(el)); 
                        ViewUtil.feedback.clear();
                        pageModel.changeables($(el));
                    }
                }
            };
        return me;
    })();
