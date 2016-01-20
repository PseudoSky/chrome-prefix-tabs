var background = chrome.extension.getBackgroundPage(),
    TABAREA_WIDTH = 620,
    TMTAREA_HEIGHT = 430,
    tabRegistryRef, currentTabRegistryRef, windowRegistryRef, currentWindowId, currentRow, maxTabIconOrder, extraTabAreaNeeded = 0,
    separatorTabIconOrder, resizedTimes = 0,
    smallMode = !1,
    MAJOR_VERSION = 2.1,
    tmtWindowId, Columns, allTabs = {};

function createTabIcon(a) {
    var b = $("<div/>", {
            id: "tab" + a,
            "class": "tabexterior",
            tabId: a
        }),
        c = $("<div/>", {
            "class": "tabinterior"
        }).appendTo(b),
        d = allTabs[a];
    $("<img/>", {
        id: "tabimg" + a,
        "class": "tabimage",
        src: "/img/sample_screen.png",
        title: d.URL[0],
        click: onTabSelect,
        tabId: a
    }).appendTo(c);
    $("<div/>", {
        "class": "tabtitle",
        text: d.title,
        title: d.title,
        click: onTabSelect,
        tabId: a
    }).appendTo(b);
    c = $("<img/>", {
        "class": "tabfavicon"
    }).appendTo(b);
    try {
        c.attr("src", d.favIconURL ? d.favIconURL : chrome.extension.getURL("/img/tmtchrome_defaulticon.png"))
    } catch (f) {
        c.attr("src",
            chrome.extension.getURL("/img/tmtchrome_defaulticon.png"))
    }
    $("<div/>", {
        "class": "tabpopicon",
        click: onTabPop,
        title: getMessage("clickToPop"),
        tabId: a
    }).appendTo(b);
    $("<div/>", {
        "class": "tabclosebutton",
        click: onTabClose,
        title: getMessage("clickToClose"),
        tabId: a
    }).appendTo(b);
    $("#innertabarea").append(b);
    setTimeout(function() {
        loadScreenCap(a)
    }, Math.random() * 500)
}

function loadScreenCap(a) {
    var b = $("#tabimg" + a);
    b.length > 0 && showPreview && (a = background.getCapture(a)) && b.attr("src", a)
}

function placeTabIcon(a) {
    var a = $("#tab" + a),
        b = a.attr("order"),
        c = Math.floor(b / 5),
        d = b % 5;
    b >= separatorTabIconOrder && (b = b + 5 + (4 - (separatorTabIconOrder - 1) % 5), c = Math.floor(b / 5), d = b % 5);
    a.attr("style", "left:" + (20 + c * 185 + d % 2 * 20) + "px; top:" + d * 100 + "px; z-index:" + (100 + d) + ";")
}

function onTabSelect(a) {
    a.ctrlKey || a.metaKey || a.button == 1 ? onTabClose(a) : (a = parseInt($(a.currentTarget).attr("tabId")), allTabs[a] && background.selectTab(a, _focusedId))
}

function onTabClose(a) {
    cancelTMTContextMenu();
    var b = parseInt($(a.currentTarget).attr("tabId"));
    chrome.tabs.remove(b, function() {
        if ($(".tabinterior").length == 1) window.close();
        else {
            var a = $("#tab" + b);
            a.attr("order") == maxTabIconOrder && maxTabIconOrder--;
            a.remove();
            Columns.getCurrentRowId() == 3 && setTimeout(function() {
                clearTMTArea();
                fillTMTArea()
            }, 1E3)
        }
    })
}
var lastSortedOrder;

