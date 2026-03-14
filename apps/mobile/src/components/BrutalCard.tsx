import React from 'react';
import { View, StyleSheet, useColorScheme, ViewStyle, Text } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';

interface BrutalCardProps {
  children: React.ReactNode;
  headerTitle?: string;
  style?: ViewStyle;
}

export function BrutalCard({ children, headerTitle, style }: BrutalCardProps) {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.surfaceSolid,
        borderColor: theme.border,
      }, 
      style
    ]}>
      {headerTitle && (
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.border,
              backgroundColor: theme.surfaceElevated,
            },
          ]}
        >
          <Text style={[styles.headerText, { color: theme.accent }]}>
            {headerTitle.toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fonts.mono,
    letterSpacing: 2,
  },
  content: {
    padding: Spacing.lg,
  },
});
