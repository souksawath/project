import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Mail,
  Briefcase,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import { Resource, Task, Language } from '../types';
import { translations } from '../utils/i18n';

interface ResourceManagementProps {
  resources: Resource[];
  tasks: Task[];
  language: Language;
  onAddResource: () => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (resourceId: string) => void;
}

export const ResourceManagement: React.FC<ResourceManagementProps> = ({
  resources,
  tasks,
  language,
  onAddResource,
  onEditResource,
  onDeleteResource,
}) => {
  const t = translations[language];

  // Calculate workload and active tasks for each resource
  const resourceStats = useMemo(() => {
    return resources.map((resource) => {
      const assignedTasks = tasks.filter((task) => task.assigneeId === resource.id);
      const activeTasks = assignedTasks.filter(
        (task) => task.status === 'in_progress' || task.status === 'not_started' || task.status === 'in_review'
      );
      const completedTasks = assignedTasks.filter((task) => task.status === 'completed');

      // Total duration in days of active tasks
      const activeDays = activeTasks.reduce((acc, curr) => acc + curr.duration, 0);

      // Simple workload estimation (relative to a 20-working-day monthly baseline)
      const workloadPercent = Math.min(180, Math.round((activeDays / 15) * 100));

      return {
        resource,
        assignedTasks,
        activeTasks,
        completedTasks,
        activeDays,
        workloadPercent,
      };
    });
  }, [resources, tasks]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Summary KPIs */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            <span>{t.resourceView}</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {language === 'la'
              ? 'ຕິດຕາມທີມງານ, ພາລະວຽກ (Workload), ແລະ ການມອບໝາຍໜ້າວຽກໃນໂຄງການ'
              : 'Track team member assignments, capacity workload, and utilization'}
          </p>
        </div>

        <button
          id="btn-add-resource"
          onClick={onAddResource}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addResource}</span>
        </button>
      </div>

      {/* Grid of Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {resourceStats.map(({ resource, assignedTasks, activeTasks, completedTasks, activeDays, workloadPercent }) => {
          const isOverallocated = workloadPercent > 100;
          const isBalanced = workloadPercent >= 60 && workloadPercent <= 100;

          return (
            <div
              key={resource.id}
              id={`resource-card-${resource.id}`}
              className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition-all"
            >
              {/* Card Header */}
              <div className="p-3 border-b border-slate-100 flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-2xs"
                    style={{ backgroundColor: resource.avatarColor }}
                  >
                    {resource.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      {resource.name}
                    </h3>
                    <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3" />
                      <span>{resource.role}</span>
                    </p>
                  </div>
                </div>

                {/* Workload Status Pill */}
                {isOverallocated ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>{t.overallocated}</span>
                  </span>
                ) : isBalanced ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>{t.balanced}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                    <span>{t.underallocated}</span>
                  </span>
                )}
              </div>

              {/* Workload Meter */}
              <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-slate-700">
                  <span className="flex items-center gap-1 text-slate-500">
                    <TrendingUp className="w-3 h-3 text-slate-400" />
                    <span>{t.workload}</span>
                  </span>
                  <span className={`font-mono font-bold ${isOverallocated ? 'text-rose-600' : 'text-slate-800'}`}>
                    {workloadPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOverallocated
                        ? 'bg-rose-500'
                        : isBalanced
                        ? 'bg-blue-600'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, workloadPercent)}%` }}
                  />
                </div>
              </div>

              {/* Resource Attributes */}
              <div className="p-3 space-y-1.5 text-[11px] text-slate-600 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Mail className="w-3 h-3" />
                    <span>{t.email}</span>
                  </span>
                  <span className="font-mono text-slate-700 truncate max-w-[150px]">
                    {resource.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{t.capacity}</span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    {resource.capacityHoursPerWeek} hrs/wk
                  </span>
                </div>
                {resource.hourlyRate && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <DollarSign className="w-3 h-3" />
                      <span>Rate</span>
                    </span>
                    <span className="font-mono text-slate-800">
                      ${resource.hourlyRate}/hr
                    </span>
                  </div>
                )}
              </div>

              {/* Assigned Tasks Summary List */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <ListTodo className="w-3 h-3 text-blue-600" />
                      <span>{t.assignedTasksCount} ({assignedTasks.length})</span>
                    </h4>
                    <span className="text-[9px] text-emerald-600 font-semibold">
                      {completedTasks.length} {t.completed}
                    </span>
                  </div>

                  {assignedTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1.5">
                      {language === 'la' ? 'ບໍ່ມີວຽກທີ່ມອບໝາຍໃນຕອນນີ້' : 'No tasks currently assigned.'}
                    </p>
                  ) : (
                    <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {assignedTasks.map((task) => (
                        <li
                          key={task.id}
                          className="text-[10px] p-1 rounded bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-1"
                        >
                          <span className="truncate text-slate-700">
                            <span className="font-mono text-slate-400 mr-1">{task.wbs}</span>
                            {task.name}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 shrink-0">
                            {task.progress}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Edit Resource Action */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end gap-1.5">
                  <button
                    id={`btn-edit-resource-${resource.id}`}
                    onClick={() => onEditResource(resource)}
                    className="px-2 py-0.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    {t.edit}
                  </button>
                  {resources.length > 1 && (
                    <button
                      id={`btn-delete-resource-${resource.id}`}
                      onClick={() => onDeleteResource(resource.id)}
                      className="px-2 py-0.5 text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    >
                      {t.delete}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
