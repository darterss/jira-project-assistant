import React, { useMemo } from 'react';
import { Box, List, ListItem, ListItemText, Typography, LinearProgress } from '@mui/material';
import { JiraUser, JiraIssue } from '../types/types';

type Props = {
    users: JiraUser[];
    issues: JiraIssue[];
};

export const TeamTab: React.FC<Props> = ({ users, issues }) => {
    // Считаем количество задач на пользователя
    const counts = useMemo(() => {
        const map = new Map<string, number>();
        issues.forEach((iss) => {
            const a = iss.fields.assignee;
            if (a?.accountId) {
                map.set(a.accountId, (map.get(a.accountId) || 0) + 1);
            }
        });
        return map;
    }, [issues]);

    // считаем активность
    const maxAssigned = useMemo(() => {
        return users.reduce((max, u) => Math.max(max, counts.get(u.accountId) || 0), 0);
    }, [users, counts]);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Team
            </Typography>
            <List>
                {users.map((u) => {
                    const assigned = counts.get(u.accountId) || 0;
                    const activity = maxAssigned > 0 ? Math.round((assigned / maxAssigned) * 100) : 0;
                    return (
                        <ListItem key={u.accountId} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <ListItemText
                                primary={u.displayName || u.accountId}
                                secondary={`Assigned: ${assigned} | Activity: ${activity}%`}
                            />
                            <LinearProgress
                                variant="determinate"
                                value={activity}
                                sx={{ width: '100%', maxWidth: 300, mt: 1, borderRadius: 1 }}
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
};
