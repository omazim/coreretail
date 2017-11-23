var DataUtil = (function () {
    var me = {        
        /**
        * @param {String} table
        * @param {Array} data        
        * @param {Array} searchFields
        * @returns {undefined}
        */
        updateSearchTags: function (table, data, wildcardFields) {
            wildcardFields = wildcardFields || DefUtil.getTableFieldsOpt(table, {
                IsFullWildCard: true});
            //console.log("wildcardfields");console.log(wildcardFields);
            var searchTags = [], pattern = DefUtil.searchTagPattern;
            if (wildcardFields.length > 0) {            
                wildcardFields.forEach(function (field) {
                    var values = data[field.Name] || "", matches = [];
                    if (values) {
                        /* commented: 05 Oct 2017.
                         * reason: pattern.test omitted one of the mapped entries.
                         * e.g chijioke,okwunakwe...only chijioke was mapped.
                         * rectified by using .match instead
                         * values = values.split(" ").map(function (val) {
                            if (pattern.test(val)) {return val.trim();}
                        });
                        if (values.length > 0) {searchTags = searchTags.concat(values);}
                         */
                        //console.log("value to tag: " + values);
                        String(values).toLocaleLowerCase().split(" ").forEach(function (val) {
                            matches = matches.concat(val.match(pattern));
                        });                    
                        if (matches.length > 0) {searchTags = searchTags.concat(matches);}
                    }
                });           
                if (searchTags.length > 0) {
                // splice out undefineds
                searchTags.forEach(function (tag, i, arr) {
                    if (!tag) {arr.splice(i, 1);}
                });
                // remove duplicates
                searchTags = TypeUtil.uniqueStringy(searchTags);
                data.SearchTags = searchTags;
                //console.log("search tags for " + table + " = " + data.SearchTags);
            }
        }
        },
        zoo: function () {
            /*The btoa() method encodes a string in base-64.
             * This method uses the "A-Z", "a-z", "0-9", "+", "/" and "=" characters to encode.
             * Tip: Use the atob() method to decode a base-64 encoded string.*/
            var str = "1234", mult = 9, x;
            //var enc = window.btoa(window.btoa(window.btoa(str)));
            Array(5).fill(str).forEach(function (s) {
                mult *= s;        
            });
            var res = "Encoded String: " + window.btoa(mult);
            document.getElementById("demo").innerHTML = "The original string: " + mult + "<br>" + res;
        }
    };
    return me;
})();