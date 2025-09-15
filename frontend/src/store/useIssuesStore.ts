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

export type JiraProject = {
    id: string;
    key: string;
    name: string;
};

// Функция для проверки типа проекта
const isJiraProject = (item: any): item is JiraProject => {
    return item && typeof item.id === 'string' && typeof item.key === 'string' && typeof item.name === 'string';
};

// Функция для проверки массива проектов
const isJiraProjectsArray = (data: any): data is JiraProject[] => {
    return Array.isArray(data) && data.every(isJiraProject);
};

type State = {
    projects: JiraProject[];
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
                const data = await api.fetchProjects();

                // Проверяем тип данных и преобразуем
                if (isJiraProjectsArray(data)) {
                    set({ projects: data, loading: false });
                } else {
                    // Альтернативно: если API возвращает объект с массивом проектов
                    const projectsArray = Array.isArray(data) ? data : (data as any)?.values || (data as any)?.projects || [];
                    const filteredProjects = projectsArray.filter((item: any) =>
                        item && typeof item.id === 'string' && typeof item.key === 'string'
                    ).map((item: any) => ({
                        id: item.id,
                        key: item.key,
                        name: item.name || 'Unknown Project'
                    }));

                    set({ projects: filteredProjects, loading: false });
                }
            } catch (e: any) {
                set({ error: e.message || String(e), loading: false });
            }
        },

        loadIssues: async (projectKey: string) => {
            set({ loading: true, error: null, project: projectKey });
            try {
                const res = await api.fetchIssues(projectKey);

                // Преобразуем unknown в ожидаемый тип
                const issuesData = (res as any)?.issues || res;
                const issues: JiraIssue[] = Array.isArray(issuesData) ? issuesData : [];

                set({ issues, loading: false });
            } catch (e: any) {
                set({ error: e.message || String(e), loading: false });
            }
        },

        loadUsers: async (projectKey: string) => {
            set({ loading: true, error: null });
            try {
                const data = await api.fetchProjectUsers(projectKey);

                // Преобразуем unknown в ожидаемый тип
                const usersData = Array.isArray(data) ? data : [];
                const users: JiraUser[] = usersData.filter((user: any) =>
                    user && typeof user.accountId === 'string'
                ).map((user: any) => ({
                    accountId: user.accountId,
                    displayName: user.displayName || user.name || null
                }));

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
                const currentProject = get().project;
                if (currentProject) {
                    await get().loadIssues(currentProject);
                }
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