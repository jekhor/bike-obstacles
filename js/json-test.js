function init() {
//    OpenLayers.ProxyHost = "/api/0.1/proxy.cgi?url=";
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    OpenLayers.Util.onImageLoadErrorColor = "transparent";

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
            ]
    };

    map = new OpenLayers.Map('map', options);
    belmapnik = new OpenLayers.Layer.OSM("LatLon Belarusian", "http://tile.latlon.org/tiles/${z}/${x}/${y}.png");
    var mapnik = new OpenLayers.Layer.OSM();

    var context = {
        getOpacity: function(feature) {
            if (feature.cluster)
                return 0.6;

            if (feature.fid == null)
                return 0.2;
            else
                return 1;
        }
    };

    style = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            'pointRadius' : 10,
            'graphicOpacity': "${getOpacity}"
        }, {
            'context': context
        }),
        'select': new OpenLayers.Style({
            'pointRadius' : 20,
            'graphicOpacity': "${getOpacity}"
        }, {
            'context': context
        }),
        'temporary': new OpenLayers.Style({
            'pointRadius' : 20,
            'graphicOpacity': "${getOpacity}"
        }, {
            'context': context
        })
    });

    var style_lookup = {
        'kerb' : {'externalGraphic': '/images/kerb16.png', 'pointRadius': 6},
        'parked cars': {'externalGraphic': '/images/carparking32.png'},
        'pedestrians': {'externalGraphic': '/images/old_folks32.png'},
        'stairs': {'externalGraphic': '/images/stairs32.png'},
        'dogs': {'externalGraphic': '/images/dog32.png'},
        'rough road': {'externalGraphic': '/images/rough-road32.png'},
        'other': {'externalGraphic': '/images/open_bug_marker.png', 'pointRadius': 8},
    };

    var style_lookup_closed = {
        1 : {'externalGraphic': '/images/closed_bug_marker.png', 'pointRadius': 8},
    };

    var style_lookup_closed_highlight = {
        1 : {'externalGraphic': '/images/closed_bug_marker.png', 'pointRadius': 15},
    };

    var style_lookup_highlight = {
        'kerb' : {'externalGraphic': '/images/kerb16.png', 'pointRadius': 12},
        'parked cars': {'externalGraphic': '/images/carparking32.png'},
        'pedestrians': {'externalGraphic': '/images/old_folks32.png'},
        'stairs': {'externalGraphic': '/images/stairs32.png'},
        'dogs': {'externalGraphic': '/images/dog32.png'},
        'rough road': {'externalGraphic': '/images/rough-road32.png'},
        'other': {'externalGraphic': '/images/open_bug_marker.png', 'pointRadius': 15},
    };

    style.addUniqueValueRules("default", "subtype", style_lookup);
    style.addUniqueValueRules("default", "type", style_lookup_closed);
    style.addUniqueValueRules("temporary", "subtype", style_lookup_highlight);
    style.addUniqueValueRules("temporary", "type", style_lookup_closed_highlight);
    style.addUniqueValueRules("select", "subtype", style_lookup_highlight);
    style.addUniqueValueRules("select", "type", style_lookup_closed_highlight);


    var bikeObstacles = new OpenLayers.Layer.BikeObstacles("Bike Obstacles", {
        permalinkURL: "http://osb/",
        theme: "/css/openstreetbugs.css",
        styleMap: style
        });
    
    map.addLayers([belmapnik, mapnik, bikeObstacles]);

    var highlightCtrl = new OpenLayers.Control.SelectFeature(bikeObstacles, {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary",
        eventListeners: {
            featurehighlighted: bikeObstacles.featureHighlighted,
            featureunhighlighted: bikeObstacles.featureUnhighlighted
        }
    });

    var selectCtrl = new OpenLayers.Control.SelectFeature(bikeObstacles,
        {
            clickout: false,
            multiple: true,
            toggle: true,
            renderIntent: "select"
        }
    );

    selectCtrl.onSelect = bikeObstacles.featureSelect;
    selectCtrl.onUnselect = bikeObstacles.featureUnselect;

    var edit = new OpenLayers.Control.ModifyFeature(bikeObstacles, {
        title: "Modify Feature",
        displayClass: "olControlModifyFeature"
    });

    osbCtrl = new OpenLayers.Control.OpenStreetBugs(bikeObstacles);

    map.addControl(highlightCtrl);
    highlightCtrl.activate();

    map.addControl(selectCtrl);
    selectCtrl.activate();

    map.addControl(osbCtrl);
    osbCtrl.activate();

