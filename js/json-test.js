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
    var yasat = new OpenLayers.Layer.XYZ("Яндекс.Карты", "http://wms.latlon.org/?request=GetTile&layers=yasat&x=${x}&y=${y}&z=${z}", {
	 	numZoomLevels: 19,
		isBaseLayer: true,
		type: 'png',
		attribution: "Yandex maps (maps.yandex.ru)"
	});

    var context = {
        getOpacity: function(feature) {
            if (feature.cluster)
                return 0.6;

            if (feature.fid == null)
                return 0.2;
            else
                return 1;
        },
        isClustered: function(feature) {
	        if (feature.cluster)
                return true;
            else
                return false;
	},
	clusterRadius: function(feature)
	{
		return (feature.cluster != null) ? feature.attributes.count + 4 : 4;
	}
    };

    style = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style(),
        'select': new OpenLayers.Style(),
        'temporary': new OpenLayers.Style()
    });

    var normal_style_lookup = {
	'type_0.subtype_kerb.cluster_false': {'externalGraphic': '/images/icons/dot10.png', 'pointRadius': 5, 'graphicOpacity': 0.8},
	'type_0.subtype_kerb.cluster_true': {'externalGraphic': '/images/icons/dot14.png',  'pointRadius': 7, 'graphicOpacity': 0.6},
	'type_0.subtype_parked cars.cluster_false': {'externalGraphic': '/images/carparking32.png', 'pointRadius': 10, 'graphicOpacity': 0.8},
	'type_0.subtype_parked cars.cluster_true': {'externalGraphic': '/images/carparking32.png', 'pointRadius': 13, 'graphicOpacity': 0.6},
	'type_0.subtype_pedestrians.cluster_false': {'externalGraphic': '/images/old_folks32.png', 'pointRadius': 10, 'graphicOpacity': 0.8},
	'type_0.subtype_pedestrians.cluster_true': {'externalGraphic': '/images/old_folks32.png', 'pointRadius': 13, 'graphicOpacity': 0.6},
	'type_0.subtype_stairs.cluster_false': {'externalGraphic': '/images/stairs32.png', 'pointRadius': 10, 'graphicOpacity': 0.8},
	'type_0.subtype_stairs.cluster_true': {'externalGraphic': '/images/stairs32.png', 'pointRadius': 13, 'graphicOpacity': 0.6},
	'type_0.subtype_dogs.cluster_false': {'externalGraphic': '/images/dog32.png', 'pointRadius': 10, 'graphicOpacity': 0.8},
	'type_0.subtype_dogs.cluster_true': {'externalGraphic': '/images/dog32.png', 'pointRadius': 13, 'graphicOpacity': 0.6},
	'type_0.subtype_rough road.cluster_false': {'externalGraphic': '/images/rough-road32.png', 'pointRadius': 10, 'graphicOpacity': 0.8},
	'type_0.subtype_rough road.cluster_true': {'externalGraphic': '/images/rough-road32.png', 'pointRadius': 13, 'graphicOpacity': 0.6},
	'type_0.subtype_other.cluster_false': {'externalGraphic': '/images/open_bug_marker.png', 'pointRadius': 8, 'graphicOpacity': 0.8},
	'type_0.subtype_other.cluster_true': {'externalGraphic': '/images/open_bug_marker.png', 'pointRadius': 10, 'graphicOpacity': 0.6}
    };

    var highlight_style_lookup = {
	'type_0.subtype_kerb.cluster_false': {'externalGraphic': '/images/icons/dot20.png', 'pointRadius': 10, 'graphicOpacity': 1},
	'type_0.subtype_kerb.cluster_true': {'externalGraphic': '/images/icons/dot28.png', 'pointRadius': 14, 'graphicOpacity': 0.6},
	'type_0.subtype_parked cars.cluster_false': {'externalGraphic': '/images/carparking32.png', 'pointRadius': 20, 'graphicOpacity': 1},
	'type_0.subtype_parked cars.cluster_true': {'externalGraphic': '/images/carparking32.png', 'pointRadius': 20, 'graphicOpacity': 0.6},
	'type_0.subtype_pedestrians.cluster_false': {'externalGraphic': '/images/old_folks32.png', 'pointRadius': 20, 'graphicOpacity': 1},
	'type_0.subtype_pedestrians.cluster_true': {'externalGraphic': '/images/old_folks32.png', 'pointRadius': 20, 'graphicOpacity': 0.6},
	'type_0.subtype_stairs.cluster_false': {'externalGraphic': '/images/stairs32.png', 'pointRadius': 20, 'graphicOpacity': 1},
	'type_0.subtype_stairs.cluster_true': {'externalGraphic': '/images/stairs32.png', 'pointRadius': 20, 'graphicOpacity': 0.6},
	'type_0.subtype_dogs.cluster_false': {'externalGraphic': '/images/dog32.png', 'pointRadius': 20, 'graphicOpacity': 1},
	'type_0.subtype_dogs.cluster_true': {'externalGraphic': '/images/dog32.png', 'pointRadius': 20, 'graphicOpacity': 0.6},
	'type_0.subtype_rough road.cluster_false': {'externalGraphic': '/images/rough-road32.png', 'pointRadius': 20, 'graphicOpacity': 1},
	'type_0.subtype_rough road.cluster_true': {'externalGraphic': '/images/rough-road32.png', 'pointRadius': 20, 'graphicOpacity': 0.6},
	'type_0.subtype_other.cluster_false': {'externalGraphic': '/images/open_bug_marker.png', 'pointRadius': 8, 'graphicOpacity': 1},
	'type_0.subtype_other.cluster_true': {'externalGraphic': '/images/open_bug_marker.png', 'pointRadius': 8, 'graphicOpacity': 0.6}
    };


    var style_lookup_closed = {
        1 : {'externalGraphic': '/images/closed_bug_marker.png', 'pointRadius': 8, 'graphicOpacity': 0.8},
    };

    var style_lookup_closed_highlight = {
	    1 : {'externalGraphic': '/images/closed_bug_marker.png', 'pointRadius': 16, 'graphicOpacity': 0.8},
    };

    var ruleContext = function(feature) {
	    return {
		    styleKey: "type_" + feature.attributes['type'] +
		    ".subtype_" + feature.attributes['subtype'] +
		    ".cluster_" + (feature.cluster != null)
	    };
    };

    style.addUniqueValueRules("default", "type", style_lookup_closed);
    style.addUniqueValueRules("default", "styleKey", normal_style_lookup, ruleContext);
    style.addUniqueValueRules("temporary", "type", style_lookup_closed_highlight);
    style.addUniqueValueRules("temporary", "styleKey", highlight_style_lookup, ruleContext);
    style.addUniqueValueRules("select", "styleKey", highlight_style_lookup, ruleContext);
    style.addUniqueValueRules("select", "type", style_lookup_closed_highlight);


    var bikeObstacles = new OpenLayers.Layer.BikeObstacles("Bike Obstacles", {
        permalinkURL: "http://osb/",
        theme: "/css/openstreetbugs.css",
        styleMap: style
        });
    
    map.addLayers([belmapnik, mapnik, yasat, bikeObstacles]);

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
}


