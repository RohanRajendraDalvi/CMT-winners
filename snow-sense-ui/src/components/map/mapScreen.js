// components/map/MapScreen.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Platform } from 'react-native';
// Removed expo-maps to avoid native module requirement in Expo Go
// Map renders via Leaflet in a WebView instead
import { WebView } from 'react-native-webview';

const MapScreen = ({ slips, userLocation, onBack }) => {
  const mapRef = useRef(null);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const getWeatherIcon = (weatherMain) => {
    const icons = {
      Snow: '❄️',
      Rain: '🌧️',
      Clouds: '☁️',
      Clear: '☀️',
      Fog: '🌫️',
      Mist: '🌫️',
    };
    return icons[weatherMain] || '🌡️';
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  // Calculate map region to fit all slips
  const getMapRegion = () => {
    if (!slips || slips.length === 0) {
      return {
        latitude: userLocation?.lat || 37.7749,
        longitude: userLocation?.lon || -122.4194,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    let minLat = userLocation?.lat || slips[0].geoPoint.coordinates[1];
    let maxLat = userLocation?.lat || slips[0].geoPoint.coordinates[1];
    let minLon = userLocation?.lon || slips[0].geoPoint.coordinates[0];
    let maxLon = userLocation?.lon || slips[0].geoPoint.coordinates[0];

    slips.forEach(slip => {
      const [lon, lat] = slip.geoPoint.coordinates;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    });

    const latDelta = (maxLat - minLat) * 1.5 || 0.05;
    const lonDelta = (maxLon - minLon) * 1.5 || 0.05;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lonDelta, 0.02),
    };
  };

  const handleMarkerPress = (slip) => {
    setSelectedSlip(slip);
  };

  const handleMapPress = () => {
    setSelectedSlip(null);
  };

  const centerOnUser = () => {
    // No-op: WebView Leaflet map does not expose animate API via ref.
    // Could be implemented via postMessage/injected JS if needed.
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Nearby Slips Map</Text>
          <Text style={styles.subtitle}>{slips.length} slip{slips.length !== 1 ? 's' : ''} detected</Text>
        </View>
        {userLocation && (
          <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
            <Text style={styles.locationButtonText}>📍</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Map: Leaflet-in-WebView works in Expo Go */}
      {Platform.OS === 'web' ? (
        <View style={{ flex: 1 }} />
      ) : (
        <WebView
          style={{ flex: 1 }}
          originWhitelist={["*"]}
          source={{ html: generateLeafletHtml(userLocation, slips) }}
        />
      )}

      {/* Legend */}
      {!selectedSlip && slips.length > 0 && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff6b6b' }]} />
            <Text style={styles.legendText}>Slip Location</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4a90e2' }]} />
            <Text style={styles.legendText}>Your Location</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButtonText: {
    fontSize: 20,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff6b6b',
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
  markerText: {
    fontSize: 20,
  },
  calloutContainer: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  calloutTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
  detailsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  closePanelButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closePanelText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsContent: {
    flex: 1,
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  detailsHeaderText: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  detailsTime: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 2,
  },
  detailsDistance: {
    fontSize: 13,
    color: '#4a90e2',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a3e',
    marginVertical: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8e8e93',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#fff',
  },
});

export default MapScreen;

// Generate minimal Leaflet HTML with OSM tiles and markers
function generateLeafletHtml(userLocation, slips) {
  const centerLat = userLocation?.lat ?? 37.7749;
  const centerLon = userLocation?.lon ?? -122.4194;
  const markersJs = (slips || [])
      .map((s, i) => {
        const lat = s.lat ?? s.geoPoint?.coordinates?.[1];
        const lon = s.lon ?? s.geoPoint?.coordinates?.[0];
        if (lat == null || lon == null) return '';
        const time = (s.timestamp != null) ? new Date(s.timestamp).toLocaleString() : 'Unknown';
        const temp = s.weather?.main?.temp != null ? `${Math.round(s.weather.main.temp)}°C` : 'N/A';
        const feels = s.weather?.main?.feels_like != null ? `${Math.round(s.weather.main.feels_like)}°C` : 'N/A';
        const humidity = s.weather?.main?.humidity != null ? `${s.weather.main.humidity}%` : 'N/A';
        const wind = s.weather?.wind?.speed != null ? `${Math.round(s.weather.wind.speed)} m/s` : 'N/A';
        const cond = s.weather?.weather?.[0]?.description ?? s.weather?.weather?.[0]?.main ?? 'Unknown';
        const area = s.weather?.name ?? 'Unknown';
        const veh = s.vehicleId ?? '—';
        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto; max-width:240px;">
            <div style="font-weight:600; margin-bottom:6px;">Slip ${i + 1}</div>
            <div><b>Time:</b> ${time}</div>
            <div><b>Vehicle:</b> ${veh}</div>
            <div><b>Area:</b> ${area}</div>
            <div><b>Condition:</b> ${cond}</div>
            <div><b>Temp:</b> ${temp} (feels ${feels})</div>
            <div><b>Humidity:</b> ${humidity}</div>
            <div><b>Wind:</b> ${wind}</div>
            <div style="margin-top:6px; color:#555;">Lat ${lat.toFixed(5)}, Lon ${lon.toFixed(5)}</div>
          </div>
        `;
        return `L.marker([${lat}, ${lon}], {icon: slipIcon}).addTo(map).bindPopup(${JSON.stringify(popupHtml)});`;
      })
      .join('\n');

  const userMarkerJs = userLocation
    ? `L.marker([${centerLat}, ${centerLon}], {icon: userIcon}).addTo(map).bindPopup('Your Location');`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${centerLat}, ${centerLon}], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const userIcon = L.icon({
      iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-blue.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: [41, 41]
    });

    const slipIcon = L.icon({
      iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: [41, 41]
    });

    ${userMarkerJs}
    ${markersJs}
  </script>
</body>
</html>`;
}