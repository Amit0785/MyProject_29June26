import { EnvConfig } from '../types';

export const ENV_DEV: EnvConfig = {
  envName: 'development',

  firebaseConfig: {
    apiKey: 'AIzaSyDN5AZWMoBRFSfFcvOsq7bKLG_AX2TZuCI',
    authDomain: 'myproject-c006d.firebaseapp.com',
    projectId: 'myproject-c006d',
    storageBucket: 'myproject-c006d.appspot.com',
    messagingSenderId: '12345678901',
    appId: '1:386763892345:android:950508419a7808052dd6a8',
  },
  apiUrl: 'http://192.168.1.50:3000/v1',
  localNotificationsEnabled: true,
  firebaseServerKey: process.env.FIREBASE_SERVER_KEY || '',
  firebaseFunctionsUrl:
    process.env.FIREBASE_FUNCTIONS_URL ||
    'https://us-central1-myproject-c006d.cloudfunctions.net/sendTaskReminder',
};

export const ENV_STAGING: EnvConfig = {
  envName: 'staging',
  firebaseConfig: {
    apiKey: 'AIzaSyDN5AZWMoBRFSfFcvOsq7bKLG_AX2TZuCI',
    authDomain: 'myproject-c006d.firebaseapp.com',
    projectId: 'myproject-c006d',
    storageBucket: 'myproject-c006d.appspot.com',
    messagingSenderId: '12345678902',
    appId: '1:386763892345:android:950508419a7808052dd6a8',
  },
  apiUrl: 'https://api-staging.tasksync.com/v1',
  localNotificationsEnabled: true,
  firebaseServerKey: process.env.FIREBASE_SERVER_KEY || '',
  firebaseFunctionsUrl:
    process.env.FIREBASE_FUNCTIONS_URL ||
    'https://us-central1-myproject-c006d.cloudfunctions.net/sendTaskReminder',
};

export const ENV_PROD: EnvConfig = {
  envName: 'production',
  firebaseConfig: {
    apiKey: 'AIzaSyDN5AZWMoBRFSfFcvOsq7bKLG_AX2TZuCI',
    authDomain: 'myproject-c006d.firebaseapp.com',
    projectId: 'myproject-c006d',
    storageBucket: 'myproject-c006d.appspot.com',
    messagingSenderId: '12345678903',
    appId: '1:386763892345:android:950508419a7808052dd6a8',
  },
  apiUrl: 'https://api.tasksync.com/v1',
  localNotificationsEnabled: true,
  firebaseServerKey: process.env.FIREBASE_SERVER_KEY || '',
  firebaseFunctionsUrl:
    process.env.FIREBASE_FUNCTIONS_URL ||
    'https://us-central1-myproject-c006d.cloudfunctions.net/sendTaskReminder',
};

// Default setup based on compiler environment
let activeEnv = ENV_DEV;

export function setEnvironment(env: 'development' | 'staging' | 'production') {
  switch (env) {
    case 'staging':
      activeEnv = ENV_STAGING;
      break;
    case 'production':
      activeEnv = ENV_PROD;
      break;
    default:
      activeEnv = ENV_DEV;
  }
}

export const getEnv = () => activeEnv;
