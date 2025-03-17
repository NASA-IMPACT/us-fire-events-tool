import { layerRegistry } from './config/layer-registry';

/**
 * Creates a layer instance based on the provided configuration
 *
 * @param {Object} config - Layer configuration
 * @param {string} config.type - Type of layer to create
 * @param {Object} config.props - Properties to pass to the layer
 * @return {Promise<Layer>} Promise that resolves to the created layer
 */
export const createLayer = async (config) => {
  const { type, ...props } = config;

  const layerDefinition = layerRegistry[type];

  if (!layerDefinition) {
    console.error(`Unknown layer type: ${type}`);
    return null;
  }

  try {
    const layerProps = {
      ...layerDefinition.defaultProps,
      ...props
    };

    if (type === 'wind') {
      const layer = await layerDefinition.render(layerProps);
      return layer;
    }

    return layerDefinition.render(layerProps);
  } catch (error) {
    console.error(`Error creating layer of type ${type}:`, error);
    return null;
  }
};

/**
 * Creates multiple layers from an array of configurations
 *
 * @param {Array<Object>} configs - Array of layer configurations
 * @return {Promise<Array<Layer>>} Promise that resolves to an array of layers
 */
export const createLayers = async (configs) => {
  const layerPromises = configs.map(config => createLayer(config));
  const layers = await Promise.all(layerPromises);
  return layers.filter(Boolean);
};

/**
 * Export layer types from the registry for convenience
 */
export const LAYER_TYPES = Object.keys(layerRegistry).reduce((acc, key) => {
  acc[key] = key;
  return acc;
}, {});

/**
 * Get available layer definitions for UI display
 *
 * @return {Array<Object>} Array of layer definitions with UI metadata
 */
export const getLayerTypeOptions = () => {
  return Object.values(layerRegistry).map(layer => ({
    id: layer.id,
    label: layer.name,
    requireData: layer.requiresData
  }));
};