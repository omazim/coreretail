var ShowUtil = (function () {
    var me = {
            menuPage: function (direct) {
                function cb () {
                    $("#" + AI.htmlId.menuPageContainer).slideDown("slow");
                }
                function doAfterShow () {
                    CtrlUtil.focus.menuButton();
                    Model.state.currPage = undefined;
                    HideUtil.pageBanner();
                }
                function jumpTo () {
                    while (ViewUtil.state.activeViews.length > 1) {                        
                        ViewUtil.state.activeViews.pop();
                        //console.log("views remaining: "+ ViewUtil.state.activeViews.length);
                    }
                    HideUtil.pageContainer();
                    HideUtil.leftPane();
                    ViewUtil.emptyModelContainer();
                    ViewUtil.emptyActionBar();
                    HideUtil.handyButtons();
                    // clear active pages
                    Model.state.activePages = [];
                }
                //console.log("active views on menu page show: " + ViewUtil.state.activeViews.length);
                if (direct) {
                    jumpTo();
                    doAfterShow();
                    return;
                }
                var shower = function () {
                        // after hiding page container.
                        $("#" + AI.htmlId.menuPageContainer).slideDown("slow");
                        doAfterShow();
                        HideUtil.leftPaneOpener();
                    },
                    hider = {
                        hider: function () {
                            // this happens to logout, when escape key is pressed.
                            //ModalUtil.logoutModal();
                        },
                        modal: true
                    };
                me.any(AI.htmlId.menuPageContainer, cb, shower, hider, true, false);        
                doAfterShow();
            },
            modelPage: function (pageId) { 
                // todo: resume: 31 july 2017.
                // before marking up, check that form is not already in active pages.
                function markup () {
                    var page = new PageMarkup(pageId);      
                    page.markup();
                }
                function isActivePage () {
                    //console.log("active pages");console.dir(Model.state.activePages);
                    Model.state.activePages.first(function (page, index) {
                        if (page.pageId === pageId) {                            
                            pageIndex = index;
                            formId = page.formId;
                            //alert(page.pageId + " = " + pageId + ". page index: " + index + ". form id: " + formId);
                        }
                    });
                }
                function getActiveViewIndex () {
                    return ViewUtil.state.activeViews.filter(function (view, index) {
                        try {
                            if (view.id === formId) {
                                viewIndex = index;
                                return true;
                            }
                        } catch (err) {
                            //alert("@ index: " + index + ". " + err.stack);
                            console.log(err.stack);
                        }
                    });
                }
                function reshuffle () {
                    myPage = Model.state.activePages[pageIndex];
                    Model.state.activePages.push(myPage);
                    Model.state.activePages.splice(pageIndex, 1);
                    // reshuffle the views too.                    
                    ViewUtil.state.activeViews.push(ViewUtil.state.activeViews[viewIndex]);
                    ViewUtil.state.activeViews.splice(viewIndex, 1);
                }
                var pageIndex, viewIndex, formId,
                    lastPageIndex = Model.state.activePages.length - 1,
                    pageName = Def.ModelPages[pageId].Name,
                    myPage, makecurrent;                
                isActivePage();
                if (pageIndex >= 0) {
                    getActiveViewIndex();
                    if (pageIndex === lastPageIndex) {
                        console.log("same as last: " + pageIndex + "==" + lastPageIndex);
                        HideUtil.leftPane();
                        return;
                    } else {
                        console.log("reshuffle pages");
                        reshuffle();
                        makecurrent = true;
                    }
                } else {
                    markup();
                    ModUtil.page.load(pageName);    
                }
                // views
                HideUtil.leftPane();
                me.any(AI.htmlId.modelContainer);
                me.modelForm(pageId, myPage, makecurrent);
            },
            pageBanner: function (str) {
                // change innerHTML to indicate menu/submenu/page is being viewed
                $("#" + AI.htmlId.pageBanner).show("slow", function () {
                    $(this).find("span").html(str);
                }).addClass("w3-white");
            },  
            /**
             * @param {String} id
             * @param {Object} page - optional
             * @param {Boolean} makecurrent - optional
             * @returns {undefined}
             */
            modelForm: function (pageId, page, makecurrent) {
                function getCurrFormId () {
                    if (Model.state.activePages.length === 0) {
                        return undefined;
                    } else {
                        //why is currpage undefined here?
                        //happens when you return to menu page using the menupage returner.
                        return(Model.state.currPage)? Model.state.currPage.formId: undefined;
                    }
                }
                //console.log("show model form: " + pageId);console.dir(page);
                var oldFormId = getCurrFormId(),
                    newFormId = HTMLUtil.getFormId(pageId),
                    pageAlias = Def.ModelPages[pageId].Alias,
                    pageGroupId = Def.ModelPages[pageId].PageGroupId,
                    pageGroupName = Def.ModelPageGroups[pageGroupId].Alias,
                    actionSelector = "span." + pageId,
                    show = function (makecurrent) {                        
                        me.any(newFormId);
                        me.pageBanner(pageGroupName + " - " + pageAlias);    
                        $("." + AI.htmlClass.menuIntro).hide("fast");
                        // make current page, if requested
                        if (makecurrent) {
                            Model.state.currPage = page;
                        }
                        // show action bar
                        $("#" + AI.htmlId.actionBarContainer).find(actionSelector).show("slow");
                    },
                    shower = function () {
                        show(); 
                    },
                    // to be called when closing a Form.
                    hider = {
                        hider: function (index, callback) {
                            ModalUtil.closePageModal(newFormId, index, callback);
                        },
                        modal: true
                    };
                //alert("old: " + oldFormId + ". new: " + newFormId);
                show(makecurrent);
                if (!makecurrent) {
                    ViewUtil.flag.view(newFormId, shower, hider, true);
                }
                me.tab({name: "Main", pageId: pageId});      
                me.handyButtons();
                // hide previous form.
                if (oldFormId) {
                    HideUtil.modelForm(oldFormId);
                }
                // flag data-pageid attribute to indicate current form.
            },
            /**
             * @param {String} id
             * @param {Function} callback
             * @param {Function} shower
             * @param {Function} hider
             * @param {Boolean} flag
             * @param {Boolean} next
             * @returns {undefined}
             */
            any: function (id, callback, shower, hider, flag, next) {
                if (callback) {
                    $( "#" + id).show("slow", callback);
                } else {
                    $( "#" + id).show("slow");
                }
                if (flag) {ViewUtil.flag.view(id, shower, hider, next);}                
            },
            app: function () {
                $("#" + AI.htmlId.appContainer).show("fast");
            },
            handyButtons: function () {
                var r = 0, offset = 10, e = $("." + AI.htmlClass.handyButton), l = e.length; 
                $("#" + AI.htmlId.handyButtonsContainer).show("fast", function () {
                    e.show("slow").each(function (i) {
                        var b = 15;
                        b = b + (offset * (l - 1 - i));            
                        e.eq(i).animate({right: r + '%', bottom: b + '%'}, 750);
                    });
                });
            },            
            menuRows: function (page) {        
                function show () {
                    var e = $("." + AI.htmlClass.menuRow);
                    $("." + AI.htmlClass.menuRow).hide("slow");
                    e.each(function (i) {
                        var id = e.eq(i).attr("id");
                        id = id.replace(AI.htmlId.menuRow, "");
                        if (id >= min && id <= max) {
                            e.eq(i).show("slow");                    
                        }
                    });
                }

                var currPage, min, max,id, mod, rows,flippers, l;
                if (typeof page === "boolean") {
                    rows = $("." + AI.htmlClass.menuRow + ":visible");
                    l = (rows.length < 0)? 1: rows.length;
                    id = rows.eq(l - 1).attr("id");
                    id = id.replace(AI.htmlId.menuRow, "");
                    mod = id % 4;
                    id = (id / 4).toFixed(0);
                    currPage = (id * mod) + 1;   
                    if (page) {// increment page number
                        if (currPage === $("." + AI.htmlClass.menuPageFlipper).length) {
                            page = currPage;
                            ViewUtil.feedback.give({
                                msg: "This is the last menu page!"
                            });
                            return;
                        } else {
                            page = ++currPage;
                        }
                    } else {// decrement
                        if (currPage > 1) {
                            page = --currPage;                    
                        } else {
                            page = currPage;
                            ViewUtil.feedback.give({
                                msg: "This is the first menu page!"
                            });
                            return;
                        }
                    }
                    flippers = $("." + AI.htmlClass.menuPageFlipper);
                    flippers.removeClass("w3-green");
                    flippers.eq(page - 1).addClass("w3-green");
                }
                min = (page * 4) - 3; max = page * 4;         
                show();        
            },
            pageContainer: function (e, dashboard) {                
                var m = e.attr("data-m"),
                    title = e.attr("data-menutitle"),
                    descr = e.attr("data-description"),
                    //smFragment = View.pageContainer.getSMList(m),
                    shower = function () {
                        me.any(AI.htmlId.pageContainer);                
                        me.any(AI.htmlId.spanMenuName); 
                        me.leftPane(false);
                        HideUtil.handyButtons();
                    },
                    hider = {
                        hider: HideUtil.pageContainer,
                        modal: false
                    };
                if (dashboard) {
                    Model.state.activePageGroup = m;
                    Model.state.activeMenuTitle = title;
                    Model.state.activeMenuDescription = descr;
                    //View.appendFragment(smFragment, AI.htmlId.submenuContainer);
                    HideUtil.menuPage();                                        
                    me.leftPaneOpener();
                    me.leftPane(false);   
                    View.setPaneTabIndex();
                    me.any(AI.htmlId.pageContainer, null, shower, hider, true, true);
                    document.getElementById(AI.htmlId.spanMenuName).innerHTML = Model.state.activeMenuTitle;
                } else {
                    me.pageList(m);// show submenu list.
                }
                document.getElementById(AI.htmlId.spanMenuDescription).innerHTML = 
                Model.state.activeMenuDescription;
                //if ($("." + AI.htmlClass.menuIntro).css("display") !== "block") {
                    $("." + AI.htmlClass.menuIntro).show("fast");
                //}
            },
            menuAccordion: function (e) {   
                function scroll () {                    
                    var parent = e.parent();
                    e.get(0).scrollIntoView();
                    parent.scrollTop = (e.offsetTop - 50);                    
                }
                function display () {
                    if (e.find("li").css("display") === "list-item") {
                        e.find("li").hide("fast");
                        e.find("li:first").focus();                        
                        e.find("i").toggleClass("fa-chevron-down fa-chevron-up");
                    } else {                        
                        e.siblings().find("li").hide("fast");                        
                        e.siblings().find("i.fa-chevron-up").toggleClass("fa-chevron-down fa-chevron-up");
                        e.find("li").show(750);
                        e.find("i").toggleClass("fa-chevron-down fa-chevron-up");
                    }
                }
                var m = (typeof e === "string")? e: e.attr("data-m"),
                    title = Def.ModelPageGroups[m].Alias,
                    descr = Def.ModelPageGroups[m].Description;
                e = (typeof e === "string")?
                    $("#" + AI.htmlId.submenuContainer + " > li[data-m=" + e + "]"): e; 
                display();
                scroll();
                document.getElementById(AI.htmlId.spanMenuName).innerHTML = title;
                document.getElementById(AI.htmlId.spanMenuDescription).innerHTML = descr;
                //console.log("accordion for: " + m + "| " + title + "| " + descr); 
            },
            leftPaneOpener: function () {
                $("#"+ AI.htmlId.leftPaneOpener).show("slow");
                $("#"+ AI.htmlId.leftPaneOpener).removeClass("corra-animated-menu-bar-change");
            },            
            /**
             * @description Show the side nav on any UI except the Menus & Submenus pages
             * @param {Boolean} flag
             * @returns {undefined}
             */
            leftPane: function (flag) {
                function cross () {
                    $("#"+ AI.htmlId.leftPaneOpener).addClass("corra-animated-menu-bar-change");
                }
                
                flag = (flag === undefined)? true: flag;
                var m = Model.state.activePageGroup,
                    paneId = AI.htmlId.leftPaneContainer,
                    pane = $("#" + paneId),
                    pageContainer = $("#" + AI.htmlId.pageContainer);                    
                pageContainer.animate({marginLeft: "25%"}, "fast");
                pane.show("fast").animate({
                    width: "25%",
                    display: "block"}, "slow");
                $("#" + AI.htmlId.smList + " [tabindex='1']").focus();
                // change to crossed bars.
                cross();
                me.pageList(m);// show page lists.

                // add to this.state.activeViews (if not already added).
                if (flag) {
                    ViewUtil.state.activeViews.push({
                        id: paneId,
                        shower: null,//this.leftPane,
                        hider: {
                            hider: HideUtil.leftPane,
                            modal: false
                        },
                        next: false
                    });
                }
            },                      
            /**
             * @description Show the side nav containing handy actions.
             * @param {JQuery Object} e
             * @returns {undefined}
             */
            rightPane: function (e) {        
                // caveat. open right pane only if a form is visible 
                if (!Model.state.currPage) {return;}

                var linkId, listId,
                    name,
                    pageId = Model.state.currPage.pageId,
                    links = $("." + AI.htmlClass.rightPaneLink),
                    paneId = HTMLUtil.getPaneId("Right", pageId),
                    ulSelector = "#" + paneId + " ." + AI.htmlClass.rightPaneUl;
                // no params, show the first ul in pane.
                if (e) {
                    linkId = e.attr("id");                    
                    name = HTMLUtil.getHandyButtonNameFrom(linkId);
                    listId = HTMLUtil.getPaneUlId(name, pageId);
                } else {
                    listId = $(ulSelector).eq(0).attr("id");
                    name = HTMLUtil.getHandyButtonNameFrom(listId);      
                    linkId = HTMLUtil.getHandyButtonId(name, "Right");
                }
                // hide target link, show others.
                $("#" + paneId)
                    .show("fast")
                    .animate({
                        width: "25%",
                        marginRight: "5%"
                    }, "fast");        
                links.not("#" + linkId).show("fast");
                $("#" + listId).show("slow");
                $(ulSelector).not("#" + listId).hide("fast");
                $("#" + linkId).hide("slow");
                // add to this.state.activeViews (if not already added).
                //if (!ViewUtil.flag.isViewFlagged(paneId)) {
                    ViewUtil.flag.view(paneId, null, {
                        hider: HideUtil.rightPane
                    }, false);
                //}
                // focus.
                $("#" + listId + " li:first").focus();
            },
            bottomPane: function (e) {        
                // caveat. open bottom pane only if a form is visible 
                if (!Model.state.currPage) {return;}
                var pageId = Model.state.currPage.pageId,
                    paneId = HTMLUtil.getPaneId("Bottom", pageId),
                    pane = $("#" + paneId);
                pane
                .show("fast")
                .animate({
                    height: "15%"
                }, "fast");        
                ViewUtil.flag.view(paneId, null, {
                    hider: HideUtil.bottomPane
                }, false);
                // focus.
                pane.find("." + AI.htmlClass.pageCommand + ":first").focus();
            },
            spanLogout: function () {
                $("#"+ AI.htmlId.spanLogout).show("slow");
            },
            pageList: function (m) {
                me.menuAccordion(m);
                //me.pageBanner(m);
                CtrlUtil.focus.submenu();
            },
            login: function (init) {
                if (init) {
                    $("#" + AI.htmlId.loginContainer).animate({
                        height: '85%'                
                    }, 100);
                } else {
                    Control.access.logout();
                }
            },
            /**
             * 
             * @param {Object} args
             * @returns {undefined}
             */
            tab: function (args) {
                function getDestId () {
                    var id, currId, e;
                    if (args.event) {// click
                        if (args.event.target.nodeName !== "LI") {
                            e = $(event.target);
                            id = e.parents("li").attr("id");
                        } else {
                            id = event.target.id;
                        }
                    } else if (args.name && args.pageId) {// click or init
                        id = HTMLUtil.getTabListId(args.name, args.pageId);
                    } else if (args.id) {// ctrl + tab
                        return args.id;
                    } else {// ctrl + tab
                        currId = Model.state.currPage.view.maintabId;
                        if (args.forward === true) {
                            if ($("#" + currId).next()) { 
                                id = $("#" + currId).next().attr("id");
                            }
                        } else if (args.forward === false) {
                            if ($("#" + currId).prev()) {
                                id = $("#" + currId).prev().attr("id");
                            }
                        }
                    }                    
                    return id;
                }
                try {
                    ;
                    var destTabId = getDestId(),
                        destTab, form, destContentId, contentClass;
                    if (!destTabId) {
                        throw " No destination!";
                        return;
                    }
                    destTab = $("#" + destTabId);
                    destContentId = destTab.attr("data-contentid");
                    contentClass = destTab.attr("data-contentclass");
                    form = destTab.parents("form");
                    // cue for dest tab
                    StyleUtil.cueContentTab(destTab); 
                    // show dest tab's content
                    form.find("#" + destContentId).show(50);
                    form.find("." + contentClass + ":not(#" +destContentId+ ")").hide(50);  
                    // flag current tab view
                    if (Model.state.currPage) {
                        ViewUtil.flag.pageTabView(Model.state.currPage);
                    }
                } catch (err) {
                    ViewUtil.feedback.give({
                        msg: "Please click beside the icon to switch tabs."
                    });
                }        
            },
            modal: function () {
                $("#" + AI.htmlId.modalContainer).fadeIn("fast");
                $("#" + AI.htmlId.modalContainer + " > .w3-modal-content").focus();
                StyleUtil.dimApp();
                ModalUtil.freezeApp(false);
                ViewUtil.state.modalView = true;
            },            
            /**
             * 
             * @param {String} id
             * @param {Number} index
             * @returns {undefined}
             */
            wizardField: function (e, index) {
                var a = (e)? e.find("a"): $("#" + AI.htmlId.wizardNext),
                    cIndex = ViewUtil.state.modal.wizardIndex,
                    wIndex = cIndex,
                    wLen = ViewUtil.state.modal.wizardLen,                    
                    wFlex = $("#" + AI.htmlId.wizardFlex),
                    hideSelector = "." + AI.htmlClass.wizardFieldContainer,
                    showSelector, showIndex;
                // field index to show
                index = index || (function () {                        
                    if (a.attr("id") === AI.htmlId.wizardPrev) {--wIndex;}
                    if (a.attr("id") === AI.htmlId.wizardNext) {++wIndex;}
                    if (wIndex < 0) {return 0;}
                    if (wIndex === wLen) {return wLen - 1;}                        
                    return wIndex;                
                })();
                ViewUtil.state.modal.wizardIndex = index;
                showIndex = (index >= 0)? ++index: wIndex;
                showSelector = "." + AI.htmlClass.wizardFieldContainer +
                    ":nth-child(" + showIndex + ")";                
                //console.log("id: " + a.attr("id") + " show index: " + showIndex);
                //console.log("hide "+ hideSelector);
                //console.log("show "+ showSelector);
                wFlex.children(hideSelector).hide("fast");
                wFlex.children(showSelector).show("fast");
            },
            /**
             * @param {HTML Element Object} e
             * @param {String} msg
             * @param {Boolean} focus
             * @returns {undefined}
             */
            popup: function (e, msg, focus) {
                function callback () {
                    try {
                        HideUtil.popup(pop);
                    } catch (err) {

                    }
                }

                var pop = document.getElementById(HTMLUtil.getPopupId(e.id));
                if (pop) {
                    //pop.innerHTML = msg;         
                } else {
                    //pop = popup(e, msg);
                    //pop.classList.toggle("show");
                    if (!focus) {
                        //AI.pause(callback, 3000);
                    }
                }
            },
            dashboard: function (row) {
                ViewUtil.flag.view(AI.htmlId.loginContainer);
                HideUtil.login();
                me.spanLogout();
                MarkupUtil.dashboard();
                me.menuPage();       
                ViewUtil.feedback.give({
                    msg: "Welcome, " + row.Username.toProperCase()
                });
                // flag session particulars
                DefUtil.autoValue("LocalMachine");
                // this assigns LocalMachine.
                //Model.session.UserId = row.UserId;
                //Model.session.BizId = row.BizId;
                //Model.session.ShopId = row.ShopId;
            },
            _moreMenus: function (id) {
                var link = $("#moreMenus"),
                    menus = $("#"+id),
                    curr = $("#" + AI.htmlId.submenuContainer);
                if (menus.css("display") ===  "block") {
                    curr.show("fast");
                    menus.hide("fast");                    
                    link.text("Show Other Menus");                    
                } else {                    
                    menus.show("fast");
                    curr.hide("fast");
                    menus.find("li:first").focus();
                    link.text("Hide Menus");                    
                }
            },
            feedback: function (e) {
                
            },
            snackbar: function (msg) {                
                // Get the snackbar DIV                
                var snackbar = $("#" + AI.htmlId.snackbar);
                // sometimes, the message might already be a markup. so just append it.      
                try {
                    if (snackbar) {
                        //console.log("snackbar msg " + typeof msg);
                        //console.dir(msg);
                        snackbar.html("");
                        ViewUtil.stopSnackbarHiding();
                        if (typeof msg === "object") {
                            snackbar.append(msg);
                        } else if (typeof msg === "string") {
                            snackbar.text(msg);
                        }
                        snackbar.show("fast");
                        setTimeout(function () {
                            StyleUtil.effect(snackbar, "shake");
                            HideUtil.snackbar(); 
                        }, 1000);                        
                    }
                } catch (err) {
                    console.log(err.stack);
                }
            },
            /**
             * 
             * @param {type} e
             * @returns {undefined}
             */
            infobar: function (e) {
                // determine the positioning of the parent
                // use this to know in which direction to display the infobar.
                var //parentPos = container.position(),
                    //bodyPos = $("body").position(),
                    //infobar = e.parent().siblings("." + AI.htmlClass.infobarText),
                    //infobarId = infobar.attr("id").replace("infobar_",""),
                    //pageId = currPage.pageId,
                    //fieldId = HTMLUtil.getFieldIdFrom(infobarId),
                    infobar = $("#" + AI.htmlId.infobar),     
                    fieldId = e.parent().attr("data-fieldid"),                    
                    tableId = Def.ModelFields[fieldId].TableId;
                ViewUtil.relatedInfo(tableId, fieldId); 
                setTimeout(function () {
                    infobar.show("slow");
                    StyleUtil.transfer(e, infobar);
                }, 500);
            }
        };
    return me;
})();