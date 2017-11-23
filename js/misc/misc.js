var Misc = {
        normalizeIndex: function (index, max) {
            if (index > max) {
                while (index > max) {
                    index -= max;
                }
            }
            return index;
        },
        getAlpha: function (l) {
            var i = 0, rnd, alpha = "";
            while (i < l) {
                rnd = this.getRandom(3) % 26;
                alpha += this.alphas[rnd];
                i++;
            }
            return alpha;
        },
        alphas: (function () {
            return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        })(),
        strip: function (str, char) {
            return str.replace(char, "");
        },
        getDigitsFrom: function (str) {
            str = str.match(/\d/g);
            str = str.join("");
            return Number(str);
        },
        getRandom: function (l, stringy) {
            stringy = (stringy === undefined)? false: stringy;
            var rnd = String(Math.random()).substr(2, l);
            return (stringy)? String(rnd): Number(rnd);
        },
        getNearestApprox: function (dbl, nearest) {
            var fig, min;
            if (nearest === 0) {
                return dbl;
            } else if (nearest === 1) {
                return Math.ceil(dbl);
            }
            fig = Math.floor(dbl);
            min = fig - (fig % nearest);
            return ((fig % nearest) >= (nearest * 0.5))? Number(min) + Number(nearest): min;
        },
        getBaseConversion: function (nbasefrom, basefrom, baseto) {
            var SYMBOLS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            if (basefrom<=0 || basefrom>SYMBOLS.length || baseto<=0 || baseto>SYMBOLS.length) {
                console.log("Base unallowed");
                return null;
            }
            var i, nbaseten=0;
            if (basefrom!=10) {
                    var sizenbasefrom = nbasefrom.length;
                    for (i=0; i<sizenbasefrom; i++) {
                            var mul, mul_ok=-1;
                            for (mul=0; mul<SYMBOLS.length; mul++) {
                                    if (nbasefrom[i]==SYMBOLS[mul]) {
                                            mul_ok = 1;
                                            break;
                                    }
                            }
                            if (mul>=basefrom) {
                                    console.log("Symbol unallowed in basefrom");
                                    return null;
                            }
                            if (mul_ok==-1) {
                                    console.log("Symbol not found");
                                    return null;
                            }
                            var exp = (sizenbasefrom-i-1);	
                            if (exp==0) nbaseten += mul;
                            else nbaseten += mul*Math.pow(basefrom, exp);
                    }
            } else nbaseten = parseInt(nbasefrom);
            if (baseto!=10) { 
                    var nbaseto = [];
                    while (nbaseten>0) {
                            var mod = nbaseten%baseto;
                            if (mod<0 || mod>=SYMBOLS.length) {
                                    console.log("Out of bounds error");
                                    return null;
                            }
                            nbaseto.push(SYMBOLS[mod]);
                            nbaseten = parseInt(nbaseten/baseto);
                    }
                    return nbaseto.reverse().toString().replace(/,/g, '');
            } else {
                return nbaseten.toString();
            }
            return "0";
        },
        /**
         * 
         * @param {Mixed} v
         * @param {String} type
         * @returns {undefined}
         */
        tendToUndefined: function (v, type) {
            type = type || "";
            switch (type.toLocaleLowerCase()) {
                case "boolean":
                    return (v !== null && v !== "" && v !== undefined)? v: false;
                    break;
                case "string":
                    return (v !== null && v !== "" && v !== undefined)? v: "";
                    break;
                case "number":
                    return (v !== null && v !== "" && v !== undefined)? v: 0;
                    break;
                default:
                    return (v !== null && v !== "" && v !== undefined)? v: undefined;
            }
        }
    };