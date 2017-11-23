var ModalUtil = (function () {
        var me = {
            escape: function (e) {
                HideUtil.modal();
                e.stopPropagation();
                ViewUtil.feedback.give({
                    msg: "You dismissed the dialog. No action was taken."});
                ViewUtil.state.modal.rowIndex = undefined;
            },
            /**
             * @function keydown
             * @description handles keydown events on a modal.
             * @param {Object} event
             * @returns {undefined}
             */
            keydown: function (event) {                        
                try {
                    var key = event.keyCode || event.which,
                        modal = document.getElementById(AI.htmlId.modalContainer),
                        buttons = modal.querySelectorAll("button"),
                        fn, i, l = buttons.length, char;
                        // caveat
                    // if input is being updated, option callbacks should not be triggered.
                    if (document.activeElement.nodeName === "INPUT") {return;}  
                    // escape
                    if (key === 27) {
                        this.escape(event);
                        return;
                    } 
                    // unprintable keys
                    if (key < 65 || key > 90) {return;}
                    key = String.fromCharCode(key);
                    // run callback
                    // by default, hide the modal when done.
                    for (i = 0; i < l; i++) {
                        char = buttons[i].getAttribute("data-kbd");
                        fn = ViewUtil.state.modal.options[i].callback || HideUtil.modal;
                        if (key.toLocaleLowerCase() === char.toLocaleLowerCase()) {
                            fn();
                            if (fn !== HideUtil.modal) {
                                HideUtil.modal();
                            };
                            break;
                        }
                    }                
                } catch (err) {
                    Service.logError(err);
                }
            },
            /**
             * 
             * @param {String} containerId
             * @param {String} context
             * @returns {Boolean}
             */
            validate: function (containerId) {
                var container = document.getElementById(containerId),
                    inputs = container.querySelectorAll("input, select"),
                    pData = {},// holds (tableId, manifest)// holds (tableId, manifest)
                    oData = {},
                    tableId, tableName,
                    fieldId, fieldName,
                    field, i, l = inputs.length,
                    valid;                
                for (i = 0; i < l; i++) {
                    field = inputs[i];
                    valid = true;
                    // flag values
                    // use field names as property names for easy retrieval.
                    fieldId = HTMLUtil.getFieldIdFrom(field.id);
                    fieldName = Def.ModelFields[fieldId].Name;
                    tableId = Def.ModelFields[fieldId].TableId;
                    tableName = Def.ModelTables[tableId].Name;
                    // mandatory?
                    if (!field.value && Def.ModelFields[fieldId].IsRequired) {
                        ViewUtil.feedback.give({
                            msg: "This field is required.",
                            type: "err"
                        });                        
                        valid = false;
                    }
                    // numeric negativity
                    if (Def.ModelFields[fieldId].DataType === "Number") {
                        if (field.value < 0 &&
                            !Def.ModelFields[fieldId].AllowNegative) {    
                            ViewUtil.feedback.give({
                                msg: "This field cannot be negative",
                                type: "err"
                            });
                            valid = false;
                        }
                        // numeric zero
                        if (field.value === 0 &&    
                            !Def.ModelFields[fieldId].AllowNegative) {
                            ViewUtil.feedback.give({
                                msg: "This field cannot be zero",
                                type: "err"
                            });                            
                            valid = false;
                        }                        
                    }
                    if (!valid) {
                        CtrlUtil.focus.input(field.id, true);
                        return;
                    }
                    // this object signature matches the manifest argument
                    // of Model.Page.prototype.writeRecord
                    oData[fieldName] = field.value; 
                }
                pData[tableId] = {};
                pData[tableId].records = [];
                pData[tableId].records.push(oData);
                // reflect
                pData[tableName] = pData[tableId];
                //console.log("prompt data:" + Object.keys(pData[tableId].records[0])); 
                return pData;
            },
            /**
             * 
             * @param {Boolean} freeze
             * @returns {undefined}
             */
            freezeApp: function (freeze) {
                var app = document.getElementById(AI.htmlId.appContainer),
                    children = Array.from(app.querySelectorAll("input, select"));
                children.forEach(function (child) {
                    var tabindex,
                        to = (freeze)? "tabindex": "data-tabindex",
                        from = (freeze)? "data-tabindex": "tabindex";
                    if (child.hasAttribute(from)) {
                        tabindex = child.getAttribute(from);
                        if (tabindex === "") {child.removeAttribute(to);}
                        if (!freeze) {child.setAttribute("tabindex", "-1");}
                        child.setAttribute(to, tabindex);
                    } else {// when attribute does not exist, use blank
                        child.setAttribute(to, "");
                    }                    
                });
            },
            /**
             * 
             * @param {type} modal
             * @returns {undefined}
             */
            next: function (modal) {                
                HideUtil.modal();
                var args = arguments;
                setTimeout(function () {
                    switch (modal) {
                        case "dialog":
                            me[modal](args[1]);
                            break;
                        case "logoutModal":
                            me[modal]();
                            break;
                        case "closePageModal":
                            me[modal](args[1], args[2], args[3]);
                            break;
                        case "lookup":
                            me[modal](args[1], args[2], args[3], args[4]);
                            break;
                        case "wizard":
                            me[modal](args[1], args[2]);
                            break;
                        case "confirmation":
                            me[modal](args[1], args[2], args[3], args[4]);
                            break;
                    }
                }, 1000);
            },
            logoutModal: function () {  
                var args = {
                    title: "Logout",
                    msgs: [
                        "You will now be logged out of the application. Any unsaved work may be lost."                 ],
                    gist: "Are you sure you want to log out now?",
                    options: [{
                        opt: "Yes. Log out.",                    
                        callback: function () {
                            Control.access.logout();
                        }
                    }, {
                        opt: "No. Don't log out.",
                        "default": true
                    }]      
                };
                this.dialog(args);
            },
            closePageModal: function (newFormId, index, callback) {
                try {
                    var pageId = Model.state.currPage.pageId,
                        alias = Def.ModelPages[pageId].Alias || Def.ModelPages[pageId].Name;
                    var args = {
                        type: "d",
                        title: "Close " + alias + " Page",
                        msgs: [
                            "This page will now be closed. Any unsaved work might be lost."
                        ],
                        gist: "Are you sure you want to close it?",
                        options: [{
                            opt: "Yes, Close it.",
                            callback: function () {
                                HideUtil.modelForm(newFormId, true);                        
                                callback(index);
                                HideUtil.modal();
                                CtrlUtil.focus.submenu();
                            }
                        }, {
                            opt: "No. Don't close.",
                            "default": true
                        }]
                    };
                    this.dialog(args);
                } catch (err) {
                    Service.logError(err.stack);
                }
            },        
            /**
             * @description Popup a modal dialog.
             * @param {Object} args {
             *  title: String
             *  msgs: Array of strings,
             *  gist: String,
             *  options: Array of Objects {
             *      opt: String,
             *      default: Boolean,
             *      callback: Function
             *      }
             * }
             * @returns {undefined}
             */
            dialog: function (args) {
                new Modal({
                    type: "d",
                    title: args.title,
                    msgs: args.msgs,
                    gist: args.gist,
                    options: args.options
                });
                ViewUtil.flagModalView("dialog");
            },
            /**
             * 
             * @param {String} title
             * @param {Array} rows
             * @param {String} fieldId Id of field being looked up
             * @param {Function} cb
             * @returns {undefined}
             */
            lookup: function (title, rows, fieldId, cb) {
                var l = title.length,
                    lastChar = title.substring(l - 1, l + 1),
                    plural = ModUtil.getPlural(title, lastChar),                
                    subtitle, msgs = [],
                    modal = {};
                rows = rows || [];
                l = rows.length || 0;
                title = (l > 1)? plural: title;
                if (l === 0) {
                    subtitle = "Sorry, no records matched your search.";
                    msgs.push("Nothing to lookup.");
                } else {
                    subtitle = l + " " + title + " found.";
                    msgs.push("Please look-up the item you want.");
                }
                modal = {
                    type: "l",
                    title: "Lookup",
                    subTitle: subtitle,
                    msgs: msgs,
                    gist: "Use (up/down) arrow keys to highlight an item. Use ENTER key to select highlighted item.",
                    rows: rows,
                    fieldId: fieldId,
                    options: [{
                            opt: "Ok. Use selected item.",
                            "default": true,
                            callback: function () {
                                HideUtil.modal();  
                                if (typeof cb === "function") {cb(ViewUtil.state.modal);}
                            }
                        }, {
                            opt: "Cancel. None selected."
                        }
                    ]
                };            
                new Modal(modal);
                ViewUtil.flagModalView("lookup");
            },
            /**
             * 
             * @param {Array} fields
             * @param {Function} cb
             * @returns {undefined}
             */
            prompt: function (fields, cb) {
                var modal = {
                        type: "p",
                        title: "Input Prompt",
                        gist: "Enter valid information in the field(s). Click 'Ok' when done.",
                        // array of input & select field objects to display for data input
                        fields: fields,
                        options: [{
                                opt: "Ok.",
                                "default": true,
                                callback: function () {
                                    var data = me.validate(AI.htmlId.modalPromptContainer);
                                    if (data) {                                    
                                        // run callback with prompt  values.
                                        if (typeof cb === "function") {
                                            cb(data);
                                        }
                                        HideUtil.modal();
                                    } else {
                                        ViewUtil.feedback.give({
                                            msg: "Valid data is required here.",
                                            type: "err"
                                        });
                                    }
                                }
                            }, {
                                opt: "Cancel. No input."
                            }
                        ]
                   };
                new Modal(modal);
                ViewUtil.flagModalView("prompt");
            },
            /**
             * 
             * @param {Object} pageName
             * @param {Function} cb
             * @returns {undefined}
             */
            wizard: function (pageId, cb) {                     
                var fields = DefUtil.getWizardFields(pageId, "Rank"),
                    page = Def.ModelPages[pageId],
                    pageName = page.Name;
                ModUtil.page.load(pageName, true).then(function (model) {
                    new Modal({
                        type: "w",
                        title: (page.WizardTitle)? page.WizardTitle + " Wizard": "Wizard",
                        gist: "Enter appropriate information in this field, then click 'Next'.",
                        fields: fields,// array of input & select field objects for data input.
                        pageId: pageId,
                        options: [{
                                opt: "Ok.",
                                "default": true,
                                callback: function () {
                                    var data = me.validate(AI.htmlId.modalWizardContainer);
                                    //console.log("modal data");console.dir(data);
                                    if (data) {
                                        var tableId = Object.keys(data)[0],
                                            keys = Object.keys(data[tableId].records[0]),
                                            cmd = DefUtil.getHighestRankCommand(pageId);
                                        // commit data to database using the highest-ranked cmd.
                                        // in wizards, only primary table of page is committed.
                                        // if page has secondary tables,
                                        // it will be cumbersome for the user to fill out fields.
                                        keys.forEach(function (key) {
                                            model.data[tableId].records[0][key] =
                                            data[tableId].records[0][key];
                                        });
                                        model.commitData(cmd.Name, false, HideUtil.modal)
                                        .then(function (ok) {    
                                            // if successful, run callback with committed values.
                                            if (ok && typeof cb === "function") {
                                                cb(data[tableId].records);
                                            }
                                        }).catch(function (err) {
                                            //console.log(err.stack);
                                            Service.logError(err);
                                        });
                                    }
                                }
                            }, {
                                opt: "Cancel. No input."
                            }
                        ]
                    });
                    ViewUtil.flagModalView("wizard");
                }).catch(function (err) {
                    //console.log(err.stack);
                    Service.logError(err);
                });
            },
            confirmation: function (subtitle, msgs, gist, callback) {
                new Modal({
                    type: "d",
                    title: "Confirmation",
                    subtitle: subtitle,
                    msgs: msgs,
                    gist: "Are you sure you want to close it?",
                    options: [{
                            opt: "Yes, I confirm.",
                            callback: function () {                           
                                HideUtil.modal();
                                callback();
                            }
                        }, {
                            opt: "No. Cancel action."
                        }
                    ]
                });
                ViewUtil.flagModalView("dialog");
            }
        };
    return me;
})();