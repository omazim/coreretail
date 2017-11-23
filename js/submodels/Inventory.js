function Inventory (pageId) {
    this.pageId = pageId;
    this.pageName = Def.ModelPages[pageId].Name;//pageName;
    this.pryTableId = DefUtil.getPrimaryTableId(pageId);
    this.secTableIds = DefUtil.getSecondaryTableIds(pageId);
    this.settings = {};   
    this.pageAct = this.pageName.replace("Inventory", "").toLocaleLowerCase();
};
Inventory.prototype = {
    constructor: Inventory,
    /**
     * @description Run initializations.
     * @description These functions are run to initialize the page's finer details.
     * @returns {Stock.prototype.init.SalesAnonym$0}
     */
    init: function (page) {
        function fillCaptureCart () {
            // lookup any open restock captures
            // fill the capture cart with open captures
            // open captures are profile entries that have not yet been completed.
            
        }
        function move () {
            inits = [fillCaptureCart];
        }
        function restock () {
            inits = [fillCaptureCart];
        }
        function profile () {
            inits = [fillCaptureCart];
        }
        function batch () {
            inits = [fillCaptureCart];
        }
        var inits = [];
        switch (this.pageName) {
        case "InventoryMove":
            move();
            break;
        case "InventoryRestock":
            restock();
            break;
        case "InventoryProfile":
            profile();
            break;            
        case "InventoryBatch":
            batch();
            break;            
        }
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
        // declare object before returning it because it has references within its members.
        var act = {
                move: function () {
            
                },
                restock: function () {
                    return {
                        Restocks: {},
                        RestockCart: {
                            TotalPrice: function (record) {
                                try {
                                    record.TotalPrice = getApplied(record);
                                    // Stock...
                                    calc.Stock.tranSubTotal += Number(record.TotalPrice);  
                                    calc.Stock.tranVAT += Number(record.TotalPrice) *
                                        (Number(record.VAT)/100);
                                    // strict total
                                    calc.Stock.tranStrictTotal += Number(record.Price) *
                                        Number(record.Qty);
                                    calc.Stock.tranStrictTotal *= (1 +
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
                        StockMovesCart: {},
                        StockMoves: {},
                        StockBatchCart: {},
                        StockBatchers: {},
                        PromoDiscountedCart: {},
                        SalesBatchCart: {},
                        SalesChargesCart: {},
                        SalesSerialCart: {}
                    };
                },
                profile: function () {
                    return {
                        StockCapture: {
                            tableName: "StockCapture",
                            Balance: function (record) {
                                var tenders = sumTenders(tenderTableId),
                                    bal = Number(tenders) - Number(record.TranTotal);           
                                record.Balance = (bal < 0)? 0: bal;
                            }
                        }
                    };            
                },
                capture: function () {
                    return undefined;
                },
                batch: function () {
                    
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
            data = page.data,
            act = {
                move: function move () {
                    return {
                        Restock: {

                        },
                        RestockCart: {

                        }                
                    };
                },
                restock: function restock () {
                    return {
                        Restock: {

                        },
                        RestockCart: {

                        },            
                        StockCapture: {

                        },
                        RestockCosts: {}
                    };
                },
                profile: function () {
                    var o = {
                            Stock: {
                                // no item can be captured in ecntral biz unit.
                                tableName: "Stock",
                                records: data.Stock.records,
                                BizId: function () {
                                    return (this.records[0].BizId !==
                                        Def.ModelConstants.BizId.Value);
                                },
                                Balance: function () {
                                    var fieldName = "Balance",
                                        fieldId = DefUtil.getFieldIdFromTableFields(data.Stock.fields, fieldName),
                                        qty = data.Stock.records[0][fieldName],
                                        zero = Def.ModelFields[fieldId].AllowZero,
                                        neg = Def.ModelFields[fieldId].AllowNegative;
                                    if (qty === 0 && !zero) {return false;}
                                    if (qty < 0 && !neg) {return false;}
                                    return true;
                                },
                                Barcode: function () {
                                    console.dir(data);
                                    console.log("barcode: " + data.Stock.records[0].Barcode);
                                    return (this.records[0].Barcode);
                                },
                                CategoryId: function () {
                                    console.dir(this.records);
                                    console.log("cat id: " + this.records[0].CategoryId);
                                    return (this.records[0].CategoryId);
                                }
                            },
                            StockChildren: {
                                BizId: function () {
                                    return o.BizId("StockChildren");
                                },
                                CaptureQty: function () {
                                    return o.CaptureQty("StockChildren");
                                }
                            }
                        };
                    return o;
                },
                capture: function () {
                    return {
                        Stock: {
                            // no item can be captured in ecntral biz unit.
                            tableName: "Stock",
                            records: data[this.tableName].records,
                            BizId: function () {
                                return (this.records[0].BizId !== Def.ModelConstants.BizId.Value);
                            },
                            Balance: function (tableId) {
                                tableId = tableId || pryTableId;
                                var fieldName = "CaptureQty",
                                    fieldId = DefUtil.getFieldIdFromTableFields(data[tableId].fields,
                                        fieldName),
                                    qty = data[tableId].records[0][fieldName],
                                    zero = Def.ModelFields[fieldId].AllowZero,
                                    neg = Def.ModelFields[fieldId].AllowNegative;
                                if (qty === 0 && !zero) {return false;}
                                if (qty < 0 && !neg) {return false;}
                                return true;
                            },
                            Barcode: function () {
                                alert("barcode: " + this.records[0].Barcode);
                                return (this.records[0].Barcode);
                            },
                            CategoryId: function () {
                                return (this.records[0].CategoryId);
                            }
                        },
                        StockCapture: {

                        },
                        StockChildren: {
                            BizId: function () {
                                return v.BizId("StockChildren");
                            },
                            CaptureQty: function () {
                                return v.CaptureQty("StockChildren");
                            }
                        }
                    };
                },
                batch: function () {
                    return {
                        Stock: {
                            // non item can be captured in ecntral biz unit.
                            BizId: function (tableId) {
                                tableId = tableId || pryTableId;
                                return (data[tableId].records[0].BizId !==
                                    Def.ModelConstants.BizId.Value);
                            },
                            CaptureQty: function (tableId) {
                                tableId = tableId || pryTableId;
                                var fieldName = "CaptureQty",
                                    fieldId = DefUtil.getFieldIdFromTableFields(data[tableId].fields,
                                        fieldName),
                                    qty = data[tableId].records[0][fieldName],
                                    zero = Def.ModelFields[fieldId].AllowZero,
                                    neg = Def.ModelFields[fieldId].AllowNegative;
                                if (qty === 0 && !zero) {return false;}
                                if (qty < 0 && !neg) {return false;}
                                return true;
                            }
                        },
                        Restock: {

                        },
                        RestockCart: {

                        },            
                        StockCapture: {

                        },
                        StockChildren: {
                            BizId: function () {
                                return v.BizId("StockChildren");
                            },
                            CaptureQty: function () {
                                return v.CaptureQty("StockChildren");
                            }
                        },
                        RestockCosts: {},
                        StockBatchActivity: {},
                        StockActivity: {},
                        StockCategories: {},
                        StockCharges: {},
                        StockConstituents: {},
                        StockFixedPrices: {}           
                    };        
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
            Stock: {
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
            Stock: {
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
                        msgs: ["If you change the checkout Shop, items in the cart now will deleted.", "You will have to add them to the cart again from the new Shop."],
                        gist: "Are you sure you want to change the checkout  Shop?",
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
        var act = {
                move: {
                    Capture: function () {
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
                    "Void": function () {

                    }
                },
                restock: {
                    Capture: function () {
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
                    Pend: function () {
                        try {
                            page.commitData(cmdName, true);
                        } catch (err) {
                            console.log(err.stack);
                        }
                    },
                    "Void": function () {

                    }
                },
                profile: {
                    Update: function () {
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
                    Unshelf: function () {

                    }
                },
                batch: {
                    Capture: function () {
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
                    Pend: function () {
                        try {
                            page.commitData(cmdName, true);
                        } catch (err) {
                            console.log(err.stack);
                        }
                    },
                    "Void": function () {

                    }
                },
                capture: {
                    Capture: function () {
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
        return act[this.pageAct][cmdName]();
    },
    /*move: function () {
        Capture: function () {
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
        "Void": function () {

        }
    },*/
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
                Stock: function () {
                    // nothing to prompt.
                    return [];
                },
                RestockCart: function () {
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
                }
            };
        return prompt[tableName]();
    },
    lookupCheck: function (args) {
        function move () {
            var tableName = args.tableName, manifest = args.manifest,
                rule = {
                    Stock: {
                        HasChildren: function () {
                            var ok = manifest.HasChildren;
                            if (!ok) {
                                ViewUtil.feedback.give({
                                    msg: "Parent items cannot be moved! Parent items share their barcode across multiple items. You have to select one of its child items to move.",
                                    type:"warn"
                                });
                            }
                            return ok;
                        }
                    }
                };
            return rule[tableName];
        }
        function restock () {
            var tableName = args.tableName, manifest = args.manifest,
                rule = {
                    Stock: {
                        IsCompound: function () {
                            var ok = manifest.IsCompound;
                            if (!ok) {
                                ViewUtil.feedback.give({
                                    msg: "Compound items cannot be restocked! Compound items are made from other items. Only the constituent items can be restocked.",
                                    type:"warn"
                                });
                            }
                            return ok;
                        },
                        HasChildren: function () {
                            var ok = manifest.HasChildren;
                            if (!ok) {
                                ViewUtil.feedback.give({
                                    msg: "Parent items cannot be restocked! Parent items share their barcode across multiple items. You have to select one of its child item to restock.",
                                    type:"warn"
                                });
                            }
                            return ok;
                        }
                    }
                };
            return rule[tableName];
        }
        function profile () {
            return undefined;
        }
        var tableName = args.tableName, rule;
        switch (this.pageName) {
            case "InventoryMove":
                rule = move;
                break;
            case "InventoryRestock":
                rule = restock;
                break;
            case "InventoryProfile":
                rule = profile;
                break;            
        }
        return rule[tableName];
    },    
    lookupCalc: function (tableName) {
        var calc = {
                Stock: function (args) {  
                    // calculate current stock balance for the shops selected.
                    var manifest = args.manifest,
                        shopId = args.page.data.Stock.records[0].ShopId;
                    return new Promise(function (res, rej) {
                        Module.stock.getStockBalance(manifest, shopId)
                        .then(function (bal) {
                            args.destManifest.Balance = bal;
                            res(args.destManifest.Balance);
                        }).catch(function (err) {
                            Service.logError(err);
                        });
                    });                     
                }
            };
        return calc[tableName];            
    }
};
// stock profiling will now make use of a stockchildren table.
// this supplementary table will hold brief details of all items that share the same barcode
// with another.