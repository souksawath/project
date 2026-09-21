import React, { useState } from 'react';
import { Database, Cloud, RefreshCw, UploadCloud, DownloadCloud, CheckCircle2, ShieldCheck, X, Trash2 } from 'lucide-react';
import { Task, Resource, ProjectInfo, Language } from '../types';
import {
  saveTasksToFirestore,
  saveResourcesToFirestore,
  saveProjectToFirestore,
  loadInitialDataFromFirestore,
  clearFirestoreProjectData,
} from '../services/firestoreService';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  tasks: Task[];
  resources: Resource[];
  project: ProjectInfo;
  onDataLoaded: (data: { tasks?: Task[]; resources?: Resource[]; project?: ProjectInfo }) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isCloudConnected: boolean;
  lastCloudSynced: Date | null;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
  language,
  tasks,
  resources,
  project,
  onDataLoaded,
  showToast,
  isCloudConnected,
  lastCloudSynced,
}) => {
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleClearFirestore = async () => {
    try {
      setIsClearing(true);
      await clearFirestoreProjectData();
      showToast(
        language === 'la'
          ? 'ລຶບຂໍ້ມູນໂຄງການໃນ Firebase Firestore ສຳເລັດແລ້ວ!'
          : 'Successfully cleared all project data from Firebase Firestore!',
        'info'
      );
      setShowConfirmClear(false);
    } catch (err: any) {
      console.error('Failed to clear Firebase:', err);
      showToast(err.message || 'Failed to clear Firebase Firestore', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handlePushToFirebase = async () => {
    try {
      setIsPushing(true);
      await saveProjectToFirestore(project);
      await saveTasksToFirestore(tasks);
      await saveResourcesToFirestore(resources);
      showToast(
        language === 'la'
          ? 'ບັນທຶກ ແລະ ສົ່ງຂໍ້ມູນເຂົ້າ Firebase Firestore ສຳເລັດແລ້ວ!'
          : 'Successfully saved and pushed all data to Firebase Firestore!',
        'success'
      );
    } catch (err: any) {
      console.error('Failed to push to Firebase:', err);
      showToast(err.message || 'Failed to push to Firebase Firestore', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullFromFirebase = async () => {
    try {
      setIsPulling(true);
      const data = await loadInitialDataFromFirestore();
      if (!data.tasks && !data.resources) {
        showToast(
          language === 'la'
            ? 'ຍັງບໍ່ມີຂໍ້ມູນໃນ Firebase Firestore'
            : 'No data found in Firebase Firestore yet.',
          'info'
        );
        return;
      }
      onDataLoaded({
        tasks: data.tasks || undefined,
        resources: data.resources || undefined,
        project: data.project || undefined,
      });
      showToast(
        language === 'la'
          ? `ດຶງຂໍ້ມູນຈາກ Firebase Firestore ສຳເລັດ (${data.tasks?.length || 0} ວຽກ, ${data.resources?.length || 0} ສະມາຊິກ)`
          : `Loaded data from Firebase Firestore (${data.tasks?.length || 0} tasks, ${data.resources?.length || 0} members)`,
        'success'
      );
      onClose();
    } catch (err: any) {
      console.error('Failed to pull from Firebase:', err);
      showToast(err.message || 'Failed to pull from Firebase Firestore', 'error');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {language === 'la' ? 'ຖານຂໍ້ມູນ Firebase Cloud Firestore' : 'Firebase Cloud Firestore Database'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'la' ? 'ຖານຂໍ້ມູນ Cloud ຖາວອນ ສຳລັບເວັບແອັບ' : 'Durable persistent Cloud Database for web app'}
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Status Banner */}
          <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                {language === 'la' ? 'ຖານຂໍ້ມູນ Firebase ຖືກເຊື່ອມຕໍ່ແລ້ວ' : 'Firebase Database Connected'}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {language === 'la'
                  ? 'ຂໍ້ມູນທັງໝົດຂອງທ່ານ (ໜ້າວຽກ, ຕາຕະລາງ Gantt, ແລະ ສະມາຊິກ) ສາມາດ Sync ເກັບໄວ້ເທິງ Cloud ໄດ້ຕະຫຼອດເວລາ ເຖິງແມ່ນວ່າຈະປິດ Browser ຫຼື ເປີດໃນອຸປະກອນອື່ນ.'
                  : 'All your project tasks, Gantt schedules, and team resources can now be stored persistently in Cloud Firestore.'}
              </p>
            </div>
          </div>

          {/* Stats overview */}
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400">
                {language === 'la' ? 'ຈຳນວນໜ້າວຽກ' : 'Total Tasks'}
              </p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{tasks.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400">
                {language === 'la' ? 'ຈຳນວນສະມາຊິກ' : 'Team Members'}
              </p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{resources.length}</p>
            </div>
          </div>

          {/* Action description */}
          <p className="text-slate-600 leading-relaxed text-[11px]">
            {language === 'la'
              ? 'ເລືອກ "ອັບໂຫຼດຂຶ້ນ Firebase" ເພື່ອສົ່ງຂໍ້ມູນປັດຈຸບັນໄປເກັບໄວ້ເທິງ Firestore ຫຼື ເລືອກ "ດຶງຂໍ້ມູນລ່າສຸດ" ເພື່ອໂຫຼດຂໍ້ມູນຈາກຖານຂໍ້ມູນ Firebase ມານຳໃຊ້.'
              : 'Choose "Upload to Firebase" to store your current project state to Firestore, or "Fetch from Firebase" to retrieve the latest state.'}
          </p>

          {/* Actions Button Group */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              id="btn-push-firestore"
              onClick={handlePushToFirebase}
              disabled={isPushing || isPulling}
              className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              {isPushing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>
                {language === 'la' ? 'ອັບໂຫຼດຂຶ້ນ Firebase (Push)' : 'Upload to Firebase (Push)'}
              </span>
            </button>

            <button
              id="btn-pull-firestore"
              onClick={handlePullFromFirebase}
              disabled={isPushing || isPulling}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-300 disabled:opacity-50"
            >
              {isPulling ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <DownloadCloud className="w-3.5 h-3.5" />
              )}
              <span>
                {language === 'la' ? 'ດຶງຂໍ້ມູນລ່າສຸດ (Pull)' : 'Fetch from Firebase (Pull)'}
              </span>
            </button>
          </div>

          {/* Delete / Clear Cloud Data */}
          <div className="pt-2 border-t border-slate-200">
            {showConfirmClear ? (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-rose-800">
                  {language === 'la' ? 'ຢືນຢັນລຶບຂໍ້ມູນໃນ Cloud Firestore?' : 'Clear all data in Cloud Firestore?'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-confirm-clear-firestore"
                    onClick={handleClearFirestore}
                    disabled={isClearing}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors"
                  >
                    {isClearing ? 'Clearing...' : language === 'la' ? 'ລຶບແທ້' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] transition-colors"
                  >
                    {language === 'la' ? 'ຍົກເລີກ' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-open-confirm-clear-firestore"
                onClick={() => setShowConfirmClear(true)}
                className="w-full py-1.5 px-3 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-dashed border-rose-300 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {language === 'la'
                    ? 'ລຶບຂໍ້ມູນໂຄງການທັງໝົດໃນ Cloud Firestore'
                    : 'Clear Project Data in Cloud Firestore'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Firebase Firestore: Ready</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors font-medium"
          >
            {language === 'la' ? 'ປິດ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