//    map.addControl(edit);
//    edit.activate();

/*
    var bugs = new OpenLayers.Layer.Vector("Bugs", {
        projection: new OpenLayers.Projection("EPSG:4326"),
        strategies: [new OpenLayers.Strategy.Fixed()],
        //	strategies: [new OpenLayers.Strategy.Fixed(), new OpenLayers.Strategy.Cluster()],
        protocol: new OpenLayers.Protocol.HTTP({
            url: "/api/0.2/getBugs.rb",
        format: new OpenLayers.Format.GeoJSON()
        }),
        styleMap: style,
    });


    map.addLayers([belmapnik, mapnik, bugs]);

    var report = function(e) {
        OpenLayers.Console.log(e.type, e.feature.id);
    };

    function setPopupContent(feature) {
        var closed = (feature.attributes['type'] == 1);

        var newContent = document.createElement("div");

        el1 = document.createElement("h3");
        el1.appendChild(document.createTextNode(closed ? OpenLayers.i18n("Fixed Problem") : OpenLayers.i18n("Unresolved Problem")));

        el1.appendChild(document.createTextNode(" ["));
        el2 = document.createElement("a");
        el2.href = "#";
        el2.onclick = function(){ layer.map.setCenter(feature.lonlat.clone().transform(layer.apiProjection, layer.map.getProjectionObject()), 15); };
        el2.appendChild(document.createTextNode(OpenLayers.i18n("Zoom")));
        el1.appendChild(el2);
        el1.appendChild(document.createTextNode("]"));

        newContent.appendChild(el1);
        feature.data.popupContentHTML = newContent;
    };

    var selectedFeature;

    function featureHighlighted(e) {
        f = e.feature;

        var popup = new OpenLayers.Popup.FramedCloud("info_popup", f.lonlat, 
        setPopupContent(e.feature);
        map.addPopup(popup);
    };

    function onFeatureUnhighlighted(e) {
        map.removePopup(e.feature.popup);
        e.feature.destroyPopup();
    }

    var highlightCtrl = new OpenLayers.Control.SelectFeature(bugs, {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary",
        eventListeners: {
            beforefeaturehighlighted: report,
            featurehighlighted: featureHighlighted,
            featureunhighlighted: onFeatureUnhighlighted
        }
    });


    map.addControl(highlightCtrl);
    highlightCtrl.activate();
*/

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
    "Parked cars" : "припаркованные машины",
    "parked cars" : "припаркованные машины",
    "Pedestrians" : "Пешеходы",
    "pedestrians" : "пешеходы",
    "Stairs" : "Ступеньки",
    "stairs" : "ступеньки",
    "Dogs" : "Собаки",
    "dogs" : "собаки",
    "rough road" : "дефекты покрытия",
    "Rough road" : "Дефекты покрытия",
    "Mark as fixed" : "Пометить как исправленное",
    "Remove" : "Удалить",
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
    "Parked cars" : "Прыпаркаваныя машыны",
    "parked cars" : "прыпаркаваныя машыны",
    "Pedestrians" : "Пешаходы",
    "pedestrians" : "пешаходы",
    "Stairs" : "Прыступкі",
    "stairs" : "прыступкі",
    "Dogs" : "Сабакі",
    "dogs" : "сабакі",
    "rough road" : "дэфекты пакрыцця",
    "Rough road" : "Дэфекты пакрыцця",
    "Mark as fixed" : "Пазначыць як выпраўленае",
    "Remove" : "Выдаліць",
    "Add comment" : "Дадаць каментар",
    "Cancel" : "Скасаваць",
    "New obstacles can be added on zoom level 17 or greater": "Дадаваць звесткі можна толькі на максімальным узроўні дэталізацыі"
});

