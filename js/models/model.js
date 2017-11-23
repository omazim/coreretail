"use strict";
var Model = {
        state: {
            currPage: null, // Object,
            /*{in addition to its properties,
                view: {
                    tab:
                    field:
                }
            }*/
            activePages: [],// Array of Objects            
            const: {
                centralBizId: "00",
                centralShopId: "000"
            },            
            version: undefined,
            driveId: undefined
        },
        session: {
            UserId: "S00",
            BizId: "00",
            ShopId: "001",
            LocalMachine: "OMAZIM-LAPTOP"
        },
        pageModel: {}
    };