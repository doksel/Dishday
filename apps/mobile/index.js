// Local entry point.
// In an npm workspace, Expo CLI treats the workspace root as the project root,
// which breaks resolution of `"main": "expo-router/entry"` (paths walk above the
// workspace). Importing it from a LOCAL file fixes the resolution context.
// See: https://docs.expo.dev/guides/monorepos/#change-default-entry-point
import 'expo-router/entry';
