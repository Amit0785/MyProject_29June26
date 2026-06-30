/* eslint-disable react-native/no-inline-styles */
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from '@app/store/slice/auth.slice';
import {
  emailValidation,
  stringRequiredValidation,
} from '@app/utils/helpers/ValidationSchema';
import React, { FC, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'; // React Native styles simulated
import { useAppDispatch, useAppSelector } from '../store';

import { CButton, TextInputComponent } from '@app/components';
import { ILoginFormValues } from '@app/types';
import {
  horizontalScale,
  verticalScale,
  moderateScale,
  normalize,
} from '@app/utils/orientation';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNotifications } from '@app/utils/context/notificationContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';

const validationSchema = Yup.object().shape({
  email: emailValidation,
  password: stringRequiredValidation.label('Password'),
});

const LoginScreen: FC = () => {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const [visiblePassword, setVisiblePassword] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(
    state => state.auth,
    shallowEqual,
  );
  const theme = useAppSelector(state => state.tasks.theme, shallowEqual);
  const isDark = theme === 'dark';
  const { fcmToken, getFCMToken } = useNotifications();

  const initialValues: ILoginFormValues = {
    email: '',
    password: '',
  };

  const handleAuth = async () => {
    dispatch(loginStart());
    try {
      let response;
      if (isRegistering) {
        response = await auth().createUserWithEmailAndPassword(
          formik.values.email,
          formik.values.password,
        );
      } else {
        response = await auth().signInWithEmailAndPassword(
          formik.values.email,
          formik.values.password,
        );
      }

      let token = fcmToken;
      if (!token) {
        try {
          token = (await getFCMToken()) || '';
        } catch (tokenErr) {
          console.log(
            '[LoginScreen] Error getting FCM Token from context:',
            tokenErr,
          );
        }
      }

      const userId = response.user.uid;
      const userEmail = response.user.email || '';

      // Save/associate token in Firestore 'users' collection
      await firestore().collection('users').doc(userId).set(
        {
          uid: userId,
          email: userEmail,
          fcmToken: token,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      dispatch(
        loginSuccess({
          uid: userId,
          email: userEmail,
          createdAt: new Date().toISOString(),
          fcmToken: token || undefined,
        }),
      );
    } catch (err: any) {
      dispatch(loginFailure(err.message || 'Authentication failed.'));
    }
  };

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: handleAuth,
  });

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
      ]}
    >
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>✓ TaskSync</Text>
        <Text
          style={[
            styles.taglineText,
            { color: isDark ? '#64748b' : '#475569' },
          ]}
        >
          Offline-First Task Management
        </Text>
      </View>

      <View
        style={[
          styles.formContainer,
          {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            shadowOpacity: isDark ? 0.3 : 0.05,
            elevation: isDark ? 8 : 3,
          },
        ]}
      >
        <Text
          style={[styles.headerText, { color: isDark ? '#f8fafc' : '#0f172a' }]}
        >
          {isRegistering ? 'Create Account' : 'Sign In'}
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TextInputComponent
          label={'Email'}
          placeholder={'Email Address'}
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          keyboardType={'email-address'}
          onChangeText={formik.handleChange('email')}
          value={formik.values.email}
          error={formik.touched.email && formik.errors.email}
          autoCaps={'none'}
          style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
          containerStyles={{ marginTop: 0, marginBottom: verticalScale(16) }}
          inputContainerStyle={{
            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
            borderColor: isDark ? '#334155' : '#cbd5e1',
          }}
        />

        <TextInputComponent
          label={'Password'}
          onChangeText={formik.handleChange('password')}
          value={formik.values.password}
          placeholder={'Password'}
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          rightIcon={
            <Pressable style={styles.rightIconView} onPress={() => setVisiblePassword(!visiblePassword)}>
              <Text
                style={[styles.rightText, {
                  color: isDark ? '#64748b' : '#94a3b8',

                }]}
              >
                {visiblePassword ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          }
          secure={!visiblePassword}
          // onPressIcon={() => setVisiblePassword(!visiblePassword)}
          keyboardType={'default'}
          error={formik.touched.password && formik.errors.password}
          style={{ color: isDark ? '#f8fafc' : '#0f172a' }}
          containerStyles={{ marginTop: 0, marginBottom: verticalScale(16) }}
          inputContainerStyle={{
            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
            borderColor: isDark ? '#334155' : '#cbd5e1',
          }}
        />

        <CButton
          onPress={formik.handleSubmit}
          buttonText={isRegistering ? 'Sign Up' : 'Log In'}
          disabled={isLoading}
          loading={isLoading}
        />

        <TouchableOpacity
          onPress={() => setIsRegistering(!isRegistering)}
          style={styles.switchButton}
        >
          <Text
            style={[
              styles.switchText,
              { color: isDark ? '#94a3b8' : '#64748b' },
            ]}
          >
            {isRegistering
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: horizontalScale(24),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  logoText: {
    fontSize: normalize(32),
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  taglineText: {
    fontSize: normalize(14),
    color: '#64748b',
    marginTop: verticalScale(8),
  },
  wP: {
    width: '90%',
  },
  formContainer: {
    backgroundColor: '#1e293b',
    borderRadius: moderateScale(16),
    padding: horizontalScale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(10),
    elevation: 8,
  },
  headerText: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },

  buttonText: {
    color: '#0f172a',
    fontSize: normalize(16),
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: verticalScale(16),
    alignItems: 'center',
  },
  switchText: {
    color: '#94a3b8',
    fontSize: normalize(13),
  },
  errorText: {
    color: '#ef4444',
    fontSize: normalize(13),
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  rightIconView: {

    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: horizontalScale(10),
  },
  rightText: {
    fontSize: normalize(10),
  }
});
