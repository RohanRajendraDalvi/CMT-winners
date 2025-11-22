import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { authStyles } from '../../styles/authStyles';

const AuthScreen = ({ onSubmit, error, onClearError = () => {} }) => {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const updateEmail = useCallback(
    (value) => {
      if (error) {
        onClearError();
      }
      setEmail(value);
    },
    [error, onClearError],
  );

  const updatePassword = useCallback(
    (value) => {
      if (error) {
        onClearError();
      }
      setPassword(value);
    },
    [error, onClearError],
  );

  const toggleMode = useCallback(() => {
    const nextMode = mode === 'sign-in' ? 'sign-up' : 'sign-in';
    setMode(nextMode);
    if (error) {
      onClearError();
    }
  }, [mode, error, onClearError]);

  const handleSubmit = useCallback(() => {
    onSubmit({ mode, email, password });
  }, [mode, email, password, onSubmit]);

  return (
    <>
      <View style={authStyles.header}>
        <Text style={authStyles.title}>Snow Sense</Text>
        <Text style={authStyles.subtitle}>Sign in to continue</Text>
      </View>
      <View style={authStyles.content}>
        <TextInput
          style={authStyles.input}
          placeholder="Email"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={updateEmail}
        />
        <TextInput
          style={authStyles.input}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={updatePassword}
        />

        {error ? <Text style={authStyles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={authStyles.authButton} onPress={handleSubmit}>
          <Text style={authStyles.buttonText}>
            {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={authStyles.switchMode} onPress={toggleMode}>
          <Text style={authStyles.switchModeText}>
            {mode === 'sign-in'
              ? 'New here? Create an account'
              : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default AuthScreen;
