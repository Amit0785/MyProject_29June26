/* eslint-disable react-native/no-inline-styles */
import {
  DefaultTheme,
  NavigationContainer,
  RouteProp,
  Theme,
} from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store';
import { RootStackParamList } from '../types';
import { goBack, navigationRef } from './RootNavigation';
import auth from '@react-native-firebase/auth';
import { loginSuccess, logout } from '@app/store/slice/auth.slice';

// Import screens
import {
  SplashScreen,
  HomeScreen,
  LoginScreen,
  TaskFormScreen,
} from '@app/screens';
import { Colors } from '@app/themes';

const Stack = createStackNavigator<RootStackParamList>();
const NavigationRouter = () => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { theme: currentTheme } = useAppSelector(state => state.tasks);

  const theme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: currentTheme === 'dark' ? Colors.slate950 : '#f8fafc',
    },
  };

  const AuthScreens = {
    Login: LoginScreen,
  };

  const MainScreens = {
    Home: HomeScreen,
    TaskForm: TaskFormScreen,
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        dispatch(
          loginSuccess({
            uid: user.uid,
            email: user.email ?? '',
            createdAt: new Date().toISOString(),
          }),
        );
      } else {
        dispatch(logout());
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [dispatch]);

  if (isLoading) {
    // Return a beautiful minimalist Loading indicator
    return <SplashScreen />;
  }

  const Screens = isAuthenticated ? MainScreens : AuthScreens;

  const displayHeader = (
    route: RouteProp<RootStackParamList, keyof RootStackParamList>,
  ) => {
    if (route.name === 'Login' || route.name === 'Home') {
      return false;
    }
    return true;
  };

  const displayHeaderTitle = (
    route: RouteProp<RootStackParamList, keyof RootStackParamList>,
  ) => {
    if (route.name === 'TaskForm') {
      return 'Manage Task';
    }
    return route.name;
  };

  const headerIcon = () => (
    <Pressable
      onPress={goBack}
      style={[
        styles.iconView,
        {
          backgroundColor:
            currentTheme === 'dark' ? Colors.slate800 : '#f1f5f9',
        },
      ]}
    >
      <Text style={styles.backText}>←</Text>
    </Pressable>
  );

  return (
    <NavigationContainer ref={navigationRef} theme={theme}>
      <Stack.Navigator>
        {Object.entries(Screens).map(([name, component], index) => (
          <Stack.Screen
            key={index}
            name={name as keyof RootStackParamList}
            component={
              component as React.ComponentType<
                StackScreenProps<RootStackParamList>
              >
            }
            options={({ route }) => ({
              headerShown: displayHeader(route),
              headerStyle: {
                backgroundColor:
                  currentTheme === 'dark' ? Colors.slate900 : Colors.white,
                height: 56,
              },
              headerTintColor:
                currentTheme === 'dark' ? Colors.white : Colors.black,
              headerTitleStyle: {
                fontSize: 15,
                fontWeight: 'bold',
              },
              headerTitle: displayHeaderTitle(route),
              headerTitleAlign: 'center',
              headerLeft: headerIcon,
              headerShadowVisible: false,
            })}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default NavigationRouter;

const styles = StyleSheet.create({
  iconView: {
    marginLeft: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.slate800,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: { color: Colors.primary, fontSize: 14, fontWeight: 'bold' },
});
