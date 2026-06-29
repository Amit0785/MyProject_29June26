import { BASE_URL } from '@env';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API } from '../constants';
import { store } from '../../store';
// import { setToken, logoutRequest } from '../../store/slice/auth.slice';
const setToken = (payload: any) => ({ type: 'auth/setToken', payload });
const logoutRequest = () => ({ type: 'auth/logout/request' });
import Storage from '../storage';

export const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    //'Content-Type': 'application/json,multipart/form-data',
  },
});

export const instance1 = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const instance2 = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const refreshToken = async () => {
  const { auth } = API;

  const { refreshToken, token } = store.getState().auth as any;
  console.log('refreshToken --- .....', refreshToken, token);

  if (!refreshToken) {
    return null;
  }

  // Uncomment and implement token refresh logic as needed
  try {
    const response = await axios.post(`${BASE_URL}${auth.refreshToken}`, {
      accessToken: token,
      refreshToken: refreshToken,
    });

    const { status, data } = response;
    if (status === 200) {
      // Dispatch action to update the token in the Redux store
      store.dispatch(
        setToken({
          token: data?.data?.accessToken,
          refreshToken: data?.data?.refreshToken,
        }),
      );
      Storage.setItem('token', data?.data?.accessToken!.toString());
      Storage.setItem('refresh-token', data?.data?.refreshToken!.toString());
    }

    return response.data.accessToken;
  } catch (error: any) {
    console.log('refresh token error: ', error.response.data);
    store.dispatch(logoutRequest());
    throw error;
  }
};

instance.interceptors.request.use(async config => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new axios.Cancel(
      'No internet connection. Please connect to the internet.',
    );
  }

  const { token } = store.getState().auth as any;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance2.interceptors.request.use(async config => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new axios.Cancel(
      'No internet connection. Please connect to the internet.',
    );
  }

  const { token } = store.getState().auth as any;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance1.interceptors.request.use(async config => {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    throw new axios.Cancel(
      'No internet connection. Please connect to the internet.',
    );
  }

  return config;
});

instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Check if the error is due to an expired token and the request hasn't already been retried
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Refresh the token
        const newToken = await refreshToken();

        // Update the token in the headers
        instance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request
        return instance(originalRequest);
      } catch (refreshError) {
        // If the refresh fails, reset the auth state and reject the promise
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
