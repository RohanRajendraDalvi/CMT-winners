import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { dashboardStyles } from '../../styles/dashboardStyles';
import SpeedAccelerationPanel from './SpeedAccelerationPanel';

const DashboardScreen = ({ onLogout, onReportSlip, onDetectNearbySlips }) => {
  const [reporting, setReporting] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const handleReport = async () => {
    try {
      setReporting(true);
      await onReportSlip();
    } catch (err) {
      console.log('report error', err);
    } finally {
      setReporting(false);
    }
  };

  const handleDetect = async () => {
    try {
      setDetecting(true);
      await onDetectNearbySlips();
    } catch (err) {
      console.log('detect error', err);
    } finally {
      setDetecting(false);
    }
  };

  const handleSlipDetected = () => {
    Alert.alert(
      'Slip Detected',
      'Possible slip detected. Did you experience a slip?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Report Slip',
          onPress: handleReport,
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <>
      <View style={dashboardStyles.header}>
        <Text style={dashboardStyles.title}>Snow Sense</Text>
        <Text style={dashboardStyles.subtitle}>Road Surface Alerts</Text>
        <TouchableOpacity style={dashboardStyles.logoutButton} onPress={onLogout}>
          <Text style={dashboardStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={dashboardStyles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={dashboardStyles.trackingCard}>
          <View style={dashboardStyles.road}>
            <View style={dashboardStyles.laneDivider} />
          </View>
          <View style={dashboardStyles.vehicleIcon} />
          <View style={dashboardStyles.signalDotOuter}>
            <View style={dashboardStyles.signalDotInner} />
          </View>
        </View>

        <SpeedAccelerationPanel onSlipDetected={handleSlipDetected} />

        <Text style={dashboardStyles.description}>
          Help improve road safety by reporting slippery road conditions and checking for slips reported near you.
        </Text>

        <View style={dashboardStyles.buttonRow}>
          <TouchableOpacity
            style={[dashboardStyles.button, dashboardStyles.primaryButton, reporting && { opacity: 0.7 }]}
            onPress={handleReport}
            disabled={reporting || detecting}
          >
            {reporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={dashboardStyles.buttonText}>Report Slip</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[dashboardStyles.button, dashboardStyles.secondaryButton, detecting && { opacity: 0.7 }]}
            onPress={handleDetect}
            disabled={detecting || reporting}
          >
            {detecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={dashboardStyles.buttonText}>Nearby Slips</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

export default DashboardScreen;