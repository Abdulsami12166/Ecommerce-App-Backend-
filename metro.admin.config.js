const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const watchFolders = [path.resolve(projectRoot, 'admin-app'), path.resolve(projectRoot, 'src')];

/**
 * Metro config for admin app entrypoint
 */
const config = {
  projectRoot,
  watchFolders,
  resolver: {
    /* keep default resolver */
  },
  transformer: {
    /* keep default transformer */
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);

