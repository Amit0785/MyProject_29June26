import { localDB } from './sqlite';
import { Task, SyncQueueItem } from '../types';
import firestore from '@react-native-firebase/firestore';

/**
 * SyncManager manages automatic data synchronization between 
 * local SQLite database and remote Cloud Firestore database.
 */
export class SyncManager {
  private static isFlushing = false;

  /**
   * Main driver triggered when connection goes from Offline -> Online.
   * Processes the backlog in sync_queue sequentially.
   */
  public static async flushQueue(
    isOnline: boolean, 
    onProgressUpdate?: (status: string, pendingCount: number) => void
  ): Promise<void> {
    if (!isOnline) {
      console.log('[SyncManager] Postponing sync. System is offline.');
      return;
    }

    if (SyncManager.isFlushing) {
      console.log('[SyncManager] Flush already in progress, skipping execution.');
      return;
    }

    SyncManager.isFlushing = true;
    console.log('[SyncManager] Commencing offline queue synchronization flush...');

    try {
      // 1. Query all pending entries in the queue sorted by timestamp
      const queue: SyncQueueItem[] = await localDB.getQueue();
      let pendingCount = queue.length;

      if (pendingCount === 0) {
        console.log('[SyncManager] Sync completed. No actions in queue.');
        SyncManager.isFlushing = false;
        if (onProgressUpdate) onProgressUpdate('Synced', 0);
        return;
      }

      console.log(`[SyncManager] Found ${pendingCount} pending actions to sync.`);

      // 2. Loop through each operation log sequentially
      for (const item of queue) {
        const taskId = item.taskId;
        const action = item.action;
        const payload: Partial<Task> = JSON.parse(item.payload);

        if (onProgressUpdate) {
          onProgressUpdate(`Syncing Task: ${payload.title || taskId} (${action})...`, pendingCount);
        }

        try {
          const docRef = firestore().collection('tasks').doc(taskId);

          switch (action) {
            case 'CREATE':
              console.log(`[SyncManager] Creating document [${taskId}] on Firestore...`);
              await docRef.set({ ...payload, syncStatus: 'synced' });
              break;

            case 'UPDATE':
              console.log(`[SyncManager] Updating document [${taskId}] on Firestore...`);
              await docRef.update({ ...payload, syncStatus: 'synced' });
              break;

            case 'DELETE':
              console.log(`[SyncManager] Deleting document [${taskId}] from Firestore...`);
              await docRef.delete();
              break;
          }

          // 3. Mark the local SQLite record as synced (if it wasn't a delete)
          if (action !== 'DELETE') {
            await localDB.updateTask(taskId, { syncStatus: 'synced' });
          }

          // 4. Delete log from SQLite sync_queue table
          if (item.id) {
            await localDB.deleteQueueItem(item.id);
          }

          pendingCount--;
        } catch (error) {
          console.error(`[SyncManager] Failed to sync item [${item.id}]:`, error);
          // In case of non-recoverable error, we might skip, but we halt processing for networks
          break;
        }
      }

      console.log('[SyncManager] Flush process finished.');
    } catch (error) {
      console.error('[SyncManager] General error flushing queue:', error);
    } finally {
      SyncManager.isFlushing = false;
      if (onProgressUpdate) onProgressUpdate('Synced', 0);
    }
  }

  /**
   * Pulls new updates from Cloud Firestore and merges them locally.
   * Implements "Last-Write-Wins" on timestamps to prevent data loss.
   */
  public static async pullRemoteUpdates(userId: string): Promise<Task[]> {
    console.log(`[SyncManager] Pulling newest tasks for User ${userId} from Firestore...`);
    try {
      const snapshot = await firestore()
        .collection('tasks')
        .where('userId', '==', userId)
        .get();

      const remoteTasks: Task[] = [];
      snapshot.forEach(doc => {
        remoteTasks.push(doc.data() as Task);
      });

      // Merge remote tasks into local DB:
      for (const remoteTask of remoteTasks) {
        const localTasksList = await localDB.getTasks(userId);
        const localTask = localTasksList.find(t => t.id === remoteTask.id);
        if (!localTask) {
          await localDB.insertTask(remoteTask);
        } else if (new Date(remoteTask.updatedAt).getTime() > new Date(localTask.updatedAt).getTime()) {
          await localDB.insertTask(remoteTask); // Pull remote overwrite
        }
      }

      // Return the updated list of tasks for the local user
      return await localDB.getTasks(userId);
    } catch (e) {
      console.error('[SyncManager] Error pulling remote updates:', e);
      return [];
    }
  }
}
export const syncManager = SyncManager;
