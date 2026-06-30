/* eslint-disable react-native/no-inline-styles */
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { FC } from 'react';
import { useAppDispatch } from '@app/store';
import { toggleTheme } from '@app/store/slice/tasks.slice';
import { logout } from '@app/store/slice/auth.slice';
import auth from '@react-native-firebase/auth';
import { horizontalScale, verticalScale } from '@app/utils/orientation';

export interface ICDynamicProps {
  isDark: boolean;
  networkStatus: string;
}

const CDynamicHeader: FC<ICDynamicProps> = ({ isDark, networkStatus }) => {
  const dispatch = useAppDispatch();

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderBottomColor: isDark ? '#334155' : '#e2e8f0',
        },
        !isDark && styles.headerLightShadow,
      ]}
    >
      <View style={styles.headerLeft}>
        <Text
          style={[styles.headerLogo, { color: isDark ? '#38bdf8' : '#0ea5e9' }]}
        >
          ✓ TaskSync
        </Text>
        <View
          style={[
            styles.connectionPill,
            {
              backgroundColor:
                networkStatus === 'online' ? '#10b98122' : '#f9731622',
            },
          ]}
        >
          <Text
            style={[
              styles.connectionPillText,
              { color: networkStatus === 'online' ? '#10b981' : '#f97316' },
            ]}
          >
            {networkStatus === 'online' ? '● Online' : '🔌 Offline'}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={() => dispatch(toggleTheme())}
          style={[
            styles.headerBtn,
            { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBtnIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            try {
              await auth().signOut();
            } catch (err) {
              console.error('Error signing out:', err);
            }
            dispatch(logout());
          }}
          style={[
            styles.headerBtn,
            {
              backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
              marginLeft: 10,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBtnIcon}>🚪</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CDynamicHeader;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(20),
    borderBottomWidth: 1,
  },
  headerLightShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  connectionPill: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },

  connectionPillText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: {
    fontSize: 16,
  },
});
