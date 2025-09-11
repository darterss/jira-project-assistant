import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../api';

export type JiraUser = { accountId: string; displayName?: string | null };
export type JiraPriority = { name?: string };
export type JiraStatus = { name?: string };

export type JiraIssue = {
    id: string;
    key: string;
    fields: {
        summary: string;
        assignee?: JiraUser | null;
        priority?: JiraPriority | null;
        duedate?: string | null;
        status?: JiraStatus | null;
    };
};

type State = {
    projects: any[];
    project?: string | null;
    issues: JiraIssue[];
    users: JiraUser[];
    loading: boolean;
    error?: string | null;
    loadProjects: () => Promise<void>;
    loadIssues: (projectKey: string) => Promise<void>;
    loadUsers: (projectKey: string) => Promise<void>;
    assign: (issueKey: string, accountId: string) => Promise<void>;
    updatePriority: (issueKey: string, priority: string) => Promise<void>;
    autoAssign: (projectKey: string) => Promise<void>;
};

export const useStore = create<State>()(
    devtools((set, get) => ({
        projects: [],
        project: null,
        issues: [],
        users: [],
        loading: false,
        error: null,

        loadProjects: async () => {
            set({ loading: true, error: null });
            try {
                const projects = await api.fetchProjects();
                set({ projects, loading: false });
            } catch (e: any) {
                set({ error: e.message || String(e), loading: false });
            }
        },

        loadIssues: async (projectKey: string) => {
            set({ loading: true, error: null, project: projectKey });
            try {
                const res = await api.fetchIssues(projectKey);
                const issues = res.issues ?? res;
                set({ issues, loading: false });
            } catch (e: any) {
                set({ error: e.message || String(e), loading: false });
            }
        },

        loadUsers: async (projectKey: string) => {
            set({ loading: true, error: null });
            try {
                const users = await api.fetchProjectUsers(projectKey);
                set({ users, loading: false });
            } catch (e: any) {
                set({ error: e.message || String(e), loading: false });
            }
        },

        assign: async (issueKey: string, accountId: string) => {
            const prev = get().issues;
            // оптимистичное обновление
            set({
                issues: prev.map((i) =>
                    i.key === issueKey
                        ? { ...i, fields: { ...i.fields, assignee: { accountId, displayName: '...' } } }
                        : i
                ),
            });
            try {
                await api.assignIssue(issueKey, accountId);
                await get().loadIssues(get().project!);
            } catch (e) {
                // откат
                set({ issues: prev });
                throw e;
            }
        },

        updatePriority: async (issueKey: string, priority: string) => {
            const prev = get().issues;
            set({
                issues: prev.map((i) =>
                    i.key === issueKey ? { ...i, fields: { ...i.fields, priority: { name: priority } } } : i
                ),
            });
            try {
                await api.updatePriority(issueKey, priority);
            } catch (e) {
                set({ issues: prev });
                throw e;
            }
        },

        autoAssign: async (projectKey: string) => {
            try {
                await api.autoAssign(projectKey);
                await get().loadIssues(projectKey);
            } catch (e) {
                throw e;
            }
        },
    }))
);
