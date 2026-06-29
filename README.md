# TaskSync - Off-Grid React Native Task Manager

TaskSync is a production-ready, cross-platform React Native application designed for high-performance task management with robust offline capability, automatic Firestore synchronization, theme support, local reminder scheduling, and multi-environment configuration.

---

## 📱 Architecture & Design Choices

The application is structured following a **Modular Layered Architecture** with strict separation of concerns, ensuring high testability, scalability, and clean code boundaries.

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│      (React Native + FlatList + React Navigation)     │
└───────────────────────────┬────────────────────────────┘
                            │ (Dispatches actions)
┌───────────────────────────▼────────────────────────────┐
│                  State Management Layer                │
│                     (Redux Toolkit)                    │
└───────────────────────────┬────────────────────────────┘
                            │ (Invokes repositories)
┌───────────────────────────▼────────────────────────────┐
│                    Sync / Coordinator                  │
│                      (SyncManager)                     │
└─────────────────────┬──────────────┬───────────────────┘
                      │              │
┌─────────────────────▼──────┐┌──────▼───────────────────┐
│       Local Database       ││      Cloud Database      │
│     (SQLite/LocalState)    ││        (Firestore)       │
└────────────────────────────┘└──────────────────────────┘
```

### 1. Presentation Layer (React Native + Tailwind)

- **React Navigation**: Structured with a split root (`AuthStack` for guest onboarding, registration, and login, and `AppStack` for authenticated screens). Session tokens are persisted using secured local storage, dynamically mounting the appropriate navigation stack.
- **FlatList Performance Optimizations**:
  - `removeClippedSubviews={true}`: Frees up memory by unmounting off-screen list items.
  - `initialNumToRender={10}` & `maxToRenderPerBatch={10}`: Prevents thread-locking on initial screen load.
  - `windowSize={5}`: Restricts the render window to reduce rendering stress.
  - `getItemLayout`: Bypasses dynamic measurement calculations for static cell heights.
  - Memoized render items (`React.memo`) to avoid unwanted re-renders when task properties change.
- **Lazy Loading**: Screens are imported using code-splitting and loaded dynamically to decrease initial bundle size and optimize startup performance.

### 2. State Management Layer (Redux Toolkit)

- Redux acts as the centralized reactive store.
- **Slices**:
  - `auth`: Manages session status, current user profile, authentication errors, and loading states.
  - `tasks`: Keeps track of task lists, category filters, search states, and local synchronization status markers.

### 3. Persistence & Local Database Layer (SQLite)

- Local data is persisted on-device using SQLite (`expo-sqlite` / `react-native-sqlite-storage`).
- **Database Schema**:
  - `tasks`: Stores local replicas of task records containing field schemas: `id` (UUID), `userId`, `title`, `description`, `category`, `priority`, `dueDate`, `isCompleted`, `createdAt`, `updatedAt`.
  - `sync_queue`: Logs local changes made offline. Format: `id` (auto-increment), `taskId`, `action` ('CREATE' | 'UPDATE' | 'DELETE'), `payload` (JSON string), `timestamp` (integer).

### 4. Synchronization Engine (SyncManager)

- **Queue-Based Write-Ahead Pattern**:
  1. When **Online**: Writes are executed on the local SQLite DB and mirrored directly to Cloud Firestore.
  2. When **Offline**: Writes write locally and append an operational transaction record to the SQLite `sync_queue`.
  3. **Re-connection Handling**: Uses `@react-native-community/netinfo` to monitor connection state. Upon switching to an active internet connection, `SyncManager.flushQueue()` is triggered asynchronously.
  4. **Queue Processing**: Reads `sync_queue` items ordered by `timestamp` ASC. For each queued item:
     - Pulls action and document references.
     - Commits changes to Firestore.
     - Upon a successful response, deletes the processed item from `sync_queue`.
- **Conflict Resolution (Last-Write-Wins)**:
  - Both local and remote documents contain `updatedAt` timestamps.
  - If a document is updated remotely and locally while offline, the synchronization check compares timestamps. The change with the more recent epoch timestamp is written to both storage engines.

### 5. Notification Service

- Utilizes local push notification schedulers (`expo-notifications`) for task reminders.
- Supports server-side triggers using Firebase Cloud Messaging (FCM) for collaborative environments (such as team members assigning or updating collective tasks).

---

## 🛠️ Tech Stack & Key Libraries

| Dependency                           | Purpose                                               |
| :----------------------------------- | :---------------------------------------------------- |
| **React Native (v0.74+)**            | Cross-platform framework                              |
| **React Navigation (v6)**            | Route stack and tab management                        |
| **Redux Toolkit (@reduxjs/toolkit)** | Deterministic state container                         |
| **expo-sqlite**                      | Fast, ACID-compliant local SQL storage                |
| **@react-native-firebase/app**       | Native bridge to Google Firebase platform             |
| **@react-native-firebase/auth**      | Fully authenticated, persisted login sessions         |
| **@react-native-firebase/firestore** | Server synchronization backend                        |
| **@react-native-firebase/messaging** | Cloud-hosted push notifications                       |
| **@react-native-community/netinfo**  | Real-time network telemetry tracking                  |
| **expo-notifications**               | High-precision scheduling of local alarms & reminders |

---

## 🚀 Environment Configuration

The project manages environment configuration through **multi-environment variables** (.env files and build schemes) targeting three stages: **Development**, **Staging**, and **Production**.

### Env Files Structure

We supply three `.env` blueprints:

1. **`.env.development`** (Points to sandboxed Firestore DB, local emulators enabled)
2. **`.env.staging`** (Points to testing Firebase servers, logs active for QAs)
3. **`.env.production`** (Points to the official, hardened, high-scale Firestore database)

#### Configuration Variables:

```ini
# Firebase Config Keys
FIREBASE_API_KEY="AIzaSyA..."
FIREBASE_AUTH_DOMAIN="tasksync-dev.firebaseapp.com"
FIREBASE_PROJECT_ID="tasksync-dev"
FIREBASE_STORAGE_BUCKET="tasksync-dev.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="1234567890"
FIREBASE_APP_ID="1:12345:web:abcd"

