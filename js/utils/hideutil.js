var HideUtil = (function () {
    var me = {
            menuPage: function () {
                var selector = "#" + AI.htmlId.menuPageContainer;
                //$(selector).animate({height: "0%"}, "slow");
                $(selector).slideUp("slow");
            },
            /**
             * 
             */
            model: function () {
                $("#" + AI.htmlId.modelContainer).hide("slow");
                me.pageBanner();
            },            
            /**
             * @param {HTMLEvent Object} event
             */
            view: function (event) {
                function cb (i) {
                    var index = 1;
                    try {
                        if (i === ViewUtil.state.activeViews.length) {
                            console.log("return");
                            return;
                        }
        //alert("latest view @ index " + i);
                        if (ViewUtil.state.activeViews[i].next) {                         
        //alert("just hidden index " + i);
        //alert("now show prev: " + ViewUtil.state.activeViews[i - 1].id + " @ index " + (i - 1));
                            ViewUtil.state.activeViews.pop();
                            // if there is no shower function defined for preceding view,
                            // pop and skip to its preceding view.
                            if (!ViewUtil.state.activeViews[i - index].shower) {
                                while (!ViewUtil.state.activeViews[i - index].shower || (i - index > -1)) {
        //alert("no shower: " + ViewUtil.state.activeViews[i - index].id + " @ index " + (i - index));
                                    ++index;
        //alert("show prev: " + ViewUtil.state.activeViews[i - index].id + " @ index " + (i - index));
                                    ViewUtil.state.activeViews.pop(); 
                                    if (typeof ViewUtil.state.activeViews[i - index].shower === "function") {
                                        //alert("has shower");
                                        break;
                                    }
                                } 
                                ViewUtil.state.activeViews[i - index].shower();
                            } else {
                                ViewUtil.state.activeViews[--i].shower(); 
                            }
                        } else {
                            ViewUtil.state.activeViews.pop();
                        }
                    } catch (err) {
                        console.log(err.stack);
                        Service.logError(err);

                    }
                }
                //alert(event.target.nodeName + ", id " + event.target.id + ", class " + event.target.className);                
                var l = ViewUtil.state.activeViews.length;
                console.log(l + " active views");
                if (l <= 0) {return;}
                --l;// this points index to last item.
                try {
                    if (ViewUtil.state.activeViews[l].hider.modal) {                        
                        ViewUtil.state.activeViews[l].hider.hider(l, cb);
                    } else {
                        ViewUtil.state.activeViews[l].hider.hider();
                        cb(l);
                    }
                } catch (err) {
                    console.log(err.stack);
                }
            },
            /**
            * @param {String} id
            * @param {Boolean} remove
            * @returns {undefined}
            */
            modelForm: function (id, remove) {
               //alert(Model.state.activePages.length + " active pages.");
                var child = document.getElementById(id),
                    l,
                    pageId = HTMLUtil.getPageIdFrom(id),
                    pageName = Def.ModelPages[pageId].Name;
                if (remove) {
                    if (child) {View.removeFragment(child.parentElement, child);}
                    Model.state.activePages.pop();
                    l = Model.state.activePages.length; 
                    if (l === 0) {// no more forms (pages) open.
                        Model.state.currPage = undefined;
                        me.model();
                        $("." + AI.htmlClass.menuIntro).show("fast");
                    } else {
                        Model.state.currPage = Model.state.activePages[--l];
                    }
                    // unload submenu
                    ModUtil.page.unload(pageName);
                    $("#" + AI.htmlId.actionBarContainer).find("." + AI.htmlClass.pageCommand).remove("." + pageId);
                } else {
                    $("#" + id).hide("slow");
                    $("#" + AI.htmlId.actionBarContainer).find("." + pageId).hide("slow");
                }
            },
            any: function (id) {    
                $("#" + id).hide(1250);
            },
            app: function () {
                $("#" + AI.htmlId.appContainer).hide(2500);
            },
            handyButtons: function () {
                var e = $("." + AI.htmlClass.handyButton); 
                e.show("slow").each(function (i) {
                    e.eq(i).animate({bottom: '0%'}, 750);
                    e.eq(i).hide("slow");
                });
                $("#" + AI.htmlId.handyButtonsContainer).hide("fast");
            },                        
            pageContainer: function () {                
                me.leftPane();
                $("#" + AI.htmlId.pageContainer).hide("slow");
            }, 
            leftPaneOpener: function () {
                $("#" + AI.htmlId.leftPaneOpener).hide("slow");
            },
            /**
             * @description Hide the side nav on any UI except the Menus & Submenus pages 
             * @returns {undefined}
             */
            leftPane: function () {
                $("#" + AI.htmlId.leftPaneContainer)
                    .animate({width: "0%"}, "fast")
                    .hide("fast");                
                $("#" + (AI.htmlId.pageContainer)).animate({marginLeft: "0%"});
                ShowUtil.leftPaneOpener();                
            },
            /**
             * @description Hide the side nav showing handy actions 
             * @returns {undefined}
             */
            rightPane: function (pane) {    
                pane = pane || $("." + AI.htmlClass.rightPane + ":visible");
                    /*.animate({width: "0%"}, "slow")
                    .hide("fast");*/
                pane.animate({width: "0%"}, "slow").hide("fast");
                $("#" + (AI.htmlId.pageContainer)).animate({marginRight: "0%"});
                $("." + AI.htmlClass.rightPaneLink).show("fast");
            },
            pane: function (e) {
                var pane = e.parent("nav");
                if (pane.hasClass(AI.htmlClass.rightPane)) {
                    this.rightPane(pane);
                } else if (pane.hasClass(AI.htmlClass.bottomPane)) {
                    this.bottomPane(pane);                    
                }                
            },
            bottomPane: function (pane) {
                pane = pane || $("." + AI.htmlClass.bottomPane + ":visible");
                pane.animate({height: "0%"}, "slow").hide("fast");
            },
            spanLogout: function () {
                $("#" + AI.htmlId.spanLogout).hide("slow");
            },
            pageList: function (id) {
                $("[data_m='" + id + "']").hide("slow");
            },
            pageBanner: function () {
                $("#" + AI.htmlId.pageBanner).hide("slow", function () {
                    $(this).find("span").html("");
                }).removeClass("w3-white");
                console.log("hide page banner");
            },
            login: function () {
                $("#" + AI.htmlId.loginContainer).hide(750);
            },
            tab: function (id) {
                $("#div" + id + "Content").hide("fast");
            },
            modal: function () {
                try {
                    $("#" + AI.htmlId.modalContainer).remove();
                    StyleUtil.undimApp();
                    ModalUtil.freezeApp(true);                    
                    ViewUtil.state.modalView = false;                    
                    ViewUtil.flagModalView();
                    CtrlUtil.focus.any(ViewUtil.state.focusId);
                    console.log("return focus to: " + ViewUtil.state.focusId);                    
                } catch (err) {
                    Service.logError(err.stack);
                }
            },
            /**
             * @param {HTMLElement Object} pop
             * @returns {undefined}
             */
            popup: function (pop) {       
                //pop.className = pop.className.replace("show", "");
                if (!pop.id) {
                    pop = document.getElementById(HTMLUtil.getPopupId(pop));
                }
                try {
                    document.getElementById(AI.htmlId.appContainer).removeChild(pop.parentElement);
                    //pop.parentElement.removeChild(pop);
                } catch (err) {
                    Service.logError(err.stack);
                }
            },
            pageList: function () {
                $("." + AI.htmlId.moreMenusContainer).hide("fast");        
                //$("#" + AI.htmlId.submenuContainer + " > li").hide("fast");
                $("#" + AI.htmlClass.smList).hide("fast");
            },
            /**
             * 
             * @param {Boolean} immediate
             * @returns {undefined}
             */
            snackbar: function (immediate) {
                var snackbar = $("#" + AI.htmlId.snackbar);
                // After 4 seconds, remove the show class from DIV
                try {
                    if (immediate) {
                        clearTimeout(ViewUtil.state.timeout.snackbar);
                        snackbar.fadeOut(0).html("");
                        //console.log("hide snackbar pronto");
                    } else {
                        ViewUtil.state.timeout.snackbar = setTimeout(function () {
                            snackbar.fadeOut(4000, function () {
                                snackbar.html("");
                                //console.log("hide snackbar slowly");
                            });                    
                        }, 4000);
                    }
                } catch (err) {
                    console.log(err.stack);
                }
            },
            infobar: function () {
                $("#" + AI.htmlId.infobar).hide("fast");                
            },
            stopHiding: function (e, name) {
                clearTimeout(ViewUtil.state.timeout[name]);
                e.clearQueue().stop().fadeIn("fast");
            },
            startHiding: function (name) {
                HideUtil[name]();
            }
        };
    return me;
})();        