"use strict";
function Modal (modal) {        
    this.modal = modal;
    this.doc = document;        
    this.type = modal.type || "d";
    this.title = modal.title || "";
    this.subTitle = (modal.subTitle)? " | " + modal.subTitle: "";        
    this.fragment = ViewUtil.state.modalFrag[this.type] || null;

    var app = this.doc.getElementById(AI.htmlId.appContainer);
    // flag modal object in View.state.modal
    // this is so it can still be referred to from elsewhere.
    ViewUtil.state.modal = modal;
    // check cache
    if (this.fragment) {
        this.doc.getElementsByTagName("body")[0].insertBefore(this.fragment.cloneNode(true), app);
    } else {
        this.markupContainer();
        this.markupContent();            
        this.markupHeader();
        this.markupFooter(); 
    }        
    this.container = this.doc.getElementById(AI.htmlId.modalContainer);
    this.content = this.container.querySelector("#" +
        AI.htmlId.modalContentContainer);
    this.header = this.content.querySelector("header");
    this.footer = this.content.querySelector("footer");
    // heading
    this.header.querySelector("h5").innerHTML = this.title + this.subTitle;
    // sub heading
    //this.header.querySelector("h6").innerHTML = this.subTitle;        
    // modal markup according to type.
    switch (this.type.toLocaleLowerCase()) {
    case "d": // dialog
        // one paragraph per sentence.
        // highlight the final question in a theme.
        if (!this.fragment) {
            this.markupDialog();
            }
        this.dialog(this.modal.msgs);
        break;
    case "l": // lookup
        if (!this.fragment) {this.markupLookup();}
        this.lookup(this.modal.msgs, this.modal.rows);
        break;
    case "p": // prompt
        if (!this.fragment) {this.markupPrompt();}
        this.prompt(this.modal.fields);
        break;
    case "w": // wizard
        if (!this.fragment) {this.markupWizard();}
        this.wizard(this.modal.fields);
        break;
    default:
        return;
    }
    this.markupIcon(this.header, this.type);        
    if (this.modal.options) {
        this.markupOptions(this.footer, this.modal.options);
    }                
    this.show(this.content);        
        // cache
        //if (!this.fragment && this.type === "d") {state.modalFrag[this.type] = this.container.cloneNode(true);}
}
Modal.prototype = {
    // consider marking up each type once and storing it in fragments
    // then modifying those fragments on subsequent calls matching its type.
    // lookups and prompts are exempted from caching due to complexity of markup.
    constructor: Modal,    
    markupContainer: function () {
        var o = HTMLUtil.get({
                tag: "div",
                attr: {
                    id: AI.htmlId.modalContainer,
                    "class": "w3-modal"
                },
                style: {
                    display: "none"
                }
            }),
            app = this.doc.getElementById(AI.htmlId.appContainer);
        this.doc.getElementsByTagName("body")[0].insertBefore(o, app);
    },
    markupContent: function () {
        var content = HTMLUtil.get({
                tag: "div",
                attr: {
                    id: AI.htmlId.modalContentContainer,
                    "class": "w3-modal-content w3-round w3-card-2 w3-animate-zoom w3-theme-deep-purple-light"
                }
            }),
            container = this.doc.getElementById(AI.htmlId.modalContainer);        
        container.appendChild(content);
    },
    markupHeader: function () {
        var header = HTMLUtil.getObj("header"),
            div = HTMLUtil.getObj("div"),
            spanL = HTMLUtil.getObj("span"),
            spanR = HTMLUtil.getObj("span"),
            icon = HTMLUtil.getObj("i"),
            hr = HTMLUtil.get(HTMLUtil.getObj("hr")),
            h5 = HTMLUtil.get(HTMLUtil.getObj("h5")),
            h6 = HTMLUtil.get(HTMLUtil.getObj("h6")),
            content = this.doc.getElementById(AI.htmlId.modalContentContainer);
        spanL.attr.class = "w3-left";
        spanL.innerHTML = "Core Retail Application";
        spanL = HTMLUtil.get(spanL);

        icon.attr.class = "fa fa-close";
        icon.innerHTML = " Close (esc)";
        icon = HTMLUtil.get(icon);

        spanR.attr.class = "w3-closebtn w3-small";
        spanR = HTMLUtil.get(spanR);            
        spanR.appendChild(icon);

        div.attr.class = "w3-theme-deep-purple-d1 w3-small";
        div = HTMLUtil.get(div);
        div.appendChild(spanL);
        div.appendChild(spanR);

        header.attr.class = "w3-container w3-padding-large w3-theme-deep-purple-l1 w3-card-4";
        header.style.height = "25%";
        header = HTMLUtil.get(header);
        header.appendChild(div);
        header.appendChild(hr);
        header.appendChild(h5);
        //header.appendChild(h6);

        content.appendChild(header);
    },
    markupDialog: function () {
        var o = HTMLUtil.getObj("div"), content = this.doc.getElementById(AI.htmlId.modalContentContainer);
        o.attr.id = AI.htmlId.modalDialogContainer;
        o.attr.class = "w3-padding-large";
        o = HTMLUtil.get(o);
        content.insertBefore(o, this.footer);
    },
    markupLookup: function () {
        this.removePrevious(this.content.querySelector("#" + AI.htmlId.modalLookupContainer));
        var o = HTMLUtil.getObj("div"), content = this.doc.getElementById(AI.htmlId.modalContentContainer);
        o.attr.id = AI.htmlId.modalLookupContainer;
        o.attr.class = "w3-padding-large";
        o = HTMLUtil.get(o);
        content.insertBefore(o, this.footer);
    },
    markupPrompt: function () {                
        var o = HTMLUtil.get({
                tag: "div",
                attr: {
                    id: AI.htmlId.modalPromptContainer,
                    "class": "w3-padding-large"
                },
                style: {
                    height: "58%",
                    "overflow-y": "auto"
                }
            }),
            content = this.doc.getElementById(AI.htmlId.modalContentContainer);
        content.insertBefore(o, this.footer);
    },
    markupWizard: function () {  
        var o = HTMLUtil.get({
                tag: "div",
                attr: {
                    id: AI.htmlId.modalWizardContainer,
                    "class": "w3-padding-large"
                }            
            }),
            content = this.doc.getElementById(AI.htmlId.modalContentContainer);
        content.insertBefore(o, this.footer);
    },
    markupFooter: function () {
        var footer = HTMLUtil.get({
                tag: "footer",
                attr: {
                    id: "ftrModalOptions",
                    "class": "w3-padding-all-12 w3-medium w3-border-top w3-theme-deep-purple-l1"},
                style: {
                    position: "relative",
                    bottom: "0%"
                }                
            }),
            content = this.doc.getElementById(AI.htmlId.modalContentContainer);
        content.appendChild(footer);
    },
    markupGist: function (inner, parent, addClasses) {
        var div, span,
            cls = (function () {
                if (addClasses) {
                    return addClasses.join(" ");
                } else {
                    return "";
                }
            })();            
        if (this.fragment) {     
            div = parent.querySelector("#" + AI.htmlId.modalGistContainer);
            span = div.querySelector("span");
            span.innerHTML = inner;
        } else {
            div = HTMLUtil.get({
                tag: "p",
                attr: {
                    id: AI.htmlId.modalGistContainer,
                    "class": "w3-show-inline-block"
                }
            });
            span = HTMLUtil.get({
                tag: "span",
                innerHTML: inner,
                attr: {
                    id: AI.htmlId.modalGist,
                    "class": "w3-theme-deep-purple-l3 w3-padding-large w3-card-4 " + cls
                }
            });           
            div.appendChild(span);
            parent.appendChild(div);
        }
    },
    markupIcon: function (header, type) {
        var icon = HTMLUtil.getObj("i"),
            cls = "fa w3-right w3-xlarge ";
        switch (type.toLocaleLowerCase()) {
        case "d":// dialog
            cls += "fa-question-circle";
            break;
        case "l": //lookup
            cls += "fa-search";
            break;
        case "p":// prompt
            cls += "fa-hand-stop-o";
            break;
        case "w":// wizard
            cls += "fa-magic";
            break;
        }
        icon.attr.class = cls;
        header.querySelector("h5").appendChild(HTMLUtil.get(icon));
    },
    removePrevious: function (node) {
        try {$(node).remove();} catch (err) {};
    },
    markupMsgs: function (msgs, parent) {
        var div, p, i, l = msgs.length;
        if (this.fragment) {
            $("p").remove("." + AI.htmlClass.modalMsg);
            div = parent.querySelector("#" + AI.htmlId.modalMsgContainer);
        } else {
            div = HTMLUtil.get(HTMLUtil.getObj("div"));
            div.id = AI.htmlId.modalMsgContainer;
            parent.appendChild(div);
        }
        for (i = 0; i < l; i++) {
            p = HTMLUtil.getObj("p");
            p.attr.class = AI.htmlClass.modalMsg;
            p.innerHTML = msgs[i];
            div.appendChild(HTMLUtil.get(p));
        }            
    },
    dialog: function (msgs) {
        var dlg = this.content.querySelector("#" + AI.htmlId.modalDialogContainer);
        this.markupMsgs(msgs, dlg);
        // gist
        if (this.modal.gist) {
            this.markupGist(this.modal.gist, dlg);
        }
        dlg.parentElement.style.width = "40%";
    },
    lookup: function (msgs, rows) {
        function getTable () {
            var table = HTMLUtil.get({
                    tag: "table",
                    attr: {
                        "class": "w3-table-all w3-text-black w3-small corra-lookup-table"
                    },
                    style: {
                        position: "relative",
                        display: (rows.length === 0)? "none": "block"
                    }
                }),
                th = HTMLUtil.get({
                    tag: "tHead",
                    attr: {
                        "class": "w3-bold",
                        id: "thead",
                        "data-refId": that.modal.fieldId
                    }
                }),
                tr = th.insertRow(0);            
            // column headings.
            getHeadings();
            headings.forEach(function (h, i) {
                var td = tr.insertCell();
                td.innerHTML = h.alias || h.name;
                td.setAttribute("data-fieldid", h.id);
            });       
            // append
            table.appendChild(th);
            table.appendChild(tbody);
            return table;
        }
        function getHeadings () {
            var keys = (rows.length > 0)? Object.keys(rows[0]): [],
                fieldId = that.modal.fieldId,
                tableId = DefUtil.getOrigin(fieldId, "table") || Def.ModelFields[fieldId].TableId;
            // tableFields is a subset of Def.ModelFields.
            // This makes the search for field properties quicker.
            // Use fieldnames flagged as IsMidLookup
            // sort fields in order of validation
            DefUtil.getTableFields(tableId).sort(function (a, b) {
                return TypeUtil.sortObject(a, b, "ValidationRank", true);
            }).forEach(function (field) {
                if (field.IsMidLookup && keys.indexOf(field.Name) >= 0) {                    
                    headings.push({
                        alias: field.Alias || field.Name,
                        id: field.Id,
                        name: field.Name
                    });                    
                }
            });
        }
        function populateRows () {
            var tr = HTMLUtil.get({
                    tag: "tr",
                    attr: {
                        "class": "w3-hover-yellow " + AI.htmlClass.modalRow                        
                    },
                    style: {
                        cursor: "pointer"
                    }
                });
            rows.forEach(function (row, i) {
                var r = tr.cloneNode(true);
                r.id = "lookup-row-" + i;
                r.setAttribute("tabindex", i);
                headings.forEach(function (h) {
                    var cell = r.insertCell();
                    cell.innerHTML = TypeUtil.getFormatted(row[h.name], h.id, true);
                });
                tbody.appendChild(r);
            });
        }
        
        var that = this,
            lu = this.content.querySelector("#" + AI.htmlId.modalLookupContainer),            
            headings = [],
            tbody = this.doc.createElement("TBODY"),
            container = HTMLUtil.get({
                tag: "div",
                attr: {
                    "class": AI.htmlClass.tableContainer,
                    id: "lookupContainer"
                },
                style: {
                    position: "relative",
                    height: "auto",
                    minHeight: "12em",
                    maxHeight: "15em",
                    overflow: "hidden"
                }
            }),
            wrap = HTMLUtil.get({
                tag: "div",
                attr: {
                    "class": AI.htmlClass.tableWrapper
                },
                style: {
                    position: "relative",
                    maxHeight: container.style.height,
                    overflow: "hidden"
                }
            }),                        
            table = getTable(),
            frag = this.doc.createDocumentFragment();            

        this.markupMsgs(msgs, lu);
        // populate rows.
        populateRows();
        frag.appendChild(table.cloneNode(true));  

        // append container            
        container.appendChild(frag);
        wrap.appendChild(container);
        lu.appendChild(wrap);

        // gist
        if (this.modal.gist) {
            this.markupGist(this.modal.gist, lu);
        }
        lu.parentElement.style.width = "75%";
    },
    prompt: function (fields) {
        var prompt = this.content.querySelector("#" + AI.htmlId.modalPromptContainer),
            flex = MarkupUtil.container.get({
                container: {
                    type: "field"
                },
                dir: "row"
            }),
            container, input, label, that = this, pageId = Model.state.currPage.pageId;
        // markup each field for the prompt.
        fields.forEach(function (field) {
            var value, fieldId = field.Id;
            // main attributes
            input = that.markupInput(field, pageId);
            // current value of input
            // .Value is a dynamic property added at pageName.editTableRow.
            value = field.Value || field.DefaultValue;
            value = TypeUtil.getFormatted(value, fieldId, false);
            input.value = value;
            label = MarkupUtil.label.get(field, pageId);
            container = HTMLUtil.get({
                tag: "div",
                attr: {
                    "class": AI.htmlClass.flexItem
                }
            });
            container.appendChild(label);
            container.appendChild(input);

            flex.appendChild(container);
        });
        prompt.appendChild(flex);
        prompt.appendChild(HTMLUtil.get({tag: "hr"}));
        // gist
        if (this.modal.gist) {
            this.markupGist(this.modal.gist, prompt);
        }
        prompt.parentElement.style.width = "50%";
        prompt.parentElement.style.height = "82%";
    },
    wizard: function (fields) {
        if (fields.length === 0) {return;}
        var wiz = this.content.querySelector("#" + AI.htmlId.modalWizardContainer),
            div = HTMLUtil.get(HTMLUtil.getObj("div")),
            divPrev = HTMLUtil.get({
                tag: "div",
                attr: {
                    "class": "w3-quarter w3-padding-jumbo w3-large w3-ripple w3-btn w3-light-grey " + AI.htmlClass.wizardNav,
                    title: "Previous field"
                }
            }),
            divNext = HTMLUtil.get({
                tag: "div",
                attr: {
                    "class": "w3-quarter w3-padding-jumbo w3-large w3-ripple w3-btn w3-light-grey " + AI.htmlClass.wizardNav,
                    title: "Next field"
                }
            }),
            /*flex = MarkupUtil.container.get({
                container: {
                    type: "content"
                },
                dir: "row"
            }),*/
            // flex container
            flex = HTMLUtil.get({
                tag: "div",
                attr: {
                    id: AI.htmlId.wizardFlex,
                    "class": "w3-half w3-display-container w3-large " + AI.htmlClass.flexRow
                }
            }),
            aPrev = HTMLUtil.get({
                tag: "a",
                attr: {
                    id: AI.htmlId.wizardPrev,
                    "class": "w3-center w3-text-theme-deep-purple"                    
                }                
            }),
            aNext = HTMLUtil.get({
                tag: "a",
                attr: {
                    id: AI.htmlId.wizardNext,
                    "class": "w3-center w3-text-theme-deep-purple"
                }
            }),
            iPrev = HTMLUtil.get({
                tag: "i",
                attr: {"class": "fa fa-arrow-left w3-xxlarge"}
                }),
            iNext = HTMLUtil.get({
                tag: "i",
                attr: {"class": "fa fa-arrow-right w3-xxlarge"}
                }),            
            container = HTMLUtil.get({
                tag: "div",
                attr: {
                    "class": "w3-container w3-padding-small " + AI.htmlClass.wizardFieldContainer
                },
                style: {
                    width: "100%"
                }
            }),
            label = HTMLUtil.get({
                tag: "span",                
                attr: {
                    "class": "w3-display-top-middle"
                }
            }),
            input,
            that = this;
        // iconize
        aPrev.appendChild(iPrev);
        aNext.appendChild(iNext);
        divPrev.appendChild(aPrev);
        divNext.appendChild(aNext); 
        // markup each field in the wizard
        fields.forEach(function (field, index) {
            var c = container.cloneNode(true),
                l = label.cloneNode(true),
                value = field.Value || field.DefaultValue;
            // .Value is a dynamic property added at pageName.editTableRow.            
            value = TypeUtil.getFormatted(value, field.Id, false);            
            input = that.markupInput(field, that.modal.pageId);
            input.value = value;
            c.title = field.Description;
            // show only first field. other fields will be displayed as navigated to.
            c.style.display = (index > 0)? "none": "block";
            l.innerHTML = field.Alias || field.Name;
            // append
            c.appendChild(l);
            c.appendChild(input);            
            flex.appendChild(c);
        });
        div.appendChild(divPrev);
        div.appendChild(flex);
        div.appendChild(divNext);
        wiz.appendChild(div);
        //wiz.appendChild(HTMLUtil.get(HTMLUtil.getObj("br")));
        wiz.appendChild(HTMLUtil.get(HTMLUtil.getObj("hr")));
        // index of visible field. start from first.
        ViewUtil.state.modal.wizardIndex = 0;
        ViewUtil.state.modal.wizardLen = fields.length;

        // gist
        if (this.modal.gist) {
            //this.markupGist(fields[0].WizardPrompt, wiz, ["w3-large"]);
            this.markupGist(this.modal.gist, wiz, ["w3-large"]);
        }
        wiz.parentElement.style.width = "50%";
    }, 
    markupOptions: function (footer, options) {
        var that = this, span, button, iS,
            shortcut, shortcuts = [];
        View.removeFragment(footer, null, true);
        ViewUtil.state.modal.callbacks = [];
        // loop through option buttons
        options.forEach(function (option, index) {
            // options as buttons                
            span = HTMLUtil.get({
                tag: "span",
                attr: {
                    "class": "w3-padding-small"
                }
            });
            // ensure shortcut keys are not repeated.
            iS = 0;
            do {
                shortcut = option.opt.substr(iS, 1);
                if (shortcuts.indexOf(shortcut) === -1) {                        
                    shortcuts.push(shortcut);
                    break;
                }
                iS++;
            }
            while (iS < option.opt.length);
            // markup option button
            button = HTMLUtil.get({
                tag: "button",
                attr: {
                    id: HTMLUtil.getTag("button") + (index + 1),
                    "class": "w3-btn w3-round w3-focus-border-amber w3-hover-amber w3-margin-bottom w3-theme-deep-purple-d1 " + AI.htmlClass.modalOption,
                    "data-index": index,
                    "data-kbd": shortcut,
                    "data-color": "w3-theme-deep-purple-l1",
                    "data-default": (option.default)? true: false,
                    tabindex: index + 1
                }  
            });
            // check if its default option
            if (option.default) {
                button.classList.add("w3-border-amber");
            }
            button.addEventListener("click", option.callback || HideUtil.modal);               
            that.underscoreShortcutKey(button, option.opt, shortcut),

            span.appendChild(button);
            footer.appendChild(span);
            ViewUtil.state.modal.callbacks.push(option.callback);                
        });
    },
    underscoreShortcutKey: function (e, s, l) {
        var index = s.indexOf(l),
            str = s.replace(s.substr(index, 1), function (x) {
                var strongStart = "<strong style='text-decoration: underline;'>",
                    strongEnd = "</strong>";
                return strongStart + x + strongEnd;
            });
        e.innerHTML = str;
    },
    show: function (content) {
        ShowUtil.modal();
        // display modal.
        content.style.display = "block";
        content.parentElement.style.opacity = 10;
        switch (this.type) {
            case "d":
                $("#btn2").focus();
                break;
            case "l":
                if (this.modal.rows.length > 0) {
                    $("#" + AI.htmlId.modalContainer).find("tr[tabindex='0']").focus();
                } else {
                    $("#btn2").focus();
                }            
                break;
            case "p":
                $("#" + AI.htmlId.modalPromptContainer).find("input,select")[0].focus();
                break;
            case "w":
                $("." + AI.htmlClass.wizardFieldContainer + ":visible input")[0].focus();
                break;
            default:
                $("#" + AI.htmlId.modalContainer + "[data-default='true']").focus();
        }
    },
    /**
     * 
     * @param {type} field
     * @param {type} pageId
     * @returns {HTMLElementObject|Element|Modal.prototype.markupInput.input}
     */
    markupInput: function (field, pageId) {
        var fieldId = field.Id,
            tag = field.HTMLTag,
            chooseFromTableId = Def.ModelFields[fieldId].ChooseFromTableId,
            input = HTMLUtil.get({
                tag: tag,
                attr: {
                    "class": " w3-input w3-medium " + AI.htmlClass.groupField,
                    id: HTMLUtil.getFieldId(fieldId, pageId)
                }
            });
        if (tag === "select") {
            // fill options if select element
            HTMLUtil.fillDropDown(input, chooseFromTableId, field.DataFormat);
        }
        return input;     
    }
};    
//learn piano: 08052331686 | 08032140740