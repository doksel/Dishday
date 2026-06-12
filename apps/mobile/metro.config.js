// Metro config for npm workspaces (hoisted layout).
// https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch:
//    - the mobile app itself
//    - root node_modules (where npm hoists expo, expo-router, react-native, etc.)
//    - workspace packages (so changes in packages/* trigger reloads)
// Without root node_modules in watchFolders, Metro can't *read* hoisted packages
// even though they're listed in nodeModulesPaths.
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'packages/api-client'),
  path.resolve(workspaceRoot, 'packages/types'),
  path.resolve(workspaceRoot, 'packages/utils'),
  path.resolve(workspaceRoot, 'packages/i18n'),
];

// 2. Resolution paths — local first, then root (for hoisted deps).
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Allow Metro to walk up the tree as a fallback.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
