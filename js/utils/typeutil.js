"use strict";
var TypeUtil = (function () {
        var me = {
            quoteString: {
                string: "'",
                number: "",
                boolean: ""
            },
            /**
            * @description Check the data type of any data and return it. 
            * This is intended to be used to generate SQLUtil criteria (so that the appropriate 
            * quotes can be used in case of a string).
            * @param {variant} value The data to be type-checked.
            * @returns {string} The data type.
            */
            get: function (value) {
                return typeof value;
            },
            getQuote: function (value) {
                if (!value) {return "";}
                var type = this.get(value).toLocaleLowerCase();
                return this.quoteString[type];
            },                
            /**
            * 
            * @param {Variant} data
            * @param {String} fieldId
            * @param {Boolean} forView format for display or for code?
            * @returns {Number|String}
            */
            getFormatted: function (data, fieldId, forView) {
                if (forView === undefined) {forView = true;}                
                var field = Def.ModelFields[fieldId],
                    type = field.DataType,
                    format = field.DataFormat,
                    fv, formatted;
                if ((data === undefined || data === null || data === "") &&
                    type !== "Boolean") {
                        return "";
                }                
                //uom = Def.ModelFields[fieldId].UOMSymbol || "";
                // data should be formatted if it is numeric or boolean.
                // string and dates are left as is
                if (type === "String") {
                    formatted = data || "";
                } else {
                    // exception for dates.
                    if (type === "Date" && data === "TODAY") {data = new Date();}
                    switch (format) {
                    case "Double":
                    case "Money":
                    case "Percent":
                        formatted = (forView)? this.toNum(data, 2): Number(data);
                        break;
                    case "Integer":
                        formatted = (forView)? this.toNum(data, 0): Number(data);
                        break;
                    case "String":// boolean
                    case "Boolean":// boolean
                        fv = (forView)? "yn": "tf";
                        formatted = this.toBln(data, fv);
                        break;
                    case "Original":// boolean
                        fv = (forView)? "od": "tf";
                        formatted = this.toBln(data, fv);
                        break;
                    case "Gender":// boolean
                        fv = (forView)? "mf": "tf";
                        formatted = this.toBln(data, fv);
                        break;
                    case "Date":
                        // on the browser, date must be displayed thus: yyyy-mm-dd.
                        fv = (forView)? "yyyy-mm-dd": "t";
                        formatted = this.toDate(data, fv);
                        break;
                    case "DayMonth":
                        formatted = this.toDate(data, "dd-mmm");
                        break;
                    case "DateTime":
                        fv = (forView)? "yyyy-mm-ddThh:mm:ss": "t";
                        formatted = this.toDate(data, fv);
                        break;
                    case "Day":
                        formatted = this.toDate(data, "d");
                        break;
                    case "Time":
                        formatted = this.toDate(data, "t");
                        break;
                    default:
                        formatted = data;
                    }
                }
                if (field.Name === "Billable") {
                    console.log(fieldId + " (Billable)=" + formatted + " for view?" + !!forView);
                    ;
                }
                return formatted;
            },
            getPrimitive: function (data, fieldId) {
                var type = Def.ModelFields[fieldId].DataType;
                switch (type) {
                case "Number":
                    if (isNaN(data) || data === undefined) {data = 0;}
                    return data.valueOf(Number(data));
                    break;
                case "String":
                    if (!data) {data = "";}
                    return data.valueOf(data);
                    break;
                case "Boolean":
                    if (!data) {data = "false";}
                    return data.valueOf(TypeUtil.toBln(data, "tf"));
                    break;
                case "Date":
                    if (!data) {data = new Date();}
                    return data.valueOf(data);
                    break;
                default:
                    if (!data) {data = "";}
                    return data.valueOf();
                }
            },
            getBln: function (format) {
                switch (format) {
                case "String":
                    return ["YES", "NO"];
                    break;
                //case "Boolean":
                //    return ["TRUE", "FALSE"];
                //    break;
                case "Original":
                    return ["ORIGINAL", "DUPLICATE"];
                    break;
                case "Gender":
                    return ["MALE", "FEMALE"];
                    break;
                default:
                    return ["YES", "NO"];
                }
            },
            /**
            * 
            * @param {Boolean} bln
            * @param {String} format
            * @param {Boolean} stringy Format as a string e.g True, as opposed to true.
            * @returns {Boolean}
            */
            toBln: function (data, format, stringy) {
                function f (b) {                                     
                    var bln;
                    switch (format) {
                    case "yn":
                        bln = (b)? "YES": "NO";
                        break;
                    case "tf":
                        if (stringy) {
                            bln = (b)? "TRUE": "FALSE";
                        } else {
                            bln = (b)? true: false;
                        }
                        break;
                    case "mf":
                        bln = (b)? "MALE": "FEMALE";
                        break;
                    case "od":
                        bln = (b)? "ORIGINAL": "DUPLICATE";
                        break;
                    case undefined:
                    case null:
                    case "":
                    default:
                        bln = (b)? true: false;
                    }
                    //console.log("post-format write bln: " + bln + " | format: " + format);
                    return bln;
                }
                //console.log("pre-format bln: " + data + " | format: " + format);
                data = (data)? data: "no";
                if (typeof data !== "boolean") {data = data.toLocaleLowerCase();}
                switch (data) {
                    case "yes":
                    case "true":
                    case "original":
                    case "male":
                    case true:
                        data = true;
                        break;
                    case "no":
                    case "false":
                    case "duplicate":
                    case "female":
                    case false:
                    case null:
                    case undefined:
                    case "":
                        data = false;
                }
                return f(data);
            },
            /**
            * @description As SQLite3 does not have the Boolean data type,
            * use this function 
            * to convert a 'True' or 'False' field value retrieved in a query to boolean 
            * data type. Booleans in this database are quoted strings.   
            * @param {variant} value
            * @returns {Boolean or variant}
            */
            bln: function (value) {        
                var checker;
                if (typeof value === "string") {
                    checker = value.toLocaleLowerCase();
                    value = (checker === "true" || checker === "yes")? true:
                        (checker === "false" || checker === "no")? false: value;  
                }
                return value;
            },
            /**
            * 
            * @param {Number} num
            * @param {Number} decimals
            * @param {String} uom unit of measurement?
            * @returns {Number|String}
            */
            toNum: function (num, decimals, uom) {
                /*alert((function toLocaleStringSupportsLocales() {
                        var number = 0;
                        try {
                          number.toLocaleString('i');
                        } catch (e) {
                          return e.name === 'RangeError';
                        }
                        return false;
                      })());*/
                decimals = decimals || 2;
                var dot = 0;                       
                num = Number(num || 0).toFixed(decimals);
                num = Number(num).toLocaleString();
                dot = num.indexOf(".");
                if (dot < 0) {
                    num += ".";                            
                } else {
                    decimals -= num.substr(++dot).length;
                    if (decimals < 0) {
                        return num;
                    }
                }
                Array(decimals).fill("0").forEach(function (zero) {
                    num += zero;
                });
                return num;
            },
            toDate: function (date, format) { 
                function formatDate () {
                    switch (format) {
                    // dates
                    case "yyyy-mm-dd":
                        return y + "-" + m + "-" + d;
                        break;
                    case "dd-mm-yyyy":
                        return d + "-" + m + "-" + y;
                        break;
                    case "dd-mmm-yyyy":
                        return d + "-" + mStr + "-" + y;
                        break;
                    case "ddd, dd-mmm-yyyy":                
                        return day + ", " + d + "-" + mStr + "-" + y;
                        break;
                    // datetimes
                    case "yyyy-mm-ddThh:mm:ss":
                        return y + "-" + m + "-" + d + "T" + h + ":" + min + ":" + s;
                        break;
                    case "yyyy-mm-ddThh:mm":
                        return y + "-" + m + "-" + d + "T" + h + ":" + min;
                        break;
                    case "dd-mm-yyyyThh:mm:ss":                        
                        return d + "-" + m + "-" + y + "T" + h + ":" + min + ":" + s;
                        break;
                    case "dd-mm-yyyy hh:mm":                
                        return d + "-" + m + "-" + y + " " + h + ":" + min;
                        break;
                    // times
                    case "hh:mm":
                        return h + ":" + min;
                        break;
                    case "hh:mm:ss":
                        return h + ":" + min + ":" + s;
                        break;
                    // daymonth
                    case "dd-mmm":// mostly birthdates                
                        return d + "-" + mStr;
                        break;
                    // others
                    case "d":
                        return day;
                        break;
                    case "t":
                        return t;
                        break;
                    default:
                        return y + "-" + m + "-" + d;// + "T" + getHrs() + ":" + getMin();    
                    }
                }

                date = (typeof date === "string")? Number(date): date;
                date = (date)? new Date(date): new Date();
                try {
                var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
                    day = days[date.getDay()],
                    h = (date.getHours() < 10)? '0' + date.getHours(): date.getHours(),
                    min = (date.getMinutes() < 10)? '0' + date.getMinutes(): date.getMinutes(),
                    s = (date.getSeconds() < 10)? '0' + date.getSeconds(): date.getSeconds(),
                    t = date.getTime(),
                    d = (date.getDate() < 10)? "0" + date.getDate(): date.getDate(),
                    months = [
                        {str: 'Jan', num:'01'},
                        {str: 'Feb', num:'02'},
                        {str: 'Mar', num: '03'},
                        {str: 'Apr', num: '04'},
                        {str: 'May', num: '05'},
                        {str: 'Jun', num: '06'},
                        {str: 'Jul', num: '07'},
                        {str: 'Aug', num: '08'},
                        {str: 'Sep', num: '09'},
                        {str: 'Oct', num: '10'},
                        {str: 'Nov', num: '11'},
                        {str: 'Dec', num: '12'}],
                    mStr = months[date.getMonth()].str,
                    m = months[date.getMonth()].num,
                    y = date.getFullYear();    
                return formatDate();
            } catch (err) {
                Service.logError(err);
            }
            },
            /**
            * @param {Object} a
            * @param {Object} b
            * @param {String} ppty Property of object
            * @param {Boolean} desc Descending order?
            * @returns {Number}
            */
            sortObject: function (a, b, ppty, desc) {
                if (!ppty) {return 1;}                
                desc = this.toBln(desc);
                var c = a[ppty], d = b[ppty];
                c = (typeof c === "string")? c.toLocaleLowerCase(): parseInt(c) || 0;
                d = (typeof d === "string")? d.toLocaleLowerCase(): parseInt(d) || 0;
                if (desc) {
                    return (c > d)? -1: (c < d)? 1: 0;
                } else {
                    return (c > d)? 1: (c < d)? -1: 0;
                }
            },
            uniqueStringy: function (arr) {
                if ("Set" in window) {
                    return Array.from(new Set(arr));
                } else {
                    return arr.filter(function(elem, index, self) {
                        return (self.indexOf(elem) === index);
                    });
                }
            }
        };
        return me;
    })();