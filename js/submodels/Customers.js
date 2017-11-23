function Customers (pageId) {
    this.pageId = pageId;
    this.pageName = Def.ModelPages[pageId].Name;//pageName;
    this.pryTableId = DefUtil.getPrimaryTableId(pageId);
    this.pryTableName = Def.ModelTables[this.pryTableId].Name;
    this.secTableIds = DefUtil.getSecondaryTableIds(pageId);
    this.settings = {
        eqos: false,
        hasLoyalty: false
    };
    this.pageAct = this.pageName.replace("Customers", "").toLocaleLowerCase();
};
Customers.prototype = {
    constructor: Customers,
    /**
     * @description Run initializations.
     * @description These functions are run to initialize the page's finer details.
     * @returns {Customers.prototype.init.SalesAnonym$0}
     */
    init: function (page) {               
        var that = this, inits = [];
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
        var pryTableName = this.pryTableName; 
        var act = {
                profile: function () {                   
                    var calc = {
                            Customers: {}                            
                        };
                    return calc;
                }
            };
        return act[this.pageAct]();
    },
    /**
     * 
     * @param {Object} page
     * @param {Boolean} ignoreWarnings
     * @returns {Boolean}
     */
    validatable: function (page) {
        var pryTableId = this.pryTableId,
            act = {
                profile: function () {
                    return {};
                }
            };
        return act[this.pageAct]();
    },            
    warnable: function (page) {
        // cash should not be more than a threshold,
        // otherwise it will attract Service charge.
        // nigerian banks charge a cash handling charge.
        var pryTableId = this.pryTableId;
        return {
            Customers: {
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
        var that = this;
        return {};                
    },
    command: function (page, cmdName){
        var act = {
                profile: {
                    Register: function () {
                        function printReceipt () {                 
                        }
                        var callbacks = [printReceipt];                    
                        try {
                            page.commitData(cmdName, false, callbacks);
                        } catch (err) {
                            console.log(err.stack);
                        }
                    },
                    Update: function () {
                        function printReceipt () {                 
                        }
                        var callbacks = [printReceipt];                    
                        try {
                            console.log("before committing");console.dir(page.data);
                            page.commitData(cmdName, false, callbacks);
                        } catch (err) {
                            console.log(err.stack);
                        }
                    },
                    Pend: function () {
                        try {
                            page.commitData(cmdName, true);
                        } catch (err) {
                            console.log(err.stack);
                        }
                    },
                    "Void": function () {

                    }
                }
            };
        alert(cmdName);
        return act[this.pageAct][cmdName]();
    },
    setting: {
        eqos: function () {

        },
        isCardPresent: function () {

        }
    },
    info: {

    },
    help: {

    },
    summary: {

    },
    promptFields: function (args, page) {
        var manifest = args.manifest, tableName = args.tableName;
        var prompt = {
                Customers: function () {
                    return [];
                }
            };
        alert("prompt fields: " + tableName + " @ pageId: " + page.pageId);
        return prompt[tableName]();
    },
    lookupCheck: function (args, page) {
        var tableName = args.tableName, manifest = args.manifest,
            rule = {
                Customers: {
                    CustomerId: function () {
                        // nothing to validate
                        return true;
                    },
                    LoyaltyId: function () {
                        var tKey = "LoyaltyCards",
                            cb = {
                                // this will re-run the onSelect function.
                                // this is the walk-around, 
                                // as there is no way to use blocking functions.
                                rerun: page.onFieldSelect
                            },
                            issueModal = function () {
                                var vars = {
                                        title: "Issue Loyalty Card",
                                        msgs: ["Your Store has a Loyalty Program, " +
                                            "but this Customer - " + manifest.CustomerName + 
                                            " - does not have a Loyalty Card yet."],
                                        gist: "Do you want to issue this customer " +
                                            "a Loyalty Card now?",
                                        options: [{
                                            opt: "Yes. Issue.",
                                            "default": true,
                                            callback: function () {
                                                var recall = function (values) {
                                                        // infer the new loyalty id.
                                                        args.manifest[tKey].LoyaltyId = values.LoyaltyId;
                                                        // rerun the field rules
                                                        // after user issues card.
                                                        cb.rerun(args.modal, args);
                                                    };
                                                HideUtil.modal();
                                                ModalUtil.wizard("LoyaltyIssue", recall);
                                            }
                                        }, {
                                            opt: "No. Don't issue.",
                                            callback: function () {
                                                HideUtil.modal();
                                                // use default loyalty id
                                                Model.state.loyalty.useDefault = true;
                                                cb.rerun(args.modal);
                                            }
                                        }]
                                    };
                                ModalUtil.dialog(vars);
                            };

                        // if client has a loyalty policy 
                        if (Def.ModelPageGroups.Loyalty.Active) {
                            // check that customer has been issued a loyalty card
                            // if not, prompt user to issue one.
                            if (Model.state.loyalty.useDefault) {
                                manifest[tKey].LoyaltyId = Def.ModelConstants.LoyaltyId.Value;
                            }                                    
                            if (!manifest.LoyaltyId) {
                                // show modal,
                                issueModal();
                                // meanwhile, return false so that contraint check fails.
                                // modal response will rerun constraint checks.
                                return false;                                     
                            } else {
                                return true;
                            }
                        } else {
                            return true;
                        }
                    },
                    LoyaltyStatus: function () {
                        if (Def.ModelPageGroups.Loyalty.Active && Model.state.useLoyalty) {
                            // check that customer has been issued a loyalty card
                            // if not, prompt user to issue one.    
                            if (manifest.LoyaltyId) {
                                if (manifest.LoyaltyStatus) {
                                    return true;
                                } else {
                                    // loyalty card must be active
                                    ViewUtil.feedback("This Loyalty Card is no longer active.", "warn");
                                    return false;
                                }
                            } else {
                                ViewUtil.feedback("Please issue a Loyalty Card to this customer.", "warn");
                                return false;
                            }
                        } else {
                            return true;
                        }                                  
                    },
                    CouponId: function () {
                        return true;
                    },
                    CouponNumber: function () {
                        return true;
                    },
                    GiftCardId: function () {
                        // check that gift card is active.
                        // check that gift card is funded.
                        return true;
                    },
                    ShopId: function () {
                        // check that shop is active.
                        return true;
                    }
                },
                CustomersFamily: {
                    IsSaleable: function () {
                        var ok = TypeUtil.toBln(manifest.IsSaleable);
                        if (!ok) {
                            ViewUtil.feedback.give({
                                msg: "This item is not for sale.",
                                type:"warn"
                            });
                        }
                        return ok;
                    },
                    LoneSale: function () {
                        var ok = TypeUtil.toBln(manifest.LoneSale);
                        if (!ok) {
                            ViewUtil.feedback.give({
                                msg: "This item cannot be sold on its own. It is part of a larger item", type: "warn"});
                        }
                        return ok;
                    }
                }
            };
        return rule[tableName];                
    },
    lookupCalc: function (args) {
        var tableName = args.tableName,
            calc = {
                Customers: function () {
                    return Promise.resolve(true);
                },
                CustomersFamily: function () {
                    function getPrice () {
                        function cb (rows) {             
                            var price,
                                qtyType = (args.promptData)?
                                    args.promptData.SalesCart.records[0].QtyType:
                                    "UNITS",
                                ppty = (qtyType === "UNITS")?
                                    "UnitSellPrice": "PackSellPrice",
                                manifest = args.manifest;
                            // extract appropriate price from returned record.
                            // query is ordered by entry date desc, so take 1st record.
                            if (rows.length > 0) {
                                price = SQLUtil.rows.getVal(rows[0], ppty);
                            } else {
                                // no records retrieved
                                // revert to reference price
                                price = SQLUtil.rows.getVal(manifest, ppty);
                            }                                    
                            args.destManifest.QtyType = qtyType;
                            args.destManifest.Price = price;
                        }
                        return Module.stock.getPrice(manifest, shopId, cb);
                    }
                    function getDiscount () {  
                        function cb (rows) {
                            var keys = SQLUtil.rows.getFieldsByTag(
                                "Discounts", myTableName);
                            /* fields with a discount tag are:
                                ActivityId
                                MajorScope
                                MinorScope
                                PercentOff
                                PromoBuyQty
                                PromoGetQty
                                PromoGetScope
                                PromoPercentOff
                                ScopeId*/
                            // extract singular/plural discount.
                            // they are mutually exlusive for each item.
                            if (rows.length > 0) {
                                keys.forEach(function (key) {
                                    args.destManifest[key] = SQLUtil.rows.getVal(
                                        rows[0], key);
                                });
                            }
                        }                            
                        return Module.stock.getDiscount(manifest, shopId, cb);
                    }
                    function getQty () {
                        args.destManifest.Qty = 1;
                    }                            
                    function getQtyType () {

                    }

                    var myTableName = "SalesCart",
                        manifest = args.manifest,
                        shopId = args.page.data.Customers.records[0].ShopId;
                    return new Promise(function (res, rej) {
                        getPrice()
                        .then(getDiscount())
                        .then(function () {
                            getQty();                                    
                            res(args.destManifest);
                        }).catch(function (err) {
                            Service.logError(err);
                        });
                    }); 
                }
            };
        return calc[tableName];            
    }
};