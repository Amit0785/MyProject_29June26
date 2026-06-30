/* eslint-disable react-native/no-inline-styles */
import { CDynamicHeader } from '@app/components';
import { navigate } from '@app/navigation/RootNavigation';
import {
  deleteTaskAction,
  setCategoryFilter,
  setSearchQuery,
  updateTaskAction,
} from '@app/store/slice/tasks.slice';
import { verticalScale } from '@app/utils/orientation';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';
import { notificationService } from '../services/notifications';
import { useAppDispatch, useAppSelector } from '../store';
import { Task } from '../types';

// Memoized Individual List Cell to enforce high FlatList rendering performance
const TaskListItem = React.memo(
  ({
    task,
    onToggle,
    onDelete,
    onEdit,
    theme,
  }: {
    task: Task;
    onToggle: (task: Task) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    theme: 'light' | 'dark';
  }) => {
    const isDark = theme === 'dark';

    const getPriorityColor = (p: string) => {
      switch (p) {
        case 'high':
          return '#ef4444';
        case 'medium':
          return '#f59e0b';
        default:
          return '#10b981';
      }
    };

    const getSyncIndicator = (status: string) => {
      switch (status) {
        case 'synced':
          return '☁️'; // Synced to Cloud
        case 'pending_create':
          return '➕ ⏳'; // Pending create offline
        case 'pending_update':
          return '✏️ ⏳'; // Pending update offline
        case 'pending_delete':
          return '❌ ⏳'; // Pending delete offline
        default:
          return '';
      }
    };

    const handleToggle = () => onToggle(task);
    const handleEdit = () => onEdit(task.id);
    const handleDelete = () => onDelete(task.id);

    return (
      <SafeAreaView
        style={[
          styles.taskCard,
          { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
          !isDark && styles.taskCardLightShadow,
        ]}
      >
        <TouchableOpacity onPress={handleToggle} style={styles.checkboxContainer}>
          <View
            style={[
              styles.checkbox,
              { borderColor: isDark ? '#64748b' : '#cbd5e1' },
              task.isCompleted && styles.checkboxChecked,
            ]}
          >
            {task.isCompleted && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleEdit} style={styles.taskDetails}>
          <View style={styles.taskTitleRow}>
            <Text
              style={[
                styles.taskTitle,
                { color: isDark ? '#f8fafc' : '#0f172a' },
                task.isCompleted && styles.taskTitleCompleted,
              ]}
            >
              {task.title}
            </Text>
            <Text style={styles.syncStatus}>
              {getSyncIndicator(task.syncStatus)}
            </Text>
          </View>

          {task.description ? (
            <Text
              style={[
                styles.taskDescription,
                { color: isDark ? '#94a3b8' : '#64748b' },
              ]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: isDark ? '#334155' : '#e2e8f0' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isDark ? '#f8fafc' : '#475569' },
                ]}
              >
                {task.category.toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: getPriorityColor(task.priority) + '22' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: getPriorityColor(task.priority) },
                ]}
              >
                {task.priority.toUpperCase()}
              </Text>
            </View>
            {task.dueDate ? (
              <Text
                style={[
                  styles.dueDateText,
                  { color: isDark ? '#64748b' : '#94a3b8' },
                ]}
              >
                📅 {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  },
);

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
        { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
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
          { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
        ]}
      >
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
          placeholder="Search task by title or description..."
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          value={localSearchQuery}
          onChangeText={setLocalSearchQuery}
        />
      </View>

      {/* Category Horizontal Filter Tabs */}
      <View
        style={[
          styles.filterTabs,
          {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderBottomColor: isDark ? '#334155' : '#cbd5e1',
          },
        ]}
      >
        {['all', 'work', 'personal', 'shopping', 'health'].map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.tab,
              { backgroundColor: isDark ? '#334155' : '#f1f5f9' },
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                { color: isDark ? '#94a3b8' : '#64748b' },
              ]}
            >
              No Tasks Registered.
            </Text>
            <Text
              style={[
                styles.emptySubtext,
                { color: isDark ? '#64748b' : '#94a3b8' },
              ]}
            >
              Hit "+" below to map a new task.
            </Text>
          </View>
        }
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
    backgroundColor: '#ea580c',
    paddingVertical: 6,
    alignItems: 'center',
  },
  syncBanner: {
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    alignItems: 'center',
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  syncBannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchSection: {
    padding: 16,
  },
  searchInput: {
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  tabActiveDark: {
    backgroundColor: '#38bdf8',
  },
  tabActiveLight: {
    backgroundColor: '#0ea5e9',
  },
  tabText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 88,
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
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxTick: {
    color: '#ffffff',
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
    fontSize: 15,
    fontWeight: 'bold',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
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
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
