import { NextResponse } from "next/server";
import { createServerSupabaseClient, getSubmissionDetail } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  await requireAdminSession();
  const { submissionId } = await params;
  const supabase = createServerSupabaseClient();
  const submission = await getSubmissionDetail(supabase, submissionId);
  if (!submission) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }
  return NextResponse.json(submission);
}
