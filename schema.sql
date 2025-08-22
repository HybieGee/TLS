-- Users table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'guest',
  alias TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT
);

-- Sessions table
CREATE TABLE IF NOT EXISTS Session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  lastSeenAt TEXT NOT NULL,
  ipHash TEXT,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Submissions table
CREATE TABLE IF NOT EXISTS Submission (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  imageUrl TEXT NOT NULL,
  vectorJson TEXT,
  createdAt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Votes table
CREATE TABLE IF NOT EXISTS Vote (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  submissionId TEXT NOT NULL,
  periodKey TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (submissionId) REFERENCES Submission(id)
);

-- Period table
CREATE TABLE IF NOT EXISTS Period (
  key TEXT PRIMARY KEY,
  startsAt TEXT NOT NULL,
  endsAt TEXT NOT NULL,
  resolvedAt TEXT,
  winnerSubmissionId TEXT,
  FOREIGN KEY (winnerSubmissionId) REFERENCES Submission(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_status_created ON Submission(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_vote_period_user ON Vote(periodKey, userId);
CREATE INDEX IF NOT EXISTS idx_submission_created ON Submission(createdAt);
CREATE INDEX IF NOT EXISTS idx_vote_submission ON Vote(submissionId);