import { NextResponse } from "next/server";
import { createServerSupabaseClient, getPublishedTaskByIdForStudent, submitAttempt, type QuestionResult } from "@ielts-pro/shared";
import { isUuid } from "@/lib/ids";
import { requireStudentSession } from "@/lib/session";

export async function GET() {
  return NextResponse.json({ ok: true, message: "html-attempts GET works" });
}

export async function POST(request: Request) {
  try {
    const session = await requireStudentSession();

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const taskId = String(body.taskId || "");
    if (!taskId) return NextResponse.json({ ok: false, error: "Missing taskId." }, { status: 400 });
    if (!isUuid(taskId)) return NextResponse.json({ ok: false, error: "Invalid taskId." }, { status: 400 });

    const supabase = createServerSupabaseClient();
    const groupId = session.group_id;
    const task = await getPublishedTaskByIdForStudent(supabase, taskId, groupId);
    if (!task) {
      return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
    }
    if (!task.html_path) {
      return NextResponse.json({ ok: false, error: "Task has no html_path." }, { status: 404 });
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
  } catch (err) {
    console.error("POST /api/html-attempts unhandled error", err);
    return NextResponse.json(
      { ok: false, error: String((err as Error)?.message || err) },
      { status: 500 }
    );
  }
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
