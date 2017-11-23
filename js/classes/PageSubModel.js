function PageSubModel (pageId, pageFns) {
    this.page = Def.ModelPages[pageId];
    this.pageId = pageId;
    this.pageName = this.page.Name;//pageName;
    this.pageGroupId = this.page.PageGroupId;
    this.pageGroupName = Def.ModelPageGroups[this.pageGroupId].Name;
    this.pryTableId = DefUtil.getPrimaryTableId(pageId);
    this.pryTableName = Def.ModelTables[this.pryTableId].Name;
    this.secTableIds = DefUtil.getSecondaryTableIds(pageId);
    this.settings = {
        eqos: false,
        hasLoyalty: false
    };
    this.pageAct = this.pageName.replace(this.pageGroupName, "").toLocaleLowerCase();
    this.pageFns = pageFns;
};
PageSubModel.prototype = {
    constructor: PageSubModel,
    /**
     * @description Run initializations.
     * @description These functions are run to initialize the page's finer details.
     * @returns {Sales.prototype.init.SalesAnonym$0}
     */
    init: function (page) {               
        var inits = this.pageFns.init(page);
        inits.forEach(function (init) {
            init();
        });        
    },
    /**
     * @description text
     * @param {Object} page
     * @returns {undefined}
     */
    calculable: function (page) {
        var act = this.pageFns.calculable(page);
        return act[this.pageAct]();
    },
    /**
     * 
     * @param {Object} page
     * @param {Boolean} ignoreWarnings
     * @returns {Boolean}
     */
    validatable: function (page) {
        var act = this.pageFns.validatable(page);
        return act[this.pageAct]();
    },            
    warnable: function (page) {
        // cash should not be more than a threshold,
        // otherwise it will attract Service charge.
        // nigerian banks charge a cash handling charge.
        var pryTableId = this.pryTableId;
        return {
            Sales: {
                CashTender: function (page) { 
                    var ppty = "LargeCash";
                    if (page.data[pryTableId].CashTender >= Def.ModelConstants[ppty].Value) {
                        ViewUtil.feedback.push(
                            Def.ModelConstants[ppty].ValidationMessage ||
                            "Large Cash Handling!", "warn"
                        );
                    }
                }
            }
        };
    },
    changeable: function (page) {
        return this.pageFns.changeable(page);
    },
    command: function (page, cmdName){
        var act = this.pageFns.command(page);
        return act[this.pageAct][cmdName]();
    },
    setting: {
        
    },
    info: {

    },
    help: {

    },
    summary: {

    },
    promptFields: function (args, page) {
        var manifest = args.manifest, tableName = args.tableName;
        var prompt = this.pageFns.lookupPromptFields(page, manifest);
        return prompt[tableName]();
    },
    lookupCheck: function (args, page) {
        var tableName = args.tableName, manifest = args.manifest,
            rule = this.pageFns.lookupCheck(page, manifest);
        return rule[tableName];                
    },
    lookupCalc: function (args) {
        var tableName = args.tableName,
            calc = this.pageFns.lookupCalc();
        return calc[tableName];            
    }
};