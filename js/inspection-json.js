function init() {
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
	    getColor: function(feature) {
		    if (feature.attributes.height > 50)
			    return "#ff0000";
		    else if (feature.attributes.height > 0)
			    return "#ffff00";
		    else
			    return "#00ff00";
	    },
	    kerbHeight: function(feature) {
		    return feature.attributes.height;
	    }
    };

    var styles = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
		pointRadius: 5,
		fillColor: "${getColor}",
		strokeWidth: 0,
		label: "${kerbHeight}",
		labelYOffset: 15,
		fontSize: "12px",
		fontColor: "#FF550000"
	}, {
		context: context
	}),
        'select': new OpenLayers.Style(),
        'temporary': new OpenLayers.Style()
    });

    var testLayer = new OpenLayers.Layer.Vector("test", {
        projection: new OpenLayers.Projection("EPSG:4326"),
	styleMap: styles,
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP({
            url: "/inspection.json",
            format: new OpenLayers.Format.GeoJSON()
        })});

    map.addLayers([belmapnik, mapnik, testLayer]);


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

    handleResize();

    window.onload = handleResize;
    window.onresize = handleResize;
}
