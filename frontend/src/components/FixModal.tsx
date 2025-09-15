import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { api } from '../API/api';
import { JiraUser } from '../types/types';

type Props = {
    open: boolean;
    issueKey?: string;
    projectKey?: string;
    onClose: () => void;
    onAssigned?: () => void;
    mode: 'assign' | 'priority';
};

export const FixModal: React.FC<Props> = ({ open, issueKey, projectKey, onClose, onAssigned, mode }) => {
    const [users, setUsers] = useState<JiraUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedPriority, setSelectedPriority] = useState<string>('Medium');
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (open && projectKey && mode === 'assign') {
            setLoadingUsers(true);
            api.fetchProjectUsers(projectKey)
                .then((u: JiraUser[]) => setUsers(u))
                .catch(() => setUsers([]))
                .finally(() => setLoadingUsers(false));
        }
    }, [open, projectKey, mode]);

    const doAssign = async () => {
        if (!issueKey || !selectedUser) return;
        await api.assignIssue(issueKey, selectedUser);
        onAssigned?.();
        onClose();
    };

    const doPriority = async () => {
        if (!issueKey || !selectedPriority) return;
        await api.updatePriority(issueKey, selectedPriority);
        onAssigned?.();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Fix issue {issueKey}</DialogTitle>
            <DialogContent>
                {mode === 'assign' && (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="select-user">Assign to</InputLabel>
                        {loadingUsers ? (
                            <CircularProgress size={24} sx={{ mt: 1 }} />
                        ) : (
                            <Select
                                labelId="select-user"
                                value={selectedUser}
                                label="Assign to"
                                onChange={(e) => setSelectedUser(e.target.value)}
                            >
                                {users.map(u => (
                                    <MenuItem key={u.accountId} value={u.accountId}>
                                        {u.displayName || u.accountId}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}
                    </FormControl>
                )}

                {mode === 'priority' && (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="select-priority">Priority</InputLabel>
                        <Select
                            labelId="select-priority"
                            value={selectedPriority}
                            label="Priority"
                            onChange={(e) => setSelectedPriority(e.target.value)}
                        >
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="High">High</MenuItem>
                        </Select>
                    </FormControl>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                {mode === 'assign' ? (
                    <Button onClick={doAssign} variant="contained" disabled={!selectedUser}>Assign</Button>
                ) : (
                    <Button onClick={doPriority} variant="contained">Set Priority</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
