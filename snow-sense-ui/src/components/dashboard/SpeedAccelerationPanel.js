// components/Dashboard/SpeedAccelerationPanel.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { useMotionSensors } from '../../hooks/useMotionSensors';

const GRAPH_POINTS = 30;
const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width * 0.85;
const GRAPH_HEIGHT = 60;

const SpeedAccelerationPanel = ({ onSlipDetected }) => {
  const { velocity, acceleration, totalAcceleration, gyroscope, isAvailable } = useMotionSensors();
  
  const [velocityHistoryX, setVelocityHistoryX] = useState(Array(GRAPH_POINTS).fill(0));
  const [velocityHistoryY, setVelocityHistoryY] = useState(Array(GRAPH_POINTS).fill(0));
  const [velocityHistoryZ, setVelocityHistoryZ] = useState(Array(GRAPH_POINTS).fill(0));
  
  const [accelHistoryX, setAccelHistoryX] = useState(Array(GRAPH_POINTS).fill(0));
  const [accelHistoryY, setAccelHistoryY] = useState(Array(GRAPH_POINTS).fill(0));
  const [accelHistoryZ, setAccelHistoryZ] = useState(Array(GRAPH_POINTS).fill(0));
  
  const frameCount = useRef(0);
  const lastAlertTimeRef = useRef(0);
  const slipDetectionTimeoutRef = useRef(null);

  // Slip detection with alert handling
  useEffect(() => {
    if (!isAvailable || !gyroscope || !acceleration || !onSlipDetected) return;

    // Thresholds for slip detection
    const YAW_THRESHOLD = 0.5; // rad/s - sudden rotation around vertical axis
    const LATERAL_ACCEL_THRESHOLD = 2; // m/s² - sideways acceleration (orignial 4)
    const TOTAL_ACCEL_THRESHOLD = 2; // m/s² - total acceleration spike (original 5)
    
    // Calculate absolute values
    const yawRate = Math.abs(gyroscope.z); // Z-axis is typically vertical (yaw)
    const lateralAccel = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2);
    
    // Detect slip conditions:
    // 1. High yaw rate (spinning) combined with lateral acceleration
    // 2. High yaw rate combined with total acceleration spike
    const isSlipping = 
      (yawRate > YAW_THRESHOLD && lateralAccel > LATERAL_ACCEL_THRESHOLD) ||
      (yawRate > YAW_THRESHOLD && totalAcceleration > TOTAL_ACCEL_THRESHOLD);

    // console.log('SlipDetection: sensor sample', {
    //   yaw: gyroscope?.z,
    //   accelX: acceleration?.x,
    //   accelY: acceleration?.y,
    //   totalAcceleration,
    //   yawRate,
    //   lateralAccel,
    //   isSlipping,
    // });

    if (isSlipping) {
      // Clear any existing timeout to prevent multiple alerts
      if (slipDetectionTimeoutRef.current) {
        clearTimeout(slipDetectionTimeoutRef.current);
      }

      // Debounce: wait 500ms to confirm slip condition persists
      slipDetectionTimeoutRef.current = setTimeout(() => {
        console.log('SlipDetection: debounced check running, values:', {
          yawRate,
          lateralAccel,
          totalAcceleration,
        });
        const now = Date.now();
        const timeSinceLastAlert = (now - lastAlertTimeRef.current) / 1000;
        
        // Only alert if 30 seconds have passed since last alert
        if (timeSinceLastAlert >= 5) {
          lastAlertTimeRef.current = now;
          //console.log('SlipDetection: triggering onSlipDetected()');
          try {
            onSlipDetected();
          } catch (err) {
            console.log('SlipDetection: onSlipDetected threw', err);
          }
        } else {
          //console.log('SlipDetection: suppressed alert, timeSinceLastAlert', timeSinceLastAlert);
        }
      }, 5);
    }

    return () => {
      if (slipDetectionTimeoutRef.current) {
        clearTimeout(slipDetectionTimeoutRef.current);
      }
    };
  }, [gyroscope, acceleration, totalAcceleration, isAvailable, onSlipDetected]);

  useEffect(() => {
    if (!isAvailable || !velocity || !acceleration) return;

    frameCount.current += 1;
    if (frameCount.current % 2 === 0) {
      setVelocityHistoryX((prev) => [...prev.slice(1), parseFloat(velocity.x || 0)]);
      setVelocityHistoryY((prev) => [...prev.slice(1), parseFloat(velocity.y || 0)]);
      setVelocityHistoryZ((prev) => [...prev.slice(1), parseFloat(velocity.z || 0)]);
      
      setAccelHistoryX((prev) => [...prev.slice(1), parseFloat(acceleration.x || 0)]);
      setAccelHistoryY((prev) => [...prev.slice(1), parseFloat(acceleration.y || 0)]);
      setAccelHistoryZ((prev) => [...prev.slice(1), parseFloat(acceleration.z || 0)]);
    }
  }, [velocity, acceleration, isAvailable]);

  const renderGraph = (data, color, maxValue = 10) => {
    const points = data.map((value, index) => {
      const x = (index / (GRAPH_POINTS - 1)) * GRAPH_WIDTH;
      const normalizedValue = Math.min(Math.abs(value) / maxValue, 1);
      const y = GRAPH_HEIGHT / 2 - (value / maxValue) * (GRAPH_HEIGHT / 2);
      return `${x},${y}`;
    });

    return (
      <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} style={styles.svg}>
        <Line x1="0" y1={GRAPH_HEIGHT / 2} x2={GRAPH_WIDTH} y2={GRAPH_HEIGHT / 2} stroke="#444" strokeWidth="1" opacity="0.5" />
        <Line x1="0" y1="0" x2={GRAPH_WIDTH} y2="0" stroke="#444" strokeWidth="1" opacity="0.3" />
        <Line x1="0" y1={GRAPH_HEIGHT} x2={GRAPH_WIDTH} y2={GRAPH_HEIGHT} stroke="#444" strokeWidth="1" opacity="0.3" />
        
        <Polyline
          points={points.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  };

  const renderAxisGraphs = (xData, yData, zData, xColor, yColor, zColor, maxValue) => {
    return (
      <View style={styles.axisGraphsContainer}>
        <View style={styles.axisGraph}>
          <View style={styles.axisHeader}>
            <Text style={[styles.axisLabel, { color: xColor }]}>X</Text>
            <Text style={styles.axisValue}>{xData[xData.length - 1].toFixed(2)}</Text>
          </View>
          {renderGraph(xData, xColor, maxValue)}
        </View>
        
        <View style={styles.axisGraph}>
          <View style={styles.axisHeader}>
            <Text style={[styles.axisLabel, { color: yColor }]}>Y</Text>
            <Text style={styles.axisValue}>{yData[yData.length - 1].toFixed(2)}</Text>
          </View>
          {renderGraph(yData, yColor, maxValue)}
        </View>
        
        <View style={styles.axisGraph}>
          <View style={styles.axisHeader}>
            <Text style={[styles.axisLabel, { color: zColor }]}>Z</Text>
            <Text style={styles.axisValue}>{zData[zData.length - 1].toFixed(2)}</Text>
          </View>
          {renderGraph(zData, zColor, maxValue)}
        </View>
      </View>
    );
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailableText}>Motion sensors unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.metricSection}>
        <Text style={styles.sectionTitle}>Velocity <Text style={styles.unit}>(m/s)</Text></Text>
        {renderAxisGraphs(
          velocityHistoryX,
          velocityHistoryY,
          velocityHistoryZ,
          '#4A90E2',
          '#50C878',
          '#E24A4A',
          10
        )}
      </View>

      <View style={styles.metricSection}>
        <Text style={styles.sectionTitle}>Acceleration <Text style={styles.unit}>(m/s²)</Text></Text>
        {renderAxisGraphs(
          accelHistoryX,
          accelHistoryY,
          accelHistoryZ,
          '#4A90E2',
          '#50C878',
          '#E24A4A',
          15
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  metricSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  axisGraphsContainer: {
    gap: 12,
  },
  axisGraph: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  axisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  axisLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  axisValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  unit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#aaa',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  unavailableText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SpeedAccelerationPanel;