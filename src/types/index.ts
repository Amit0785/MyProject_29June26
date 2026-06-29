export interface ILoginFormValues {
  email: string;
  password: string;
}

export type RootStackParamList = {
  SplashScreen: undefined;
  Login: undefined;
  Home: undefined;
  TaskForm: { taskId?: string } | undefined;
};

export interface Task {
  id: string; // UUID
  userId: string;
  title: string;
  description: string;
  category: 'work' | 'personal' | 'health' | 'shopping' | 'other';
  priority: 'low' | 'medium' | 'high';
  dueDate: string; // ISO String
  isCompleted: boolean;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  syncStatus: 'synced' | 'pending_create' | 'pending_update' | 'pending_delete';
}

export interface SyncQueueItem {
  id?: number; // Auto-increment locally
  taskId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string; // JSON Stringified Task or partial task
  timestamp: number; // Epoch timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

export type NetworkStatus = 'online' | 'offline';

export type AppTheme = 'light' | 'dark';

export interface EnvConfig {
  envName: 'development' | 'staging' | 'production';
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  apiUrl: string;
  localNotificationsEnabled: boolean;
}
