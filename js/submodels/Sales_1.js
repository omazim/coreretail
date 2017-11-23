function Sales (pageId) {
    this.pageId = pageId;
    this.pageName = Def.ModelPages[pageId].Name;//pageName;
    this.pryTableId = DefUtil.getPrimaryTableId(pageId);
    this.pryTableName = Def.ModelTables[this.pryTableId].Name;
    this.secTableIds = DefUtil.getSecondaryTableIds(pageId);
    this.settings = {
        eqos: false,
        hasLoyalty: false
    };
    this.pageAct = this.pageName.replace("Sales", "").toLocaleLowerCase();
};
Sales.prototype = {
    constructor: Sales,
    /**
     * @description Run initializations.
     * @description These functions are run to initialize the page's finer details.
     * @returns {Sales.prototype.init.SalesAnonym$0}
     */
    init: function (page) {       
        function fillUserShops () {
            var pryTableId = that.pryTableId,
                fieldId = DefUtil.getFieldIdByNameAndTable("ShopId", pryTableId),
                eId = HTMLUtil.getFieldId(fieldId, page.pageId),
                userId = Model.session.UserId,
                cb = function (rows) {
                    var select = document.getElementById(eId);
                    HTMLUtil.populate(select, rows, ["ShopId", "ShopName","ShopLocation"]);
                    page.writeRecord(pryTableId, {
                        ShopId: SQLUtil.rows.getVal(rows[0], "ShopId")
                    });
                };
            Module.shops.getShopsByUserId(userId, cb);
        }
        var that = this, inits = [fillUserShops];
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
        function getApplied (item) {
            function getAppliedPluralDiscount (item) {
                var applied,
                    discount,
                    price = item.Price,
                    qtyDiscounted;
                promocart.filter(function (value) {
                    return (value.Barcode === item.Barcode && !value.BEDelete);
                }).forEach(function (manifest) {                        
                    discount = manifest.PromoPercentOff;
                    qtyDiscounted = manifest.DiscountedQty;
                    applied += price * qtyDiscounted * (1 - (discount / 100));
                    applied = Misc.getNearestApprox(applied, nearest); 
                });
                return applied || 0;
            }
            function getAppliedSingularDiscount (item) {
                var discount = item.PercentOff || 0,
                    price = item.Price,
                    qtyBought = item.Qty,
                    qtyDiscounted = qtyBought - (item.ScopeDiscountedQty || 0),
                    applied;
                if (qtyDiscounted > 0) {
                    applied = (price * qtyDiscounted * (1 - (discount / 100)));
                    applied = Misc.getNearestApprox(applied, nearest); 
                }
                return applied || 0;
            }
            function getInstantDiscountFactor (item) {
                var discount = item.InstantPercentOff || 0;
                return 1 - (discount/100);                        
            }                                                
            var singular = getAppliedSingularDiscount(item),
                plural = getAppliedPluralDiscount(item),
                instant = getInstantDiscountFactor(item),
                applied = (singular + plural) * instant;
            applied = Misc.getNearestApprox(applied, nearest);
            genDiscounts.forEach(function (d) {
                applied *= d;                        
                applied = Misc.getNearestApprox(applied, nearest); 
            });
            return applied;
        }
        function sumTenders (tenderTableId) {
            var tenders = 0;
            page.data[tenderTableId].records.forEach(function (tender) {
                // remember to skip visually deleted records
                if (!tender.BEDelete) {
                    tenders += Number(tender.TenderAmount);
                }
            });
            return tenders;
        }
        
        var txnTableId = DefUtil.getTableIdByRole(page, "Transaction"),
            cartTableId = DefUtil.getTableIdByRole(page, "Shopping"),
            promoTableId = DefUtil.getTableIdByRole(page, "Promo"),
            tenderTableId = DefUtil.getTableIdByRole(page, "Tender"),
            txn = page.data[txnTableId].records[0],
            cart = page.data[cartTableId].records,
            promocart = page.data[promoTableId].records,
            tender = page.data[tenderTableId].records,
            genDiscounts = (function () {
                function factor (discount) {
                    return 1 - (discount/100);
                }
                var arr = [];
                // manager's discount
                arr.push(factor(txn.PercentOff || 0));
                // coupon discount
                //arr.push(getFactor(txn.PercentOff || 0));
                return  arr;
            })(),
            nearest = txn.NearestApproximation || 0,
            pryTableName = this.pryTableName; 
        var checkout = function () {                   
                var calc = {
                        Sales: {
                            tranVAT: 0,
                            tranSubTotal: 0,
                            tranStrictTotal: 0,
                            Balance: function (record) {
                                var tenders = sumTenders(tenderTableId),
                                    bal = Number(tenders) - Number(record.TranTotal);           
                                record.Balance = (bal < 0)? 0: bal;
                            },
                            AmountSaved: function (record) {
                                record.AmountSaved = record.TranStrictTotal - record.TranTotal;
                            },
                            TenderShortfall: function (record) {
                                var tenders = sumTenders(tenderTableId),
                                    bal = Number(tenders) - Number(record.TranTotal),
                                    shortfall = (bal < 0)? bal: 0;
                                record.TenderShortfall = Math.abs(shortfall);
                            },
                            TranSubTotal: function (record) {
                                record.TranSubTotal = this.tranSubTotal;
                            },
                            TranVAT: function (record) {
                                record.TranVAT = this.tranVAT;
                            },
                            TranTotal: function (record) {
                                record.TranTotal = Number(record.TranSubTotal) +
                                    Number(record.TranVAT);
                            },
                            TranStrictTotal: function (record) {
                                record.TranStrictTotal = this.tranStrictTotal;
                            },
                            TranPoints: function () {
                            },
                            TranId: function () {
                                // generate a unique transaction id
                            }
                        },
                        SalesCart: {
                            TotalPrice: function (record) {
                                try {
                                    record.TotalPrice = getApplied(record);
                                    // Sales...
                                    calc[pryTableName].tranSubTotal += Number(record.TotalPrice);  
                                    calc[pryTableName].tranVAT += Number(record.TotalPrice) *
                                        (Number(record.VAT)/100);
                                    // strict total
                                    calc[pryTableName].tranStrictTotal += Number(record.Price) *
                                        Number(record.Qty);
                                    calc[pryTableName].tranStrictTotal *= (1 +
                                        (Number(record.VAT)/100)); 
                                } catch (err) {
                                    console.log(err.stack);
                                    Service.logError(err);
                                }
                            },
                            VATPay: function (record) {
                                try {
                                    record.VATPay = record.TotalPrice *((record.VAT || 0) / 100);
                                } catch (err) {
                                    Service.logError(err);
                                }                                
                            }
                        },
                        ExchangeSales: this.Sales,
                        ExchangeSalesCart: this.SalesCart,
                        ReturnSales: {},
                        ReturnSalesCart: {},
                        SalesTenders: {},
                        PromoDiscountedCart: {},
                        SalesBatchCart: {},
                        SalesChargesCart: {},
                        SalesSerialCart: {}
                    };
                return calc;
            };
        var checkin = function () {                   
                var calc = {
                        Sales: {
                            tranVAT: 0,
                            tranSubTotal: 0,
                            tranStrictTotal: 0,
                            Balance: function (record) {
                                var tenders = sumTenders(tenderTableId),
                                    bal = Number(tenders) - Number(record.TranTotal);           
                                record.Balance = (bal < 0)? 0: bal;
                            },
                            AmountSaved: function (record) {
                                record.AmountSaved = record.TranStrictTotal - record.TranTotal;
                            },
                            TenderShortfall: function (record) {
                                var tenders = sumTenders(tenderTableId),
                                    bal = Number(tenders) - Number(record.TranTotal),
                                    shortfall = (bal < 0)? bal: 0;
                                record.TenderShortfall = Math.abs(shortfall);
                            },
                            TranSubTotal: function (record) {
                                record.TranSubTotal = this.tranSubTotal;
                            },
                            TranVAT: function (record) {
                                record.TranVAT = this.tranVAT;
                            },
                            TranTotal: function (record) {
                                record.TranTotal = Number(record.TranSubTotal) +
                                    Number(record.TranVAT);
                            },
                            TranStrictTotal: function (record) {
                                record.TranStrictTotal = this.tranStrictTotal;
                            },
                            TranPoints: function () {
                            },
                            TranId: function () {
                                // generate a unique transaction id
                            }
                        },
                        SalesCart: {
                            TotalPrice: function (record) {
                                try {
                                    record.TotalPrice = getApplied(record);
                                    // Sales...
                                    calc[pryTableName].tranSubTotal += Number(record.TotalPrice);  
                                    calc[pryTableName].tranVAT += Number(record.TotalPrice) *
                                        (Number(record.VAT)/100);
                                    // strict total
                                    calc[pryTableName].tranStrictTotal += Number(record.Price) *
                                        Number(record.Qty);
                                    calc[pryTableName].tranStrictTotal *= (1 +
                                        (Number(record.VAT)/100)); 
                                } catch (err) {
                                    console.log(err.stack);
                                    Service.logError(err);
                                }
                            },
                            VATPay: function (record) {
                                try {
                                    record.VATPay = record.TotalPrice *((record.VAT || 0) / 100);
                                } catch (err) {
                                    Service.logError(err);
                                }                                
                            }
                        },
                        ExchangeSales: this.Sales,
                        ExchangeSalesCart: this.SalesCart,
                        ReturnSales: {},
                        ReturnSalesCart: {},
                        SalesTenders: {},
                        PromoDiscountedCart: {},
                        SalesBatchCart: {},
                        SalesChargesCart: {},
                        SalesSerialCart: {}
                    };
                return calc;
            };
        var order = function () {                   
                var calc = {
                        Sales: {
                            tranVAT: 0,
                            tranSubTotal: 0,
                            tranStrictTotal: 0,
                            Balance: function (record) {
                                var tenders = sumTenders(tenderTableId),
                                    bal = Number(tenders) - Number(record.TranTotal);           
                                record.Balance = (bal < 0)? 0: bal;
                            },
                            AmountSaved: function (record) {
                                record.AmountSaved = record.TranStrictTotal - record.TranTotal;
                            },
                            TenderShortfall: function (record) {
                                var tenders = sumTenders(tenderTableId),
                                    bal = Number(tenders) - Number(record.TranTotal),
                                    shortfall = (bal < 0)? bal: 0;
                                record.TenderShortfall = Math.abs(shortfall);
                            },
                            TranSubTotal: function (record) {
                                record.TranSubTotal = this.tranSubTotal;
                            },
                            TranVAT: function (record) {
                                record.TranVAT = this.tranVAT;
                            },
                            TranTotal: function (record) {
                                record.TranTotal = Number(record.TranSubTotal) +
                                    Number(record.TranVAT);
                            },
                            TranStrictTotal: function (record) {
                                record.TranStrictTotal = this.tranStrictTotal;
                            },
                            TranPoints: function () {
                            },
                            TranId: function () {
                                // generate a unique transaction id
                            }
                        },
                        SalesCart: {
                            TotalPrice: function (record) {
                                try {
                                    record.TotalPrice = getApplied(record);
                                    // Sales...
                                    calc[pryTableName].tranSubTotal += Number(record.TotalPrice);  
                                    calc[pryTableName].tranVAT += Number(record.TotalPrice) *
                                        (Number(record.VAT)/100);
                                    // strict total
                                    calc[pryTableName].tranStrictTotal += Number(record.Price) *
                                        Number(record.Qty);
                                    calc[pryTableName].tranStrictTotal *= (1 +
                                        (Number(record.VAT)/100)); 
                                } catch (err) {
                                    console.log(err.stack);
                                    Service.logError(err);
                                }
                            },
                            VATPay: function (record) {
                                try {
                                    record.VATPay = record.TotalPrice *((record.VAT || 0) / 100);
                                } catch (err) {
                                    Service.logError(err);
                                }                                
                            }
                        },
                        ExchangeSales: this.Sales,
                        ExchangeSalesCart: this.SalesCart,
                        ReturnSales: {},
                        ReturnSalesCart: {},
                        SalesTenders: {},
                        PromoDiscountedCart: {},
                        SalesBatchCart: {},
                        SalesChargesCart: {},
                        SalesSerialCart: {}
                    };
                return calc;
            };
        var bid = function () {                   
                var calc = {
                        Sales: {
                            tranVAT: 0,
                            tranSubTotal: 0,
                            tranStrictTotal: 0,
                            Balance: function (record) {
                                var tenders = sumTenders(tenderTableId),
                                    bal = Number(tenders) - Number(record.TranTotal);           
                                record.Balance = (bal < 0)? 0: bal;
                            },
                            AmountSaved: function (record) {
                                record.AmountSaved = record.TranStrictTotal - record.TranTotal;
                            },
                            TenderShortfall: function (record) {
                                var tenders = sumTenders(tenderTableId),
                                    bal = Number(tenders) - Number(record.TranTotal),
                                    shortfall = (bal < 0)? bal: 0;
                                record.TenderShortfall = Math.abs(shortfall);
                            },
                            TranSubTotal: function (record) {
                                record.TranSubTotal = this.tranSubTotal;
                            },
                            TranVAT: function (record) {
                                record.TranVAT = this.tranVAT;
                            },
                            TranTotal: function (record) {
                                record.TranTotal = Number(record.TranSubTotal) +
                                    Number(record.TranVAT);
                            },
                            TranStrictTotal: function (record) {
                                record.TranStrictTotal = this.tranStrictTotal;
                            },
                            TranPoints: function () {
                            },
                            TranId: function () {
                                // generate a unique transaction id
                            }
                        },
                        SalesCart: {
                            TotalPrice: function (record) {
                                try {
                                    record.TotalPrice = getApplied(record);
                                    // Sales...
                                    calc[pryTableName].tranSubTotal += Number(record.TotalPrice);  
                                    calc[pryTableName].tranVAT += Number(record.TotalPrice) *
                                        (Number(record.VAT)/100);
                                    // strict total
                                    calc[pryTableName].tranStrictTotal += Number(record.Price) *
                                        Number(record.Qty);
                                    calc[pryTableName].tranStrictTotal *= (1 +
                                        (Number(record.VAT)/100)); 
                                } catch (err) {
                                    console.log(err.stack);
                                    Service.logError(err);
                                }
                            },
                            VATPay: function (record) {
                                try {
                                    record.VATPay = record.TotalPrice *((record.VAT || 0) / 100);
                                } catch (err) {
                                    Service.logError(err);
                                }                                
                            }
                        },
                        ExchangeSales: this.Sales,
                        ExchangeSalesCart: this.SalesCart,
                        ReturnSales: {},
                        ReturnSalesCart: {},
                        SalesTenders: {},
                        PromoDiscountedCart: {},
                        SalesBatchCart: {},
                        SalesChargesCart: {},
                        SalesSerialCart: {}
                    };
                return calc;
            };
        var act = {
                checkout: checkout,
                checkin: checkin,
                order: order,
                bid: bid
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
            data = page.data;
        var checkout = function () {
                return {
                    Sales: {
                        // change must not exceed highest cash denomination.
                        Balance: function () {
                            return (data[pryTableId].records[0].Balance <
                                Def.ModelConstants.HighestDenomination.Value);
                        },
                        // payments must be valid
                        //GiftTender: function () {
                            //if (!close) {return true;}
                            //return (page.data[pryTableId].records[0].TenderShortfall === 0);
                        //}
                        // tenders must equal or exceed cart total.
                        // shortfall must be zero
                        TenderShortfall: function () {
                            return (data[pryTableId].records[0].TenderShortfall === 0);
                        }
                    },
                    SalesCart: {},
                    SalesTenders: {
                        TenderName: function () {
                            data.SalesTenders.records.first(function (tender) {
                                switch (tender) {
                                    // CASH
                                    // CARD
                                    // CHEQUE
                                    // BITCOIN
                                    case "SHOP ACCOUNT":
                                        // customer must be billable, and not exceed debit limit.
                                        
                                        break;
                                    // PAYPAL
                                }
                            });
                            
                        }
                    },
                    ExchangeSales: this.Sales,
                    ExchangeSalesCart: this.SalesCart
                };
            };
        var act = {
                //checkout: checkout
            };
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
        var that = this;
        return {
            Sales: {
                CustomerId: function () {
                    // only loyalty discounts wil be affected.
                },
                ShopId: function () {
                    // changing shop id from a to b will erase shopping cart.
                    // items currently in cart may not be available in target shop.
                    // todo: in the future, erase only those items that do not belong
                    // to the same business group.
                    // check if there are items in the cart already before prompting.
                    var recs = that.secTableIds.first(function (tableId) {
                        //console.log(tableId + " recs: "+ page.data[tableId].records.length);
                        return (page.data[tableId].records.length > 0);
                    });
                    if (!recs) {
                        //console.log("no records yet!");
                        return;
                    }
                    ModalUtil.dialog({                       
                        type: "d",
                        title: "Change Checkout Shop?",
                        msgs: ["If you change the checkout Shop, items in the cart will deleted.", "You will have to add them again to the cart from the new Shop you selected."],
                        gist: "Are you sure you want to change the checkout Shop?",
                        options: [{
                            opt: "Yes. Change Shop.",                    
                            callback: function () {
                                page.init();// todo...clear cart(s).
                            }
                        }, {
                            opt: "No. Don't change.",
                            "default": true,
                            callback: HideUtil.modal
                        }]
                    });
                }
            }
        };                
    },
    command: function (page, cmdName){
        var checkout = {
                Checkout: function () {
                    function printReceipt () {
                        // print receipt
                        alert("print receipt");                    
                    }
                    var callbacks = [printReceipt];                    
                    try {
                        page.commitData(cmdName, false, callbacks);
                    } catch (err) {
                        console.log(err.stack);
                    }
                },
                Copy: function () {

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
            };
        var checkin = {
            
            };
        var order = {
            
            };
        var bid = {
            
            };
        var act = {
                checkout: checkout,
                checkin: checkin,
                order: order,
                bid: bid
            };
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
                Sales: function () {
                    // nothing to prompt.
                    return [];
                },
                SalesCart: function () {
                    // prompt qty type (UNITS or PACK) if there is a pack price.   
                    // otherwise use units as default.
                    var tableId = args.tableId,
                        exemptions = [],
                        packprice = Number(SQLUtil.rows.getVal(manifest,
                            "PackSellPrice"));
                    if (packprice <= 0) {
                        exemptions.push("QtyType");
                    }
                    // we already know the barcode!
                    exemptions.push("Barcode");
                    return DefUtil.getIngressFields(tableId,
                        page.data[tableId].fields, exemptions);
                },
                ExchangeSales: function () {
                    return this.Sales();
                },
                ExchangeSalesCart: function () {
                    return this.SalesCart();
                }
            };
        return prompt[tableName]();
    },
    lookupCheck: function (args, page) {
        var tableName = args.tableName,
            manifest = args.manifest,
            check = {
                // these checks must be passed before an item is selected from the lookup list.
                Sales: function () {
                    var checks = {
                            CustomerId: function () {
                                // nothing to check
                                passes.push(true);
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
                                        // meanwhile, return false so that constraint check fails.
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
                        };
                    var trues = [], passes = [];
                    checks.forEach(function (check) {
                        passes.push(check());
                    });                    
                    return(passes.length === Object.keys(checks));
                },
                SalesCart: function () {                    
                    var checks = {
                            IsSaleable: true,
                            LoneSale: true
                        };
                    return Module.stock.lookupCheck(manifest, checks);
                }
            };
        return check[tableName];        
    },
    lookupCalc: function (args) {
        var tableName = args.tableName,
            calc = {
                Sales: function () {
                    return Promise.resolve(true);
                },
                SalesCart: function () {
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
                        shopId = args.page.data.Sales.records[0].ShopId;
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
                },
                ExchangeSales: function () {
                    return this.Sales();
                },
                ExchangeSalesCart: function () {
                    return this.SalesCart();
                }
            };
        return calc[tableName];            
    }
};