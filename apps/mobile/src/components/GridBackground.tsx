import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';
import { Colors } from '../constants/Theme';

export function GridBackground() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} pointerEvents="none">
      <Svg width="100%" height="100%" opacity={0.3}>
        <Defs>
          <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <Path 
              d="M 40 0 L 0 0 0 40" 
              fill="none" 
              stroke={theme.border} 
              strokeWidth="1" 
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
    </View>
  );
}
