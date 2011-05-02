/**
 * Class: OpenLayers.Strategy.AttributesCluster
 * Strategy for vector feature clustering based on feature attributes.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy.Cluster>
 */
OpenLayers.Strategy.AttributesCluster = OpenLayers.Class(OpenLayers.Strategy.Cluster, {
    /**
     * the attribute to use for comparison
     */
    attributes: [],
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

