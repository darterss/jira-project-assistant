import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Select, MenuItem, Button, CircularProgress, Box, Snackbar, Alert, Tabs, Tab } from '@mui/material';
import { useStore } from './store/useIssuesStore';
import { IssuesTable } from './components/IssuesTable';
import { TeamTab } from './components/TeamTab';

const App: React.FC = () => {
    const { projects, loadProjects, projects: _p, loadIssues, issues, users, loadUsers, autoAssign } = useStore();
    const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
    const [loadingAction, setLoadingAction] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (projects && projects.length > 0 && !selectedProject) {
            setSelectedProject(projects[0].key || projects[0].projectKey || projects[0].id);
        }
    }, [projects]);

    useEffect(() => {
        if (selectedProject) {
            loadIssues(selectedProject);
            loadUsers(selectedProject);
        }
    }, [selectedProject]);

    const doAutoAssign = async () => {
        if (!selectedProject) return;
        if (!confirm('Auto-assign unassigned issues to random active project members?')) return;
        setLoadingAction(true);
        try {
            await autoAssign(selectedProject);
            setMsg('Auto-assign completed');
        } catch (e: any) {
            setMsg('Auto-assign failed: ' + (e?.message || String(e)));
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ mr: 2 }}>Project Assistant</Typography>
                    <Select
                        value={selectedProject || ''}
                        onChange={(e) => setSelectedProject(String(e.target.value))}
                        sx={{ color: 'white', mr: 2, minWidth: 220 }}
                    >
                        {projects.map((p: any) => <MenuItem key={p.key || p.id} value={p.key || p.id}>{p.name || p.key}</MenuItem>)}
                    </Select>

                    <Button variant="outlined" color="inherit" onClick={doAutoAssign} disabled={loadingAction}>
                        {loadingAction ? <CircularProgress size={18} /> : 'Auto-assign unassigned'}
                    </Button>
                </Toolbar>
            </AppBar>

            <Box className="container">
                <Tabs value={tab} onChange={(e, newV) => setTab(newV)}>
                    <Tab label="Issues" />
                    <Tab label="Team" />
                </Tabs>

                {tab === 0 && <IssuesTable issues={issues} reload={() => loadIssues(selectedProject!)} projectKey={selectedProject} />}
                {tab === 1 && <TeamTab users={users} issues={issues} />}
            </Box>

            <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}>
                <Alert onClose={() => setMsg(null)} severity="info" sx={{ width: '100%' }}>{msg}</Alert>
            </Snackbar>
        </div>
    );
};

export default App;
