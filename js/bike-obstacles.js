var map;
var osb;
var mapnik;
var markers;
var selectControl;
var popup;
var cops;
var brokenContentSize;

function style_osm_feature(feature) {
    alert(0);
}

function osbug() {
    osbug_makeform();
}

function osbug_makeform() {
        var newContent = document.createElement("div");
        var el1,el2,el3;
        var control = osb;
        var types = {
                "kerb": "Kerb",
                "parked cars": "Parked cars",
                "pedestrians": "Pedestrians",
                "stairs": "Stairs",
                "dogs": "Dogs",
                "rough road": "Rough road",
                "other": "Other"
        };

        var el_form = document.createElement("form");

        newContent.appendChild(el_form);

        el1 = document.createElement("dl");

        el2 = document.createElement("dt");
        el2.appendChild(document.createTextNode(OpenLayers.i18n("Type:")));
        el1.appendChild(el2);
        el2 = document.createElement("dd");

        for (var i in types) {
                var obstacleType1 = document.createElement("input");
                obstacleType1.id = i;
                obstacleType1.value = i;
                obstacleType1.type = "radio";
                obstacleType1.name = "type";
                el2.appendChild(obstacleType1);
                var label = document.createElement("label");
                label.htmlFor = i;
                label.appendChild(document.createTextNode(OpenLayers.i18n(types[i])));
                el2.appendChild(label);
                el2.appendChild(document.createElement("br"));
        }

        el1.appendChild(el2);

        el2 = document.createElement("dt");
        el2.appendChild(document.createTextNode(OpenLayers.i18n("Your name:")));
        el1.appendChild(el2);
        el2 = document.createElement("dd");
        var inputUsername = document.createElement("input");
        if (osb.osbLayer.usernameshort != null) {
            if (osb.osbLayer.usernameshort == "") {
                osb.osbLayer.usernameshort = "anonymous";
            }
        } else {
            if (osb.osbLayer.username != null) {
                osb.osbLayer.usernameshort = osb.osbLayer.username;
            }
        }
        if (osb.osbLayer.usernameshort == "NoName") {
            osb.osbLayer.usernameshort = OpenLayers.i18n("NoName");
        }
        inputUsername.className = "osbUsername";
        inputUsername.id = "osbuser";
        el2.appendChild(inputUsername);
        el1.appendChild(el2);

        el2 = document.createElement("dt");
        el2.appendChild(document.createTextNode(OpenLayers.i18n("Your message:")));
        el1.appendChild(el2);
        el2 = document.createElement("dd");
        var inputDescription = document.createElement("input");
        inputDescription.id = "osbtext";
        el2.appendChild(inputDescription);
        el1.appendChild(el2);
        el_form.appendChild(el1);

        el1 = document.createElement("div");
        el2 = document.createElement("button");
        el2.innerHTML = OpenLayers.i18n("Say");
        el2.id = "saybtn";
        el1.appendChild(el2);
        el_form.appendChild(el1);

        popup.setContentHTML(newContent.innerHTML);
        $("kerb").checked = true;
        $("osbuser").value = osb.osbLayer.usernameshort;
        $("saybtn").onclick = function() {
                var l = popup.lonlat;
                var t = "";
                l.transform(map.projection,map.displayProjection)
                        /* if ($("osbuser").value == "NoName") {
                           alert(OpenLayers.i18n("Please fill in your name"));
                           return false;
                           } */

                var tmp = "";
                for (var i in types)
                        if ($(i).checked)
                                tmp = i;

                osb.osbLayer.setUserName($("osbuser").value);
                osb.osbLayer.usernameshort = $("osbuser").value;
                osb.osbLayer.createBug(l, t + $("osbtext").value, tmp);
                popup.setContentHTML(OpenLayers.i18n("Thanks for your response, it will be taken into account soon."));
                popup.updateSize();
                return false;
        };

        popup.updateSize();
}

function onPopupClose(evt) {
    if (popup) {
        map.removePopup(popup);
        popup.destroy();
        popup = null;
    }
}

function onFeatureSelect(evt) {
    var l = map.getLonLatFromViewPortPx(evt.xy);

    onPopupClose();
    if (map.zoom < 17) {
        map.setCenter(l, 17);
        return;
    }

    var name;

    popup = new OpenLayers.Popup.FramedCloud("featurePopup",
                             l,
                             new OpenLayers.Size(100,100),
                             "dummy",
                             null, true, onPopupClose);
    popup.updateSize();
    map.addPopup(popup);
    osbug_makeform()
}

function onFeatureUnselect(evt) {
    return;
}

function putAJAXMarker(id, lon, lat, text, closed, subtype)
{
    var comments = text.split(/<hr \/>/);
    for(var i=0; i<comments.length; i++)
        comments[i] = comments[i].replace(/&quot;/g, "\"").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

    putAJAXMarker.bugs[id] = [
        new OpenLayers.LonLat(lon, lat),
        comments,
        closed,
        subtype
    ];
    for(var i=0; i<putAJAXMarker.layers.length; i++)
        putAJAXMarker.layers[i].createMarker(id);
}

