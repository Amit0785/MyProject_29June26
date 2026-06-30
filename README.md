# TaskSync - Offline-First React Native Task Manager

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
│              (Redux Toolkit + Redux Saga)              │
└───────────────────────────┬────────────────────────────┘
                            │ (Invokes repositories)
┌───────────────────────────▼────────────────────────────┐
│                    Sync / Coordinator                  │
│                      (SyncManager)                     │
└─────────────────────┬──────────────┬───────────────────┘
                      │              │
┌─────────────────────▼──────┐┌──────▼───────────────────┐
│       Local Database       ││      Cloud Database      │
│    (Simulated SQLite DB)   ││        (Firestore)       │
└────────────────────────────┘└──────────────────────────┘
```

### 1. Presentation Layer (React Native + Custom Components)

- **React Navigation**: Structured with a split root (`AuthStack` for guest onboarding, registration, and login, and `AppStack` for authenticated screens). Session tokens are persisted using secured local storage, dynamically mounting the appropriate navigation stack.
- **FlatList Performance Optimizations**:
  - `removeClippedSubviews={true}`: Frees up memory by unmounting off-screen list items.
  - `initialNumToRender={10}` & `maxToRenderPerBatch={10}`: Prevents thread-locking on initial screen load.
  - `windowSize={5}`: Restricts the render window to reduce rendering stress.
  - `getItemLayout`: Bypasses dynamic measurement calculations for static cell heights (104px offset per cell).
  - Memoized render items (`React.memo`) and stable callback function references (`onToggle`, `onDelete`, `onEdit`) to avoid unwanted re-renders when task properties change.
- **Debounced Search Filter**: Text search input is debounced locally for 300ms before triggering Redux updates, ensuring fluid, lag-free typing.
- **Responsive Layouts**: Screen padding, typography, spacing, and floating controls now scale with orientation and device dimensions via the shared orientation helpers.

### 2. State Management Layer (Redux Toolkit & Redux Saga)

- Redux acts as the centralized reactive store.
- **Slices**:
  - `auth`: Manages session status, current user profile, authentication errors, and loading states.
  - `tasks`: Keeps track of task lists, category filters, search states, and local synchronization status markers.
- **Redux Saga**: Side-effects manager that coordinates login task initialization and handles background task syncing on network changes.

### 3. Persistence & Local Database Layer

- Local data is persisted on-device using a simulated SQLite database client wrapper for Javascript portability.
- **Database Schema**:
  - `tasks`: Stores local replicas of task records containing field schemas: `id` (UUID), `userId`, `title`, `description`, `category`, `priority`, `dueDate`, `isCompleted`, `createdAt`, `updatedAt`.
  - `sync_queue`: Logs local changes made offline. Format: `id` (auto-increment), `taskId`, `action` ('CREATE' | 'UPDATE' | 'DELETE'), `payload` (JSON string), `timestamp` (integer).

### 4. Synchronization Engine (SyncManager)

- **Queue-Based Write-Ahead Pattern**:
  1. When **Online**: Writes are executed on the local SQLite DB and mirrored directly to Cloud Firestore.
  2. When **Offline**: Writes write locally and append an operational transaction record to the SQLite `sync_queue`.
  3. **Re-connection Handling**: Subscribes to network connectivity state changes via `@react-native-community/netinfo`. Upon switching to an active internet connection, `SyncManager.flushQueue()` is triggered asynchronously.
  4. **Queue Processing**: Reads `sync_queue` items ordered by `timestamp` ASC. For each queued item:
     - Pulls action and document references.
     - Commits changes to Firestore.
     - Upon a successful response, deletes the processed item from `sync_queue`.
- **Conflict Resolution (Last-Write-Wins)**:
  - Both local and remote documents contain `updatedAt` timestamps.
  - Updates only pull remote overwrites if the local copy's status is already `'synced'`, protecting local offline changes from being overwritten during network transitions.

### 5. Notification Service

- Utilizes local push notification schedulers (`@notifee/react-native`) for task reminders.
- Schedules high-precision trigger alerts matching task due dates using native alarm channels, with fully integrated permission checks and dynamic alert cancels.
- Reminder and form UI states now follow the shared color system for better readability in both dark and light themes.

---

## 🛠️ Tech Stack & Key Libraries

| Dependency                           | Purpose                                               |
| :----------------------------------- | :---------------------------------------------------- |
| **React Native (v0.86+)**            | Cross-platform mobile framework                       |
| **React Navigation (v7)**            | Route stack and tab navigation management             |
| **Redux Toolkit (@reduxjs/toolkit)** | Deterministic state container                         |
| **Redux Saga (redux-saga)**          | Background side-effects orchestrator                  |
| **@react-native-firebase/app**       | Native bridge to Google Firebase platform             |
| **@react-native-firebase/auth**      | Fully authenticated, persisted login sessions         |
| **@react-native-firebase/firestore** | Server synchronization backend                        |
| **@react-native-firebase/messaging** | Cloud-hosted push notifications                       |
| **@react-native-community/netinfo**  | Real-time network telemetry tracking                  |
| **@notifee/react-native**            | High-precision scheduling of local alarms & reminders |
| **Formik & Yup**                     | Form state validation management                      |

---

## 🚀 Environment Configuration

The project manages environment configuration through **multi-environment variables** (.env files and build schemes) targeting three stages: **Development**, **Staging**, and **Production**.

### Env Files Structure

We supply three `.env` files:

1. **`.env.development`** (Points to sandboxed Firestore DB, local emulators enabled)
2. **`.env.staging`** (Points to testing Firebase servers, logs active for QAs)
3. **`.env.production`** (Points to the official, hardened, high-scale Firestore database)

#### Configuration Variables:

```ini
# Firebase Config Keys
FIREBASE_API_KEY="AIzaSyA..."
FIREBASE_AUTH_DOMAIN="myproject-c006d.firebaseapp.com"
FIREBASE_PROJECT_ID="myproject-c006d"
FIREBASE_STORAGE_BUCKET="myproject-c006d.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="1234567890"
FIREBASE_APP_ID="1:12345:web:abcd"