function sortTabs_old(a) {
    maxTabIconOrder = 0;
    var b = [];
    a != "keyword" && ($("#numsearchresults").attr("style", "left: 0px; top: 600px;"), $("#searchseparator").attr("style", "left: -10px;"), $("#searchbox").val(""), extraTabAreaNeeded = 0, adjustInnerArea());
    if (a == "tabid") {
        for (a = 0; a < tabRegistryRef.length; a++) {
            var c = $("#tab" + tabRegistryRef[a]),
                d = tabRegistryRef.length - a - 1;
            c.attr("order", d);
            d > maxTabIconOrder && (maxTabIconOrder = d)
        }
        for (a = tabRegistryRef.length - 1; a >= 0; a--) b.push(tabRegistryRef[a]);
        separatorTabIconOrder =
            99999;
        lastSortedOrder = b;
        localStorage.lastOrder = "tabid"
    } else if (a == "name") {
        for (a = 0; a < tabRegistryRef.length; a++) b.push(tabRegistryRef[a]);
        b.sort(nameSortFunction);
        for (a = 0; a < tabRegistryRef.length; a++) c = $("#tab" + b[a]), c.attr("order", a), d = a, d > maxTabIconOrder && (maxTabIconOrder = d);
        separatorTabIconOrder = 99999;
        lastSortedOrder = b;
        localStorage.lastOrder = "name"
    } else if (a == "domain") {
        for (a = 0; a < tabRegistryRef.length; a++) b.push(tabRegistryRef[a]);
        b.sort(domainSortFunction);
        for (a = 0; a < tabRegistryRef.length; a++) c = $("#tab" +
            b[a]), c.attr("order", a), d = a, d > maxTabIconOrder && (maxTabIconOrder = d);
        separatorTabIconOrder = 99999;
        lastSortedOrder = b;
        localStorage.lastOrder = "domain"
    } else if (a == "keyword") {
        for (a = 0; a < tabRegistryRef.length; a++) b.push(tabRegistryRef[a]);
        separatorTabIconOrder = 0;
        b.sort(keywordSortFunction);
        for (a = 0; a < tabRegistryRef.length; a++) c = $("#tab" + b[a]), c.attr("order", a), d = a, d > maxTabIconOrder && (maxTabIconOrder = d);
        b = $("#searchbox").val().toLowerCase();
        for (a = separatorTabIconOrder = 0; a < tabRegistryRef.length; a++)(allTabs[tabRegistryRef[a]].title.toLowerCase().indexOf(b) !=
            -1 || allTabs[tabRegistryRef[a]].URL[allTabs[tabRegistryRef[a]].URL.length - 1].toLowerCase().indexOf(b) != -1) && separatorTabIconOrder++
    }
}

function nameSortFunction(a, b) {
    if (!allTabs[a].title) return 1;
    if (!allTabs[b].title) return 1;
    return allTabs[a].title.toLowerCase() < allTabs[b].title.toLowerCase() ? -1 : 1
}

function domainSortFunction(a, b) {
    return allTabs[a].URL[allTabs[a].URL.length - 1] < allTabs[b].URL[allTabs[b].URL.length - 1] ? -1 : 1
}

function keywordSortFunction(a, b) {
    var c = $("#searchbox").val().toLowerCase();
    if (!allTabs[a].title) allTabs[a].title = "untitled";
    if (!allTabs[b].title) allTabs[b].title = "untitled";
    var d = allTabs[a].title.toLowerCase().indexOf(c),
        f = allTabs[b].title.toLowerCase().indexOf(c),
        e = allTabs[a].URL[0].toLowerCase().indexOf(c),
        c = allTabs[b].URL[0].toLowerCase().indexOf(c);
    e != -1 && (d = e);
    c != -1 && (f = c);
    if (d == -1 && f == -1) return d = lastSortedOrder.indexOf(a), f = lastSortedOrder.indexOf(b), d < f ? -1 : 1;
    if (d != -1 && f != -1) return d = lastSortedOrder.indexOf(a),
        f = lastSortedOrder.indexOf(b), d < f ? -1 : 1;
    if (d == -1) return 1;
    return -1
}
var sortingTimer, sortingTimer2;

function sortTabsCommand(a) {
    sortingTimer && clearTimeout(sortingTimer);
    sortingTimer2 && clearTimeout(sortingTimer2);
    lastSortedOrder = [];
    Object.keys(allTabs).forEach(function(a) {
        lastSortedOrder.push(parseInt(a, 10))
    });
    sortTabs(a);
    doTabAreaAnimation(6);
    sortingTimer = setTimeout(function() {
        for (var a = 0; a < lastSortedOrder.length; a++) placeTabIcon(lastSortedOrder[a]);
        moveInnerArea(0, 0)
    }, 180)
}

