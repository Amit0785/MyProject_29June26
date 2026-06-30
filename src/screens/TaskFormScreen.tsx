/* eslint-disable react-native/no-inline-styles */
import { notificationService } from '@app/services/notifications';
import {
  createTaskAction,
  updateTaskAction,
} from '@app/store/slice/tasks.slice';
import { useFormik } from 'formik';
import React, { FC } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { shallowEqual } from 'react-redux';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '../store';
import { Task, TaskFormRouteProp } from '../types';

const validationSchema = Yup.object().shape({
  title: Yup.string().trim().required('Task Title is mandatory.'),
  description: Yup.string().nullable(),
  category: Yup.string()
    .oneOf(['work', 'personal', 'health', 'shopping', 'other'])
    .required(),
  priority: Yup.string().oneOf(['low', 'medium', 'high']).required(),
  dueDate: Yup.string()
    .nullable()
    .test('is-date', 'Due date must be in YYYY-MM-DD format', value => {
      if (!value) return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
    }),
  enableReminder: Yup.boolean().optional(),
});

const TaskFormScreen: FC<TaskFormRouteProp> = ({ route, navigation }) => {
  const taskId = route.params?.taskId;
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth, shallowEqual);
  const { items, theme } = useAppSelector(state => state.tasks, shallowEqual);

  const existingTask = items.find(t => t.id === taskId);
  const isDark = theme === 'dark';

  const formik = useFormik({
    initialValues: {
      title: existingTask?.title || '',
      description: existingTask?.description || '',
      category: existingTask?.category || 'work',
      priority: existingTask?.priority || 'medium',
      dueDate: existingTask?.dueDate
        ? existingTask.dueDate.substring(0, 10)
        : '',
      enableReminder: !!existingTask,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async values => {
      const payload = {
        title: values.title.trim(),
        description: values.description,
        category: values.category,
        priority: values.priority,
        dueDate: values.dueDate
          ? new Date(values.dueDate).toISOString()
          : new Date().toISOString(),
        userId: user?.uid || 'guest_user',
      };

      let id = taskId;

      if (existingTask) {
        dispatch(updateTaskAction({ id: id ?? '', updates: payload }));
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
      if (values.enableReminder && values.dueDate) {
        const authGranted = await notificationService.requestPermissions();
        if (authGranted) {
          const fullTask: Task = {
            id: id ?? '',
            isCompleted: existingTask?.isCompleted || false,
            createdAt: existingTask?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'synced',
            ...payload,
          };
          await notificationService.scheduleLocalTaskReminder(fullTask);
        }
      } else if (!values.enableReminder && id) {
        await notificationService.cancelTaskReminder(id);
      }

      navigation.goBack();
    },
  });

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
              borderColor:
                formik.touched.title && formik.errors.title
                  ? '#ef4444'
                  : isDark
                  ? '#334155'
                  : '#cbd5e1',
            },
          ]}
          placeholder="e.g. Code database sync worker"
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          value={formik.values.title}
          onChangeText={formik.handleChange('title')}
          onBlur={formik.handleBlur('title')}
        />
        {formik.touched.title && formik.errors.title && (
          <Text style={styles.errorText}>{formik.errors.title}</Text>
        )}

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
          value={formik.values.description}
          onChangeText={formik.handleChange('description')}
          onBlur={formik.handleBlur('description')}
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
                  formik.values.category === cat && styles.optionBtnActive,
                ]}
                onPress={() => formik.setFieldValue('category', cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isDark ? '#94a3b8' : '#64748b' },
                    formik.values.category === cat && styles.optionTextActive,
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
                formik.values.priority === pri && {
                  backgroundColor: priorityColors[pri],
                },
              ]}
              onPress={() => formik.setFieldValue('priority', pri)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isDark ? '#94a3b8' : '#64748b' },
                  formik.values.priority === pri && styles.optionTextActive,
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
              borderColor:
                formik.touched.dueDate && formik.errors.dueDate
                  ? '#ef4444'
                  : isDark
                  ? '#334155'
                  : '#cbd5e1',
            },
          ]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          value={formik.values.dueDate}
          onChangeText={formik.handleChange('dueDate')}
          onBlur={formik.handleBlur('dueDate')}
        />
        {formik.touched.dueDate && formik.errors.dueDate && (
          <Text style={styles.errorText}>{formik.errors.dueDate}</Text>
        )}

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
            style={[
              styles.switch,
              formik.values.enableReminder && styles.switchOn,
            ]}
            onPress={() =>
              formik.setFieldValue(
                'enableReminder',
                !formik.values.enableReminder,
              )
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.switchKnob,
                formik.values.enableReminder
                  ? styles.switchKnobOn
                  : { backgroundColor: isDark ? '#94a3b8' : '#cbd5e1' },
              ]}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => formik.handleSubmit()}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>SAVE TASK</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default TaskFormScreen;
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
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -16,
    marginBottom: 16,
    marginLeft: 4,
  },
});
