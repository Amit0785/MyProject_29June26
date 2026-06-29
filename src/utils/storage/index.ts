import { MMKV } from 'react-native-mmkv';
import { name } from '../../../app.json';

const storage = new MMKV({
  id: `${name}-storage`,
  encryptionKey: 'encryption-key',
});

type Keys = 'token' | 'refresh-token' | 'onboarded'; // add more key

const Storage = {
  setItem: (key: Keys, value: string): void => {
    storage.set(key, value);
  },

  getItem: (key: Keys): string | null => {
    return storage.getString(key) || null;
  },

  containsKey: (key: Keys): boolean => {
    return storage.contains(key);
  },

  removeItem: (key: Keys): void => {
    storage.delete(key);
  },
  clearAll: (): void => {
    storage.clearAll();
  },
};

export default Storage;