function sortTabs(a) {
    maxTabIconOrder = 0;
    a != "keyword" && ($("#numsearchresults").hide(), $("#searchseparator").hide(), $("#searchbox").val(""), extraTabAreaNeeded = 0, adjustInnerArea());
    separatorTabIconOrder = 99999;
    a == "tabid" ? (lastSortedOrder.sort(sortTabId), localStorage.lastOrder = "tabid") : a == "name" ? (lastSortedOrder.sort(nameSortFunction), localStorage.lastOrder = "name") : a == "domain" ? (lastSortedOrder.sort(domainSortFunction), localStorage.lastOrder = "domain") : a == "keyword" && lastSortedOrder.sort(keywordSortFunction);
    for (var b = 0; b < lastSortedOrder.length; b++) $("#tab" + lastSortedOrder[b]).attr("order", b), b > maxTabIconOrder && (maxTabIconOrder = b);
    if (a == "keyword") {
        $("#numsearchresults").show();
        $("#searchseparator").show();
        a = $("#searchbox").val().toLowerCase();
        for (b = separatorTabIconOrder = 0; b < lastSortedOrder.length; b++)(allTabs[lastSortedOrder[b]].title.toLowerCase().indexOf(a) != -1 || allTabs[lastSortedOrder[b]].URL[allTabs[lastSortedOrder[b]].URL.length - 1].toLowerCase().indexOf(a) != -1) && separatorTabIconOrder++
    }
    return lastSortedOrder
}

function findTabsCommand() {
    var a = $("#searchbox").val().toLowerCase().trim(),
        b = window.event.keyCode;
    if (separatorTabIconOrder > 0 && (b == 13 || b == 38 || b == 40 || b == 37 || b == 39)) {
        var c = $(".topped"),
            d = 0,
            f = 0;
        if (b == 13) return d = c.length > 0 ? parseInt(c.attr("tabid")) : lastSortedOrder[0], d > 0 && background.selectTab(d, _focusedId), window.event.preventDefault(), !1;
        else if (b == 40) {
            if (c.length == 0) d = lastSortedOrder[0];
            else
                for (var f = parseInt(c.attr("tabid")), e = 0; e < lastSortedOrder.length; e++)
                    if (f == lastSortedOrder[e]) {
                        d = e < separatorTabIconOrder -
                            1 ? lastSortedOrder[e + 1] : lastSortedOrder[e];
                        break
                    }
            d > 0 && $("#tab" + d).addClass("topped");
            f > 0 && f != d && $("#tab" + f).removeClass("topped")
        } else if (b == 38) {
            if (c.length == 0) d = lastSortedOrder[0];
            else {
                f = parseInt(c.attr("tabid"));
                for (e = 0; e < lastSortedOrder.length; e++)
                    if (f == lastSortedOrder[e]) {
                        d = e == 0 ? lastSortedOrder[e] : lastSortedOrder[e - 1];
                        break
                    }
            }
            d > 0 && $("#tab" + d).addClass("topped");
            f > 0 && f != d && $("#tab" + f).removeClass("topped")
        }
    } else sortingTimer && clearTimeout(sortingTimer), sortTabs("keyword"), sortingTimer = setTimeout(function() {
        for (e =
            0; e < lastSortedOrder.length; e++) placeTabIcon(lastSortedOrder[e]);
        moveInnerArea(0, 0);
        separatorTabIconOrder < lastSortedOrder.length || a != "" ? ($("#numsearchresults").text(separatorTabIconOrder + " tab match(es)").attr("style", "left:" + (20 + Math.floor(separatorTabIconOrder / 5) * 185) + "px; top:" + (separatorTabIconOrder % 5 * 100 + 20) + "px;"), $("#searchseparator").attr("style", "left:" + (120 + (Math.floor(separatorTabIconOrder / 5) + 1) * 185) + "px;"), extraTabAreaNeeded = 4 - (separatorTabIconOrder - 1) % 5 + 5) : ($("#numsearchresults").attr("style",
            "left:0px; top:600px;"), $("#searchseparator").attr("style", "left: -10px;"), extraTabAreaNeeded = 0);
        adjustInnerArea()
    }, 200)
}

function doTabAreaAnimation(a) {
    if (!(a <= 0)) {
        var b = $("#tabarea");
        a == 6 ? b.attr("style", "top:70px; opacity:0.75;") : a == 5 ? b.attr("style", "top:85px; opacity:0.33;") : a == 4 ? b.attr("style", "top:90px; opacity:0.0;") : a == 3 ? b.attr("style", "top:85px; opacity:0.33;") : a == 2 ? b.attr("style", "top:70px; opacity:0.75;") : a == 1 && b.attr("style", "");
        sortingTimer2 = setTimeout(function() {
            doTabAreaAnimation(a - 1)
        }, 60)
    }
}

