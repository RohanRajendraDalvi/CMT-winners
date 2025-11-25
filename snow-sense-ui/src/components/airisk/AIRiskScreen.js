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
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>✅ Assessment Complete</Text>
              <View style={styles.resultContent}>
                {result.riskLevel && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Risk Level:</Text>
                    <View style={[styles.badge, styles[`badge${result.riskLevel}`]]}>
                      <Text style={styles.badgeText}>{result.riskLevel}</Text>
                    </View>
                  </View>
                )}
                {result.confidence && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Confidence:</Text>
                    <Text style={styles.resultValue}>{(result.confidence * 100).toFixed(1)}%</Text>
                  </View>
                )}
                <View style={styles.jsonContainer}>
                  <Text style={styles.jsonLabel}>Full Response:</Text>
                  <Text style={styles.jsonText}>{JSON.stringify(result, null, 2)}</Text>
                </View>
              </View>
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
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>✅ Assessment Complete</Text>
            <View style={styles.resultContent}>
              {result.riskLevel && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Risk Level:</Text>
                  <View style={[styles.badge, styles[`badge${result.riskLevel}`]]}>
                    <Text style={styles.badgeText}>{result.riskLevel}</Text>
                  </View>
                </View>
              )}
              {result.confidence && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Confidence:</Text>
                  <Text style={styles.resultValue}>{(result.confidence * 100).toFixed(1)}%</Text>
                </View>
              )}
              <View style={styles.jsonContainer}>
                <Text style={styles.jsonLabel}>Full Response:</Text>
                <Text style={styles.jsonText}>{JSON.stringify(result, null, 2)}</Text>
              </View>
            </View>
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
  resultBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  resultContent: {
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  resultValue: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeLow: {
    backgroundColor: '#166534',
  },
  badgeMedium: {
    backgroundColor: '#854d0e',
  },
  badgeHigh: {
    backgroundColor: '#7f1d1d',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  jsonContainer: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  jsonLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  jsonText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
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
});