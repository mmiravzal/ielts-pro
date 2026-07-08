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

export async function getStudentWorkspaceData(session: StudentSession): Promise<StudentWorkspaceData> {
  const supabase = createServerSupabaseClient();

  try {
    const student = await getStudentById(supabase, session.id);
    const groupId = student?.group_id ?? session.group_id ?? null;
    const groupName = student?.groups?.name ?? (groupId ? "Assigned group" : null);
    const [{ lessons, tasks }, submissions] = await Promise.all([
      getPublishedTasksForStudent(supabase, groupId),
      getStudentSubmissions(supabase, session.id)
    ]);

    return {
      groupId,
      groupName,
      student,
      lessons,
      tasks,
      submissions,
      unavailable: false,
      errorMessage: null
    };
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