function createTMTTab(a) {
    var b = currentRow.tabs[a],
        c = $("<div/>", {
            id: "tmt" + a,
            "class": "tmttab",
            tabIndex: a,
            link: b.URL[b.URL.length - 1]
        }).appendTo($("#innertmtarea"));
    c.hover(function() {
        $("#tmtStatus").text($(this).attr("link")).css("background-color", "#fff").show()
    }, function() {
        $("#tmtStatus").hide()
    });
    a = $("<div/>", {
        "class": "tmttabiconbox",
        click: onTMTContextMenu
    }).appendTo(c);
    $("<img/>", {
        "class": "tmttabicon",
        src: b.favIconURL ? b.favIconURL : "http://code.google.com/favicon.ico"
    }).appendTo(a);
    b.pinned && currentRow.id !=
        3 && $("<img/>", {
            "class": "tmtpin",
            src: "/img/pin.png"
        }).appendTo(a);
    b = b.title || b.link;
    $("<div/>", {
        "class": "tmttabtitle",
        text: b,
        title: getMessage("clickToRestore") + " '" + b + "'",
        click: function() {
            onTabRestore(c)
        }
    }).appendTo(c)
}

function removeTMTTab(a) {
    if (a) {
        a.remove();
        for (var a = $(".tmttab"), b = 0; b < a.length; b++) {
            var c = $(a[b]);
            c.attr("tabIndex", b);
            c.attr("id", "tmt" + b)
        }
        $("#tmtrowlabel").text(currentRow.name + "(" + currentRow.tabs.length + ")")
    }
}

function onTabPop(a) {
    cancelTMTContextMenu();
    var b = parseInt($(a.currentTarget).attr("tabId")),
        a = Columns.getCurrentRowId();
    a == 3 && (nextTMTRow(), a = Columns.getCurrentRowId());
    a = (a = Columns.popTab(b)) ? a.windowId : null;
    delete allTabs[b];
    $(".tabinterior").length == 1 ? chrome.tabs.create({
        windowId: a
    }, function() {
        chrome.tabs.remove(b)
    }) : chrome.tabs.remove(b);
    $("#tab" + b).remove();
    currentRow = getCurrentRow();
    createTMTTab(currentRow.tabs.length - 1);
    moveTMTArea(-0.15 * $("#innertabarea").height(), 6);
    $("#tmtrowlabel").text(currentRow.name +
        "(" + currentRow.tabs.length + ")")
}

function onTabRestore(a) {
    var b = a.attr("tabIndex");
    cancelTMTContextMenu();
    var c = isTMTWindow ? !0 : !1,
        d = getCurrentRow().tabs[b];
    d && chrome.tabs.create({
        url: d.URL[d.URL.length - 1],
        selected: c,
        active: c,
        pinned: d.pinned
    }, function(c) {
        var e = c.id;
        allTabs[e] = new tabData(c);
        allTabs[c.id].title = d.title;
        allTabs[c.id].favIconURL = d.favIconURL;
        var c = !1,
            g = Columns.getCurrentRowId();
        if (!d.pinned && g != 2 || g == 3) Columns.removeTabInRow(b), c = !0;
        createTabIcon(e);
        maxTabIconOrder++;
        $("#tab" + e).attr("order", maxTabIconOrder);
        placeTabIcon(e);
        c && removeTMTTab(a);
        adjustInnerArea();
        e = $("#innertabarea");
        e = parseInt(e.css("width").replace("px", ""));
        moveInnerArea(-0.125 * e, 6)
    })
}

function onTabRemove(a) {
    a.stopPropagation();
    a.preventDefault();
    a = $("#tmtcontextmenu");
    a = parseInt(a.attr("tabIndex"));
    Columns.removeTabInRow(a);
    removeTMTTab($("#tmt" + a))
}

function onTMTContextMenu(a) {
    a.stopPropagation();
    a.preventDefault();
    var b = parseInt($(a.currentTarget).parent().attr("tabIndex"));
    $("#tmtcontextmenu").attr("style", "top:" + a.pageY + "px;").attr("tabIndex", b)
}

function cancelTMTContextMenu() {
    $("#tmtcontextmenu").attr("style", "top:600px;")
}

