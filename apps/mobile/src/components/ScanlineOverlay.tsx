import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import Svg, { Line, Defs, Pattern, Rect } from 'react-native-svg';
import { Colors } from '../constants/Theme';

export function ScanlineOverlay() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" opacity={colorScheme === 'dark' ? 0.1 : 0.05}>
        <Defs>
          <Pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
            <Line x1="0" y1="0" x2="100%" y2="0" stroke={theme.borderHighlight} strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scanlines)" />
      </Svg>
    </View>
  );
}
