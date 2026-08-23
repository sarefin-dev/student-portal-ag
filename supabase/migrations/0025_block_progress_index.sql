-- Performance optimization for block_progress queries
-- The system frequently queries a student's completed blocks for UI progress checkmarks
CREATE INDEX IF NOT EXISTS idx_block_progress_student_status ON block_progress(student_id, status);