function clearTMTArea() {
    $(".tmttab").remove();
    $("#tmtaddrowbutton").hide();
    $("#tmtremoverowbutton").hide();
    $("#tmtconfirm").hide();
    moveTMTArea(1E3, 4)
}

function fillTMTArea() {
    currentRow = getCurrentRow();
    currentRow.id == 3 ? $("#tmtrowlabel").text(currentRow.name) : $("#tmtrowlabel").text(currentRow.name + " (" + currentRow.tabs.length + ")");
    resetTMTControls();
    for (var a = 0; a < currentRow.tabs.length; a++) createTMTTab(a)
}

function clearAllTMTTabs() {
    currentRow = getCurrentRow();
    for (var a = currentRow.tabs.length, b = 0; b < a; b++) $("#tmt" + b).remove(), Columns.removeTabInRow(0);
    clearTMTArea();
    fillTMTArea()
}

function addTMTRow() {
    var a = getMessage("newColumn");
    a && (Columns.addRow(a, "Custom Column"), clearTMTArea(), fillTMTArea(), askRenameTMTRow())
}

function askRenameTMTRow() {
    currentRow = getCurrentRow();
    if (currentRow.id > 3) tmtrowlabelinput.style.display = "block", tmtrowlabelinput.value = currentRow.name, tmtrowlabelinput.focus(), tmtrowlabelinput.selectionStart = 0, tmtrowlabelinput.selectionEnd = tmtrowlabelinput.value.length
}

function cancelRenameTMTRow() {
    $(tmtrowlabelinput).hide()
}

function renameTMTRow(a) {
    switch (a.which) {
        case 27:
            cancelRenameTMTRow();
            break;
        case 13:
            if (setTimeout(function() {
                    $(tmtrowlabelinput).hide()
                }, 100), currentRow = getCurrentRow(), (a = tmtrowlabelinput.value) && a != currentRow.name) Columns.renameRow(currentRow.id, a), clearTMTArea(), fillTMTArea()
    }
}

function removeTMTRow() {
    Columns.removeRow();
    clearTMTArea();
    fillTMTArea()
}

function nextTMTRow() {
    Columns.nextRow();
    clearTMTArea();
    fillTMTArea()
}

function prevTMTRow() {
    Columns.prevRow();
    clearTMTArea();
    fillTMTArea()
}
var hidePinTab = localStorage.hidePinTab == "true",
    _tabRegistry = {},
    _windowRegistry, _tabDataMap = {},
    _focusedId;

function filterTabData(a) {
    if (!hidePinTab || !a.pinned) allTabs[a.id] = new tabData(a)
}

function tabData(a) {
    this.id = a.id;
    this.windowId = a.windowId;
    this.title = a.title;
    this.favIconURL = a.favIconUrl;
    this.URL = [a.url];
    this.screenCap = null;
    this.pinned = a.pinned;
    this.popped = !1;
    this.parent = this.id
}

function initBackgroundData(a) {
    isTMTWindow ? chrome.windows.getCurrent(null, function(b) {
        tmtWindowId = b.id;
        populateWins(a)
    }) : populateWins(a)
}

function getCurrentRow() {
    return Columns.getCurrentRow()
}

function populateWins(a) {
    localStorage.crosswindow == "true" ? chrome.windows.getAll({
        populate: !0
    }, function(b) {
        b.forEach(function(a) {
            if (a.focused) _focusedId = a.id;
            a.tabs.forEach(function(a) {
                filterTabData(a)
            })
        });
        a()
    }) : tmtWindowId ? chrome.windows.get(parseInt(localStorage.lastFocusId), {
        populate: !0
    }, function(b) {
        _focusedId = b.id;
        b.tabs.forEach(function(a) {
            filterTabData(a)
        });
        a()
    }) : chrome.windows.getCurrent({
        populate: !0
    }, function(b) {
        _focusedId = b.id;
        b.tabs.forEach(function(a) {
            filterTabData(a)
        });
        a()
    })
}

function sortTabId(a, b) {
    return b - a
}
var showPreview = !1,
    usageMode = localStorage.usageMode || 0,
    isTMTWindow = !1;

