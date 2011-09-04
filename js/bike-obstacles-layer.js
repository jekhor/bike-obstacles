/*
	This OpenStreetBugs client is free software: you can redistribute it
	and/or modify it under the terms of the GNU Affero General Public License
	as published by the Free Software Foundation, either version 3 of the
	License, or (at your option) any later version.

	This file is distributed in the hope that it will be useful, but
	WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
	or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
	License <http://www.gnu.org/licenses/> for more details.
*/

document.write('<script src="js/strategy-cluster-extended.js" type="text/javascript"></script>');

/**
 * A fully functional OpenStreetBugs layer. See http://openstreetbugs.schokokeks.org/.
 * Even though the OpenStreetBugs API originally does not intend this, you can create multiple instances of this Layer and add them to different maps (or to one single map for whatever crazy reason) without problems.
*/

OpenLayers.Layer.BikeObstacles = new OpenLayers.Class(OpenLayers.Layer.Vector, {
	/**
	 * The URL of the OpenStreetBugs API.
	 * @var String
	*/
	apiURL : "/api/0.2",

	/**
	 * Associative array (index: bug ID) that is filled with the bugs loaded in this layer
	 * @var String
	*/
	bugs : { },

	/**
	 * The username to be used to change or create bugs on OpenStreetBugs
	 * @var String
	*/
	username : "NoName",

	/**
	 * If this is set to true, the user may not commit comments or close bugs.
	 * @var Boolean
	*/
	readonly : false,

	/**
	 * When the layer is hidden, all open popups are stored in this array in order to be re-opened again when the layer is made visible again.
	*/
	reopenPopups : [ ],

	/**
	 * The user name will be saved in a cookie if this isn’t set to false.
	 * @var Boolean
	*/
	setCookie : true,

	/**
	 * The lifetime of the user name cookie in days.
	 * @var Number
	*/
	cookieLifetime : 1000,

	/**
	 * The path where the cookie will be available on this server.
	 * @var String
	*/
	cookiePath : null,

	/**
	 * A URL to append lon=123&lat=123&zoom=123 for the Permalinks.
	 * @var String
	*/
	permalinkURL : "http://www.openstreetmap.org/",

	/**
	 * A CSS file to be included. Set to null if you don’t need this.
	 * @var String
	*/
	theme : "http://osm.cdauth.eu/openstreetbugs/openstreetbugs.css",

    onSuccessSave: function(evt) {
        var features = evt['response'].reqFeatures;

        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            feature = feature._original || feature;
            this.drawFeature(feature);
        }
    },
	/**
	 * @param String name
	*/
    initialize : function(name, options)
    {
        var saveStrategy = new OpenLayers.Strategy.Save({
            auto: true
        });

        saveStrategy.events.on({
            'success': this.onSuccessSave,
            scope: this
        });

        var clusterStrategy = new OpenLayers.Strategy.AttributesCluster({
            attributes: ['subtype', 'type'],
            threshold: 2,
            distance: 16,
            maxZoom: 16
        });

        OpenLayers.Layer.Vector.prototype.initialize.apply(this, [ name, OpenLayers.Util.extend({
            projection: new OpenLayers.Projection("EPSG:4326"),
            strategies: [new OpenLayers.Strategy.BBOX(), clusterStrategy, saveStrategy],
            protocol: new OpenLayers.Protocol.HTTP({
                url: this.apiURL + "/bugs.rb",
                format: new OpenLayers.Format.GeoJSON()
            })}, options) ]);

// TODO
//		this.events.register("visibilitychanged", this, this.updatePopupVisibility);

		var cookies = document.cookie.split(/;\s*/);
		for(var i=0; i<cookies.length; i++)
		{
			var cookie = cookies[i].split("=");
			if(cookie[0] == "osbUsername")
			{
				this.username = decodeURIComponent(cookie[1]);
				break;
			}
		}

		/* Copied from OpenLayers.Map */
		if(this.theme) {
            // check existing links for equivalent url
            var addNode = true;
            var nodes = document.getElementsByTagName('link');
            for(var i=0, len=nodes.length; i<len; ++i) {
                if(OpenLayers.Util.isEquivalentUrl(nodes.item(i).href,
                                                   this.theme)) {
                    addNode = false;
                    break;
                }
            }
            // only add a new node if one with an equivalent url hasn't already
            // been added
            if(addNode) {
                var cssNode = document.createElement('link');
                cssNode.setAttribute('rel', 'stylesheet');
                cssNode.setAttribute('type', 'text/css');
                cssNode.setAttribute('href', this.theme);
                document.getElementsByTagName('head')[0].appendChild(cssNode);
            }
        }
	},

	/**
	 * Is automatically called when the visibility of the layer changes. When the layer is hidden, all visible popups
	 * are closed and their visibility is saved. When the layer is made visible again, these popups are re-opened.
	*/
        /* TODO
	updatePopupVisibility : function()
	{
		if(this.getVisibility())
		{
			for(var i=0; i<this.reopenPopups.length; i++)
				this.reopenPopups[i].show();
			this.reopenPopups = [ ];
		}
		else
		{
			for(var i=0; i<this.markers.length; i++)
			{
				if(this.markers[i].feature.popup && this.markers[i].feature.popup.visible())
				{
					this.markers[i].feature.popup.hide();
					this.reopenPopups.push(this.markers[i].feature.popup);
				}
			}
		}
	},
*/
	/**
	 * Sets the user name to be used for interactions with OpenStreetBugs.
	*/
	setUserName : function(username)
	{
		if(this.username == username)
			return;

		this.username = username;

		if(this.setCookie)
		{
			var cookie = "osbUsername="+encodeURIComponent(username);
			if(this.cookieLifetime)
				cookie += ";expires="+(new Date((new Date()).getTime() + this.cookieLifetime*86400000)).toGMTString();
			if(this.cookiePath)
				cookie += ";path="+this.cookiePath;
			document.cookie = cookie;
		}

        /* TODO
		for(var i=0; i<this.markers.length; i++)
		{
			if(!this.markers[i].feature.popup) continue;
			var els = this.markers[i].feature.popup.contentDom.getElementsByTagName("input");
			for(var j=0; j<els.length; j++)
			{
				if(els[j].className != "osbUsername") continue;
				els[j].value = username;
			}
		}
        */
	},

	/**
	 * Returns the currently set username or “NoName” if none is set.
	*/

	getUserName : function()
	{
		if(this.username)
			return this.username;
		else
			return "NoName";
	},

	/**
	 * Rounds the given number to the given number of digits after the floating point.
	 * @param Number number
	 * @param Number digits
	 * @return Number
	*/
	round : function(number, digits)
	{
		var factor = Math.pow(10, digits);
		return Math.round(number*factor)/factor;
	},

	/**
	 * Recreates the content of the popup of a marker.
	 * @param Number id The bug ID
	*/

	setPopupContent: function(feature) {
        if (!feature.popup)
            return;

		var el1,el2,el3;
		var layer = this;

		var subtypeText = OpenLayers.i18n(feature.attributes['subtype']);
        var closed = (feature.attributes['type'] == 1);

		var newContent = document.createElement("div");

		el1 = document.createElement("h3");
		el1.appendChild(document.createTextNode(closed ? OpenLayers.i18n("Fixed Problem") : OpenLayers.i18n("Unresolved Problem")));

		el1.appendChild(document.createTextNode(" ["));
		el2 = document.createElement("a");
		el2.href = "#";
		el2.onclick = function(){ layer.map.setCenter(feature.lonlat.clone().transform(layer.projection, layer.map.getProjectionObject()), 15); };
		el2.appendChild(document.createTextNode(OpenLayers.i18n("Zoom")));
		el1.appendChild(el2);
		el1.appendChild(document.createTextNode("]"));

		if(this.permalinkURL)
		{
			el1.appendChild(document.createTextNode(" ["));
			el2 = document.createElement("a");
			el2.href = this.permalinkURL + (this.permalinkURL.indexOf("?") == -1 ? "?" : "&") + "lon="+feature.lonlat.lon+"&lat="+feature.lonlat.lat+"&zoom=15";
			el2.appendChild(document.createTextNode(OpenLayers.i18n("Permalink")));
			el1.appendChild(el2);
			el1.appendChild(document.createTextNode("]"));
		}
		newContent.appendChild(el1);

		el1 = document.createElement("p");
//		el2 = document.createElement("img");
//		el2.src = icon.url;
//		if (putAJAXMarker.bugs[id][3] != null)
//			el2.alt = OpenLayers.i18n(subtypeText);

//		el1.appendChild(el2);
//		el1.appendChild(document.createElement("br"));
		el1.appendChild(document.createTextNode(subtypeText));
		newContent.appendChild(el1);


		var containerDescription = document.createElement("div");
		newContent.appendChild(containerDescription);

		var containerChange = document.createElement("div");
		newContent.appendChild(containerChange);

		var displayDescription = function(){
			containerDescription.style.display = "block";
			containerChange.style.display = "none";
			feature.popup.updateSize();
		};
		var displayChange = function(){
			containerDescription.style.display = "none";
			containerChange.style.display = "block";
			feature.popup.updateSize();
		};
		displayDescription();

		el1 = document.createElement("dl");
		for(var i = 0; i < feature.attributes['comments'].length; i++)
		{
			el2 = document.createElement("dt");
			el2.className = (i == 0 ? "osb-description" : "osb-comment");
			el2.appendChild(document.createTextNode(i == 0 ? OpenLayers.i18n("Description") : OpenLayers.i18n("Comment")));
			el1.appendChild(el2);
			el2 = document.createElement("dd");
			el2.className = (i == 0 ? "osb-description" : "osb-comment");
			el2.appendChild(document.createTextNode(feature.attributes['comments'][i]));
			el1.appendChild(el2);
		}
		containerDescription.appendChild(el1);

		if(feature.attributes['type'] == 1)
		{
			el1 = document.createElement("p");
			el1.className = "osb-fixed";
			el2 = document.createElement("em");
			el2.appendChild(document.createTextNode(OpenLayers.i18n("Has been fixed.")));
			el1.appendChild(el2);
			containerDescription.appendChild(el1);
            el1 = document.createElement("input");
            el1.setAttribute("type", "button");
            el1.value = OpenLayers.i18n("Reopen");
            el1.onclick = function() {layer.reopenBug(feature); layer.hidePopup(feature); return false; };
            containerDescription.appendChild(el1);
		}
		else if(!this.readonly)
		{
			el1 = document.createElement("div");
			el2 = document.createElement("input");
			el2.setAttribute("type", "button");
			el2.onclick = function(){ displayChange(); };
			el2.value = OpenLayers.i18n("Change");
			el1.appendChild(el2);
			containerDescription.appendChild(el1);

			var el_form = document.createElement("form");
			el_form.onsubmit = function(){ if(inputComment.value.match(/^\s*$/)) return false; layer.submitComment(feature, inputComment.value); layer.hidePopup(feature); return false; };

			el1 = document.createElement("dl");
			el2 = document.createElement("dt");
			el2.appendChild(document.createTextNode(OpenLayers.i18n("Nickname")));
			el1.appendChild(el2);
			el2 = document.createElement("dd");
			var inputUsername = document.createElement("input");
			inputUsername.value = this.username;
			inputUsername.className = "osbUsername";
			inputUsername.onkeyup = function(){ layer.setUserName(inputUsername.value); };
			el2.appendChild(inputUsername);
			el1.appendChild(el2);

			el2 = document.createElement("dt");
			el2.appendChild(document.createTextNode(OpenLayers.i18n("Comment")));
			el1.appendChild(el2);
			el2 = document.createElement("dd");
			var inputComment = document.createElement("input");
			el2.appendChild(inputComment);
			el1.appendChild(el2);
			el_form.appendChild(el1);

			el1 = document.createElement("ul");
			el1.className = "buttons";
			el2 = document.createElement("li");
			el3 = document.createElement("input");
			el3.setAttribute("type", "submit");
			el3.value = OpenLayers.i18n("Add comment");
			el2.appendChild(el3);
			el1.appendChild(el2);

			el2 = document.createElement("li");
			el3 = document.createElement("input");
			el3.setAttribute("type", "button");
			el3.onclick = function(){ if (!inputComment.value.match(/^\s*$/)) { layer.closeBug(feature, inputComment.value); layer.hidePopup(feature); return false; } else {inputComment.style.background = 'Yellow'; inputComment.select()}};
			el3.value = OpenLayers.i18n("Mark as fixed");
			el2.appendChild(el3);
			el1.appendChild(el2);
			el_form.appendChild(el1);
			containerChange.appendChild(el_form);

			el2 = document.createElement("li");
			el3 = document.createElement("input");
			el3.setAttribute("type", "button");
			el3.onclick = function(){ if (!inputComment.value.match(/^\s*$/)) { layer.deleteBug(feature, inputComment.value); layer.hidePopup(feature); return false; } else {inputComment.style.background = 'Yellow'; inputComment.select()}};
			el3.value = OpenLayers.i18n("Delete");
			el2.appendChild(el3);
			el1.appendChild(el2);
			el_form.appendChild(el1);
			containerChange.appendChild(el_form);

			el1 = document.createElement("div");
			el2 = document.createElement("input");
			el2.setAttribute("type", "button");
			el2.onclick = function(){ displayDescription(); };
			el2.value = OpenLayers.i18n("Cancel");
			el1.appendChild(el2);
			containerChange.appendChild(el1);
		}

		feature.popup.setContentHTML(newContent);
	},

	/**
	 * Creates a new bug.
	 * @param OpenLayers.LonLat lonlat The coordinates in the API projection.
	 * @param String description
	*/
	createBug: function(lonlat, description, subtype) {
        var g = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
        var f = new OpenLayers.Feature.Vector(g, {
            'comments': [description + " [" + this.getUserName() + ", " + new Date() + "]"],
            'subtype': subtype,
            'type': 0
        });
        f.state = OpenLayers.State.INSERT;
        this.addFeatures([f]);
	},

	/**
	 * Adds a comment to a bug.
	 * @param Number id
	 * @param String comment
	*/
	submitComment: function(feature, comment) {
        feature.attributes['comments'].push(comment + " [" + this.getUserName() + ", " + new Date() + "]");
        feature.state = OpenLayers.State.UPDATE;
        this.events.triggerEvent("featuremodified", {feature: feature});
        this.events.triggerEvent("afterfeaturemodified", {feature: feature, modified: true});
	},

	/**
	 * Marks a bug as fixed.
	 * @param Number id
	*/
	closeBug: function(feature, comment) {
        feature.attributes['type'] = 1;
        feature.attributes['comments'].push(OpenLayers.i18n("Fixed: ") + comment + " [" + this.getUserName() + ", " + new Date() + "]");
        feature.state = OpenLayers.State.UPDATE;
        this.events.triggerEvent("featuremodified", {feature: feature});
        this.events.triggerEvent("afterfeaturemodified", {feature: feature, modified: true});
	},

	/**
	 * Marks a bug as open again.
	 * @param Number id
	*/
	reopenBug: function(feature) {
        feature.attributes['type'] = 0;
        feature.attributes['comments'].push(OpenLayers.i18n("Reopened ") + " [" + this.getUserName() + ", " + new Date() + "]");
        feature.state = OpenLayers.State.UPDATE;
        this.events.triggerEvent("featuremodified", {feature: feature});
        this.events.triggerEvent("afterfeaturemodified", {feature: feature, modified: true});
	},

	/**
	 * Mark bug as deleted.
	 * @param Number id
	*/
	deleteBug: function(feature, comment) {
        feature.attributes['comments'].push(OpenLayers.i18n("Deleted: ") + comment + " [" + this.getUserName() + ", " + new Date() + "]");
        feature.state = OpenLayers.State.UPDATE;
        this.events.triggerEvent("featuremodified", {feature: feature});
        this.events.triggerEvent("afterfeaturemodified", {feature: feature, modified: true});
        feature.state = OpenLayers.State.DELETE;
        this.events.triggerEvent("featuremodified", {feature: feature});
        this.events.triggerEvent("afterfeaturemodified", {feature: feature, modified: true});
        this.drawFeature(feature);
	},

	/**
	 * Removes the content of a marker popup (to reduce the amount of needed resources).
	 * @param Number id
	*/
	resetPopupContent: function(feature) {
		if(!feature.popup)
			return;

		feature.popup.setContentHTML(document.createElement("div"));
	},

    onPopupClose: function(feature) {
        feature.layer.resetPopupContent(feature);
        if(feature.osbClicked)
            feature.osbClicked = false;

        if (feature.data.highlightControl) {
            feature.data.highlightControl.unhighlight(feature);
        }
        if (feature.data.selectControl) {
            feature.data.selectControl.unselect(feature);
        }
    },
	/**
	 * Makes the popup of the given marker visible. Makes sure that the popup content is created if it does not exist yet.
	 * @param Number id
	*/
	showPopup: function(feature) {
        if (feature.cluster)
            return;

        var add = null;
        if(!feature.popup)
        {
            feature.popupClass = OpenLayers.Popup.FramedCloud.OpenStreetBugs;
            feature.lonlat = feature.geometry.getBounds().getCenterLonLat();
            add = new OpenLayers.Popup.FramedCloud.OpenStreetBugs(feature.id + "_popup", feature.lonlat, feature.data.popupSize, null, null, true);
            add.panMapIfOutOfView = false;
            add.anchor.size.w = 30;
            add.anchor.size.h = 30;
            add.anchor.offset.x = -15;
            add.anchor.offset.y = -15;
            add.events.register("close", this, function() {this.onPopupClose(feature)});
            feature.popup = add;
        }
		else if(feature.popup.visible())
			return;

		this.setPopupContent(feature);
		if(add)
			this.map.addPopup(add);
		feature.popup.show();
		feature.popup.updateSize();
	},

	/**
	 * Hides the popup of the given marker.
	 * @param Number id
	*/
	hidePopup: function(feature) {
		if(!feature.popup || !feature.popup.visible())
			return;

		feature.popup.hide();
		feature.popup.events.triggerEvent("close");
	},

	/**
	 * Is run on the “click” event of a marker in the context of its OpenLayers.Feature. Toggles the visibility of the popup.
	*/

	featureSelect: function(feature) {
        OpenLayers.Console.log('select', feature.id);
        feature.layer.showPopup(feature);
        feature.data.selectControl = this;
	},

	featureUnselect: function(feature) {
        OpenLayers.Console.log('unselect', feature.id);
        feature.layer.hidePopup(feature);
	},

	/**
	 * Is run on the “mouseover” event of a marker in the context of its OpenLayers.Feature. Makes the popup visible.
	*/
	featureHighlighted: function(e) {
        var feature = e.feature;

        feature.data.highlightControl = this;
        OpenLayers.Console.log(e.type, e.feature.id);
        feature.layer.showPopup(feature);
//		OpenLayers.Event.stop(e);
	},

	/**
	 * Is run on the “mouseout” event of a marker in the context of its OpenLayers.Feature. Hides the popup (if it has not been clicked).
	*/
	featureUnhighlighted: function(e) {
        var feature = e.feature;

        OpenLayers.Console.log(e.type, e.feature.id);
		if(!feature.osbClicked)
			feature.layer.hidePopup(feature);
//		OpenLayers.Event.stop(e);
	},

	CLASS_NAME: "OpenLayers.Layer.OpenStreetBugs"
});


