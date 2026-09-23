import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { GanttChart } from './components/GanttChart';
import { TaskTableView } from './components/TaskTableView';
import { ResourceManagement } from './components/ResourceManagement';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectAnalytics } from './components/ProjectAnalytics';
import { TaskModal } from './components/TaskModal';
import { ResourceModal } from './components/ResourceModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { FirebaseModal } from './components/FirebaseModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { Task, Resource, ProjectInfo, ViewMode, Language, TaskStatus } from './types';
import { initialTasks, initialResources, initialProject } from './data/initialData';
import { translations } from './utils/i18n';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
} from './services/auth';
import {
  createProjectSpreadsheet,
  syncTasksToSpreadsheet,
  readTasksFromSpreadsheet,
} from './services/sheetsService';
import {
  loadInitialDataFromFirestore,
  saveTasksToFirestore,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  saveResourcesToFirestore,
  saveResourceToFirestore,
  deleteResourceFromFirestore,
  saveProjectToFirestore,
  clearFirestoreProjectData,
} from './services/firestoreService';
import { renumberTasksWbs } from './utils/wbsHelper';
import { User } from 'firebase/auth';

const STORAGE_KEYS = {
  TASKS: 'pm_tasks_data',
  RESOURCES: 'pm_resources_data',
  PROJECT: 'pm_project_info',
  LANGUAGE: 'pm_language_pref',
};

function sanitizeResource(r: any, index: number): Resource {
  return {
    id: r?.id ? String(r.id) : `res-${index + 1}`,
    name: r?.name ? String(r.name) : `ສະມາຊິກ ${index + 1}`,
    role: r?.role ? String(r.role) : 'Team Member',
    email: r?.email ? String(r.email) : '',
    avatarColor: r?.avatarColor ? String(r.avatarColor) : '#2563eb',
    capacityHoursPerWeek: Number(r?.capacityHoursPerWeek) || 40,
    hourlyRate: r?.hourlyRate ? Number(r.hourlyRate) : undefined,
  };
}