function main() {
    console.log("Version 2.2");
    isTMTWindow = window.location.search.indexOf("tmtwindow") > 0;
    $("#findlabel").text(getMessage("find"));
    $("#searchbox").attr("title", getMessage("justTypeIn"));
    $("#optionlabel").text(getMessage("options"));
    $("#optionlabel").attr("title", getMessage("openOptionPage"));
    $("#importlabel").text(getMessage("importAndExport"));
    $("#importlabel").attr("title", getMessage("openImportAndExportPage"));
    $("#sortbynamebutton").attr("title", getMessage("sortByName"));
    $("#sortbyaddressbutton").attr("title",
        getMessage("sortByAddress"));
    $("#sortbytimebutton").attr("title", getMessage("sortByTime"));
    $("#sortbytimebutton").attr("title", getMessage("sortByTime"));
    $("#logoarea").attr("title", getMessage("updateNotes"));
    $("#tmtleftarrow").attr("title", getMessage("previousColumn"));
    $("#tmtrightarrow").attr("title", getMessage("nextColumn"));
    $("#contextmenuremove").text(getMessage("remove"));
    $("#contextmenucancel").text(getMessage("cancel"));
    $("#tmtaddcol").attr("title", getMessage("addNewColumn"));
    $("#tmtdelcol").attr("title",
        getMessage("removeThisColumn"));
    $("#tmtclearcol").attr("title", getMessage("clearAll"));
    $("#confirmQuestionText").text(getMessage("areYouSure"));
    $("#cancelButton").val(getMessage("cancel")).click(function() {
        $("#tmtconfirm").hide();
        usageMode == 0 && $("#tmtrowcontent").show()
    });
    $("#confirmButton").val(getMessage("ok"));
    localStorage.popupsize == "narrow" ? $("body").attr("style", "width:680px; height:599px;") : localStorage.popupsize == "small" && ($("body").attr("style", "width:620px; height:450px;"), smallMode = !0);
    if (!localStorage.disablePreview || localStorage.disablePreview == "false") showPreview = !0;
    localStorage.updateread && localStorage.updateread < MAJOR_VERSION && $("#logoarea").show();
    usageMode == 0 ? (TMTAREA_HEIGHT = 405, uparrow.style.top = "140px", tmtlistbox.style.top = "165px", tmtlistbox.style.height = "405px") : TMTAREA_HEIGHT = 430;
    $("#innertabarea")[0].addEventListener("mousewheel", mouseWheelMoveInnerArea, !1);
    initBackgroundData(function() {
        Columns = background.Columns;
        adjustInnerArea();
        lastSortedOrder = [];
        Object.keys(allTabs).forEach(function(a) {
            lastSortedOrder.push(parseInt(a,
                10))
        });
        lastSortedOrder.forEach(function(a) {
            createTabIcon(a)
        });
        localStorage.lastOrder ? sortTabs(localStorage.lastOrder) : sortTabs("tabid");
        for (var a = 0; a < lastSortedOrder.length; a++) placeTabIcon(lastSortedOrder[a]);
        moveInnerArea(0, 0);
        fillTMTArea();
        document.getElementById("tmtlistbox").addEventListener("mousewheel", mouseWheelMoveTMTArea, !1);
        moveTMTArea(0, 0);
        changeBackground(localStorage.themeColor ? JSON.parse(localStorage.themeColor) : 0);
        chrome.tabs.query ? chrome.tabs.query({
            active: !0
        }, function(a) {
            for (var c in a) $("#tab" +
                a[c].id) && $("<div/>", {
                id: "youareheresign"
            }).appendTo($("#tab" + a[c].id))
        }) : chrome.tabs.getSelected(null, function(a) {
            $("<div/>", {
                id: "youareheresign"
            }).appendTo($("#tab" + a.id))
        });
        $("#searchbox").focus()
    });
    chrome.runtime.sendMessage({
        command: "popupLoaded"
    }, function() {})
}

function onUpdateRead() {
    chrome.tabs.create({
        url: "http://blog.visibotech.com/search/label/TMT%20for%20Chrome",
        selected: !0
    });
    localStorage.updateread = MAJOR_VERSION;
    window.close()
}

function adjustInnerArea() {
    var a = $(".tabinterior").length;
    maxTabIconOrder && (a = maxTabIconOrder + extraTabAreaNeeded);
    a = (Math.ceil((a + 1) / 5) + 1) * 180 + 20;
    a < TABAREA_WIDTH && (a = TABAREA_WIDTH);
    innertabarea.style.width = a + "px"
}

