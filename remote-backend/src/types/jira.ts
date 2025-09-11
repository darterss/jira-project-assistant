export type JiraUser = {
    accountId: string;
    displayName?: string | null;
    active?: boolean;
};

export type JiraPriority = {
    id?: string;
    name?: string;
};

export type JiraStatus = {
    name?: string;
};

export type JiraIssueFields = {
    summary: string;
    assignee?: JiraUser | null;
    priority?: JiraPriority | null;
    duedate?: string | null;
    status?: JiraStatus | null;
};

export type JiraIssue = {
    id: string;
    key: string;
    fields: JiraIssueFields;
};

export type JiraSearchResponse = {
    issues: JiraIssue[];
    total?: number;
    startAt?: number;
    maxResults?: number;
};
