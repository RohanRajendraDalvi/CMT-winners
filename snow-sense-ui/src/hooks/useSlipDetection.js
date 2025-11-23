// hooks/useSlipDetection.js
import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

/**
 * Detects potential car slips based on gyroscope and acceleration data
 * Returns a function to trigger the slip detection alert
 */
export const useSlipDetection = (gyroscope, acceleration, totalAcceleration) => {
  const lastAlertTimeRef = useRef(0);
  const [slipDetected, setSlipDetected] = useState(false);

  useEffect(() => {
    if (!gyroscope || !acceleration) return;

    // Thresholds for slip detection
    const YAW_THRESHOLD = 1.5; // rad/s - sudden rotation around vertical axis
    const LATERAL_ACCEL_THRESHOLD = 4; // m/s² - sideways acceleration
    const TOTAL_ACCEL_THRESHOLD = 5; // m/s² - total acceleration spike
    
    // Calculate absolute values
    const yawRate = Math.abs(gyroscope.z); // Z-axis is typically vertical (yaw)
    const lateralAccel = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2);
    
    // Detect slip conditions:
    // 1. High yaw rate (spinning)
    // 2. High lateral acceleration (sliding sideways)
    // 3. Combined with overall acceleration spike
    const isSlipping = 
      (yawRate > YAW_THRESHOLD && lateralAccel > LATERAL_ACCEL_THRESHOLD) ||
      (yawRate > YAW_THRESHOLD && totalAcceleration > TOTAL_ACCEL_THRESHOLD);

    if (isSlipping && !slipDetected) {
      setSlipDetected(true);
      
      // Check if 30 seconds have passed since last alert
      const now = Date.now();
      const timeSinceLastAlert = (now - lastAlertTimeRef.current) / 1000;
      
      if (timeSinceLastAlert >= 1) {
        lastAlertTimeRef.current = now;
        
        Alert.alert(
          'Slip Detected',
          'Possible slip detected. Did you experience a slip?',
          [
            {
              text: 'No',
              style: 'cancel',
              onPress: () => setSlipDetected(false),
            },
            {
              text: 'Report Slip',
              onPress: () => {
                setSlipDetected(false);
                // This will be handled by passing a callback
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // Reset detection state without showing alert
        setTimeout(() => setSlipDetected(false), 1000);
      }
    } else if (!isSlipping && slipDetected) {
      // Reset after conditions normalize
      setTimeout(() => setSlipDetected(false), 2000);
    }
  }, [gyroscope, acceleration, totalAcceleration, slipDetected]);

  return {
    slipDetected,
  };
};