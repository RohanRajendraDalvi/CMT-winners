import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { loadingStyles } from '../../styles/loadingStyles';
import { theme } from '../../styles/theme';

const LoadingScreen = () => (
  <View style={loadingStyles.centered}>
    <ActivityIndicator color={theme.primary} />
    <Text style={loadingStyles.loadingText}>Checking session…</Text>
  </View>
);

export default LoadingScreen;
