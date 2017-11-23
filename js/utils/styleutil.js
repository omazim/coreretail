var StyleUtil = (function () {
        var me = {
                init: " w3-",
                getPaddingClass: function (size) {
                    size = (size)? size: "small";
                    return this.init + "padding-" + size;
                },
                getAlignmentClass: function (side) {
                    side = (side)? side: "center";
                    return this.init + side;
                },
                getFontSizeClass: function (size) {
                    size = (size)? size: "medium";
                    return this.init + size;
                },
                getWidthClass: function (width) {
                    var respWidth = parseInt(width, 10), responsive = "";
                    if (respWidth > 0) {
                        responsive = " w3-col" + " l" + respWidth;
                    }
                    return responsive;
                },
                alphaColorArray: [
                    "#4e7496",
                    "#c69f59",
                    "#7f8f4e",
                    "#526525",
                    "#4b6113",
                    "#fdff63",
                    "#fffe40",
                    "#ff63e9",
                    "#af6f09",
                    "#9d0216",
                    "#fd798f",
                    "#ff7fa7",
                    "#8ab8fe",
                    "#befdb7",
                    "#c1fd95",
                    "#a5a391",
                    "#de0c62",
                    "#0485d1",
                    "#056eee",
                    "#343837",
                    "#3c4142",
                    "#c1f80a",
                    "#cf0234",
                    "#f7022a",
                    "#742802",
                    "#3d1c02"
                ],
                //Used to identify which background color to apply to a lookup row.
                alphaArray: function () {
                    var str = "abcdefghijklmnopqrstuvwxyz",
                        arr = str.split("");
                    return arr;
                },
                undimApp: function () {
                    $("#" + AI.htmlId.appContainer).animate({opacity: "1"}, "fast");
                },
                dimApp: function () {
                    $("#" + AI.htmlId.appContainer).animate({opacity: "0.3"}, "fast");
                },
                backgroundFlash: function (el) {
                    $(el).addnimate({
                        backgroundColor: "yellow"
                    });
                },
                cueContentTab: function (tab) {
                    tab.addClass("w3-border-deep-purple w3-bottombar");
                    tab.siblings().removeClass("w3-border-deep-purple w3-bottombar");
                },
                // TODO: there's this error here:
                // RangeError: Maximum call stack size exceeded
                highlight: function (e) {
                        var n = e.prop("tagName");
                        try {
                            switch (n) {
                            case "INPUT":
                                e.addClass("w3-yellow");
                                if (e.hasClass(AI.htmlClass.groupField)) {
                                    //CtrlUtil.focus.input(e.attr("id"));
                                } else {
                                    if (e.attr("type") !== "text") {
                                        e.selectRange();
                                    } else {
                                        e.focus();
                                    }
                                }                        
                                break;
                            case "LI":
                                //e.css("color", "#fff !important");
                                //e.css("background-color", "#845bcb");
                            case "TR":
                            case "SELECT":
                                //AI.pause(jQuery.fn.simulateKeyDown(13), 1000);
                                //e.trigger("click");
                                e.css("background-color", "#ffeb3b");
                                break;
                            }
                        } catch (err) {
                            console.log(err.stack);
                            //Service.logError(err);
                        }
                    },
                /**
                 * 
                 * @param {JQuery Object} e
                 * @returns {undefined}
                 */
                lowlight: function (e) {
                    var n = e.prop("tagName");
                    switch (n) {
                    case "INPUT":
                        e.removeClass("w3-yellow");
                        break;
                    case "DT":
                    case "DD":
                    case "LI":      
                        e.css("color", "");
                    case "TR":      
                    case "SELECT":      
                        e.css("background-color", "");
                        break;
                    }
                },
                highlightMenu: function (e) {
                    var color = e.attr("data-color");
                     e.removeClass(color).attr("data-color", color);
                 },
                lowlightMenu: function (e) {
                    e.addClass(e.attr("data-color")).removeClass("w3-border-green");
                },
                toggleClass: function (e, cls) {
                    e.toggleClass(cls);
                },
                /**
                * 
                * @param {type} event
                * @returns {undefined}
                */
                capitalize: function (event) {
                    var e = event.target,
                        fieldId = HTMLUtil.getNamePartFromId(e.id),
                        value = e.value, type, format;
                    if (!Def.ModelFields[fieldId]) {
                        if (e.getAttribute("type") !== "text") {return;}
                    } else {
                        if (!Def.ModelFields[fieldId].IsCapitalized) {return;}
                    }
                    e.value = value.toUpperCase();
                },
                border: function (e, use, color) {
                    if (use) {
                        e.addClass("w3-border w3-border-" + color);
                    } else {
                        e.removeClass("w3-border w3-border-" + color);
                    }
                },
                /**
                * @function toggleMask
                * @description Switch between showing and hiding a password field.
                * @param {object} event 
                * @returns {undefined}
                */
                toggleMask: function (event) {
                    var checkBox = event.target,
                        //get the input element to show/hide from 'data-for' attribute
                        e = document.getElementById(checkBox.attributes['data-for'].value),
                        type = (e.attributes['type'].value === "text")? "password": "text";
                    e.setAttribute("type", type);
                },
                toggleBackground: function (e, toggleO) {
                    var c = e.css("color"),
                        bg = e.css("background-color");
                    e.css("color", toggleO.c + " !important");
                    e.css("background-color", toggleO.bg);
                        window.setTimeout(function () {
                            e.css("color", c + " !important");
                            e.css("background-color", bg);
                        }, 100);
                },
                makeCheckboxSwitch: function (input) {
                    var label = HTMLUtil.getObj("label"),
                        div = HTMLUtil.getObj("div");
                    label.attr.class = "corra-switch w3-padding-large w3-right";
                    label.style = {
                        height: "80%",
                        width: "15%"
                    };
                    label = HTMLUtil.get(label);

                    div.attr.class = "corra-switch-slider";
                    div = HTMLUtil.get(div);

                    label.appendChild(input);
                    label.appendChild(div);
                    return label;
                },
                /**
                 * 
                 * @param {HTMLElementObject} e
                 * @param {String} x
                 * @param {Boolean} timeout
                 * @param {Function} cb
                 * @returns {undefined}
                 */
                effect: function (e, x, timeout, cb) {                    
                    try {
                        if (timeout) {
                            setTimeout(function () {
                                $(e).effect(x, "slow");
                                if (typeof cb === "function") {cb();}
                            }, 1000);
                        } else {// for snackbar feedbacks
                            $(e).effect(x, "slow", 10);
                        }
                    } catch (err) {
                        console.error(err.stack);
                    }
                },
                transfer: function (a, b, cb) {
                    try {
                        setTimeout(function () {
                            $(a).transfer({to: $(b), duration: "slow"}, cb);             
                        }, 1000);                        
                    } catch (err) {
                        console.log(err.stack);
                    }
                },
                flash: function (e, start) {                    
                    try {
                        if (start) {
                            $.effects.saveStyle(e);
                            ViewUtil.state.interval.mic = setInterval(function () {
                                e.toggle("puff"), 1000});
                        } else {
                            clearInterval(ViewUtil.state.interval.mic);
                            e.clearQueue().stop();
                            $.effects.restoreStyle(e);
                        }
                    } catch (err) {
                        console.error(err.stack);
                    }
                } 
            };
        return me;
    })();


