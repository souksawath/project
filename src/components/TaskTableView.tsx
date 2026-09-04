import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CornerDownRight,
  ArrowRight,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Task, Resource, TaskStatus, Language } from '../types';
import { translations } from '../utils/i18n';

interface TaskTableViewProps {
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onSelectTask: (task: Task) => void;
  onAddTask: (parentId?: string | null) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  resources,
  language,
  onSelectTask,
  onAddTask,
  onDeleteTask,
  onUpdateStatus,
}) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Resource map
  const resourceMap = useMemo(() => {
    const map = new Map<string, Resource>();
    resources.forEach((r) => map.set(r.id, r));
    return map;
  }, [resources]);

  // Status badges configuration in High Density styling
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
            Done
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
            In Progress
          </span>
        );
      case 'in_review':
        return (
          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
            In Review
          </span>
        );
      case 'blocked':
        return (
          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
            Blocked
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
            Pending
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">{t.urgent}</span>;
      case 'high':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700">{t.high}</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">{t.medium}</span>;
      case 'low':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-normal bg-slate-100 text-slate-500">{t.low}</span>;
    }
  };

  // Subtask count lookup
  const subtaskCountMap = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((task) => {
      if (task.parentId) {
        map.set(task.parentId, (map.get(task.parentId) || 0) + 1);
      }
    });
    return map;
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.wbs.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === 'all' || task.assigneeId === assigneeFilter;
      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [tasks, searchTerm, statusFilter, assigneeFilter]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Top Filter and Search Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2.5 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-tasks"
              type="text"
              placeholder={t.searchTasks}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.filterStatus}: {t.all}</option>
              <option value="not_started">{t.notStarted}</option>
              <option value="in_progress">{t.inProgress}</option>
              <option value="in_review">{t.inReview}</option>
              <option value="completed">{t.completed}</option>
              <option value="blocked">{t.blocked}</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5">
            <select
              id="select-assignee-filter"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.filterAssignee}: {t.all}</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Main Task Action */}
        <button
          id="btn-table-add-task"
          onClick={() => onAddTask(null)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addTask}</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase border-b border-slate-200 select-none">
              <th className="px-3 py-2 font-bold w-12 text-center">#</th>
              <th className="px-3 py-2 font-bold min-w-[240px]">{language === 'la' ? 'ຊື່ວຽກ ແລະ ໜ້າວຽກຍ່ອຍ' : 'Task & Subtasks'}</th>
              <th className="px-3 py-2 font-bold w-24">{t.subtasks}</th>
              <th className="px-3 py-2 font-bold w-32">{t.assignee}</th>
              <th className="px-3 py-2 font-bold w-24">{t.startDate}</th>
              <th className="px-3 py-2 font-bold w-24">{t.endDate}</th>
              <th className="px-3 py-2 font-bold w-16 text-center">{t.duration}</th>
              <th className="px-3 py-2 font-bold w-28">{t.progress}</th>
              <th className="px-3 py-2 font-bold w-24 text-center">{t.status}</th>
              <th className="px-3 py-2 font-bold w-16 text-center">{t.priority}</th>
              <th className="px-3 py-2 font-bold w-20 text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-700">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400">
                  {language === 'la' ? 'ບໍ່ພົບຂໍ້ມູນວຽກທີ່ຄົ້ນຫາ' : 'No tasks match current filter.'}
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => {
                const assignee = resourceMap.get(task.assigneeId);
                const isSubtask = !!task.parentId;
                const subCount = subtaskCountMap.get(task.id) || 0;

                return (
                  <tr
                    key={task.id}
                    id={`task-table-row-${task.id}`}
                    className={`border-b transition-colors ${
                      !isSubtask
                        ? 'border-slate-100 bg-slate-50/60 font-semibold text-slate-900'
                        : 'border-slate-50 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* WBS */}
                    <td className="px-3 py-2 text-center text-slate-400 font-mono text-[10px]">
                      {task.wbs}
                    </td>

                    {/* Task Name with Indentation */}
                    <td className="px-3 py-2">
                      <div
                        className={`flex items-center gap-1.5 ${
                          isSubtask ? 'pl-7 text-slate-600' : 'text-slate-900 font-bold'
                        }`}
                      >
                        {isSubtask ? (
                          <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                        ) : (
                          <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                        <span
                          onClick={() => onSelectTask(task)}
                          className="hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {task.name}
                        </span>
                      </div>
                    </td>

                    {/* Subtasks Badge & Add Subtask Button */}
                    <td className="px-3 py-2">
                      {!isSubtask ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200/80 text-slate-600">
                            {subCount} {language === 'la' ? 'ຍ່ອຍ' : 'sub'}
                          </span>
                          <button
                            id={`btn-add-subtask-${task.id}`}
                            onClick={() => onAddTask(task.id)}
                            className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title={t.addSubtask}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="px-3 py-2 text-[11px]">
                      {assignee ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-4 h-4 rounded-full text-[9px] text-white font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: assignee.avatarColor }}
                          >
                            {assignee.name.charAt(0)}
                          </div>
                          <span className="text-slate-700 truncate max-w-[110px]" title={assignee.name}>
                            {assignee.name.split(' ')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Start & End Date */}
                    <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">
                      {task.startDate}
                    </td>
                    <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">
                      {task.endDate}
                    </td>

                    {/* Duration */}
                    <td className="px-3 py-2 text-center text-slate-600 text-[11px]">
                      {task.duration}d
                    </td>

                    {/* Progress */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{task.progress}%</span>
                      </div>
                    </td>

                    {/* Status with quick selector */}
                    <td className="px-3 py-2 text-center">
                      <select
                        id={`select-status-${task.id}`}
                        value={task.status}
                        onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                        className="text-[10px] bg-transparent border-none font-semibold cursor-pointer focus:ring-0"
                      >
                        <option value="not_started">⚪ {t.notStarted}</option>
                        <option value="in_progress">🔵 {t.inProgress}</option>
                        <option value="in_review">🟡 {t.inReview}</option>
                        <option value="completed">🟢 {t.completed}</option>
                        <option value="blocked">🔴 {t.blocked}</option>
                      </select>
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-2 text-center">
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          id={`btn-edit-task-${task.id}`}
                          onClick={() => onSelectTask(task)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title={t.edit}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-delete-task-${task.id}`}
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
