import React, { useCallback, useState } from 'react';
import { SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { reportSlip, detectNearbySlips } from './src/api/slipService';
import { auth } from './src/api/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuthSession } from './src/hooks/useAuthSession';
import LoadingScreen from './src/components/common/LoadingScreen';
import AuthScreen from './src/components/auth/AuthScreen';
import DashboardScreen from './src/components/dashboard/DashboardScreen';
import { commonStyles } from './src/styles/commonStyles';

const getAuthErrorMessage = (mode, code) => {
  if (mode === 'sign-in') {
    if (code === 'auth/user-not-found') {
      return 'No account found with that email.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Invalid email or password. Please try again.';
    }
    return 'Invalid email or password. Please try again.';
  }

  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters.';
  }

  return 'Something went wrong. Please try again.';
};

export default function App() {
  const { user, loading: authLoading } = useAuthSession(auth);
  const [authError, setAuthError] = useState('');

  const clearAuthError = useCallback(() => {
    setAuthError('');
  }, []);

  const handleAuthSubmit = useCallback(
    async ({ mode, email, password }) => {
      try {
        clearAuthError();

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
        console.log('AUTH ERROR', error);
        const code = error?.code ?? '';
        setAuthError(getAuthErrorMessage(mode, code));
      }
    },
    [clearAuthError],
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  }, []);

  const handleReportSlip = useCallback(async () => {
    console.log('Report Slip button pressed');
    try {
      await reportSlip();
      Alert.alert('Reported', 'Your slip has been reported.');
    } catch (error) {
      Alert.alert('Error', 'Failed to report slip.');
    }
  }, []);

  const handleDetectNearbySlips = useCallback(async () => {
    console.log('Nearby Slips button pressed');
    try {
      const count = await detectNearbySlips();
      const message = count === 0 ? 'No nearby slips detected.' : `${count} nearby slip(s) detected.`;
      Alert.alert('Nearby Slips', message);
    } catch (error) {
      Alert.alert('Error', 'Failed to detect nearby slips.');
    }
  }, []);

  if (authLoading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <StatusBar style="light" />
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <StatusBar style="light" />
        <AuthScreen onSubmit={handleAuthSubmit} error={authError} onClearError={clearAuthError} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar style="light" />
      <DashboardScreen
        onLogout={handleLogout}
        onReportSlip={handleReportSlip}
        onDetectNearbySlips={handleDetectNearbySlips}
      />
    </SafeAreaView>
  );
}

