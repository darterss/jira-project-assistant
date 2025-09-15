import React, { useMemo } from 'react';
import { Box, List, ListItem, ListItemText, Typography, LinearProgress } from '@mui/material';
import { JiraUser, JiraIssue } from '../store/useIssuesStore';

type Props = {
    users: JiraUser[];
    issues: JiraIssue[];
};

export const TeamTab: React.FC<Props> = ({ users, issues }) => {
    // Считаем количество задач на каждого
    const userCounts = useMemo(() => {
        const counts = new Map<string, number>();
        issues.forEach((iss) => {
            const a = iss.fields.assignee;
            if (a?.accountId) counts.set(a.accountId, (counts.get(a.accountId) || 0) + 1);
        });
        return counts;
    }, [issues]);

    // Рассчитываем активность
    const userActivity = useMemo(() => {
        const activityMap = new Map<string, number>();
        users.forEach((u) => {
            const assignedIssues = issues.filter(
                (iss) => iss.fields.assignee?.accountId === u.accountId
            );
            if (assignedIssues.length === 0) {
                activityMap.set(u.accountId, 0);
            } else {
                const activeCount = assignedIssues.filter(
                    (iss) => iss.fields.status?.name !== 'Done'
                ).length;
                activityMap.set(u.accountId, Math.round((activeCount / assignedIssues.length) * 100));
            }
        });
        return activityMap;
    }, [users, issues]);

    // Сортируем пользователей по количеству задач
    const sortedUsers = useMemo(() => {
        return [...users].sort(
            (a, b) => (userCounts.get(b.accountId) || 0) - (userCounts.get(a.accountId) || 0)
        );
    }, [users, userCounts]);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Team
            </Typography>
            <List>
                {sortedUsers.map((u) => (
                    <ListItem key={u.accountId} divider>
                        <ListItemText
                            primary={u.displayName || u.accountId}
                            secondary={`Assigned: ${userCounts.get(u.accountId) || 0}`}
                        />
                        <Box sx={{ width: 120, ml: 2 }}>
                            <Typography variant="caption" color="textSecondary">
                                Activity: {userActivity.get(u.accountId) || 0}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={userActivity.get(u.accountId) || 0}
                                sx={{ height: 10, borderRadius: 5, mt: 0.5 }}
                            />
                        </Box>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};
