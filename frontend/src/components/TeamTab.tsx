import React from 'react';
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { JiraUser } from '../store/useIssuesStore';

type Props = {
    users: JiraUser[];
    issues: any[];
};

export const TeamTab: React.FC<Props> = ({ users, issues }) => {
    const counts = new Map<string, number>();
    issues.forEach((iss: any) => {
        const a = iss.fields.assignee;
        if (a?.accountId) counts.set(a.accountId, (counts.get(a.accountId) || 0) + 1);
    });

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6">Team</Typography>
            <List>
                {users.map(u => (
                    <ListItem key={u.accountId}>
                        <ListItemText primary={u.displayName || u.accountId} secondary={`Assigned: ${counts.get(u.accountId) || 0}`} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};
