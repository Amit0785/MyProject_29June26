import notifee, {
  AndroidImportance,
  EventType,
  Notification,
} from '@notifee/react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

export interface INotificationContextType {
  fcmToken: string;
  permissionGranted: boolean;
  // isInitialized: boolean;
  notificationCount: number;
  displayLocalNotification: (
    title: string,
    body: string,
    data?: {},
  ) => Promise<void>;
  requestPermissions: () => Promise<void>;
  getFCMToken: () => Promise<string | undefined>;
}

// Create the context
const NotificationContext = createContext<INotificationContextType | null>(
  null,
);

let unsubscribeOnMessage: (() => void) | undefined;
let unsubscribeOnNotificationOpened: (() => void) | undefined;
let unsubscribeOnTokenRefresh: (() => void) | undefined;

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider',
    );
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fcmToken, setFcmToken] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const displayedMessages = useRef<Set<string>>(new Set());

  useEffect(() => {
    initializeNotifications();

    // Cleanup function

    return () => {
      if (unsubscribeOnMessage) unsubscribeOnMessage();
      if (unsubscribeOnNotificationOpened) unsubscribeOnNotificationOpened();
      if (unsubscribeOnTokenRefresh) unsubscribeOnTokenRefresh();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeNotifications = async () => {
    try {
      await requestPermissions();
      await createNotificationChannel();
      setupMessageHandlers();
      setupNotifeeHandlers();
    } catch (error) {
      console.log('Error initializing notifications:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        setPermissionGranted(enabled);
        if (enabled) {
          await messaging().registerDeviceForRemoteMessages();
          await getFCMToken();
        }
      } else if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );

        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissionGranted(isGranted);

        if (isGranted) {
          await getFCMToken();
        }
      }

      // Request Notifee permissions
      await notifee.requestPermission();
    } catch (error) {
      console.log('Error requesting permissions:', error);
    }
  };

  const createNotificationChannel = async () => {
    try {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
    } catch (error) {
      console.log('Error creating notification channel:', error);
    }
  };

  const getFCMToken = async () => {
    try {
      const token = await messaging().getToken();
      setFcmToken(token);
      return token;
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  };

  const setupMessageHandlers = () => {
    // Handle background messages
    // messaging().setBackgroundMessageHandler(async remoteMessage => {
    //   console.log('Message handled in the background!', remoteMessage);
    //   await displayNotification(remoteMessage);
    // });

    // Handle foreground messages
    unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('Message received in foreground!', remoteMessage);
      await displayNotification(remoteMessage);
      setNotificationCount(prev => prev + 1);
    });

    // Handle notification open events
    unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log(
          'Notification caused app to open from background:',
          remoteMessage,
        );
        handleNotificationOpen(remoteMessage, false);
      },
    );

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage,
          );
          handleNotificationOpen(remoteMessage, true);
        }
      });

    // Handle token refresh
    unsubscribeOnTokenRefresh = messaging().onTokenRefresh(token => {
      console.log('FCM Token refreshed:', token);
      setFcmToken(token);
    });
  };

  const setupNotifeeHandlers = useCallback(() => {
    // Handle notification events (press, dismiss, etc.)
    notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('User dismissed notification', detail.notification);
          break;
        case EventType.PRESS:
          handleNotificationPress(detail.notification!);
          break;
      }
    });

    // Handle background events
    // notifee.onBackgroundEvent(async ({ type, detail }) => {
    //   console.log('Background event:', type, detail);
    //   Alert.alert(detail.toString());
    //   if (type === EventType.PRESS) {
    //     console.log('Notification pressed in background');
    //   }
    // });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayNotification = useCallback(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      const { notification, data } = remoteMessage;
      const messageId = remoteMessage.messageId;
      if (displayedMessages.current.has(messageId!)) {
      } else {
        displayedMessages.current.add(messageId!);

        try {
          if (notification?.title) {
            await notifee.displayNotification({
              title: notification?.title,
              body: notification?.body,
              data: data || {},
              android: {
                channelId: 'default',
                importance: AndroidImportance.HIGH,
                pressAction: {
                  id: 'default',
                },
              },
              ios: {
                sound: 'default',
              },
            });
          }
        } catch (error) {
          console.log('Error displaying notification:', error);
        }
      }
    },
    [],
  );

  const displayLocalNotification = useCallback(
    async (title: string, body: string, data = {}) => {
      try {
        await notifee.displayNotification({
          title,
          body,
          data,
          android: {
            channelId: 'default',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
        });
      } catch (error) {
        console.log('Error displaying local notification:', error);
      }
    },
    [],
  );

  // const cancelAllNotifications = async () => {
  //   try {
  //     await notifee.cancelAllNotifications();
  //     setNotificationCount(0);
  //   } catch (error) {
  //     console.log('Error canceling notifications:', error);
  //   }
  // };

  // const cancelNotification = async (notificationId: string) => {
  //   try {
  //     await notifee.cancelNotification(notificationId);
  //   } catch (error) {
  //     console.log('Error canceling notification:', error);
  //   }
  // };

  // const setBadgeCount = async (count: number) => {
  //   try {
  //     if (Platform.OS === 'ios') {
  //       await notifee.setBadgeCount(count);
  //     }
  //   } catch (error) {
  //     console.log('Error setting badge count:', error);
  //   }
  // };

  // const getBadgeCount = async () => {
  //   try {
  //     if (Platform.OS === 'ios') {
  //       return await notifee.getBadgeCount();
  //     }
  //     return 0;
  //   } catch (error) {
  //     console.log('Error getting badge count:', error);
  //     return 0;
  //   }
  // };

  // const subscribeToTopic = async (topic: string) => {
  //   try {
  //     await messaging().subscribeToTopic(topic);
  //     console.log(`Subscribed to topic: ${topic}`);
  //   } catch (error) {
  //     console.log('Error subscribing to topic:', error);
  //   }
  // };

  // const unsubscribeFromTopic = async (topic: string) => {
  //   try {
  //     await messaging().unsubscribeFromTopic(topic);
  //     console.log(`Unsubscribed from topic: ${topic}`);
  //   } catch (error) {
  //     console.log('Error unsubscribing from topic:', error);
  //   }
  // };

  const handleNotificationOpen = useCallback(
    (
      remoteMessage: FirebaseMessagingTypes.RemoteMessage,
      quitState: boolean,
    ) => {
      const { data } = remoteMessage;
      console.log('========>', quitState, data);
    },
    [],
  );

  const handleNotificationPress = useCallback((notification: Notification) => {
    const { data } = notification;
    console.log('========>', data);
  }, []);

  // Context value
  const value = {
    // State
    fcmToken,
    permissionGranted,
    notificationCount,

    // Methods
    displayLocalNotification,
    // cancelAllNotifications,
    // cancelNotification,
    // setBadgeCount,
    // getBadgeCount,
    // subscribeToTopic,
    // unsubscribeFromTopic,
    requestPermissions,
    getFCMToken,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