# Native Notification Settings
LOCAL_NOTIFICATIONS_ENABLED=true
REMINDER_SOUND_DEFAULT=true

# API Endpoints (For external webhooks or microservices)
API_BASE_URL="https://api-dev.tasksync.com/v1"
```

### Accessing Environments in JS/TS

In React Native, variables are injected securely at build time using `react-native-dotenv` or `expo-constants`:

```typescript
// src/config/env.ts
import { FIREBASE_API_KEY, FIREBASE_PROJECT_ID, API_BASE_URL } from '@env';

export const ENV = {
  firebaseConfig: {
    apiKey: FIREBASE_API_KEY,
    projectId: FIREBASE_PROJECT_ID,
    // ...
  },
  apiUrl: API_BASE_URL,
};
```

---

## 💻 How to Run the App

### Prerequisites

- Node.js v18+
- CocoaPods (for iOS builds)
- Android Studio & SDK (for Android builds)
- Expo CLI (if using Expo bare workflow) or React Native CLI

### Installation

```bash
# Clone the repository and navigate to root
git clone https://github.com/yourusername/tasksync.git
cd tasksync

# Install packages
npm install

# Install iOS dependencies
cd ios && pod install && cd ..
```

### Running in Different Environments

We provide scripts to inject the appropriate environment variables before launching the bundler:

```bash
# 1. Start Metro Bundler
npm run start

# 2. Run on Android Emulator / Physical Device
npm run android:dev      # Development variables loaded
npm run android:staging  # Staging variables loaded
npm run android:prod     # Production variables loaded

# 3. Run on iOS Simulator
npm run ios:dev          # Development variables loaded
npm run ios:staging      # Staging variables loaded
npm run ios:prod         # Production variables loaded
```

---

## ⚠️ Known Limitations & Edge Cases

1. **Local DB Lockups**: On older Android models, concurrent background database writes (such as incoming push notification worker logs + user actions) may cause standard SQLite lockups. The implementation prevents this by wrapping writes in serialized async mutexes.
2. **Deep Synchronization Merge Conflicts**: In a multi-user collaborative environment, if two users modify the exact same task title offline, "Last-Write-Wins" will silently override the earlier edit. A robust solution would prompt the user with a visual diff screen, which is currently out of scope for this version.
3. **Battery Saving Restrictions**: In iOS and Android, battery-saver modes can delay or terminate background SyncManagers. Offline tasks will only sync when the user opens or active-resumes the application.

---

## 🛠️ Completed Implementations

1. **User Session Persistence**: Implemented Firebase Authentication state observation (`onAuthStateChanged`) within navigation routing to persist session tokens across app reloads, along with native sign-out handlers on user logout.
2. **Firestore Synchronization & Reconnection Saga**: Connected Redux and local SQLite stores to Cloud Firestore using native database references. Built custom Redux Sagas to automate queue flushes on connectivity state transitions (Offline -> Online) and pull/merge user tasks on login.
3. **Trigger-Based reminders (Notifee)**: Scheduled high-precision trigger alerts matching task due dates using native `@notifee/react-native` alarm channels, with fully integrated permission checks and dynamic alert cancels.
4. **Modern Path Aliasing Configuration**: Removed deprecated compiler directives (`baseUrl: "."`) and mapped path aliases relatively, preparing the project for TypeScript 7.0 and resolving preset warning issues.
