/**
 * One-time script to clean up duplicate revisions.
 * Removes consecutive revisions with identical content, keeping the first in each run.
 * Renumbers remaining revisions and updates coaching_passes references.
 *
 * Usage: npx tsx packages/backend/src/scripts/dedup-revisions.ts
 */
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'packages/backend/data/writting-buddy.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

interface RevisionRow {
  readonly id: string
  readonly submission_id: string
  readonly revision_number: number
  readonly content: string
}

interface SubmissionRow {
  readonly id: string
}

const submissions = db.prepare('SELECT id FROM submissions').all() as SubmissionRow[]

let totalDeleted = 0
let totalRenumbered = 0

const dedup = db.transaction(() => {
  for (const sub of submissions) {
    const revisions = db.prepare(
      'SELECT id, submission_id, revision_number, content FROM revisions WHERE submission_id = ? ORDER BY revision_number ASC'
    ).all(sub.id) as RevisionRow[]

    if (revisions.length <= 1) continue

    const toKeep: RevisionRow[] = []
    const toDelete: string[] = []

    for (const rev of revisions) {
      const prev = toKeep[toKeep.length - 1]
      if (prev && prev.content === rev.content) {
        toDelete.push(rev.id)
      } else {
        toKeep.push(rev)
      }
    }

    if (toDelete.length === 0) continue

    // Delete duplicates
    for (const id of toDelete) {
      db.prepare('DELETE FROM revisions WHERE id = ?').run(id)
    }
    totalDeleted += toDelete.length

    // Renumber remaining revisions
    for (let i = 0; i < toKeep.length; i++) {
      const newNumber = i + 1
      const rev = toKeep[i]!
      if (rev.revision_number !== newNumber) {
        // Update coaching passes that referenced the old number
        db.prepare(
          'UPDATE coaching_passes SET revision_number = ? WHERE submission_id = ? AND revision_number = ?'
        ).run(newNumber, sub.id, rev.revision_number)

        db.prepare(
          'UPDATE revisions SET revision_number = ? WHERE id = ?'
        ).run(newNumber, rev.id)
        totalRenumbered++
      }
    }

    // Update submission's current_revision
    db.prepare(
      'UPDATE submissions SET current_revision = ? WHERE id = ?'
    ).run(toKeep.length, sub.id)

    console.log(`Submission ${sub.id}: ${revisions.length} → ${toKeep.length} revisions (deleted ${toDelete.length})`)
  }
})

dedup()

console.log(`\nDone. Deleted ${totalDeleted} duplicate revisions, renumbered ${totalRenumbered}.`)

db.close()
