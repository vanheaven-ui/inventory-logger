import React from 'react';
import { StatusBar } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

function FocusAwareStatusBar(props) {
  const isFocused = useIsFocused(); // Checks if the screen containing this component is currently focused.
  return isFocused ? <StatusBar {...props} /> : null; // Only render StatusBar if the screen is focused.
}

export default FocusAwareStatusBar;
