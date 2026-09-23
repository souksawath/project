import React, { useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { Task, Resource, TaskStatus, Language } from '../types';
import { translations } from '../utils/i18n';

interface KanbanBoardProps {
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onSelectTask: (task: Task) => void;
  onAddTask: (parentId?: string | null) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  resources,
  language,
  onSelectTask,
  onAddTask,
  onUpdateStatus,
}) => {
  const t = translations[language];

  const resourceMap = useMemo(() => {
    const map = new Map<string, Resource>();
    resources.forEach((r) => map.set(r.id, r));
    return map;
  }, [resources]);

  const columns: { id: TaskStatus; title: string; color: string; icon: React.ReactNode }[] = [
    {
      id: 'not_started',
      title: t.notStarted,
      color: 'border-t-slate-400 bg-slate-50',
      icon: <Clock className="w-4 h-4 text-slate-500" />,
    },
    {
      id: 'in_progress',
      title: t.inProgress,
      color: 'border-t-blue-500 bg-blue-50/30',
      icon: <PlayCircle className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 'in_review',
      title: t.inReview,
      color: 'border-t-amber-500 bg-amber-50/30',
      icon: <PauseCircle className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'completed',
      title: t.completed,
      color: 'border-t-emerald-500 bg-emerald-50/30',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    },
    {
      id: 'blocked',
      title: t.blocked,
      color: 'border-t-rose-500 bg-rose-50/30',
      icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 h-[calc(100vh-125px)]">
      {columns.map((col) => {
        const colTasks = tasks.filter((task) => task.status === col.id);

        return (
          <div
            key={col.id}
            id={`kanban-column-${col.id}`}
            className="flex-1 min-w-[240px] max-w-xs bg-slate-100/80 border border-slate-200 rounded flex flex-col overflow-hidden shadow-2xs"
          >
            {/* Column Header */}
            <div className={`px-2.5 py-2 border-t-2 ${col.color} border-b border-slate-200 bg-white flex items-center justify-between`}>
              <div className="flex items-center space-x-1.5">
                {col.icon}
                <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{col.title}</h3>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {colTasks.length}
              </span>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 p-2 overflow-y-auto space-y-2">
              {colTasks.length === 0 ? (
                <div className="h-24 border border-dashed border-slate-200 rounded flex items-center justify-center text-[11px] text-slate-400">
                  {language === 'la' ? 'ບໍ່ມີວຽກໃນສະຖານະນີ້' : 'No tasks in this stage'}
                </div>
              ) : (
                colTasks.map((task) => {
                  const assignee = resourceMap.get(task.assigneeId);

                  return (
                    <div
                      key={task.id}
                      id={`kanban-task-${task.id}`}
                      onClick={() => onSelectTask(task)}
                      className="bg-white p-2.5 rounded border border-slate-200 hover:border-blue-400 transition-all cursor-pointer group flex flex-col space-y-1.5 shadow-2xs"
                    >
                      {/* Top: WBS & Priority */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-slate-400 font-bold">
                          {task.wbs}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        {task.name}
                      </h4>

                      {/* Dates */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Calendar className="w-2.5 h-2.5 text-slate-400" />
                        <span>{task.startDate}</span>
                        <span>→</span>
                        <span>{task.endDate}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>

                      {/* Bottom Footer: Assignee & Move Buttons */}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                        {assignee ? (
                          <div className="flex items-center gap-1.5" title={assignee.name || ''}>
                            <div
                              className="w-4 h-4 rounded-full text-[9px] text-white font-bold flex items-center justify-center shrink-0"
                              style={{ backgroundColor: assignee.avatarColor || '#3b82f6' }}
                            >
                              {(assignee.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[10px] text-slate-600 truncate max-w-[85px]">
                              {((assignee.name || '').split(' ')[0]) || 'Member'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400">Unassigned</span>
                        )}

                        {/* Quick status change dropdown */}
                        <select
                          id={`quick-status-${task.id}`}
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(task.id, e.target.value as TaskStatus);
                          }}
                          className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 outline-none"
                        >
                          <option value="not_started">⚪ {t.notStarted}</option>
                          <option value="in_progress">🔵 {t.inProgress}</option>
                          <option value="in_review">🟡 {t.inReview}</option>
                          <option value="completed">🟢 {t.completed}</option>
                          <option value="blocked">🔴 {t.blocked}</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
