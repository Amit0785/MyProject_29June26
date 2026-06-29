import React, { useEffect } from 'react';

import { NotificationProvider } from './src/utils/context/notificationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import NavigationRouter from './src/navigation/NavigationRouter';
import { setEnvironment } from './src/config/env';

if (!__DEV__) {
  // or process.env.NODE_ENV === 'production'
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}

const App = () => {
  useEffect(() => {
    // Bootstrap active environment key injection
    // In actual native build scripts, this is replaced by config schema targets.
    setEnvironment('development');
    console.log(
      '[App] TaskSync Mobile App Bootstrapped successfully in DEVELOPMENT mode.',
    );
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar
        translucent
        // backgroundColor={}
        barStyle={'light-content'}
      />

      <NotificationProvider>
        <NavigationRouter />
      </NotificationProvider>
    </SafeAreaProvider>
  );
};

export default App;