function moveInnerArea(a, b) {
    cancelTMTContextMenu();
    var c = $("#leftarrow"),
        d = $("#rightarrow"),
        f = parseInt(innertabarea.style.left.replace("px", "")) + a,
        e = parseInt(innertabarea.style.width.replace("px", ""));
    e > TABAREA_WIDTH ? (c.attr("disabled", !1), d.attr("disabled", !1)) : (c.attr("disabled", !0), d.attr("disabled", !0));
    f < TABAREA_WIDTH - e && (f = TABAREA_WIDTH - e, d.attr("disabled", !0));
    f >= 0 && (f = 0, c.attr("disabled", !0));
    innertabarea.style.left = f + "px";
    b != 0 && setTimeout(function() {
        moveInnerArea(a, b - 1)
    }, 50)
}

function mouseWheelMoveInnerArea(a) {
    smallMode != !0 && moveInnerArea(a.wheelDelta / 10, 4)
}

function moveTMTArea(a, b) {
    cancelTMTContextMenu();
    var c = $(innertmtarea).position().top + a,
        d = $(innertmtarea).height();
    d > TMTAREA_HEIGHT ? (uparrow.setAttribute("disabled", "false"), downarrow.setAttribute("disabled", "false")) : (uparrow.setAttribute("disabled", "true"), downarrow.setAttribute("disabled", "true"));
    c < TMTAREA_HEIGHT - d && (c = TMTAREA_HEIGHT - d, downarrow.setAttribute("disabled", "true"));
    c >= 0 && (c = 0, uparrow.setAttribute("disabled", "true"));
    innertmtarea.style.top = c + "px";
    b != 0 && setTimeout(function() {
        moveTMTArea(a,
            b - 1)
    }, 50)
}

function mouseWheelMoveTMTArea(a) {
    moveTMTArea(a.wheelDelta / 10, 4)
}

function changeBackground(a) {
    switch (a) {
        case 0:
            basebox.setAttribute("style", "background:-webkit-gradient(linear, left top, left bottom, from(#00abeb), to(rgba(45,72,101,1)));");
            break;
        case 1:
            basebox.setAttribute("style", "background:-webkit-gradient(linear, left top, left bottom, from(#CCCCCC), to(#4F6D80));");
            break;
        case 2:
            basebox.setAttribute("style", "background:-webkit-gradient(linear, left top, left bottom, from(#f8ae32), to(#Af6e00));");
            break;
        case 3:
            basebox.setAttribute("style", "background:#E6E6E6");
            break;
        case 4:
            basebox.setAttribute("style", "background:-webkit-gradient(linear, left top, left bottom, from(#444455), to(#000000));");
            break;
        case 5:
            var b = getCustomThemeColor(1),
                c = getCustomThemeColor(2);
            basebox.setAttribute("style", "background:-webkit-gradient(linear, left top, left bottom, from(#" + b + "), to(#" + c + "));")
    }
    localStorage.themeColor = JSON.stringify(a)
}

function getCustomThemeColor(a) {
    return localStorage["customThemeColor" + a] ? localStorage["customThemeColor" + a] : a == 1 ? "ffffff" : "7777ff"
}

function getMessage(a, b) {
    try {
        var c = chrome.i18n.getMessage(a, b);
        if (c) return c
    } catch (d) {}
}
var colSortState;

function sortTMTColumn(a) {
    var b = colSortState && colSortState == a;
    clearTMTArea();
    fillTMTArea();
    if (!b) {
        a == "title" ? ($("#tmtsortaz").css("opacity", 1), $("#tmtsortcom").css("opacity", ""), b = getMessage("searchTitle")) : ($("#tmtsortcom").css("opacity", 1), $("#tmtsortaz").css("opacity", ""), b = getMessage("searchURL"));
        $("#tmtfilter").val("").attr("title", b);
        $("#tmtcolfilterWrap").show();
        $("#tmtrowcontent").hide();
        colSortState = a;
        var c = $("#tmtlistbox"),
            b = c.find(".tmttab");
        b.sort(function(b, c) {
            var e, g;
            a == "title" ? (e =
                $(b).text().toUpperCase(), g = $(c).text().toUpperCase()) : (e = $(b).attr("link").toUpperCase(), g = $(c).attr("link").toUpperCase());
            return e < g ? -1 : e > g ? 1 : 0
        });
        $.each(b, function(a, b) {
            c.append(b)
        });
        $("#tmtfilter").focus()
    }
}

