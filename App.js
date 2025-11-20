import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { reportSlip, detectNearbySlips } from './src/api/slipService';
import { auth } from './src/api/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'sign-up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const sub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setAuthLoading(false);
    });
    return () => sub();
  }, []);

  const handleAuth = async () => {
    try {
      setAuthError('');
      if (mode === 'sign-in') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      console.log('AUTH ERROR', e);

      const code = e.code || '';
      let message = 'Something went wrong. Please try again.';

      if (mode === 'sign-in') {
        // For sign-in, default to generic invalid credentials
        message = 'Invalid email or password. Please try again.';
        if (code === 'auth/user-not-found') {
          message = 'No account found with that email.';
        }
      } else {
        // For sign-up, keep more specific errors
        if (code === 'auth/email-already-in-use') {
          message = 'An account with this email already exists.';
        } else if (code === 'auth/invalid-email') {
          message = 'Please enter a valid email address.';
        } else if (code === 'auth/weak-password') {
          message = 'Password should be at least 6 characters.';
        }
      }

      setAuthError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const handleReportSlip = async () => {
    try {
      await reportSlip();
      Alert.alert('Reported', 'Your slip has been reported.');
    } catch (e) {
      Alert.alert('Error', 'Failed to report slip.');
    }
  };

  const handleDetectNearbySlips = async () => {
    try {
      const count = await detectNearbySlips();
      const message = count === 0 ? 'No nearby slips detected.' : `${count} nearby slip(s) detected.`;
      Alert.alert('Nearby Slips', message);
    } catch (e) {
      Alert.alert('Error', 'Failed to detect nearby slips.');
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <ActivityIndicator color="#22c55e" />
          <Text style={styles.loadingText}>Checking session…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>Snow Sense</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <TouchableOpacity style={[styles.authButton, styles.primaryButton]} onPress={handleAuth}>
            <Text style={styles.buttonText}>
              {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          >
            <Text style={styles.switchModeText}>
              {mode === 'sign-in'
                ? 'New here? Create an account'
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Snow Sense</Text>
        <Text style={styles.subtitle}>Road Surface Alerts</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.trackingCard}>
          <View style={styles.road}>
            <View style={styles.laneDivider} />
          </View>
          <View style={styles.vehicleIcon} />
          <View style={styles.signalDotOuter}>
            <View style={styles.signalDotInner} />
          </View>
        </View>

        <Text style={styles.description}>
          Help improve road safety by reporting slippery road conditions and checking for slips reported near you.
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleReportSlip}>
            <Text style={styles.buttonText}>Report Slip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleDetectNearbySlips}>
            <Text style={styles.buttonText}>Nearby Slips</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const theme = {
  background: '#050816',
  card: '#111827',
  primary: '#22c55e',
  secondary: '#3b82f6',
  textPrimary: '#e5e7eb',
  textSecondary: '#9ca3af',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: theme.textSecondary,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: theme.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  input: {
    alignSelf: 'center',
    width: '80%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.textPrimary,
    backgroundColor: '#020617',
    marginBottom: 12,
  },
  errorText: {
    color: '#f97373',
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 13,
  },
  authButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  trackingCard: {
    width: '100%',
    flex: 0.4,
    borderRadius: 20,
    backgroundColor: theme.card,
    marginBottom: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  road: {
    position: 'absolute',
    width: 120,
    height: '120%',
    backgroundColor: '#020617',
    borderRadius: 999,
    borderColor: '#111827',
    borderWidth: 2,
  },
  laneDivider: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#4b5563',
    transform: [{ translateX: -1 }],
  },
  vehicleIcon: {
    width: 36,
    height: 60,
    borderRadius: 12,
    backgroundColor: theme.primary,
    borderWidth: 3,
    borderColor: '#bbf7d0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  signalDotOuter: {
    position: 'absolute',
    right: 28,
    top: 32,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: theme.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signalDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.secondary,
  },
  description: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 32,
  },
  switchMode: {
    marginTop: 12,
  },
  switchModeText: {
    color: theme.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  secondaryButton: {
    backgroundColor: theme.secondary,
  },
  logoutButton: {
    position: 'absolute',
    right: 24,
    top: 36,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  logoutText: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  buttonText: {
    color: '#0b1120',
    fontSize: 16,
    fontWeight: '600',
  },
});
