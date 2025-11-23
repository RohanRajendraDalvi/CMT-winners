// hooks/useMotionSensors.js
import { useState, useEffect, useRef } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';

/**
 * Custom hook to track motion sensor data (accelerometer and gyroscope)
 * and derive speed and acceleration metrics for display.
 */
export const useMotionSensors = () => {
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [gyroscope, setGyroscope] = useState({ x: 0, y: 0, z: 0 });
  const [speed, setSpeed] = useState(0);
  const [totalAcceleration, setTotalAcceleration] = useState(0);
  const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [isAvailable, setIsAvailable] = useState(true);

  // Use refs for gravity calibration
  const gravityRef = useRef({ x: 0, y: 0, z: 0 });
  const calibrationSamplesRef = useRef([]);
  const isCalibratedRef = useRef(false);
  const velocityRef = useRef({ x: 0, y: 0, z: 0 });
  const lastTimestampRef = useRef(Date.now());

  useEffect(() => {
    let accelerometerSubscription;
    let gyroscopeSubscription;

    const setupSensors = async () => {
      try {
        // Check availability
        const accelAvailable = await Accelerometer.isAvailableAsync();
        const gyroAvailable = await Gyroscope.isAvailableAsync();
        
        if (!accelAvailable || !gyroAvailable) {
          setIsAvailable(false);
          return;
        }

        // Set update intervals (in ms)
        Accelerometer.setUpdateInterval(100); // 10 Hz
        Gyroscope.setUpdateInterval(100);

        // Subscribe to accelerometer
        accelerometerSubscription = Accelerometer.addListener((data) => {
          // Calibration phase: collect samples when device is at rest
          if (!isCalibratedRef.current) {
            calibrationSamplesRef.current.push({ ...data });
            
            // After 20 samples (~2 seconds), calculate average gravity vector
            if (calibrationSamplesRef.current.length >= 20) {
              const samples = calibrationSamplesRef.current;
              gravityRef.current = {
                x: samples.reduce((sum, s) => sum + s.x, 0) / samples.length,
                y: samples.reduce((sum, s) => sum + s.y, 0) / samples.length,
                z: samples.reduce((sum, s) => sum + s.z, 0) / samples.length,
              };
              isCalibratedRef.current = true;
              console.log('Calibrated gravity:', gravityRef.current);
            }
            return;
          }

          // Remove gravity to get linear acceleration
          const linearAccel = {
            x: data.x - gravityRef.current.x,
            y: data.y - gravityRef.current.y,
            z: data.z - gravityRef.current.z,
          };

          // Apply threshold to filter out noise when device is at rest
          const NOISE_THRESHOLD = 0.01; // m/s²
          const filteredAccel = {
            x: Math.abs(linearAccel.x) > NOISE_THRESHOLD ? linearAccel.x : 0,
            y: Math.abs(linearAccel.y) > NOISE_THRESHOLD ? linearAccel.y : 0,
            z: Math.abs(linearAccel.z) > NOISE_THRESHOLD ? linearAccel.z : 0,
          };

          setAcceleration(filteredAccel);

          // Calculate total acceleration magnitude (m/s²)
          const magnitude = Math.sqrt(
            filteredAccel.x ** 2 + filteredAccel.y ** 2 + filteredAccel.z ** 2
          );
          setTotalAcceleration(magnitude);

          // Time delta for integration
          const now = Date.now();
          const dt = (now - lastTimestampRef.current) / 1000; // Convert to seconds
          lastTimestampRef.current = now;

          // Only integrate velocity if there's significant acceleration
          if (magnitude > NOISE_THRESHOLD) {
            velocityRef.current.x += filteredAccel.x * dt;
            velocityRef.current.y += filteredAccel.y * dt;
            velocityRef.current.z += filteredAccel.z * dt;
          }

          // Apply stronger decay to prevent drift
          const DECAY_FACTOR = 0.85;
          velocityRef.current.x *= DECAY_FACTOR;
          velocityRef.current.y *= DECAY_FACTOR;
          velocityRef.current.z *= DECAY_FACTOR;

          // Reset velocity to zero if it's very small (reduces drift)
          const VELOCITY_THRESHOLD = 0.01;
          if (Math.abs(velocityRef.current.x) < VELOCITY_THRESHOLD) velocityRef.current.x = 0;
          if (Math.abs(velocityRef.current.y) < VELOCITY_THRESHOLD) velocityRef.current.y = 0;
          if (Math.abs(velocityRef.current.z) < VELOCITY_THRESHOLD) velocityRef.current.z = 0;

          // Update velocity state
          setVelocity({ ...velocityRef.current });

          // Calculate speed magnitude (m/s)
          const speedMagnitude = Math.sqrt(
            velocityRef.current.x ** 2 + 
            velocityRef.current.y ** 2 + 
            velocityRef.current.z ** 2
          );
          setSpeed(speedMagnitude);
        });

        // Subscribe to gyroscope
        gyroscopeSubscription = Gyroscope.addListener((data) => {
          setGyroscope(data);
        });
      } catch (error) {
        console.log('Sensor setup error:', error);
        setIsAvailable(false);
      }
    };

    setupSensors();

    return () => {
      accelerometerSubscription?.remove();
      gyroscopeSubscription?.remove();
    };
  }, []);

  return {
    // per-axis acceleration (m/s²) with gravity removed
    acceleration,
    // per-axis velocity (m/s) estimated by integrating accelerometer
    velocity,
    // raw numeric speed magnitude (m/s)
    speed,
    // raw numeric total acceleration magnitude (m/s²)
    totalAcceleration,
    gyroscope,
    isAvailable,
  };
};