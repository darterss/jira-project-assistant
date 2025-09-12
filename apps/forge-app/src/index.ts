import Resolver from '@forge/resolver';
import { asApp, route } from '@forge/api';
import { JiraProject, JiraUser, JiraIssue, AssignResult, AutoAssignResult } from './types';

const resolver = new Resolver();

// Получить список проектов
resolver.define('getProjects', async (): Promise<JiraProject[]> => {
  const res = await asApp().requestJira(route`/rest/api/3/project/search`);
  if (!res.ok) throw new Error(`Jira API error ${res.status}: ${await res.text()}`);

  const data: { values: any[] } = await res.json();

  return data.values.map((project) => ({
    id: project.id,
    key: project.key,
    name: project.name,
  }));
});

// Получить задачи проекта
resolver.define('getIssues', async ({ payload }): Promise<{ issues: JiraIssue[] }> => {
  const { projectKey } = payload as { projectKey: string };
  const jql = `project="${projectKey}" ORDER BY created DESC`;

  const res = await asApp().requestJira(
      route`/rest/api/3/search?jql=${jql}&maxResults=1000&fields=summary,assignee,priority,duedate,status`
  );

  if (!res.ok) throw new Error(`Jira API error ${res.status}: ${await res.text()}`);

  const data: { issues: JiraIssue[] } = await res.json();
  return data;
});

// Получить пользователей проекта
resolver.define('getProjectUsers', async ({ payload }): Promise<JiraUser[]> => {
  const { projectKey } = payload as { projectKey: string };

  const res = await asApp().requestJira(
      route`/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=50`
  );

  if (!res.ok) throw new Error(`Jira API error ${res.status}: ${await res.text()}`);

  const users: JiraUser[] = await res.json();
  return users;
});

// Назначить задачу пользователю
resolver.define('assignIssue', async ({ payload }): Promise<AssignResult> => {
  const { issueKey, accountId } = payload as { issueKey: string; accountId: string };

  const res = await asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}/assignee`,
      {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      }
  );

  if (!res.ok) throw new Error(`Jira API error ${res.status}: ${await res.text()}`);

  return { success: true };
});

// Обновить приоритет задачи
resolver.define('updatePriority', async ({ payload }): Promise<AssignResult> => {
  const { issueKey, priority } = payload as { issueKey: string; priority: string };

  const res = await asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}`,
      {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { priority: { name: priority } } }),
      }
  );

  if (!res.ok) throw new Error(`Jira API error ${res.status}: ${await res.text()}`);

  return { success: true };
});

// Автоматическое распределение задач
resolver.define('autoAssign', async ({ payload }): Promise<AutoAssignResult> => {
  const { projectKey } = payload as { projectKey: string };

  const issuesRes = await asApp().requestJira(
      route`/rest/api/3/search?jql=project=${projectKey} AND assignee IS EMPTY&fields=summary,assignee&maxResults=100`
  );
  if (!issuesRes.ok) throw new Error(`Jira API error ${issuesRes.status}: ${await issuesRes.text()}`);

  const issuesData: { issues: JiraIssue[] } = await issuesRes.json();
  const issues = issuesData.issues || [];

  const usersRes = await asApp().requestJira(
      route`/rest/api/3/user/assignable/search?project=${projectKey}&maxResults=50`
  );
  if (!usersRes.ok) throw new Error(`Jira API error ${usersRes.status}: ${await usersRes.text()}`);

  const users: JiraUser[] = await usersRes.json();
  if (!users.length) return { assignedCount: 0, assignments: [] };

  const assignments: Array<{ issueKey: string; accountId: string }> = [];
  for (const issue of issues) {
    const rand = users[Math.floor(Math.random() * users.length)];
    await asApp().requestJira(
        route`/rest/api/3/issue/${issue.key}/assignee`,
        { method: 'PUT', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: rand.accountId }) }
    );
    assignments.push({ issueKey: issue.key, accountId: rand.accountId });
  }

  return { assignedCount: assignments.length, assignments };
});

export const handler = resolver.getDefinitions();