function isValidDateStr(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

function sanitizeTask(t: any, index: number): Task {
  const todayStr = new Date().toISOString().split('T')[0];
  const sDate = isValidDateStr(t?.startDate) ? String(t.startDate) : todayStr;
  const eDate = isValidDateStr(t?.endDate) ? String(t.endDate) : sDate;

  return {
    id: t?.id ? String(t.id) : `task-${index + 1}`,
    name: t?.name ? String(t.name) : 'Untitled Task',
    wbs: t?.wbs ? String(t.wbs) : `${index + 1}.0`,
    parentId: t?.parentId || null,
    assigneeId: t?.assigneeId ? String(t.assigneeId) : '',
    startDate: sDate,
    endDate: eDate,
    duration: Number(t?.duration) || 1,
    progress: Math.min(100, Math.max(0, Number(t?.progress) || 0)),
    status: (['not_started', 'in_progress', 'in_review', 'completed', 'blocked'].includes(t?.status)
      ? t.status
      : 'not_started') as TaskStatus,
    priority: (['low', 'medium', 'high', 'critical'].includes(t?.priority)
      ? t.priority
      : 'medium') as any,
    notes: t?.notes ? String(t.notes) : '',
  };
}

export default function App() {
  // Localization State (default to Lao 'la' as prompt was in Lao)
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return saved === 'en' ? 'en' : 'la';
  });

  const t = translations[language];

  // Active View Tab
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');

  // Core Project Data
  const [project, setProject] = useState<ProjectInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.name) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved project info', e);
    }
    return initialProject;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t, idx) => sanitizeTask(t, idx));
        }
      }
    } catch (e) {
      console.error('Failed to parse saved tasks', e);
    }
    return initialTasks;
  });

  const [resources, setResources] = useState<Resource[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r, idx) => sanitizeResource(r, idx));
        }
      }
    } catch (e) {
      console.error('Failed to parse saved resources', e);
    }
    return initialResources;
  });

  // Auth and Google Workspace state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTaskIdForNew, setParentTaskIdForNew] = useState<string | null>(null);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [lastCloudSynced, setLastCloudSynced] = useState<Date | null>(null);

  // Load from Firebase on first mount if available
  useEffect(() => {
    let isMounted = true;
    loadInitialDataFromFirestore().then((cloudData) => {
      if (!isMounted) return;
      if (cloudData.tasks && Array.isArray(cloudData.tasks) && cloudData.tasks.length > 0) {
        setTasks(cloudData.tasks.map((t, i) => sanitizeTask(t, i)));
      }
      if (cloudData.resources && Array.isArray(cloudData.resources) && cloudData.resources.length > 0) {
        setResources(cloudData.resources.map((r, i) => sanitizeResource(r, i)));
      }
      if (cloudData.project && typeof cloudData.project === 'object' && cloudData.project.name) {
        setProject(cloudData.project);
      }
      if (cloudData.tasks || cloudData.resources) {
        setLastCloudSynced(new Date());
      }
    }).catch((err) => {
      console.warn('Initial cloud load warning:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
  };

  // Auth Initialization on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast(
          language === 'la'
            ? `ຍິນດີຕ້ອນຮັບ, ${result.user.displayName || 'Google User'}`
            : `Welcome, ${result.user.displayName || 'Google User'}`
        );
      }
    } catch (err: any) {
      console.error('Google Sign In failed', err);
      showToast(err.message || 'Google Sign In failed', 'error');
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    showToast(language === 'la' ? 'ອອກຈາກລະບົບ Google ແລ້ວ' : 'Signed out from Google', 'info');
  };

  // Google Sheets: Create New Sheet
  const handleCreateNewSheet = async () => {
    let token = accessToken;
    if (!token) {
      const signinRes = await googleSignIn();
      if (!signinRes) return;
      setUser(signinRes.user);
      setAccessToken(signinRes.accessToken);
      token = signinRes.accessToken;
    }

    try {
      setIsSyncing(true);
      const { spreadsheetId, spreadsheetUrl } = await createProjectSpreadsheet(
        token,
        project.name,
        tasks,
        resources
      );

      setProject((prev) => ({
        ...prev,
        spreadsheetId,
        spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
      }));

      setLastSynced(new Date());
      showToast(
        language === 'la'
          ? 'ສ້າງ ແລະ ເຊື່ອມຕໍ່ Google Sheet ສຳເລັດແລ້ວ!'
          : 'Created & connected new Google Sheet successfully!'
      );
    } catch (err: any) {
      console.error('Create sheet error:', err);
      showToast(err.message || 'Failed to create Google Sheet', 'error');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sheets: Sync to Sheet (Push)
  const handleSyncToSheet = async () => {
    if (!project.spreadsheetId) {
      throw new Error('No spreadsheet connected. Please create or link a sheet first.');
    }

    let token = accessToken;
    if (!token) {
      const signinRes = await googleSignIn();
      if (!signinRes) return;
      setUser(signinRes.user);
      setAccessToken(signinRes.accessToken);
      token = signinRes.accessToken;
    }

    try {
      setIsSyncing(true);
      await syncTasksToSpreadsheet(token, project.spreadsheetId, tasks, resources);
      setLastSynced(new Date());
      setProject((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
      }));
      showToast(t.syncSuccess);
    } catch (err: any) {
      console.error('Sync to sheet error:', err);
      showToast(err.message || t.syncError, 'error');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sheets: Pull from Sheet
  const handlePullFromSheet = async () => {
    if (!project.spreadsheetId) {
      throw new Error('No spreadsheet connected');
    }

    let token = accessToken;
    if (!token) {
      const signinRes = await googleSignIn();
      if (!signinRes) return;
      setUser(signinRes.user);
      setAccessToken(signinRes.accessToken);
      token = signinRes.accessToken;
    }

    try {
      setIsSyncing(true);
      const { tasks: sheetTasks } = await readTasksFromSpreadsheet(
        token,
        project.spreadsheetId,
        resources
      );

      if (sheetTasks && sheetTasks.length > 0) {
        setTasks(sheetTasks);
        setLastSynced(new Date());
        showToast(
          language === 'la'
            ? `ດຶງຂໍ້ມູນສຳເລັດ! ອັບເດດ ${sheetTasks.length} ລາຍການວຽກ`
            : `Pulled successfully! Updated ${sheetTasks.length} tasks`
        );
      } else {
        showToast(
          language === 'la'
            ? 'ບໍ່ພົບແຖວຂໍ້ມູນວຽກໃນ Google Sheet'
            : 'No task rows found in Google Sheet',
          'info'
        );
      }
    } catch (err: any) {
      console.error('Pull from sheet error:', err);
      showToast(err.message || 'Failed to pull tasks from sheet', 'error');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sheets: Link existing sheet
  const handleLinkExistingSheet = async (sheetId: string) => {
    let token = accessToken;
    if (!token) {
      const signinRes = await googleSignIn();
      if (!signinRes) return;
      setUser(signinRes.user);
      setAccessToken(signinRes.accessToken);
      token = signinRes.accessToken;
    }

    try {
      setIsSyncing(true);
      const { tasks: pulledTasks } = await readTasksFromSpreadsheet(token, sheetId, resources);
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

      setProject((prev) => ({
        ...prev,
        spreadsheetId: sheetId,
        spreadsheetUrl: url,
        lastSyncedAt: new Date().toISOString(),
      }));

      if (pulledTasks && pulledTasks.length > 0) {
        setTasks(pulledTasks);
      }

      setLastSynced(new Date());
      showToast(
        language === 'la'
          ? 'ເຊື່ອມຕໍ່ກັບ Google Sheet ສຳເລັດແລ້ວ!'
          : 'Connected to existing Google Sheet successfully!'
      );
    } catch (err: any) {
      console.error('Link sheet error:', err);
      showToast(err.message || 'Failed to link Google Sheet', 'error');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Real-time Auto-Sync Polling Interval
  useEffect(() => {
    if (!autoSync || !project.spreadsheetId || !accessToken) return;

    const interval = setInterval(async () => {
      try {
        const { tasks: updatedTasks } = await readTasksFromSpreadsheet(
          accessToken,
          project.spreadsheetId!,
          resources
        );
        if (updatedTasks && updatedTasks.length > 0) {
          setTasks(updatedTasks);
          setLastSynced(new Date());
        }
      } catch (e) {
        console.warn('Real-time auto sync polling error:', e);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [autoSync, project.spreadsheetId, accessToken, resources]);

  // Task Actions
  const handleOpenAddTask = (parentId?: string | null) => {
    setSelectedTask(null);
    setParentTaskIdForNew(parentId || null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setSelectedTask(task);
    setParentTaskIdForNew(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (selectedTask) {
      // Edit existing task
      const updated = { ...selectedTask, ...taskData } as Task;
      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTask.id ? updated : t))
      );
      saveTaskToFirestore(updated).catch((err) => console.warn('Cloud save task error:', err));
      showToast(language === 'la' ? 'ອັບເດດຂໍ້ມູນວຽກສຳເລັດ' : 'Task updated successfully');
    } else {
      // Add new task
      const newTask = taskData as Task;
      setTasks((prev) => [...prev, newTask]);
      saveTaskToFirestore(newTask).catch((err) => console.warn('Cloud save task error:', err));
      showToast(language === 'la' ? 'ເພີ່ມໜ້າວຽກໃໝ່ສຳເລັດ' : 'New task added successfully');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    // Delete target task and all of its subtasks
    const subtaskIds = tasks.filter((t) => t.parentId === taskId).map((t) => t.id);
    const allDeletedIds = [taskId, ...subtaskIds];

    setTasks((prev) => {
      const remaining = prev.filter((t) => !allDeletedIds.includes(t.id));
      // Automatically shift/renumber WBS sequence (e.g. deleting #3 shifts #4 -> #3)
      const renumbered = renumberTasksWbs(remaining);

      // Save renumbered tasks to Firestore
      saveTasksToFirestore(renumbered).catch((err) => console.warn('Cloud save renumbered error:', err));
      return renumbered;
    });

    // Delete removed documents from Firestore
    allDeletedIds.forEach((id) => {
      deleteTaskFromFirestore(id).catch((err) => console.warn('Cloud delete task error:', err));
    });

    showToast(
      language === 'la'
        ? 'ລຶບວຽກສຳເລັດ ແລະ ຍັບລຳດັບເລກທີອັດຕະໂນມັດແລ້ວ'
        : 'Task deleted and sequence automatically renumbered',
      'info'
    );
  };

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          let newProgress = task.progress;
          if (newStatus === 'completed') newProgress = 100;
          if (newStatus === 'not_started') newProgress = 0;
          if (newStatus === 'in_progress' && task.progress === 0) newProgress = 25;
          const updated = { ...task, status: newStatus, progress: newProgress };
          saveTaskToFirestore(updated).catch((err) => console.warn('Cloud status update error:', err));
          return updated;
        }
        return task;
      })
    );
  };

  // Resource Actions
  const handleOpenAddResource = () => {
    setSelectedResource(null);
    setIsResourceModalOpen(true);
  };

  const handleOpenEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    setIsResourceModalOpen(true);
  };

  const handleSaveResource = (resourceData: Resource) => {
    setResources((prev) => {
      const exists = prev.some((r) => r.id === resourceData.id);
      if (exists) {
        return prev.map((r) => (r.id === resourceData.id ? resourceData : r));
      }
      return [...prev, resourceData];
    });
    saveResourceToFirestore(resourceData).catch((err) => console.warn('Cloud save resource error:', err));
    showToast(
      language === 'la'
        ? `ບັນທຶກຂໍ້ມູນ ${resourceData.name} ສຳເລັດແລ້ວ`
        : `Saved ${resourceData.name} successfully`,
      'success'
    );
  };

  const handleUpdateAssignee = (taskId: string, newAssigneeId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assigneeId: newAssigneeId } : t))
    );
    const target = tasks.find((t) => t.id === taskId);
    if (target) {
      saveTaskToFirestore({ ...target, assigneeId: newAssigneeId }).catch((err) =>
        console.warn('Update assignee firestore warning:', err)
      );
    }
  };

  const handleDeleteResource = (resourceId: string) => {
    if (resources.length <= 1) {
      showToast('Cannot delete the only resource', 'error');
      return;
    }
    const fallbackId = resources.find((r) => r.id !== resourceId)?.id || '';
    // Reassign tasks assigned to this resource
    setTasks((prev) =>
      prev.map((t) => (t.assigneeId === resourceId ? { ...t, assigneeId: fallbackId } : t))
    );
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    deleteResourceFromFirestore(resourceId).catch((err) => console.warn('Cloud delete resource error:', err));
    showToast(language === 'la' ? 'ລຶບສະມາຊິກແລ້ວ' : 'Resource deleted', 'info');
  };

  // Project Actions (Edit, Clear Data, Reset to Demo)
  const handleUpdateProject = (updated: Partial<ProjectInfo>) => {
    const newProject = { ...project, ...updated };
    setProject(newProject);
    saveProjectToFirestore(newProject).catch((err) => console.warn('Cloud save project warning:', err));
    showToast(language === 'la' ? 'ບັນທຶກຂໍ້ມູນໂຄງການສຳເລັດ' : 'Project info updated', 'success');
  };

  const handleClearAllTasks = async () => {
    setTasks([]);
    // Remove from local storage
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    // Remove from Cloud Firestore
    try {
      await clearFirestoreProjectData();
      showToast(
        language === 'la'
          ? 'ລຶບໜ້າວຽກທັງໝົດໃນໂຄງການສຳເລັດແລ້ວ!'
          : 'All project tasks have been cleared!',
        'info'
      );
    } catch (e) {
      console.warn('Clear firestore warning:', e);
      showToast(language === 'la' ? 'ລຶບວຽກໃນເຄື່ອງສຳເລັດແລ້ວ' : 'Local tasks cleared', 'info');
    }
  };

  const handleResetProjectToDemo = async () => {
    setTasks(initialTasks);
    setResources(initialResources);
    setProject(initialProject);
    // Push back demo to cloud
    try {
      await saveProjectToFirestore(initialProject);
      await saveTasksToFirestore(initialTasks);
      await saveResourcesToFirestore(initialResources);
      showToast(
        language === 'la'
          ? 'ຣີເຊັດເປັນຂໍ້ມູນໂຄງການຕົວຢ່າງສຳເລັດແລ້ວ!'
          : 'Project reset to default demo template!',
        'success'
      );
    } catch (e) {
      console.warn('Reset demo error:', e);
      showToast(language === 'la' ? 'ຣີເຊັດຂໍ້ມູນສຳເລັດ' : 'Demo data restored', 'success');
    }
  };

  const handleRenumberAllTasks = async () => {
    const renumbered = renumberTasksWbs(tasks);
    setTasks(renumbered);
    try {
      await saveTasksToFirestore(renumbered);
      showToast(
        language === 'la'
          ? 'ຈັດລຽງລຳດັບເລກທີ 1.0, 2.0... ຄືນໃໝ່ສຳເລັດແລ້ວ!'
          : 'All tasks renumbered sequentially (1.0, 2.0...)!',
        'success'
      );
    } catch (e) {
      console.warn('Renumber firestore error:', e);
      showToast(language === 'la' ? 'ຈັດລຽງລຳດັບເລກທີສຳເລັດ' : 'Tasks renumbered', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Application Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        language={language}
        onLanguageChange={setLanguage}
        project={project}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
        onQuickAddTask={handleOpenAddTask}
        onQuickAddResource={handleOpenAddResource}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : toastMessage.type === 'info'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-emerald-900 text-white border-emerald-700'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-4">
        {viewMode === 'gantt' && (
          <GanttChart
            tasks={tasks}
            resources={resources}
            language={language}
            onSelectTask={handleOpenEditTask}
            onAddTask={handleOpenAddTask}
          />
        )}

        {viewMode === 'table' && (
          <TaskTableView
            tasks={tasks}
            resources={resources}
            language={language}
            onSelectTask={handleOpenEditTask}
            onAddTask={handleOpenAddTask}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus}
            onUpdateAssignee={handleUpdateAssignee}
            onAddResource={handleOpenAddResource}
            onEditResource={handleOpenEditResource}
          />
        )}

        {viewMode === 'resources' && (
          <ResourceManagement
            resources={resources}
            tasks={tasks}
            language={language}
            onAddResource={handleOpenAddResource}
            onEditResource={handleOpenEditResource}
            onDeleteResource={handleDeleteResource}
          />
        )}

        {viewMode === 'board' && (
          <KanbanBoard
            tasks={tasks}
            resources={resources}
            language={language}
            onSelectTask={handleOpenEditTask}
            onAddTask={handleOpenAddTask}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {viewMode === 'analytics' && (
          <ProjectAnalytics
            tasks={tasks}
            resources={resources}
            language={language}
          />
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        task={selectedTask}
        parentTaskId={parentTaskIdForNew}
        tasks={tasks}
        resources={resources}
        language={language}
        onSaveResource={handleSaveResource}
      />

      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        onSave={handleSaveResource}
        onDelete={handleDeleteResource}
        resource={selectedResource}
        language={language}
      />

      <GoogleSheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        project={project}
        user={user}
        tasks={tasks}
        resources={resources}
        language={language}
        onSignIn={handleSignIn}
        onCreateNewSheet={handleCreateNewSheet}
        onSyncToSheet={handleSyncToSheet}
        onPullFromSheet={handlePullFromSheet}
        onLinkExistingSheet={handleLinkExistingSheet}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
        autoSync={autoSync}
        onToggleAutoSync={setAutoSync}
      />

      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        language={language}
        tasks={tasks}
        resources={resources}
        project={project}
        onDataLoaded={(data) => {
          if (data.tasks) setTasks(data.tasks);
          if (data.resources) setResources(data.resources);
          if (data.project) setProject(data.project);
          setLastCloudSynced(new Date());
        }}
        showToast={showToast}
        isCloudConnected={isCloudConnected}
        lastCloudSynced={lastCloudSynced}
      />

      <ProjectSettingsModal
        isOpen={isProjectSettingsOpen}
        onClose={() => setIsProjectSettingsOpen(false)}
        project={project}
        language={language}
        onUpdateProject={handleUpdateProject}
        onClearAllTasks={handleClearAllTasks}
        onResetProjectToDemo={handleResetProjectToDemo}
        onRenumberTasks={handleRenumberAllTasks}
        totalTasks={tasks.length}
      />
    </div>
  );
}
