import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Load Leaflet CSS from CDN for Expo Web
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
}

// Fix for default marker icons in Leaflet - use CDN URLs
if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Custom icons - using URI encoding instead of btoa to avoid Latin1 issues
const slipIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#ff6b6b" stroke="white" stroke-width="3"/>
      <path d="M14 8 L18 8 L17 18 L15 18 Z" fill="white"/>
      <circle cx="16" cy="22" r="2" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#4a90e2" stroke="white" stroke-width="3"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Component to fit map bounds
function FitBounds({ slips, userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (slips.length === 0 && !userLocation) return;

    const bounds = [];
    
    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lon]);
    }
    
    slips.forEach(slip => {
      const [lon, lat] = slip.geoPoint.coordinates;
      bounds.push([lat, lon]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [slips, userLocation, map]);

  return null;
}

const MapScreen = ({ slips, userLocation, onBack }) => {
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
    const R = 6371;
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

  const center = userLocation 
    ? [userLocation.lat, userLocation.lon]
    : slips.length > 0 
    ? [slips[0].geoPoint.coordinates[1], slips[0].geoPoint.coordinates[0]]
    : [42.3601, -71.0589];

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
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FitBounds slips={slips} userLocation={userLocation} />

          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={[userLocation.lat, userLocation.lon]} 
              icon={userIcon}
            >
              <Popup>
                <div style={{ padding: '8px' }}>
                  <strong>Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Slip markers */}
          {slips.map((slip, index) => {
            const [lon, lat] = slip.geoPoint.coordinates;
            return (
              <Marker
                key={slip._id || index}
                position={[lat, lon]}
                icon={slipIcon}
                eventHandlers={{
                  click: () => setSelectedSlip(slip),
                }}
              >
                <Popup>
                  <div style={{ padding: '8px', minWidth: '200px' }}>
                    <strong>Slip Reported</strong>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {formatDate(slip.timestamp)}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </View>

      {/* Bottom sheet with slip details */}
      {selectedSlip && (
        <View style={styles.detailsPanel}>
          <TouchableOpacity 
            style={styles.closePanelButton}
            onPress={() => setSelectedSlip(null)}
          >
            <Text style={styles.closePanelText}>×</Text>
          </TouchableOpacity>

          <ScrollView style={styles.detailsContent}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsIcon}>
                {getWeatherIcon(selectedSlip.weather?.weather?.[0]?.main)}
              </Text>
              <View style={styles.detailsHeaderText}>
                <Text style={styles.detailsTitle}>Slip Event</Text>
                <Text style={styles.detailsTime}>
                  {formatDate(selectedSlip.timestamp)}
                </Text>
                {userLocation && (
                  <Text style={styles.detailsDistance}>
                    {calculateDistance(
                      userLocation.lat,
                      userLocation.lon,
                      selectedSlip.geoPoint.coordinates[1],
                      selectedSlip.geoPoint.coordinates[0]
                    )}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Weather Conditions</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Condition</Text>
                <Text style={styles.detailValue}>
                  {selectedSlip.weather?.weather?.[0]?.description || 'Unknown'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Temperature</Text>
                <Text style={styles.detailValue}>
                  {selectedSlip.weather?.main?.temp 
                    ? `${Math.round(selectedSlip.weather.main.temp)}°F`
                    : 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Feels Like</Text>
                <Text style={styles.detailValue}>
                  {selectedSlip.weather?.main?.feels_like 
                    ? `${Math.round(selectedSlip.weather.main.feels_like)}°F`
                    : 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>
                  {selectedSlip.weather?.main?.humidity 
                    ? `${selectedSlip.weather.main.humidity}%`
                    : 'N/A'}
                </Text>
              </View>

              {selectedSlip.weather?.wind?.speed && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Wind Speed</Text>
                  <Text style={styles.detailValue}>
                    {Math.round(selectedSlip.weather.wind.speed)} mph
                  </Text>
                </View>
              )}

              {selectedSlip.weather?.visibility && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Visibility</Text>
                  <Text style={styles.detailValue}>
                    {(selectedSlip.weather.visibility / 1000).toFixed(1)} km
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Location Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coordinates</Text>
                <Text style={styles.detailValue}>
                  {selectedSlip.geoPoint.coordinates[1].toFixed(4)}, {selectedSlip.geoPoint.coordinates[0].toFixed(4)}
                </Text>
              </View>

              {selectedSlip.weather?.name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Area</Text>
                  <Text style={styles.detailValue}>
                    {selectedSlip.weather.name}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle ID</Text>
                <Text style={styles.detailValue}>
                  {selectedSlip.vehicleId}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
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
  mapContainer: {
    flex: 1,
    position: 'relative',
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
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)',
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
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
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