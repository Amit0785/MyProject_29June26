/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { store } from './src/store/index';
import { Provider } from 'react-redux';

LogBox.ignoreAllLogs();

const createApp = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

AppRegistry.registerComponent(appName, () => createApp);
