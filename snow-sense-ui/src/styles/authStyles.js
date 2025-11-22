import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const authStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: theme.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  input: {
    alignSelf: 'center',
    width: '80%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.textPrimary,
    backgroundColor: '#020617',
    marginBottom: 12,
  },
  errorText: {
    color: '#f97373',
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 13,
  },
  authButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: theme.primary,
  },
  buttonText: {
    color: '#0b1120',
    fontSize: 16,
    fontWeight: '600',
  },
  switchMode: {
    marginTop: 12,
  },
  switchModeText: {
    color: theme.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
