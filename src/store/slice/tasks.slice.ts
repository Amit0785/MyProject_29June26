import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { localDB } from '@app/database/sqlite';
import { Task, NetworkStatus, AppTheme } from '@app/types';
import firestore from '@react-native-firebase/firestore';

interface TasksState {
  items: Task[];
  networkStatus: NetworkStatus;
  categoryFilter: string;
  searchQuery: string;
  syncingProgressMessage: string;
  isSyncing: boolean;
  theme: AppTheme;
}

const initialState: TasksState = {
  items: [],
  networkStatus: 'online',
  categoryFilter: 'all',
  searchQuery: '',
  syncingProgressMessage: '',
  isSyncing: false,
  theme: 'dark',
};

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.items = action.payload;
    },

    // -------------------------------------------------------------------------
    // ADD TASK ACTION (INTERCEPTS OFFLINE STATE)
    // -------------------------------------------------------------------------
    createTaskAction: (
      state,
      action: PayloadAction<Omit<Task, 'syncStatus'>>,
    ) => {
      const isOnline = state.networkStatus === 'online';
      const newTask: Task = {
        ...action.payload,
        syncStatus: isOnline ? 'synced' : 'pending_create',
      };

      // 1. Insert directly into local SQLite replica
      localDB.insertTask(newTask);

      // 2. If offline, append transaction task to SQLite Write-Ahead-Log
      if (!isOnline) {
        localDB.addToQueue({
          taskId: newTask.id,
          action: 'CREATE',
          payload: JSON.stringify(newTask),
          timestamp: Date.now(),
        });
      } else {
        // Online: write directly to Firebase
        firestore()
          .collection('tasks')
          .doc(newTask.id)
          .set(newTask)
          .catch(err => console.error('[Firestore] Error creating task:', err));
      }

      state.items.unshift(newTask);
    },

    // -------------------------------------------------------------------------
    // UPDATE TASK ACTION (INTERCEPTS OFFLINE STATE)
    // -------------------------------------------------------------------------
    updateTaskAction: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Task> }>,
    ) => {
      const { id, updates } = action.payload;
      const isOnline = state.networkStatus === 'online';

      const taskIndex = state.items.findIndex(t => t.id === id);
      if (taskIndex > -1) {
        const existingTask = state.items[taskIndex];
        const updatedAt = new Date().toISOString();
        const updatedTask: Task = {
          ...existingTask,
          ...updates,
          syncStatus: isOnline ? 'synced' : 'pending_update',
          updatedAt,
        };

        // 1. Write to local database
        localDB.insertTask(updatedTask);

        // 2. Queue for server updates if offline
        if (!isOnline) {
          localDB.addToQueue({
            taskId: id,
            action: 'UPDATE',
            payload: JSON.stringify({ ...updates, updatedAt }),
            timestamp: Date.now(),
          });
        } else {
          firestore()
            .collection('tasks')
            .doc(id)
            .update({ ...updates, updatedAt })
            .catch(err => console.error('[Firestore] Error updating task:', err));
        }

        state.items[taskIndex] = updatedTask;
      }
    },

    // -------------------------------------------------------------------------
    // DELETE TASK ACTION (INTERCEPTS OFFLINE STATE)
    // -------------------------------------------------------------------------
    deleteTaskAction: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const isOnline = state.networkStatus === 'online';

      // 1. Delete from local SQLite replica
      localDB.deleteTask(id);

      // 2. Queue for deletion if offline
      if (!isOnline) {
        localDB.addToQueue({
          taskId: id,
          action: 'DELETE',
          payload: JSON.stringify({ id }),
          timestamp: Date.now(),
        });
      } else {
        firestore()
          .collection('tasks')
          .doc(id)
          .delete()
          .catch(err => console.error('[Firestore] Error deleting task:', err));
      }

      state.items = state.items.filter(t => t.id !== id);
    },

    // -------------------------------------------------------------------------
    // NETWORK CONNECTIVITY SYNC COORDINATOR
    // -------------------------------------------------------------------------
    setNetworkStatus: (state, action: PayloadAction<NetworkStatus>) => {
      const previousStatus = state.networkStatus;
      state.networkStatus = action.payload;

      // Triggers automatic sync flush when switching from Offline -> Online
      if (previousStatus === 'offline' && action.payload === 'online') {
        state.isSyncing = true;
        state.syncingProgressMessage =
          'Re-connected. Preparing queue synchronization...';

        // This would call syncManager.flushQueue() in background thread
      }
    },

    setSyncProgress: (
      state,
      action: PayloadAction<{ message: string; isSyncing: boolean }>,
    ) => {
      state.syncingProgressMessage = action.payload.message;
      state.isSyncing = action.payload.isSyncing;
    },

    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.categoryFilter = action.payload;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    toggleTheme: state => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
  },
});

export const {
  setTasks,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  setNetworkStatus,
  setSyncProgress,
  setCategoryFilter,
  setSearchQuery,
  toggleTheme,
} = tasksSlice.actions;

export default tasksSlice.reducer;