/**
 * An OpenLayers control to create new bugs on mouse clicks on the map. Add an instance of this to your map using
 * the OpenLayers.Map.addControl() method and activate() it.
*/

OpenLayers.Control.OpenStreetBugs = new OpenLayers.Class(OpenLayers.Control, {
	title : null, // See below because of translation call

	/**
	 * The icon to be used for the temporary markers that the “create bug” popup belongs to.
	 * @var OpenLayers.Icon
	*/
//	icon : new OpenLayers.Icon("http://openstreetbugs.schokokeks.org/client/icon_error_add.png", new OpenLayers.Size(22, 22), new OpenLayers.Pixel(-11, -11)),

	/**
	 * An instance of the OpenStreetBugs layer that this control shall be connected to. Is set in the constructor.
	 * @var OpenLayers.Layer.OpenStreetBugs
	*/
	osbLayer : null,

    newBugPopup: null,
	/**
	 * @param OpenLayers.Layer.OpenStreetBugs osbLayer The OpenStreetBugs layer that this control will be connected to.
	*/
	initialize: function(osbLayer, options) {
		this.osbLayer = osbLayer;

		this.title = OpenLayers.i18n("Create OpenStreetBug");

		OpenLayers.Control.prototype.initialize.apply(this, [ options ]);

		this.events.register("activate", this, function() {
			if(!this.osbLayer.getVisibility())
				this.osbLayer.setVisibility(true);
		});

		this.osbLayer.events.register("visibilitychanged", this, function() {
			if(this.active && !this.osbLayer.getVisibility())
				this.osbLayer.setVisibility(true);
		});
	},

	destroy: function() {
		if (this.handler)
			this.handler.destroy();
		this.handler = null;

		OpenLayers.Control.prototype.destroy.apply(this, arguments);
	},

	draw: function() {
		this.handler = new OpenLayers.Handler.Click(this, {'click': this.click}, { 'single': true, 'double': false, 'pixelTolerance': 0, 'stopSingle': false, 'stopDouble': false });
	},

    osbug_makeform: function(popup, osbLayer) {
        var control = this;
        var newContent = document.createElement("div");
        var el1,el2,el3;
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
                if (i == "kerb")
                    obstacleType1.checked = true;
        }

        el1.appendChild(el2);

        el2 = document.createElement("dt");
        el2.appendChild(document.createTextNode(OpenLayers.i18n("Your name:")));
        el1.appendChild(el2);
        el2 = document.createElement("dd");
        var inputUsername = document.createElement("input");
        if (this.osbLayer.usernameshort != null) {
            if (this.osbLayer.usernameshort == "") {
                this.osbLayer.usernameshort = "anonymous";
            }
        } else {
            if (this.osbLayer.username != null) {
                this.osbLayer.usernameshort = this.osbLayer.username;
            }
        }
        if (this.osbLayer.usernameshort == "NoName") {
            this.osbLayer.usernameshort = OpenLayers.i18n("NoName");
        }
        inputUsername.className = "osbUsername";
        inputUsername.id = "osbuser";
        inputUsername.value = this.osbLayer.usernameshort;
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
        el2.onclick = function() {
            var l = popup.lonlat.clone();
            //                l.transform(osbLayer.map.projection, osbLayer.projection)
            /* if ($("osbuser").value == "NoName") {
               alert(OpenLayers.i18n("Please fill in your name"));
               return false;
               } */

            var tmp = "";
            for (var i in types) {
                if ($(i).checked)
                    tmp = i;
            }

            osbLayer.setUserName($("osbuser").value);
            osbLayer.usernameshort = $("osbuser").value;
            osbLayer.createBug(l, $("osbtext").value, tmp);
            //                popup.setContentHTML(OpenLayers.i18n("Thanks for your response, it will be taken into account soon."));
            //                popup.updateSize();
            osbLayer.map.removePopup(popup);
            popup.destroy();
            control.newBugPopup = null;
            return false;
        };
        el1.appendChild(el2);
        el_form.appendChild(el1);

        popup.setContentHTML(newContent);
    },

	/**
	 * Map clicking event handler. Adds a temporary marker with a popup to the map, the popup contains the form to add a bug.
	*/
    click: function(e) {
        if(!this.map) return true;

        if (this.newBugPopup != null) {
            this.map.removePopup(this.newBugPopup);
            this.newBugPopup.destroy;
            this.newBugPopup = null;
        }

        var feature = this.osbLayer.getFeatureFromEvent(e);
        if (feature)
            return true;

        var lonlat = this.map.getLonLatFromViewPortPx(e.xy);
        var lonlatApi = lonlat.clone().transform(this.map.getProjectionObject(), this.osbLayer.projection);
        var popup = new OpenLayers.Popup.FramedCloud.OpenStreetBugs("create_popup", lonlat, null, null, null, true);

        popup.panMapIfOutOfView = false;
        this.newBugPopup = popup;
        this.osbug_makeform(popup, this.osbLayer);
        this.map.addPopup(popup);
        popup.updateSize();
    },

	CLASS_NAME: "OpenLayers.Control.OpenStreetBugs"
});


