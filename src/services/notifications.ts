import { Task } from '../types';
import notifee from '@notifee/react-native';
import { normalizeReminderDate } from '../utils/helpers/date';
import { getEnv } from '../config/env';

/**
 * Native Notification Service handles scheduling, cancelling,
 * and receiving push notifications (Local & FCM Cloud Server) using Notifee.
 */
export class NotificationService {
  private static instance: NotificationService | null = null;
  private reminderTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private constructor() {
    this.configure();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Configures local channels
   */
  private configure() {
    console.log('[NotificationService] Registering default channels...');
    notifee
      .createChannel({
        id: 'default',
        name: 'Default Channel',
      })
      .catch(error => {
        console.log(
          '[NotificationService] Error creating notification channel:',
          error,
        );
      });
  }

  /**
   * Prompts user for system notification permission
   */
  public async requestPermissions(): Promise<boolean> {
    console.log('[NotificationService] Requesting notification permissions...');
    try {
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus >= 1;
    } catch (e) {
      console.error('[NotificationService] Failed to request permissions:', e);
      return false;
    }
  }

  /**
   * Schedules a task reminder using Firebase Cloud Messaging when a token is available.
   * If FCM is unavailable, it falls back to a local Notifee notification.
   */
  public async scheduleLocalTaskReminder(
    task: Task,
    fcmToken?: string,
  ): Promise<string | null> {
    if (!task.dueDate) return null;

    const triggerDate =
      normalizeReminderDate(task.dueDate) ?? new Date(task.dueDate);
    const now = new Date();

    if (triggerDate <= now) {
      console.log(
        `[NotificationService] Task "${task.title}" is due in the past. Skipping reminder.`,
      );
      return null;
    }

    this.clearScheduledReminder(task.id);

    const delay = triggerDate.getTime() - now.getTime();
    const notificationId = `firebase_${task.id}`;

    console.log(
      `[NotificationService] Scheduling reminder for task "${
        task.title
      }" in ${Math.round(delay / 1000)} seconds`,
    );

    const timer = setTimeout(() => {
      void this.fireReminder(task, fcmToken, notificationId);
    }, Math.max(1000, delay));

    this.reminderTimers.set(task.id, timer);
    return notificationId;
  }

  private async fireReminder(
    task: Task,
    fcmToken?: string,
    notificationId?: string,
  ): Promise<void> {
    const sent = await this.sendFirebaseReminder(task, fcmToken);
    if (!sent) {
      await this.displayLocalReminder(task, notificationId);
    }
  }

  private async sendFirebaseReminder(
    task: Task,
    fcmToken?: string,
  ): Promise<boolean> {
    if (!fcmToken) {
      console.warn(
        '[NotificationService] No FCM token available for Firebase reminder.',
      );
      return false;
    }

    const functionsUrl =
      getEnv().firebaseFunctionsUrl || process.env.FIREBASE_FUNCTIONS_URL || '';

    if (!functionsUrl) {
      console.warn(
        '[NotificationService] Firebase Cloud Function URL is not configured. Falling back to local notification.',
      );
      return false;
    }

    try {
      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: fcmToken,
          title: `⏰ Task Reminder: ${task.priority.toUpperCase()} Priority`,
          body: task.title,
          data: {
            taskId: task.id,
            type: 'task_reminder',
            dueDate: task.dueDate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloud Function responded with ${response.status}`);
      }

      const payload = await response.json();
      const success =
        payload.success === true ||
        payload.success === 1 ||
        payload.message === 'success';

      if (!success) {
        console.warn(
          '[NotificationService] Firebase reminder via Cloud Function did not succeed.',
          payload,
        );
        return false;
      }

      console.log(
        '[NotificationService] Firebase reminder sent successfully via Cloud Function.',
      );
      return true;
    } catch (error) {
      console.error(
        '[NotificationService] Error sending Firebase reminder via Cloud Function:',
        error,
      );
      return false;
    }
  }

  private async displayLocalReminder(task: Task, notificationId?: string) {
    try {
      await notifee.displayNotification({
        id: notificationId,
        title: `⏰ Task Reminder: ${task.priority.toUpperCase()} Priority`,
        body: task.title,
        data: { taskId: task.id },
        android: {
          channelId: 'default',
          importance: 4,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.error(
        '[NotificationService] Error displaying local reminder:',
        error,
      );
    }
  }

  /**
   * Cancels a scheduled task notification (e.g., if deleted or completed)
   */
  public async cancelTaskReminder(taskId: string): Promise<void> {
    console.log(
      `[NotificationService] Cancelling reminder for task [${taskId}]`,
    );
    this.clearScheduledReminder(taskId);
    try {
      await notifee.cancelNotification(`firebase_${taskId}`);
    } catch (error) {
      console.error('[NotificationService] Error cancelling reminder:', error);
    }
  }

  private clearScheduledReminder(taskId: string): void {
    const existingTimer = this.reminderTimers.get(taskId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.reminderTimers.delete(taskId);
    }
  }

  /**
   * (Bonus Feature) Configures Firebase Cloud Messaging background hooks
   */
  public registerFCMToken(userId: string) {
    console.log(
      `[NotificationService] Registering device token on FCM Server for userId ${userId}`,
    );
    // Handled in notificationContext.tsx
  }
}

export const notificationService = NotificationService.getInstance();
