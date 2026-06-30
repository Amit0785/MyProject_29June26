import { createMMKV } from 'react-native-mmkv';
import { name } from '../../../app.json';

const storage = createMMKV({
  id: `${name}-storage`,
  encryptionKey: 'encryption-key',
});

type Keys = 'token' | 'refresh-token' | 'onboarded' | 'theme';

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
    storage.remove(key);
  },

  clearAll: (): void => {
    storage.clearAll();
  },
};

export default Storage;
