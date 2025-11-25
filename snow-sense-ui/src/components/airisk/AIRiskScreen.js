import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import { commonStyles } from '../../styles/commonStyles';
import { assessAIRisk } from '../../api/AIrisk';

export default function AIRiskScreen({ onBack }) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const requestPermissions = async () => {
    setError('');
    
    // Request camera permission
    if (!cameraPermission?.granted) {
      const cam = await requestCameraPermission();
      if (!cam.granted) {
        setError('Camera permission denied');
        return false;
      }
    }
    
    // Request location permission
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
      // Capture at lower quality to reduce initial size
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      // Resize & compress further (max width 800px) for upload efficiency
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
      setShowCamera(false);
      setLoading(true);

      const pos = await Location.getLastKnownPositionAsync() || 
                   await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
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

  // Web fallback: file upload
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
      // Compress image client-side using canvas
      const compressedFile = await new Promise((resolve, reject) => {
        const img = new Image();
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
            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error('Compression failed'));
                const newFile = new File([blob], 'upload.jpg', { type: 'image/jpeg' });
                console.log('[AIRiskScreen:web] original size KB:', (file.size/1024).toFixed(2), 'compressed size KB:', (blob.size/1024).toFixed(2));
                resolve(newFile);
              },
              'image/jpeg',
              0.6
            );
          } catch (err) {
            reject(err);
          }
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

  // Web version with file upload
  if (Platform.OS === 'web') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🤖 AI Risk Assessment</Text>
            <Text style={styles.description}>
              Upload a photo of the road surface to assess slip risk using AI vision analysis
            </Text>
          </View>

          <View style={styles.uploadSection}>
            <input
              type="file"
              accept="image/*"
              onChange={handleWebUpload}
              style={{ display: 'none' }}
              id="image-upload"
              disabled={loading}
            />
            <label htmlFor="image-upload">
              <View style={[styles.uploadButton, loading && styles.disabledButton]}>
                <Text style={styles.uploadIcon}>📸</Text>
                <Text style={styles.uploadText}>
                  {loading ? 'Processing...' : 'Upload Road Image'}
                </Text>
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
              {/* Main Risk Card */}
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

              {/* Location & Map Card */}
              {result.location && (
                <View style={styles.mapCard}>
                  <Text style={styles.cardTitle}>📍 Location</Text>
                  <View style={styles.mapContainer}>
                    <View style={styles.mapPlaceholder}>
                      <Text style={styles.mapIcon}>🗺️</Text>
                      <Text style={styles.coordText}>
                        {result.location.lat.toFixed(6)}, {result.location.lon.toFixed(6)}
                      </Text>
                    </View>
                    {/* Static map image */}
                    {Platform.OS === 'web' && (
                      <img
                        src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+6366f1(${result.location.lon},${result.location.lat})/${result.location.lon},${result.location.lat},13,0/400x200@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
                        alt="Location map"
                        style={{ width: '100%', height: 200, borderRadius: 12, marginTop: 12 }}
                      />
                    )}
                  </View>
                </View>
              )}

              {/* Weather Card */}
              {result.currentWeather && (
                <View style={styles.weatherCard}>
                  <Text style={styles.cardTitle}>🌤️ Current Weather</Text>
                  <View style={styles.weatherContent}>
                    <View style={styles.weatherRow}>
                      <View style={styles.weatherItem}>
                        <Text style={styles.weatherIcon}>🌡️</Text>
                        <Text style={styles.weatherValue}>{result.currentWeather.temperature_C}°C</Text>
                        <Text style={styles.weatherLabel}>Temperature</Text>
                      </View>
                      <View style={styles.weatherItem}>
                        <Text style={styles.weatherIcon}>💧</Text>
                        <Text style={styles.weatherValue}>{result.currentWeather.precipitation}</Text>
                        <Text style={styles.weatherLabel}>Precipitation</Text>
                      </View>
                    </View>
                    <View style={styles.weatherDescription}>
                      <Text style={styles.weatherDescText}>{result.currentWeather.description}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Nearby Slips Card */}
              {result.slipsData && (
                <View style={styles.slipsCard}>
                  <Text style={styles.cardTitle}>⚠️ Nearby Slip Incidents</Text>
                  <View style={styles.slipsHeader}>
                    <Text style={styles.slipsCount}>{result.slipsData.nearbySlipsCount || 0}</Text>
                    <Text style={styles.slipsCountLabel}>incidents within proximity</Text>
                  </View>
                  {result.slipsData.slips && result.slipsData.slips.length > 0 && (
                    <View style={styles.slipsList}>
                      {result.slipsData.slips.slice(0, 3).map((slip, idx) => (
                        <View key={slip.id || idx} style={styles.slipItem}>
                          <View style={styles.slipDot} />
                          <View style={styles.slipInfo}>
                            <Text style={styles.slipTime}>
                              {new Date(slip.timestamp).toLocaleDateString()} at{' '}
                              {new Date(slip.timestamp).toLocaleTimeString()}
                            </Text>
                            {slip.weather?.main && (
                              <Text style={styles.slipWeather}>
                                {slip.weather.main.temp}°C, {slip.weather.weather?.[0]?.description || 'N/A'}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                      {result.slipsData.slips.length > 3 && (
                        <Text style={styles.moreSlips}>+ {result.slipsData.slips.length - 3} more incidents</Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Risk Factors Card */}
              {result.riskFactors && (
                <View style={styles.factorsCard}>
                  <Text style={styles.cardTitle}>📊 Risk Factors Analysis</Text>
                  <View style={styles.factorsList}>
                    {result.riskFactors.temperatureFrictionCoeff !== undefined && (
                      <View style={styles.factorRow}>
                        <Text style={styles.factorLabel}>Temperature Friction</Text>
                        <View style={styles.factorBar}>
                          <View style={[styles.factorFill, { width: `${result.riskFactors.temperatureFrictionCoeff * 100}%`, backgroundColor: '#f59e0b' }]} />
                        </View>
                        <Text style={styles.factorValue}>{(result.riskFactors.temperatureFrictionCoeff * 100).toFixed(1)}%</Text>
                      </View>
                    )}
                    {result.riskFactors.moistureRiskFactor !== undefined && (
                      <View style={styles.factorRow}>
                        <Text style={styles.factorLabel}>Moisture Risk</Text>
                        <View style={styles.factorBar}>
                          <View style={[styles.factorFill, { width: `${result.riskFactors.moistureRiskFactor * 100}%`, backgroundColor: '#3b82f6' }]} />
                        </View>
                        <Text style={styles.factorValue}>{(result.riskFactors.moistureRiskFactor * 100).toFixed(1)}%</Text>
                      </View>
                    )}
                    {result.riskFactors.historicalWeight !== undefined && (
                      <View style={styles.factorRow}>
                        <Text style={styles.factorLabel}>Historical Weight</Text>
                        <View style={styles.factorBar}>
                          <View style={[styles.factorFill, { width: `${result.riskFactors.historicalWeight * 100}%`, backgroundColor: '#8b5cf6' }]} />
                        </View>
                        <Text style={styles.factorValue}>{(result.riskFactors.historicalWeight * 100).toFixed(1)}%</Text>
                      </View>
                    )}
                    {result.aiRoadSlipAssessment?.visionScore !== undefined && (
                      <View style={styles.factorRow}>
                        <Text style={styles.factorLabel}>AI Vision Score</Text>
                        <View style={styles.factorBar}>
                          <View style={[styles.factorFill, { width: `${result.aiRoadSlipAssessment.normalized * 100}%`, backgroundColor: '#6366f1' }]} />
                        </View>
                        <Text style={styles.factorValue}>{(result.aiRoadSlipAssessment.normalized * 100).toFixed(1)}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Gradient Analysis Card */}
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

  // Native camera view
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          ref={cameraRef}
          facing="back"
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.instructionBox}>
            <Text style={styles.instructions}>📍 Center the road surface</Text>
            <Text style={styles.instructionsSub}>Tap capture when ready</Text>
          </View>
          
          <View style={styles.controlsRow}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => setShowCamera(false)}
              disabled={capturing}
            >
              <Text style={styles.cancelText}>✕</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.captureBtn, capturing && styles.capturingBtn]} 
              onPress={captureAndAssess} 
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>
            
            <View style={{ width: 64 }} />
          </View>
        </View>
      </View>
    );
  }

  // Native main screen
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🤖 AI Risk Assessment</Text>
          <Text style={styles.description}>
            Capture a photo of the road to assess slip risk using AI vision analysis
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.disabledButton]} 
          onPress={openCamera} 
          disabled={loading}
        >
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
            {/* Main Risk Card */}
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

            {/* Location & Map Card */}
            {result.location && (
              <View style={styles.mapCard}>
                <Text style={styles.cardTitle}>📍 Location</Text>
                <View style={styles.mapContainer}>
                  <View style={styles.mapPlaceholder}>
                    <Text style={styles.mapIcon}>🗺️</Text>
                    <Text style={styles.coordText}>
                      {result.location.lat.toFixed(6)}, {result.location.lon.toFixed(6)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Weather Card */}
            {result.currentWeather && (
              <View style={styles.weatherCard}>
                <Text style={styles.cardTitle}>🌤️ Current Weather</Text>
                <View style={styles.weatherContent}>
                  <View style={styles.weatherRow}>
                    <View style={styles.weatherItem}>
                      <Text style={styles.weatherIcon}>🌡️</Text>
                      <Text style={styles.weatherValue}>{result.currentWeather.temperature_C}°C</Text>
                      <Text style={styles.weatherLabel}>Temperature</Text>
                    </View>
                    <View style={styles.weatherItem}>
                      <Text style={styles.weatherIcon}>💧</Text>
                      <Text style={styles.weatherValue}>{result.currentWeather.precipitation}</Text>
                      <Text style={styles.weatherLabel}>Precipitation</Text>
                    </View>
                  </View>
                  <View style={styles.weatherDescription}>
                    <Text style={styles.weatherDescText}>{result.currentWeather.description}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Nearby Slips Card */}
            {result.slipsData && (
              <View style={styles.slipsCard}>
                <Text style={styles.cardTitle}>⚠️ Nearby Slip Incidents</Text>
                <View style={styles.slipsHeader}>
                  <Text style={styles.slipsCount}>{result.slipsData.nearbySlipsCount || 0}</Text>
                  <Text style={styles.slipsCountLabel}>incidents within proximity</Text>
                </View>
                {result.slipsData.slips && result.slipsData.slips.length > 0 && (
                  <View style={styles.slipsList}>
                    {result.slipsData.slips.slice(0, 3).map((slip, idx) => (
                      <View key={slip.id || idx} style={styles.slipItem}>
                        <View style={styles.slipDot} />
                        <View style={styles.slipInfo}>
                          <Text style={styles.slipTime}>
                            {new Date(slip.timestamp).toLocaleDateString()} at{' '}
                            {new Date(slip.timestamp).toLocaleTimeString()}
                          </Text>
                          {slip.weather?.main && (
                            <Text style={styles.slipWeather}>
                              {slip.weather.main.temp}°C, {slip.weather.weather?.[0]?.description || 'N/A'}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                    {result.slipsData.slips.length > 3 && (
                      <Text style={styles.moreSlips}>+ {result.slipsData.slips.length - 3} more incidents</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Risk Factors Card */}
            {result.riskFactors && (
              <View style={styles.factorsCard}>
                <Text style={styles.cardTitle}>📊 Risk Factors Analysis</Text>
                <View style={styles.factorsList}>
                  {result.riskFactors.temperatureFrictionCoeff !== undefined && (
                    <View style={styles.factorRow}>
                      <Text style={styles.factorLabel}>Temperature Friction</Text>
                      <View style={styles.factorBar}>
                        <View style={[styles.factorFill, { width: `${result.riskFactors.temperatureFrictionCoeff * 100}%`, backgroundColor: '#f59e0b' }]} />
                      </View>
                      <Text style={styles.factorValue}>{(result.riskFactors.temperatureFrictionCoeff * 100).toFixed(1)}%</Text>
                    </View>
                  )}
                  {result.riskFactors.moistureRiskFactor !== undefined && (
                    <View style={styles.factorRow}>
                      <Text style={styles.factorLabel}>Moisture Risk</Text>
                      <View style={styles.factorBar}>
                        <View style={[styles.factorFill, { width: `${result.riskFactors.moistureRiskFactor * 100}%`, backgroundColor: '#3b82f6' }]} />
                      </View>
                      <Text style={styles.factorValue}>{(result.riskFactors.moistureRiskFactor * 100).toFixed(1)}%</Text>
                    </View>
                  )}
                  {result.riskFactors.historicalWeight !== undefined && (
                    <View style={styles.factorRow}>
                      <Text style={styles.factorLabel}>Historical Weight</Text>
                      <View style={styles.factorBar}>
                        <View style={[styles.factorFill, { width: `${result.riskFactors.historicalWeight * 100}%`, backgroundColor: '#8b5cf6' }]} />
                      </View>
                      <Text style={styles.factorValue}>{(result.riskFactors.historicalWeight * 100).toFixed(1)}%</Text>
                    </View>
                  )}
                  {result.aiRoadSlipAssessment?.visionScore !== undefined && (
                    <View style={styles.factorRow}>
                      <Text style={styles.factorLabel}>AI Vision Score</Text>
                      <View style={styles.factorBar}>
                        <View style={[styles.factorFill, { width: `${result.aiRoadSlipAssessment.normalized * 100}%`, backgroundColor: '#6366f1' }]} />
                      </View>
                      <Text style={styles.factorValue}>{(result.aiRoadSlipAssessment.normalized * 100).toFixed(1)}%</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Gradient Analysis Card */}
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

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0f172a',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
  },
  primaryButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    cursor: 'pointer',
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 24,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 12,
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  errorText: {
    color: '#fecaca',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  backButton: {
    backgroundColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  instructionBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  instructions: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  instructionsSub: {
    color: '#cbd5e1',
    textAlign: 'center',
    fontSize: 14,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  capturingBtn: {
    opacity: 0.6,
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366f1',
  },

  // Results Container
  resultsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  
  // Card Styles
  riskCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  riskLevelContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  riskLevelLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  riskLOW: {
    backgroundColor: '#166534',
  },
  riskMODERATE: {
    backgroundColor: '#854d0e',
  },
  riskHIGH: {
    backgroundColor: '#7f1d1d',
  },
  riskBadgeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  confidenceBar: {
    marginTop: 16,
  },
  confidenceLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  confidenceValue: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  scoreValue: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
  },
  
  // Map Card
  mapCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mapContainer: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  mapPlaceholder: {
    backgroundColor: '#0f172a',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  coordText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Weather Card
  weatherCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  weatherContent: {
    gap: 16,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherItem: {
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  weatherValue: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  weatherLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  weatherDescription: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  weatherDescText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  
  // Slips Card
  slipsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  slipsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  slipsCount: {
    color: '#f59e0b',
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  slipsCountLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  slipsList: {
    gap: 12,
  },
  slipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
  },
  slipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginTop: 6,
    marginRight: 12,
  },
  slipInfo: {
    flex: 1,
  },
  slipTime: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  slipWeather: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '400',
  },
  moreSlips: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Factors Card
  factorsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  factorsList: {
    gap: 16,
  },
  factorRow: {
    gap: 8,
  },
  factorLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  factorBar: {
    height: 24,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    overflow: 'hidden',
  },
  factorFill: {
    height: '100%',
    borderRadius: 6,
  },
  factorValue: {
    color: '#f1f5f9',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 4,
  },
  
  // Gradient Card
  gradientCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gradientGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  gradientItem: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  gradientValue: {
    color: '#6366f1',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  gradientLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});