/* eslint-disable react-native/no-inline-styles */
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { FC } from 'react';
import { Task } from '@app/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface ITaskItemProps {
    task: Task;
    onToggle: (task: Task) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    theme: 'light' | 'dark';
}

const TaskListItem: FC<ITaskItemProps> = ({ onDelete, onEdit, onToggle, task, theme }) => {
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
};

// Memoized Individual List Cell to enforce high FlatList rendering performance

export default React.memo(TaskListItem)

const styles = StyleSheet.create({
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


});