import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../API/api';
import { JiraUser, JiraIssue, JiraProject } from '../types/types';

const isJiraProject = (item: any): item is JiraProject =>
    !!item && typeof item.id === 'string' && typeof item.key === 'string' && typeof item.name === 'string';

const isJiraProjectsArray = (data: any): data is JiraProject[] =>
    Array.isArray(data) && data.every(isJiraProject);

type State = {
    projects: JiraProject[];
    selectedProject?: JiraProject | null;
    issues: JiraIssue[];
    users: JiraUser[];
    loading: boolean;
    error?: string | null;
    setSelectedProject: (project: JiraProject | null) => void;
    loadProjects: () => Promise<void>;
    loadIssues: (projectKey: string) => Promise<void>;
    loadUsers: (projectIdOrKey: string) => Promise<void>;
    assign: (issueKey: string, accountId: string) => Promise<void>;
    updatePriority: (issueKey: string, priority: string) => Promise<void>;
    autoAssign: (projectKey: string) => Promise<void>;
};

export const useStore = create<State>()(
    devtools((set, get) => ({
        projects: [],
        selectedProject: null,
        issues: [],
        users: [],
        loading: false,
        error: null,

        setSelectedProject: (project) => set({ selectedProject: project }),

        loadProjects: async () => {
            set({ loading: true, error: null });
            try {
                const data = await api.fetchProjects();
                // если api возвращает массив
                if (isJiraProjectsArray(data)) {
                    set({ projects: data, loading: false });
                    return;
                }
                // если api возвращает объект с values
                const arr = Array.isArray((data as any)?.values) ? (data as any).values : Array.isArray(data) ? data : [];
                const filtered: JiraProject[] = arr
                    .filter((p: any) => p && typeof p.id === 'string' && typeof p.key === 'string')
                    .map((p: any) => ({ id: p.id, key: p.key, name: p.name || p.key }));
                set({ projects: filtered, loading: false });
            } catch (e: any) {
                set({ error: e?.message || String(e), loading: false });
            }
        },

        loadIssues: async (projectKey: string) => {
            set({ loading: true, error: null });
            try {
                const res = await api.fetchIssues(projectKey);
                const issues = (res && (res as any).issues) || [];
                set({ issues, loading: false });
            } catch (e: any) {
                set({ error: e?.message || String(e), loading: false });
            }
        },

        loadUsers: async (projectIdOrKey: string) => {
            set({ loading: true, error: null });
            try {
                const users = await api.fetchProjectUsers(projectIdOrKey); // ожидает JiraUser[]
                set({ users, loading: false });
            } catch (e: any) {
                set({ error: e?.message || String(e), loading: false });
            }
        },

        assign: async (issueKey: string, accountId: string) => {
            const prev = get().issues;
            set({
                issues: prev.map((i) =>
                    i.key === issueKey ? { ...i, fields: { ...i.fields, assignee: { accountId, displayName: '...' } } } : i
                ),
            });
            try {
                await api.assignIssue(issueKey, accountId);
                const current = get().selectedProject;
                if (current?.key) {
                    await get().loadIssues(current.key);
                }
            } catch (e) {
                set({ issues: prev });
                throw e;
            }
        },

        updatePriority: async (issueKey: string, priority: string) => {
            const prev = get().issues;
            set({
                issues: prev.map((i) => (i.key === issueKey ? { ...i, fields: { ...i.fields, priority: { name: priority } } } : i)),
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
