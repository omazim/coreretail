"use strict";
function startModule () {
    /**             
    * @param {Object} criteria
    * * @param {String} name description
    * @param {Function} cb
    * @returns {Promise}
    */
    function asyncGet (criteria, name, cb) {
        return new Promise(function (res, rej) {
            var qm = new QueryMaker(IDXB), da;
            criteria = qm.discretizeCriteria(criteria, name);
            qm.defReadQuery(name, criteria);   
            console.log("from async get: " + name);
            console.log(qm.qO);
            da = new DataAccess(qm.qO, CRDS, IDXB);
            da.access(true).then(function (records) {
                // if no callback, just return the data
                if (typeof cb === "function") {
                    cb(records);
                    res();
                } else {
                    res(records);
                }                
            }).catch(function (err) {
                Service.logError(err);
                console.log(err.stack);
            });
        });
    }
    
    var me = {
            accounts: {
                getAccountBalance: function (accId, subAccId, cb) {
                    var name = "AccountBalance",
                        criteria = {
                            AccountId: accId,
                            SubAccountId: subAccId                            
                        };
                    return asyncGet(criteria, name, cb);
                },
                getCustomerReceivablesBalance: function (subAccId, cb) {
                    var accId = Def.ModelConstants.CustomerCreditReceivables.Value;
                    return this.getAccountBalance(accId, subAccId, cb);
                },
                getLoyaltyPayablesBalance: function (subAccId, cb) {
                    var accId = Def.ModelConstants.LoyaltyPayables.Value;
                    return this.getAccountBalance(accId, subAccId, cb);
                },
                getGiftCardPayablesBalance: function (subAccId, cb) {
                    var accId = Def.ModelConstants.GiftCardPayables.Value;
                    return this.getAccountBalance(accId, subAccId, cb);
                },
                getAssetAccountBalance: function () {
                    
                },
                getLiabilityAccountBalance: function () {
                    
                }
            },
            /**
            * @constructor Biz
            * @description Handles every Def pertaining to Business Units for the Organization.
            * @description This is distinct from the application menu group called Business Units.
            * @description For the menu group, find its folder in corresponding M, V, or C folders.
            * @returns {modelclassL2.Shops}
            */
            biz: {},        
            client: {
                hasMenu: function (id) {
                    return TypeUtil.toBln(Def.ModelPageGroups[id].Active);
                }
            },
            /**
             * 
             * @description all functions relating to Customer manipulations.
             */
            coupons: {

            },
            customers: {
                /**
                 * 
                 * @param {type} records
                 * @returns {undefined}
                 */
                getCustomer: function (records) {
                    // when pulling up a customer, also pull up the following details:
                    // accounts receivable balance
                    // accounts payable balance (i.e gift cards, loyalty points)
                    // loyalty details
                    // loyalty point balance
                    // purchase history
                    //                     
                    var custId = records.CustomerId;                        
                    // for each data gotten,
                    // append it as a property to the main object pulled up by the query definition.
                    return new Promise(function (res, rej) {
                        me.accounts.getCustomerReceivablesBalance(custId)
                        .then(function (data) {
                            records.AccountBalance = data || 0;
                        })
                        .then(me.accounts.getLoyaltyPayablesBalance(custId))
                        .then(function (data) {
                            records.LoyaltyPointsBalance = data || 0;
                            records.LoyaltyPointsEquiv = me.loyalty.getPointsEquiv || 0;
                            res(records);
                        })
                        .catch(function (err) {
                            res(records);
                            console.log(err.stack);
                            Service.logError(err);
                        });
                    });
                }
            },
            loyalty: {
                issue: {
                    wizardArgs: {
                        title: Def.ModelPages.LoyaltyIssue.WizardTitle,
                        pageId: Def.ModelPages.LoyaltyIssue.Id
                    }
                },
                lookupCheck: function (record, checks) {
                    checks = checks || {};
                    var fields = this.tableFields,
                        fieldNames = Object.keys(checks),
                        passed = fieldNames.first(function (fieldName) {
                            var field = fields.first(function (f) {
                                    return(f.Name === fieldName);
                                }),
                                ok = (function () {
                                    var value = record[fieldName];
                                    if (field.DataType === "Boolean") {
                                        value = TypeUtil.toBln(value);
                                    }
                                    return(value === checks[fieldName]);
                                })();
                            if (!ok) {
                                console.log("cannot be selected " + fieldName);
                                console.dir(record);
                                ViewUtil.feedback.give({
                                    msg: field.ValidationMessage ||
                                        "Item cannot be selected because of some restriction(s).",
                                    type:"warn"
                                });
                            }
                            return !ok;
                        });
                    return !passed;
                }
            },
            shops: {
                /**
                * @description get shops based on user's assigned shops.
                * @param {String} userId
                * @param {Function} cb 
                * @returns {unresolved}
                */
                getShopsByUserId: function (userId, cb) {
                    function sql () {
                        var sql = "SELECT * FROM UserShops";
                        sql += " LEFT JOIN Shops ON UserShops.ShopId = Shops.ShopId";
                        sql += " WHERE UserShops.UserId = '" + userId.toUpperCase() + "';";
                        var da = new DataAccess(null, IDXB);
                        da.query(sql, cb);
                    }
                    function idb () {
                        var da = new DataAccess(qm.qO, CRDS, IDXB);
                        da.access(true).then(function (records) {
                            console.log(records.length + " records retrieved.");
                            console.log(records);
                            cb(records);
                        }).catch(function (err) {
                            console.log(err.stack);
                        });
                    }
                    var qm = new QueryMaker(IDXB),
                        qdefName = "UserShops",
                        criteria = [{
                            tableName: qdefName,
                            fieldName: "UserId",
                            value: userId
                        }],  
                        fn = (IDXB)? idb: sql;
                    // execute a read/select on the database.                
                    qm.defReadQuery(qdefName, criteria);
                    fn();
                }
            },
            stock: {
                tableFields: (function () {
                    return DefUtil.getTableFields("Stock");
                })(),
                getPrice: function (manifest, shopId, cb) {
                    return me.stock.getShopPrice(manifest, shopId, cb);
                },
                getDiscount: function (manifest, shopId, cb) {
                    return me.stock.getActiveDiscount(manifest, shopId, cb);                
                },
                /**
                 * @description Get the latest Shop price of an item.
                 * @description If ShopId is not passed, get base price from stock table.
                 * @description If there's no Shop price in stockactivity, return base price.
                 * @param {Object} manifest
                 * @param {String} shopId
                 * @param {Function} cb
                 * @returns {undefined}
                 */
                getShopPrice: function (manifest, shopId, cb) {
                    var name = "ShopPrice",
                        today = TypeUtil.toDate(null, "yyyy-mm-dd"),
                        barcode = manifest.Barcode,
                        bizId = manifest.BizId,
                        catId = manifest.CategoryId,
                        criteria = {
                            ActivityStart: today,
                            ActivityStop: today,
                            BizId: bizId,
                            ShopId: shopId,
                            UnitSellPrice: 0,
                            PackSellPrice: 0,
                            Barcode: barcode,
                            ParentBarcode: barcode,
                            CategoryId: catId,
                            MajorScope: "ALL"
                        };
                    return asyncGet(criteria, name, cb);
                },
                getRefPrice: function (barcode, bizId) {

                },
                /**
                 * 
                 * @param {Object} manifest
                 * @param {String} shopId
                 * @param {Function} cb
                 * @returns {Promise}
                 */
                getActiveDiscount: function (manifest, shopId, cb) {
                    var name = "StockDiscount",// name of sql definition
                        today = TypeUtil.toDate(null, "yyyy-mm-dd"),
                        barcode = manifest.Barcode,
                        bizId = manifest.BizId,
                        catId = manifest.CategoryId,
                        criteria = {
                            ActivityStop: today,
                            ActivityStart: today,
                            BizId: bizId,
                            ShopId: shopId,
                            PercentOff: 0,
                            PromoBuyQty: 0,
                            Barcode: barcode,
                            ParentBarcode: barcode,
                            CategoryId: catId,
                            MajorScope: "ALL"
                        };
                    return asyncGet(criteria, name, cb);
                },            
                /**
                 * 
                 * @param {type} manifest
                 * @param {type} shopId
                 * @param {type} X
                 * @param {type} from
                 * @param {type} to
                 * @returns {Promise}
                 */
                getQtyXd: function (manifest, shopId, X, from, to) {
                    function cb (recs) {
                        // loop thru the records and sum the qty property.
                        var qty = 0;
                        if (IDXB) {                        
                            recs.forEach(function (rec) {
                                qty += rec[ppty] || 0;
                            });
                        } else {
                            qty = SQLUtil.getVal(recs, ppty);
                        }
                    }
                    /* "SELECT DISTINCTROW Sum(SalesBatchCart.ItemQty) AS [Sold] " _
                    & "FROM (SalesBatchCart INNER JOIN SalesActivity " _
                    & "ON SalesBatchCart.ItemBarcode = SalesActivity.ItemBarcode) " _
                    & "INNER JOIN Sales ON SalesActivity.TranID = Sales.TranID " _
                    & "WHERE ;"*/               
                    /*(((SalesBatchCart.ItemBarcode)AND(SalesCart.Status)='CLOSED' AND(Sales.TranDate)<='' AND(Sales.TranDate)>='' AND (Sales.BizId) = '' AND ((Sales.ShopId)='' OR (ShopId) IsNotNull) AND((SalesBatchCart.BatchId)='' OR (SalesBatchCart.BatchId) IsNotNull)))*/
                    /*var j = {
    "and":[{
     "tableName":"SalesBatchCart",
    "fieldName":"Barcode",
    "values":[""],
    "andor":"0",
               "operators":["0"]
            }, {"fieldName":"Status",
                "tableName":"SalesCart",
                "values":["CLOSED"],
                "andor":"0",
                "operators":["0"]
            }, {"fieldName":"ValueDate",
                "tableName":"Sales",
                "values":[""],
                "andor":"0",
                "operators":["-2","2"]
            }, {"fieldName":"BizId",
                "tableName":"Sales",
                "values":[""],
                "andor":"0",
                "operators":["0"]
            }, {"tableName":"Sales",
                "fieldName":"ValueDate",
                "values":[""],
                "andor":"1",
                "operators":["-2","2"]
            }, {"fieldName":"ShopId",
                "tableName":"Sales",
                "values":[null,""],
                "andor":"0",
                "operators":["0","0"]
            }, {"fieldName":"BatchId",
                "tableName":"SalesBatchCart",
                "values":[null,""],
                "andor":"0",
                "operators":["0","0"]
            }]
        };*/                
                    var suffix = (X === 1)? "Sold": (X === 0)? "Exchanged": "Returned",
                        ppty = (X === 1)? "Qty": (X === 0)? "Qty": "ReturnQty",
                        name = "StockQty" + suffix,
                        criteria = {
                            Barcode: manifest.Barcode,
                            ValueDate: [from, to],
                            BizId: manifest.BizId,
                            ShopId: shopId
                        };
                    if (manifest.BatchId) {
                        name = "StockBatchQty" + suffix;
                        criteria.BatchId = manifest.BatchId;
                    }
                    return asyncGet(criteria, name, cb);
                },
                getQtySold: function (manifest, shopId, from, to) {
                    return this.getQtyXd(manifest, shopId, 1, from, to);
                },
                getQtyExchanged: function (manifest, shopId, from, to) {
                    return this.getQtyXd(manifest, shopId, cb, 0, from, to);
                },
                getQtyReturned: function (manifest, shopId, from, to) {
                    return this.getQtyXd(manifest, shopId, cb, -1, from, to);
                },
                getQtyMovedIn: function () {
                    return Promise.resolve(0);
                },
                getQtyMovedOut: function () {
                    return Promise.resolve(0);
                },
                getQtyUsed: function () {
                    return Promise.resolve(0);
                },
                /**
                 * 
                 * @param {type} manifest
                 * @param {type} shopId
                 * @param {type} from
                 * @param {type} to
                 * @returns {Promise}
                 */
                getStockBalance: function (manifest, shopId, from, to) {
                    var that = this;
                    // normalize optional args
                    if (!from) {from = Def.ModelConstants.BaseDate.Value;}
                    if (!to) {to = new Date().getTime();}
                    return new Promise(function (res, rej) {
                        var min, mout, used, sold, exch, rtnd;
                        that.getQtySold(manifest, shopId, 1, from, to).then(function (qty) {
                            sold = qty;
                            return that.getQtyExchanged(manifest, shopId, 1, from, to);
                        }).then(function (qty) {
                            exch = qty;
                            return that.getQtyReturned(manifest, shopId, 1, from, to);
                        }).then(function (qty) {
                            rtnd = qty;
                            return that.getQtyMovedIn(manifest, shopId, 1, from, to);
                        }).then(function (qty) {
                            min = qty;
                            return that.getQtyMovedOut(manifest, shopId, 1, from, to);
                        }).then(function (qty) {                        
                            mout = qty;
                            return that.getQtyUsed(manifest, shopId, 1, from, to);
                        }).then(function (qty) {
                            used = qty;
                            res(min + rtnd - mout - sold - exch - used);
                        }).catch(function (err) {
                            console.log(err.stack);
                        });
                    });
                },    
                calculable: function (page) {                                
                    var txnTableId = DefUtil.getTableIdByRole(page, "Transaction"),
                        txn = page.data[txnTableId].records[0],
                        nearest = txn.NearestApproximation || 0;
                    var calc = {
                            Stock: {
                                Balance: function (record) {
                                    var tenders = sumTenders(tenderTableId),
                                        bal = Number(tenders) - Number(record.TranTotal);           
                                    record.Balance = (bal < 0)? 0: bal;
                                }
                            }                     
                        };
                    return calc;
                },
                validatable: function (page) {
                    return {
                        Sales: {
                            // change must not exceed highest cash denomination.
                            Balance: function () {
                                return (page.data["Sales"].records[0].Balance <
                                    Def.ModelConstants.HighestDenomination.Value);
                            }
                        }
                    };
                },
                lookupCheck: function (record, checks) {
                    checks = checks || {};
                    var fields = this.tableFields,
                        fieldNames = Object.keys(checks),
                        passed = fieldNames.first(function (fieldName) {
                            var field = fields.first(function (f) {
                                    return(f.Name === fieldName);
                                }),
                                ok = (function () {
                                    var value = record[fieldName];
                                    if (field.DataType === "Boolean") {
                                        value = TypeUtil.toBln(value);
                                    }
                                    return(value === checks[fieldName]);
                                })();
                            if (!ok) {
                                console.log("cannot be selected " + fieldName);
                                console.dir(record);
                                ViewUtil.feedback.give({
                                    msg: field.ValidationMessage ||
                                        "Item cannot be selected because of some restriction(s).",
                                    type:"warn"
                                });
                            }
                            return !ok;
                        });
                    return !passed;
                }
            },
            stockCategories: {
                getCategoriesByBizId: function (id, cb) {
                    var sql = "SELECT * FROM Stockcategories";
                    sql += " WHERE BizId = '" + id.toUpperCase() + "';";
                    SQLUtil.exec(sql, cb);        
                }
            }        
        };    
    Module = me;
}
