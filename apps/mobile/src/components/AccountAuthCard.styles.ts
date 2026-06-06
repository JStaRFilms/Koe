import { StyleSheet } from 'react-native';
import { Spacing, Typography } from '../constants/Theme';

export const styles = StyleSheet.create({
  body: {
    gap: Spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fonts.mono,
    borderRadius: 2,
  },
  copy: {
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
  },
  error: {
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    fontWeight: '700',
  },
  success: {
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    fontWeight: '700',
  },
});
