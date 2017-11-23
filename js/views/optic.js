var optic = function () {
        return {
            popup: function (e, msg) {        
                var container = util.html.getObj("span"),
                    span = util.html.getObj("span"),
                    appContainer = doc.getElementById(htmlId.appContainer),
                    popupId = HTMLUtil.getPopupId(e.id),            
                    top = (e.offsetTop),
                    left = (e.offsetLeft),
                    topTo = (top + 40),//(top/window.innerHeight * 100),
                    leftTo = (left + 40);//(left/window.innerWidth * 100);        
                span.attr.id = popupId,
                span.attr.class = htmlClass.popupText + " w3-bold w3-padding-all-4";        
                span.innerHTML = msg;        
                span = util.html.get(span);

                container.attr.class = htmlClass.popupContainer;
                container.style.top = topTo + "px";
                container.style.left = leftTo + "px";
                container.style.width = "35%";
                container = util.html.get(container);
                container.appendChild(span);
                appContainer.insertBefore(container, appContainer.childNodes[0]);
                return doc.getElementById(popupId);
            }
        };
    };
    