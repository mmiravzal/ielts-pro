import Link from "next/link";
import { Badge, Button, Card, ErrorState, Input, Select } from "@ielts-pro/ui";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../../components/AdminShell";
import { importHtmlContentAction } from "../../actions/lms";

const readingTypes = [
  "Matching Headings",
  "True / False / Not Given",
  "Yes / No / Not Given",
  "Multiple Choice",
  "Matching Information",
  "Matching Features",
  "Matching Sentence Endings",
  "Sentence Completion",
  "Summary Completion",
  "Note Completion",
  "Table Completion",
  "Flow-chart Completion",
  "Diagram Label Completion",
  "Short Answer Questions"
];

const listeningTypes = [
  "Form Completion",
  "Note Completion",
  "Table Completion",
  "Flow-chart Completion",
  "Multiple Choice",
  "Matching",
  "Plan / Map / Diagram Labelling",
  "Sentence Completion",
  "Short Answer Questions"
];

export default async function NewFullTestPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; saved?: string; task?: string; name?: string; skill?: string; questions?: string; answers?: string; audio?: string; warnings?: string }>;
}) {
  const admin = await requireAdminSession();
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";
  const saved = params.saved === "1";

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero builder-hero-light">
        <div>
          <p className="eyebrow">Test Builder</p>
          <h1>Import IELTS HTML into the content library.</h1>
          <p className="muted">Upload HTML only. The item is saved as a draft in Content Studio and stays hidden until you attach it to a published group lesson.</p>
        </div>
        <Link className="btn btn-secondary" href="/lessons">Open Content Studio</Link>
      </div>

      {error ? <ErrorState title="Import failed" body={error} /> : null}

      {saved ? (
        <Card className="panel import-success-panel">
          <div>
            <Badge tone="success">Saved to Content Studio</Badge>
            <h2>{params.name || "Imported HTML content"}</h2>
            <p className="muted">Draft content was created. It is not visible to students until a teacher attaches it to a lesson and publishes that lesson.</p>
          </div>
          <div className="parsed-summary-grid">
            <Summary label="Skill" value={labelFor(params.skill || "reading")} />
            <Summary label="Questions" value={params.questions || "0"} />
            <Summary label="Answer keys" value={params.answers || "0"} />
            <Summary label="Audio" value={params.audio === "yes" ? "Detected" : "Not detected"} />
            <Summary label="Warnings" value={params.warnings || "0"} />
          </div>
          <div className="success-actions">
            <Link className="btn btn-primary" href="/lessons">Open in Content Studio</Link>
            <Link className="btn btn-secondary" href="/lessons#lesson-builder">Attach to lesson now</Link>
            <Link className="btn btn-secondary" href="/full-tests/new">Import another</Link>
          </div>
        </Card>
      ) : null}

      <div className="test-builder-grid">
        <section className="wizard-main">
          <Card className="panel wizard-card">
            <div className="wizard-steps" aria-label="Import steps">
              <span className="is-active">1 Choose mode</span>
              <span>2 Choose structure</span>
              <span>3 Upload HTML</span>
              <span>4 Review summary</span>
              <span>5 Save draft</span>
            </div>

            <form action={importHtmlContentAction} className="html-import-form" encType="multipart/form-data">
              <section className="builder-section">
                <div>
                  <p className="eyebrow">Step 1</p>
                  <h2>Import mode</h2>
                  <p className="muted">Choose how this content should be organized in Content Studio.</p>
                </div>
                <div className="mode-grid">
                  <label className="mode-option">
                    <input type="radio" name="import_mode" value="full_mock" />
                    <strong>Full Mock</strong>
                    <span>Complete mock or section-by-section mock upload.</span>
                  </label>
                  <label className="mode-option">
                    <input type="radio" name="import_mode" value="full_test" />
                    <strong>Full Test</strong>
                    <span>Full Reading, Listening, Writing, Speaking, or full IELTS bundle.</span>
                  </label>
                  <label className="mode-option">
                    <input type="radio" name="import_mode" value="separate_skill" defaultChecked />
                    <strong>Separate Skill</strong>
                    <span>One passage, part, task, or speaking prompt.</span>
                  </label>
                </div>
              </section>

              <section className="builder-section builder-section-compact">
                <div>
                  <p className="eyebrow">Step 2</p>
                  <h2>Structure</h2>
                </div>
                <div className="builder-fields-grid">
                  <label>
                    Skill
                    <Select name="skill" defaultValue="reading">
                      <option value="reading">Reading</option>
                      <option value="listening">Listening</option>
                      <option value="writing">Writing</option>
                      <option value="full_test">Full IELTS Test</option>
                    </Select>
                  </label>
                  <label>
                    Structure
                    <Select name="import_structure" defaultValue="reading_passage_1">
                      <optgroup label="Reading">
                        <option value="reading_full">Full Reading</option>
                        <option value="reading_passage_1">Reading Passage 1</option>
                        <option value="reading_passage_2">Reading Passage 2</option>
                        <option value="reading_passage_3">Reading Passage 3</option>
                      </optgroup>
                      <optgroup label="Listening">
                        <option value="listening_full">Full Listening</option>
                        <option value="listening_part_1">Listening Part 1</option>
                        <option value="listening_part_2">Listening Part 2</option>
                        <option value="listening_part_3">Listening Part 3</option>
                        <option value="listening_part_4">Listening Part 4</option>
                      </optgroup>
                      <optgroup label="Writing">
                        <option value="writing_task_1">Writing Task 1</option>
                        <option value="writing_task_2">Writing Task 2</option>
                        <option value="writing_both_tasks">Writing Tasks 1 and 2</option>
                      </optgroup>
                      <optgroup label="Full">
                        <option value="full_mock_one_file">One full mock HTML</option>
                        <option value="full_ielts_test">Full IELTS Test</option>
                      </optgroup>
                    </Select>
                  </label>
                  <label>
                    Question type
                    <Select name="question_type" defaultValue="Note Completion">
                      <optgroup label="Reading">
                        {readingTypes.map((type) => <option value={type} key={type}>{type}</option>)}
                      </optgroup>
                      <optgroup label="Listening">
                        {listeningTypes.map((type) => <option value={type} key={type}>{type}</option>)}
                      </optgroup>
                    </Select>
                  </label>
                  <label>
                    Subtype label
                    <Input name="subtype" placeholder="Passage 1, Part 3, Task 2..." />
                  </label>
                </div>
              </section>

              <section className="builder-section">
                <div>
                  <p className="eyebrow">Step 3</p>
                  <h2>HTML upload</h2>
                  <p className="muted">Only `.html` or `.htm` is accepted. The parser strips scripts and unsafe event handlers before saving.</p>
                </div>
                <div className="file-upload-card">
                  <span aria-hidden="true">HTML</span>
                  <div>
                    <strong>Drop or choose an IELTS HTML file</strong>
                    <small>JSON, PDF, DOCX, TXT are rejected.</small>
                  </div>
                  <Input name="html_file" type="file" accept=".html,.htm,text/html" required />
                </div>
                <div className="builder-fields-grid two-fields">
                  <label>
                    Content name
                    <Input name="content_name" placeholder="RT11 Reading Passage 1" />
                  </label>
                  <label>
                    Listening audio URL
                    <Input name="manual_audio_url" placeholder="Optional if audio is not inside HTML" />
                  </label>
                </div>
              </section>

              <section className="builder-section save-draft-section">
                <div>
                  <p className="eyebrow">Step 4-5</p>
                  <h2>Save as draft content</h2>
                  <p className="muted">After import, check the parsed summary above, then attach it to a group lesson inside Content Studio.</p>
                </div>
                <Button type="submit">Import HTML to Content Studio</Button>
              </section>
            </form>
          </Card>
        </section>

        <aside className="wizard-side">
          <Card className="panel">
            <p className="eyebrow">Visibility rule</p>
            <h2>Draft first, publish later.</h2>
            <div className="checklist">
              <span>Import creates draft content.</span>
              <span>Draft content is hidden from Student Site.</span>
              <span>Attach content to a lesson in Content Studio.</span>
              <span>Publish lesson after group and content are checked.</span>
            </div>
          </Card>
          <Card className="panel">
            <p className="eyebrow">Parser checks</p>
            <h2>What gets detected</h2>
            <div className="parser-checks">
              <span>Title from title/h1/h2/file name</span>
              <span>Question inputs and numbered lines</span>
              <span>Answer-key markers and data-answer</span>
              <span>Audio from audio/source/direct mp3 links</span>
            </div>
          </Card>
        </aside>
      </div>
    </AdminShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="parsed-summary">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function labelFor(skill: string) {
  if (skill === "reading") return "Reading";
  if (skill === "listening") return "Listening";
  if (skill === "writing") return "Writing";
  if (skill === "full_test") return "Full Test";
  return skill;
}
