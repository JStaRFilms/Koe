import { View, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import { Colors, Spacing } from '../constants/Theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: theme.surfaceElevated, 
        borderColor: theme.border 
      }, 
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
});
