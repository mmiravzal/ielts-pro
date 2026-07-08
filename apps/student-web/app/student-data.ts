import "server-only";

import {
  createServerSupabaseClient,
  getPublishedTasksForStudent,
  getStudentById,
  getStudentSubmissions,
  type Lesson,
  type Student,
  type StudentSession,
  type Submission,
  type Task
} from "@ielts-pro/shared";

export type StudentWorkspaceData = {
  groupId: string | null;
  groupName: string | null;
  student: Student | null;
  lessons: Lesson[];
  tasks: Task[];
  submissions: Submission[];
  unavailable: boolean;
  errorMessage: string | null;
};

const WORKSPACE_CACHE_TTL_MS = 10_000;
const MAX_WORKSPACE_CACHE_ENTRIES = 100;

const workspaceCache = new Map<string, { expiresAt: number; data: StudentWorkspaceData }>();

export async function getStudentWorkspaceData(session: StudentSession): Promise<StudentWorkspaceData> {
  const cacheKey = getWorkspaceCacheKey(session);
  const cached = workspaceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  if (cached) workspaceCache.delete(cacheKey);

  const supabase = createServerSupabaseClient();

  try {
    const sessionGroupId = session.group_id ?? null;
    const studentTasksPromise = sessionGroupId
      ? getPublishedTasksForStudent(supabase, sessionGroupId)
      : Promise.resolve(null);
    const [student, submissions, sessionWorkspace] = await Promise.all([
      getStudentById(supabase, session.id),
      getStudentSubmissions(supabase, session.id),
      studentTasksPromise
    ]);
    const groupId = student?.group_id ?? sessionGroupId;
    const groupName = student?.groups?.name ?? (groupId ? "Assigned group" : null);
    const workspace = sessionWorkspace && groupId === sessionGroupId
      ? sessionWorkspace
      : await getPublishedTasksForStudent(supabase, groupId);

    const data = {
      groupId,
      groupName,
      student,
      lessons: workspace.lessons,
      tasks: workspace.tasks,
      submissions,
      unavailable: false,
      errorMessage: null
    };

    rememberWorkspace(cacheKey, data);
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Practice data could not be loaded.";

    return {
      groupId: session.group_id ?? null,
      groupName: session.group_id ? "Assigned group" : null,
      student: null,
      lessons: [],
      tasks: [],
      submissions: [],
      unavailable: true,
      errorMessage: message
    };
  }
}

function getWorkspaceCacheKey(session: StudentSession) {
  return `${session.id}:${session.group_id ?? "no-group"}`;
}

function rememberWorkspace(cacheKey: string, data: StudentWorkspaceData) {
  if (workspaceCache.size >= MAX_WORKSPACE_CACHE_ENTRIES) {
    const oldestKey = workspaceCache.keys().next().value;
    if (oldestKey) workspaceCache.delete(oldestKey);
  }
  workspaceCache.set(cacheKey, { expiresAt: Date.now() + WORKSPACE_CACHE_TTL_MS, data });
}
