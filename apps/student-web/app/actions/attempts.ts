"use server";

import { redirect } from "next/navigation";
import { buildRenderableQuestions, createServerSupabaseClient, getPublishedTaskByIdForStudent, getStudentById, gradeQuestions, parseTaskContent, submitAttempt, type QuestionResult, type TaskContent } from "@ielts-pro/shared";
import { isUuid } from "@/lib/ids";
import { requireStudentSession } from "@/lib/session";

export type SubmitResult = {
  ok: boolean;
  error?: string;
  redirectUrl?: string;
  submissionId?: string;
  score?: number | null;
  total?: number | null;
  results?: QuestionResult[] | null;
};

export async function submitTaskAttempt(formData: FormData): Promise<SubmitResult> {
  const session = await requireStudentSession();
  const taskId = String(formData.get("taskId") || "");
  if (!isUuid(taskId)) return { ok: false, error: "unavailable" };

  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const task = await getPublishedTaskByIdForStudent(supabase, taskId, student?.group_id ?? session.group_id);
  if (!task) return { ok: false, error: "unavailable" };

  const content = parseTaskContent<TaskContent>(task.content, { questions: [] });
  const questions = buildRenderableQuestions(content, task);

  if (task.skill === "writing") {
    const answer = String(formData.get("writing_answer") || "").trim();
    if (!answer) return { ok: false, error: "empty" };
    const submission = await submitAttempt(supabase, { studentId: session.id, taskId, answer });
    return { ok: true, redirectUrl: "/results?submitted=writing", submissionId: submission.id };
  }

  const answers: Record<string, unknown> = {};
  questions.forEach((question, index) => {
    if (question.type === "matching" || question.items?.length) {
      const itemAnswers: Record<string, string> = {};
      question.items?.forEach((_, itemIndex) => {
        itemAnswers[String(itemIndex)] = String(formData.get(`q_${index}_${itemIndex}`) || "").trim();
      });
      answers[String(index)] = itemAnswers;
      return;
    }
    if (question.type === "mcq_multi") {
      answers[String(index)] = formData.getAll(`q_${index}`).map(String);
      return;
    }
    answers[String(index)] = String(formData.get(`q_${index}`) || "").trim();
  });

  const { correct, total, results } = gradeQuestions(questions, answers);
  const fullWritingAnswer = String(formData.get("full_writing_answer") || "").trim();
  if (task.skill === "full_test" && fullWritingAnswer) {
    answers.writing_response = fullWritingAnswer;
  }
  const submission = await submitAttempt(supabase, {
    studentId: session.id,
    taskId,
    answer: JSON.stringify(answers),
    score: correct,
    total,
    results
  });
  return {
    ok: true,
    submissionId: submission.id,
    score: correct,
    total,
    results
  };
}
