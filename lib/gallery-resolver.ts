// Gallery position cycle - 6 positions that repeat
const GALLERY_POSITIONS = [
  'LeftArtWork',
  'LeftArtWork001', 
  'LeftArtWork002',
  'RightArtWork003',
  'RightArtWork004',
  'RightArtWork005'
];

export function getNextGalleryPosition(): string {
  const now = new Date();
  const hoursSinceEpoch = Math.floor(now.getTime() / (1000 * 60 * 60));
  const positionIndex = hoursSinceEpoch % GALLERY_POSITIONS.length;
  return GALLERY_POSITIONS[positionIndex];
}

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<D1Result>;
  first: () => Promise<Record<string, unknown> | null>;
}

interface D1Result {
  success: boolean;
  meta: Record<string, unknown>;
}

export async function resolvePeriodDirectly(DB: D1Database, periodKey: string): Promise<{success: boolean, error?: string, result?: any}> {
  try {
    console.log('🏆 Resolving period directly:', periodKey);

    // Find the winner (submission with most votes in this period)
    const winnerResult = await DB.prepare(`
      SELECT 
        s.id, s.name, s.description, s.imageUrl, s.userId,
        COUNT(v.id) as voteCount
      FROM Submission s
      LEFT JOIN Vote v ON s.id = v.submissionId AND v.periodKey = ?
      WHERE s.status = 'approved'
      GROUP BY s.id, s.name, s.description, s.imageUrl, s.userId
      ORDER BY COUNT(v.id) DESC, s.createdAt ASC
      LIMIT 1
    `).bind(periodKey).first();

    if (!winnerResult) {
      console.log('❌ No submissions found for period:', periodKey);
      return { success: false, error: 'No submissions found for this period' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const winner = winnerResult as any;
    console.log('🥇 Winner found:', winner.name, 'with', winner.voteCount, 'votes');

    // Get the next gallery position
    const nextPosition = getNextGalleryPosition();
    console.log('🖼️ Deploying to position:', nextPosition);

    // Check if there's currently an artwork at this position
    const currentArtwork = await DB.prepare(
      'SELECT submissionId, periodKey FROM GalleryPosition WHERE position = ?'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).bind(nextPosition).first() as any;

    // Archive the current artwork if it exists
    if (currentArtwork?.submissionId) {
      console.log('📦 Archiving current artwork at position:', nextPosition);
      
      // Get the vote count for the artwork being archived
      const currentVoteCount = await DB.prepare(
        'SELECT COUNT(*) as count FROM Vote WHERE submissionId = ? AND periodKey = ?'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).bind(currentArtwork.submissionId, currentArtwork.periodKey).first() as any;

      // Archive it
      await DB.prepare(`
        INSERT INTO ArchivedWinner 
        (id, submissionId, periodKey, position, wonAt, archivedAt, voteCount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        currentArtwork.submissionId,
        currentArtwork.periodKey,
        nextPosition,
        currentArtwork.periodKey, // wonAt is the period when it originally won
        new Date().toISOString(), // archivedAt is now
        currentVoteCount?.count || 0
      ).run();

      console.log('✅ Archived previous winner');
    }

    // Deploy the new winner to the gallery position
    await DB.prepare(`
      UPDATE GalleryPosition 
      SET submissionId = ?, periodKey = ?, deployedAt = ?
      WHERE position = ?
    `).bind(
      winner.id,
      periodKey,
      new Date().toISOString(),
      nextPosition
    ).run();

    // Mark the period as resolved
    await DB.prepare(
      'UPDATE Period SET resolvedAt = ?, winnerSubmissionId = ? WHERE key = ?'
    ).bind(new Date().toISOString(), winner.id, periodKey).run();

    console.log('🎉 Period resolved successfully');

    return {
      success: true,
      result: {
        period: periodKey,
        winner: {
          id: winner.id,
          name: winner.name,
          voteCount: winner.voteCount
        },
        deployedTo: nextPosition,
        resolvedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Period resolution error:', error);
    return { success: false, error: `Failed to resolve period: ${String(error)}` };
  }
}