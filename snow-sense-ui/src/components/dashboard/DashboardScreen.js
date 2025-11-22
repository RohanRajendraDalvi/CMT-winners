import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { dashboardStyles } from '../../styles/dashboardStyles';

const DashboardScreen = ({ onLogout, onReportSlip, onDetectNearbySlips }) => (
  <>
    <View style={dashboardStyles.header}>
      <Text style={dashboardStyles.title}>Snow Sense</Text>
      <Text style={dashboardStyles.subtitle}>Road Surface Alerts</Text>
      <TouchableOpacity style={dashboardStyles.logoutButton} onPress={onLogout}>
        <Text style={dashboardStyles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>

    <View style={dashboardStyles.content}>
      <View style={dashboardStyles.trackingCard}>
        <View style={dashboardStyles.road}>
          <View style={dashboardStyles.laneDivider} />
        </View>
        <View style={dashboardStyles.vehicleIcon} />
        <View style={dashboardStyles.signalDotOuter}>
          <View style={dashboardStyles.signalDotInner} />
        </View>
      </View>

      <Text style={dashboardStyles.description}>
        Help improve road safety by reporting slippery road conditions and checking for slips reported near you.
      </Text>

      <View style={dashboardStyles.buttonRow}>
        <TouchableOpacity style={[dashboardStyles.button, dashboardStyles.primaryButton]} onPress={onReportSlip}>
          <Text style={dashboardStyles.buttonText}>Report Slip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[dashboardStyles.button, dashboardStyles.secondaryButton]} onPress={onDetectNearbySlips}>
          <Text style={dashboardStyles.buttonText}>Nearby Slips</Text>
        </TouchableOpacity>
      </View>
    </View>
  </>
);

export default DashboardScreen;
