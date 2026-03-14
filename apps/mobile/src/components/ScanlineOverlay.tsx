import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Defs, Pattern, Rect } from 'react-native-svg';

export function ScanlineOverlay() {
  const { width, height } = Dimensions.get('window');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" opacity={0.1}>
        <Defs>
          <Pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
            <Line x1="0" y1="0" x2="100%" y2="0" stroke="black" strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scanlines)" />
      </Svg>
    </View>
  );
}
