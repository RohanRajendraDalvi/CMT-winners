import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './airiskStyles';

export function PopulationMetricsCard({ populationData }) {
  if (!populationData) return null;
  const { population_per_km2, densityFactor, normalizerFor100Percent } = populationData;
  return (
    <View style={styles.factorsCard}>
      <Text style={styles.cardTitle}>👥 Population Metrics</Text>
      <View style={styles.factorsList}>
        <View style={styles.factorRow}>
          <Text style={styles.factorLabel}>Population Density (per km²)</Text>
          <View style={styles.factorBar}>
            <View style={[styles.factorFill, { width: `${Math.min(100, (population_per_km2 / 20000) * 100)}%`, backgroundColor: '#22c55e' }]} />
          </View>
          <Text style={styles.factorValue}>{population_per_km2.toLocaleString()}</Text>
        </View>
        <View style={styles.factorRow}>
          <Text style={styles.factorLabel}>Density Factor (scales slip influence)</Text>
          <View style={styles.factorBar}>
            <View style={[styles.factorFill, { width: `${Math.round(densityFactor * 100)}%`, backgroundColor: '#06b6d4' }]} />
          </View>
          <Text style={styles.factorValue}>{(densityFactor * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.factorRow}>
          <Text style={styles.factorLabel}>Normalizer for 100% probability</Text>
          <View style={styles.factorBar}>
            <View style={[styles.factorFill, { width: `${Math.min(100, (normalizerFor100Percent / 20) * 100)}%`, backgroundColor: '#f97316' }]} />
          </View>
          <Text style={styles.factorValue}>{normalizerFor100Percent}</Text>
        </View>
      </View>
    </View>
  );
}
