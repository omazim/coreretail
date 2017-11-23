function MenuPage () {
    this.menus = Def.ModelPageGroups.Rows.sort(function (a, b) {
        return TypeUtil.sortObject(a, b, "Name");
    });
};
MenuPage.prototype = {
    constructor: MenuPage,
    getMarkup: function () {        
        var doc = document, rowLen = 1, menuLen = this.menus.length, fragment,
            pageContainer, content, rows, paginator, nav;
        //if (cachedFragments.menus) {return cachedFragments["menus"];}
        // not cached, markup afresh
        fragment = doc.createDocumentFragment();
        pageContainer = this.pageContainer();
        content = this.pageContent();       
        rows = this.getGrid();
        // menu paginator (only when menus are more than 16)
        rowLen = (parseInt((menuLen / 16).toFixed(0)) + 1);
        if (rowLen > 1) {
            paginator = this.menuPaginator(rowLen);
        } else {
            // horizontal bar
            paginator = doc.createElement("hr");
            paginator.style.width = "50%";
            paginator.style.marginLeft = "25%";
            paginator.style.marginRight = "25%";
        }        
        // special bottom nav buttons
        nav = this.specialNav();
        // append
        content.appendChild(rows);
        pageContainer.appendChild(content);
        pageContainer.appendChild(paginator);
        //pageContainer.appendChild(nav);        
        fragment.appendChild(pageContainer);
        this.menuList();this.submenuList();
        // cache it
        //cacheFragment("menus", fragment); 
        return fragment;
    },
    getGrid: function () {    
        var fragment = document.createDocumentFragment(),
            menus = this.menus,
            row, irow, that = this;                    
        // markup dynamic elements (rows, groups, wraps, containers & labels)
        menus.forEach(function (menu, i) {
            var group, wrap, cont, phrase, label;
            // markup a new row on every 4th menu button,
            // so there will be 4 buttons on a row.
            // Increment id suffix
            if (i % 4 === 0) {                    
                irow = parseInt((i / 4).toFixed(0));
                ++irow;
                row = that.menuRow(irow);                    
                //hide rows after the 4th row.
                if (irow > 4) {
                    row.style.display = "none";
                }
                fragment.appendChild(row);
            }
            // group
            group = that.menuGroup(menu, i);
            that.interlockGrid(group, irow, i);                                                
            wrap = that.menuWrap(menu);
            cont = that.menuContainer(menu);                
            label = that.menuLabel(menu.Alias);
            phrase = that.menuPhrase(menu.Description);
            cont.appendChild(label);
            cont.appendChild(phrase);
            wrap.appendChild(cont);
            group.appendChild(wrap);
            //console.log("appendto " + AI.htmlId.menuRow + irow);
            fragment.getElementById(AI.htmlId.menuRow + irow).appendChild(group);
        });
        return fragment;
    },
    applyGridColors: function (e, main) {
        var mainColor = "w3-theme-deep-purple-l2",
            altColor = "w3-theme-deep-purple-d1",
            color = (main)? mainColor: altColor;
        e.className += " " + color;
        e.setAttribute("data-color", " " + color);            
    },
    interlockGrid: function (group, irow, i) {
        // grid-like visuals
        var bln = (irow % 2 === 1)? !!(i % 2 === 0): !!(i % 2 === 1); 
        this.applyGridColors(group, bln);        
    },
    pageContainer: function () {
        return HTMLUtil.get({
            tag: "div",
            attr: {
                id: AI.htmlId.menuPageContainer,
                "class": "w3-row w3-padding-all-24"
            },
            style: {
                height: "90%"
            }
        });
    },
    menuList: function () {
        var ul = document.getElementById(AI.htmlId.submenuContainer),
            fragment = document.createDocumentFragment(),
            li = HTMLUtil.get({
                tag: "li",
                attr: {
                    "class": "w3-padding-large w3-light-grey w3-centered w3-large " +
                    AI.htmlClass.mListAccordion
                },
                style: {
                    cursor: "pointer"
                }
            }),
            i = MarkupUtil.icon.get("chevron-down",{suppClasses:["w3-float-right","w3-small"]});
        this.menus.forEach(function (menu, index) {
            var menuName = menu.Name,
                mlist = li.cloneNode(true),
                icon = i.cloneNode(true);
            mlist.id = HTMLUtil.getSMListContainerId(menuName);
            mlist.setAttribute("data-m", menuName);
            mlist.title = menu.Description;
            mlist.tabIndex = index;
            mlist.innerHTML = menuName + " ";
            mlist.appendChild(icon);
            fragment.appendChild(mlist);    
        });
        ul.appendChild(fragment);
    },    
    submenuList: function () {
        var ul = HTMLUtil.get({
                tag: "ul",
                attr: {
                    "class": "w3-medium w3-white w3-padding-0 " + AI.htmlClass.mList
                },
                style: {
                    height: "100%",
                    width: "100%",
                    overflow: "none",
                    "list-style-type": "none"
                }
            }),            
            li = HTMLUtil.get({
                tag: "li",
                attr: {
                    "class": "w3-padding-large w3-hover-theme-blue-grey " +
                        AI.htmlClass.smList                    
                },
                style: {
                    cursor: "pointer",
                    display: "none"
                }
            });
        this.menus.forEach(function (menu) {
            var menuName = menu.Name,
                mulist = ul.cloneNode(true),
                mlist = document.querySelector("#" + HTMLUtil.getSMListContainerId(menuName));
            DefUtil.getSubmenusArray(menuName).forEach(function (submenu, i) {
                var id = HTMLUtil.getSMListId(submenu.Id),                    
                    smlist = li.cloneNode(true);
                // if its already in the list (skip it)
                if ($("#" + id).length > 0) {return;}             
                smlist.id = id;
                smlist.setAttribute("data-m", menuName);
                smlist.setAttribute("data-sm", submenu.Id);
                smlist.title = submenu.Description;
                smlist.tabIndex = i + 1;
                smlist.innerHTML = submenu.Alias;
                mulist.appendChild(smlist);
            });
            mlist.appendChild(mulist);
        });        
    },
    pageContent: function () {
        return HTMLUtil.get({
            tag: "div",
            attr: {
                id: "divMenuContent",
                "class": "w3-row w3-white w3-animate-zoom"
            },
            style: {
                height: "80%"
            }
        });
    },
    menuRow: function (irow) {
        //console.log(AI.htmlId.menuRow + irow);
        return HTMLUtil.get({
            tag: "div",
            attr: {
                id: AI.htmlId.menuRow + irow,
                "class": "w3-row " + AI.htmlClass.menuRow
            },
            style: {
                height: "25%"
            }
        });
    },
    menuGroup: function (menu, i) {
        var n = menu.Name,
            mt = menu.Alias,
            d = menu.Description,
            id = HTMLUtil.getMenuButtonId(n);        
        return HTMLUtil.get({
            tag: "div",
            attr: {
                id: id,
                "class": "w3-col l3 w3-hover-border-green w3-border-green w3-card-8 w3-ripple "
                    + AI.htmlClass.menuButton,
                "data-m": n,
                "data-menutitle": mt,
                "data-description": d,
                tabIndex: ++i
            },
            style: {
                height: "100%",
                "border-width": "10px"
            }
        });
    },
    menuWrap: function (menu) {
        var tag = "div";
        return HTMLUtil.get({
            tag: tag,
            attr: {
                id: tag + menu.Name + "_wrp",
                "class": "w3-col w3-padding-small w3-center"
            },
            style: {
                height: "100%"
            }       
        });
    },
    menuContainer: function (menu) {
        var tag = "div";
        return HTMLUtil.get({
            tag: "div",
            attr: {
                id: tag + menu.Name + "_con",
                title: menu.Alias + " | Click to select a Sub Menu.",
                "class": "w3-col w3-padding-small hvr-wobble-to-bottom-right w3-center w3-small w3-heavy"
            },
            style: {
                height: "100%"
            }
            //innerHTML: menu.Alias
        });
    },    
    menuLabel: function (label) {
        return HTMLUtil.get({
            tag: "span",
            attr: {
                "class": "menu-name w3-large"
            },
            innerHTML: label
        });
    },
    menuPhrase: function (phrase) {
        return HTMLUtil.get({
            tag: "p",
            attr: {
                "class": "menu-name w3-small w3-normal"
            },
            innerHTML: phrase
        });
    },
    menuPaginator: function (max) {
        var div = HTMLUtil.get({
                tag: "div",
                attr: {
                    id: AI.htmlId.menuPaginator,
                    "class": "w3-center w3-theme-deep-purple-l5"
                },
                style: {
                    marginLeft: "40%",
                    marginRight: "40%"
                }
            }),
            ul = HTMLUtil.get({
                tag: "ul",
                attr: {
                    "class": "w3-pagination w3-large w3-bold w3-hover-purple"
                }
            }),
            li, a, i;
        for (i = 1; i <= max; i++) {
            li =  HTMLUtil.get({tag: "li"});
            a = HTMLUtil.get({
                tag: "a",
                attr: {
                    "class": AI.htmlClass.menuPageFlipper                        
                },
                innerHTML: i
            });
            li.appendChild(a);
            ul.appendChild(li);
        }
        div.appendChild(ul);
        return div;        
    },
    specialNav: function () {
        var tag = "div",
            navs = [{
                n: "Help ",
                i: "fa fa-question",
                t: "Have questions? Click here to get answers."
            }, {
                n: "Search ",
                i: "fa fa-search",
                t: "Search for anything, from inventory to delivery."
            }, {
                n: "My Subscriptions ",
                i: "fa fa-calendar-times-o",
                t: "Core Retail Services you are subscribed to."
            },/* {
                n: "Outlets ",
                i: "fa fa-building"
            }, {
                n: "Customers ",
                i: "fa fa-book"
            }, {
                n: "Inventory ",
                i: "fa fa-list-ol"
            }, */{
                n: "Bids ",
                i: "fa fa-sort-amount-desc",
                t: "Purchase Orders you can scramble for."
            }, {               
                n: "Logout ",
                i: "fa fa-sign-out",
                t: "Taking a break or closing for the day? Its okay. See you soon."
            }],
            container = HTMLUtil.get({
                tag: tag,
                attr: {
                    "class": "w3-row w3-padding-small w3-center"
                },
                style: {
                    height: "50%",//12%,
                    width: "100%",
                    "margin-left": "0"
                }
            }),
            sub = HTMLUtil.get({
                tag: tag,
                attr: {
                    "class": "w3-centered w3-padding-small"
                },
                style: {height: "100%"}
            });
        navs.forEach(function (nav) {
            var button = HTMLUtil.get({
                    tag: "button",
                    attr: {
                        id: "btn" + nav.n,
                        "class": "w3-btn w3-round w3-large w3-hover-white w3-theme-deep-purple-action corra-special-link" + ((nav.n === "Logout ")? " w3-float-right":""),
                        tabindex: "0",
                        title: nav.t
                    },
                    style: {
                        height: "100%"
                    },
                    innerHTML: nav.n
                }),
                i = HTMLUtil.get({
                    tag: "i",
                    attr: {
                        "class": nav.i
                    }
                });
            button.appendChild(i); 
            sub.appendChild(button);
        });
        container.appendChild(sub);
        var scroller = document.getElementById("divScroller");
        var footer = document.getElementById("divFooter");
        footer.insertBefore(container, scroller);
        return container;
        /* special navigations
<div class="w3-row w3-theme-deep-purple-action w3-card-8 w3-padding-all-4" style="height: 12%;">
    <div class="w3-left w3-padding-all-4">
        <button id="btnHelp" class="w3-btn w3-round w3-large w3-hover-teal w3-theme-deep-purple-l1 corra-special-link" tabindex="0">
            <i class="fa fa-question"></i> Help
        </button>
        <button id="btnManual" class="w3-btn w3-round w3-large w3-hover-teal
        w3-theme-deep-purple-l2 corra-special-link" tabindex="0">
            <i class="fa fa-book"></i> Manual
        </button>
        <button id="btnMyWeb" class="w3-btn w3-round w3-large w3-hover-teal
        w3-theme-deep-purple-l3 corra-special-link" tabindex="0">
            <i class="fa fa-globe"></i> My Website
        </button>
        <button id="btnMySub" class="w3-btn w3-round w3-large w3-hover-teal
        w3-theme-deep-purple-l4 corra-special-link" tabindex="0">
            <i class="fa fa-money"></i> My Storefront Subscription
        </button>
        <button id="btnOpenShop" class="w3-btn w3-round w3-large w3-hover-teal
        w3-theme-deep-purple-l5 corra-special-link" tabindex="0">
            <i class="fa fa-sign-in"></i> Open Shop
        </button>
        <button id="btnCloseShop" class="w3-btn w3-round w3-large w3-hover-teal
        w3-theme-deep-purple-d1 corra-special-link" tabindex="0">
            <i class="fa fa-sign-out"></i> Close Shop
        </button>
    </div>
    <div class="w3-right w3-padding-all-4"> 
        <button id="btnLogout" class="w3-btn w3-round w3-ripple w3-large corra-logout
        corra-special-link w3-hover-teal" tabindex="0">
            <i class="fa fa-sign-out"></i> Log out
        </button>
    </div>
</div>*/
    }
};