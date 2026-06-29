import { RootStackParamList } from '@app/types';
import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';

// Create navigation reference with typed RootStackParamList
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Navigate function with correct typing and format
export function navigate<RouteName extends keyof RootStackParamList>( // (RootStackParamList & SettingsStackProps)>
  name: RouteName,
  // params?: (RootStackParamList & SettingsStackProps)[RouteName]
  params?: RootStackParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    // Remove `{ params }` wrapper to match `navigate` method requirements
    navigationRef.navigate(name as any, params);
  }
}

// Replace function with correct typing and format
export function replace<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name as any, { params })); // Adjust format
  }
}

// Go back function
export function goBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
}

// Reset navigation stack
export function reset(index: number, name: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: index,
      routes: [{ name: name as any }], // Use 'as any' if there's a type mismatch
    });
  }
}

// Pop function for going back N screens
export function canGoBack(num: number) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.pop(num));
  }
}
