import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Clock, Layers, AlertCircle, FileText, Trash2, Plus, Edit2, UserPlus, Check } from 'lucide-react';
import { Task, Resource, TaskStatus, TaskPriority, Language } from '../types';
import { translations } from '../utils/i18n';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
  task: Task | null;
  parentTaskId: string | null;
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onSaveResource?: (resource: Resource) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  parentTaskId,
  tasks,
  resources,
  language,
  onSaveResource,
}) => {
  const t = translations[language];

  const [name, setName] = useState('');
  const [wbs, setWbs] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [notes, setNotes] = useState('');

  // Inline Assignee Quick Add & Edit states
  const [isAddingAssignee, setIsAddingAssignee] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const [newAssigneeRole, setNewAssigneeRole] = useState('');

  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [editAssigneeName, setEditAssigneeName] = useState('');
  const [editAssigneeRole, setEditAssigneeRole] = useState('');

  useEffect(() => {
    setIsAddingAssignee(false);
    setIsEditingAssignee(false);
    setNewAssigneeName('');
    setNewAssigneeRole('');

    if (task) {
      setName(task.name);
      setWbs(task.wbs);
      setParentId(task.parentId);
      setAssigneeId(task.assigneeId);
      setStartDate(task.startDate);
      setEndDate(task.endDate);
      setDuration(task.duration);
      setProgress(task.progress);
      setStatus(task.status);
      setPriority(task.priority);
      setNotes(task.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      setName('');
      setParentId(parentTaskId || null);
      setAssigneeId(resources[0]?.id || '');
      setStartDate(today);
      setEndDate(nextWeekStr);
      setDuration(5);
      setProgress(0);
      setStatus('not_started');
      setPriority('medium');
      setNotes('');

      // Auto-generate WBS suggestion
      if (parentTaskId) {
        const parent = tasks.find((t) => t.id === parentTaskId);
        const siblings = tasks.filter((t) => t.parentId === parentTaskId);
        setWbs(`${parent ? parent.wbs : '1'}.${siblings.length + 1}`);
      } else {
        const rootTasks = tasks.filter((t) => !t.parentId);
        setWbs(`${rootTasks.length + 1}.0`);
      }
    }
  }, [task, parentTaskId, tasks, resources, isOpen]);

  // Recalculate duration when dates change
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && val) {
      const s = new Date(val);
      const e = new Date(endDate);
      if (e >= s) {
        const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setDuration(Math.max(1, diffDays));
      }
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && val) {
      const s = new Date(startDate);
      const e = new Date(val);
      if (e >= s) {
        const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setDuration(Math.max(1, diffDays));
      }
    }
  };

  const handleDurationChange = (val: number) => {
    const d = Math.max(1, val);
    setDuration(d);
    if (startDate) {
      const s = new Date(startDate);
      s.setDate(s.getDate() + d - 1);
      setEndDate(s.toISOString().split('T')[0]);
    }
  };

  const selectedAssignee = resources.find((r) => r.id === assigneeId) || resources[0];

  const handleQuickAddSave = () => {
    if (!newAssigneeName.trim()) return;
    const colors = ['#2563eb', '#059669', '#d946ef', '#ea580c', '#4f46e5', '#0891b2', '#e11d48', '#7c3aed'];
    const newRes: Resource = {
      id: `res-${Date.now()}`,
      name: newAssigneeName.trim(),
      role: newAssigneeRole.trim() || (language === 'la' ? 'ສະມາຊິກທີມ' : 'Team Member'),
      email: `${newAssigneeName.trim().toLowerCase().replace(/\s+/g, '.')}@company.la`,
      capacityHoursPerWeek: 40,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };
    if (onSaveResource) {
      onSaveResource(newRes);
    }
    setAssigneeId(newRes.id);
    setIsAddingAssignee(false);
    setNewAssigneeName('');
    setNewAssigneeRole('');
  };

  const handleQuickEditSave = () => {
    if (!selectedAssignee || !editAssigneeName.trim()) return;
    const updatedRes: Resource = {
      ...selectedAssignee,
      name: editAssigneeName.trim(),
      role: editAssigneeRole.trim() || selectedAssignee.role,
    };
    if (onSaveResource) {
      onSaveResource(updatedRes);
    }
    setIsEditingAssignee(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: task ? task.id : `task-${Date.now()}`,
      name: name.trim(),
      wbs: wbs.trim() || '1.0',
      parentId: parentId || null,
      assigneeId,
      startDate,
      endDate,
      duration,
      progress,
      status,
      priority,
      notes,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {task
                  ? language === 'la' ? 'ແກ້ໄຂໜ້າວຽກ' : 'Edit Task'
                  : parentTaskId
                  ? language === 'la' ? 'ເພີ່ມໜ້າວຽກຍ່ອຍ (Subtask)' : 'Add Subtask'
                  : language === 'la' ? 'ເພີ່ມໜ້າວຽກໃໝ່' : 'Add New Task'}
              </h3>
              <p className="text-xs text-slate-500">
                {task ? task.name : language === 'la' ? 'ກຳນົດລາຍລະອຽດວຽກ' : 'Define task properties'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-100px)] overflow-y-auto">
          {/* Task Name & WBS */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.taskName} *
              </label>
              <input
                id="modal-task-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'la' ? 'ຕົວຢ່າງ: ອອກແບບ UI/UX...' : 'e.g. Design UI/UX Prototype'}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.wbs}
              </label>
              <input
                id="modal-task-wbs"
                type="text"
                value={wbs}
                onChange={(e) => setWbs(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Parent Task & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'la' ? 'ວຽກຫຼັກ (Parent Task)' : 'Parent Task'}
              </label>
              <select
                id="modal-task-parent"
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">{language === 'la' ? '(ບໍ່ມີ - ເປັນວຽກຫຼັກ Phase)' : '(None - Root Phase)'}</option>
                {tasks
                  .filter((t) => !task || t.id !== task.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.wbs} - {t.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t.assignee} *
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  {/* Quick Edit current assignee button */}
                  {selectedAssignee && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingAssignee(!isEditingAssignee);
                        setIsAddingAssignee(false);
                        setEditAssigneeName(selectedAssignee.name);
                        setEditAssigneeRole(selectedAssignee.role);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 hover:underline cursor-pointer"
                      title={language === 'la' ? 'ແກ້ໄຂຊື່ຜູ້ຮັບຜິດຊອບນີ້' : 'Edit assignee name'}
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{language === 'la' ? 'ແກ້ໄຂຊື່' : 'Edit Name'}</span>
                    </button>
                  )}
                  <span className="text-slate-300">|</span>
                  {/* Quick Add new assignee button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingAssignee(!isAddingAssignee);
                      setIsEditingAssignee(false);
                      setNewAssigneeName('');
                      setNewAssigneeRole('');
                    }}
                    className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5 hover:underline cursor-pointer"
                    title={language === 'la' ? 'ເພີ່ມລາຍຊື່ຜູ້ຮັບຜິດຊອບໃໝ່' : 'Add new assignee'}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{language === 'la' ? '+ ເພີ່ມໃໝ່' : '+ Add'}</span>
                  </button>
                </div>
              </div>

              {/* Assignee Selector Dropdown */}
              <div className="relative">
                <select
                  id="modal-task-assignee"
                  value={assigneeId}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingAssignee(true);
                      setIsEditingAssignee(false);
                      setNewAssigneeName('');
                      setNewAssigneeRole('');
                    } else {
                      setAssigneeId(e.target.value);
                      setIsEditingAssignee(false);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.role})
                    </option>
                  ))}
                  <option value="__add_new__">
                    + {language === 'la' ? 'ເພີ່ມຜູ້ຮັບຜິດຊອບໃໝ່...' : 'Add New Assignee...'}
                  </option>
                </select>
              </div>

              {/* Inline Quick Add Assignee Form */}
              {isAddingAssignee && (
                <div className="mt-2 p-2.5 bg-emerald-50/90 border border-emerald-300 rounded-lg animate-in fade-in duration-150 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'la' ? 'ເພີ່ມຜູ້ຮັບຜິດຊອບໃໝ່' : 'Add New Assignee'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingAssignee(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={newAssigneeName}
                      onChange={(e) => setNewAssigneeName(e.target.value)}
                      placeholder={language === 'la' ? 'ຊື່ ແລະ ນາມສະກຸນ (ເຊັ່ນ: ທ້າວ ສົມພອນ)' : 'Full Name (e.g. John Doe)'}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={newAssigneeRole}
                      onChange={(e) => setNewAssigneeRole(e.target.value)}
                      placeholder={language === 'la' ? 'ຕຳແໜ່ງ (ເຊັ່ນ: ວິສະວະກອນ, ຜູ້ປະສານງານ)' : 'Role / Position (e.g. Engineer)'}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingAssignee(false)}
                        className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickAddSave}
                        disabled={!newAssigneeName.trim()}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>{language === 'la' ? 'ບັນທຶກ ແລະ ເລືອກທັນທີ' : 'Save & Select'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Inline Quick Edit Assignee Form */}
              {isEditingAssignee && selectedAssignee && (
                <div className="mt-2 p-2.5 bg-blue-50/90 border border-blue-300 rounded-lg animate-in fade-in duration-150 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'la' ? 'ແກ້ໄຂຊື່ຜູ້ຮັບຜິດຊອບ' : 'Edit Assignee Name'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingAssignee(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-slate-600 block mb-0.5">
                        {language === 'la' ? 'ຊື່ ແລະ ນາມສະກຸນ' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        value={editAssigneeName}
                        onChange={(e) => setEditAssigneeName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 block mb-0.5">
                        {language === 'la' ? 'ຕຳແໜ່ງ' : 'Role'}
                      </label>
                      <input
                        type="text"
                        value={editAssigneeRole}
                        onChange={(e) => setEditAssigneeRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingAssignee(false)}
                        className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickEditSave}
                        disabled={!editAssigneeName.trim()}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>{language === 'la' ? 'ບັນທຶກການແກ້ໄຂ' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.startDate}
              </label>
              <input
                id="modal-task-start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.endDate}
              </label>
              <input
                id="modal-task-end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.duration} ({t.daysUnit})
              </label>
              <input
                id="modal-task-duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Progress Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {t.progress}
              </label>
              <span className="text-xs font-mono font-bold text-blue-600">{progress}%</span>
            </div>
            <input
              id="modal-task-progress"
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.status}
              </label>
              <select
                id="modal-task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="not_started">⚪ {t.notStarted}</option>
                <option value="in_progress">🔵 {t.inProgress}</option>
                <option value="in_review">🟡 {t.inReview}</option>
                <option value="completed">🟢 {t.completed}</option>
                <option value="blocked">🔴 {t.blocked}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.priority}
              </label>
              <select
                id="modal-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
                <option value="urgent">{t.urgent}</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.notes}
            </label>
            <textarea
              id="modal-task-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'la' ? 'ບັນທຶກເພີ່ມເຕີມກ່ຽວກັບວຽກນີ້...' : 'Additional notes or requirements...'}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              {task && onDelete && (
                <button
                  type="button"
                  id="btn-modal-delete-task"
                  onClick={() => {
                    if (window.confirm(language === 'la' ? 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບວຽກນີ້?' : 'Are you sure you want to delete this task?')) {
                      onDelete(task.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t.delete}</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                {t.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
