var MarkupUtil = (function () {
        var me = {
                paginator: function (arr) {
                    var nav = this.html.get({
                            tag: "nav",
                            attr: {
                                "class": "codrops-demos"
                            }
                        }),
                        span = this.html.get({
                            tag: "span",
                            innerHTML: "See more..."
                        }), 
                        a = this.html.get({tag: "a"});
                    nav.appendChild(span);
                    arr.forEach(function (o, index) {
                        var aPage = a.cloneNode(true);
                        aPage.setAttribute("href", "#");
                        aPage.setAttribute("data-show", o.id);
                        aPage.innerHTML = index;
                        nav.appendChild(aPage);
                    });
                    return nav;
                },
                input: {
                    /**
                     * 
                     * @param {Object} manifest
                     * @param {String} pageId
                     * @param {Object} args keys of which describe the following:
                     * @description label: boolean markup with a label?
                     * @description contain: boolean markup inside a container?
                     * @description wrap: boolean markup the container inside another container?
                     * @returns {corra_view_L2.me.html.getObj.e|HTMLElementObject}
                     */
                    get: function (manifest, pageId, args) {                    
                        function typify () {
                            var inputType = that.getType(type, format);
                            if (inputType) {                            
                                if (inputType === "number") {
                                    // do not apply 'number' to type attr,
                                    // it prevents numbers greater than 999.99 from being formatted.
                                    //e.step = "any";
                                } else {
                                    e.type = inputType;
                                }
                            }
                        }
                        function populate () {
                            // fill options of select element
                            // fill from Model or from simple booleans.
                            if (tableId) {
                                HTMLUtil.fillDropDown(e, tableId);
                            } else if (manifest.DataType === "Boolean") {
                                // with no format arg, Yes/No will be returned.
                                //console.log("markup boolean? " + manifest.DataFormat);
                                HTMLUtil.fillDropDown(e);
                            }
                        }
                        function apply () {
                            // label?
                            if (args.label) {
                                label = me.label.get(manifest, pageId);
                            }                       
                            if (args.container) {
                                container = me.container.get(args);
                                if (label) {
                                    container.appendChild(label);
                                }
                                container.appendChild(e);
                                if (args.container.wrap) {
                                    args.container.type = args.hor? "hFieldContainer": "vFieldContainer";
                                    wrap = me.container.get(args);
                                    wrap.appendChild(container);
                                    return wrap;
                                }
                                return container;
                            }
                        }
                        function vField () {
                            // salient & shadow fields
                            // usually read-only.
                            tag = "div";
                            attr = {
                                name: id,
                                id: id,
                                "class": "w3-xxlarge w3-right-align w3-card-2 " + AI.htmlClass.groupField
                            };
                        }
                        function hField () {
                            var ingressClass = (manifest.IsIngress)? "w3-border w3-border-theme-deep-purple w3-card-16": "";
                            tag = manifest.HTMLTag;
                            attr = {
                                "class": AI.htmlClass.groupField + " w3-input w3-medium " +                                          disableClass + " " + ingressClass,
                                id: id,
                                name: id,
                                required: manifest.IsRequired,
                                disabled: isShadow
                                //"data-dv": defaultValue
                            },
                            style = {
                                width: "100%",
                                "min-width": "80%",
                                "max-width": "100%"
                            };
                        }
                        function markup () {
                            var placeholder = manifest.Placeholder;
                            e = HTMLUtil.get({
                                tag: manifest.HTMLTag,
                                attr: attr,
                                style: style
                            });
                            // placeholders & default values
                            if (tag === "input") {
                                typify();
                            } else if (tag === "select") {
                                populate();
                            }
                            if (!isShadow) {
                                if (tag === "input" || tag === "textarea") {
                                    if (placeholder) {
                                        e.setAttribute("placeholder", placeholder);
                                    } else {
                                        e.defaultValue = defaultValue;
                                    }                                    
                                }
                            } else {
                                if (tag === "input") {
                                    e.setAttribute("placeholder", defaultValue);
                                } else if (tag !== "select") {
                                    e.innerHTML = defaultValue;
                                }
                            }                            
                            // apply container arguments
                            if (args) {
                                args.e = e;
                                args.manifest = manifest;
                                return apply();
                            }
                            return e;
                        }

                        if (!manifest.HTMLTag) {return null;}                    
                        var that = this,
                            fieldId = manifest.Id,
                            tag = manifest.HTMLTag, attr = {}, style = {},
                            type = manifest.DataType,
                            format = manifest.DataFormat,
                            tableId = manifest.ChooseFromTableId,
                            id = HTMLUtil.getFieldId(fieldId, pageId),
                            isShadow = !!(manifest.IsShadow),
                            defaultValue = this.getDefaultValue(manifest), 
                            disableClass = (isShadow)? " w3-disabled": "",
                            e, container, label, wrap, infobar;
                        // todo: 10 oct 2017: 
                        // markup differently (as a searcheable field) if its the ingress field.
                        if (args.hor) {
                            hField();
                        } else {
                            vField();
                        }
                        return markup();                    
                    },                
                    /**
                    * @param {String} type Data type of field
                    * @param {String} format Data format of field
                    * @returns {String} description
                    */
                    getType: function (type, format) {            
                       switch (type) {
                       case "String":
                           switch (format) {
                                case "String":
                                case "Name":
                                case "Id":
                                case "UserId":
                                    return "text";
                                    break;
                                case "Email":
                                    return "email";
                                    break;
                                case "Password":
                                    return "password";
                                    break;
                                default:
                                    return "text";
                           }
                       case "Number":
                           return "number";
                           break;
                       case "Date":
                            switch (format) {
                            case "Date":
                                return "date";
                                break;
                            case "DateTime":
                                return "datetime-local";
                                break;
                            case "Time":
                                return "time";
                                break;
                            case "DateMonth":
                                return "text";
                                break;
                             default:
                                return "date";
                            }
                           break;
                       case "Boolean":
                           return "checkbox";
                           break;
                       default:
                           return "text";
                       }
                    },
                    getDefaultValue: function (manifest) {
                        return TypeUtil.getFormatted(manifest.DefaultValue, manifest.Id, true);
                    }
                },
                label: {
                    get: function (manifest, pageId) {
                        function vField () {
                            // for vertical layout fields
                            tag = "div";
                            attr = {
                                "class": "w3-medium w3-quarter w3-border-0 w3-left-align " +
                                    AI.htmlClass.fieldLabel
                            };
                        }
                        function hField () {
                            // for horizontal layout fields
                            tag = "span";
                            attr = {
                                "class": "w3-large w3-border-0 w3-padding-small " +
                                    AI.htmlClass.fieldLabel
                            };
                        }

                        var tag, attr = {}, style = {}, e, icon, iconClasses = [],
                            tableId = manifest.RelatedTableId;
                        if (DefUtil.isHField(manifest.Id, pageId)) {
                            hField();
                        } else {
                            vField();
                        }
                        // add data-fieldid attribute to tie this label to corresponding field.
                        attr["data-fieldid"] = manifest.Id;
                        e = HTMLUtil.get({
                            tag: tag,
                            attr: attr,
                            style: style,
                            innerHTML: manifest.Alias || manifest.Name
                        });                    
                        // add a refresh icon to drop downs.
                        // this is a cue to refresh the list from which it was populated.
                        if (manifest.HTMLTag === "select") {
                            //iconClasses.push("refresh");                            
                        }
                        // add an info icon to fields that are related to other data tables.
                        if (manifest.RelatedTableId) {
                            iconClasses.push("info");
                        }
                        // add an info icon to fields that are related to other data tables.
                        if (tableId)
                        {//console.log("TableName: " + Def.ModelTables[tableId].Name + " | OmniAdd? " + Def.ModelTables[manifest.TableId].CanOmniAdd + " | StandAlone? " + Def.ModelTables[manifest.TableId].CanStandAlone + " | IsDestination? " + (destTableIds.indexOf(tableId) < 0));
                            if (Def.ModelTables[tableId].CanOmniAdd &&
                                Def.ModelTables[tableId].CanStandAlone) {
                                iconClasses.push("plus");
                            }
                        }
                        e.innerHTML += " "; // space out before icons.
                        icon = me.icon.get(iconClasses);
                        e.appendChild(icon);
                        return e;
                    }
                },
                infobar: {
                    get: function (id) {
                        return HTMLUtil.get({
                            tag: "span",
                            attr: {
                                id: "infobar_" + id,
                                "class": AI.htmlClass.infobarText + " w3-padding-small w3-black"
                            },
                            style: {
                                "border-radius": "6px",
                                height:"50%",
                                width: "25%",
                                right: "30%",
                                "z-index":"50",
                                position:"fixed",
                                overflow:"auto",
                                display:"none"
                            }
                        });    
                    }
                },
                container: {
                    get: function (args) {
                        /**
                         * @description used to markup container for tabbed content on a page.
                         * @returns {undefined}
                         */
                        function content () {
                            var flex = (dir === "row")? AI.htmlClass.flexRow:
                                    (dir === "col")? AI.htmlClass.flexCol: "";
                            attr = {
                                id: (manifest)? HTMLUtil.getContentId(manifest.Name, manifest.PageId): null,
                                "class": "w3-display-container w3-light-grey " + flex + " " +                                           AI.htmlClass.formContent              
                            };
                            style = {height: "90%"};
                            if (manifest) {
                                attr.id = HTMLUtil.getContentId(manifest.Name, manifest.PageId);
                            }
                        }
                        /**
                         * @description markup container for a field container.
                         * @returns {undefined}
                         */
                        function hFieldContainer () {
                            attr = {
                                "class": "w3-card-2" + padding + alignment + fontsize + " " +
                                    AI.htmlClass.flexItem + " " + AI.htmlClass.fieldWrap,
                                title: manifest.Description || ""                        
                            };
                            style = {                            
                                height: height,
                                width: width || (manifest.IsIngress)? "30%":"auto",
                                "max-height": "20%",
                                "min-height": "18%",
                                overflow: "hidden"
                            };
                            // if last wrapper in group, add a right margin for visual spacing.
                            if (args.last) {
                                attr.class += " corra-flex-margin-right";
                            }
                        }
                        function vFieldContainer () {
                            attr = {
                                "class": padding + alignment + fontsize + " " +
                                    AI.htmlClass.flexItem + " " + AI.htmlClass.fieldWrap,
                                title: manifest.Description || ""                        
                            };
                            style = {                            
                                height: height,
                                width: width,
                                "max-height": "20%",
                                "min-height": "18%",
                                overflow: "hidden"
                            };                        
                        }
                        /**
                         * @description for input fields in horizontal layout.
                         */
                        function field () {
                            var ingress = "";
                            if (manifest) {
                                ingress = (manifest.IsIngress)? "w3-theme-deep-purple-action":"";
                            }
                            attr = {
                                "class": "w3-col w3-border-0 " + AI.htmlClass.fieldContainer + 
                                    " " + ingress
                            };
                            style = {
                                position: "relative",
                                width: "100%"
                            };
                        }
                        function group () {
                            var themeClass = args.themeClass,
                                index = args.index,
                                flex = !!(manifest.IsHorizontal)? AI.htmlClass.flexRow:
                                    AI.htmlClass.flexCol,
                                i = Misc.normalizeIndex(index,
                                    Def.ModelThemeGradients.Rows.length - 1
                                ),
                                gradient = me.themes.getGradient(i),
                                colorClass = me.themes.getGradientClass(themeClass, gradient);
                            attr = {
                                id: HTMLUtil.getGroupId(manifest.Name,
                                    manifest.ParentName, manifest.PageId),
                                "class": flex + " " + AI.htmlClass.contentGroup + " " + colorClass
                            };
                            style = {
                                height: (manifest.Height)? manifest.Height + "%": "auto",
                                width: (manifest.Width)? parseInt(manifest.Width, 10) + "%": "auto"
                            };
                        }
                        function search () {
                            attr = {
                                "class": "w3-card-2 " + padding + alignment + fontsize + " " +
                                    width + " " + AI.htmlClass.flexItem
                            };
                            style = {height: height};
                        }
                        function table () {
                            // this is actually the table immediate container
                            attr = {
                                "class": "corra-flex-item w3-card-4 " +
                                    AI.htmlClass.tableContainer + " w3-center"
                            };
                            style = {
                                // standard height of 80%, this makes room for action links.
                                height: "80%",
                                width: "100%",
                                overflow: "hidden"
                            };
                            // table caption goes here,
                            // so as to allow scrolling while header is in view.
                            innerHTML = args.caption;
                        }
                        function tableContainer () {
                            // this is actually the table's immediate container's container.
                            attr = {
                                "class": "w3-padding-tiny " + AI.htmlClass.flexRow
                            };
                            style = {
                                height: "100%",
                                overflow: "hidden"
                            };
                        }
                        function custom () {
                            attr = {
                                "class": "w3-padding-tiny " + AI.htmlClass.flexRow
                            };
                            if (args.container.padding) {
                                attr["class"] = "w3-padding-" + args.container.padding;
                            }
                        }
                        function classes () {                       
                            height = e.style.height || "auto",
                            width = StyleUtil.getWidthClass(manifest.Width),
                            padding = StyleUtil.getPaddingClass(args.padding),
                            alignment = StyleUtil.getAlignmentClass(args.alignment),
                            fontsize = StyleUtil.getFontSizeClass(args.fontsize);
                        }
                        function markup () {
                            return HTMLUtil.get({
                                tag: tag,
                                attr: attr,
                                style: style,
                                innerHTML: innerHTML
                            });
                        }

                        args = args || {};
                        var tag = "div", attr = {}, style = {}, innerHTML,
                            manifest = args.manifest,
                            dir = args.dir,
                            // the element to be contained.
                            // use this to determine container height/width.
                            e = args.e,
                            height, width, padding, alignment, fontsize,
                            types = {
                                content: content,
                                field: field,
                                hFieldContainer: hFieldContainer,
                                vFieldContainer: vFieldContainer,
                                group: group,
                                search: search,
                                table: table,
                                tableContainer: tableContainer,
                                custom: custom
                            };
                        if (e) {
                            classes();
                        }
                        if (args.container.type) {
                            types[args.container.type]();
                        }                     
                        return markup();
                    }               
                },            
                icon: {
                    initClass: "fa fa-",
                    /**
                     * 
                     * @param {String | Array} iclass
                     * @param {Object} o {suppClasses: Array, innerHTML: String}
                     * @param {Boolean} nopad
                     * @returns {getView.me.icon.get.fragment}
                    */
                    get: function (iclass, o, nopad) {
                        function properties (c) {
                            title = "";
                            switch (c) {                                
                                case "info":
                                    title = "Click to see more information";                       
                                    break;
                                case "refresh":
                                    title = "Click to refresh list";
                                    break;
                                case "info-circle":
                                    title = "Click to see summary";
                                    break;                                
                                case "plus":
                                    title = "Click to add a new record";
                                    break;
                                case "pencil":
                                    title = "Click to edit this record";
                                    break;    
                            }
                            active = !!(title);
                        }
                        o = o || {};
                        var that = this,
                            icons = [],
                            fragment = document.createDocumentFragment(),
                            arr, pad = "w3-padding-small", float, active, title;
                        if (typeof iclass === "string") {
                            icons = iclass.split(",");
                        } else if (Array.isArray(iclass)) {
                            icons = iclass;
                        }
                        if (icons.length > 0) {                            
                            float = "w3-float-right";
                        } else {
                            float = "";
                        }
                        // padding
                        pad = (nopad)? "": pad;
                        icons.forEach(function (c, i) {
                            c = c.trim();
                            properties(c);
                            var icon = HTMLUtil.get({
                                    tag: "i",
                                    attr: {
                                        "class": that.initClass + c + " " + pad + " " +
                                        ((active)? AI.htmlClass.infobarIcon: ""),
                                        title: title
                                    }
                                });                            
                            // supplementary classes
                            if (o.suppClasses) {
                                if (!Array.isArray(o.suppClasses)) {
                                    o.suppClasses = [o.suppClasses];
                                }
                                icon.className += " " + o.suppClasses.join(" ");
                            }
                            // innerHTML
                            if (o.innerHTML && (i + 1 === arr.length)) {
                                icon.innerHTML += " " + o.innerHTML;
                            }
                            fragment.appendChild(icon);
                        });         
                        return fragment;
                    }
                },
                table: {
                    emptyRow: function (tbl) {
                        var tbody = tbl.querySelector("tbody"),
                            tr = HTMLUtil.get({
                                tag: "tr",
                                attr: {
                                    "class": "w3-jumbo w3-border " + AI.htmlClass.emptyRow
                                }
                            }),
                            td = HTMLUtil.get({
                                tag: "td",  
                                attr: {
                                    "class": "w3-center",
                                    colspan: tbl.querySelectorAll("td").length
                                },
                                innerHTML: "Empty"
                            });
                        tr.appendChild(td);
                        tbody.appendChild(tr);                    
                    },
                    emptyTable: function (tbl) {
                        var tbodies = Array.from(tbl.tBodies());
                        tbodies.forEach(function (tbody) {
                            while (tbody.hasChildNodes()) {
                                tbody.removeChild(tbody);
                            }
                        });
                        this.emptyRow(tbl);
                    },
                    get: function (fields, manifest) {                
                    }
                },
                handyButton: {
                    get: function () {
                        var handies = Def.ModelMarkupHandyButton.Rows,
                            a = HTMLUtil.get({
                                tag: "a",
                                attr: {
                                    "class": "w3-btn-floating-large w3-xxlarge w3-animate-left w3-hover-white w3-card-16 w3-theme-deep-purple-action hvr-wobble-vertical " +
                                        AI.htmlClass.rightPaneLink + " " + AI.htmlClass.handyButton,
                                    href: "javascript:void(0)",                                
                                    tabindex: "-1"
                                },
                                style: {
                                    bottom: "0%",
                                    position: "fixed"
                                }
                            }),
                            fragment = document.createDocumentFragment();
                        handies.forEach(function (handy) {
                            var btn = a.cloneNode(true), icon = me.icon.get(handy.IconClass);
                            btn.appendChild(icon);
                            btn.title = handy.Description;
                            btn.accessKey = handy.Description;
                            btn.setAttribute("data-list", handy.PaneList || ""),
                            fragment.appendChild(btn);
                        });
                        return fragment;
                    }
                },
                dashboard: function () {                  
                    var menupage, fragment;
                    // append markup
                    if (!document.getElementById(AI.htmlId.menuPageContainer)) {
                        menupage = new MenuPage();
                        fragment = menupage.getMarkup();
                        document.getElementById(AI.htmlId.appContainer).appendChild(fragment);
                    }                
                },
                themes: {
                    getTheme: function (index) {
                        index = Misc.normalizeIndex(index, Def.ModelThemes.Rows.length - 1);
                        return Def.ModelThemes.Rows[index].Theme;
                    },
                    getGradient: function (index) {
                        return Def.ModelThemeGradients.Rows[index].Gradient;
                    },
                    /**
                     * @param {String} themeClass
                     * @param {String} gradient
                     * @returns {String}
                     */
                    getGradientClass: function (themeClass, gradient) {
                        return themeClass + "-" + gradient;
                    }
                },
                pane: function () {

                },
                styling: {
                    init: " w3-",
                    getPaddingClass: function (size) {
                        size = (size)? size: "small";
                        return this.init + "padding-" + size;
                    },
                    getAlignmentClass: function (side) {
                        side = (side)? side: "center";
                        return this.init + side;
                    },
                    getFontSizeClass: function (size) {
                        size = (size)? size: "medium";
                        return this.init + size;
                    },
                    getWidthClass: function (width) {
                        var respWidth = parseInt(width, 10), responsive = "";
                        if (respWidth > 0) {
                            responsive = " w3-col" + " l" + respWidth;
                        }
                        return responsive;
                    },
                    alphaColorArray: [
                        "#4e7496",
                        "#c69f59",
                        "#7f8f4e",
                        "#526525",
                        "#4b6113",
                        "#fdff63",
                        "#fffe40",
                        "#ff63e9",
                        "#af6f09",
                        "#9d0216",
                        "#fd798f",
                        "#ff7fa7",
                        "#8ab8fe",
                        "#befdb7",
                        "#c1fd95",
                        "#a5a391",
                        "#de0c62",
                        "#0485d1",
                        "#056eee",
                        "#343837",
                        "#3c4142",
                        "#c1f80a",
                        "#cf0234",
                        "#f7022a",
                        "#742802",
                        "#3d1c02"
                    ],
                    //Used to identify which background color to apply to a lookup row.
                    alphaArray: function () {
                        var str = "abcdefghijklmnopqrstuvwxyz",
                            arr = str.split("");
                        return arr;
                    },
                    undimApp: function () {
                        $("#" + AI.htmlId.appContainer).animate({opacity: "1"}, "fast");
                    },
                    dimApp: function () {
                        $("#" + AI.htmlId.appContainer).animate({opacity: "0.3"}, "fast");
                    }
                }
            };
        return me;
    })();
    //fun kids fiesta: 08092679297 aunty vanessa