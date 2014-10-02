goog.provide('olcs.VectorSynchronizer');

goog.require('olcs.AbstractSynchronizer');
goog.require('olcs.core');



/**
 * Unidirectionally synchronize OpenLayers vector layers to Cesium.
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @constructor
 * @extends {olcs.AbstractSynchronizer.<Cesium.Polygon|Cesium.PolylineCollection|Cesium.Primitive>}
 */
olcs.VectorSynchronizer = function(map, scene) {

  /**
   * @type {!Cesium.PrimitiveCollection}
   * @private
   */
  this.csAllPrimitives_ = new Cesium.PrimitiveCollection();
  scene.primitives.add(this.csAllPrimitives_);
  this.csAllPrimitives_.destroyPrimitives = false;

  // Initialize core library
  olcs.core.glAliasedLineWidthRange = scene.maximumAliasedLineWidth;

  goog.base(this, map, scene);
};
goog.inherits(olcs.VectorSynchronizer, olcs.AbstractSynchronizer);


/**
 * @inheritDoc
 */
olcs.VectorSynchronizer.prototype.addCesiumObject = function(object) {
  goog.asserts.assert(!goog.isNull(object));
  this.csAllPrimitives_.add(object);
};


/**
 * @inheritDoc
 */
olcs.VectorSynchronizer.prototype.destroyCesiumObject = function(object) {
  object.destroy();
};


/**
 * @inheritDoc
 */
olcs.VectorSynchronizer.prototype.removeAllCesiumObjects = function(destroy) {
  this.csAllPrimitives_.destroyPrimitives = destroy;
  this.csAllPrimitives_.removeAll();
  this.csAllPrimitives_.destroyPrimitives = false;
};


/**
 * @inheritDoc
 */
olcs.VectorSynchronizer.prototype.createSingleCounterpart = function(olLayer) {
  if (!(olLayer instanceof ol.layer.Vector)) {
    return null;
  }
  goog.asserts.assertInstanceof(olLayer, ol.layer.Vector);
  goog.asserts.assert(!goog.isNull(this.view));

  var view = this.view;
  var source = olLayer.getSource();
  var csPrimitives = olcs.core.olVectorLayerToCesium(olLayer, view);

  olLayer.on('change:visible', function(e) {
    csPrimitives.show = olLayer.getVisible();
  });

  var onAddFeature = function(feature) {
    goog.asserts.assertInstanceof(olLayer, ol.layer.Vector);
    var primitive = olcs.core.olFeatureToCesiumUsingView(olLayer, view,
        feature);
    if (primitive) {
      csPrimitives.add(primitive);
    }
  };

  var onRemoveFeature = function(feature) {
    csPrimitives.remove(feature.csPrimitive);
  };

  source.on('addfeature', function(e) {
    goog.isDefAndNotNull(e.feature);
    onAddFeature(e.feature);
  }, this);

  source.on('removefeature', function(e) {
    goog.isDefAndNotNull(e.feature);
    onRemoveFeature(e.feature);
  }, this);

  source.on('changefeature', function(e) {
    var feature = e.feature;
    goog.isDefAndNotNull(feature);
    onRemoveFeature(feature);
    onAddFeature(feature);
  }, this);

  return csPrimitives;
};
