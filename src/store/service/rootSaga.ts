import { all, takeEvery, call, put, select } from 'redux-saga/effects';
import { setNetworkStatus, setSyncProgress, setTasks } from '../slice/tasks.slice';
import { loginSuccess } from '../slice/auth.slice';
import { syncManager } from '../../database/syncManager';
import { RootState } from '../index';
import { Task } from '../../types';

/**
 * Handles synchronizing local offline queue and pulling remote updates upon network reconnect.
 */
function* handleNetworkStatusChange(action: ReturnType<typeof setNetworkStatus>) {
  const networkStatus = action.payload;
  if (networkStatus === 'online') {
    yield put(setSyncProgress({ message: 'Re-connected. Preparing queue synchronization...', isSyncing: true }));
    try {
      // Flush offline sync queue
      yield call([syncManager, syncManager.flushQueue], true);
      
      // Pull remote updates for current user
      const user: RootState['auth']['user'] = yield select((state: RootState) => state.auth.user);
      if (user) {
        const updatedTasks: Task[] = yield call([syncManager, syncManager.pullRemoteUpdates], user.uid);
        yield put(setTasks(updatedTasks));
      }
    } catch (e) {
      console.error('[SyncSaga] Error during reconnect synchronization:', e);
    } finally {
      yield put(setSyncProgress({ message: 'Synced', isSyncing: false }));
    }
  }
}

/**
 * Loads remote tasks from Firestore for the user immediately after a successful login/auth restoration.
 */
function* handleLoginSuccess(action: ReturnType<typeof loginSuccess>) {
  const user = action.payload;
  if (user) {
    yield put(setSyncProgress({ message: 'Fetching tasks from cloud...', isSyncing: true }));
    try {
      const updatedTasks: Task[] = yield call([syncManager, syncManager.pullRemoteUpdates], user.uid);
      yield put(setTasks(updatedTasks));
    } catch (e) {
      console.error('[SyncSaga] Error loading user tasks after login:', e);
    } finally {
      yield put(setSyncProgress({ message: 'Synced', isSyncing: false }));
    }
  }
}

export default function* rootSaga() {
  yield all([
    takeEvery(setNetworkStatus.type, handleNetworkStatusChange),
    takeEvery(loginSuccess.type, handleLoginSuccess),
  ]);
}