/**
 * This class changes the usual OpenLayers.Popup.FramedCloud class by using a DOM element instead of an innerHTML string as content for the popup.
 * This is necessary for creating valid onclick handlers that still work with multiple OpenStreetBugs layer objects.
*/

OpenLayers.Popup.FramedCloud.OpenStreetBugs = new OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
	contentDom : null,
	autoSize : true,

	/**
	 * See OpenLayers.Popup.FramedCloud.initialize() for parameters. As fourth parameter, pass a DOM node instead of a string.
	*/
	initialize: function() {
		this.displayClass = this.displayClass + " " + this.CLASS_NAME.replace("OpenLayers.", "ol").replace(/\./g, "");

		var args = new Array(arguments.length);
		for(var i=0; i<arguments.length; i++)
			args[i] = arguments[i];

		// Unset original contentHTML parameter
		args[3] = null;

		var closeCallback = arguments[6];

		// Add close event trigger to the closeBoxCallback parameter
		args[6] = function(e){ if(closeCallback) closeCallback(); else this.hide(); OpenLayers.Event.stop(e); this.events.triggerEvent("close"); };

		OpenLayers.Popup.FramedCloud.prototype.initialize.apply(this, args);

//        this.maxSize.w = 300;
        this.maxSize.h = 600
//        this.minSize.w = 100;
//        this.minSize.h = 100

		this.events.addEventType("close");

		this.setContentHTML(arguments[3]);
	},

	/**
	 * Like OpenLayers.Popup.FramedCloud.setContentHTML(), but takes a DOM element as parameter.
	*/
	setContentHTML: function(contentDom) {
		if(contentDom != null)
			this.contentDom = contentDom;

		if(this.contentDiv == null || this.contentDom == null || this.contentDom == this.contentDiv.firstChild)
			return;

		while(this.contentDiv.firstChild)
			this.contentDiv.removeChild(this.contentDiv.firstChild);

		this.contentDiv.appendChild(this.contentDom);

		// Copied from OpenLayers.Popup.setContentHTML():
		if(this.autoSize)
		{
			this.registerImageListeners();
			this.updateSize();
		}
	},

    /**
     * Method: setSize
     * Used to adjust the size of the popup. 
     *
     * Parameters:
     * contentSize - {<OpenLayers.Size>} the new size for the popup's 
     *     contents div (in pixels).
     */
    setSize:function(contentSize) { 
		OpenLayers.Popup.FramedCloud.prototype.setSize.apply(this, arguments);
    },


	destroy: function() {
		this.contentDom = null;
		OpenLayers.Popup.FramedCloud.prototype.destroy.apply(this, arguments);
	},

	CLASS_NAME: "OpenLayers.Popup.FramedCloud.OpenStreetBugs"
});

