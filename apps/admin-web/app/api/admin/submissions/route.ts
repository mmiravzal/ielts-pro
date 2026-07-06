import { NextResponse } from "next/server";
import { createServerSupabaseClient, getAllSubmissions } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";

export async function GET(request: Request) {
  await requireAdminSession();
  const url = new URL(request.url);
  const studentId = url.searchParams.get("studentId") || undefined;
  const taskId = url.searchParams.get("taskId") || undefined;
  const skill = url.searchParams.get("skill") || undefined;

  const supabase = createServerSupabaseClient();
  const submissions = await getAllSubmissions(supabase, { studentId, taskId, skill });
  return NextResponse.json(submissions);
}
