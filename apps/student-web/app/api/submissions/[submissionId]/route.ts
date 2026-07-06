import { NextResponse } from "next/server";
import { createServerSupabaseClient, getSubmissionDetail } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const session = await requireStudentSession();
  const { submissionId } = await params;
  const supabase = createServerSupabaseClient();
  const submission = await getSubmissionDetail(supabase, submissionId);
  if (!submission) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }
  if (submission.student_id !== session.id) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
  return NextResponse.json(submission);
}
