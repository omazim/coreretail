"use strict";
function startControl () {    
    var doc = document;
    var events = (function () {
        /**
         * @function getDestTab
         * @param {type} forward
         * @returns {unresolved}
         */
        function getDestTab (forward) {
            function getDestIndex () {
                try {
                    while (tab.previousElementSibling) {            
                        index++;
                        tab = tab.previousElementSibling;
                    }
                    if (forward) {
                        return ((index + 1) >= len)? 0: index + 1;
                    } else {
                        return ((index - 1) < 0)? len - 1: index - 1;
                    }
                } catch (err) {
                    Service.logError(err);
                }
            }        
            
            var l = Model.state.activePages.length,
                // current tab
                tab = doc.getElementById(HTMLUtil.getMainTabId(Model.state.activePages[l - 1].tab, Model.state.currPage.pageId)),
                // current form
                form = doc.getElementById(Model.state.activePages[l - 1].id),
                arrTabs = form.querySelectorAll("." + AI.htmlClass.tabAnchor),
                len = arrTabs.length,
                index = 0,
                destIndex = getDestIndex();
            return (arrTabs[destIndex])? arrTabs[destIndex].getAttribute("data-content"):
                "Main";
        }
        function setHandlers () {
            (function keydown () {
                $(document).on("keydown", "body", function () {                    
                    function menuButtons () {
                        var i = Number(e.attr("tabindex")),
                            m = Def.ModelPageGroups.Rows.length;
                        switch (key) {
                            case 13://enter
                                ShowUtil.pageContainer(e, true);
                                break;
                            case 37://left key
                                if (i < m) {
                                    $("[tabindex='" + (--i) + "']").focus();
                                }
                                break;
                            case 38://up key
                                if (i > 4) {
                                    $("[tabindex='" + (i - 4) + "']").focus();
                                }
                                break;
                            case 39://right key
                                if (i < m) {
                                    $("[tabindex='" + (++i) + "']").focus();
                                }
                                break;
                            case 40://down key
                                if (i <= (m - 4)) {
                                    $("[tabindex='" + (i + 4) + "']").focus();
                                }
                                break;
                            }
                    }

                    var key = event.keyCode || event.which, e = $(event.target);
                    ViewUtil.feedback.clear();
                    
                    if (e.attr("id") === AI.htmlId.leftPaneOpener) {
                        if ($(".corra-animated-menu-bar-change").length > 0) {
                            HideUtil.leftPane();
                        } else {
                            ShowUtil.leftPane();
                        }
                    }
                    if (e.hasClass(AI.htmlClass.menuButton)) {           
                        menuButtons();
                    }                    
                    // ctrl + *
                    if (event.ctrlKey && !event.shiftKey && !event.altKey) {
                        // if modal is visible, do nothing.
                        if (ViewUtil.isVisible(AI.htmlId.modalContainer)) {
                            return;
                        }
                        switch (true) {
                            case (key === 9):// ctrl + tab                    
                                // forward on active form's tabs
                                if (Model.state.currPage) {
                                    if (ViewUtil.isVisible(Model.state.currPage.formId)) {
                                        ShowUtil.tab({
                                            forward: true
                                        });
                                    }
                                }
                                break;
                            case (key === 37):// ctrl + left arrow
                                // open right actions pane
                                ShowUtil.rightPane();     
                                break;
                            case (key === 38):// ctrl + up arrow
                                // open bottom actions pane
                                ShowUtil.bottomPane();     
                                break;
                            case (key === 39):// ctrl + right arrow
                                // open right sidenav pane
                                if (ViewUtil.isVisible(AI.htmlId.pageContainer)) {
                                    ShowUtil.leftPane();
                                }
                                break;
                            case (key === 36):// ctrl + home
                                /*if ($("#" + AI.htmlId.menuPage).length === 0) {
                                    returnToMenuPage();
                                }*/
                                break;
                            case (key >= 65 && key <= 90):
                                ViewUtil.rightPaneAction(key);
                                break;
                        }
                    } else if (event.ctrlKey && event.shiftKey && !event.altKey) {
                        // if modal is visible, do nothing.
                        if (ViewUtil.isVisible(AI.htmlId.modalContainer)) {return;}
                        switch (key) {
                        case 9: // tab backward
                            if (Model.state.currPage) {
                                //ShowUtil.tab(undefined, getDestTab(false));
                                if (ViewUtil.isVisible(Model.state.currPage.formId)) {
                                    ShowUtil.tab({
                                        forward: false
                                    });
                                }
                            }
                            break;
                        }
                    } else {                        
                        switch (key) {                            
                            case 13:// enter 
                                // show the target page
                                if (e.hasClass(AI.htmlClass.smList)) {
                                    ShowUtil.modelPage(event.target.getAttribute("data-sm"));
                                }
                                // select a row from a modal table
                                if (e.hasClass(AI.htmlClass.modalRow)) {
                                    ViewUtil.state.modal.callbacks[0]();
                                }
                                // right pane list
                                if (e.hasClass(AI.htmlClass.rightPaneList)) {
                                    Model.state.currPage.rightPaneAction(e);
                                    HideUtil.rightPane();
                                }                                
                                break; 
                            case 27:// escape  
                                // for modal table rows.
                                if (e.hasClass(AI.htmlClass.modalRow)) {
                                    ViewUtil.state.modal.callbacks[1](); 
                                    break;
                                }
                                // these prevent event from being handled more than once 
                                // these classes are also listeners, in addition to body.
                                /*if (e.hasClass(AI.htmlClass.smList)) { 
                                    break;
                                }
                                if (e.hasClass(AI.htmlClass.menuButton)) {
                                    alert("handler?");
                                    break;
                                }
                                // right pane list
                                if (e.hasClass(AI.htmlClass.rightPaneList)) {
                                    break;
                                }*/
                                HideUtil.view(event);
                                break;
                            case 33:// page up
                                if(ViewUtil.isVisible(AI.htmlId.menuPaginator)) {
                                    ShowUtil.menuRows(false);
                                }
                                break;
                            case 34:// page down
                                if(ViewUtil.isVisible(AI.htmlId.menuPaginator)) {
                                    ShowUtil.menuRows(true);
                                }
                                break;
                            case 38: // arrow up
                                // scroll lists or table rows.
                                if (e.prop("tagName") === "LI" || e.prop("tagName") === "TR") {
                                    CtrlUtil.tables.arrowScroll(e, false);
                                }
                                break;
                            case 40: // arrow down
                                // scroll lists or table rows.
                                if (e.prop("tagName") === "LI" || e.prop("tagName") === "TR") {
                                    CtrlUtil.tables.arrowScroll(e, true);
                                }                                
                                break;
                            default: // any other key
                                // modal
                                if (e.attr("id") === AI.htmlId.modalContentContainer ||
                                    e.hasClass(AI.htmlClass.modalOption)) {
                                    ModalUtil.keydown(event);
                                }
                            }
                    }
                });
            })();
            (function focus () {
                $(document).on("focus",
                "." + AI.htmlClass.menuButton + ", " +
                "." + AI.htmlClass.modalOption + ", " +
                ".corra-special-link, " +
                "#" + AI.htmlId.modalContentContainer + ", " +
                "#" + AI.htmlId.modalGist + ", " +
                "input, select, tr, li, dt, dd", function () {
                    var e = $(this);
                    if (e.prop("tagName") === "INPUT") {
                        StyleUtil.highlight(e);
                        //ViewUtil.cueMsg(e, true);
                    }
                    if (e.prop("tagName") === "SELECT") {
                        StyleUtil.highlight(e);
                    }
                    if (e.prop("tagName") === "TR") {
                        StyleUtil.highlight(e);
                        ViewUtil.flag.tableRow(e);
                    }
                    if (e.prop("tagName") === "LI" || e.prop("tagName") === "DT" ||
                    e.prop("tagName") === "DD") {
                        StyleUtil.highlight(e);
                    }
                    if (e.hasClass(AI.htmlClass.modalRow)) {
                        ViewUtil.flag.modalRow(e);
                    }                 
                    if (e.hasClass(AI.htmlClass.modalOption)) {
                        StyleUtil.border(e, true, "amber");
                    }
                    if (e.hasClass(AI.htmlClass.menuButton)) {
                        StyleUtil.highlightMenu(e);
                    }
                    if (e.hasClass("corra-special-link")) {
                        StyleUtil.toggleClass(e, "w3-white");
                    }
                    if (e.attr("id") === AI.htmlId.modalGist) {
                        StyleUtil.toggleClass(e, "w3-border-amber w3-border");
                    }
                    if (e.prop("tagName") === "BUTTON" &&
                    e.attr("id") === AI.htmlId.modalContentContainer) {
                        StyleUtil.toggleClass(e, "w3-theme-deep-purple-l1 w3-amber");
                    }
                });
            })();
            (function focusout () {
                $(document).on("focusout",
                "." + AI.htmlClass.menuButton + ", " +
                "." + AI.htmlClass.modalOption + ", " +
                ".corra-special-link, " +
                "input, tr, li, dt, dd, select", function () {
                    var e = $(this);                    
                    if (e.prop("tagName") === "TR" || e.prop("tagName") === "LI" ||
                    e.prop("tagName") === "DT" || e.prop("tagName") === "DD" ||
                    e.prop("tagName") === "INPUT" || e.prop("tagName") === "SELECT") {
                        if (e.prop("tagName") === "INPUT") {ViewUtil.cueMsg(e);}
                        StyleUtil.lowlight(e);
                    }
                    if(e.hasClass(AI.htmlClass.menuButton)) {
                        StyleUtil.lowlightMenu(e);                                
                    }
                    if (e.hasClass("corra-special-link")) {
                        StyleUtil.toggleClass(e, "w3-white");
                    }
                    if (e.hasClass(AI.htmlClass.modalOption)) {
                        StyleUtil.border(e, false, "amber");
                    }
                });
            })();
            (function contextmenu () {
                $(document).on("contextmenu", function () {
                    ViewUtil.feedback.give({
                        msg: "Active Element: " + doc.activeElement.id
                    });
                });
            })();
            (function change () {
                $(document).on("change", "input, select", CtrlUtil.fieldChangeHandler);
            })();
            (function click () {
                $(document).on("click",
                "#" + AI.htmlId.leftPaneOpener + ", " +
                "#" + AI.htmlId.menuPageReturner + ", " +                
                "#" + AI.htmlId.speechToText + ", " +
                "." + AI.htmlClass.menuPageFlipper + ", " +
                "." + AI.htmlClass.wizardNav + ", " +
                "." + AI.htmlClass.menuButton + ", " +
                "." + AI.htmlClass.mListAccordion + ", " +
                "." + AI.htmlClass.smList + ", " +
                "." + AI.htmlClass.mainTab + " ," +
                "." + AI.htmlClass.logoutButton + ", " +
                "." + AI.htmlClass.rightPaneLink + ", " +
                "." + AI.htmlClass.tableControl + ", " +
                "." + AI.htmlClass.modalRow + ", " +
                "." + AI.htmlClass.subTab + ", " +
                "." + AI.htmlClass.pageCloser + ", " +
                "." + AI.htmlClass.paneCloser + ", " +
                "." + AI.htmlClass.recordAdd + ", " +                
                "." + AI.htmlClass.rightPaneList + ", " +
                "." + AI.htmlClass.pageCommand + ", " + 
                "." + AI.htmlClass.infobarIcon + ", " + 
                ".w3-closebtn",        
                function () {
                    var e = $(this);                    
                    ViewUtil.feedback.clear();
                    if (e.attr("id") === AI.htmlId.leftPaneOpener) {
                        if ($(".corra-animated-menu-bar-change").length > 0) {
                            HideUtil.leftPane();
                        } else {
                            ShowUtil.leftPane();
                        }
                    }
                    if (e.attr("id") === AI.htmlId.menuPageReturner) {
                        ShowUtil.menuPage();   
                    }
                    if (e.attr("id") === AI.htmlId.speechToText) {
                        SpeechUtil.click();
                    }
                    if (e.hasClass(AI.htmlClass.menuPageFlipper)) {
                        ShowUtil.menuRows(e.text());
                    }
                    // wizard navigation
                    if (e.hasClass(AI.htmlClass.wizardNav)) {
                        ShowUtil.wizardField(e);
                    }
                    if (e.hasClass(AI.htmlClass.menuButton)) {
                        ShowUtil.pageContainer(e, true);
                    }
                    if (e.hasClass(AI.htmlClass.mListAccordion)) {
                        ShowUtil.menuAccordion(e);                        
                    }
                    if (e.hasClass(AI.htmlClass.smList)) {
                        ShowUtil.modelPage(e.attr("data-sm"));
                    }
                    if (e.hasClass(AI.htmlClass.mainTab)) {
                        ShowUtil.tab({
                            main: true,
                            event: event
                        });
                    }
                    if (e.hasClass(AI.htmlClass.logoutButton)) {
                        ModalUtil.logoutModal();
                    }
                    if (e.hasClass(AI.htmlClass.rightPaneLink)) {
                        ShowUtil.rightPane(e);    
                    }
                    if (e.hasClass(AI.htmlClass.tableControl)) {
                        CtrlUtil.tables.action(e);
                    }
                    if (e.hasClass(AI.htmlClass.modalRow)) {
                        ViewUtil.state.modal.callbacks[0]();
                    }
                    if (e.hasClass("w3-closebtn")) {
                        if (e.hasClass(AI.htmlClass.infobarCloser)) {
                            HideUtil.infobar();
                        } else {
                            ModalUtil.escape(event);
                        }
                    }
                    if (e.hasClass(AI.htmlClass.subTab)) {
                        CtrlUtil.tabs.open(e);
                    }
                    if (e.hasClass(AI.htmlClass.pageCloser)) {
                        HideUtil.view();   
                    }
                    // add new primary record
                    if (e.hasClass(AI.htmlClass.recordAdd)) {
                        if (Model.state.currPage) {
                            Model.state.currPage.init(true);
                        }   
                    }
                    if (e.hasClass(AI.htmlClass.paneCloser)) {
                        HideUtil.pane(e);                        
                    }
                    if (e.hasClass(AI.htmlClass.rightPaneList)) {
                        Model.state.currPage.rightPaneAction(e);
                        HideUtil.rightPane();
                    }
                    if (e.hasClass(AI.htmlClass.pageCommand)) {
                        Model.state.currPage.action(e);
                        //HideUtil.bottomPane();
                    }
                    if (e.hasClass(AI.htmlClass.infobarIcon)) {
                        ShowUtil.infobar(e);          
                    }
                });
            })();
            (function mouseenter () {                
                $(document).on("mouseenter",
                "#" + AI.htmlId.snackbar + ", " +
                "." + AI.htmlClass.infobarIcon,
                function () {
                    var e = $(this);
                    if (e.attr("id") === AI.htmlId.snackbar) {
                        ViewUtil.stopSnackbarHiding();
                    }
                    if (e.hasClass(AI.htmlClass.infobarIcon)) {
                        //ShowUtil.infobar(e);          
                    }
                });
            })();            
            (function mouseleave () {
                $(document).on("mouseleave",
                "#" + AI.htmlId.snackbar + ", " +
                "." + AI.htmlClass.infobarIcon,
                function () {
                    var e = $(this);
                    if (e.attr("id") === AI.htmlId.snackbar) {
                        //ViewUtil.startSnackbarHiding();                    
                        HideUtil.snackbar();
                    }                    
                    if (e.hasClass(AI.htmlClass.infobarIcon)) {
                        //HideUtil.infobar();          
                    }
                });                
            })();  
            (function scroll () {
                $(document).on("scroll", "." + AI.htmlClass.tableWrapper, function () {
                    if ($(this).hasClass(AI.htmlClass.tableWrapper)) {
                        ViewUtil.tableScroll($(this));
                    }
                });
                
                $(window).scroll(function() {
                    var top_of_element = $("#element").offset().top;
                    var bottom_of_element = $("#element").offset().top + $("#element").outerHeight();
                    var bottom_of_screen = $(window).scrollTop() + $(window).height();
                    var top_of_screen = $(window).scrollTop();

                    if((bottom_of_screen > top_of_element) && (top_of_screen < bottom_of_element)){
                        // The element is visible, do something
                    }
                    else {
                        // The element is not visible, do something else
                    }
                });
            })();                        
        }
        function resetHandlers () {
            try {
                unsetHandlers();
                setHandlers();
            } catch (err) {
                Service.logError(err);
            }
        }
        function unsetHandlers () {
            $(document).off("*");
        }
            
        return {
            init: resetHandlers
        };
    })();
       
    Control = {  
        events: events
    };
};