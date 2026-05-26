module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // MUST be the last plugin in the list — required by react-native-reanimated 3+/4
      // (peer dep of react-native-screens on Expo SDK 55).
      'react-native-reanimated/plugin',
    ],
  };
};
