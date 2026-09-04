import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Link,
  PlusCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ProjectInfo, Task, Resource, Language } from '../types';
import { translations } from '../utils/i18n';
import { User } from 'firebase/auth';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  user: User | null;
  tasks: Task[];
  resources: Resource[];
  language: Language;
  onSignIn: () => void;
  onCreateNewSheet: () => Promise<void>;
  onSyncToSheet: () => Promise<void>;
  onPullFromSheet: () => Promise<void>;
  onLinkExistingSheet: (sheetId: string) => Promise<void>;
  isSyncing: boolean;
  lastSynced: Date | null;
  autoSync: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  project,
  user,
  tasks,
  resources,
  language,
  onSignIn,
  onCreateNewSheet,
  onSyncToSheet,
  onPullFromSheet,
  onLinkExistingSheet,
  isSyncing,
  lastSynced,
  autoSync,
  onToggleAutoSync,
}) => {
  const t = translations[language];

  const [existingInput, setExistingInput] = useState('');
  const [confirmAction, setConfirmAction] = useState<'push' | 'pull' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setActionError(null);
    setActionSuccess(null);
    setConfirmAction(null);
  }, [isOpen]);

  const handleLinkExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingInput.trim()) return;

    // Extract ID if full URL pasted
    let sheetId = existingInput.trim();
    const urlMatch = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      sheetId = urlMatch[1];
    }

    try {
      setActionError(null);
      await onLinkExistingSheet(sheetId);
      setActionSuccess(language === 'la' ? 'ເຊື່ອມຕໍ່ Google Sheet ສຳເລັດແລ້ວ!' : 'Connected to Google Sheet successfully!');
    } catch (err: any) {
      setActionError(err.message || 'Failed to connect to sheet');
    }
  };

  const handleExecutePush = async () => {
    try {
      setActionError(null);
      await onSyncToSheet();
      setConfirmAction(null);
      setActionSuccess(t.syncSuccess);
    } catch (err: any) {
      setActionError(err.message || 'Failed to sync to sheet');
    }
  };

  const handleExecutePull = async () => {
    try {
      setActionError(null);
      await onPullFromSheet();
      setConfirmAction(null);
      setActionSuccess(language === 'la' ? 'ດຶງຂໍ້ມູນລ່າສຸດຈາກ Google Sheet ສຳເລັດ!' : 'Successfully updated tasks from Google Sheet!');
    } catch (err: any) {
      setActionError(err.message || 'Failed to pull from sheet');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{t.googleSheetSync}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                  Real-time
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'la'
                  ? 'ແບ່ງປັນ ແລະ ເຮັດວຽກຮ່ວມກັບທີມງານຜ່ານ Google Sheets'
                  : 'Sync project plan & resources with Google Sheets in real-time'}
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-100px)] overflow-y-auto">
          {/* Notifications */}
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* User Sign In Status */}
          {!user ? (
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
              <p className="text-xs text-slate-600">
                {language === 'la'
                  ? 'ກະລຸນາເຂົ້າສູ່ລະບົບດ້ວຍ Google Account ເພື່ອໃຫ້ແອັບສາມາດສ້າງ ຫຼື ບັນທຶກລົງໃນ Google Sheet ຂອງທ່ານໄດ້.'
                  : 'Please sign in with Google to allow this application to access and sync with your Google Sheets.'}
              </p>
              <button
                id="btn-modal-signin-google"
                onClick={onSignIn}
                className="gsi-material-button mx-auto"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">{t.signInWithGoogle}</span>
                </div>
              </button>
            </div>
          ) : (
            <>
              {/* Connected Google Account Header */}
              <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>
                    {language === 'la' ? 'ບັນຊີທີ່ເຊື່ອມຕໍ່: ' : 'Signed in as: '}
                    <strong>{user.email}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                  Authorized
                </span>
              </div>

              {/* Current Spreadsheet Connection State */}
              {project.spreadsheetId ? (
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{t.connectedSheet}</span>
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate max-w-sm">
                        ID: {project.spreadsheetId}
                      </p>
                      {lastSynced && (
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{t.lastSynced}: {lastSynced.toLocaleTimeString()}</span>
                        </p>
                      )}
                    </div>

                    {project.spreadsheetUrl && (
                      <a
                        id="btn-open-google-sheet-link"
                        href={project.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{t.openInSheets}</span>
                      </a>
                    )}
                  </div>

                  {/* Auto-Sync Toggle */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{t.autoSync}</p>
                      <p className="text-[11px] text-slate-500">
                        {language === 'la'
                          ? 'ຊິ້ງຂໍ້ມູນໂຄງການອັດຕະໂນມັດທຸກໆ 30 ວິນາທີ'
                          : 'Automatically polls updates every 30 seconds for live team collaboration'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => onToggleAutoSync(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Push & Pull Actions (With Mandatory User Confirmation Dialog) */}
                  <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                    <button
                      id="btn-push-to-sheet"
                      disabled={isSyncing}
                      onClick={() => setConfirmAction('push')}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t.saveToSheets}</span>
                    </button>

                    <button
                      id="btn-pull-from-sheet"
                      disabled={isSyncing}
                      onClick={() => setConfirmAction('pull')}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.pullFromSheets}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* No Sheet Connected Yet - Options to Create or Link */
                <div className="space-y-4">
                  {/* Option 1: Create New Google Sheet */}
                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {language === 'la'
                            ? '1. ສ້າງ Google Sheet ໃໝ່ອັດຕະໂນມັດສຳລັບໂຄງການ'
                            : '1. Create a New Google Sheet for this Project'}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {language === 'la'
                            ? 'ລະບົບຈະສ້າງ Spreadsheet ພ້ອມຕາຕະລາງ Tasks & WBS ແລະ Resources ໃຫ້ທັນທີ'
                            : 'Generates a formatted spreadsheet with "Tasks & WBS" and "Resources" sheets'}
                        </p>
                      </div>
                    </div>

                    <button
                      id="btn-create-new-sheet"
                      disabled={isSyncing}
                      onClick={onCreateNewSheet}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4" />
                      )}
                      <span>
                        {language === 'la'
                          ? 'ສ້າງ Google Sheet ໃໝ່ດຽວນີ້'
                          : 'Create New Google Sheet Now'}
                      </span>
                    </button>
                  </div>

                  {/* Option 2: Link Existing Google Sheet */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Link className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {language === 'la'
                            ? '2. ເຊື່ອມຕໍ່ກັບ Google Sheet ທີ່ມີຢູ່ແລ້ວ'
                            : '2. Link Existing Google Sheet'}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {language === 'la'
                            ? 'ວາງ Spreadsheet ID ຫຼື URL ຂອງ Google Sheet'
                            : 'Paste your Google Spreadsheet ID or URL'}
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleLinkExisting} className="flex gap-2">
                      <input
                        id="input-existing-sheet-id"
                        type="text"
                        placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or URL"
                        value={existingInput}
                        onChange={(e) => setExistingInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        id="btn-link-existing-sheet"
                        type="submit"
                        className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-xs transition-colors shrink-0"
                      >
                        {language === 'la' ? 'ເຊື່ອມຕໍ່' : 'Link'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Mandatory User Confirmation Dialog for Destructive Operations */}
              {confirmAction && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        {confirmAction === 'push'
                          ? language === 'la'
                            ? `ຢືນຢັນການບັນທຶກ ${tasks.length} ລາຍການວຽກລົງໃນ Google Sheet?`
                            : `Confirm updating Google Sheet with ${tasks.length} tasks?`
                          : language === 'la'
                          ? 'ຢືນຢັນການດຶງຂໍ້ມູນຈາກ Google Sheet ມາທັບຂໍ້ມູນປະຈຸບັນ?'
                          : 'Confirm pulling data from Google Sheet? Local changes may be updated.'}
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-1">
                        {confirmAction === 'push'
                          ? language === 'la'
                            ? 'ການດຳເນີນການນີ້ຈະອັບເດດແຖວຂໍ້ມູນໃນແຜ່ນງານ Tasks & WBS ໃນ Google Sheet ຂອງທ່ານ.'
                            : 'This will update cell rows in your Google Sheet spreadsheet with current task data.'
                          : language === 'la'
                          ? 'ຂໍ້ມູນວຽກ ແລະ ສະຖານະຈະຖືກອັບເດດໃຫ້ກົງກັບ Google Sheet ລ່າສຸດ.'
                          : 'Your local task list will be synchronized with the latest spreadsheet rows.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                    <button
                      id="btn-confirm-action-cancel"
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                    >
                      {t.cancel}
                    </button>
                    <button
                      id="btn-confirm-action-proceed"
                      type="button"
                      disabled={isSyncing}
                      onClick={confirmAction === 'push' ? handleExecutePush : handleExecutePull}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
                    >
                      {isSyncing ? (
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </span>
                      ) : (
                        <span>{language === 'la' ? 'ຢືນຢັນດຳເນີນການ' : 'Confirm & Proceed'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            {tasks.length} tasks • {resources.length} resources
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            {language === 'la' ? 'ປິດ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
