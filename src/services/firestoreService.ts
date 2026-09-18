import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Task, Resource, ProjectInfo } from '../types';

let app: any = null;
let dbInstance: any = null;

try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    // Use the provisioned databaseId if provided in config, otherwise default
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    if (dbId) {
      dbInstance = getFirestore(app, dbId);
    } else {
      dbInstance = getFirestore(app);
    }
  }
} catch (e) {
  console.warn('Firestore initialization warning:', e);
}

export const db = dbInstance;

const PROJECT_ID = 'default-project';

/**
 * Save / Update a Project in Firestore
 */
export async function saveProjectToFirestore(project: ProjectInfo): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const projectRef = doc(db, 'projects', project.id || PROJECT_ID);
  await setDoc(
    projectRef,
    {
      ...project,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Save all tasks in batch to Firestore
 */
export async function saveTasksToFirestore(tasks: Task[], projectId: string = PROJECT_ID): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const batch = writeBatch(db);

  tasks.forEach((task) => {
    const taskRef = doc(db, 'tasks', task.id);
    batch.set(
      taskRef,
      {
        ...task,
        projectId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });

  await batch.commit();
}

/**
 * Save a single task to Firestore
 */
export async function saveTaskToFirestore(task: Task, projectId: string = PROJECT_ID): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const taskRef = doc(db, 'tasks', task.id);
  await setDoc(
    taskRef,
    {
      ...task,
      projectId,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Delete a single task from Firestore
 */
export async function deleteTaskFromFirestore(taskId: string): Promise<void> {
  if (!db) return;
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
}

/**
 * Save all resources in batch to Firestore
 */
export async function saveResourcesToFirestore(resources: Resource[], projectId: string = PROJECT_ID): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const batch = writeBatch(db);

  resources.forEach((resource) => {
    const resRef = doc(db, 'resources', resource.id);
    batch.set(
      resRef,
      {
        ...resource,
        projectId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });

  await batch.commit();
}

/**
 * Save a single resource to Firestore
 */
export async function saveResourceToFirestore(resource: Resource, projectId: string = PROJECT_ID): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const resRef = doc(db, 'resources', resource.id);
  await setDoc(
    resRef,
    {
      ...resource,
      projectId,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Delete a single resource from Firestore
 */
export async function deleteResourceFromFirestore(resourceId: string): Promise<void> {
  if (!db) return;
  const resRef = doc(db, 'resources', resourceId);
  await deleteDoc(resRef);
}

/**
 * Load initial data from Firestore
 */
export async function loadInitialDataFromFirestore(projectId: string = PROJECT_ID): Promise<{
  tasks: Task[] | null;
  resources: Resource[] | null;
  project: ProjectInfo | null;
}> {
  if (!db) return { tasks: null, resources: null, project: null };

  try {
    // 1. Fetch tasks
    const tasksCol = collection(db, 'tasks');
    const tasksSnapshot = await getDocs(tasksCol);
    const tasks: Task[] = [];
    tasksSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.projectId || data.projectId === projectId) {
        tasks.push(data as Task);
      }
    });

    // 2. Fetch resources
    const resCol = collection(db, 'resources');
    const resSnapshot = await getDocs(resCol);
    const resources: Resource[] = [];
    resSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.projectId || data.projectId === projectId) {
        resources.push(data as Resource);
      }
    });

    // 3. Fetch project
    const projectCol = collection(db, 'projects');
    const projectSnapshot = await getDocs(projectCol);
    let project: ProjectInfo | null = null;
    projectSnapshot.forEach((docSnap) => {
      if (docSnap.id === projectId) {
        project = docSnap.data() as ProjectInfo;
      }
    });

    return {
      tasks: tasks.length > 0 ? tasks : null,
      resources: resources.length > 0 ? resources : null,
      project,
    };
  } catch (error) {
    console.error('Error loading data from Firestore:', error);
    return { tasks: null, resources: null, project: null };
  }
}

/**
 * Subscribe to real-time changes in Firestore
 */
export function subscribeToFirestore(
  projectId: string = PROJECT_ID,
  onTasksUpdate: (tasks: Task[]) => void,
  onResourcesUpdate: (resources: Resource[]) => void
): () => void {
  if (!db) return () => {};

  const tasksCol = collection(db, 'tasks');
  const unsubTasks = onSnapshot(
    tasksCol,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.projectId || data.projectId === projectId) {
          tasks.push(data as Task);
        }
      });
      if (tasks.length > 0) {
        onTasksUpdate(tasks);
      }
    },
    (err) => {
      console.warn('Realtime tasks listener warning:', err);
    }
  );

  const resCol = collection(db, 'resources');
  const unsubResources = onSnapshot(
    resCol,
    (snapshot) => {
      const resources: Resource[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.projectId || data.projectId === projectId) {
          resources.push(data as Resource);
        }
      });
      if (resources.length > 0) {
        onResourcesUpdate(resources);
      }
    },
    (err) => {
      console.warn('Realtime resources listener warning:', err);
    }
  );

  return () => {
    unsubTasks();
    unsubResources();
  };
}
