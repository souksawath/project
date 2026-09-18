import React from 'react';
import {
  Calendar,
  Table,
  Users,
  Kanban,
  BarChart3,
  FileSpreadsheet,
  Database,
  RefreshCw,
  ExternalLink,
  LogIn,
  LogOut,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { ViewMode, Language, ProjectInfo } from '../types';
import { translations } from '../utils/i18n';
import { User } from 'firebase/auth';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  project: ProjectInfo;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSheetModal: () => void;
  onOpenFirebaseModal: () => void;
  onQuickAddTask: () => void;
  isSyncing: boolean;
  lastSynced: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  language,
  onLanguageChange,
  project,
  user,
  onSignIn,
  onSignOut,
  onOpenSheetModal,
  onOpenFirebaseModal,
  onQuickAddTask,
  isSyncing,
  lastSynced,
}) => {
  const t = translations[language];

  return (
    <header className="shrink-0 z-30 select-none">
      {/* Top High-Density Bar (#1E293B Slate 800) */}
      <div className="h-14 bg-[#1E293B] text-white flex items-center justify-between px-4 sm:px-6 shrink-0">
        {/* Left: Emerald Logo & Project Title */}
        <div className="flex items-center gap-3.5">
          <div className="bg-emerald-500 p-1.5 rounded shadow-xs text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div className="flex items-baseline">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center">
              <span>{t.appName}</span>
              <span className="hidden sm:inline-block text-emerald-400 text-xs sm:text-sm font-normal ml-2">
                | {project.spreadsheetId ? (language === 'la' ? 'Sync Active (Google Sheets)' : 'Sync Active (Google Sheets)') : 'Google Sheets Sync'}
              </span>
            </h1>
          </div>
        </div>

        {/* Right: Quick Task, Google Sheet Sync, Language, User Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Task Button */}
          <button
            id="btn-header-quick-add-task"
            onClick={onQuickAddTask}
            className="bg-white/10 hover:bg-white/20 text-white px-2.5 sm:px-3 py-1.5 rounded text-xs font-medium border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <span>+</span>
            <span>{language === 'la' ? 'ເພີ່ມໜ້າວຽກ' : 'Add Task'}</span>
          </button>

          {/* Google Sheets Sync Modal trigger */}
          <button
            id="btn-google-sheets-sync"
            onClick={onOpenSheetModal}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs ${
              project.spreadsheetId
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span className="hidden md:inline">
              {project.spreadsheetId
                ? language === 'la' ? 'Google Sheets' : 'Google Sheets'
                : language === 'la' ? 'ແບ່ງປັນໂຄງການ' : 'Share Project'}
            </span>
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : project.spreadsheetId ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            ) : null}
          </button>

          {/* Firebase Database Trigger */}
          <button
            id="btn-firebase-database-sync"
            onClick={onOpenFirebaseModal}
            className="px-3 py-1.5 rounded text-xs font-medium bg-amber-600/90 hover:bg-amber-600 text-white border border-amber-500 transition-colors flex items-center gap-1.5 shadow-xs"
            title="Firebase Cloud Database"
          >
            <Database className="w-4 h-4 text-amber-200" />
            <span className="hidden sm:inline">Firebase DB</span>
          </button>

          {/* Quick External Link to Google Sheets if connected */}
          {project.spreadsheetUrl && (
            <a
              id="link-open-spreadsheet"
              href={project.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-colors"
              title={t.openInSheets}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Language Switcher */}
          <button
            id="btn-switch-language"
            onClick={() => onLanguageChange(language === 'la' ? 'en' : 'la')}
            className="px-2 py-1.5 rounded bg-white/10 text-slate-200 hover:text-white hover:bg-white/20 text-xs font-medium border border-white/20 transition-colors flex items-center gap-1"
            title="Switch Language / ປ່ຽນພາສາ"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase font-mono">{language === 'la' ? 'LA' : 'EN'}</span>
          </button>

          {/* Google Auth Status */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-6 h-6 rounded-full border border-emerald-400"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <button
                id="btn-signout-google"
                onClick={onSignOut}
                className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-rose-300 transition-colors"
                title={t.signOut}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-signin-google"
              onClick={onSignIn}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.signInWithGoogle}</span>
            </button>
          )}
        </div>
      </div>

      {/* High-Density Navigation Bar (White background, Slate 200 border, clean bottom active indicator) */}
      <nav className="h-10 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 gap-2 sm:gap-6 text-xs font-semibold text-slate-500 shrink-0 overflow-x-auto scrollbar-none">
        <button
          id="nav-tab-gantt"
          onClick={() => onViewModeChange('gantt')}
          className={`h-full flex items-center px-2 cursor-pointer transition-colors whitespace-nowrap gap-1.5 ${
            viewMode === 'gantt'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'hover:text-slate-800 border-b-2 border-transparent'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Gantt Chart</span>
        </button>

        <button
          id="nav-tab-table"
          onClick={() => onViewModeChange('table')}
          className={`h-full flex items-center px-2 cursor-pointer transition-colors whitespace-nowrap gap-1.5 ${
            viewMode === 'table'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'hover:text-slate-800 border-b-2 border-transparent'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>{t.tableView}</span>
        </button>

        <button
          id="nav-tab-resources"
          onClick={() => onViewModeChange('resources')}
          className={`h-full flex items-center px-2 cursor-pointer transition-colors whitespace-nowrap gap-1.5 ${
            viewMode === 'resources'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'hover:text-slate-800 border-b-2 border-transparent'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Resource Usage</span>
        </button>

        <button
          id="nav-tab-board"
          onClick={() => onViewModeChange('board')}
          className={`h-full flex items-center px-2 cursor-pointer transition-colors whitespace-nowrap gap-1.5 ${
            viewMode === 'board'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'hover:text-slate-800 border-b-2 border-transparent'
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Task Board</span>
        </button>

        <button
          id="nav-tab-analytics"
          onClick={() => onViewModeChange('analytics')}
          className={`h-full flex items-center px-2 cursor-pointer transition-colors whitespace-nowrap gap-1.5 ${
            viewMode === 'analytics'
              ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
              : 'hover:text-slate-800 border-b-2 border-transparent'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Reports</span>
        </button>
      </nav>
    </header>
  );
};
