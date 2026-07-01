import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, Lesson, NewTaskInput, Student, StudentDeviceSession, Submission, Task } from "./types.js";

export async function getPublishedLessons(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("published", true)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data || []) as Lesson[];
}

export async function getPublishedTasks(supabase: SupabaseClient) {
  const lessons = await getPublishedLessons(supabase);
  const lessonIds = lessons.map((lesson) => lesson.id);
  if (!lessonIds.length) return { lessons, tasks: [] as Task[] };
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .in("lesson_id", lessonIds)
    .order("order", { ascending: true });
  if (error) throw error;
  return { lessons, tasks: (data || []) as Task[] };
}

export async function getStudentByCode(supabase: SupabaseClient, name: string, code: string) {
  const { data, error } = await supabase
    .from("students")
    .select("*,groups(name)")
    .ilike("name", name)
    .eq("student_code", code)
    .maybeSingle();
  if (error) throw error;
  return data as Student | null;
}

export async function getOpenStudentByAccessId(supabase: SupabaseClient, name: string, accessId: string) {
  const student = await getStudentByCode(supabase, name, accessId);
  if (!student) return { student: null, reason: "not_found" as const };
  if (student.is_active === false || student.access_status === "closed") {
    return { student: null, reason: "closed" as const };
  }
  return { student, reason: "open" as const };
}

export async function createStudentAccess(supabase: SupabaseClient, input: { name: string; accessId: string; groupId?: string | null; maxDevices?: number | null }) {
  const { data, error } = await supabase
    .from("students")
    .insert({
      name: input.name,
      student_code: input.accessId,
      group_id: input.groupId ?? null,
      is_active: true,
      access_status: "open",
      max_devices: input.maxDevices ?? null
    })
    .select("*,groups(name)")
    .single();
  if (error) throw error;
  return data as Student;
}

export async function setStudentAccessStatus(supabase: SupabaseClient, studentId: string, open: boolean) {
  const { data, error } = await supabase
    .from("students")
    .update({ is_active: open, access_status: open ? "open" : "closed", updated_at: new Date().toISOString() })
    .eq("id", studentId)
    .select("*,groups(name)")
    .single();
  if (error) throw error;
  return data as Student;
}

export async function touchStudentLogin(supabase: SupabaseClient, studentId: string) {
  const { error } = await supabase
    .from("students")
    .update({ last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", studentId);
  if (error) throw error;
}

export async function createStudentDeviceSession(
  supabase: SupabaseClient,
  input: { studentId: string; sessionTokenHash: string; userAgent?: string | null; deviceLabel?: string | null; deviceFingerprintHash?: string | null }
) {
  const { data, error } = await supabase
    .from("student_device_sessions")
    .insert({
      student_id: input.studentId,
      session_token_hash: input.sessionTokenHash,
      user_agent: input.userAgent ?? null,
      device_label: input.deviceLabel ?? null,
      device_fingerprint_hash: input.deviceFingerprintHash ?? null,
      is_active: true
    })
    .select()
    .single();
  if (error) throw error;
  return data as StudentDeviceSession;
}

export async function validateStudentDeviceSession(
  supabase: SupabaseClient,
  input: { studentId: string; deviceSessionId: string; sessionTokenHash: string; userAgent?: string | null }
) {
  const { data, error } = await supabase
    .from("student_device_sessions")
    .select("*,students(name,student_code,is_active,access_status)")
    .eq("id", input.deviceSessionId)
    .eq("student_id", input.studentId)
    .eq("session_token_hash", input.sessionTokenHash)
    .maybeSingle();
  if (error) throw error;
  const session = data as StudentDeviceSession | null;
  if (!session || session.is_active === false || session.revoked_at) return false;
  const student = session.students as Student | null | undefined;
  if (student?.is_active === false || student?.access_status === "closed") return false;
  await supabase
    .from("student_device_sessions")
    .update({ last_seen_at: new Date().toISOString(), user_agent: input.userAgent ?? session.user_agent })
    .eq("id", input.deviceSessionId);
  return true;
}

export async function getStudentDeviceSessions(supabase: SupabaseClient, studentId?: string) {
  let query = supabase
    .from("student_device_sessions")
    .select("*,students(name,student_code)")
    .order("created_at", { ascending: false });
  if (studentId) query = query.eq("student_id", studentId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as StudentDeviceSession[];
}

export async function revokeStudentDeviceSession(supabase: SupabaseClient, sessionId: string, revokedByEmail?: string | null) {
  const { error } = await supabase
    .from("student_device_sessions")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by_email: revokedByEmail ?? null
    })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function revokeAllStudentDeviceSessions(supabase: SupabaseClient, studentId: string, revokedByEmail?: string | null) {
  const { error } = await supabase
    .from("student_device_sessions")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by_email: revokedByEmail ?? null
    })
    .eq("student_id", studentId)
    .eq("is_active", true);
  if (error) throw error;
}

