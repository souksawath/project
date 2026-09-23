import React, { useState, useMemo, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar as CalendarIcon,
  User,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Task, Resource, ZoomLevel, Language } from '../types';
import { translations } from '../utils/i18n';

interface GanttChartProps {
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onSelectTask: (task: Task) => void;
  onAddTask: (parentId?: string | null) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  resources,
  language,
  onSelectTask,
  onAddTask,
}) => {
  const t = translations[language];
  const [zoom, setZoom] = useState<ZoomLevel>('day');
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Map resource for quick lookup
  const resourceMap = useMemo(() => {
    const map = new Map<string, Resource>();
    resources.forEach((r) => map.set(r.id, r));
    return map;
  }, [resources]);

  // Identify parent tasks
  const parentTaskIds = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((task) => {
      if (task.parentId) {
        ids.add(task.parentId);
      }
    });
    return ids;
  }, [tasks]);

  // Toggle parent collapse
  const toggleCollapse = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedParents((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Filter visible tasks respecting collapsed parent states
  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.parentId) return true;
      let currentParentId = task.parentId;
      while (currentParentId) {
        if (collapsedParents.has(currentParentId)) return false;
        const parent = tasks.find((t) => t.id === currentParentId);
        currentParentId = parent?.parentId || null;
      }
      return true;
    });
  }, [tasks, collapsedParents]);

  // Compute timeline boundaries
  const { minDate, maxDate, totalDays, datesList } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseValidDate = (dateVal: any, fallback: Date): Date => {
      if (!dateVal) return fallback;
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? fallback : d;
    };

    if (!Array.isArray(tasks) || tasks.length === 0) {
      const minD = new Date(today.getFullYear(), today.getMonth(), 1);
      const maxD = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const diff = Math.min(60, Math.max(15, Math.ceil((maxD.getTime() - minD.getTime()) / (1000 * 60 * 60 * 24)) + 1));
      const list: Date[] = [];
      for (let i = 0; i < diff; i++) {
        const d = new Date(minD);
        d.setDate(minD.getDate() + i);
        list.push(d);
      }
      return { minDate: minD, maxDate: maxD, totalDays: diff, datesList: list };
    }

    let min = today.getTime();
    let max = today.getTime() + 14 * 24 * 60 * 60 * 1000;
    let initialized = false;

    tasks.forEach((task) => {
      const s = parseValidDate(task?.startDate, today).getTime();
      const e = parseValidDate(task?.endDate, today).getTime();
      if (!initialized) {
        min = Math.min(s, e);
        max = Math.max(s, e);
        initialized = true;
      } else {
        if (s < min) min = s;
        if (e < min) min = e;
        if (s > max) max = s;
        if (e > max) max = e;
      }
    });

    // Add padding days
    const minD = new Date(min);
    minD.setDate(minD.getDate() - 3);
    const maxD = new Date(max);
    maxD.setDate(maxD.getDate() + 10);

    // Guard against negative diff or huge diff (cap at 365 to prevent memory crash)
    let diffDays = Math.ceil((maxD.getTime() - minD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (isNaN(diffDays) || diffDays < 7) diffDays = 30;
    if (diffDays > 365) diffDays = 365;

    const list: Date[] = [];
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(minD);
      d.setDate(minD.getDate() + i);
      list.push(d);
    }

    return {
      minDate: minD,
      maxDate: maxD,
      totalDays: diffDays,
      datesList: list,
    };
  }, [tasks]);

  // Cell width in pixels based on zoom level
  const dayWidth = zoom === 'day' ? 36 : zoom === 'week' ? 16 : 8;
  const totalTimelineWidth = totalDays * dayWidth;

  // Helper to calculate X coordinate for date
  const getXForDate = (dateStr: string): number => {
    if (!dateStr || !minDate) return 0;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    const diff = (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    if (isNaN(diff)) return 0;
    return Math.max(0, diff * dayWidth);
  };

  // Helper to calculate bar width
  const getWidthForTask = (startDateStr: string, endDateStr: string, durationDays: number): number => {
    const s = new Date(startDateStr);
    const e = new Date(endDateStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) {
      return Math.max(dayWidth * 0.8, (durationDays || 1) * dayWidth);
    }
    const diffDays = Math.max(1, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24) + 1);
    if (isNaN(diffDays)) {
      return Math.max(dayWidth * 0.8, (durationDays || 1) * dayWidth);
    }
    return Math.max(dayWidth * 0.8, diffDays * dayWidth);
  };

  // Today marker position
  const todayX = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!minDate || isNaN(minDate.getTime())) return 0;
    const diff = (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    if (isNaN(diff)) return 0;
    return diff * dayWidth;
  }, [minDate, dayWidth]);

  // Scroll to today marker
  const scrollToToday = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = Math.max(0, todayX - 200);
    }
  };

  // Helper: Month headers grouping
  const monthHeaders = useMemo(() => {
    const months: { label: string; width: number; startIdx: number }[] = [];
    if (datesList.length === 0) return months;

    let currentMonth = datesList[0].getMonth();
    let currentYear = datesList[0].getFullYear();
    let count = 0;
    let startIdx = 0;

    datesList.forEach((d, idx) => {
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        count++;
      } else {
        const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString(
          language === 'la' ? 'lo-LA' : 'en-US',
          { month: 'short', year: 'numeric' }
        );
        months.push({ label: monthName, width: count * dayWidth, startIdx });
        currentMonth = d.getMonth();
        currentYear = d.getFullYear();
        startIdx = idx;
        count = 1;
      }
    });

    const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString(
      language === 'la' ? 'lo-LA' : 'en-US',
      { month: 'short', year: 'numeric' }
    );
    months.push({ label: monthName, width: count * dayWidth, startIdx });

    return months;
  }, [datesList, dayWidth, language]);

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Top Toolbar: Zoom and Actions */}
      <div className="h-10 px-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {language === 'la' ? 'ມຸມມອງເວລາ' : 'Zoom'}:
          </span>
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-100">
            <button
              id="zoom-btn-day"
              onClick={() => setZoom('day')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                zoom === 'day' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.zoomDay}
            </button>
            <button
              id="zoom-btn-week"
              onClick={() => setZoom('week')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                zoom === 'week' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.zoomWeek}
            </button>
            <button
              id="zoom-btn-month"
              onClick={() => setZoom('month')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                zoom === 'month' ? 'bg-white text-blue-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.zoomMonth}
            </button>
          </div>

          <button
            id="btn-goto-today"
            onClick={scrollToToday}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            <CalendarIcon className="w-3 h-3 text-blue-600" />
            <span>{t.today}</span>
          </button>
        </div>

        {/* Legend & Add Task */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 rounded bg-slate-800" />
              <span>Phase</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 rounded bg-blue-500" />
              <span>{t.inProgress}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 rounded bg-emerald-500" />
              <span>{t.completed}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-rose-500 rounded-full" />
              <span>{t.today}</span>
            </span>
          </div>

          <button
            id="btn-gantt-add-task"
            onClick={() => onAddTask(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addTask}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left Tasks Column & Right Gantt Timeline */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Tasks Table List (Fixed Header & Synchronized High-Density 32px Row Height) */}
        <div className="w-[420px] lg:w-[480px] border-r border-slate-200 bg-white flex flex-col shrink-0 z-10">
          {/* Header Row */}
          <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-3 text-[10px] font-bold uppercase text-slate-400 select-none">
            <div className="w-9 text-center font-bold">#</div>
            <div className="flex-1 px-2 font-bold">{language === 'la' ? 'ຊື່ວຽກ ແລະ ໜ້າວຽກຍ່ອຍ' : 'Task & Subtasks'}</div>
            <div className="w-24 px-1 font-bold">{t.assignee}</div>
            <div className="w-20 text-center font-bold">{t.status}</div>
          </div>

          {/* Task Rows List */}
          <div className="flex-1 overflow-y-auto select-none divide-y divide-slate-100">
            {visibleTasks.map((task) => {
              const isParent = parentTaskIds.has(task.id);
              const isCollapsed = collapsedParents.has(task.id);
              const assignee = resourceMap.get(task.assigneeId);
              const indentLevel = task.parentId ? 1 : 0;

              return (
                <div
                  key={task.id}
                  id={`gantt-row-left-${task.id}`}
                  onClick={() => onSelectTask(task)}
                  className={`h-8 flex items-center px-3 text-xs transition-colors cursor-pointer group ${
                    isParent ? 'bg-slate-50/80 font-bold text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {/* WBS */}
                  <div className="w-9 text-center text-slate-400 font-mono text-[10px] truncate">
                    {task.wbs}
                  </div>

                  {/* Task Name & Chevron */}
                  <div
                    className={`flex-1 px-2 flex items-center gap-1.5 truncate ${
                      task.parentId ? 'pl-7 text-slate-500' : ''
                    }`}
                  >
                    {isParent && (
                      <button
                        onClick={(e) => toggleCollapse(task.id, e)}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-600"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    <span className="truncate group-hover:text-blue-600 transition-colors text-xs">
                      {task.name}
                    </span>
                  </div>

                  {/* Assignee */}
                  <div className="w-24 px-1 text-[11px] text-slate-600 truncate flex items-center gap-1.5">
                    {assignee ? (
                      <>
                        <div
                          className="w-4 h-4 rounded-full text-[9px] text-white font-bold flex items-center justify-center shrink-0"
                          style={{ backgroundColor: assignee.avatarColor || '#3b82f6' }}
                          title={assignee.name || ''}
                        >
                          {(assignee.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{((assignee.name || '').split(' ')[0]) || 'Member'}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="w-20 text-center">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded inline-block truncate max-w-full ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : task.status === 'in_review'
                          ? 'bg-amber-100 text-amber-700'
                          : task.status === 'blocked'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.status === 'completed'
                        ? 'Done'
                        : task.status === 'in_progress'
                        ? 'In Progress'
                        : task.status === 'blocked'
                        ? 'Blocked'
                        : task.status === 'in_review'
                        ? 'Review'
                        : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Timeline Header and Interactive Gantt Bars Canvas */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto bg-white relative"
        >
          <div style={{ width: `${Math.max(totalTimelineWidth, 800)}px` }} className="min-h-full flex flex-col">
            {/* Timeline Header (Months & Days) */}
            <div className="h-10 bg-white border-b border-slate-200 sticky top-0 z-20 select-none">
              {/* Bottom Day / Date tier */}
              <div className="h-10 flex text-[10px] text-slate-400 font-medium border-b border-slate-200">
                {datesList.map((d, i) => {
                  const dayNum = d.getDate();
                  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday =
                    d.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={i}
                      style={{ width: `${dayWidth}px` }}
                      className={`h-full border-r border-slate-100 flex flex-col items-center justify-center shrink-0 pt-1 ${
                        isToday
                          ? 'bg-blue-50 font-bold text-blue-700'
                          : isWeekend
                          ? 'bg-slate-50/50 text-slate-300 italic'
                          : 'text-slate-400'
                      }`}
                      title={!isNaN(d.getTime()) ? d.toISOString().split('T')[0] : ''}
                    >
                      <span className="leading-tight">{weekday}</span>
                      <span className="font-bold leading-tight">{dayNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Body Rows with High-Density 32px Gantt Bars */}
            <div className="relative divide-y divide-slate-100 flex-1">
              {/* Vertical Grid Columns Background */}
              <div className="absolute inset-0 pointer-events-none flex">
                {datesList.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={i}
                      style={{ width: `${dayWidth}px` }}
                      className={`h-full border-r border-slate-100 shrink-0 ${
                        isWeekend ? 'bg-slate-50/50' : ''
                      }`}
                    />
                  );
                })}
              </div>

              {/* Red line for Today */}
              {todayX >= 0 && todayX <= totalTimelineWidth && (
                <div
                  style={{ left: `${todayX}px` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none"
                >
                  <div className="sticky top-10 -ml-3 px-1 py-0.5 rounded text-[8px] bg-rose-600 text-white font-bold whitespace-nowrap">
                    {t.today}
                  </div>
                </div>
              )}

              {/* Task Bars Rendering */}
              {visibleTasks.map((task) => {
                const isParent = parentTaskIds.has(task.id);
                const x = getXForDate(task.startDate);
                const width = getWidthForTask(task.startDate, task.endDate, task.duration);
                const assignee = resourceMap.get(task.assigneeId);

                // High Density Bar Colors:
                // Completed: bg-emerald-500
                // In Progress: bg-blue-500
                // Pending: bg-slate-300 opacity-60
                let barBg = 'bg-blue-500';
                let progressBg = 'bg-blue-600';

                if (task.status === 'completed') {
                  barBg = 'bg-emerald-500';
                  progressBg = 'bg-emerald-600';
                } else if (task.status === 'blocked') {
                  barBg = 'bg-rose-500';
                  progressBg = 'bg-rose-600';
                } else if (task.status === 'not_started') {
                  barBg = 'bg-slate-300 opacity-60';
                  progressBg = 'bg-slate-400';
                }

                return (
                  <div
                    key={task.id}
                    id={`gantt-row-right-${task.id}`}
                    className="h-8 relative flex items-center group cursor-pointer hover:bg-slate-50/60"
                    onClick={() => onSelectTask(task)}
                  >
                    {/* Parent Summary Bar */}
                    {isParent ? (
                      <div
                        style={{ left: `${x}px`, width: `${width}px` }}
                        className="absolute h-3.5 bg-slate-800 rounded-xs z-5 flex items-center shadow-2xs group-hover:ring-1 group-hover:ring-blue-400"
                        title={`${task.name}: ${task.startDate} to ${task.endDate} (${task.progress}%)`}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-black rounded-l" />
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-black rounded-r" />
                        <div
                          style={{ width: `${task.progress}%` }}
                          className="h-full bg-emerald-400/80 rounded-l"
                        />
                        <span className="absolute left-full ml-1.5 text-[10px] font-semibold text-slate-700 whitespace-nowrap">
                          {task.name}
                        </span>
                      </div>
                    ) : (
                      /* Standard High Density Task Bar (h-4 rounded) */
                      <div
                        style={{ left: `${x}px`, width: `${width}px` }}
                        className={`absolute h-4 ${barBg} rounded shadow-2xs z-5 flex items-center overflow-hidden transition-all group-hover:ring-1 group-hover:ring-blue-500`}
                        title={`${task.name}: ${task.startDate} to ${task.endDate} (${task.progress}%) - ${assignee?.name || ''}`}
                      >
                        {/* Progress Fill */}
                        <div
                          style={{ width: `${task.progress}%` }}
                          className={`h-full ${progressBg}`}
                        />

                        {/* Text inside bar if wide enough */}
                        {width > 60 && (
                          <div className="absolute inset-0 px-1.5 flex items-center justify-between text-white font-medium text-[9px] pointer-events-none drop-shadow-2xs">
                            <span className="truncate">{task.name}</span>
                            <span className="font-mono text-[8px]">{task.progress}%</span>
                          </div>
                        )}

                        {/* Label to the right if narrow */}
                        {width <= 60 && (
                          <span className="absolute left-full ml-1.5 text-[10px] font-medium text-slate-600 whitespace-nowrap pointer-events-none">
                            {task.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
