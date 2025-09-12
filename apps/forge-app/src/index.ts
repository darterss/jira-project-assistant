import Resolver from '@forge/resolver';
import api, { fetch } from '@forge/api';

const resolver = new Resolver();

async function jiraRequest(path: string, options?: RequestInit) {
  const url = `/rest/api/3${path}`;
console.log('url!!!!!!!!!!!!!!!!!!!!!!: ', url)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };

  const reqInit: any = {
    ...options,
    headers,
  };

  const res = await fetch(url, reqInit);
  return res.json();
}


/** === HANDLERS === */

resolver.define('getProjects', async () => {
  const logs: string[] = [];
  logs.push('getProjects invoked!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

  const res = await jiraRequest('/project/search');
  logs.push(`jira response length: ${res.values?.length || 0}`);

  return { data: res.values, logs }; // логи в браузер
});


resolver.define('getIssues', async (req) => {
  const { projectKey } = req.payload as { projectKey: string };
  const jql = `project=${projectKey}`;
  const res = await jiraRequest(
      `/search?jql=${encodeURIComponent(jql)}&maxResults=1000&fields=summary,assignee,priority,duedate,status`
  );
  return res;
});

resolver.define('getProjectUsers', async (req) => {
  const { projectKey } = req.payload as { projectKey: string };
  return jiraRequest(`/user/assignable/search?project=${projectKey}&maxResults=50`);
});

resolver.define('assignIssue', async (req) => {
  const { issueKey, accountId } = req.payload as { issueKey: string; accountId: string };
  return jiraRequest(`/issue/${issueKey}/assignee`, {
    method: 'PUT',
    body: JSON.stringify({ accountId }),
  });
});

resolver.define('updatePriority', async (req) => {
  const { issueKey, priority } = req.payload as { issueKey: string; priority: string };
  return jiraRequest(`/issue/${issueKey}`, {
    method: 'PUT',
    body: JSON.stringify({ fields: { priority: { name: priority } } }),
  });
});

resolver.define('autoAssign', async (req) => {
  const { projectKey } = req.payload as { projectKey: string };

  const issuesRes = await jiraRequest(
      `/search?jql=${encodeURIComponent(`project=${projectKey} AND assignee IS EMPTY`)}&fields=summary,assignee&maxResults=100`
  );
  const issues = issuesRes.issues || [];
  const users = await jiraRequest(`/user/assignable/search?project=${projectKey}&maxResults=50`);
  if (!users.length) return { assignedCount: 0, assignments: [] };

  const assignments = [];
  for (const issue of issues) {
    const rand = users[Math.floor(Math.random() * users.length)];
    await jiraRequest(`/issue/${issue.key}/assignee`, {
      method: 'PUT',
      body: JSON.stringify({ accountId: rand.accountId }),
    });
    assignments.push({ issueKey: issue.key, accountId: rand.accountId });
  }
  return { assignedCount: assignments.length, assignments };
});

export const handler = resolver.getDefinitions();