export async function getStudentSubmissions(supabase: SupabaseClient, studentId: string) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*,tasks(title,skill,lessons(title))")
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Submission[];
}

export async function getPublishedTaskById(supabase: SupabaseClient, taskId: string) {
  const { data: task, error } = await supabase
    .from("tasks")
    .select("*,lessons(title,published)")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw error;
  const typed = task as Task | null;
  if (!typed || typed.lessons?.published !== true) return null;
  return typed;
}

export async function getSubmissionForTask(supabase: SupabaseClient, studentId: string, taskId: string) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("student_id", studentId)
    .eq("task_id", taskId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Submission | null;
}

export async function submitAttempt(
  supabase: SupabaseClient,
  input: { studentId: string; taskId: string; answer: string; score?: number | null; total?: number | null }
) {
  const { data, error } = await supabase
    .from("submissions")
    .insert({
      student_id: input.studentId,
      task_id: input.taskId,
      answer: input.answer,
      score: input.score ?? null,
      total: input.total ?? null
    })
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
}

export async function getAdminDashboardStats(supabase: SupabaseClient) {
  const [groups, students, lessons, tasks, submissions] = await Promise.all([
    getAllGroups(supabase),
    getAllStudents(supabase),
    getAllLessons(supabase),
    getAllTasks(supabase),
    getWritingSubmissions(supabase)
  ]);
  return {
    groups,
    students,
    lessons,
    tasks,
    submissions,
    pendingWriting: submissions.filter((submission) => submission.tasks?.skill === "writing" && submission.score == null)
  };
}

export async function getAllGroups(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("groups").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data || []) as Group[];
}

export async function getAllStudents(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("students").select("*,groups(name)").order("name", { ascending: true });
  if (error) throw error;
  return (data || []) as Student[];
}

export async function getAllLessons(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("lessons").select("*").order("order", { ascending: true });
  if (error) throw error;
  return (data || []) as Lesson[];
}

export async function getAllTasks(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("tasks").select("*,lessons(title,published)").order("order", { ascending: true });
  if (error) throw error;
  return (data || []) as Task[];
}

export async function createLesson(supabase: SupabaseClient, input: Pick<Lesson, "title" | "description" | "order" | "published" | "skill">) {
  const { data, error } = await supabase.from("lessons").insert(input).select().single();
  if (error) throw error;
  return data as Lesson;
}

export async function createTask(supabase: SupabaseClient, input: NewTaskInput) {
  const { data, error } = await supabase.from("tasks").insert(input).select().single();
  if (error) throw error;
  return data as Task;
}

export async function updateLesson(supabase: SupabaseClient, id: string, input: Partial<Pick<Lesson, "title" | "description" | "order" | "published" | "skill">>) {
  const { data, error } = await supabase.from("lessons").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Lesson;
}

export async function getWritingSubmissions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*,students(name,student_code),tasks(title,skill,lessons(title))")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Submission[];
}

export async function reviewWritingSubmission(supabase: SupabaseClient, submissionId: string, input: { score: number | null; feedback: string | null }) {
  const { data, error } = await supabase
    .from("submissions")
    .update({ score: input.score, feedback: input.feedback })
    .eq("id", submissionId)
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
}
