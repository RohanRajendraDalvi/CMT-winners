import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MapSection = ({ location, nearbySlips }) => (
  <View style={styles.webMapContainer}>
    <View style={styles.webMapPlaceholder}>
      <Icon name="map" size={48} color="#999" />
      <Text style={styles.webMapText}>
        Map view is only available on mobile devices
      </Text>
      {location && (
        <Text style={styles.locationText}>
          Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      )}
    </View>

    <View style={styles.slipsList}>
      <Text style={styles.slipsListTitle}>
        {nearbySlips.length} slip{nearbySlips.length !== 1 ? 's' : ''} nearby
      </Text>
      {nearbySlips.map((slip, index) => (
        <View key={slip._id || index} style={styles.slipItem}>
          <Icon name="warning" size={24} color="#F44336" />
          <View style={styles.slipItemText}>
            <Text style={styles.slipItemDate}>
              {new Date(slip.timestamp).toLocaleDateString()}
            </Text>
            <Text style={styles.slipItemCoords}>
              {slip.geoPoint.coordinates[1].toFixed(4)}, {slip.geoPoint.coordinates[0].toFixed(4)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  webMapContainer: {
    minHeight: 300,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  webMapPlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webMapText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  locationText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  slipsList: {
    padding: 16,
  },
  slipsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  slipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  slipItemText: {
    flex: 1,
  },
  slipItemDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  slipItemCoords: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default MapSection;