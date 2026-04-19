module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NOTE: @tamagui/babel-plugin is only needed for compile-time optimizations.
      // It's disabled here for Expo Go compatibility. Re-enable for production builds.
      'react-native-reanimated/plugin',
    ],
  };
};
