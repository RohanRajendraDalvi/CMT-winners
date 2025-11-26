import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './airiskStyles';

export function WeatherCard({ weather }) {
  if (!weather) return null;
  return (
    <View style={styles.weatherCard}>
      <Text style={styles.cardTitle}>🌤️ Current Weather</Text>
      <View style={styles.weatherContent}>
        <View style={styles.weatherRow}>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherIcon}>🌡️</Text>
            <Text style={styles.weatherValue}>{weather.temperature_C}°C</Text>
            <Text style={styles.weatherLabel}>Temperature</Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherIcon}>💧</Text>
            <Text style={styles.weatherValue}>{weather.precipitation}</Text>
            <Text style={styles.weatherLabel}>Precipitation</Text>
          </View>
        </View>
        <View style={styles.weatherDescription}>
          <Text style={styles.weatherDescText}>{weather.description}</Text>
        </View>
        <View style={styles.weatherDescription}>
          <Text style={styles.weatherDescText}>
            Slipping risk is highest between -5°C to 0°C (23–32°F) where ice partially melts, creating a lubricating water layer. Above 10°C (50°F) ice fully melts, eliminating slip risk; below -15°C (5°F) ice is hard and dry with better traction.
          </Text>
        </View>
      </View>
    </View>
  );
}
