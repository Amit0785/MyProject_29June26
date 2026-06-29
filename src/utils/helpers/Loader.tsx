import { View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import React from 'react';
import { Colors } from '@app/themes';

const Loader = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.white} size={'large'} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    backgroundColor: Colors.blackOpacity50,
    zIndex: 10,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Loader;
