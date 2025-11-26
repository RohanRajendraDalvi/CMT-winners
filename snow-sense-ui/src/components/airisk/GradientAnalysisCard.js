import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './airiskStyles';

export function GradientAnalysisCard({ gradientAnalysis }) {
  if (!gradientAnalysis) return null;
  return (
    <View style={styles.gradientCard}>
      <Text style={styles.cardTitle}>🔬 Gradient Analysis</Text>
      <View style={styles.gradientGrid}>
        <View style={styles.gradientItem}>
          <Text style={styles.gradientValue}>{(gradientAnalysis.environmentalRisk * 100).toFixed(1)}%</Text>
          <Text style={styles.gradientLabel}>Environmental</Text>
        </View>
        <View style={styles.gradientItem}>
          <Text style={styles.gradientValue}>{(gradientAnalysis.historicalRisk * 100).toFixed(1)}%</Text>
          <Text style={styles.gradientLabel}>Historical</Text>
        </View>
        <View style={styles.gradientItem}>
          <Text style={styles.gradientValue}>{(gradientAnalysis.combinedRisk * 100).toFixed(1)}%</Text>
          <Text style={styles.gradientLabel}>Combined</Text>
        </View>
      </View>
    </View>
  );
}
