import { Task, SyncQueueItem } from '../types';

/**
 * SQLite Database client wrapper for on-device persistence.
 * Emulates local storage CRUD and Queue tables in-memory for JS portability.
 */
export class SQLiteDatabase {
  private static instance: SQLiteDatabase | null = null;
  private db: any = null;
  private localTasks: Task[] = [];
  private syncQueue: SyncQueueItem[] = [];

  private constructor() {
    this.initTables();
  }

  public static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  /**
   * Bootstraps local tables on app startup.
   */
  private initTables() {
    console.log('[SQLite] Initializing tables...');
    console.log('[SQLite] Tables loaded successfully.');
  }

  // =========================================================================
  // LOCAL TASKS CRUD OPERATIONS
  // =========================================================================

  public async getTasks(userId: string): Promise<Task[]> {
    console.log(`[SQLite] Fetching tasks for user ${userId}`);
    return this.localTasks.filter(t => t.userId === userId);
  }

  public async insertTask(task: Task): Promise<void> {
    console.log('[SQLite] Inserting local task:', task.title);
    const index = this.localTasks.findIndex(t => t.id === task.id);
    if (index > -1) {
      this.localTasks[index] = task;
    } else {
      this.localTasks.push(task);
    }
  }

  public async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    console.log('[SQLite] Updating local task:', id, updates);
    const index = this.localTasks.findIndex(t => t.id === id);
    if (index > -1) {
      this.localTasks[index] = {
        ...this.localTasks[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  public async deleteTask(id: string): Promise<void> {
    console.log('[SQLite] Deleting local task:', id);
    this.localTasks = this.localTasks.filter(t => t.id !== id);
  }

  // =========================================================================
  // OFFLINE SYNC QUEUE MANAGEMENT
  // =========================================================================

  public async addToQueue(item: Omit<SyncQueueItem, 'id'>): Promise<void> {
    console.log(`[SQLite Queue] Adding pending action [${item.action}] for Task [${item.taskId}]`);
    const newItem: SyncQueueItem = {
      ...item,
      id: this.syncQueue.length + 1,
    };
    this.syncQueue.push(newItem);
  }

  public async getQueue(): Promise<SyncQueueItem[]> {
    console.log('[SQLite Queue] Querying pending queue item transactions...');
    return this.syncQueue;
  }

  public async deleteQueueItem(id: number): Promise<void> {
    console.log('[SQLite Queue] Removing processed queue log:', id);
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
  }

  public async clearQueue(): Promise<void> {
    console.log('[SQLite Queue] Clearing complete queue.');
    this.syncQueue = [];
  }
}
export const localDB = SQLiteDatabase.getInstance();
