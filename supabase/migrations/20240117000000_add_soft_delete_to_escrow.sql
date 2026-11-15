-- Add soft delete columns to escrow_sessions
ALTER TABLE escrow_sessions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES profiles(id) DEFAULT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_escrow_sessions_deleted_at ON escrow_sessions(deleted_at);

-- Comment
COMMENT ON COLUMN escrow_sessions.deleted_at IS 'Timestamp when escrow was soft-deleted (hidden from list but preserved for income calculation)';
COMMENT ON COLUMN escrow_sessions.deleted_by IS 'User ID who deleted the escrow (buyer or seller)';
