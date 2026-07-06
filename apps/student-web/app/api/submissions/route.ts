import { NextResponse } from "next/server";
import { createServerSupabaseClient, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";

export async function GET() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const submissions = await getStudentSubmissions(supabase, session.id);
  return NextResponse.json(submissions);
}
