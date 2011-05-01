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

	/**
	 * @param String name
	*/
    initialize : function(name, options)
    {
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, [ name, OpenLayers.Util.extend({
            projection: new OpenLayers.Projection("EPSG:4326"),
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: this.apiURL + "/getBugs.rb",
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
//		if(!this.bugs[id].popup)
//			return;

		var el1,el2,el3;
		var layer = this;

//		var icon = this.subtypeIcons[putAJAXMarker.bugs[id][3]] == null ? this.iconOpen : this.subtypeIcons[putAJAXMarker.bugs[id][3]];
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
			el_form.onsubmit = function(){ if(inputComment.value.match(/^\s*$/)) return false; layer.submitComment(id, inputComment.value); layer.hidePopup(id); return false; };

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
			el3.onclick = function(){ this.form.onsubmit(); layer.closeBug(id); layer.bugs[id].popup.hide(); return false; };
			el3.value = OpenLayers.i18n("Mark as fixed");
			el2.appendChild(el3);
			el1.appendChild(el2);
			el_form.appendChild(el1);
			containerChange.appendChild(el_form);

			el2 = document.createElement("li");
			el3 = document.createElement("input");
			el3.setAttribute("type", "button");
			el3.onclick = function(){ this.form.onsubmit(); layer.deleteBug(id); layer.bugs[id].popup.hide(); layer.bugs[id].destroy(); return false; };
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
    /* TODO
	createBug: function(lonlat, description, type) {
		this.apiRequest("addPOIexec"
			+ "?lat="+encodeURIComponent(lonlat.lat)
			+ "&lon="+encodeURIComponent(lonlat.lon)
			+ "&text="+encodeURIComponent(description + " [" + this.getUserName() + "]")
			+ "&subtype="+encodeURIComponent(type)
			+ "&format=js"
		);
	},
*/
	/**
	 * Adds a comment to a bug.
	 * @param Number id
	 * @param String comment
	*/
    /* TODO
	submitComment: function(id, comment) {
		this.apiRequest("editPOIexec"
			+ "?id="+encodeURIComponent(id)
			+ "&text="+encodeURIComponent(comment + " [" + this.getUserName() + "]")
			+ "&format=js"
		);
	},

    */
	/**
	 * Marks a bug as fixed.
	 * @param Number id
	*/
    /* TODO
	closeBug: function(id) {
		this.apiRequest("closePOIexec"
			+ "?id="+encodeURIComponent(id)
			+ "&format=js"
		);
	},
    */

	/**
	 * Mark bug as deleted.
	 * @param Number id
	*/
    /* TODO
	deleteBug: function(id) {
		this.apiRequest("deletePOIexec"
			+ "?id="+encodeURIComponent(id)
			+ "&format=js"
		);
	},
    */

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
		var add = null;
		if(!feature.popup)
		{
            feature.popupClass = OpenLayers.Popup.FramedCloud.OpenStreetBugs;
            feature.lonlat = feature.geometry.getBounds().getCenterLonLat();
			add = new OpenLayers.Popup.FramedCloud.OpenStreetBugs(feature.id + "_popup", feature.lonlat, feature.data.popupSize, null, null, true);
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
	"Has been fixed." : "This error has been fixed already. However, it might take a couple of days before the map image is updated.",
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

OpenLayers.Lang.de = OpenLayers.Util.extend(OpenLayers.Lang.de, {
	"Fixed Error" : "Behobener Fehler",
	"Unresolved Error" : "Offener Fehler",
	"Description" : "Beschreibung",
	"Comment" : "Kommentar",
	"Has been fixed." : "Der Fehler wurde bereits behoben. Es kann jedoch bis zu einigen Tagen dauern, bis die Kartenansicht aktualisiert wird.",
	"Comment/Close" : "Kommentieren/Schließen",
	"Nickname" : "Benutzername",
	"Add comment" : "Kommentar hinzufügen",
	"Mark as fixed" : "Als behoben markieren",
	"Cancel" : "Abbrechen",
	"Create OpenStreetBug" : "OpenStreetBug melden",
	"Create bug" : "Bug anlegen",
	"Bug description" : "Fehlerbeschreibung",
	"Create" : "Anlegen",
	"Permalink" : "Permalink",
	"Zoom" : "Zoom"
});

OpenLayers.Lang.fr = OpenLayers.Util.extend(OpenLayers.Lang.fr, {
	"Fixed Error" : "Erreur corrigée",
	"Unresolved Error" : "Erreur non corrigée",
	"Description" : "Description",
	"Comment" : "Commentaire",
	"Has been fixed." : "Cette erreur a déjà été corrigée. Cependant, il peut être nécessaire d'attendre quelques jours avant que l'image de la carte ne soit mise à jour.",
	"Comment/Close" : "Commenter/Fermer",
	"Nickname" : "Surnom",
	"Add comment" : "Ajouter un commentaire",
	"Mark as fixed" : "Marquer comme corrigé",
	"Cancel" : "Annuler",
	"Create OpenStreetBug" : "Créer OpenStreetBug",
	"Create bug" : "Ajouter un bug",
	"Bug description" : "Description du bug",
	"Create" : "Créer",
	"Permalink" : "Lien permanent",
	"Zoom" : "Zoom"
});

OpenLayers.Lang.nl = OpenLayers.Util.extend(OpenLayers.Lang.nl, {
	"Fixed Error" : "Fout verholpen",
	"Unresolved Error" : "Openstaande fout",
	"Description" : "Beschrijving",
	"Comment" : "Kommentaar",
	"Has been fixed." : "De fout is al eerder opgelost. Het kan echter nog een paar dagen duren voordat het kaartmateriaal geactualiseerd is.",
	"Comment/Close" : "Bekommentariëren/Sluiten",
	"Nickname" : "Gebruikersnaam",
	"Add comment" : "Kommentaar toevoegen",
	"Mark as fixed" : "Als opgelost aanmerken",
	"Cancel" : "Afbreken",
	"Create OpenStreetBug" : "OpenStreetBug melden",
	"Create bug" : "Bug melden",
	"Bug description" : "Foutomschrijving",
	"Create" : "Aanmaken",
	"Permalink" : "Permalink",
	"Zoom" : "Zoom"
});

OpenLayers.Lang.it = OpenLayers.Util.extend(OpenLayers.Lang.it, {
	"Fixed Error" : "Sbaglio coretto",
	"Unresolved Error" : "Sbaglio non coretto",
	"Description" : "Descrizione",
	"Comment" : "Commento",
	"Has been fixed." : "Questo sbaglio è già coretto. Forse ci metto qualche giorni per aggiornare anche i quadri.",
	"Comment/Close" : "Commenta/Chiude",
	"Nickname" : "Nome",
	"Add comment" : "Aggiunge commento",
	"Mark as fixed" : "Marca che è coretto",
	"Cancel" : "Annulla",
	"Create OpenStreetBug" : "Aggiunge OpenStreetBug",
	"Create bug" : "Aggiunge un sbaglio",
	"Bug description" : "Descrizione del sbaglio",
	"Create" : "Aggiunge",
	"Permalink" : "Permalink",
	"Zoom" : "Zoom"
});

OpenLayers.Lang.ro = OpenLayers.Util.extend(OpenLayers.Lang.ro, {
	"Fixed Error" : "Eroare rezolvată",
	"Unresolved Error" : "Eroare nerezolvată",
	"Description" : "Descriere",
	"Comment" : "Comentariu",
	"Has been fixed." : "Această eroare a fost rezolvată. Totuși este posibil să dureze câteva zile până când imaginea hărții va fi actualizată.",
	"Comment/Close" : "Comentariu/Închide",
	"Nickname" : "Nume",
	"Add comment" : "Adaugă comentariu",
	"Mark as fixed" : "Marchează ca rezolvată",
	"Cancel" : "Anulează",
	"Create OpenStreetBug" : "Crează OpenStreetBug",
	"Create bug" : "Adaugă eroare",
	"Bug description" : "Descrierea erorii",
	"Create" : "Adaugă",
	"Permalink" : "Permalink",
	"Zoom" : "Zoom"
});

OpenLayers.Lang.hu = OpenLayers.Util.extend(OpenLayers.Lang.hu, {
	"Fixed Error" : "Javított hiba",
	"Unresolved Error" : "Megoldatlan hiba",
	"Description" : "Leírás",
	"Comment" : "Megjegyzés",
	"Has been fixed." : "Ezt a hibát már javították, azonban eltarthat néhány napig, mire a térkép frissül.",
	"Comment/Close" : "Megjegyzés/Bezárás",
	"Nickname" : "Becenév",
	"Add comment" : "Megjegyzés hozzáadása",
	"Mark as fixed" : "Jelölés javítottként",
	"Cancel" : "Mégse",
	"Create OpenStreetBug" : "OpenStreetBug létrehozása",
	"Create bug" : "Hiba létrehozása",
	"Bug description" : "Hiba leírása",
	"Create" : "Létrehozás",
	"Permalink" : "Permalink",
	"Zoom" : "Nagyítás"
});

OpenLayers.Lang.es = OpenLayers.Util.extend(OpenLayers.Lang.es, {
	"Fixed Error" : "Error Corregido",
	"Unresolved Error" : "Error sin corregir",
	"Description" : "Descripción",
	"Comment" : "Comentario",
	"Has been fixed." : "Este error ya ha sido corregido. De todas formas, puede que tarde un par de días antes de que la imagen del mapa se actualice.",
	"Comment/Close" : "Comentario/Cerrado",
	"Nickname" : "Nombre usuario",
	"Add comment" : "Añadir comentario",
	"Mark as fixed" : "Marcar como corregido",
	"Cancel" : "Cancelar",
	"Create OpenStreetBug" : "Crear OpenStreetBug",
	"Create bug" : "Crear bug",
	"Bug description" : "Descripcion del bug",
	"Create" : "Crear",
	"Permalink" : "Permalink",
	"Zoom" : "Zoom"
});