/**
 * Necessary improvement to the translate function: Fall back to default language if translated string is not
 * available (see http://trac.openlayers.org/ticket/2308).
*/

OpenLayers.i18n = OpenLayers.Lang.translate = function(key, context) {
	var message = OpenLayers.Lang[OpenLayers.Lang.getCode()][key];
	if(!message)
	{
		if(OpenLayers.Lang[OpenLayers.Lang.defaultCode][key])
			message = OpenLayers.Lang[OpenLayers.Lang.defaultCode][key];
		else
			message = key;
	}
	if(context)
		message = OpenLayers.String.format(message, context);
	return message;
};

/* Translations */

OpenLayers.Lang.en = OpenLayers.Util.extend(OpenLayers.Lang.en, {
	"Fixed Error" : "Fixed Error",
	"Unresolved Error" : "Unresolved Error",
	"Description" : "Description",
	"Comment" : "Comment",
	"Has been fixed." : "This obstacle has been fixed.",
	"Comment/Close" : "Comment/Close",
	"Nickname" : "Nickname",
	"Add comment" : "Add comment",
	"Mark as fixed" : "Mark as fixed",
	"Cancel" : "Cancel",
	"Create OpenStreetBug" : "Create OpenStreetBug",
	"Create bug" : "Create bug",
	"Bug description" : "Bug description",
	"Create" : "Create",
	"Permalink" : "Permalink",
	"Zoom" : "Zoom"
});

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
	"Has been fixed." : "Это препятствие помечено как исправленное",
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
	"Has been fixed." : "Гэтая праблема была пазначаная як выпраўленая",
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

