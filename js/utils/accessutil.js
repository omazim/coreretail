var AccessUtil = (function () {
        var me = {
                login: function () {
                    var frm = doc.getElementById('frmLogin'),
                        strUserId = frm.elements['inpUserId'].value,
                        strUserPin = frm.elements['inpUserPin'].value,
                        dml = new DataAccess(),
                        sqlO = {
                            type: 2,// read
                            tables: [{
                                name: "Users",
                                action: 1,
                                lookup: 1                        
                            }],
                            where: {
                                and: [{
                                    UserId: {
                                        //tableName: "Users",
                                        values: [strUserId.toUpperCase()]
                                    }
                                }, {
                                    UserPin: {
                                        //tableName: "Users",
                                        values: [strUserPin]
                                    }
                                }]
                            }
                        },
                        fnLogin = function (rows) {
                            var feedback = "Sorry, your User Id & pin could not be verified.",
                                username;                    
                            try {
                                feedback = "Sorry, the User Id or Pin you entered is invalid.";
                                if (rows.length === 0) {
                                    ViewUtil.feedback.give({
                                        msg: feedback,
                                        type: "warn"
                                    });
                                } else {
                                    username = Module.sql.rows.getVal(rows[0], "UserName");              
                                    // clear inputs
                                    frm.reset();
                                    ViewUtil.flag.View(AI.htmlId.loginContainer, logout);
                                    HideUtil.login();
                                    ShowUtil.spanLogout();
                                    MarkupUtil.dashboard();
                                    ShowUtil.menuPage();       
                                    ViewUtil.feedback.give({
                                        msg: "Welcome, " + username.toProperCase()
                                    });
                                    // flag session particulars
                                    Module.fieldDef.autoValue("LocalMachine");
                                    // this assigns LocalMachine.
                                    Model.session.UserId = Module.sql.rows.getVal(rows[0], "UserId");
                                    Model.session.BizId = Module.sql.rows.getVal(rows[0], "BizId");
                                    Model.session.ShopId = Module.sql.rows.getVal(rows[0], "ShopId");
                                }                        
                            } catch (err) {
                                console.log(err.stack);
                                Service.logError(err);
                            }
                        };
                    dml.use(sqlO, fnLogin);
                    return false;
                },    
                /**
                 * @function logout
                 * @description Close application.
                 * @returns {undefined}
                 */
                logout: function logout () {       
                    //HideUtil.spanLogout();
                    //HideUtil.app();
                    ShowUtil.dashboard();
                    window.location.reload(true);
                    //doc.getElementById("inpUserId").focus();        
                }
            };
        return me;
    })();