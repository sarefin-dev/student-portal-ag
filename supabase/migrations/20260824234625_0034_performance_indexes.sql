-- ============================================================================
-- 0034_performance_indexes.sql
-- Add missing foreign key indexes to heavily read assessment tables to prevent
-- sequential scans and improve read performance.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assessments_module_id ON assessments(module_id);
CREATE INDEX IF NOT EXISTS idx_assessments_lesson_id ON assessments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student_id ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_attempt_id ON question_responses(attempt_id);
