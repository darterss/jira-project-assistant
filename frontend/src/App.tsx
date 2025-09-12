import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Select, MenuItem, Button, CircularProgress, Box, Snackbar, Alert, Tabs, Tab } from '@mui/material';
import { useStore } from './store/useIssuesStore';
import { IssuesTable } from './components/IssuesTable';
import { TeamTab } from './components/TeamTab';

const App: React.FC = () => {
    const {
        projects,
        loadProjects,
        loadIssues,
        issues,
        users,
        loadUsers,
        autoAssign,
        loading
    } = useStore();
    const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined);
    const [loadingAction, setLoadingAction] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (projects && projects.length > 0 && !selectedProject) {
            setSelectedProject(projects[0].key || projects[0].id);
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
                    <Typography variant="h6" sx={{mr: 2}}>Project Assistant</Typography>
                    <Select
                        value={selectedProject || ''}
                        onChange={(e) => setSelectedProject(String(e.target.value))}
                        sx={{color: 'white', mr: 2, minWidth: 220}}
                    >
                        {projects.map((p) => <MenuItem key={p.key || p.id}
                                                       value={p.key || p.id}>{p.name || p.key}</MenuItem>)}
                    </Select>

                    <Button variant="outlined" color="inherit" onClick={doAutoAssign} disabled={loadingAction}>
                        {loadingAction ? <CircularProgress size={18}/> : 'Auto-assign unassigned'}
                    </Button>
                </Toolbar>
            </AppBar>

            {/*// Общая статистика*/}
            <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2">
                    Total issues:{' '}
                    {loading ? <CircularProgress size={14} /> : issues.length}
                </Typography>
                <Typography variant="body2">
                    Assigned:{' '}
                    {loading ? <CircularProgress size={14} /> : issues.filter(i => i.fields.assignee).length}
                    {' / '}
                    Unassigned:{' '}
                    {loading ? <CircularProgress size={14} /> : issues.filter(i => !i.fields.assignee).length}
                </Typography>
                <Typography variant="body2">
                    High priority:{' '}
                    {loading ? <CircularProgress size={14} /> : issues.filter(i => i.fields.priority?.name === 'High').length}
                    , Medium priority:{' '}
                    {loading ? <CircularProgress size={14} /> : issues.filter(i => i.fields.priority?.name === 'Medium').length}
                    , Low/Lowest priority:{' '}
                    {loading ? <CircularProgress size={14} /> : issues.filter(i => i.fields.priority?.name === 'Low' || i.fields.priority?.name === 'Lowest').length}
                </Typography>
            </Box>


            <Box className="container">
                <Tabs value={tab} onChange={(e, newV) => setTab(newV)}>
                    <Tab label="Issues"/>
                    <Tab label="Team"/>
                </Tabs>

                {tab === 0 && <IssuesTable
                    loading={loading}
                    issues={issues} reload={() => loadIssues(selectedProject!)}
                    projectKey={selectedProject}
                />}
                {tab === 1 && <TeamTab users={users} issues={issues}/>}
            </Box>

            <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}>
                <Alert onClose={() => setMsg(null)} severity="info" sx={{width: '100%'}}>{msg}</Alert>
            </Snackbar>
        </div>
    );
};

export default App;
