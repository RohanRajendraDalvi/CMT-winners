import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';

const MapSection = ({ location, nearbySlips, mapRefreshing, mapRef }) => {
  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Getting location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={location}
        showsUserLocation
        showsMyLocationButton
      >
        <Circle
          center={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          radius={5000}
          fillColor="rgba(0, 122, 255, 0.1)"
          strokeColor="rgba(0, 122, 255, 0.3)"
          strokeWidth={2}
        />

        {nearbySlips.map((slip, index) => (
          <Marker
            key={slip._id || index}
            coordinate={{
              latitude: slip.geoPoint.coordinates[1],
              longitude: slip.geoPoint.coordinates[0],
            }}
            title="Slip Reported"
            description={`${new Date(slip.timestamp).toLocaleDateString()}`}
          >
            <View style={styles.slipMarker}>
              <Icon name="warning" size={24} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.slipCountBadge}>
        <Icon name="warning" size={16} color="#fff" />
        <Text style={styles.slipCountText}>
          {nearbySlips.length} slip{nearbySlips.length !== 1 ? 's' : ''} nearby
        </Text>
      </View>

      {mapRefreshing && (
        <View style={styles.mapRefreshIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.mapRefreshText}>Updating...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 300,
    position: 'relative',
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  slipMarker: {
    width: 40,
    height: 40,
    backgroundColor: '#F44336',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  slipCountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  slipCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapRefreshIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapRefreshText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MapSection;