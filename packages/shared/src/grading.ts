import type { Question, QuestionResult, Task, TaskContent } from "./types";

export function parseTaskContent<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function gradeQuestions(questions: Question[], answers: Record<string, unknown>) {
  const results: QuestionResult[] = [];
  let correct = 0;
  let total = 0;

  questions.forEach((q, index) => {
    const saved = answers[String(index)];

    if ((q.type === "matching" || q.type === "sentence_endings") && q.items?.length) {
      const savedMatch = isRecord(saved) ? saved : {};
      for (const [itemIndex, item] of (q.items || []).entries()) {
        total++;
        const isCorrect = isCorrectAnswer(savedMatch[String(itemIndex)], item.answer);
        if (isCorrect) correct++;
        results.push({
          questionIndex: results.length,
          questionType: q.type,
          question: item.label || "",
          studentAnswer: savedMatch[String(itemIndex)] ?? "",
          correctAnswer: item.answer ?? "",
          isCorrect,
          points: isCorrect ? 1 : 0,
          maxPoints: 1,
        });
      }
      return;
    }

    if (["diagram_label", "table_completion", "summary_completion", "flow_chart", "note_completion", "sentence_completion"].includes(q.type)) {
      const savedMatch = isRecord(saved) ? saved : {};
      for (const [itemIndex, item] of (q.items || []).entries()) {
        total++;
        const isCorrect = isCorrectAnswer(savedMatch[String(itemIndex)], item.answer);
        if (isCorrect) correct++;
        results.push({
          questionIndex: results.length,
          questionType: q.type,
          question: item.label || "",
          studentAnswer: savedMatch[String(itemIndex)] ?? "",
          correctAnswer: item.answer ?? "",
          isCorrect,
          points: isCorrect ? 1 : 0,
          maxPoints: 1,
        });
      }
      return;
    }

    if (q.type === "mcq_multi") {
      const expected = Array.isArray(q.answer) ? q.answer : [];
      const actual = Array.isArray(saved) ? saved.map(String) : [];
      total += expected.length;
      expected.forEach((letter) => {
        if (actual.includes(letter)) correct++;
      });
      results.push({
        questionIndex: results.length,
        questionType: q.type,
        question: q.question ?? "",
        studentAnswer: actual,
        correctAnswer: expected,
        isCorrect: expected.every((l) => actual.includes(l)),
        points: expected.filter((l) => actual.includes(l)).length,
        maxPoints: expected.length,
      });
      return;
    }

    total++;
    let isCorrect = false;
    if (["gap_fill", "short_answer", "matching", "sentence_endings"].includes(q.type)) {
      isCorrect = isCorrectAnswer(saved, q.answer);
      if (isCorrect) correct++;
    } else if (["tfng", "ynng", "mcq"].includes(q.type)) {
      isCorrect = isCorrectAnswer(saved, q.answer);
      if (isCorrect) correct++;
    }
    results.push({
      questionIndex: results.length,
      questionType: q.type,
      question: q.question ?? "",
      studentAnswer: saved ?? "",
      correctAnswer: q.answer ?? "",
      isCorrect,
      points: isCorrect ? 1 : 0,
      maxPoints: 1,
    });
  });

  return { correct, total, results };
}

export function flattenQuestions(content: TaskContent): Question[] {
  return [
    ...(content.questions || []),
    ...((content.sections || []).flatMap((section) => section.questions || []))
  ];
}

export function inferQuestionCount(content: TaskContent, task?: Pick<Task, "question_count" | "answer_count">) {
  const sectionQuestions = (content.sections || []).reduce((total, section) => total + (section.questions?.length || 0), 0);
  const candidates = [
    content.questions?.length,
    sectionQuestions,
    content.question_count,
    task?.question_count,
    content.answer_count,
    task?.answer_count
  ];
  const found = candidates.find((value) => Number.isFinite(Number(value)) && Number(value) > 0);
  return found ? Number(found) : 0;
}

export function buildRenderableQuestions(content: TaskContent, task?: Pick<Task, "skill" | "question_count" | "answer_count">): Question[] {
  const parsed = flattenQuestions(content);
  if (parsed.length) return parsed;

  if (String(task?.skill || "").toLowerCase() === "writing") return [];

  const count = inferQuestionCount(content, task);
  if (!count) return [];

  return Array.from({ length: count }, (_, index) => ({
    type: "short_answer",
    question: `Question ${index + 1}`
  }));
}

export function getTaskAudioUrl(content: TaskContent, task?: Pick<Task, "audio_url">) {
  const sectionAudio = (content.sections || []).find((section) => section.audio_url)?.audio_url || "";
  return (
    content.audio_url ||
    sectionAudio ||
    task?.audio_url ||
    findAudioInHtml(content.imported_html) ||
    findAudioInHtml(content.passage_html) ||
    ""
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalise(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:!?()[\]{}"']+|[\s.,;:!?()[\]{}"']+$/g, "")
    .trim();
}

function isCorrectAnswer(actual: unknown, expected: unknown) {
  const expectedValue = normalise(expected);
  if (!expectedValue) return false;
  return normalise(actual) === expectedValue;
}

function findAudioInHtml(html?: string) {
  if (!html) return "";
  const sourceMatch = html.match(/<(?:audio|source)[^>]+src=["']([^"']+\.(?:mp3|wav|m4a|ogg)(?:\?[^"']*)?)["']/i);
  if (sourceMatch?.[1]) return sourceMatch[1];
  const linkMatch = html.match(/href=["']([^"']+\.(?:mp3|wav|m4a|ogg)(?:\?[^"']*)?)["']/i);
  return linkMatch?.[1] || "";
}
