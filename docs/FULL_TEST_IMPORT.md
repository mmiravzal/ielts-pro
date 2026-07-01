# Full Test Import Format

Admin route: `/full-tests/new`

The JSON import creates one `lessons` row and one `tasks` row with `skill = "full_test"`.

## Minimal Shape

```json
{
  "title": "Academic Full Test 1",
  "description": "Reading, listening, and writing practice",
  "published": false,
  "duration_minutes": 180,
  "difficulty": "academic",
  "sections": [
    {
      "skill": "reading",
      "title": "Reading Passage 1",
      "passage_html": "<h2>Urban transport</h2><p>Passage text...</p>",
      "questions": [
        {
          "type": "mcq",
          "question": "What is the main idea?",
          "options": ["Transport cost", "City planning", "Rail history"],
          "answer": "B"
        }
      ]
    },
    {
      "skill": "listening",
      "title": "Listening Section 1",
      "audio_url": "https://example.com/audio.mp3",
      "questions": [
        {
          "type": "short_answer",
          "question": "What time does it start?",
          "answer": "9:30"
        }
      ]
    },
    {
      "skill": "writing",
      "title": "Writing Task 2",
      "prompt": "Some people believe..."
    }
  ]
}
```

## Supported Question Types

- `mcq`: stores options and one answer letter.
- `mcq_multi`: stores options and multiple answer letters.
- `short_answer`: text answer.
- `gap_fill`, `summary_completion`, `table_completion`, `note_completion`, `flow_chart`, `diagram_label`: use `items`.
- `matching`, `sentence_endings`: use `items` and optional `matchOptions`.

## Audio

The manual builder can upload audio to the Supabase `task-media` bucket through the server action. JSON import expects an existing `audio_url`.

For production playback, the uploaded object must be publicly readable or served through a signed URL strategy.

## Publishing

- `published: false` keeps the full test hidden from students.
- `published: true` makes the lesson visible immediately.
- Admin direct preview needs `NEXT_PUBLIC_STUDENT_APP_URL` on the admin Vercel project.
