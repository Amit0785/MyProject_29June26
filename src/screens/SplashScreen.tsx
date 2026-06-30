import React, { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@app/themes';
import { normalize } from '@app/utils/orientation';

const SplashScreen: FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.textStyle}>✓ TASKSYNC</Text>
    </View>
  );
}


export default SplashScreen

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
