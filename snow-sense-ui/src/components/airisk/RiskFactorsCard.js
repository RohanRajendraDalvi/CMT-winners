import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './airiskStyles';

export function RiskFactorsCard({ riskFactors, aiAssessment }) {
  if (!riskFactors) return null;
  return (
    <View style={styles.factorsCard}>
      <Text style={styles.cardTitle}>📊 Risk Factors Analysis</Text>
      <View style={styles.factorsList}>
        {riskFactors.temperatureFrictionCoeff !== undefined && (
          <View style={styles.factorRow}>
            <Text style={styles.factorLabel}>Temperature Friction (lower temps reduce grip)</Text>
            <View style={styles.factorBar}>
              <View style={[styles.factorFill, { width: `${riskFactors.temperatureFrictionCoeff * 100}%`, backgroundColor: '#f59e0b' }]} />
            </View>
            <Text style={styles.factorValue}>{(riskFactors.temperatureFrictionCoeff * 100).toFixed(1)}%</Text>
          </View>
        )}
        {riskFactors.moistureRiskFactor !== undefined && (
          <View style={styles.factorRow}>
            <Text style={styles.factorLabel}>Moisture Risk (rain/drizzle/sleet increases slip)</Text>
            <View style={styles.factorBar}>
              <View style={[styles.factorFill, { width: `${riskFactors.moistureRiskFactor * 100}%`, backgroundColor: '#3b82f6' }]} />
            </View>
            <Text style={styles.factorValue}>{(riskFactors.moistureRiskFactor * 100).toFixed(1)}%</Text>
          </View>
        )}
        {riskFactors.historicalWeight !== undefined && (
          <View style={styles.factorRow}>
            <Text style={styles.factorLabel}>Historical Weight (nearby recent slips)</Text>
            <View style={styles.factorBar}>
              <View style={[styles.factorFill, { width: `${riskFactors.historicalWeight * 100}%`, backgroundColor: '#8b5cf6' }]} />
            </View>
            <Text style={styles.factorValue}>{(riskFactors.historicalWeight * 100).toFixed(1)}%</Text>
          </View>
        )}
        {riskFactors.weatherAICoefficient !== undefined && (
          <View style={styles.factorRow}>
            <Text style={styles.factorLabel}>Weather AI Coefficient (model confidence)</Text>
            <View style={styles.factorBar}>
              <View style={[styles.factorFill, { width: `${riskFactors.weatherAICoefficient * 100}%`, backgroundColor: '#10b981' }]} />
            </View>
            <Text style={styles.factorValue}>{(riskFactors.weatherAICoefficient * 100).toFixed(1)}%</Text>
          </View>
        )}
        {aiAssessment?.visionScore !== undefined && (
          <View style={styles.factorRow}>
            <Text style={styles.factorLabel}>AI Vision Score (road surface analysis)</Text>
            <View style={styles.factorBar}>
              <View style={[styles.factorFill, { width: `${aiAssessment.normalized * 100}%`, backgroundColor: '#6366f1' }]} />
            </View>
            <Text style={styles.factorValue}>{(aiAssessment.normalized * 100).toFixed(1)}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}
