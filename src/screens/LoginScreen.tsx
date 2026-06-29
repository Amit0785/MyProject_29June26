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
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // React Native styles simulated
import { useAppDispatch, useAppSelector } from '../store';

import { CButton, TextInputComponent } from '@app/components';
import { Colors } from '@app/themes';
import { EyeClose, EyeOpen } from '@app/themes/Images';
import { ILoginFormValues } from '@app/types';
import { moderateScale } from '@app/utils/orientation';
import auth from '@react-native-firebase/auth';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  email: emailValidation,
  password: stringRequiredValidation.label('Password'),
});

const LoginScreen: FC = () => {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const [visiblePassword, setVisiblePassword] = useState<boolean>(true);

  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);

  const initialValues: ILoginFormValues = {
    email: '',
    password: '',
  };

  const handleAuth = async () => {
    dispatch(loginStart());
    try {
      // Real React Native Firebase implementation:
      if (isRegistering) {
        const credential = await auth().createUserWithEmailAndPassword(
          formik.values.email,
          formik.values.password,
        );
        dispatch(
          loginSuccess({
            uid: credential?.user?.uid,
            email: credential?.user?.email ?? '',
            createdAt: new Date().toISOString(),
          }),
        );
      } else {
        const credential = await auth().signInWithEmailAndPassword(
          formik.values.email,
          formik.values.password,
        );
        dispatch(
          loginSuccess({
            uid: credential.user.uid,
            email: credential?.user?.email ?? '',
            createdAt: new Date().toISOString(),
          }),
        );
      }

      // Mimicking successful callback
      // setTimeout(() => {
      //   dispatch(
      //     loginSuccess({
      //       uid: 'usr_' + Date.now(),
      //       email,
      //       createdAt: new Date().toISOString(),
      //     }),
      //   );
      // }, 1000);
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
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>✓ TaskSync</Text>
        <Text style={styles.taglineText}>Offline-First Task Management</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.headerText}>
          {isRegistering ? 'Create Account' : 'Sign In'}
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TextInputComponent
          label={'Email'}
          placeholder={'Email Address'}
          keyboardType={'email-address'}
          onChangeText={formik.handleChange('email')}
          value={formik.values.email}
          error={formik.touched.email && formik.errors.email}
          autoCaps={'none'}
          //containerStyles={styles.wP}
        />

        <TextInputComponent
          label={'Password'}
          onChangeText={formik.handleChange('password')}
          value={formik.values.password}
          placeholder={'Password'}
          rightIcon={
            visiblePassword ? (
              <EyeClose fill={Colors.white} />
            ) : (
              <EyeOpen
                width={moderateScale(24)}
                height={moderateScale(24)}
                fill={Colors.white}
              />
            )
          }
          secure={visiblePassword}
          onPressIcon={() => setVisiblePassword(!visiblePassword)}
          keyboardType={'default'}
          error={formik.touched.password && formik.errors.password}
          //containerStyles={styles.wP}
        />

        <CButton
          //buttonContainerStyle={styles.wP}
          onPress={formik.handleSubmit}
          buttonText={isRegistering ? 'Sign Up' : 'Log In'}
          disabled={isLoading}
          loading={isLoading}
        />

        <TouchableOpacity
          onPress={() => setIsRegistering(!isRegistering)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isRegistering
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  taglineText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  wP: {
    width: '90%',
  },
  formContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 20,
    textAlign: 'center',
  },

  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
});
