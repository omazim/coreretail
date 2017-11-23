var ViewUtil = (function () {
        var me = {
                state: {
                    modalView: false,// toggle this to indicate when a modal is on/off.
                    promptView: false,
                    lookupView: false,
                    dialogView: false,
                    wizardView: false,
                    modal: {},
                    modalFrag: {},
                    table: {},
                    activeViews: [],//keeps track of active tab (for tabbed content).
                    timeout: {},
                    interval: {},
                },
                /**
                 * 
                 * @param {type} view
                 * @returns {undefined}
                 */
                flagModalView: function (view) {
                    var that = this;
                    ["prompt","lookup","dialog"].forEach(function (v) {
                        that.state[v + "View"] = false;
                    });
                    if (view) {that.state[view + "View"] = true;}
                },
                /**
                * @function feedback
                * @description Display application strMsg to user, change class of strMsg 
                * element in order to reflect the type of message it is. 
                * @param {string} strMsg Message to show to user.
                * @param {string} strCat optional Type of message (error, info, warning, success, 
                * etc).
                * @param {string} strOrigin optional Name of function that generated the strMsg.
                * @returns {undefined}
                */
                feedback: {
                    msgs: [],
                    /**
                     * 
                     * @param {String} msg
                     * @param {String} type
                     * @returns {getView.me.feedback}
                     */
                    push: function (msg, type) {
                        this.msgs.push({
                            msg: msg,
                            type: type
                        });
                        return this;
                    },
                    useClass: function (fb, type) {
                        var types = this.types,
                            keys = Object.keys(types),
                            prefix = "w3-vivid-";
                        type = type || "normal";
                        keys.forEach(function (key) {
                            if (key !== type) {
                                fb.removeClass(prefix + types[key]);
                            } else {
                                fb.addClass(prefix + types[key]);
                            }
                        });
                    },
                    clear: function () {
                        HideUtil.snackbar(true);
                        HideUtil.infobar(true);                            
                    },
                    /**
                     * 
                     * @param {Array} msgs
                     * {msg: String, type: String (ok | warn | err | info | norm)}
                     * @returns {undefined}
                     */
                    give: function (msgs) {
                        var span = HTMLUtil.get({
                                tag: "span",
                                attr: {
                                    "class": "w3-small w3-bold w3-padding-small w3-show-inline-block"
                                },
                                innerHTML: ""
                            }),
                            container = $("#" + AI.htmlId.feedbackContainer),
                            sb = document.createDocumentFragment();
                        // make into array
                        msgs = msgs || me.feedback.msgs;
                        if (!Array.isArray(msgs)) {msgs = [msgs];}
                        try {
                            msgs.forEach(function (msg) {
                                var t = msg.type || "info",
                                    m = msg.msg || "",
                                    manifest = Def.ModelFeedbacks[t],
                                    i,
                                    s = span.cloneNode(true);
                                i = MarkupUtil.icon.get(manifest.IconClass);
                                s.innerHTML = m;
                                /*container.append(i);
                                container.append(s);
                                container.append("<br>");*/ 
                                //console.log("feedback: " + m);
                                sb.appendChild(i);
                                sb.appendChild(s);
                                sb.appendChild(document.createElement("BR"));  
                            });
                            ShowUtil.snackbar(sb);
                            //container.show("fast");    
                        } catch (err) {
                            console.log(err.stack);
                            Service.logError(err);                            
                        }
                    }            
                },
                isInViewport: function (c, e) {
                    var eRect = e.getBoundingClientRect(),
                        cRect = c.getBoundingClientRect();
                    return (
                        eRect.top >= cRect.top &&
                        eRect.left >= cRect.left &&
                        eRect.bottom <= cRect.bottom &&
                        eRect.right <= cRect.right
                    );
                },
                check: function (c) {
                    var tr = c.querySelector("tbody").getElementsByTagName("tr"),
                        visible = [],
                        i, l = tr.length, curr;
                    for (i = 0; i < l; i++) {
                        curr = tr[i];
                        if (!this.isElementInViewport(c, curr)) {
                            // return first out-of-viewport row.
                            return $(curr).attr("tabindex");
                        }
                    }
                }, 
                flag: {
                    /**
                    * @description There can be more than 1 table in view.
                    * @param {JQuery Object} e
                    * @returns {undefined}
                    *
                    tableRow: function (e) {
                        // caveat
                        if (e.hasClass(AI.htmlClass.modalRow)) return;            
                        var table = e.parents("table")[0];            
                        state.table[table.id].rowIndex = e.index();            
                    },*/
                    tableRow: function (e) {
                        var index = e.index();                    
                        e.parents("table").attr("data-rownum", index);
                    },
                    /**
                     * @description As there can only be 1 modal at a time.
                     * @param {JQuery Object} e
                     * @returns {undefined}
                     */
                    modalRow: function (e) {
                        me.state.modal.rowIndex = e.index();  
                    },
                    /**
                    * @param {String} id
                    * @param {Function} shower
                    * @param {Function} hider
                    * @param {Boolean} next Show preceding element?
                    * @returns {undefined}
                    */
                    view: function (id, shower, hider, next) {
                        next = !!(next);
                        console.log("flag: " + id + " @position " + me.state.activeViews.length);
                        me.state.activeViews.push({
                            id: id,
                            shower: shower,
                            hider: hider,
                            next: next
                        });
                    },
                    pageTabView: function (page, revert) {
                        // flag current tab
                        var mainSel = ".w3-border-deep-purple.w3-bottombar." + AI.htmlClass.mainTab + ":visible",
                            subSel = ".w3-border-deep-purple.w3-bottombar." + AI.htmlClass.subTab + ":visible",
                            maintab, subtab,
                            maintabId, subtabId, id = {};
                        maintab = $(mainSel);
                        subtab = $(subSel);    
                        //alert(mainSel + " found: " + maintab.length);
                        //alert(subSel + " found: " + subtab.length);
                        if (page) {
                            if (maintab) {
                                maintabId = maintab.attr("id");
                                if (revert) {
                                    id.maintabId = maintabId;
                                } else {
                                    page.view.maintabId = maintabId;
                                }
                            }
                            if (subtab) {
                                subtabId = subtab.attr("id");;
                                if (revert) {
                                    id.subtabId = subtabId;
                                } else {
                                    page.view.subtabId = subtabId;
                                }
                            }
                            if (revert) {
                                //alert("flag maintab id: " + id.maintabId + "//subtab id: " + id.subtabId);
                                return id;
                            }
                        }
                    },
                    /**         
                     * @description Unflag/remove the latest view.
                     * @param {String} id
                     * @returns {undefined}
                     */
                    /*unflagView: function (id) {
                        var i, l = me.state.activeViews.length;
                        if (id === undefined) {
                            me.state.activeViews.pop();
                        } else {
                            for (i = (l -1); i >= 0; i--) {
                                if (me.state.activeViews.indexOf(id) > -1) {
                                    me.state.activeViews.splice(i, 1);
                                }
                            }
                        }
                    },*/
                    /**
                     * @param {String} id
                     * @returns {Boolean}
                     */
                    isViewFlagged: function (id) {
                        var i, l = me.state.activeViews.length;
                        for (i = 0; i < l; i++) {
                            if (me.state.activeViews[i].id === id) {
                                return true;
                            }
                        }
                        return false;
                    }     
                },        
                /**
                * @param {HTMLElement Object} e
                * @param {Boolean} cue
                */
                cueMsg: function (e, cue) {
                    // caveat
                    if (!e.hasClass(AI.htmlClass.groupField)) return;

                    var inp = e.get(0),
                        id = HTMLUtil.getNamePartFromId(inp.id),
                        field = Def.ModelFields[id],
                        msg;
                    // ???
                    inp.oldvalue = inp.value;
                    if (field && field.Related) {
                        if (cue) {
                            msg = field.ValidationMessage || "";
                            msg += "<br>" + "Press F2 to see more details, or simply type to search.";
                            me.show.popup(inp, msg, cue);
                        } else {
                            HideUtil.popup(inp.id);
                        }
                    }
                },
                /**
                 * 
                 * @param {type} key
                 * @returns {undefined}
                 */    
                rightPaneAction: function (key) {
                    var char = String.fromCharCode(key),
                        links = $("." + AI.htmlClass.rightPaneLink),
                        accessKey;
                    links.each(function () {
                        accessKey = $(this).attr("accesskey");
                        if (accessKey.toLocaleLowerCase() === char.toLocaleLowerCase()) {
                            me.show.rightPane($(this));
                        }
                    });
                },                    
                cachedFragments: [],
                /**
                * @param {String} name Name of fragment
                * @param {HTMLDocFragment OR String} fragment HTMLDocFragment or its Id
                * @returns {undefined}
                */
                cacheFragment: function (name, fragment) {
                    this.cachedFragments[name] = fragment.cloneNode(true);
                },
                isFragmentCached: function (name) {
                    var keys = Object.keys(cachedFragments);
                    return (keys.indexOf(name) > -1)? true: false;
                },
                isVisible: function (id) {
                    var e = document.getElementById(id);
                    if (e === null) {
                        return false;
                    }
                    while (e.nodeName !== "BODY") {
                        if (e.style.display === "none") {return false;
                        } else {
                            e = e.parentElement;
                            if (e === null) {return false;}
                        }
                    }
                    return true;
                },
                isClassVisible: function (c) {
                    var display = $("." + c).css("display")[0];
                    return (display.indexOf("block") >= 0)? true: false;
                },
                emptyModelContainer: function () {
                    var model = document.getElementById(AI.htmlId.modelContainer),
                        children = model.children.length, child,
                        i = children - 1;
                    //console.log(children + " model children init.");
                    while (i >= 0) {
                        //console.log(Number(i + 1) + " model children");
                        child = model.children[i];
                        model.removeChild(child);
                        --i;
                    }
                },
                emptyActionBar: function () {
                    $("#" + AI.htmlId.actionBarContainer).children().remove();
                },
                stopSnackbarHiding: function () {
                    var sb = $("#" + AI.htmlId.snackbar);
                    clearTimeout(this.state.timeout.snackbar);
                    sb.clearQueue().stop().fadeIn("fast");
                },
                startSnackbarHiding: function () {
                    HideUtil.snackbar();
                },
                /**
                 * 
                 * @param {String} tableId
                 * @param {String} fieldId
                 * @returns {DocumentFragment}
                 */
                relatedInfo: function (tableId, fieldId) {
                    var page = Model.state.currPage,
                        data = page.data[tableId].related[fieldId] || {},
                        infobar = $("#" + AI.htmlId.infobar),
                        infobarCaption = infobar.children("." + AI.htmlClass.infobarCaption),
                        infobarText = infobar.children("." + AI.htmlClass.infobarText), 
                        p = HTMLUtil.get({
                            tag: "p",
                            attr: {
                                "class":"w3-border-bottom w3-border-white w3-hover-teal"
                            }
                        }),
                        span = document.createElement("span"),
                        info = document.createDocumentFragment(),
                        value;
                    Object.keys(data).forEach(function (key) {
                        var oFieldId = DefUtil.getOrigin(key, "field"),
                            oField = Def.ModelFields[oFieldId] || {Name: key},
                            skey, sval, pkey, alias;
                        if (!oFieldId) {
                            value = data[key];
                        } else {
                            value = TypeUtil.getFormatted(data[key], oFieldId, true);
                        }
                        alias = oField.Alias || oField.Name;
                        pkey = p.cloneNode(true);
                        skey = span.cloneNode(true);
                        sval = span.cloneNode(true);                            
                        skey.className = "w3-float-left w3-padding-tiny w3-third w3-left-align";
                        sval.className = "w3-float-right w3-padding-tiny w3-right-align";
                        skey.innerHTML = alias;
                        sval.innerHTML = value;
                        pkey.appendChild(skey);
                        pkey.appendChild(sval);
                        info.appendChild(pkey);
                        info.appendChild(document.createElement("br"));
                    });
                    // renew
                    infobarText.children().remove();
                    infobarText.append(info);
                    infobarCaption.text(Def.ModelTables[tableId].Alias);
                }
            };
        return me;
    })();