function filterCol() {
    var a = $("#tmtfilter").val().trim(),
        b = $("#tmtlistbox").find(".tmttab");
    b.show();
    b.filter(function(b, d) {
        var f = RegExp(a, "ig"),
            e = !1;
        (e = colSortState == "title" ? f.test($(d).text()) : f.test($(d).attr("link"))) || $(d).hide();
        return d
    })
}

function tmtController(a) {
    $("#tmtrowcontent").hide();
    $("#tmtcolfilterWrap").hide();
    switch (a) {
        case "tmtaddcol":
            addTMTRow();
            break;
        case "tmtdelcol":
            if (currentRow.id <= 3) break;
            $("#tmtconfirm").show();
            confirmButton.onclick = removeTMTRow;
            break;
        case "tmtclearcol":
            $("#tmtconfirm").show();
            confirmButton.onclick = clearAllTMTTabs;
            break;
        case "tmtsortaz":
            sortTMTColumn("title");
            break;
        case "tmtsortcom":
            sortTMTColumn("com")
    }
}

function resetTMTControls() {
    $("#tmtcolfilterWrap").hide();
    colSortState = null;
    $("#tmtrowbuttons img").css("opacity", "");
    usageMode == 0 ? ($("#tmtaddcol").hide(), $("#tmtdelcol").hide(), $("#tmtrowcontent").text(currentRow.tip).show(), $("#tmtrowbuttons").attr("center", !0)) : ($("#tmtaddcol").show(), $("#tmtdelcol").show(), currentRow.id <= 3 ? $("#tmtdelcol").hide() : $("#tmtdelcol").show(), $("#tmtrowcontent").hide(), $("#tmtrowbuttons").removeAttr("center"))
}
$(document).ready(function() {
    $("body").click(function() {
        cancelTMTContextMenu()
    });
    searchbox.onkeyup = findTabsCommand;
    $(searchbox).keypress(function(a) {
        return a.keyCode != 13
    });
    $("#sortbynamebutton").click(function() {
        sortTabsCommand("name")
    });
    $("#sortbyaddressbutton").click(function() {
        sortTabsCommand("domain")
    });
    $("#sortbytimebutton").click(function() {
        sortTabsCommand("tabid")
    });
    $(optionlabel).click(function() {
        chrome.tabs.create({
            url: "/core/options.html"
        });
        window.close()
    });
    $(importlabel).click(function() {
        chrome.tabs.create({
            url: "/core/import.html"
        });
        window.close()
    });
    toolbararea.onselectstart = function() {
        return !1
    };
    $(logoarea).click(function() {
        onUpdateRead()
    });
    $(".colorbutton").click(function() {
        var a = parseInt($(this).attr("to"));
        changeBackground(a)
    });
    tabarea.onselectstart = function() {
        return !1
    };
    $(leftarrow).click(function() {
        moveInnerArea(55, 6)
    });
    $(rightarrow).click(function() {
        moveInnerArea(-55, 6)
    });
    $(tmtleftarrow).click(function() {
        prevTMTRow()
    });
    tmtrowlabel.onselectstart = function() {
        return !1
    };
    $(tmtrowlabel).click(function() {
        askRenameTMTRow()
    });
    $(tmtrowlabelinput).keypress(function(a) {
        renameTMTRow(a)
    }).blur(function() {
        renameTMTRow({
            which: 13
        })
    });
    $(tmtrightarrow).click(function() {
        nextTMTRow()
    });
    tmtColControlsWrapper.onselectstart = function() {
        return !1
    };
    $("#tmtrowbuttons > img").click(function() {
        tmtController(this.id)
    });
    tmtfilter.onkeyup = filterCol;
    $(uparrow).click(function() {
        moveTMTArea(25, 6)
    });
    tmtlistbox.onselectstart = function() {
        return !1
    };
    $(downarrow).click(function() {
        moveTMTArea(-25, 6)
    });
    $(contextmenuremove).click(function(a) {
        onTabRemove(a);
        cancelTMTContextMenu()
    });
    $(contextmenucancel).click(function() {
        cancelTMTContextMenu()
    });
    main();
    localStorage.hintVersion ==
        MAJOR_VERSION ? $("#hintbox").hide() : $("#hintClick").click(function() {
            localStorage.hintVersion = MAJOR_VERSION;
            chrome.tabs.create({
                url: "/core/import.html"
            })
        })
});