putAJAXMarker.layers = [ ];
putAJAXMarker.bugs = { };

function init() {
    brokenContentSize = $("content").offsetWidth == 0;
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    OpenLayers.Util.onImageLoadErrorColor = "transparent";
    OpenLayers.Control.Permalink.prototype.updateLink = function() {
        var href = this.base;
        if (href.indexOf('#') != -1) {
            href = href.substring( 0, href.indexOf('#') );
        }
        if (href.indexOf('?') != -1) {
            href = href.substring( 0, href.indexOf('?') );
        }

        var query = OpenLayers.Util.getParameterString(this.createParams());
        if (query != "") query = "?" + query;

        href += query;
        if (this.hash)
                href += this.hash;

        this.element.href = href;
    }

    if (!location.hash) {
        //location.hash="#";
    }

    var options = {
        projection: new OpenLayers.Projection("EPSG:900913"),
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        units: "m",
        numZoomLevels: 18,
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(-20037508, -20037508,
                                         20037508, 20037508.34),
        controls: [
          new OpenLayers.Control.MouseDefaults(), 
          new OpenLayers.Control.PanZoomBar(), 
          new OpenLayers.Control.Attribution(), 
          new OpenLayers.Control.ScaleLine(), 
          new OpenLayers.Control.MousePosition(),
          new OpenLayers.Control.LayerSwitcher(),
          new OpenLayers.Control.Permalink(null, null, {"hash": document.location.hash})
//          new OpenLayers.Control.Permalink("editlink", "http://openstreetmap.org/edit", {"hash": document.location.hash}),
//          new OpenLayers.Control.Permalink("mini", "http://latlon.org/", {"hash": document.location.hash}),
//          new OpenLayers.Control.Permalink("maxi", "http://latlon.org/maxi", {"hash": document.location.hash}),
//          new OpenLayers.Control.Permalink("transport", "http://latlon.org/pt", {"hash": document.location.hash}),
//          new OpenLayers.Control.Permalink("sketchlink", "http://latlon.org/sketch", {"hash": document.location.hash}),
        ]
    };

    map = new OpenLayers.Map('map', options);
    belmapnik = new OpenLayers.Layer.OSM("LatLon Belarusian", "http://tile.latlon.org/tiles/${z}/${x}/${y}.png");
    var mapnik = new OpenLayers.Layer.OSM();
    var date = new Date();
//    cops = new OpenLayers.Layer.OSM("Traffic calming", "http://91.208.39.18/cops/${z}/${x}/${y}.png?" + date.getTime(), {numZoomLevels: 19,  isBaseLayer: false,  type: 'png', splayOutsideMaxExtent: true, visibility: true});

    //new OpenLayers.Layer.Markers("Cafés");
    markers = new OpenLayers.Layer.Markers("Markers");

    var iconClosed = new OpenLayers.Icon("http://osb/images/closed_bug_marker.png", new OpenLayers.Size(22, 22), new OpenLayers.Pixel(-11, -11));
    var iconOpen = new OpenLayers.Icon("http://osb/images/open_bug_marker.png", new OpenLayers.Size(22, 22), new OpenLayers.Pixel(-11, -11));
    var iconKerb = new OpenLayers.Icon("http://osb/images/icon-border.png", new OpenLayers.Size(22, 22), new OpenLayers.Pixel(-11, -11));
    var iconCars = new OpenLayers.Icon("http://osb/images/carparking32.png", new OpenLayers.Size(36, 32), new OpenLayers.Pixel(-18, -21));
    var iconPedestrians = new OpenLayers.Icon("http://osb/images/old_folks32.png", new OpenLayers.Size(36, 32), new OpenLayers.Pixel(-18, -21));
    var iconStairs = new OpenLayers.Icon("http://osb/images/stairs32.png", new OpenLayers.Size(36, 32), new OpenLayers.Pixel(-18, -21));
    var iconDogs = new OpenLayers.Icon("http://osb/images/dog32.png", new OpenLayers.Size(36, 32), new OpenLayers.Pixel(-18, -21));
    var iconRoughRoad = new OpenLayers.Icon("http://osb/images/rough-road32.png", new OpenLayers.Size(36, 32), new OpenLayers.Pixel(-18, -21));

    var subtypeIcons = {
            "kerb": iconKerb,
            "parked cars": iconCars,
            "pedestrians": iconPedestrians,
            "stairs": iconStairs,
            "dogs": iconDogs,
            "rough road": iconRoughRoad
    };

    var osbLayer = new OpenLayers.Layer.OpenStreetBugs("OpenStreetBugs", { serverURL: "http://osb/api/0.1/", permalinkURL: "http://osb/", theme: "/css/openstreetbugs.css", iconOpen: iconOpen, iconClosed: iconClosed, subtypeIcons: subtypeIcons});
    osb = new OpenLayers.Control.OpenStreetBugs(osbLayer);
    map.addLayers([belmapnik, mapnik, markers, osbLayer]);
    //map.addLayers([osbLayer]);
    //cafes.preFeatureInsert = style_osm_feature; 

    selectControl = new OpenLayers.Control.Click(osbLayer, {"click": onFeatureSelect}, {"single": true, "double": false, "pixelTolerance": 0, "stopSingle": false, "stopDouble": false});
    selectControl.click = onFeatureSelect;
    map.addControl(selectControl);
    selectControl.activate();

    if (!map.getCenter()) {
        var lonlat, zoom;
        if (OpenLayers.Util.getParameters().mlon == null) {
            lonlat = new OpenLayers.LonLat(27.56813, 53.90313);
            zoom = 12;
        } else {
            lonlat = new OpenLayers.LonLat(OpenLayers.Util.getParameters().mlon,OpenLayers.Util.getParameters().mlat);
            if (OpenLayers.Util.getParameters().zoom == null) {
                zoom = 17;
            } else {
                zoom = OpenLayers.Util.getParameters().zoom;
            }
            markers.addMarker(new OpenLayers.Marker(lonlat));
        }
        lonlat.transform(map.displayProjection,map.projection);
        map.setCenter(lonlat, zoom);
        map.panTo(lonlat);
    }

    openSidebar({width: "20%"});
    handleResize();

    window.onload = handleResize;
    window.onresize = handleResize;

    var sorry = document.createElement("div");
    sorry.innerHTML = OpenLayers.i18n("New obstacles can be added on zoom level 17 or greater");
    sorry.id = "sorry";
    document.body.insertBefore(sorry, $("content"));
}