# Native Notification Settings
LOCAL_NOTIFICATIONS_ENABLED=true
REMINDER_SOUND_DEFAULT=true

# API Endpoints (For external webhooks or microservices)
API_BASE_URL="http://192.168.1.50:3000/v1"
```

---

## 💻 How to Run the App

### Prerequisites

- Node.js v22+
- CocoaPods (for iOS builds)
- Android Studio & SDK (for Android builds)
- React Native CLI

### Installation

```bash
# Clone the repository and navigate to root
git clone https://github.com/Amit0785/MyProject_29June26.git
cd myproject

# Install packages
yarn install

# Install iOS dependencies
cd ios && pod install && cd ..
```

### Running in Different Environments

We provide scripts to inject the appropriate environment variables before launching the bundler:

```bash
# 1. Start Metro Bundler
yarn start

# 2. Run on Android Emulator / Physical Device
yarn android:dev      # Development variables loaded
yarn android:staging  # Staging variables loaded
yarn android:prod     # Production variables loaded

# 3. Run on iOS Simulator
yarn ios:dev          # Development variables loaded
yarn ios:staging      # Staging variables loaded
yarn ios:prod         # Production variables loaded
```

---

## ⚠️ Known Limitations & Edge Cases

1. **Local DB Lockups**: On older Android models, concurrent background database writes (such as incoming push notification worker logs + user actions) may cause standard SQLite lockups. The implementation prevents this by wrapping writes in serialized async mutexes.
2. **Deep Synchronization Merge Conflicts**: In a multi-user collaborative environment, if two users modify the exact same task title offline, "Last-Write-Wins" will silently override the earlier edit. A robust solution would prompt the user with a visual diff screen, which is currently out of scope for this version.
3. **Battery Saving Restrictions**: In iOS and Android, battery-saver modes can delay or terminate background SyncManagers. Offline tasks will only sync when the user opens or active-resumes the application.
4. **Interactive Sandbox Preview Constraints**: When running this repository inside a web-based sandbox environment (like the AI Studio container preview), native-only code structures such as `SQLite` and real device-level `APNs/FCM` local alerts are shimmed using highly realistic Web LocalStorage APIs and custom Redux notification listeners. The underlying production-ready React Native native wrappers remain fully present in the codebase.
