import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Version2Client } from 'jira.js';

const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);

dotenv.config({ path: envPath });
console.log('JIRA_EMAIL after dotenv:', process.env.JIRA_EMAIL);
console.log('JIRA_API_TOKEN after dotenv:', process.env.JIRA_API_TOKEN?.slice(0, 10));

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 4000;

const jira = new Version2Client({
    host: process.env.JIRA_BASE_URL || 'https://your-domain.atlassian.net',
    authentication: {
        basic: {
            email: process.env.JIRA_EMAIL!,
            apiToken: process.env.JIRA_API_TOKEN!,
        },
    },
});

/** Routes */

// GET /api/projects
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await jira.projects.searchProjects({});
        console.log(projects.values);
        res.json(projects.values);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message || 'failed to fetch projects' });
    }
});

// GET /api/projects/:projectKey/issues
app.get('/api/projects/:projectKey/issues', async (req, res) => {
    const projectKey = req.params.projectKey;
    try {
        const issues = await jira.issueSearch.searchForIssuesUsingJql({
            jql: `project=${projectKey}`,
            fields: ['summary', 'assignee', 'priority', 'duedate', 'status'],
            maxResults: 1000,
        });
        res.json(issues);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message || 'failed to fetch issues' });
    }
});

// GET /api/projects/:projectKey/users
app.get('/api/projects/:projectKey/users', async (req, res) => {
    const projectKey = req.params.projectKey;
    try {
        const users = await jira.userSearch.findAssignableUsers({
            project: projectKey,
            maxResults: 50,
        });
        res.json(users);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message || 'failed to fetch users' });
    }
});

// POST /api/issues/:issueKey/assign
app.post('/api/issues/:issueKey/assign', async (req, res) => {
    const issueKey = req.params.issueKey;
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    try {
        await jira.issues.assignIssue({ issueIdOrKey: issueKey, accountId });
        res.json({ ok: true });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message || 'failed to assign' });
    }
});

// PUT /api/issues/:issueKey/priority
app.put('/api/issues/:issueKey/priority', async (req, res) => {
    const issueKey = req.params.issueKey;
    const { priority } = req.body;
    if (!priority) return res.status(400).json({ error: 'priority required' });

    try {
        await jira.issues.editIssue({
            issueIdOrKey: issueKey,
            fields: { priority: { name: priority } },
        });
        res.json({ ok: true });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message || 'failed to update priority' });
    }
});

// POST /api/auto-assign?project=KEY
app.post('/api/auto-assign', async (req, res) => {
    const projectKey = req.query.project as string;
    if (!projectKey) return res.status(400).json({ error: 'project query required' });

    try {
        const searchRes = await jira.issueSearch.searchForIssuesUsingJql({
            jql: `project=${projectKey} AND assignee IS EMPTY`,
            fields: ['summary', 'assignee'],
            maxResults: 100,
        });

        const issues = searchRes.issues || [];
        const users = await jira.userSearch.findAssignableUsers({
            project: projectKey,
            maxResults: 50,
        });

        if (!users.length) return res.status(400).json({ error: 'no assignable users' });

        const assignments: Array<{ issueKey: string; accountId: string }> = [];
        for (const issue of issues) {
            const rand = users[Math.floor(Math.random() * users.length)];
            await jira.issues.assignIssue({ issueIdOrKey: issue.key, accountId: rand.accountId! });
            assignments.push({ issueKey: issue.key, accountId: rand.accountId! });
        }

        res.json({ ok: true, assignedCount: assignments.length, assignments });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message || 'auto assign failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Remote backend listening on port ${PORT}`);
});
