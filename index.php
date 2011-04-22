<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
      "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
    <head>
        <title>LatLon.org &mdash; Traffic calming map</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <link rel="stylesheet" href="css/style.css" type="text/css" />
        <link rel="stylesheet" href="css/global.css" type="text/css" />

        <script src="http://www.openlayers.org/api/OpenLayers.js" type="text/javascript"></script>
        <script type="text/javascript" src="js/openstreetbugs.js"></script>
        <script src="js/lib.js" type="text/javascript"></script>
        <script src="js/click.js" type="text/javascript"></script>
        <script src="js/cops.js" type="text/javascript"></script>
    </head>
    <body onload="init()">
        <!-- div id="sorry" class="hidden">New bumps can be added on zoom level 17 or greater<br/>More info can be found <a href='http://blog.latlon.org/2010/11/16/otmetki-o-lezhachikh-policejjskikh-v-osm/'>here</a></div -->
        <div id="content">
            <div id="sidebar" class="hidden">
              <div class="sidebar_title">
                <div id="sidebar_title">Sidebar</div>
                <a id="sidebar_close" href="#" onclick="return closeSidebar();">×</a>
              </div>
              <div id="sidebar_content">
                This is the sample content.
              </div>
            </div>
            <div id="map" class="smallmap" ></div>
        </div>
    </body>
</html>
