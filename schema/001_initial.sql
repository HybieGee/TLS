-- The Living Sketchbook - Initial Schema
-- All timestamps are ISO8601 strings in UTC

CREATE TABLE User (
  id TEXT PRIMARY KEY,
  kind TEXT CHECK(kind IN ('guest','passkey')) NOT NULL DEFAULT 'guest',
  alias TEXT,
  createdAt TEXT NOT NULL,
  banned INTEGER DEFAULT 0
);

CREATE TABLE Session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  lastSeenAt TEXT NOT NULL,
  ipHash TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES User(id)
);

CREATE TABLE Submission (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  imageUrl TEXT NOT NULL,
  vectorJson TEXT,
  createdAt TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending','approved','rejected')) NOT NULL DEFAULT 'pending',
  FOREIGN KEY(userId) REFERENCES User(id)
);

CREATE TABLE Vote (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  submissionId TEXT NOT NULL,
  periodKey TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  ipHash TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES User(id),
  FOREIGN KEY(submissionId) REFERENCES Submission(id),
  UNIQUE(userId, submissionId, periodKey)
);

CREATE TABLE Winner (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  periodKey TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  votesAtWin INTEGER NOT NULL,
  spawnX REAL,
  spawnY REAL,
  behavior TEXT CHECK(behavior IN ('walk','bounce','idle')) NOT NULL DEFAULT 'walk',
  FOREIGN KEY(submissionId) REFERENCES Submission(id)
);

CREATE TABLE Period (
  key TEXT PRIMARY KEY,
  startsAt TEXT NOT NULL,
  endsAt TEXT NOT NULL,
  resolvedAt TEXT,
  winnerSubmissionId TEXT,
  FOREIGN KEY(winnerSubmissionId) REFERENCES Submission(id)
);

CREATE TABLE PasskeyCredential (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  publicKey TEXT NOT NULL,
  credId TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES User(id),
  UNIQUE(credId)
);

CREATE TABLE ModerationLog (
  id TEXT PRIMARY KEY,
  submissionId TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  adminId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(submissionId) REFERENCES Submission(id),
  FOREIGN KEY(adminId) REFERENCES User(id)
);

-- Indexes for performance
CREATE INDEX idx_session_userId ON Session(userId);
CREATE INDEX idx_submission_userId ON Submission(userId);
CREATE INDEX idx_submission_status ON Submission(status);
CREATE INDEX idx_submission_createdAt ON Submission(createdAt);
CREATE INDEX idx_vote_userId ON Vote(userId);
CREATE INDEX idx_vote_submissionId ON Vote(submissionId);
CREATE INDEX idx_vote_periodKey ON Vote(periodKey);
CREATE INDEX idx_winner_periodKey ON Winner(periodKey);
CREATE INDEX idx_passkey_userId ON PasskeyCredential(userId);