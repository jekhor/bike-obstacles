/**
 * Class: OpenLayers.Strategy.AttributesCluster
 * Strategy for vector feature clustering based on feature attributes.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy.Cluster>
 */
OpenLayers.Strategy.AttributesCluster = OpenLayers.Class(OpenLayers.Strategy.Cluster, {
    /**
     * the attributes to use for comparison
     */
    attributes: [],

    /**
     * maximum zoom layer for clustering
     */
    maxZoom: 20,

    /**
     * APIMethod: activate
     * Activate the strategy.  Register any listeners, do appropriate setup.
     * 
     * Returns:
     * {Boolean} The strategy was successfully activated.
     */
    activate: function() {
        var activated = OpenLayers.Strategy.Cluster.prototype.activate.call(this);
        if(activated) {
            this.layer.events.on({
                "afterfeaturesremoved": this.uncacheFeatures,
                scope: this
            });
        }
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the strategy.  Unregister any listeners, do appropriate
     *     tear-down.
     * 
     * Returns:
     * {Boolean} The strategy was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Strategy.Cluster.prototype.deactivate.call(this);
        if(deactivated) {
            this.clearCache();
            this.layer.events.un({
                "afterfeaturesremoved": this.uncacheFeatures,
                scope: this
            });
        }
        return deactivated;
    },

    findFeature: function(array, fid) {
        
        for (var i = 0; i < array.length; i++) {
            if (array[i].fid == fid)
                return i;
        }

        return -1;
    },
     /**
     * Method: cacheFeatures
     * Cache features before they are added to the layer.
     *
     * Parameters:
     * event - {Object} The event that this was listening for.  This will come
     *     with a batch of features to be clustered.
     *     
     * Returns:
     * {Boolean} False to stop features from being added to the layer.
     */
    cacheFeatures: function(event) {
        var propagate = true;
        if(!this.clustering) {
            if (this.features === null)
                this.features = [];

            if ((event.type === "beforefeaturesadded") && (event.features !== null)) {
                var new_features = [];
                var clustering_needed = false;
                for (var i = 0; i < event.features.length; i++) {
                    var feature = event.features[i];
                    if (feature.state === OpenLayers.State.INSERT)
                        new_features.push(feature);
                    else {
                        if (this.findFeature(this.features, feature.fid) == -1)
                            this.features.push(feature);
                        
                        clustering_needed = true;
                    }
                }

                if (clustering_needed)
                    this.cluster();
  
                event.features = new_features;
                this.features = this.features.concat(new_features);
            } else {
                this.cluster();
                propagate = false;
            }
        }
        return propagate;
    },

    uncacheFeatures: function(event) {
        if (!this.clustering) {
            var features = event.features;

            if (event.features == this.features) {
                this.features = null;
                return true;
            }

            for (i = 0; i < features.length; i++) {
                OpenLayers.Util.removeItem(this.features, features[i]);
            }
        }
        return true;
    },

    /**
     * Method: shouldCluster
     * Determine whether to include a feature in a given cluster.
     *
     * Parameters:
     * cluster - {<OpenLayers.Feature.Vector>} A cluster.
     * feature - {<OpenLayers.Feature.Vector>} A feature.
     *
     * Returns:
     * {Boolean} The feature should be included in the cluster.
     */
    shouldCluster: function(cluster, feature) {
        var cc_attributes = cluster.cluster[0].attributes;
        var fc_attributes = feature.attributes;
        var attr;

        if (this.layer.map.getZoom() > this.maxZoom)
            return false;

        var equalFlag = true;
        for (var i = 0; i < this.attributes.length; i++) {
          attr = this.attributes[i];
          equalFlag = (cc_attributes[attr] == fc_attributes[attr]);

          if (!equalFlag)
            break;
        }

        var superProto = OpenLayers.Strategy.Cluster.prototype;
        return equalFlag &&
               superProto.shouldCluster.apply(this, arguments);
    },

    /**
     * Method: createCluster
     * Given a feature, create a cluster.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A cluster.
     */
    createCluster: function(feature) {
        var cluster = OpenLayers.Strategy.Cluster.prototype.createCluster.apply(this, arguments);

        for (var i = 0; i < this.attributes.length; i++) {
          var attr = this.attributes[i];
          cluster.attributes[attr] = feature.attributes[attr];
        }

        return cluster;
    },

    CLASS_NAME: "OpenLayers.Strategy.AttributesCluster"
});

/**
 * Class: OpenLayers.Strategy.RuleCluster
 * Strategy for vector feature clustering according to a given rule.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy.Cluster>
 */
OpenLayers.Strategy.RuleCluster = OpenLayers.Class(OpenLayers.Strategy.Cluster, {
    /**
     * the rule to use for comparison
     */
    rule: null,
    /**
     * Method: shouldCluster
     * Determine whether to include a feature in a given cluster.
     *
     * Parameters:
     * cluster - {<OpenLayers.Feature.Vector>} A cluster.
     * feature - {<OpenLayers.Feature.Vector>} A feature.
     *
     * Returns:
     * {Boolean} The feature should be included in the cluster.
     */
    shouldCluster: function(cluster, feature) {
        var superProto = OpenLayers.Strategy.Cluster.prototype;
        return this.rule.evaluate(cluster.cluster[0]) &&
               this.rule.evaluate(feature) &&
               superProto.shouldCluster.apply(this, arguments);
    },
    CLASS_NAME: "OpenLayers.Strategy.RuleCluster"
});

