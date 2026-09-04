import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { Task, Resource, Language } from '../types';
import { translations } from '../utils/i18n';

interface ProjectAnalyticsProps {
  tasks: Task[];
  resources: Resource[];
  language: Language;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  tasks,
  resources,
  language,
}) => {
  const t = translations[language];

  // Overall Statistics Calculation
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;
    const notStartedTasks = tasks.filter((t) => t.status === 'not_started').length;

    const overallProgress =
      totalTasks > 0
        ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks)
        : 0;

    // Top-level Phases
    const phases = tasks.filter((t) => !t.parentId);
    const phaseStats = phases.map((phase) => {
      const childTasks = tasks.filter((t) => t.parentId === phase.id);
      const totalPhaseTasks = childTasks.length + 1;
      const phaseProgress =
        totalPhaseTasks > 1
          ? Math.round(
              (phase.progress + childTasks.reduce((acc, c) => acc + c.progress, 0)) /
                totalPhaseTasks
            )
          : phase.progress;

      return {
        phase,
        childCount: childTasks.length,
        progress: phaseProgress,
      };
    });

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      notStartedTasks,
      overallProgress,
      phaseStats,
    };
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Overall Completion */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {language === 'la' ? 'ຄວາມຄືບໜ້າລວມ' : 'Overall Progress'}
            </p>
            <h3 className="text-xl font-black text-blue-600 mt-0.5">{stats.overallProgress}%</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {stats.completedTasks} of {stats.totalTasks} {language === 'la' ? 'ວຽກສຳເລັດ' : 'tasks done'}
            </p>
          </div>
          <div className="w-9 h-9 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t.completed}
            </p>
            <h3 className="text-xl font-black text-emerald-600 mt-0.5">{stats.completedTasks}</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completion
            </p>
          </div>
          <div className="w-9 h-9 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t.inProgress}
            </p>
            <h3 className="text-xl font-black text-amber-600 mt-0.5">{stats.inProgressTasks}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Active tasks right now</p>
          </div>
          <div className="w-9 h-9 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Blocked or Delayed */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t.blocked}
            </p>
            <h3 className="text-xl font-black text-rose-600 mt-0.5">{stats.blockedTasks}</h3>
            <p className="text-[10px] text-rose-500 mt-0.5">Needs immediate review</p>
          </div>
          <div className="w-9 h-9 rounded bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Breakdown by Phases (WBS) */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-tight">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>{language === 'la' ? 'ຄວາມຄືບໜ້າແຍກຕາມໄລຍະວຽກ (Phase Progress)' : 'Progress by Phase'}</span>
        </h3>

        <div className="space-y-2.5">
          {stats.phaseStats.map(({ phase, childCount, progress }) => (
            <div key={phase.id} className="p-2.5 bg-slate-50 rounded border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1 font-medium text-slate-800">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="font-mono text-blue-600 text-[11px] font-bold">{phase.wbs}</span>
                  <span className="truncate text-xs font-semibold">{phase.name}</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    ({childCount} {t.subtasks})
                  </span>
                </span>
                <span className="font-mono font-bold text-slate-700 text-xs">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Allocation Distribution */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-tight">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'la' ? 'ການແບ່ງປັນວຽກໃນທີມງານ' : 'Resource Allocation Distribution'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {resources.map((r) => {
            const assigned = tasks.filter((t) => t.assigneeId === r.id);
            const completed = assigned.filter((t) => t.status === 'completed').length;

            return (
              <div key={r.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded text-white font-bold text-xs flex items-center justify-center shrink-0"
                  style={{ backgroundColor: r.avatarColor }}
                >
                  {r.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <h4 className="font-bold text-slate-900 truncate text-[11px]">{r.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{r.role}</p>
                  <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                    {assigned.length} tasks ({completed} done)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
