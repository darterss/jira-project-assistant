import { invoke } from '@forge/bridge';
import {
    GetProjectsResponse,
    GetIssuesResponse,
    GetProjectUsersResponse,
    AssignIssueResponse,
    UpdatePriorityResponse,
    AutoAssignResponse
} from '../types/types';

async function invokeFromForge<T>(funcKey: string, body: any = {}): Promise<T> {
    try {
        return await invoke(funcKey, body) as T;
    } catch (err) {
        console.error('Forge invoke failed', err);
        throw err;
    }
}

export const api = {
    fetchProjects: () => invokeFromForge<GetProjectsResponse>('getProjects'),
    fetchIssues: (projectKey: string) => invokeFromForge<GetIssuesResponse>('getIssues', { projectKey }),
    fetchProjectUsers: (projectKey: string) => invokeFromForge<GetProjectUsersResponse>('getProjectUsers', { projectKey }),
    assignIssue: (issueKey: string, accountId: string) => invokeFromForge<AssignIssueResponse>('assignIssue', { issueKey, accountId }),
    updatePriority: (issueKey: string, priority: string) => invokeFromForge<UpdatePriorityResponse>('updatePriority', { issueKey, priority }),
    autoAssign: (projectKey: string) => invokeFromForge<AutoAssignResponse>('autoAssign', { projectKey }),
};

