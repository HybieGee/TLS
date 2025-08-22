-- Gallery positions table - tracks which artwork is displayed at each position
CREATE TABLE IF NOT EXISTS GalleryPosition (
  position TEXT PRIMARY KEY, -- 'LeftArtWork', 'LeftArtWork001', etc.
  submissionId TEXT,
  periodKey TEXT,
  deployedAt TEXT,
  FOREIGN KEY (submissionId) REFERENCES Submission(id)
);

-- Archived winners table - stores history of all winners
CREATE TABLE IF NOT EXISTS ArchivedWinner (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  periodKey TEXT NOT NULL,
  position TEXT NOT NULL,
  wonAt TEXT NOT NULL,
  archivedAt TEXT,
  voteCount INTEGER DEFAULT 0,
  FOREIGN KEY (submissionId) REFERENCES Submission(id)
);

-- Insert initial gallery positions
INSERT OR IGNORE INTO GalleryPosition (position, submissionId, periodKey, deployedAt) VALUES
  ('LeftArtWork', NULL, NULL, NULL),
  ('LeftArtWork001', NULL, NULL, NULL),
  ('LeftArtWork002', NULL, NULL, NULL),
  ('RightArtWork003', NULL, NULL, NULL),
  ('RightArtWork004', NULL, NULL, NULL),
  ('RightArtWork005', NULL, NULL, NULL);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gallery_position ON GalleryPosition(position);
CREATE INDEX IF NOT EXISTS idx_archived_winner_period ON ArchivedWinner(periodKey);
CREATE INDEX IF NOT EXISTS idx_archived_winner_position ON ArchivedWinner(position);