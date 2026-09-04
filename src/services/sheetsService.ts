import { Task, Resource, TaskStatus, TaskPriority } from '../types';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  modifiedTime?: string;
}

const TASK_HEADERS = [
  'WBS',
  'Task Name',
  'Parent WBS',
  'Assignee',
  'Start Date',
  'End Date',
  'Duration (Days)',
  'Progress (%)',
  'Status',
  'Priority',
  'Notes',
];

const RESOURCE_HEADERS = [
  'Resource ID',
  'Name',
  'Role',
  'Email',
  'Capacity (Hrs/Wk)',
  'Hourly Rate',
];

/**
 * Creates a brand new Google Spreadsheet for the project with pre-formatted sheets
 */
export async function createProjectSpreadsheet(
  token: string,
  projectName: string,
  tasks: Task[],
  resources: Resource[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `${projectName} - MS Project Plan`,
      },
      sheets: [
        {
          properties: {
            title: 'Tasks & WBS',
            gridProperties: { rowCount: Math.max(100, tasks.length + 20), columnCount: 15 },
          },
        },
        {
          properties: {
            title: 'Resources',
            gridProperties: { rowCount: Math.max(50, resources.length + 10), columnCount: 10 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errorText}`);
  }

  const data = await createRes.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Now populate data into the new spreadsheet
  await syncTasksToSpreadsheet(token, spreadsheetId, tasks, resources);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Syncs tasks and resources to an existing Google Spreadsheet
 */
export async function syncTasksToSpreadsheet(
  token: string,
  spreadsheetId: string,
  tasks: Task[],
  resources: Resource[]
): Promise<void> {
  const resourceMap = new Map<string, string>();
  resources.forEach((r) => resourceMap.set(r.id, r.name));

  const taskRows: any[][] = [TASK_HEADERS];
  for (const t of tasks) {
    const assigneeName = resourceMap.get(t.assigneeId) || t.assigneeId;
    const parentTask = tasks.find((p) => p.id === t.parentId);
    const parentWbs = parentTask ? parentTask.wbs : '';

    taskRows.push([
      t.wbs,
      t.name,
      parentWbs,
      assigneeName,
      t.startDate,
      t.endDate,
      t.duration,
      t.progress,
      t.status,
      t.priority,
      t.notes || '',
    ]);
  }

  const resourceRows: any[][] = [RESOURCE_HEADERS];
  for (const r of resources) {
    resourceRows.push([
      r.id,
      r.name,
      r.role,
      r.email,
      r.capacityHoursPerWeek,
      r.hourlyRate || 0,
    ]);
  }

  // Update Tasks & WBS sheet
  const updateTasksRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Tasks & WBS'!A1:K${taskRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'Tasks & WBS'!A1:K${taskRows.length}`,
        majorDimension: 'ROWS',
        values: taskRows,
      }),
    }
  );

  // If Tasks & WBS tab doesn't exist, fall back to Sheet1
  if (!updateTasksRes.ok) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:K${taskRows.length}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `Sheet1!A1:K${taskRows.length}`,
          majorDimension: 'ROWS',
          values: taskRows,
        }),
      }
    );
  }

  // Update Resources sheet if possible
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Resources'!A1:F${resourceRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'Resources'!A1:F${resourceRows.length}`,
        majorDimension: 'ROWS',
        values: resourceRows,
      }),
    }
  ).catch((e) => console.warn('Could not write to Resources tab:', e));
}

/**
 * Reads tasks and resources from Google Spreadsheet to enable real-time collaboration
 */
export async function readTasksFromSpreadsheet(
  token: string,
  spreadsheetId: string,
  currentResources: Resource[]
): Promise<{ tasks: Task[]; resources?: Resource[] }> {
  // First attempt to read 'Tasks & WBS'
  let range = `'Tasks & WBS'!A2:K1000`;
  let res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    // Fall back to Sheet1
    range = `Sheet1!A2:K1000`;
    res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  if (!res.ok) {
    throw new Error('Failed to read tasks from Google Sheet');
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  const parsedTasks: Task[] = [];
  const wbsToIdMap = new Map<string, string>();

  // Map resources by name and ID
  const resourceNameMap = new Map<string, string>();
  currentResources.forEach((r) => {
    resourceNameMap.set(r.name.toLowerCase().trim(), r.id);
    resourceNameMap.set(r.id.toLowerCase().trim(), r.id);
  });

  // First pass: create task items
  rows.forEach((row, index) => {
    if (!row || row.length === 0 || !row[1]) return; // Skip empty rows

    const wbs = row[0]?.trim() || `${index + 1}`;
    const name = row[1]?.trim() || `Task ${index + 1}`;
    const parentWbs = row[2]?.trim() || '';
    const assigneeRaw = row[3]?.trim() || '';
    const startDate = row[4]?.trim() || new Date().toISOString().split('T')[0];
    const endDate = row[5]?.trim() || new Date().toISOString().split('T')[0];
    const duration = parseInt(row[6], 10) || 1;
    const progress = Math.min(100, Math.max(0, parseInt(row[7], 10) || 0));
    const statusRaw = (row[8]?.trim().toLowerCase() || 'not_started') as TaskStatus;
    const priorityRaw = (row[9]?.trim().toLowerCase() || 'medium') as TaskPriority;
    const notes = row[10]?.trim() || '';

    const validStatuses: TaskStatus[] = ['not_started', 'in_progress', 'in_review', 'completed', 'blocked'];
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

    const status: TaskStatus = validStatuses.includes(statusRaw) ? statusRaw : 'in_progress';
    const priority: TaskPriority = validPriorities.includes(priorityRaw) ? priorityRaw : 'medium';

    let assigneeId = currentResources[0]?.id || 'res-1';
    if (assigneeRaw) {
      const match = resourceNameMap.get(assigneeRaw.toLowerCase());
      if (match) {
        assigneeId = match;
      }
    }

    const taskId = `task-sheet-${index + 1}-${Date.now()}`;
    wbsToIdMap.set(wbs, taskId);

    parsedTasks.push({
      id: taskId,
      wbs,
      name,
      parentId: null, // Will resolve in 2nd pass
      assigneeId,
      startDate,
      endDate,
      duration,
      progress,
      status,
      priority,
      notes,
    });
  });

  // Second pass: resolve parentId from parentWbs
  rows.forEach((row, index) => {
    if (index >= parsedTasks.length) return;
    const parentWbs = row[2]?.trim();
    if (parentWbs && wbsToIdMap.has(parentWbs)) {
      parsedTasks[index].parentId = wbsToIdMap.get(parentWbs)!;
    }
  });

  return { tasks: parsedTasks };
}

/**
 * List recent spreadsheets accessible to user from Google Drive
 */
export async function listRecentSpreadsheets(token: string): Promise<SpreadsheetInfo[]> {
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,webViewLink,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    url: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
    modifiedTime: f.modifiedTime,
  }));
}
