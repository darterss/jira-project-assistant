type InvokeParams = { key: string; payload?: any };

async function tryGetInvoke() {
    try {
        const mod = await import('@forge/bridge');
        return mod.invoke as (key: string, payload?: any) => Promise<any>;
    } catch {
        return null;
    }
}

/**
 * Универсальный вызов: Forge invoke или локальный fetch
 */
async function invokeOrFetch(path: string, opts: { method?: string; body?: any } = {}) {
    const invoke = await tryGetInvoke();
    if (invoke) {
        // Преобразуем path в ключ функции Forge
        // Например: "/api/projects" -> "getProjects"
        let key: string;
        switch (path) {
            case '/api/projects':
                key = 'getProjects';
                break;
            default:
                key = path.replace(/^\/api\//, '').replace(/\//g, '_');
                break;
        }
        const res = await invoke(key, opts.body);
        return res?.body ?? res;
    } else {
        // fallback на локальный бекенд
        const base = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
        const url = `${base}${path}`;
        const resp = await fetch(url, {
            method: opts.method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: opts.body ? JSON.stringify(opts.body) : undefined,
        });
        if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(txt || resp.statusText);
        }
        return await resp.json();
    }
}

/**
 * API
 */
export const api = {
    fetchProjects: () => invokeOrFetch('/api/projects'),
    fetchIssues: (projectKey: string) =>
        invokeOrFetch(`/api/projects/${encodeURIComponent(projectKey)}/issues`),
    fetchProjectUsers: (projectKey: string) =>
        invokeOrFetch(`/api/projects/${encodeURIComponent(projectKey)}/users`),
    assignIssue: (issueKey: string, accountId: string) =>
        invokeOrFetch(`/api/issues/${encodeURIComponent(issueKey)}/assign`, {
            method: 'POST',
            body: { accountId },
        }),
    updatePriority: (issueKey: string, priority: string) =>
        invokeOrFetch(`/api/issues/${encodeURIComponent(issueKey)}/priority`, {
            method: 'PUT',
            body: { priority },
        }),
    autoAssign: (projectKey: string) =>
        invokeOrFetch(`/api/auto-assign?project=${encodeURIComponent(projectKey)}`, {
            method: 'POST',
        }),
};
