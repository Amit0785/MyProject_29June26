import { Task } from '../types';
import notifee, { TriggerType, TimestampTrigger } from '@notifee/react-native';
import { normalizeReminderDate } from '../utils/helpers/date';

/**
 * Native Notification Service handles scheduling, cancelling,
 * and receiving push notifications (Local & FCM Cloud Server) using Notifee.
 */
export class NotificationService {
  private static instance: NotificationService | null = null;

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
   * Schedules a local push notification matching a task's due date using Notifee triggers.
   */
  public async scheduleLocalTaskReminder(task: Task): Promise<string | null> {
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

    const notificationId = `alarm_${task.id}`;

    try {
      await this.cancelTaskReminder(task.id);

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
      };

      await notifee.createTriggerNotification(
        {
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
        },
        trigger,
      );

      console.log(
        `[NotificationService] Scheduled local reminder for "${
          task.title
        }" at ${triggerDate.toString()}`,
      );
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Error scheduling reminder:', error);
      return null;
    }
  }

  /**
   * Cancels a scheduled task notification (e.g., if deleted or completed)
   */
  public async cancelTaskReminder(taskId: string): Promise<void> {
    console.log(
      `[NotificationService] Cancelling local notification for task [${taskId}]`,
    );
    try {
      await notifee.cancelNotification(`alarm_${taskId}`);
    } catch (error) {
      console.error('[NotificationService] Error cancelling reminder:', error);
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
