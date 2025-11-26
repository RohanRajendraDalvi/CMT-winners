import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Linking, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import { assessAIRisk } from '../../api/AIrisk';
import { PopulationMetricsCard } from './PopulationMetricsCard';
import { RiskFactorsCard } from './RiskFactorsCard';
import { WeatherCard } from './WeatherCard';
import { styles } from './airiskStyles';

export default function AIRiskScreen({ onBack }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const openInMaps = (lat, lon) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
      web: 'https://www.google.com/maps/search/?api=1&query='
    });
    const latLng = `${lat},${lon}`;
    const label = 'Risk Assessment Location';
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
      web: `${scheme}${latLng}`
    });
    Linking.openURL(url);
  };

  const requestPermissions = async () => {
    setError('');
    if (!cameraPermission?.granted) {
      const cam = await requestCameraPermission();
      if (!cam.granted) {
        setError('Camera permission denied');
        return false;
      }
    }
    const loc = await Location.requestForegroundPermissionsAsync();
    if (loc.status !== 'granted') {
      setError('Location permission denied');
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    const ok = await requestPermissions();
    if (ok) setShowCamera(true);
  };

  const captureAndAssess = async () => {
    if (!cameraRef.current) return;
    setCapturing(true);
    setError('');
    setResult(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
      setShowCamera(false);
      setLoading(true);
      const pos = await Location.getLastKnownPositionAsync() || await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const payload = {
        vehicleId: 'mobile_device',
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        timestamp: new Date().toISOString(),
        imageUri: manipulated.uri,
      };
      const data = await assessAIRisk(payload);
      if (!data.success) {
        setError(data.error || 'Assessment failed');
      } else {
        setResult(data);
      }
    } catch (e) {
      console.log('[AIRiskScreen] capture error', e);
      setError('Failed to capture/assess risk. Please try again.');
    } finally {
      setCapturing(false);
      setLoading(false);
    }
  };

  const handleWebUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const locPerm = await Location.requestForegroundPermissionsAsync();
      let lat = 42.3601, lon = -71.0589; // fallback
      if (locPerm.status === 'granted') {
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch {}
      }
      const compressedFile = await new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          try {
            const maxDim = 800;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              const scale = Math.min(maxDim / width, maxDim / height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (!blob) return reject(new Error('Compression failed'));
              const newFile = new File([blob], 'upload.jpg', { type: 'image/jpeg' });
              resolve(newFile);
            }, 'image/jpeg', 0.6);
          } catch (err) { reject(err); }
        };
        img.onerror = reject;
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(file);
      });
      const data = await assessAIRisk({
        vehicleId: 'web_device',
        lat,
        lon,
        timestamp: new Date().toISOString(),
        file: compressedFile,
      });
      if (!data.success) {
        setError(data.error || 'Assessment failed');
      } else {
        setResult(data);
      }
    } catch (e) {
      console.log('[AIRiskScreen] web upload error', e);
      setError('Failed to process image');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  if (Platform.OS === 'web') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🤖 AI Risk Assessment</Text>
            <Text style={styles.description}>Upload a photo of the road surface to assess slip risk using AI vision analysis</Text>
          </View>
          <View style={styles.uploadSection}>
            <input type="file" accept="image/*" onChange={handleWebUpload} style={{ display: 'none' }} id="image-upload" disabled={loading} />
            <label htmlFor="image-upload">
              <View style={[styles.uploadButton, loading && styles.disabledButton]}>
                <Text style={styles.uploadIcon}>📸</Text>
                <Text style={styles.uploadText}>{loading ? 'Processing...' : 'Upload Road Image'}</Text>
              </View>
            </label>
          </View>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Analyzing image...</Text>
            </View>
          )}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {result && (
            <View style={styles.resultsContainer}>
              {/* Risk Card */}
              <View style={styles.riskCard}>
                <Text style={styles.cardTitle}>🎯 Risk Assessment</Text>
                <View style={styles.riskLevelContainer}>
                  <Text style={styles.riskLevelLabel}>Current Risk Level</Text>
                  <View style={[styles.riskBadge, styles[`risk${result.riskLevel}`]]}>
                    <Text style={styles.riskBadgeText}>{result.riskLevel || 'UNKNOWN'}</Text>
                  </View>
                </View>
                {result.gradientAnalysis?.confidence && (
                  <View style={styles.confidenceBar}>
                    <Text style={styles.confidenceLabel}>Confidence</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${result.gradientAnalysis.confidence * 100}%` }]} />
                    </View>
                    <Text style={styles.confidenceValue}>{(result.gradientAnalysis.confidence * 100).toFixed(1)}%</Text>
                  </View>
                )}
                {result.cumulativeSlipScore && (
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Cumulative Slip Score</Text>
                    <Text style={styles.scoreValue}>{result.cumulativeSlipScore}</Text>
                  </View>
                )}
              </View>
              {result.location && (
                <View style={styles.mapCard}>
                  <Text style={styles.cardTitle}>📍 Location</Text>
                  <View style={styles.mapContainer}>
                    <View style={styles.coordContainer}>
                      <Text style={styles.coordLabel}>Latitude:</Text>
                      <Text style={styles.coordValue}>{result.location.lat.toFixed(6)}</Text>
                    </View>
                    <View style={styles.coordContainer}>
                      <Text style={styles.coordLabel}>Longitude:</Text>
                      <Text style={styles.coordValue}>{result.location.lon.toFixed(6)}</Text>
                    </View>
                    <View style={styles.mapVisual}>
                      <Text style={styles.mapVisualIcon}>🗺️</Text>
                      <Text style={styles.mapVisualText}>Assessment Location</Text>
                      <TouchableOpacity style={styles.openMapButton} onPress={() => openInMaps(result.location.lat, result.location.lon)}>
                        <Text style={styles.openMapIcon}>📍</Text>
                        <Text style={styles.openMapText}>Open in Maps</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              <WeatherCard weather={result.currentWeather} />
              {result.slipsData && (
                <View style={styles.slipsCard}>
                  <Text style={styles.cardTitle}>⚠️ Nearby Slip Incidents</Text>
                  <View style={styles.slipsHeader}>
                    <Text style={styles.slipsCount}>{result.slipsData.nearbySlipsCount || 0}</Text>
                    <Text style={styles.slipsCountLabel}>incidents within proximity</Text>
                  </View>
                  {result.slipsData.slips && result.slipsData.slips.length > 0 && (
                    <ScrollView style={styles.slipsScrollView} nestedScrollEnabled={true}>
                      <View style={styles.slipsList}>
                        {result.slipsData.slips.map((slip, idx) => (
                          <TouchableOpacity
                            key={slip.id || idx}
                            style={styles.slipItem}
                            onPress={() => slip.geoPoint?.coordinates && openInMaps(slip.geoPoint.coordinates[1], slip.geoPoint.coordinates[0])}
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
              )}
              <PopulationMetricsCard populationData={result.populationData} />
              <RiskFactorsCard riskFactors={result.riskFactors} aiAssessment={result.aiRoadSlipAssessment} />
              {result.gradientAnalysis && (
                <View style={styles.gradientCard}>
                  <Text style={styles.cardTitle}>🔬 Gradient Analysis</Text>
                  <View style={styles.gradientGrid}>
                    <View style={styles.gradientItem}>
                      <Text style={styles.gradientValue}>{(result.gradientAnalysis.environmentalRisk * 100).toFixed(1)}%</Text>
                      <Text style={styles.gradientLabel}>Environmental</Text>
                    </View>
                    <View style={styles.gradientItem}>
                      <Text style={styles.gradientValue}>{(result.gradientAnalysis.historicalRisk * 100).toFixed(1)}%</Text>
                      <Text style={styles.gradientLabel}>Historical</Text>
                    </View>
                    <View style={styles.gradientItem}>
                      <Text style={styles.gradientValue}>{(result.gradientAnalysis.combinedRisk * 100).toFixed(1)}%</Text>
                      <Text style={styles.gradientLabel}>Combined</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />
        <View style={styles.cameraOverlay}>
          <View style={styles.instructionBox}>
            <Text style={styles.instructions}>📍 Center the road surface</Text>
            <Text style={styles.instructionsSub}>Tap capture when ready</Text>
          </View>
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)} disabled={capturing}>
              <Text style={styles.cancelText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.captureBtn, capturing && styles.capturingBtn]} onPress={captureAndAssess} disabled={capturing}>
              {capturing ? <ActivityIndicator color="#fff" size="large" /> : <View style={styles.captureInner} />}
            </TouchableOpacity>
            <View style={{ width: 64 }} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🤖 AI Risk Assessment</Text>
          <Text style={styles.description}>Capture a photo of the road to assess slip risk using AI vision analysis</Text>
        </View>
        <TouchableOpacity style={[styles.primaryButton, loading && styles.disabledButton]} onPress={openCamera} disabled={loading}>
          <Text style={styles.primaryButtonIcon}>📸</Text>
          <Text style={styles.primaryButtonText}>Open Camera</Text>
        </TouchableOpacity>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Analyzing image...</Text>
          </View>
        )}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {result && (
          <View style={styles.resultsContainer}>
            <View style={styles.riskCard}>
              <Text style={styles.cardTitle}>🎯 Risk Assessment</Text>
              <View style={styles.riskLevelContainer}>
                <Text style={styles.riskLevelLabel}>Current Risk Level</Text>
                <View style={[styles.riskBadge, styles[`risk${result.riskLevel}`]]}>
                  <Text style={styles.riskBadgeText}>{result.riskLevel || 'UNKNOWN'}</Text>
                </View>
              </View>
              {result.gradientAnalysis?.confidence && (
                <View style={styles.confidenceBar}>
                  <Text style={styles.confidenceLabel}>Confidence</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${result.gradientAnalysis.confidence * 100}%` }]} />
                  </View>
                  <Text style={styles.confidenceValue}>{(result.gradientAnalysis.confidence * 100).toFixed(1)}%</Text>
                </View>
              )}
              {result.cumulativeSlipScore && (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>Cumulative Slip Score</Text>
                  <Text style={styles.scoreValue}>{result.cumulativeSlipScore}</Text>
                </View>
              )}
            </View>
            {result.location && (
              <View style={styles.mapCard}>
                <Text style={styles.cardTitle}>📍 Location</Text>
                <View style={styles.mapContainer}>
                  <View style={styles.coordContainer}>
                    <Text style={styles.coordLabel}>Latitude:</Text>
                    <Text style={styles.coordValue}>{result.location.lat.toFixed(6)}</Text>
                  </View>
                  <View style={styles.coordContainer}>
                    <Text style={styles.coordLabel}>Longitude:</Text>
                    <Text style={styles.coordValue}>{result.location.lon.toFixed(6)}</Text>
                  </View>
                  <View style={styles.mapVisual}>
                    <Text style={styles.mapVisualIcon}>🗺️</Text>
                    <Text style={styles.mapVisualText}>Assessment Location</Text>
                    <TouchableOpacity style={styles.openMapButton} onPress={() => openInMaps(result.location.lat, result.location.lon)}>
                      <Text style={styles.openMapIcon}>📍</Text>
                      <Text style={styles.openMapText}>Open in Maps</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
              <WeatherCard weather={result.currentWeather} />
            {result.slipsData && (
              <View style={styles.slipsCard}>
                <Text style={styles.cardTitle}>⚠️ Nearby Slip Incidents</Text>
                <View style={styles.slipsHeader}>
                  <Text style={styles.slipsCount}>{result.slipsData.nearbySlipsCount || 0}</Text>
                  <Text style={styles.slipsCountLabel}>incidents within proximity</Text>
                </View>
                {result.slipsData.slips && result.slipsData.slips.length > 0 && (
                  <ScrollView style={styles.slipsScrollView} nestedScrollEnabled={true}>
                    <View style={styles.slipsList}>
                      {result.slipsData.slips.map((slip, idx) => (
                        <TouchableOpacity
                          key={slip.id || idx}
                          style={styles.slipItem}
                          onPress={() => slip.geoPoint?.coordinates && openInMaps(slip.geoPoint.coordinates[1], slip.geoPoint.coordinates[0])}
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
            )}
            <PopulationMetricsCard populationData={result.populationData} />
            <RiskFactorsCard riskFactors={result.riskFactors} aiAssessment={result.aiRoadSlipAssessment} />
            {result.gradientAnalysis && (
              <View style={styles.gradientCard}>
                <Text style={styles.cardTitle}>🔬 Gradient Analysis</Text>
                <View style={styles.gradientGrid}>
                  <View style={styles.gradientItem}>
                    <Text style={styles.gradientValue}>{(result.gradientAnalysis.environmentalRisk * 100).toFixed(1)}%</Text>
                    <Text style={styles.gradientLabel}>Environmental</Text>
                  </View>
                  <View style={styles.gradientItem}>
                    <Text style={styles.gradientValue}>{(result.gradientAnalysis.historicalRisk * 100).toFixed(1)}%</Text>
                    <Text style={styles.gradientLabel}>Historical</Text>
                  </View>
                  <View style={styles.gradientItem}>
                    <Text style={styles.gradientValue}>{(result.gradientAnalysis.combinedRisk * 100).toFixed(1)}%</Text>
                    <Text style={styles.gradientLabel}>Combined</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

