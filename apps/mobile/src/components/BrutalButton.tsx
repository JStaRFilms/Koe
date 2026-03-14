import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View, 
  useColorScheme, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';

interface BrutalButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'danger' | 'success' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  small?: boolean;
}

export function BrutalButton({ 
  onPress, 
  title, 
  variant = 'primary', 
  style, 
  textStyle,
  disabled,
  small
}: BrutalButtonProps) {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return { bg: theme.danger, border: theme.danger };
      case 'success':
        return { bg: theme.success, border: theme.success };
      case 'outline':
        return { bg: 'transparent', border: theme.border, text: theme.text };
      default:
        return { bg: theme.accent, border: theme.accent };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.shadow, 
        { 
          borderColor: vStyles.border,
          top: small ? 2 : 4,
          left: small ? 2 : 4,
          right: small ? -2 : -4,
          bottom: small ? -2 : -4
        }
      ]} />
      
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          { 
            backgroundColor: vStyles.bg, 
            borderColor: vStyles.border,
            opacity: disabled ? 0.5 : 1,
            paddingVertical: small ? Spacing.xs : Spacing.md,
            paddingHorizontal: small ? Spacing.sm : Spacing.xl,
          }
        ]}
      >
        <Text style={[
          styles.text, 
          { 
            color: variant === 'outline' ? (vStyles.text || theme.text) : theme.background,
            fontSize: small ? Typography.sizes.xs : Typography.sizes.md,
            fontFamily: small ? Typography.fonts.mono : Typography.fonts.bold,
          },
          textStyle
        ]}>
          {title.toUpperCase()}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginRight: 4,
    marginBottom: 4,
  },
  shadow: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'transparent',
    zIndex: -1,
  },
  button: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 1,
  },
});

