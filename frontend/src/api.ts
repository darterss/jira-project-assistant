import { invoke } from '@forge/bridge';

async function invokeFromForge(funcKey: string, body: any = {}) {
    try {
        return await invoke(funcKey, body);
    } catch (err) {
        console.error('Forge invoke failed', err);
        throw err;
    }
}

export const api = {
    fetchProjects: () => invokeFromForge('getProjects'),
    fetchIssues: (projectKey: string) => invokeFromForge('getIssues', { projectKey }),
    fetchProjectUsers: (projectKey: string) => invokeFromForge('getProjectUsers', { projectKey }),
    assignIssue: (issueKey: string, accountId: string) => invokeFromForge('assignIssue', { issueKey, accountId }),
    updatePriority: (issueKey: string, priority: string) => invokeFromForge('updatePriority', { issueKey, priority }),
    autoAssign: (projectKey: string) => invokeFromForge('autoAssign', { projectKey }),
};