OpenLayers.Lang.ru = OpenLayers.Util.extend(OpenLayers.Lang.ru, {
    "Say": "Сообщить",
    "Your message:": "Комментарий",
    "Type:": "Вид:",
    "Your name:": "Представьтесь:",
    "NoName": "Кто-то",
    "Please fill in your name": "Представьтесь, пожалуйста",
    "Comment is required": "Впишите, пожалуйста, комментарий",
    "Something's wrong": "Другое",
    "Description": "Описание",
    "Comment": "Комментарий",
    "Permalink": "Постоянная ссылка",
    "Zoom": "Приблизить",
    "Unresolved Problem": "Существующая проблема",
    "Fixed Problem": "Исправленная проблема",
    "Change": "Изменить",
    "Nickname": "Представьтесь",
    "Kerb" : "Бордюр",
    "kerb" : "бордюр",
    "Parked cars" : "Машины на тротуаре",
    "parked cars" : "машины на тротуаре",
    "Pedestrians" : "Пешеходы",
    "pedestrians" : "пешеходы",
    "Stairs" : "Ступеньки",
    "stairs" : "ступеньки",
    "Dogs" : "Собаки",
    "dogs" : "собаки",
    "rough road" : "дефекты покрытия",
    "Rough road" : "Дефекты покрытия",
    "Mark as fixed" : "Пометить как исправленное",
    "Add comment" : "Добавить комментарий",
    "Cancel" : "Отмена",
    "New obstacles can be added on zoom level 17 or greater": "Добавлять сведения можно только на максимальном уровне детализации"
});

OpenLayers.Lang.be = OpenLayers.Util.extend(OpenLayers.Lang.be, {
    "Say": "Паведаміць",
    "Your message:": "Каментар",
    "Type:": "Тып:",
    "Your name:": "Вашае імя:",
    "NoName": "Нехта",
    "Please fill in your name": "Калі ласка, пазначце вашае імя",
    "Comment is required": "Каментар абавязковы, напішыце яго, калі ласка",
    "Something's wrong": "Іншае",
    "Description": "Апісанне",
    "Comment": "Каментар",
    "Permalink": "Сталая спасылка",
    "Zoom": "Наблізіць",
    "Unresolved Problem": "Існуючая праблема",
    "Fixed Problem": "Выпраўленая праблема",
    "Change": "Змяніць/закрыць",
    "Nickname": "Мянушка",
    "Kerb" : "Бардзюр",
    "kerb" : "бардзюр",
    "Parked cars" : "Машыны на ходніку",
    "parked cars" : "машыны на ходніку",
    "Pedestrians" : "Пешаходы",
    "pedestrians" : "пешаходы",
    "Stairs" : "Прыступкі",
    "stairs" : "прыступкі",
    "Dogs" : "Сабакі",
    "dogs" : "сабакі",
    "rough road" : "дэфекты пакрыцця",
    "Rough road" : "Дэфекты пакрыцця",
    "Mark as fixed" : "Пазначыць як выпраўленае",
    "Add comment" : "Дадаць каментар",
    "Cancel" : "Скасаваць",
    "New obstacles can be added on zoom level 17 or greater": "Дадаваць звесткі можна толькі на максімальным узроўні дэталізацыі"
});

