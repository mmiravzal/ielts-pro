# HTML Test Upload

Teachers can upload a self-contained interactive HTML test. Students open it in a
new tab, and the score is saved automatically to their progress.

Admin route: `/html-tests/new` (admin app).

## How it works

1. Admin uploads an `.html` file + title, skill, optional type label, publish toggle.
2. The raw file is stored in the private Supabase Storage bucket `html-tests` as
   `{taskId}.html`. A `tasks` row is created with `source_type = "html"`.
3. In the student app, the test appears in the matching skill list like any task.
   "Start" opens `/tests/html/{taskId}` in a new tab.
4. That route serves the file **from our own origin** (so the student's HTTP-only
   session cookie is sent) and injects a small bridge script.

## Required contract

The uploaded HTML must call the injected global when the test is finished:

```js
window.submitIeltsScore({
  score: 7,          // number of correct answers
  total: 10,         // number of questions
  answers: { /* optional: whatever you want to keep, saved as JSON */ }
});
```

- `submitIeltsScore` is provided automatically by the platform — do **not** define it yourself.
- It POSTs to `/api/html-attempts` using the same-origin session cookie and writes
  a row to `submissions` (`score`, `total`, `answer`). The result then shows on the
  student's progress page and in the admin submissions list.
- Call it once, after the student submits inside your test.

Minimal example inside your HTML:

```html
<button onclick="finish()">Submit</button>
<script>
  function finish() {
    // ...your own grading logic computes correct/total...
    window.submitIeltsScore({ score: correct, total: questions.length });
  }
</script>
```

## Security notes

- The file is private: only the server (service role) reads it. Students never get
  a direct storage URL.
- The page runs on our origin but the session cookie is `httpOnly`, so test scripts
  cannot read or steal it.
- Only admins can upload, so the HTML is treated as trusted content.

## Limitation

The score is computed inside the uploaded HTML (client side), so a determined
student could alter it. Use this for practice/self-assessment. For tamper-resistant
grading, use the JSON Test Builder (`/full-tests/new`), where answers are graded
server-side.
