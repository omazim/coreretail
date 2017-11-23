var AI = {},
    Globlist = {
        files: {
            //polyfills: ["polyfill"],
            //classes: ["Fetcher","DataAccess","Modal","PageModel","MenuPage","PageMarkup"],
            //services: ["service"],
            //utils: ["util","typeutil","defutil","htmlutil","modutil","viewutil"],
            //misc: ["misc"]
            //models: ["idb","model","module"],
            //views: ["view"],
            //controllers: ["controller"]                    
        },
        filesErr: [],
        /*starters_: (function () {
            var p = "start",
                x = ["Module","Model","IDB","View","Control"];
            return x.map(function (x) {
                return p + x;
            });
        })(),*/
        starters: {
            fns: [Module,Model,IDB,View,Control],
            run: function () {
                try {
                    startModule();
                    startIDB();
                    startView();
                    startControl();
                } catch (err) {
                    console.log(err.stack);
                }
            }
        }
    },
    CRDS = "CR",
    IDXB = true,// this means this application will use indexed db as its database.
    Def = {},
    App = {},
    Module,  
    Model,
    View,
    Control,
    IDB,
    DefUtil,
    DefModels = "DefModels";
AI.htmlId = {
    appContainer: "divApp",
    actionBarContainer: "divActionBar",
    action_parent: "pActionParent",
    commandContainer: "ulCommands",
    dialogContainer: "divDialog",
    headerContainer: "divHeader",
    handyButtonsContainer: "divHandyLinks",
    lookupContainer: "divLookup",
    loginContainer: "divLogin",
    locationContainer: "divLocation",
    leftPaneContainer: "navLeftPane",
    leftPaneOpener: "spanLeftPaneOpener",      
    leftPaneCloser: "aLeftPaneCloser",

    modelContainer: "divModel",
    menuPageContainer: "divMenus",
    menuPaginator: "divMenuPaginator",
    menuRow: "divMenuRow",
    modalContainer: "divModal",
    modalContentContainer: "divModalContent",
    modalDialogContainer: "divModalDialog",
    modalLookupContainer: "divModalLookup",
    modalPromptContainer: "divModalPrompt",
    modalProgressContainer: "divModalProgress",
    modalWizardContainer: "divModalWizard",
    modalGistContainer: "divModalGist",
    modalMsgContainer: "divModalMsgContainer",            
    menuPageReturner: "pMenuPageReturner",
    dashboardReturnContainer: "dashboardReturnContainer",
    // modal, popup
    modalGist: "spanModalGist",

    feedbackContainer: "divFeedback",
    snackbar: "snackbar",
    infobar: "infobar",
    progressBar: "divProgressBar",
    pageContainer: "divPages",
    pageBanner: "divPageBanner",

    submenuContainer: "ulSubmenus",
    moreMenusContainer: "ulMoreMenusContainer",
    settingContainer: "ulSettings",
    shadowContainer: "ulShadows",
    summaryContainer: "ulSummary",
    // side nav
    spanLogout: "spanLogout",
    spanMenuName: "spanMenuName",
    spanMenuDescription: "spanMenuDescription",

    tabContainer: "ulTabs",    
    wizardFlex: "wizardFlex",
    wizardPrev: "wizardPrev",
    wizardNext: "wizardNext",
    wizardContainer: "divWizard",
    wizardContentContainer: "divWizardContent",
    wizardPromptContainer: "divModalPrompt",    
    wizardGistContainer: "divWizardGist",

    // handy buttons
    summaryLink: "lnkSummary",
    shadowLink: "lnkShadow",
    commandLink: "lnkCommand",
    helpLink: "lnkHelp",
    settingLink: "lnkSetting",
    closeLink: "lnkClose",
    // speech to text
    speechToText: "speechToText"
},
AI.htmlClass = {
    submenuForm: "corra-form",
    formContent: "corra-content",
    contentGroup: "corra-group",    
    fieldWrap: "corra-wrap",
    fieldContainer: "corra-container",
    fieldLabel: "corra-label",
    groupField: "corra-field",
    // menus & submenus
    smList: "corra-submenu-list",
    mList: "corra-menu-list",
    mListAccordion: "corra-menu-accordion",
    smListContainer: "corra-submenu-list-container",
    setListContainer: "corra-setting-list-container",    
    cmdListContainer: "corra-command-list-container",
    summaryListContainer: "corra-summary-list-container",
    shadowListContainer: "corra-shadow-list-container",            
    flexRow: "corra-flex-container-row",
    flexCol: "corra-flex-container-col",
    flexItem: "corra-flex-item",
    // right pane things
    rightPaneUl: "corra-right-pane-ul",
    rightPane: "corra-right-pane",   
    bottomPane: "corra-bottom-pane",   
    settingList: "corra-setting-list",
    pageCommand: "corra-page-command",
    summaryList: "corra-summary-list",
    shadowList: "corra-shadow-list",            
    rightPaneList: "corra-right-pane-list",
    handyButton: "corra-handy-button",
    rightPaneLink: "corra-right-pane-link",            
    logoutButton: "corra-logout",
    pageCloser: "corra-page-closer",
    recordSearch: "corra-record-search",
    recordAdd: "corra-record-add",
    paneCloser: "corra-pane-closer",
    menuName: "corra-menu-name",
    menuButton: "corra-menu-button",
    menuRow: "corra-menu-row",
    menuPageFlipper: "corra-menu-page-flipper",    
    menuIntro: "corra-menu-intro",
    // table elements
    emptyRow: "corra-empty-row",
    focusIngress: "corra-row-ingress",
    editRow: "corra-row-edit",
    delRow: "corra-row-del",
    focusRow: "corra-row-focus",
    sortRow: "corra-row-sort",
    tableControl: "corra-table-control",
    table: "corra-table",
    tableWrapper: "corra-table-wrapper",
    tableContainer: "corra-table-container",

    // popups
    popupText: "popuptext",
    popupContainer: "popup",
    infobarTop: "infobar-top",
    infobarBottom: "infobar-bottom",
    infobarRight: "infobar-right",
    infobarLeft: "infobar-left",
    infobarText: "infobar-text",
    infobarCaption: "infobar-caption",
    infobarCloser: "infobar-closer",
    // modal
    modalRow: "corra-modal-row",
    modalMsg: "corra-modal-msg",
    modalOption: "corra-modal-option",    
    wizardNav: "corra-wizard-nav",
    wizardFieldContainer: "corra-wizard-field-container",
    // themes
    theme: "w3-theme-deep-purple",
    // tabs
    maintabContainer: "corra-tab-container",
    tabAnchor: "corra-tab-anchor",
    firstMainTab: "corra-firstmain-tab",
    firstSubTab: "corra-firstsub-tab",
    mainTab: "corra-main-tab",
    subTab: "corra-sub-tab",
    // icons
    infobarIcon: "infobarIcon"    
};
AI.progress = {
    init: function () {
        AI.progress.move(1);
    },
    selector: "#" + AI.htmlId.progressBar,
    move: function (percent, cb) {        
        var e = $(this.selector);
            //text = (percent === 100)? "done":
            //    (percent > 0)? "working...": "";        
        cb = cb || function () {};
        if (e) {
            e.show("fast").animate({
                width: percent + "%"
            }, "fast", function () {
                //e.html(text);
                cb();
            });
        }
    },
    done: function (cb) {
        var that = this;
        function end () {
            $(that.selector).addClass("w3-green").removeClass("w3-orange");
            AI.pause(function () {
                $(that.selector).hide("fast").css("width", "0");
                if (typeof cb === "function") {cb();}
            });
        }
        AI.progress.move(100, end);
    }
};            
AI.pause = function (cb, len) {
    window.setTimeout(cb, len);
};