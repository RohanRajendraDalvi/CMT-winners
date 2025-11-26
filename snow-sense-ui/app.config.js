// Expo app config reading keys from environment
// Uses EXPO_PUBLIC_* vars so they are available at runtime
// Replace values in .env as needed

export default ({ config }) => {
  const androidKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const iosKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS || "";

  return {
    ...config,
    expo: {
      ...(config?.expo || {}),
      name: (config?.expo?.name || "snow-sense"),
      slug: (config?.expo?.slug || "snow-sense"),
      plugins: [
        ...(config?.expo?.plugins || []),
        "expo-maps",
      ],
      android: {
        ...(config?.expo?.android || {}),
        package: (config?.expo?.android?.package || "com.rohandalvi.snowsense"),
        config: {
          ...(config?.expo?.android?.config || {}),
          googleMaps: {
            apiKey: androidKey,
          },
        },
      },
      ios: {
        ...(config?.expo?.ios || {}),
        config: {
          ...(config?.expo?.ios?.config || {}),
          googleMapsApiKey: iosKey,
        },
      },
      extra: {
        ...(config?.expo?.extra || {}),
        eas: {
          ...(config?.expo?.extra?.eas || {}),
          projectId: (config?.expo?.extra?.eas?.projectId || "d4c4b6f9-a6e0-4c34-bae9-dff73a3377e8"),
        },
      },
    },
  };
};
