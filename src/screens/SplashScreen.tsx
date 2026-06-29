import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Colors } from '@app/themes';
import { normalize } from '@app/utils/orientation';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.textStyle}>✓ TASKSYNC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate950,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textStyle: {
    color: Colors.primary,
    fontSize: normalize(18),
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
