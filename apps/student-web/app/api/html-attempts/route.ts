import { NextResponse } from "next/server";
import { createServerSupabaseClient, getPublishedTaskByIdForStudent, getStudentById, submitAttempt, type QuestionResult } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireStudentSession();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const taskId = String(body.taskId || "");
  if (!taskId) return NextResponse.json({ ok: false, error: "Missing taskId." }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const groupId = student?.group_id ?? session.group_id;
  const task = await getPublishedTaskByIdForStudent(supabase, taskId, groupId);
  if (!task || task.source_type !== "html") {
    return NextResponse.json({ ok: false, error: "Test unavailable." }, { status: 404 });
  }

  const score = toCount(body.score);
  const total = toCount(body.total);
  const results = parseResults(body.results);

  await submitAttempt(supabase, {
    studentId: session.id,
    taskId,
    answer: JSON.stringify(body.answers ?? {}),
    score,
    total,
    results
  });

  return NextResponse.json({ ok: true, score, total });
}

function toCount(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed));
}

function parseResults(value: unknown): QuestionResult[] | null {
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const r = item as Record<string, unknown>;
    if (typeof r.questionIndex !== "number") return null;
    if (typeof r.isCorrect !== "boolean") return null;
  }
  return value as QuestionResult[];
}
