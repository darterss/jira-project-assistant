export type JiraProject = {
    id: string;
    key: string;
    name: string;
};

export type JiraUser = {
    accountId: string;
    displayName?: string | null;
};

export type JiraIssue = {
    id: string;
    key: string;
    fields: {
        summary: string;
        assignee?: JiraUser | null;
        priority?: { name?: string } | null;
        duedate?: string | null;
        status?: { name?: string } | null;
    };
};

export type AssignResult = { success: true };

export type AutoAssignResult = { assignedCount: number; assignments: { issueKey: string; accountId: string }[] };
