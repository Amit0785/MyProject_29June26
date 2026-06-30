/* eslint-disable react-native/no-inline-styles */
import { CButton, TextInputComponent } from '@app/components';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { shallowEqual } from 'react-redux';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '../store';
import { Task, TaskFormRouteProp } from '../types';
import { goBack } from '@app/navigation/RootNavigation';
import { Colors } from '@app/themes';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '@app/utils/orientation';

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

const TaskFormScreen: FC<TaskFormRouteProp> = ({ route }) => {
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

      goBack();
    },
  });

  const priorityColors = {
    low: Colors.success,
    medium: '#f59e0b',
    high: '#ef4444',
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? Colors.slate900 : Colors.slate50 },
      ]}
    >
      <View
        style={[
          styles.formCard,
          { backgroundColor: isDark ? Colors.slate800 : Colors.white },
          !isDark && styles.formCardLightShadow,
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: isDark ? Colors.slate400 : Colors.slate500 },
          ]}
        >
          TASK TITLE *
        </Text>
        <TextInputComponent
          placeholder="e.g. Code database sync worker"
          placeholderTextColor={isDark ? Colors.slate500 : Colors.slate400}
          value={formik.values.title}
          onChangeText={formik.handleChange('title')}
          onBlur={formik.handleBlur('title')}
          keyboardType="default"
          error={formik.touched.title && formik.errors.title}
          style={{ color: isDark ? Colors.white : Colors.slate900 }}
          containerStyles={{ marginTop: 0, marginBottom: 20 }}
          inputContainerStyle={{
            backgroundColor: isDark ? Colors.slate900 : Colors.slate100,
            borderColor: isDark ? Colors.slate700 : Colors.slate300,
          }}
        />

        <Text
          style={[
            styles.label,
            { color: isDark ? Colors.slate400 : Colors.slate500 },
          ]}
        >
          DESCRIPTION / NOTES
        </Text>
        <TextInputComponent
          placeholder="Provide structured notes details..."
          placeholderTextColor={isDark ? Colors.slate500 : Colors.slate400}
          value={formik.values.description}
          onChangeText={formik.handleChange('description')}
          onBlur={formik.handleBlur('description')}
          keyboardType="default"
          multiline
          style={{ color: isDark ? Colors.white : Colors.slate900 }}
          containerStyles={{ marginTop: 0, marginBottom: 20 }}
          inputContainerStyle={{
            backgroundColor: isDark ? Colors.slate900 : Colors.slate100,
            borderColor: isDark ? Colors.slate700 : Colors.slate300,
          }}
        />

        <Text
          style={[
            styles.label,
            { color: isDark ? Colors.slate400 : Colors.slate500 },
          ]}
        >
          CATEGORY
        </Text>
        <View style={styles.optionRow}>
          {(['work', 'personal', 'health', 'shopping', 'other'] as const).map(
            cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: isDark ? Colors.slate700 : Colors.slate100,
                  },
                  formik.values.category === cat && styles.optionBtnActive,
                ]}
                onPress={() => formik.setFieldValue('category', cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isDark ? Colors.slate400 : Colors.slate500 },
                    formik.values.category === cat && styles.optionTextActive,
                  ]}
                >
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        <Text
          style={[
            styles.label,
            { color: isDark ? Colors.slate400 : Colors.slate500 },
          ]}
        >
          PRIORITY
        </Text>
        <View style={styles.optionRow}>
          {(['low', 'medium', 'high'] as const).map(pri => (
            <TouchableOpacity
              key={pri}
              style={[
                styles.optionBtn,
                { backgroundColor: isDark ? Colors.slate700 : Colors.slate100 },
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
                  { color: isDark ? Colors.slate400 : Colors.slate500 },
                  formik.values.priority === pri && styles.optionTextActive,
                ]}
              >
                {pri.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={[
            styles.label,
            { color: isDark ? Colors.slate400 : Colors.slate500 },
          ]}
        >
          DUE DATE
        </Text>
        <TextInputComponent
          placeholder="YYYY-MM-DD"
          placeholderTextColor={isDark ? Colors.slate500 : Colors.slate400}
          value={formik.values.dueDate}
          onChangeText={formik.handleChange('dueDate')}
          onBlur={formik.handleBlur('dueDate')}
          keyboardType="default"
          error={formik.touched.dueDate && formik.errors.dueDate}
          style={{ color: isDark ? Colors.white : Colors.slate900 }}
          containerStyles={{ marginTop: 0, marginBottom: 20 }}
          inputContainerStyle={{
            backgroundColor: isDark ? Colors.slate900 : Colors.slate100,
            borderColor: isDark ? Colors.slate700 : Colors.slate300,
          }}
        />

        <View
          style={[
            styles.reminderRow,
            { borderTopColor: isDark ? Colors.slate700 : Colors.slate200 },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: isDark ? Colors.slate400 : Colors.slate500,
                marginBottom: 0,
              },
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
                  : {
                      backgroundColor: isDark
                        ? Colors.slate400
                        : Colors.slate300,
                    },
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

        <CButton onPress={formik.handleSubmit} buttonText={'SAVE TASK'} />
      </View>
    </ScrollView>
  );
};

export default TaskFormScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(16),
  },
  formCard: {
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: verticalScale(40),
  },
  formCardLightShadow: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(10),
    elevation: 3,
  },
  label: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    marginBottom: verticalScale(8),
    letterSpacing: 1,
  },
  input: {
    borderRadius: moderateScale(8),
    borderWidth: 1,
    paddingHorizontal: horizontalScale(16),
    height: verticalScale(48),
    fontSize: moderateScale(14),
    marginBottom: verticalScale(20),
  },
  textArea: {
    height: verticalScale(100),
    paddingTop: verticalScale(12),
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: verticalScale(20),
  },
  optionBtn: {
    paddingHorizontal: horizontalScale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    marginRight: horizontalScale(8),
    marginBottom: verticalScale(8),
  },
  optionBtnActive: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  optionTextActive: {
    color: Colors.white,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(30),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
  },
  switch: {
    width: moderateScale(48),
    height: verticalScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: Colors.slate300,
    padding: moderateScale(2),
  },
  switchOn: {
    backgroundColor: Colors.success,
  },
  switchKnob: {
    width: moderateScale(22),
    height: verticalScale(22),
    borderRadius: moderateScale(11),
  },
  switchKnobOn: {
    transform: [{ translateX: horizontalScale(22) }],
    backgroundColor: Colors.white,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: moderateScale(8),
    height: verticalScale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  errorText: {
    color: Colors.red,
    fontSize: moderateScale(12),
    marginTop: -verticalScale(16),
    marginBottom: verticalScale(16),
    marginLeft: horizontalScale(4),
  },
});
