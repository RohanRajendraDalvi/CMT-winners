import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './airiskStyles';

export function RiskAssessmentCard({ result }) {
  if (!result) return null;
  return (
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
  );
}
