"use strict";
function startView () {
    var doc = document,        
        htmlId = AI.htmlId,
        htmlClass = AI.htmlClass;    
    
    function popup (e, msg) {        
        var container = HTMLUtil.getObj("span"),
            span = HTMLUtil.getObj("span"),
            appContainer = doc.getElementById(htmlId.appContainer),
            popupId = HTMLUtil.getPopupId(e.id),            
            top = (e.offsetTop),
            left = (e.offsetLeft),
            topTo = (top + 40),//(top/window.innerHeight * 100),
            leftTo = (left + 40);//(left/window.innerWidth * 100);        
        span.attr.id = popupId,
        span.attr.class = htmlClass.popupText + " w3-bold w3-padding-all-4";        
        span.innerHTML = msg;        
        span = HTMLUtil.get(span);

        container.attr.class = htmlClass.popupContainer;
        container.style.top = topTo + "px";
        container.style.left = leftTo + "px";
        container.style.width = "35%";
        container = HTMLUtil.get(container);
        container.appendChild(span);
        appContainer.insertBefore(container, appContainer.childNodes[0]);
        return doc.getElementById(popupId);
    }
    
    /**
     * @function getHTMLFragment Read a file content.
     * @param {type} strPath Path of the file to retrieve fragment from.
     * @returns {String} The HTML fragment in the file specified.
     */
    function getHTMLFragment (strPath) {
        
        return (fs.existsSync(strPath))? fs.readFileSync(strPath,"utf-8") : "";
    }
    
    function setPaneTabIndex () {
        var iSubmenus = doc.getElementById(htmlId.submenuContainer).children.length;        
        $("#" + htmlId.menupage_returner).attr("tabindex", iSubmenus + 1);        
        $("#" + htmlId.submenuContainer).attr("tabindex", iSubmenus + 2);
    }
    
    //*** APPENDERS ***//
    function appendFragment (fragment, pId) {
        try {
            if (fragment) {            
                doc.getElementById(pId).appendChild(fragment.cloneNode(true));
            }
        } catch (err) {
            Service.logError(err);
        }
    }
    
    /**
     * @param {HTML Element} parent
     * @param {HTML Element} child
     * @param {Boolean} all
     * @returns {undefined}
     */
    function removeFragment (parent, child, all) {
        all = TypeUtil.toBln(all);
        try {
            if (all) {
                while (parent.hasChildNodes()) {
                    parent.removeChild(parent.lastChild);
                }
            } else {
                parent.removeChild(child);
            }
        } catch (err) {
            Service.logError(err);
        }
    }
    
    /**
     * @function appendToApp
     * @param {HTML Fragment} fragment
     * @returns {undefined}
     */
    function appendToApp (fragment) {        
        doc.getElementById(htmlId.appContainer).appendChild(fragment);
    }    
    
    function removeFromApp (id) {    
        var parent = doc.getElementById(htmlId.appContainer),
            child = parent.querySelector("#" + id);
        try {
            parent.removeChild(child);
        } catch (err) {
            Service.logError(err);
        }
    }
    
    /**
     * @function appendToPages
     * @param {HTML Fragment} fragment
     * @returns {undefined}
     */
    function appendToPageContainer (fragment) {        
        doc.getElementById(htmlId.pageContainer).appendChild(fragment);
    }
    
    /**
     * @function appendToPages
     * @param {String} id of element node
     * @returns {undefined}
     */
    function removeFromPageContainer (id) {
        var parent = doc.getElementById(htmlId.pageContainer),
            child = parent.querySelector("#" + id),
            name = child.getAttribute("data-cache-name");
    
        //cache it
        cachedFragments[name] = parent.removeChild(child);
    }
    
    /**
     * @function appendPartial
     * @param {String} pId Id of parent element.
     * @param {Markup} html HTML markup to append using JQuery.
     * @returns {undefined}
     */
    function appendPartial (pId, html) {        
        $("#" + pId).append(html);
    }
    
    /**
     * @function appendFragmentBefore
     * @param {Node} pNode Parent element.
     * @param {Node} cNode Child element.
     * @param {Number} iBefore Index of node to insert before
     * @returns {undefined}
     */
    function appendFragmentBefore (pNode, cNode, iBefore) {
        pNode.insertBefore(cNode, pNode.childNodes[iBefore - 1]);
    }
    
    /**
     * @function removeFromSMList
     * @returns {undefined}
     */
    function removeFromSMList () {
        var ul = doc.getElementById(htmlId.smList),
            c = ul.children,
            i = c.length -1;    
        while (i > -1) {
            ul.removeChild(c[i]);
            i--;
        } 
    }        
    /*Reveal*/    
    View = {        
        //setters & assigners
        setPaneTabIndex: setPaneTabIndex,        
        //appenders & removers
        appendPartial: appendPartial,        
        appendFragmentBefore: appendFragmentBefore,
        appendFragment: appendFragment,
        removeFragment: removeFragment,        
        appendToApp: appendToApp,
        removeFromApp: removeFromApp,
        
        appendToPageContainer: appendToPageContainer,
        removeFromPageContainer: removeFromPageContainer,
        
        removeFromSMList: removeFromSMList,        
        
        // makers
        getHTMLFragment: getHTMLFragment,
                
        // Properties
        recallLookup: []        
    };
}