import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './airiskStyles';

export function LocationMapCard({ location, onOpenMap }) {
  if (!location) return null;
  return (
    <View style={styles.mapCard}>
      <Text style={styles.cardTitle}>📍 Location</Text>
      <View style={styles.mapContainer}>
        <View style={styles.coordContainer}>
          <Text style={styles.coordLabel}>Latitude:</Text>
          <Text style={styles.coordValue}>{location.lat.toFixed(6)}</Text>
        </View>
        <View style={styles.coordContainer}>
          <Text style={styles.coordLabel}>Longitude:</Text>
          <Text style={styles.coordValue}>{location.lon.toFixed(6)}</Text>
        </View>
        <View style={styles.mapVisual}>
          <Text style={styles.mapVisualIcon}>🗺️</Text>
          <Text style={styles.mapVisualText}>Assessment Location</Text>
          <TouchableOpacity style={styles.openMapButton} onPress={() => onOpenMap(location.lat, location.lon)}>
            <Text style={styles.openMapIcon}>📍</Text>
            <Text style={styles.openMapText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
