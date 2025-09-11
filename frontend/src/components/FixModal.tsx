import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { api } from '../api';
import { JiraUser } from '../store/useIssuesStore';

type Props = {
    open: boolean;
    issueKey?: string;
    projectKey?: string;
    onClose: () => void;
    onAssigned?: () => void;
};

export const FixModal: React.FC<Props> = ({ open, issueKey, projectKey, onClose, onAssigned }) => {
    const [users, setUsers] = useState<JiraUser[]>([]);
    const [selected, setSelected] = useState<string>('');
    const [priority, setPriority] = useState<string>('Medium');
    const [mode, setMode] = useState<'assign' | 'priority'>('assign');

    useEffect(() => {
        if (open && projectKey) {
            api.fetchProjectUsers(projectKey).then((u: any) => setUsers(u)).catch(() => setUsers([]));
        }
    }, [open, projectKey]);

    const doAssign = async () => {
        if (!issueKey || !selected) return;
        await api.assignIssue(issueKey, selected);
        onAssigned && onAssigned();
        onClose();
    };

    const doPriority = async () => {
        if (!issueKey || !priority) return;
        await api.updatePriority(issueKey, priority);
        onAssigned && onAssigned();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Fix issue {issueKey}</DialogTitle>
            <DialogContent>
                <List>
                    <ListItem>
                        <ListItemText primary="Action" secondary={
                            <>
                                <Button onClick={() => setMode('assign')} variant={mode==='assign' ? 'contained' : 'outlined'} size="small">Assign</Button>
                                <Button onClick={() => setMode('priority')} style={{ marginLeft: 8 }} variant={mode==='priority' ? 'contained' : 'outlined'} size="small">Change priority</Button>
                            </>
                        } />
                    </ListItem>
                </List>

                {mode === 'assign' && (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="select-user">Assign to</InputLabel>
                        <Select labelId="select-user" value={selected} label="Assign to" onChange={(e) => setSelected(e.target.value)}>
                            {users.map(u => <MenuItem key={u.accountId} value={u.accountId}>{u.displayName || u.accountId}</MenuItem>)}
                        </Select>
                    </FormControl>
                )}

                {mode === 'priority' && (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="select-priority">Priority</InputLabel>
                        <Select labelId="select-priority" value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                            <MenuItem value="Lowest">Lowest</MenuItem>
                            <MenuItem value="Low">Low</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="High">High</MenuItem>
                            <MenuItem value="Highest">Highest</MenuItem>
                        </Select>
                    </FormControl>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                {mode === 'assign' ? <Button onClick={doAssign} variant="contained">Assign</Button> : <Button onClick={doPriority} variant="contained">Set Priority</Button>}
            </DialogActions>
        </Dialog>
    );
};
