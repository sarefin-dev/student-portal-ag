import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { addQuestion, deleteQuestion } from '../actions';

export default async function AssessmentEditorPage({ params }: { params: Promise<{ id: string, assessmentId: string }> }) {
  const { id: courseId, assessmentId } = await params;
  const supabase = await createClient();

  const { data: assessment } = await supabase
    .from('assessments')
    .select('*, assessment_questions(*)')
    .eq('id', assessmentId)
    .single();

  if (!assessment) notFound();

  assessment.assessment_questions?.sort((a: any, b: any) => a.position - b.position);

  return (
    <div className="space-y-6">
      <div className="flex h-14 items-center border-b pb-4 mb-6">
        <Link href={`/instructor/courses/${courseId}/assessments`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to Assessments
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Assessment: {assessment.title}</h1>
        <p className="text-muted-foreground">Add questions to this assessment.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Questions List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Questions</h2>
          {(!assessment.assessment_questions || assessment.assessment_questions.length === 0) ? (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
              This assessment is empty. Add a question from the right.
            </div>
          ) : (
            <div className="space-y-4">
              {assessment.assessment_questions.map((q: any) => (
                <div key={q.id} className="rounded-lg border bg-card p-4 shadow-sm flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize mb-2">
                      {q.question_type.replace('_', ' ')}
                    </span>
                    <p className="font-medium whitespace-pre-wrap">{q.prompt}</p>
                    
                    {q.question_type === 'mcq' && q.options && (
                      <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                        {q.options.map((opt: any) => (
                          <li key={opt.id} className={opt.id === q.correct_option_id ? "text-success font-medium" : ""}>
                            {opt.text} {opt.id === q.correct_option_id && "(Correct)"}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.question_type === 'short_answer' && q.grading_rubric_hint && (
                      <div className="mt-3 bg-muted p-3 rounded text-sm">
                        <span className="font-semibold text-xs uppercase text-muted-foreground block mb-1">Grading Rubric</span>
                        {q.grading_rubric_hint}
                      </div>
                    )}
                  </div>
                  <form action={deleteQuestion}>
                    <input type="hidden" name="questionId" value={q.id} />
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" type="submit">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Question Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <h3 className="font-semibold border-b pb-2">Add MCQ</h3>
            <form action={addQuestion} className="space-y-3">
              <input type="hidden" name="assessmentId" value={assessmentId} />
              <input type="hidden" name="questionType" value="mcq" />
              <input type="hidden" name="position" value={(assessment.assessment_questions?.length || 0) + 1} />
              
              <div>
                <label className="text-xs font-medium">Question Prompt</label>
                <textarea name="prompt" required rows={2} className="flex w-full rounded border bg-background px-3 py-2 text-sm mt-1" />
              </div>
              
              <div className="space-y-2 border-t pt-2">
                <label className="text-xs font-medium block">Options</label>
                <div className="flex items-center gap-2">
                  <input type="radio" name="correctOption" value="a" required defaultChecked />
                  <input name="optA" required placeholder="Option A" className="flex h-8 w-full rounded border px-2 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" name="correctOption" value="b" required />
                  <input name="optB" required placeholder="Option B" className="flex h-8 w-full rounded border px-2 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" name="correctOption" value="c" required />
                  <input name="optC" required placeholder="Option C" className="flex h-8 w-full rounded border px-2 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" name="correctOption" value="d" required />
                  <input name="optD" required placeholder="Option D" className="flex h-8 w-full rounded border px-2 text-sm" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Select the radio button next to the correct answer.</p>
              </div>
              
              <Button type="submit" size="sm" className="w-full"><Plus className="w-4 h-4 mr-1" /> Add MCQ</Button>
            </form>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <h3 className="font-semibold border-b pb-2">Add Short Answer</h3>
            <form action={addQuestion} className="space-y-3">
              <input type="hidden" name="assessmentId" value={assessmentId} />
              <input type="hidden" name="questionType" value="short_answer" />
              <input type="hidden" name="position" value={(assessment.assessment_questions?.length || 0) + 1} />
              
              <div>
                <label className="text-xs font-medium">Question Prompt</label>
                <textarea name="prompt" required rows={2} className="flex w-full rounded border bg-background px-3 py-2 text-sm mt-1" />
              </div>
              
              <div>
                <label className="text-xs font-medium">Ideal Answer / Grading Rubric</label>
                <textarea name="rubric" required rows={3} placeholder="Provide the exact facts the AI should look for when grading." className="flex w-full rounded border bg-background px-3 py-2 text-sm mt-1" />
              </div>
              
              <Button type="submit" size="sm" className="w-full"><Plus className="w-4 h-4 mr-1" /> Add Short Answer</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
