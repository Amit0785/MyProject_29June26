import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  createTaskAction,
  updateTaskAction,
} from '@app/store/slice/tasks.slice';
import { RootState } from '../store';
import { Task } from '../types';
import { notificationService } from '@app/services/notifications';

export default function TaskFormScreen({ route, navigation }: any) {
  const taskId = route.params?.taskId;
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items, theme } = useSelector((state: RootState) => state.tasks);

  const existingTask = items.find(t => t.id === taskId);
  const isDark = theme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<
    'work' | 'personal' | 'health' | 'shopping' | 'other'
  >('work');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [enableReminder, setEnableReminder] = useState(false);

  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description);
      setCategory(existingTask.category);
      setPriority(existingTask.priority);
      setDueDate(
        existingTask.dueDate ? existingTask.dueDate.substring(0, 10) : '',
      );
      setEnableReminder(true);
    }
  }, [existingTask]);

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Task Title is mandatory.');
      return;
    }

    const payload = {
      title,
      description,
      category,
      priority,
      dueDate: dueDate
        ? new Date(dueDate).toISOString()
        : new Date().toISOString(),
      userId: user?.uid || 'guest_user',
    };

    let id = taskId;

    if (existingTask) {
      dispatch(updateTaskAction({ id, updates: payload }));
    } else {
      id = 'task_' + Date.now();
      dispatch(
        createTaskAction({
          id,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...payload,
        }),
      );
    }

    // Handle Local Notification Schedule Trigger
    if (enableReminder && dueDate) {
      const authGranted = await notificationService.requestPermissions();
      if (authGranted) {
        const fullTask: Task = {
          id,
          isCompleted: existingTask?.isCompleted || false,
          createdAt: existingTask?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'synced',
          ...payload,
        };
        await notificationService.scheduleLocalTaskReminder(fullTask);
      }
    } else if (!enableReminder) {
      await notificationService.cancelTaskReminder(id);
    }

    navigation.goBack();
  };

  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0f172a' : '#f8fafc' },
      ]}
    >
      <View
        style={[
          styles.formCard,
          { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
          !isDark && styles.formCardLightShadow,
        ]}
      >
        <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          TASK TITLE *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
          placeholder="e.g. Code database sync worker"
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          DESCRIPTION / NOTES
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
          placeholder="Provide structured notes details..."
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          CATEGORY
        </Text>
        <View style={styles.optionRow}>
          {(['work', 'personal', 'health', 'shopping', 'other'] as const).map(
            cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.optionBtn,
                  { backgroundColor: isDark ? '#334155' : '#f1f5f9' },
                  category === cat && styles.optionBtnActive,
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isDark ? '#94a3b8' : '#64748b' },
                    category === cat && styles.optionTextActive,
                  ]}
                >
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          PRIORITY
        </Text>
        <View style={styles.optionRow}>
          {(['low', 'medium', 'high'] as const).map(pri => (
            <TouchableOpacity
              key={pri}
              style={[
                styles.optionBtn,
                { backgroundColor: isDark ? '#334155' : '#f1f5f9' },
                priority === pri && { backgroundColor: priorityColors[pri] },
              ]}
              onPress={() => setPriority(pri)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isDark ? '#94a3b8' : '#64748b' },
                  priority === pri && styles.optionTextActive,
                ]}
              >
                {pri.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          DUE DATE
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          value={dueDate}
          onChangeText={setDueDate}
        />

        <View
          style={[
            styles.reminderRow,
            { borderTopColor: isDark ? '#334155' : '#e2e8f0' },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: isDark ? '#94a3b8' : '#64748b', marginBottom: 0 },
            ]}
          >
            SCHEDULE PUSH REMINDER
          </Text>
          <TouchableOpacity
            style={[styles.switch, enableReminder && styles.switchOn]}
            onPress={() => setEnableReminder(!enableReminder)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.switchKnob,
                enableReminder
                  ? styles.switchKnobOn
                  : { backgroundColor: isDark ? '#94a3b8' : '#cbd5e1' },
              ]}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>SAVE TASK</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
  },
  formCardLightShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  optionBtnActive: {
    backgroundColor: '#0ea5e9',
  },
  optionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  switch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#cbd5e1',
    padding: 2,
  },
  switchOn: {
    backgroundColor: '#10b981',
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  switchKnobOn: {
    transform: [{ translateX: 22 }],
    backgroundColor: '#ffffff',
  },
  saveBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
