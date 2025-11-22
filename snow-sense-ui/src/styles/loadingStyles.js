import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const loadingStyles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: theme.textSecondary,
  },
});
