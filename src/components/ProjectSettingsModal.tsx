import React, { useState } from 'react';
import {
  FolderX,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Database,
  X,
} from 'lucide-react';
import { ProjectInfo, Language } from '../types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  language: Language;
  onUpdateProject: (updated: Partial<ProjectInfo>) => void;
  onClearAllTasks: () => void;
  onResetProjectToDemo: () => void;
  totalTasks: number;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  language,
  onUpdateProject,
  onClearAllTasks,
  onResetProjectToDemo,
  totalTasks,
}) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [startDate, setStartDate] = useState(project.startDate || '');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProject({
      name: name.trim() || project.name,
      description: description.trim(),
      startDate: startDate || project.startDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {language === 'la' ? 'ຈັດການຂໍ້ມູນໂຄງການ' : 'Project Settings & Data'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'la'
                  ? 'ແກ້ໄຂຊື່ໂຄງການ ຫຼື ລຶບ/ຣີເຊັດຂໍ້ມູນທັງໝົດ'
                  : 'Edit project info or clear/reset project data'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs text-slate-700 flex-1">
          {/* Section 1: Edit Project Metadata */}
          <form onSubmit={handleSaveInfo} className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
              <span>{language === 'la' ? 'ຂໍ້ມູນທົ່ວໄປຂອງໂຄງການ' : 'General Project Info'}</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {language === 'la' ? 'ຊື່ໂຄງການ' : 'Project Name'}
              </label>
              <input
                id="input-project-name-edit"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={language === 'la' ? 'ໃສ່ຊື່ໂຄງການ' : 'Project Name'}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {language === 'la' ? 'ຄຳອະທິບາຍໂຄງການ' : 'Description'}
              </label>
              <textarea
                id="input-project-desc-edit"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder={language === 'la' ? 'ຄຳອະທິບາຍຫຍໍ້ກ່ຽວກັບໂຄງການ...' : 'Brief project description...'}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {language === 'la' ? 'ວັນທີເລີ່ມໂຄງການ' : 'Project Start Date'}
              </label>
              <input
                id="input-project-startdate-edit"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                id="btn-save-project-info"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-xs transition-colors"
              >
                {language === 'la' ? 'ບັນທຶກຊື່ໂຄງການ' : 'Save Project Info'}
              </button>
            </div>
          </form>

          {/* Section 2: Danger Zone - Clear all data or Reset */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{language === 'la' ? 'ພື້ນທີ່ຈັດການຂໍ້ມູນ ແລະ ການລຶບ (Danger Zone)' : 'Data Management & Clear'}</span>
            </h4>

            {/* Action 1: Delete all tasks */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-rose-900 text-xs">
                    {language === 'la' ? 'ລຶບໜ້າວຽກທັງໝົດໃນໂຄງການ' : 'Delete All Project Tasks'}
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    {language === 'la'
                      ? `ຈະລຶບໜ້າວຽກທັງໝົດຈຳນວນ ${totalTasks} ວຽກ ອອກຈາກລະບົບ (ລວມທັງໃນ LocalStorage ແລະ Firebase Firestore ຖ້າເຊື່ອມຕໍ່).`
                      : `Deletes all ${totalTasks} tasks from the project (including LocalStorage and Firebase if connected).`}
                  </p>
                </div>
              </div>

              {confirmClear ? (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    id="btn-confirm-delete-all-tasks"
                    onClick={() => {
                      onClearAllTasks();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs transition-colors shadow-xs"
                  >
                    {language === 'la' ? 'ຢືນຢັນລຶບທັງໝົດແທ້' : 'Yes, Delete All Tasks'}
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs transition-colors"
                  >
                    {language === 'la' ? 'ຍົກເລີກ' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <button
                  id="btn-trigger-delete-all-tasks"
                  onClick={() => setConfirmClear(true)}
                  disabled={totalTasks === 0}
                  className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>{language === 'la' ? 'ລຶບໜ້າວຽກທັງໝົດ' : 'Clear All Tasks'}</span>
                </button>
              )}
            </div>

            {/* Action 2: Reset to Demo default */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div>
                <p className="font-bold text-slate-800 text-xs">
                  {language === 'la' ? 'ຣີເຊັດເປັນຂໍ້ມູນໂຄງການເລີ່ມຕົ້ນ (Demo Data)' : 'Reset to Default Template'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'la'
                    ? 'ໂຫຼດຂໍ້ມູນວຽກຕົວຢ່າງ, Gantt chart, ແລະ ທີມງານເລີ່ມຕົ້ນຄືນໃໝ່.'
                    : 'Restore default sample tasks, Gantt timeline, and demo resources.'}
                </p>
              </div>

              {confirmReset ? (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    id="btn-confirm-reset-demo"
                    onClick={() => {
                      onResetProjectToDemo();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition-colors shadow-xs"
                  >
                    {language === 'la' ? 'ຢືນຢັນຣີເຊັດ' : 'Yes, Reset Demo'}
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs transition-colors"
                  >
                    {language === 'la' ? 'ຍົກເລີກ' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <button
                  id="btn-trigger-reset-demo"
                  onClick={() => setConfirmReset(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>{language === 'la' ? 'ຣີເຊັດເປັນຕົວຢ່າງ' : 'Reset to Demo'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs transition-colors"
          >
            {language === 'la' ? 'ປິດ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
