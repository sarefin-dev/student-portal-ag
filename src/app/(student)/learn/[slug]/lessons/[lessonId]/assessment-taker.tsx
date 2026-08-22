'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { submitAssessment } from './actions';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export function AssessmentTaker({ assessment, courseId }: { assessment: any, courseId: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const questions = assessment.assessment_questions?.sort((a: any, b: any) => a.position - b.position) || [];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitAssessment(assessment.id, courseId, answers);
      setResult(res);
    } catch (e) {
      console.error(e);
      alert("Failed to submit assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="mt-16 rounded border bg-muted/30 p-8 text-center space-y-4">
        {status === 'passed' ? (
          <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
        ) : status === 'needs_review' ? (
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
        ) : (
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
        )}
        <h2 className="text-2xl font-bold">
          {result.status === 'passed' ? 'Assessment Passed!' : result.status === 'needs_review' ? 'Submitted for Review' : 'Assessment Failed'}
        </h2>
        <p className="text-muted-foreground text-lg">Score: {result.score}%</p>
        
        {/* Render AI Feedback if any */}
        {result.feedback && (
          <div className="mt-6 text-left bg-card border p-4 rounded">
            <div className="inline-flex items-center gap-1 bg-accent text-primary px-2 py-1 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>AI Feedback</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{result.feedback}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-16 pt-8 border-t space-y-8">
      <div>
        <h2 className="text-2xl font-bold">{assessment.title}</h2>
        {assessment.instructions && <p className="text-muted-foreground mt-2">{assessment.instructions}</p>}
      </div>

      <div className="space-y-8">
        {questions.map((q: any, i: number) => (
          <div key={q.id} className="space-y-4">
            <h3 className="font-medium text-lg"><span className="text-muted-foreground mr-2">{i + 1}.</span> {q.prompt}</h3>
            
            {q.question_type === 'mcq' && (
              <div className="space-y-2 ml-6">
                {q.options?.map((opt: any) => (
                  <label key={opt.id} className={`flex items-center gap-3 p-3 rounded border cursor-pointer hover:bg-muted transition-colors ${answers[q.id] === opt.id ? 'bg-primary/5 border-primary' : ''}`}>
                    <input 
                      type="radio" 
                      name={q.id} 
                      value={opt.id} 
                      checked={answers[q.id] === opt.id}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                      className="w-4 h-4 text-primary"
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {q.question_type === 'short_answer' && (
              <div className="ml-6">
                <textarea 
                  rows={4} 
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="flex w-full rounded border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-6 flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting || Object.keys(answers).length !== questions.length} size="lg">
          {isSubmitting ? 'Grading...' : 'Submit Assessment'}
        </Button>
      </div>
    </div>
  );
}
