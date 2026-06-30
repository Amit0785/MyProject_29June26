import React, { useEffect } from 'react';

import { NotificationProvider } from './src/utils/context/notificationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, useColorScheme } from 'react-native';

import NavigationRouter from './src/navigation/NavigationRouter';
import { setEnvironment } from './src/config/env';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from './src/store';
import { setNetworkStatus, setThemeAction } from './src/store/slice/tasks.slice';
import { APP_ENV } from '@env';
import Storage from './src/utils/storage';
import { AppTheme } from './src/types';

if (!__DEV__) {
  // or process.env.NODE_ENV === 'production'
  console.log = () => { };
  console.info = () => { };
  console.warn = () => { };
  console.error = () => { };
}

const App = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.tasks.theme);
  const isDark = theme === 'dark';
  const deviceColorScheme = useColorScheme();

  useEffect(() => {
    // 1. Theme Initialization:
    // Load from storage or default to device system color scheme, then persist.
    const savedTheme = Storage.getItem('theme') as AppTheme | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      dispatch(setThemeAction(savedTheme));
    } else {
      const initialTheme = deviceColorScheme === 'light' ? 'light' : 'dark';
      dispatch(setThemeAction(initialTheme));
    }

    // Bootstrap active environment key injection
    const targetEnv = (APP_ENV as any) || 'development';
    setEnvironment(targetEnv);
    console.log(
      `[App] TaskSync Mobile App Bootstrapped successfully in ${targetEnv.toUpperCase()} mode.`,
    );

    // Subscribe to connection status changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const status = state.isConnected ? 'online' : 'offline';
      dispatch(setNetworkStatus(status));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch, deviceColorScheme]);
  return (
    <SafeAreaProvider>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <NotificationProvider>
        <NavigationRouter />
      </NotificationProvider>
    </SafeAreaProvider>
  );
};

export default App;
