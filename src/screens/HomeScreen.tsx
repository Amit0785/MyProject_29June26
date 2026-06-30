import { CDynamicHeader, TaskListItem } from '@app/components';
import { navigate } from '@app/navigation/RootNavigation';
import {
  deleteTaskAction,
  setCategoryFilter,
  setSearchQuery,
  updateTaskAction,
} from '@app/store/slice/tasks.slice';
import {
  horizontalScale,
  moderateScale,
  normalize,
  verticalScale,
} from '@app/utils/orientation';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { shallowEqual } from 'react-redux';
import { notificationService } from '../services/notifications';
import { useAppDispatch, useAppSelector } from '../store';
import { Task } from '../types';
import { Colors } from '@app/themes';

const EmptyTaskList = React.memo(({ isDark }: { isDark: boolean }) => {
  return (
    <View style={styles.emptyContainer}>
      <Text
        style={[
          styles.emptyText,
          { color: isDark ? Colors.slate400 : Colors.slate500 },
        ]}
      >
        No Tasks Registered.
      </Text>
      <Text
        style={[
          styles.emptySubtext,
          { color: isDark ? Colors.slate500 : Colors.slate400 },
        ]}
      >
        Hit "+" below to map a new task.
      </Text>
    </View>
  );
});

const HomeScreen: FC = () => {
  const dispatch = useAppDispatch();

  const {
    items,
    networkStatus,
    categoryFilter,
    searchQuery,
    isSyncing,
    syncingProgressMessage,
    theme,
  } = useAppSelector(state => state.tasks, shallowEqual);

  const isDark = theme === 'dark';

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Sync local query when store query changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Debounce the search query dispatch to Redux
  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setSearchQuery(localSearchQuery));
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchQuery, dispatch]);

  // Filter and search logic combined
  const filteredTasks = useMemo(() => {
    return items.filter(task => {
      const matchesCategory =
        categoryFilter === 'all' || task.category === categoryFilter;
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, categoryFilter, searchQuery]);

  const toggleTask = useCallback(
    (task: Task) => {
      const isNowCompleted = !task.isCompleted;
      dispatch(
        updateTaskAction({
          id: task.id,
          updates: { isCompleted: isNowCompleted },
        }),
      );

      // Local notifications management on state changes
      if (isNowCompleted) {
        notificationService.cancelTaskReminder(task.id);
      } else {
        notificationService.scheduleLocalTaskReminder({
          ...task,
          isCompleted: isNowCompleted,
        });
      }
    },
    [dispatch],
  );

  const deleteTask = useCallback(
    (id: string) => {
      dispatch(deleteTaskAction(id));
      notificationService.cancelTaskReminder(id);
    },
    [dispatch],
  );

  const handleEdit = useCallback((id: string) => {
    navigate('TaskForm', { taskId: id });
  }, []);

  const renderEmptyComponent = useCallback(
    () => <EmptyTaskList isDark={isDark} />,
    [isDark],
  );

  const renderItem: ListRenderItem<Task> = useCallback(
    ({ item }) => (
      <TaskListItem
        task={item}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onEdit={handleEdit}
        theme={theme}
      />
    ),
    [toggleTask, deleteTask, handleEdit, theme],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? Colors.slate900 : Colors.slate50 },
      ]}
    >
      {/* Dynamic Header Component */}

      <CDynamicHeader isDark={isDark} networkStatus={networkStatus} />

      {/* Offline Connectivity Telemetry Banner */}
      {networkStatus === 'offline' && (
        <View style={styles.offlineBanner}>
          <Text style={styles.bannerText}>
            🔌 You are currently OFFLINE. Changes will sync when online.
          </Text>
        </View>
      )}

      {/* Synchronizing Queue Loader */}
      {isSyncing && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncBannerText}>🔄 {syncingProgressMessage}</Text>
        </View>
      )}

      {/* Search Bar Section */}
      <View
        style={[
          styles.searchSection,
          { backgroundColor: isDark ? Colors.slate800 : Colors.white },
        ]}
      >
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDark ? Colors.slate900 : Colors.slate100,
              color: isDark ? Colors.white : Colors.slate900,
              borderColor: isDark ? Colors.slate700 : Colors.slate300,
            },
          ]}
          placeholder="Search task by title or description..."
          placeholderTextColor={isDark ? Colors.slate500 : Colors.slate400}
          value={localSearchQuery}
          onChangeText={setLocalSearchQuery}
        />
      </View>

      {/* Category Horizontal Filter Tabs */}
      <View
        style={[
          styles.filterTabs,
          {
            backgroundColor: isDark ? Colors.slate800 : Colors.white,
            borderBottomColor: isDark ? Colors.slate700 : Colors.slate300,
          },
        ]}
      >
        {['all', 'work', 'personal', 'shopping', 'health'].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.tab,
              { backgroundColor: isDark ? Colors.slate700 : Colors.slate100 },
              categoryFilter === cat &&
                (isDark ? styles.tabActiveDark : styles.tabActiveLight),
            ]}
            onPress={() => dispatch(setCategoryFilter(cat))}
          >
            <Text
              style={[
                styles.tabText,
                categoryFilter === cat && styles.tabTextActive,
              ]}
            >
              {cat.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Highly Optimized Task FlatList */}
      <FlatList
        data={filteredTasks}
        renderItem={renderItem}
        keyExtractor={(item: Task) => item.id}
        contentContainerStyle={styles.listContent}
        // --- VITAL FLATLIST PERFORMANCE CONFIGS ---
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 104, // Static item height offset
          offset: 104 * index,
          index,
        })}
        ListEmptyComponent={renderEmptyComponent}
      />

      {/* Floating Action Creator Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigate('TaskForm')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: verticalScale(15),
  },

  offlineBanner: {
    backgroundColor: Colors.warning,
    paddingVertical: verticalScale(6),
    alignItems: 'center',
  },
  syncBanner: {
    backgroundColor: Colors.info,
    paddingVertical: verticalScale(6),
    alignItems: 'center',
  },
  bannerText: {
    color: Colors.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  syncBannerText: {
    color: Colors.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  searchSection: {
    padding: moderateScale(16),
  },
  searchInput: {
    borderRadius: moderateScale(8),
    borderWidth: 1,
    height: verticalScale(44),
    paddingHorizontal: horizontalScale(16),
    fontSize: moderateScale(14),
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
  },
  tab: {
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    marginHorizontal: horizontalScale(4),
  },
  tabActiveDark: {
    backgroundColor: Colors.accent,
  },
  tabActiveLight: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.slate500,
    fontSize: 10,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.slate900,
  },
  listContent: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(88),
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 92,
  },
  taskCardLightShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  checkboxContainer: {
    marginRight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkboxTick: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  taskDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: normalize(15),
    fontWeight: 'bold',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.slate400,
  },
  syncStatus: {
    marginLeft: 8,
    fontSize: 12,
  },
  taskDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  dueDateText: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(80),
  },
  emptyText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
  },
  fab: {
    position: 'absolute',
    bottom: verticalScale(24),
    right: horizontalScale(24),
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(6),
    elevation: 8,
  },
  fabText: {
    fontSize: moderateScale(28),
    color: Colors.white,
    fontWeight: 'bold',
  },
});
