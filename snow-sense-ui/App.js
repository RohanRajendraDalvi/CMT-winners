import React, { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  SafeAreaView,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

import { reportSlip, detectNearbySlips } from './src/api/slipService';

// ✅ Firebase (web-safe)
import { auth } from './src/api/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { useAuthSession } from './src/hooks/useAuthSession';

import LoadingScreen from './src/components/common/LoadingScreen';
import AuthScreen from './src/components/auth/AuthScreen';
import Dashboard from './src/components/dashboard/DashboardScreen';
import MapScreen from './src/components/map/mapScreen';
import AIRiskScreen from './src/components/airisk/AIRiskScreen';

import { commonStyles } from './src/styles/commonStyles';

export default function App() {
  const { user, loading: authLoading } = useAuthSession();

  const [authError, setAuthError] = useState('');
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [nearbySlips, setNearbySlips] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const clearAuthError = useCallback(() => {
    setAuthError('');
  }, []);

  const handleAuthSubmit = useCallback(async ({ mode, email, password }) => {
    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        setAuthError('Please enter both email and password.');
        return;
      }

      if (mode === 'sign-in') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (error) {
      setAuthError(error?.message || 'Authentication failed.');
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentScreen('dashboard');
    } catch {
      Alert.alert('Error', 'Failed to log out.');
    }
  }, []);

  const getCurrentPosition = useCallback(async () => {
    if (Platform.OS === 'web') {
      return { lat: 42.3601, lon: -71.0589 };
    }

    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return { lat: 42.3601, lon: -71.0589 };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
    };
  }, []);

  const handleReportSlip = useCallback(async () => {
    try {
      const pos = await getCurrentPosition();
      const vehicleId =
        user?.email ?? user?.uid ?? 'unknown-vehicle';

      const ok = await reportSlip({
        vehicleId,
        lat: pos.lat,
        lon: pos.lon,
        timestamp: new Date().toISOString(),
      });

      if (ok) {
        Alert.alert('Reported', 'Slip reported');
      } else {
        Alert.alert('Error', 'Server rejected report');
      }
    } catch {
      Alert.alert('Error', 'Failed to report');
    }
  }, [getCurrentPosition, user]);

  const handleDetectNearby = useCallback(async () => {
    try {
      const pos = await getCurrentPosition();

      const res = await detectNearbySlips({
        lat: pos.lat,
        lon: pos.lon,
        timestamp: new Date().toISOString(),
      });

      setUserLocation(pos);
      setNearbySlips(res?.slips || []);
      setCurrentScreen('map');
    } catch {
      Alert.alert('Error', 'Detection failed');
    }
  }, [getCurrentPosition]);

  if (authLoading) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={commonStyles.container}>
        <StatusBar style="light" />

        {!user ? (
          <AuthScreen
            onSubmit={handleAuthSubmit}
            error={authError}
            onClearError={clearAuthError}
          />
        ) : currentScreen === 'dashboard' ? (
          <Dashboard
            onLogout={handleLogout}
            onReportSlip={handleReportSlip}
            onDetectNearby={handleDetectNearby}
            onOpenAIRisk={() => setCurrentScreen('airisk')}
          />
        ) : currentScreen === 'airisk' ? (
          <AIRiskScreen onBack={() => setCurrentScreen('dashboard')} />
        ) : (
          <MapScreen
            slips={nearbySlips}
            userLocation={userLocation}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
