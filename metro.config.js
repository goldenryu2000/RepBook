const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support .wasm for expo-sqlite
config.resolver.assetExts.push('wasm');

module.exports = config;
