export type JiraUser = {
    accountId: string;
    displayName?: string | null;
};

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

// API-ответы
export type GetProjectsResponse = JiraProject[];
export type GetIssuesResponse = { issues: JiraIssue[] };
export type GetProjectUsersResponse = JiraUser[];
export type AssignIssueResponse = { success: true };
export type UpdatePriorityResponse = { success: true };
export type AutoAssignResponse = { assignedCount: number; assignments: { issueKey: string; accountId: string }[] };
