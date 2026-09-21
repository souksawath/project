import { Task } from '../types';

/**
 * Renumbers all tasks sequentially:
 * - Root tasks become: 1.0, 2.0, 3.0, 4.0...
 * - Subtasks become: 1.1, 1.2, 1.3... or 2.1, 2.2...
 * When any item (e.g. 3.0) is deleted, remaining items automatically shift up (4.0 -> 3.0).
 */
export function renumberTasksWbs(taskList: Task[]): Task[] {
  if (!taskList || taskList.length === 0) return [];

  // Identify root tasks (tasks with no parent or whose parent does not exist in taskList)
  const taskMapById = new Map<string, Task>(taskList.map((t) => [t.id, t]));
  const rootTasks = taskList.filter((t) => !t.parentId || !taskMapById.has(t.parentId));
  const subtasksByParent = new Map<string, Task[]>();

  taskList.forEach((t) => {
    if (t.parentId && taskMapById.has(t.parentId)) {
      if (!subtasksByParent.has(t.parentId)) {
        subtasksByParent.set(t.parentId, []);
      }
      subtasksByParent.get(t.parentId)!.push(t);
    }
  });

  const updatedTaskMap = new Map<string, Task>();

  // Process root tasks in their current relative order
  rootTasks.forEach((root, rootIndex) => {
    const rootNum = rootIndex + 1;
    const newRootWbs = `${rootNum}.0`;
    const updatedRoot: Task = {
      ...root,
      wbs: newRootWbs,
      parentId: null,
    };
    updatedTaskMap.set(root.id, updatedRoot);

    // Process direct subtasks of this root
    const directSubs = subtasksByParent.get(root.id) || [];
    directSubs.forEach((sub, subIndex) => {
      const subNum = subIndex + 1;
      const newSubWbs = `${rootNum}.${subNum}`;
      const updatedSub: Task = {
        ...sub,
        wbs: newSubWbs,
      };
      updatedTaskMap.set(sub.id, updatedSub);

      // Process 3rd level sub-subtasks if any exist
      const subSubs = subtasksByParent.get(sub.id) || [];
      subSubs.forEach((ss, ssIndex) => {
        const ssNum = ssIndex + 1;
        const updatedSs: Task = {
          ...ss,
          wbs: `${newSubWbs}.${ssNum}`,
        };
        updatedTaskMap.set(ss.id, updatedSs);
      });
    });
  });

  // Preserve the original ordering of the array
  return taskList.map((t) => updatedTaskMap.get(t.id) || t);
}
