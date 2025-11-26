import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from './airiskStyles';

export function NearbySlipsCard({ slipsData, onOpenMap }) {
  if (!slipsData) return null;
  return (
    <View style={styles.slipsCard}>
      <Text style={styles.cardTitle}>⚠️ Nearby Slip Incidents</Text>
      <View style={styles.slipsHeader}>
        <Text style={styles.slipsCount}>{slipsData.nearbySlipsCount || 0}</Text>
        <Text style={styles.slipsCountLabel}>incidents within proximity</Text>
      </View>
      {slipsData.slips && slipsData.slips.length > 0 && (
        <ScrollView style={styles.slipsScrollView} nestedScrollEnabled={true}>
          <View style={styles.slipsList}>
            {slipsData.slips.map((slip, idx) => (
              <TouchableOpacity
                key={slip.id || idx}
                style={styles.slipItem}
                onPress={() => slip.geoPoint?.coordinates && onOpenMap(slip.geoPoint.coordinates[1], slip.geoPoint.coordinates[0])}
                activeOpacity={0.7}
              >
                <View style={styles.slipDot} />
                <View style={styles.slipInfo}>
                  <View style={styles.slipHeader}>
                    <Text style={styles.slipTime}>{new Date(slip.timestamp).toLocaleDateString()}</Text>
                    <Text style={styles.slipTimeDetail}>{new Date(slip.timestamp).toLocaleTimeString()}</Text>
                  </View>
                  {slip.geoPoint?.coordinates && (
                    <Text style={styles.slipCoords}>📍 {slip.geoPoint.coordinates[1].toFixed(4)}, {slip.geoPoint.coordinates[0].toFixed(4)}</Text>
                  )}
                  {slip.weather && (
                    <View style={styles.slipWeatherDetails}>
                      <View style={styles.weatherDetailRow}>
                        <Text style={styles.weatherDetailItem}>🌡️ {slip.weather.main?.temp}°C</Text>
                        <Text style={styles.weatherDetailItem}>💧 {slip.weather.main?.humidity}% humidity</Text>
                      </View>
                      <View style={styles.weatherDetailRow}>
                        <Text style={styles.weatherDetailItem}>🌤️ {slip.weather.weather?.[0]?.description || 'N/A'}</Text>
                        <Text style={styles.weatherDetailItem}>💨 {slip.weather.wind?.speed} m/s</Text>
                      </View>
                      {slip.weather.main?.feels_like && (
                        <Text style={styles.weatherDetailItem}>Feels like: {slip.weather.main.feels_like}°C</Text>
                      )}
                      {slip.weather.visibility && (
                        <Text style={styles.weatherDetailItem}>👁️ Visibility: {(slip.weather.visibility / 1000).toFixed(1)} km</Text>
                      )}
                    </View>
                  )}
                  <View style={styles.slipFooter}>
                    <Text style={styles.slipVehicle}>🚗 {slip.vehicleId}</Text>
                    <Text style={styles.tapToView}>Tap to view on map →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
