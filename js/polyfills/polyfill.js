"use strict";
// Arrays
(function () {
    /**
    * @description Polyfills and prototypes to allow for finding the first item in an array.
    * @description the iteration stops once the item is found, unlike array.filter.
    * @returns {undefined}
    */
    if (!Array.prototype.first) {
        Array.prototype.first = function(predicate, thisArg) {
            'use strict';
            var l = this.length;
            if (this === null) {
               throw new TypeError();
            }
            if (typeof predicate !== "function") {
                throw new TypeError();  
            }
            for (var i = 0; i < l; i++) { 
                if (predicate(this[i], i)) { 
                    return this[i]; 
                } 
            }       
            return null; 
        }; 
    }
  /*  if (!Array.prototype.filter)
        Array.prototype.filter = function(func, thisArg) {
          'use strict';
          if ( ! ((typeof func === 'Function') && this) )
              throw new TypeError();

          var len = this.length >>> 0,
              res = new Array(len), // preallocate array
              c = 0, i = -1;
          if (thisArg === undefined)
            while (++i !== len)
              // checks to see if the key was set
              if (i in this)
                if (func(t[i], i, t))
                  res[c++] = t[i];
          else
            while (++i !== len)
              // checks to see if the key was set
              if (i in this)
                if (func.call(thisArg, t[i], i, t))
                  res[c++] = t[i];

          res.length = c; // shrink down array to proper size
          return res;
        };
*/
    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    if (!Array.prototype.find) {
      Object.defineProperty(Array.prototype, 'find', {
        value: function(predicate) {
         // 1. Let O be ? ToObject(this value).
          if (this == null) {
            throw new TypeError('"this" is null or not defined');
          }

          var o = Object(this);

          // 2. Let len be ? ToLength(? Get(O, "length")).
          var len = o.length >>> 0;

          // 3. If IsCallable(predicate) is false, throw a TypeError exception.
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }

          // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
          var thisArg = arguments[1];

          // 5. Let k be 0.
          var k = 0;

          // 6. Repeat, while k < len
          while (k < len) {
            // a. Let Pk be ! ToString(k).
            // b. Let kValue be ? Get(O, Pk).
            // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
            // d. If testResult is true, return kValue.
            var kValue = o[k];
            if (predicate.call(thisArg, kValue, k, o)) {
              return kValue;
            }
            // e. Increase k by 1.
            k++;
          }

          // 7. Return undefined.
          return undefined;
        }
      });
        }
        
    // Production steps of ECMA-262, Edition 6, 22.1.2.1
    if (!Array.from) {
            Array.from = (function () {
              var toStr = Object.prototype.toString;
              var isCallable = function (fn) {
                return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
              };
              var toInteger = function (value) {
                var number = Number(value);
                if (isNaN(number)) { return 0; }
                if (number === 0 || !isFinite(number)) { return number; }
                return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
              };
              var maxSafeInteger = Math.pow(2, 53) - 1;
              var toLength = function (value) {
                var len = toInteger(value);
                return Math.min(Math.max(len, 0), maxSafeInteger);
              };

              // The length property of the from method is 1.
              return function from(arrayLike/*, mapFn, thisArg */) {
                // 1. Let C be the this value.
                var C = this;

                // 2. Let items be ToObject(arrayLike).
                var items = Object(arrayLike);

                // 3. ReturnIfAbrupt(items).
                if (arrayLike == null) {
                    throw new TypeError('Array.from requires an array-like object - not null or undefined');
            }

              // 4. If mapfn is undefined, then let mapping be false.
              var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
              var T;
              if (typeof mapFn !== 'undefined') {
                // 5. else
                // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
                if (!isCallable(mapFn)) {
                  throw new TypeError('Array.from: when provided, the second argument must be a function');
                }

                // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
                if (arguments.length > 2) {
                  T = arguments[2];
                }
              }

              // 10. Let lenValue be Get(items, "length").
              // 11. Let len be ToLength(lenValue).
              var len = toLength(items.length);

              // 13. If IsConstructor(C) is true, then
              // 13. a. Let A be the result of calling the [[Construct]] internal method 
              // of C with an argument list containing the single item len.
              // 14. a. Else, Let A be ArrayCreate(len).
              var A = isCallable(C) ? Object(new C(len)) : new Array(len);

              // 16. Let k be 0.
              var k = 0;
              // 17. Repeat, while k < len… (also steps a - h)
              var kValue;
              while (k < len) {
                kValue = items[k];
                if (mapFn) {
                  A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                } else {
                  A[k] = kValue;
                }
                k += 1;
              }
              // 18. Let putStatus be Put(A, "length", len, true).
              A.length = len;
              // 20. Return A.
              return A;
            };
          }());
        }
        
    // ES6 Array.prototype.fill polyfill:
    // ==================================
    // From Mozilla: http://mzl.la/1umD1jc
    if (!Array.prototype.fill) {
      Array.prototype.fill = function(value) {
        if (this == null) {
          throw new TypeError('this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        var start = arguments[1];
        var relativeStart = start >> 0;
        var k = relativeStart < 0 ?
          Math.max(len + relativeStart, 0) :
          Math.min(relativeStart, len);
        var end = arguments[2];
        var relativeEnd = end === undefined ?
          len : end >> 0;
        var final = relativeEnd < 0 ?
          Math.max(len + relativeEnd, 0) :
          Math.min(relativeEnd, len);
        while (k < final) {
          O[k] = value;
          k++;
        }

        return O;
      };
    }
})();
// Strings
(function () {
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
          position = position || 0;
          return this.substr(position, searchString.length) === searchString;
      };
    }
    // mine.
    if (!String.prototype.toProperCase) {
        String.prototype.toProperCase = function () {
            var arr = this.split(" "), arrProper = [];
            arr.forEach(function (str) {
               arrProper.push(str.charAt(0).toUpperCase() + str.slice(1).toLowerCase());
            });
            return arrProper.join(" ");
      };
    }
})();
// JQuery
jQuery.fn.simulateKeyDown = function(char) {
        jQuery(this).trigger({
            type: 'keydown',
            which: char
        });
    };
//Source here : http://plugins.jquery.com/project/selectRange
$.fn.selectRange = function(start, end) {
    //$('#q').selectRange(0, 10);
    //$('#q').selectRange(searchVal.indexOf('{'), (searchVal.indexOf('}')+1));
    var e = document.getElementById($(this).attr('id')); 
    // I don't know why... but $(this) don't want to work today :-/
    if (!e) return;
    else if (e.setSelectionRange) { e.focus(); e.setSelectionRange(start, end); } 
    /* WebKit */ 
    else if (e.createTextRange) { var range = e.createTextRange(); range.collapse(true); range.moveEnd('character', end); range.moveStart('character', start); range.select(); } 
    /* IE */
    else if (e.selectionStart) { e.selectionStart = start; e.selectionEnd = end; }
};